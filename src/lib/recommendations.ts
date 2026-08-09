/**
 * Destination-based module recommendations.
 *
 * WHY THIS EXISTS: with 34 modules, a missionary heading to a specific
 * field (e.g. "Central Asia, Muslim-majority, house churches") benefits
 * from seeing the handful of directly relevant modules surfaced first,
 * rather than scanning a flat alphanumeric list every time.
 *
 * DESIGN PRINCIPLE — this is a client-facing sort hint only, never an
 * AI instruction: fieldContext is free text a missionary enters once,
 * matched here with simple keyword scoring against each module's own
 * bilingual title (curriculumConfig.ts's MODULE_TITLES) and a small
 * synonym table below. It is never sent to the LLM as part of a system
 * prompt or otherwise used to steer agent behavior — it only decides
 * which modules the Sidebar lists under "Recommended for you". A missionary
 * whose context doesn't match any keyword still sees the full, unfiltered
 * module list — nothing is ever hidden, only reordered.
 */

import { MODULE_TITLES } from "./curriculumConfig";

// Small synonym expansions so common ways of describing a field context
// ("Muslim country", "Central Asia") reach the module whose bilingual
// title uses more formal/different wording ("Sharing the Gospel with
// Muslims"). Not exhaustive by design — keeping this list short and
// readable matters more than covering every possible phrasing, since the
// fallback (full module list, unfiltered) is always available.
const SYNONYMS: Record<string, string[]> = {
  muslim: ["islam", "islamic", "middle east", "central asia", "arab"],
  hindu: ["india", "hinduism"],
  buddhist: ["buddhism", "thailand", "myanmar", "southeast asia", "tibet"],
  catholic: ["roman catholic", "latin america", "philippines"],
  secular: ["atheist", "post-christian", "europe", "university", "academic"],
  animistic: ["animism", "folk religion", "spirits", "africa", "tribal", "indigenous"],
  patronage: ["patron", "client", "developing world", "global south"],
  chinese: ["china", "diaspora", "overseas chinese", "mandarin", "cantonese"],
  hospitality: ["welcome", "host", "guest"],
  leadership: ["leader", "team", "manage"],
  counseling: ["mental health", "trauma", "grief", "therapy"],
  church: ["planting", "congregation"],
};

export interface Recommendation {
  module: number;
  score: number;
}

function expand(word: string): string[] {
  const hits = [word];
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (word === key || syns.includes(word)) hits.push(key, ...syns);
  }
  return hits;
}

export function recommendModules(fieldContext: string, limit = 5): Recommendation[] {
  const words = fieldContext
    .toLowerCase()
    .split(/[^a-z\u4e00-\u9fff]+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return [];

  const expandedWords = new Set(words.flatMap(expand));

  const scores: Recommendation[] = Object.entries(MODULE_TITLES).map(([numStr, title]) => {
    const titleLower = title.toLowerCase();
    let score = 0;
    for (const w of expandedWords) {
      if (titleLower.includes(w)) score += 1;
    }
    return { module: Number(numStr), score };
  });

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
