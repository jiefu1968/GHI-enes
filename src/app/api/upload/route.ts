import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

// pdf-parse and mammoth touch the filesystem/Buffer directly — Node
// runtime only, same as every other route that reads real files.
export const runtime = "nodejs";

// OCR (image → text) is genuinely slow — several seconds is normal for
// a full-page photo on modest hardware. Documents parse much faster,
// but we use one generous ceiling for the whole route rather than two
// separate maxDuration values (Next.js only allows one per route).
export const maxDuration = 60;

// Keeps a single uploaded file's extracted text from ever dominating (or
// blowing out) the model's context window — matches the same spirit as
// rag.ts's maxChars caps on retrieved curriculum context. A missionary
// pasting in a 40-page policy document should get the first ~8,000
// characters usefully summarized/answered, not a silently truncated
// wall of text with no indication anything was cut.
const MAX_EXTRACTED_CHARS = 8000;

const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
]);
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — generous for a scanned document, small enough to stay fast

function truncate(text: string): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_EXTRACTED_CHARS) return { text: trimmed, truncated: false };
  return { text: trimmed.slice(0, MAX_EXTRACTED_CHARS), truncated: true };
}

async function extractPdf(buf: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  // Strips pdf-parse's own "-- N of M --" page-separator markers — noise
  // for the model, not part of the document's actual content.
  return (result.text ?? "").replace(/--\s*\d+\s*of\s*\d+\s*--/g, "");
}

async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value ?? "";
}

async function extractImage(buf: Buffer): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(buf, "eng+spa", {
    // Silences tesseract's own per-tile progress logging — this route
    // already has its own request-scoped logger.info below.
    logger: () => {},
  });
  return data.text ?? "";
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large (max 15MB)." }, { status: 400 });
  }

  const isDoc = ALLOWED_DOC_TYPES.has(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  if (!isDoc && !isImage) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a PDF, Word document, plain text file, or image (PNG/JPEG/WebP)." },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    let raw: string;
    let kind: "pdf" | "docx" | "txt" | "image";

    if (file.type === "application/pdf") {
      raw = await extractPdf(buf);
      kind = "pdf";
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      raw = await extractDocx(buf);
      kind = "docx";
    } else if (file.type === "text/plain") {
      raw = buf.toString("utf-8");
      kind = "txt";
    } else {
      // Image path — OCR only. The underlying chat model (gpt-oss-120b)
      // is text-only and cannot see image content directly (no vision
      // support on this provider) — so this extracts whatever printed
      // or handwritten text is VISIBLE in the image, the same way a
      // scanner would. It cannot describe photos, charts, or diagrams.
      raw = await extractImage(buf);
      kind = "image";
    }

    const { text, truncated } = truncate(raw);

    if (!text) {
      return NextResponse.json(
        {
          error:
            kind === "image"
              ? "No readable text was found in that image. This reads printed/handwritten text only — it can't describe photos, charts, or diagrams."
              : "No text could be extracted from that file — it may be empty, image-only (a scanned PDF with no text layer), or corrupted.",
        },
        { status: 422 }
      );
    }

    logger.info("File uploaded and text extracted", {
      missionaryId: session.missionaryId,
      kind,
      fileName: file.name,
      extractedChars: text.length,
      truncated,
    });

    return NextResponse.json({ text, truncated, kind });
  } catch (e) {
    logger.error("File text extraction failed", { fileName: file.name, type: file.type, error: String(e) });
    return NextResponse.json(
      { error: "Could not read that file. It may be corrupted, password-protected, or in an unsupported format." },
      { status: 422 }
    );
  }
}
