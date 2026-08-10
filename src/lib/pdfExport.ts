"use client";

// Client-side PDF export for Chat, Quiz, Case Study, and the Diagnostic
// Assessment — uses jsPDF directly in the browser (no server round-trip,
// no headless-browser dependency in the production Docker image).
//
// IMPORTANT: jsPDF's built-in standard fonts (Helvetica/Times/Courier)
// only support the WinAnsi/Latin-1 character subset — English and
// Spanish accented letters (á, é, í, ñ...) render fine, but emoji
// (📖 📄 🎯 ✅) and most dingbat/symbol characters (✓ ✗ ⚠️) do NOT — they
// silently render as garbled bytes instead of failing loudly. Every
// piece of text in this file — both our own template strings and text
// pulled from AI-generated content (which sometimes includes emoji) —
// goes through sanitizeForPdf() before being handed to jsPDF.

import jsPDF from "jspdf";
import type { ChatMessage } from "./types";
import type { QuizResult, QuizQuestion } from "./quiz";
import type { CaseStudyResult } from "./caseStudies";
import type { GenLangMode } from "./language";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const GOLD = [184, 134, 47] as const; // matches --harvest-goldDeep
const DIM = [110, 100, 85] as const;
const DARK = [30, 25, 18] as const;
const GREEN = [90, 130, 70] as const;
const RED = [170, 70, 60] as const;

// Strips markdown tokens AND any character outside jsPDF's supported
// WinAnsi range (emoji, dingbats, arrows, variation selectors) — keeps
// accented Latin letters, em/en dashes, curly quotes, and normal
// punctuation intact, since those DO render correctly.
// Converts common LaTeX math notation to plain readable text before
// PDF export. The chat UI renders LaTeX fine (it's shown as styled math
// on screen), but jsPDF has no LaTeX engine — without this, formulas
// like "\\[ P \\lor \\not P \\]" showed up as raw LaTeX commands in the
// PDF instead of readable text. Covers the operators/spacing commands
// that actually show up in this app's theological-logic responses;
// intentionally simple (regex, not a real LaTeX parser) since full
// LaTeX rendering in a PDF text layer isn't worth the complexity here.
function delatex(text: string): string {
  return text
    .replace(/\\\[|\\\]/g, "") // \[ ... \] display-math delimiters
    .replace(/\\\(|\\\)/g, "") // \( ... \) inline-math delimiters
    .replace(/\\lor/g, "or")
    .replace(/\\land/g, "and")
    .replace(/\\neg|\\not/g, "not ")
    .replace(/\\forall/g, "for all")
    .replace(/\\exists/g, "there exists")
    .replace(/\\implies|\\rightarrow|\\to/g, "implies")
    .replace(/\\iff|\\leftrightarrow/g, "if and only if")
    .replace(/\\in/g, "in")
    .replace(/\\neq/g, "not equal to")
    .replace(/\\[,;: ]/g, " ") // \;  \,  \:  spacing commands
    .replace(/\\text\{([^}]*)\}/g, "$1");
}

// jsPDF's standard fonts only cover the WinAnsi/Latin-1 character set.
// When a string contains even ONE character outside that set — like the
// "typographically correct" non-breaking hyphen (U+2011) or non-breaking
// space (U+00A0) the model sometimes writes in Bible references (e.g.
// "3:16\u201117") — jsPDF silently switches that string to a different
// internal encoding to represent it, which corrupts EVERY character
// around it into garbled bytes (this is what showed up as stray "/"
// characters and mid-word spacing breaks in exported PDFs — confirmed
// by inspecting the raw PDF content stream byte-by-byte). The fix is to
// normalize these "smart" typography characters to their plain ASCII
// equivalents BEFORE the string ever reaches jsPDF, so the whole line
// stays in the single encoding the font actually supports.
function normalizeSpecialChars(text: string): string {
  return text
    .replace(/[\u2010-\u2015]/g, "-") // hyphen, non-breaking hyphen, figure/en/em dash, horizontal bar
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F]/g, " "); // non-breaking space and other Unicode spaces
  // Curly quotes (\u2018 \u2019 \u201C \u201D) are deliberately left
  // as-is — they ARE part of the WinAnsi charset the font supports and
  // already render correctly, confirmed against a real exported PDF.
}

function sanitizeForPdf(text: string): string {
  if (!text) return "";
  return normalizeSpecialChars(delatex(text))
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[-•]\s+/gm, "• ")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "") // emoji (all supplementary-plane blocks)
    .replace(/[\u{2600}-\u{27BF}]/gu, "") // misc symbols & dingbats (✓ ✗ ✅ ⚠ ☀ etc.)
    .replace(/[\u{2190}-\u{21FF}]/gu, "") // arrows
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "") // variation selectors (the invisible part of "⚠️")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface Cursor {
  doc: jsPDF;
  y: number;
}

function newDoc(title: string): Cursor {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text("GLOBAL HARVEST INITIATIVE", MARGIN, 15);

  // Titles can be long (a full bilingual module name) — wrap instead of
  // truncating silently off the page edge.
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  const titleLines: string[] = doc.splitTextToSize(sanitizeForPdf(title), CONTENT_WIDTH);
  let y = 24;
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 6.5;
  }

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return { doc, y: y + 8 };
}

function ensureSpace(c: Cursor, needed: number) {
  if (c.y + needed > 285) {
    c.doc.addPage();
    c.y = 18;
  }
}

// For short, single-purpose section labels (e.g. "Contexto", "Você").
// Do NOT use this for anything that could be long/variable-length (quiz
// questions, message content) — it does not wrap. Use paragraph() with
// bold+color options for that instead (see wrappedHeading below).
function heading(c: Cursor, text: string) {
  ensureSpace(c, 10);
  c.doc.setFont("helvetica", "bold");
  c.doc.setFontSize(11.5);
  c.doc.setTextColor(...GOLD);
  c.doc.text(sanitizeForPdf(text), MARGIN, c.y);
  c.y += 6;
}

// Same visual style as heading() but wraps — for anything whose length
// isn't guaranteed short (quiz questions, case study titles inline).
function wrappedHeading(c: Cursor, text: string) {
  const clean = sanitizeForPdf(text);
  if (!clean) return;
  c.doc.setFont("helvetica", "bold");
  c.doc.setFontSize(11);
  c.doc.setTextColor(...GOLD);
  const lines: string[] = c.doc.splitTextToSize(clean, CONTENT_WIDTH);
  for (const line of lines) {
    ensureSpace(c, 6);
    c.doc.text(line, MARGIN, c.y);
    c.y += 5.2;
  }
  c.y += 2;
}

function paragraph(c: Cursor, text: string, opts: { size?: number; color?: readonly [number, number, number]; bold?: boolean; gap?: number } = {}) {
  const clean = sanitizeForPdf(text);
  if (!clean) return;
  const size = opts.size ?? 10;
  const color = opts.color ?? DARK;
  c.doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  c.doc.setFontSize(size);
  c.doc.setTextColor(...color);
  const lines: string[] = c.doc.splitTextToSize(clean, CONTENT_WIDTH);
  for (const line of lines) {
    ensureSpace(c, 6);
    c.doc.text(line, MARGIN, c.y);
    c.y += size * 0.45;
  }
  c.y += opts.gap ?? 3;
}

function divider(c: Cursor) {
  ensureSpace(c, 6);
  c.doc.setDrawColor(225, 218, 200);
  c.doc.setLineWidth(0.2);
  c.doc.line(MARGIN, c.y, PAGE_WIDTH - MARGIN, c.y);
  c.y += 5;
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DIM);
    doc.text("Global Harvest Initiative", MARGIN, 292);
    doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - MARGIN, 292, { align: "right" });
  }
}

// ── Chat ──
export function exportChatToPdf(messages: ChatMessage[], agentName?: string) {
  const c = newDoc("Conversation · Conversación");
  paragraph(c, `Exported on · Exportado el ${new Date().toLocaleDateString()}${agentName ? ` — ${agentName}` : ""}`, {
    size: 8.5, color: DIM, gap: 6,
  });
  for (const m of messages) {
    heading(c, m.role === "user" ? "You · Tú" : "Assistant · Asistente");
    paragraph(c, m.content);
    divider(c);
  }
  footer(c.doc);
  c.doc.save("conversa-global-harvest.pdf");
}

// ── Quiz ──
function quizLetterText(q: QuizQuestion, letter: string, lang: GenLangMode): string {
  const key = (lang === "all" || lang === "pt" ? letter : `${letter}_${lang}`) as keyof QuizQuestion;
  return (q[key] as unknown as string) ?? "";
}

export function exportQuizToPdf(
  result: QuizResult,
  lang: GenLangMode,
  answers: Record<number, string>
) {
  const c = newDoc(result.module_title ?? "Quiz · Prueba");
  const questions = result.questions ?? [];
  paragraph(c, `Exported on · Exportado el ${new Date().toLocaleDateString()} — ${questions.length} questions · preguntas`, {
    size: 8.5, color: DIM, gap: 6,
  });

  questions.forEach((q, i) => {
    const qTextPt = lang === "all" ? q.q_pt ?? "" : quizLetterText(q, "q", lang) || q.q_pt || "";
    wrappedHeading(c, `${i + 1}. ${qTextPt}`);
    if (lang === "all" && q.q_es) paragraph(c, q.q_es, { size: 9.5, color: DIM, gap: 2 });

    for (const letter of ["a", "b", "c", "d", "e"]) {
      const textPt = quizLetterText(q, letter, lang);
      if (!textPt) continue;
      const isCorrect = q.correct === letter;
      const isChosen = answers[q.n] === letter;
      const prefix = `${letter.toUpperCase()}) `;
      // No checkmark/X glyphs (see sanitizeForPdf comment) — plain
      // bilingual text markers instead, which render reliably.
      const suffix = isCorrect
        ? "  (correct · correcta)"
        : isChosen
          ? "  (your answer · tu respuesta)"
          : "";
      paragraph(c, prefix + textPt + suffix, {
        size: 9.5,
        color: isCorrect ? GREEN : isChosen ? RED : DARK,
        gap: 1,
      });
    }

    const explKey = lang === "all" ? "why_correct_pt" : `why_correct_${lang}`;
    const expl = (q as any)[explKey];
    if (expl) {
      paragraph(c, expl, { size: 8.5, color: DIM, gap: 1 });
    }

    c.y += 2;
    divider(c);
  });

  footer(c.doc);
  c.doc.save("teste-global-harvest.pdf");
}

// ── Case Study ──
function caseField(theCase: any, base: string, lang: GenLangMode): string {
  const key = lang === "all" || lang === "pt" ? `${base}_pt` : `${base}_${lang}`;
  return theCase[key] ?? "";
}
function caseListField(theCase: any, base: string, lang: GenLangMode): string[] {
  const key = lang === "all" || lang === "pt" ? `${base}_pt` : `${base}_${lang}`;
  return theCase[key] ?? [];
}

export function exportCaseStudyToPdf(result: CaseStudyResult, lang: GenLangMode) {
  const theCase = result.cases?.[0];
  if (!theCase) return;
  const title = caseField(theCase, "title", lang) || result.module_title || "Estudo de Caso";
  const c = newDoc(title);
  paragraph(c, `Exported on · Exportado el ${new Date().toLocaleDateString()}`, { size: 8.5, color: DIM, gap: 6 });

  const sections: [string, string][] = [
    ["Context · Contexto", "context"],
    ["Challenge · Desafío", "challenge"],
    ["Recommended Approach · Enfoque Recomendado", "recommended_approach"],
    ["Scripture Anchor · Base Bíblica", "scripture_anchor"],
    ["Lesson · Lección", "lesson"],
  ];
  for (const [label, key] of sections) {
    const text = caseField(theCase, key, lang);
    if (!text) continue;
    heading(c, label);
    paragraph(c, text);
  }

  const principles = caseListField(theCase, "principles", lang);
  if (principles.length) {
    heading(c, "Principles · Principios");
    paragraph(c, principles.map((p) => `• ${p}`).join("\n"));
  }

  const questions = caseListField(theCase, "discussion_questions", lang);
  if (questions.length) {
    heading(c, "Discussion Questions · Preguntas de Discusión");
    paragraph(c, questions.map((q, i) => `${i + 1}. ${q}`).join("\n"));
  }

  footer(c.doc);
  c.doc.save("estudo-de-caso-global-harvest.pdf");
}

// ── Diagnostic Assessment ──
interface AssessmentResultForPdf {
  foundationsScore: number;
  formationScore: number;
  interculturalScore: number;
  strategyScore: number;
  evangelismScore: number;
  totalScore: number;
  completedAt: string;
}

const ASSESSMENT_AREA_LABELS_PT_ES: [string, keyof AssessmentResultForPdf, number][] = [
  ["Biblical & Theological Foundations · Fundamentos Bíblicos y Teológicos", "foundationsScore", 20],
  ["Personal Formation & Missionary Care · Formación Personal y Cuidado Misionero", "formationScore", 20],
  ["Intercultural Intelligence & Communication · Inteligencia y Comunicación Intercultural", "interculturalScore", 20],
  ["Mission Strategy & Contextualization · Estrategia Misionera y Contextualización", "strategyScore", 20],
  ["Evangelism by Religious & Cultural Context · Evangelismo por Contexto Religioso y Cultural", "evangelismScore", 20],
];

export function exportAssessmentToPdf(result: AssessmentResultForPdf) {
  const c = newDoc("Initial Assessment · Evaluación Inicial");
  paragraph(c, `Concluída em · Completada el ${new Date(result.completedAt).toLocaleDateString()}`, {
    size: 8.5, color: DIM, gap: 4,
  });

  heading(c, `Total Score · Puntuación total: ${result.totalScore} / 100`);
  c.y += 2;

  for (const [label, key, max] of ASSESSMENT_AREA_LABELS_PT_ES) {
    const score = result[key] as number;
    const pct = score / max;
    paragraph(c, `${label}:  ${score} / ${max}`, {
      size: 10,
      color: pct >= 0.6 ? GREEN : RED,
      bold: true,
      gap: 4,
    });
  }

  footer(c.doc);
  c.doc.save("avaliacao-inicial-global-harvest.pdf");
}
