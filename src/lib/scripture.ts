/**
 * Scripture citation verification against a real, public-domain Bible
 * text API (bible-api.com — no key required).
 *
 * WHY THIS EXISTS: QA testing (see PROGRESS.md, "QA session #2/#3")
 * found that even with a dedicated guardrail instruction, the LLM
 * still sometimes fabricates verse text or attaches a real-sounding
 * but wrong reference to a quote. Prompt engineering alone did not
 * reliably fix this. This module provides an independent, factual
 * check: whenever a response mentions a recognizable Bible reference,
 * fetch the REAL verse text (Portuguese Almeida translation) and append
 * it as a clearly labeled, verified block — so the missionary always
 * has ground truth available next to whatever the model said. A free,
 * public-domain Spanish translation is not available from this API,
 * and this build shows no English anywhere — so only Portuguese is
 * verified — see BILINGUAL_RULE in guardrails.ts for how the Spanish
 * section is handled instead (paraphrase, not quotation).
 *
 * This does NOT stop the model from writing an inaccurate quote
 * inline. It gives the reader an independently fetched reference
 * point to compare against, which is the most reliable mitigation
 * available without rebuilding the whole generation pipeline around
 * structured, non-quoting Scripture output.
 */

const BIBLE_API_BASE = "https://bible-api.com";

// Canonical 3/4-letter book codes bible-api.com expects, mapped from
// every English, Portuguese, and (Traditional) Chinese name/abbreviation
// commonly seen in this project's agent output. Extend as needed —
// this covers the books that actually show up in the 22 modules' own
// Scripture citations plus the standard 66-book set.
const BOOK_ALIASES: Record<string, string> = {
  // Old Testament
  genesis: "GEN", gênesis: "GEN", genesis1: "GEN", "创世记": "GEN", "創世紀": "GEN", "创世纪": "GEN",
  exodus: "EXO", êxodo: "EXO", exodo: "EXO", "出埃及记": "EXO", "出埃及記": "EXO",
  leviticus: "LEV", levítico: "LEV", levitico: "LEV", "利未记": "LEV", "利未記": "LEV",
  numbers: "NUM", números: "NUM", numeros: "NUM", "民数记": "NUM", "民數記": "NUM",
  deuteronomy: "DEU", deuteronômio: "DEU", deuteronomio: "DEU", "申命记": "DEU", "申命記": "DEU",
  joshua: "JOS", josué: "JOS", josue: "JOS", "约书亚记": "JOS", "約書亞記": "JOS",
  judges: "JDG", juízes: "JDG", juizes: "JDG", "士师记": "JDG", "士師記": "JDG",
  ruth: "RUT", rute: "RUT", "路得记": "RUT", "路得記": "RUT",
  "1samuel": "1SA", "1 samuel": "1SA", "1samuel1": "1SA", "撒母耳记上": "1SA", "撒母耳記上": "1SA",
  "2samuel": "2SA", "2 samuel": "2SA", "撒母耳记下": "2SA", "撒母耳記下": "2SA",
  "1kings": "1KI", "1 reis": "1KI", "列王纪上": "1KI", "列王紀上": "1KI",
  "2kings": "2KI", "2 reis": "2KI", "列王纪下": "2KI", "列王紀下": "2KI",
  "1chronicles": "1CH", "1 crônicas": "1CH", "历代志上": "1CH", "歷代志上": "1CH",
  "2chronicles": "2CH", "2 crônicas": "2CH", "历代志下": "2CH", "歷代志下": "2CH",
  ezra: "EZR", esdras: "EZR", "以斯拉记": "EZR", "以斯拉記": "EZR",
  nehemiah: "NEH", neemias: "NEH", "尼希米记": "NEH", "尼希米記": "NEH",
  esther: "EST", ester: "EST", "以斯帖记": "EST", "以斯帖記": "EST",
  job: "JOB", jó: "JOB", "约伯记": "JOB", "約伯記": "JOB",
  psalms: "PSA", psalm: "PSA", salmos: "PSA", salmo: "PSA", "诗篇": "PSA", "詩篇": "PSA",
  proverbs: "PRO", provérbios: "PRO", proverbios: "PRO", "箴言": "PRO",
  ecclesiastes: "ECC", eclesiastes: "ECC", "传道书": "ECC", "傳道書": "ECC",
  "song of solomon": "SNG", "cânticos": "SNG", "canticos": "SNG", "雅歌": "SNG",
  isaiah: "ISA", isaías: "ISA", isaias: "ISA", "以赛亚书": "ISA", "以賽亞書": "ISA",
  jeremiah: "JER", jeremias: "JER", "耶利米书": "JER", "耶利米書": "JER",
  lamentations: "LAM", "耶利米哀歌": "LAM",
  ezekiel: "EZK", ezequiel: "EZK", "以西结书": "EZK", "以西結書": "EZK",
  daniel: "DAN", "但以理书": "DAN", "但以理書": "DAN",
  hosea: "HOS", oséias: "HOS", oseias: "HOS", "何西阿书": "HOS", "何西阿書": "HOS",
  joel: "JOL", "约珥书": "JOL", "約珥書": "JOL",
  amos: "AMO", amós: "AMO", "阿摩司书": "AMO", "阿摩司書": "AMO",
  obadiah: "OBA", obadias: "OBA", "俄巴底亚书": "OBA", "俄巴底亞書": "OBA",
  jonah: "JON", jonas: "JON", "约拿书": "JON", "約拿書": "JON",
  micah: "MIC", miquéias: "MIC", miqueias: "MIC", "弥迦书": "MIC", "彌迦書": "MIC",
  nahum: "NAM", naum: "NAM", "那鸿书": "NAM", "那鴻書": "NAM",
  habakkuk: "HAB", habacuque: "HAB", "哈巴谷书": "HAB", "哈巴谷書": "HAB",
  zephaniah: "ZEP", sofonias: "ZEP", "西番雅书": "ZEP", "西番雅書": "ZEP",
  haggai: "HAG", ageu: "HAG", "哈该书": "HAG", "哈該書": "HAG",
  zechariah: "ZEC", zacarias: "ZEC", "撒迦利亚书": "ZEC", "撒迦利亞書": "ZEC",
  malachi: "MAL", malaquias: "MAL", "玛拉基书": "MAL", "瑪拉基書": "MAL",
  // New Testament
  matthew: "MAT", mateus: "MAT", "马太福音": "MAT", "馬太福音": "MAT",
  mark: "MRK", marcos: "MRK", "马可福音": "MRK", "馬可福音": "MRK",
  luke: "LUK", lucas: "LUK", "路加福音": "LUK",
  john: "JHN", "约翰福音": "JHN", "約翰福音": "JHN", "若望福音": "JHN",
  acts: "ACT", atos: "ACT", "使徒行传": "ACT", "使徒行傳": "ACT",
  romans: "ROM", romanos: "ROM", "罗马书": "ROM", "羅馬書": "ROM",
  "1corinthians": "1CO", "1 coríntios": "1CO", "1 corintios": "1CO", "哥林多前书": "1CO", "哥林多前書": "1CO",
  "2corinthians": "2CO", "2 coríntios": "2CO", "2 corintios": "2CO", "哥林多后书": "2CO", "哥林多後書": "2CO",
  galatians: "GAL", gálatas: "GAL", galatas: "GAL", "加拉太书": "GAL", "加拉太書": "GAL",
  ephesians: "EPH", efésios: "EPH", efesios: "EPH", "以弗所书": "EPH", "以弗所書": "EPH",
  philippians: "PHP", filipenses: "PHP", "腓立比书": "PHP", "腓立比書": "PHP",
  colossians: "COL", colossenses: "COL", "歌罗西书": "COL", "歌羅西書": "COL",
  "1thessalonians": "1TH", "1 tessalonicenses": "1TH", "帖撒罗尼迦前书": "1TH", "帖撒羅尼迦前書": "1TH",
  "2thessalonians": "2TH", "2 tessalonicenses": "2TH", "帖撒罗尼迦后书": "2TH", "帖撒羅尼迦後書": "2TH",
  "1timothy": "1TI", "1 timóteo": "1TI", "1 timoteo": "1TI", "提摩太前书": "1TI", "提摩太前書": "1TI",
  "2timothy": "2TI", "2 timóteo": "2TI", "2 timoteo": "2TI", "提摩太后书": "2TI", "提摩太後書": "2TI",
  titus: "TIT", tito: "TIT", "提多书": "TIT", "提多書": "TIT",
  philemon: "PHM", filemom: "PHM", "腓利门书": "PHM", "腓利門書": "PHM",
  hebrews: "HEB", hebreus: "HEB", "希伯来书": "HEB", "希伯來書": "HEB",
  james: "JAS", tiago: "JAS", "雅各书": "JAS", "雅各書": "JAS",
  "1peter": "1PE", "1 pedro": "1PE", "彼得前书": "1PE", "彼得前書": "1PE",
  "2peter": "2PE", "2 pedro": "2PE", "彼得后书": "2PE", "彼得後書": "2PE",
  "1john": "1JN", "约翰一书": "1JN", "約翰一書": "1JN",
  "2john": "2JN", "约翰二书": "2JN", "約翰二書": "2JN",
  "3john": "3JN", "约翰三书": "3JN", "約翰三書": "3JN",
  jude: "JUD", judas: "JUD", "犹大书": "JUD", "猶大書": "JUD",
  revelation: "REV", apocalipse: "REV", "启示录": "REV", "啟示錄": "REV",
};

export interface ScriptureRef {
  raw: string; // the exact substring matched, for de-duplication
  bookKey: string; // normalized alias key
  bookCode: string; // bible-api.com 3-letter code
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
}

// Built FROM the alias table itself (longest names first, so e.g.
// "1 Corinthians" matches before a hypothetical bare "Corinthians"
// would) rather than a generic "any word(s)" pattern. This is the
// robust fix for an earlier version that greedily grabbed whatever
// word preceded the real book name (e.g. matching "diz Romanos"
// instead of "Romanos" out of "...diz Romanos 8:28..."), which then
// failed the alias lookup and silently dropped the whole reference.
const BOOK_NAMES_SORTED = Object.keys(BOOK_ALIASES).sort((a, b) => b.length - a.length);
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const BOOK_NAME_ALTERNATION = BOOK_NAMES_SORTED.map(escapeRegex).join("|");
const REF_PATTERN = new RegExp(`(${BOOK_NAME_ALTERNATION})\\s?(\\d{1,3}):(\\d{1,3})(?:-(\\d{1,3}))?`, "gi");

function lookupBookCode(bookRaw: string): string | undefined {
  const lower = bookRaw.trim().toLowerCase();
  const noSpace = lower.replace(/\s+/g, "");
  // Try, in order: exact lowercase (handles "1 coríntios" stored WITH a
  // space), then space-stripped (handles "1corinthians" stored WITHOUT
  // one), then the raw original string (covers Chinese, which has no
  // case/space concept to normalize in the first place).
  return BOOK_ALIASES[lower] ?? BOOK_ALIASES[noSpace] ?? BOOK_ALIASES[bookRaw];
}

export function extractReferences(text: string, max = 4): ScriptureRef[] {
  const found: ScriptureRef[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(REF_PATTERN);
  while ((m = re.exec(text)) && found.length < max) {
    const [raw, bookRaw, chapterRaw, vStartRaw, vEndRaw] = m;
    if (!bookRaw || !chapterRaw || !vStartRaw) continue;
    const code = lookupBookCode(bookRaw);
    if (!code) continue;
    const dedupeKey = `${code}-${chapterRaw}-${vStartRaw}-${vEndRaw ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    found.push({
      raw,
      bookKey: bookRaw.trim().toLowerCase(),
      bookCode: code,
      chapter: parseInt(chapterRaw, 10),
      verseStart: parseInt(vStartRaw, 10),
      verseEnd: vEndRaw ? parseInt(vEndRaw, 10) : null,
    });
  }
  return found;
}

async function fetchVerse(ref: ScriptureRef, translation?: string): Promise<string | null> {
  const range = ref.verseEnd ? `${ref.verseStart}-${ref.verseEnd}` : `${ref.verseStart}`;
  const url = `${BIBLE_API_BASE}/${ref.bookCode}+${ref.chapter}:${range}${translation ? `?translation=${translation}` : ""}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { text?: string; error?: string };
    if (!data.text) return null;
    return data.text.replace(/\s+/g, " ").trim();
  } catch {
    return null; // network hiccup or timeout — verification is best-effort, never blocks the chat response
  }
}

/**
 * Heuristic: did the user's message explicitly ask for a Bible verse or
 * Scripture reference? Used to gate buildVerificationBlock so the
 * "verified Scripture" footer only appears when actually requested,
 * instead of on every response where the model happened to cite a verse
 * unprompted. NOTE: this trades away automatic fact-checking of
 * spontaneous citations — see this module's header comment for why that
 * check existed. Enable at the call site's discretion.
 */
const VERSE_REQUEST_KEYWORDS = [
  // English
  "verse", "scripture", "bible says", "what does the bible", "quote", "cite a", "citation",
  // Spanish
  "versículo", "escritura", "biblia dice", "cita", "citación",
];

export function userRequestedVerse(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return VERSE_REQUEST_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Given a model's raw response text, find any recognizable Scripture
 * references and return a formatted, clearly-labeled block with the
 * REAL verse text fetched live from bible-api.com (Portuguese Almeida,
 * public domain). A free, public-domain Spanish translation is not
 * available from this API, and this build shows no English anywhere —
 * so only the Portuguese verification is displayed; Spanish Scripture
 * wording in the model's own response stays a paraphrase, never a
 * quotation, per BILINGUAL_RULE in guardrails.ts. Returns "" if no
 * references were found or none could be verified (e.g. API
 * unreachable) — callers should treat that as "nothing to append," not
 * an error.
 */
export async function buildVerificationBlock(responseText: string): Promise<string> {
  const refs = extractReferences(responseText);
  if (refs.length === 0) return "";

  const lines: string[] = [];
  for (const ref of refs) {
    const range = ref.verseEnd ? `${ref.verseStart}-${ref.verseEnd}` : `${ref.verseStart}`;
    const pt = await fetchVerse(ref, "almeida");
    if (!pt) continue; // unrecognized reference or API miss — skip silently
    const label = `${ref.bookCode} ${ref.chapter}:${range}`;
    lines.push(`**${label}**`);
    lines.push(`PT (Almeida): "${pt}"`);
    lines.push("");
  }
  if (lines.length === 0) return "";

  return (
    "\n\n---\n📖 **Escritura verificada (buscada em tempo real, domínio público — use para conferência) " +
    "· Escritura verificada (obtenida en tiempo real, dominio público — úsela para verificación)**\n\n" +
    lines.join("\n")
  );
}
