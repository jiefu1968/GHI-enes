# Global Harvest Initiative — Content Progress Tracker

Last updated: 2026-07-18. **All 34 modules complete** (content +
systemPrompt + fallback + seeds). This section is the authoritative,
current-state summary — read this first. Everything below the
"Still pending" section is a historical QA session log kept for
project history; it predates the 2026-07-17 module resequencing and
uses an **old, superseded module numbering** (see note before the
log).

This file exists so work can resume in a fresh chat without losing
context. If you're picking this project back up in a new conversation:
upload the project zip and point Claude at this file — it has
everything needed to reconstruct the current state.

## How to resume in a new chat

1. Upload the current project zip (and/or
   `contexto_projeto_global_harvest.md` if working outside this repo).
2. Say something like: "Continuing the Global Harvest Initiative
   Next.js project. See PROGRESS.md at the project root for current
   status." Claude can then read this file directly and pick up
   exactly where things left off.
3. When uploading new source documents for a module, say which module
   **number** it's for using the **current** numbering below (or the
   English title) — not a number remembered from an older session,
   since modules have been renumbered twice as the curriculum grew.
4. `src/lib/curriculumConfig.ts` (`MODULE_TITLES`, `MODULE_FOLDERS`,
   `MODULE_FALLBACK`) is the single source of truth for module numbers
   and titles. If this file and the code ever disagree, the code wins.

## Project summary

Next.js 14 + TypeScript + Tailwind + Postgres/Prisma multi-agent AI
training system for Chinese Christian missionaries ("Global Harvest
Initiative"). 34 module-specialist agents + 1 coordinator (LLM
supervisor/router) + 1 reflection/critic agent, streaming chat via
Groq (Cerebras optional third-tier fallback), BM25 keyword RAG over
markdown curriculum files bundled in `content/books/<module>/`.

## Module status — 34 modules, all complete

Numbering current as of the 2026-07-17 resequencing (four new modules
— Sharing the Gospel with Catholics/in Secular Cultures/in Animistic
Culture/in Patronage Culture — were inserted and everything after them
shifted). File counts below exclude each folder's `README.md`.

| # | Module | Folder | .md files |
|---|---|---|---|
| 1 | Biblical Hospitality \| 圣经中的款待 | `01_biblical_hospitality` | 5 |
| 2 | Essential Teachings of the Christian Faith | `02_key_biblical_doctrines` | 4 |
| 3 | Biblical Panorama | `03_biblical_panorama` | 8 |
| 4 | Christian Theology | `04_christian_theology` | 2 |
| 5 | Biblical Hermeneutics | `05_biblical_hermeneutics` | 5 |
| 6 | Spiritual Life & Character | `06_spiritual_life` | 3 |
| 7 | Caring for Self & Others | `07_caring_self_others` | 2 |
| 8 | Emotional Intelligence | `08_emotional_intelligence` | 10 |
| 9 | Theology of Missions | `09_theology_of_missions` | 5 |
| 10 | Biblical Storytelling | `10_two_stories` | 2 |
| 11 | Ministering Cross-Culturally | `11_ministering_cross_culturally` | 4 |
| 12 | Intercultural Communication | `12_intercultural_communication` | 8 |
| 13 | Intercultural Intelligence | `13_intercultural_intelligence` | 6 |
| 14 | Misreading the Scripture | `14_intercultural_bible` | 3 |
| 15 | Intercultural Discipleship | `15_intercultural_discipleship` | 4 |
| 16 | Intercultural Leadership | `16_intercultural_leadership` | 2 |
| 17 | Intercultural Counseling | `17_intercultural_counseling` | 6 |
| 18 | Teaching in Other Cultures | `18_teaching_other_cultures` | 4 |
| 19 | Mission Anthropology | `19_mission_anthropology` | 4 |
| 20 | Phenomenology of Religion | `20_phenomenology_religion` | 4 |
| 21 | Major World Religions | `21_world_religions` | 7 |
| 22 | Contextualization of the Gospel | `22_contextualization` | 8 |
| 23 | Majority World Theology | `23_majority_world_theo` | 14 |
| 24 | Major Mission Strategies | `24_mission_strategies` | 2 |
| 25 | Intercultural Church Planting | `25_church_planting` | 6 |
| 26 | Sharing the Gospel with Chinese | `26_sharing_chinese` | 3 |
| 27 | Sharing the Gospel with Buddhists | `27_sharing_buddhists` | 11 |
| 28 | Sharing the Gospel with Hindus | `28_sharing_hindus` | 6 |
| 29 | Sharing the Gospel with Muslims | `29_sharing_muslims` | 12 |
| 30 | Sharing the Gospel with Catholics | `30_sharing_catholics` | 6 |
| 31 | Sharing the Gospel in Secular Cultures | `31_sharing_secular` | 3 |
| 32 | Sharing the Gospel in Animistic Culture | `32_sharing_animistic` | 3 |
| 33 | Sharing the Gospel in Patronage Culture | `33_sharing_patronage` | 3 |
| 34 | Global Diaspora | `34_global_diaspora` | 5 |

Each module has: curated `.md` files in `content/books/<folder>/`, a
`MODULE_TITLES` entry, and a `MODULE_FALLBACK` entry (all 34 as of
2026-07-18 — modules 4, 16, 17, 20, 23, 26, 27, 28, 29 were the last
ones missing a fallback and were filled in this session).

Five modules get a periodic human-touch reminder every 6 turns
(`SENSITIVE_MODULES` in `curriculumConfig.ts`): **7** (Caring for Self
& Others), **8** (Emotional Intelligence), **11** (Ministering
Cross-Culturally), **17** (Intercultural Counseling), **32** (Sharing
the Gospel in Animistic Culture).

**Known, intentional content gap:** the offline `QUESTION_BANK` in
`src/lib/questionBank.ts` (last-resort quiz/case-study fallback, used
only when both Groq and Cerebras are unreachable) covers 25 of the 34
modules. Modules **8, 9, 11, 12, 13, 30, 31, 32, 33** have no offline
entry yet and correctly return an honest error in that dual-outage
scenario rather than serving another module's content. This is
documented in that file's own header comment. Fine to leave as-is
(dual-provider outage is rare) or fill in when convenient.

## Copyright policy applied throughout

- **Converted (original synthesis, no verbatim reproduction):** legitimately
  published books from major publishers (IVP, Baker, NavPress,
  Crossway, Eerdmans, William Carey Library, Harvest House, etc.),
  academic textbooks, practitioner guides, and short web articles —
  all rewritten as original syntheses, never quoted at length.
- **Converted directly:** documents the user wrote/provided themselves
  (e.g. the CTLF and MSSF frameworks, the Ontologia Member Care
  document, the DMM training outline) — these are the user's own
  content, not third-party copyrighted works.
- **Refused — piracy markers:** any file with z-library / 1lib / z-lib
  in the filename or content. **Renaming or reformatting the same file
  does not change this** — tested multiple times in this project
  (Craig Ott's two books, Van Rheenen's book) and the refusal stands
  regardless of filename, format (.md/.pdf/.docx), or framing ("just
  rewrite it," "adjust the content," etc.). Specifically declined:
  - *Teaching and Learning across Cultures* (Craig Ott)
  - *Global Church Planting* (Craig Ott)
  - *Communicating Christ in Animistic Contexts* (Gailyn Van Rheenen)
- **Refused — explicit restrictive license:** BTCP-licensed OT/NT
  survey materials (Module 3) — user was advised to contact BTCP
  directly for authorization; original survey content was written
  instead covering the same 66 books.
- **When a source was declined,** original replacement content was
  offered and written instead, covering the same general topic without
  using the declined book as a source.

## Known duplicate-avoidance notes

- Geisler's *A Popular Survey of Bible Doctrine* and Grudem's *Bible
  Doctrine* were uploaded twice (once for Module 2, once offered again
  for Module 4/Christian Theology) — the second set was correctly
  skipped since Module 2 already has them.

## Setup instructions (unchanged from original build)

```bash
npm install
cp .env.example .env  # Fill GROQ_API_KEY, DATABASE_URL minimum
npx prisma migrate deploy
npm run dev
# Access: http://localhost:3000 with code "harvest2026"
# Mentor dashboard: /mentor with code "mentor2026"
```

## Still pending

- **Human theological AND bilingual (Chinese) review** of all 34
  modules by a qualified theologian/missiologist from the sending
  organization has **not** happened yet. Still the single biggest
  open risk in the project — good RAG grounding reduces but does not
  eliminate the need for this.
- **`QUESTION_BANK` offline fallback** still missing entries for 9
  modules (8, 9, 11, 12, 13, 30-33) — see note above. Low priority
  (only triggers when both LLM providers are down simultaneously).
- **Azure Container Apps migration** (Dockerfile + manifest) — budgeted
  and discussed, not implemented.
- **Didactic roadmap improvements not yet built:** spaced repetition,
  conversation simulation/role-play, reflective journal, certification,
  mandatory human checkpoints, post-crisis debrief protocol.
- **English version of the video tutorial script** — current script is
  Portuguese only.

---

## ⚠️ Historical QA session log below — numbering is OUTDATED

Everything from here down is the original session-by-session QA log,
written on 2026-07-15 when the curriculum had only 22-25 modules under
an **earlier numbering scheme** (before the 2026-07-17 resequencing
that produced the current 34-module lineup above). Module numbers and
names mentioned below (e.g. "Module 14", "Module 22") do **not**
correspond to today's numbers — treat this log as a historical record
of decisions/bugs/fixes, not as a current module reference. For
today's numbering, see the table above or `curriculumConfig.ts`.

## QA session #2 — 2026-07-15 (general evaluation, full feature test)

A second, broader pass, again using a real (rotated-recommended) Groq
key against a local Postgres instance. This session tested features
not yet exercised in QA session #1: quiz generation, case study
generation, the theological guardrail, multi-turn conversation memory,
and the mentor weekly digest — plus a full content-quality read (not
just "did it respond") across all 22 modules with module-specific
questions.

**Bug found and fixed:**

8. **Requesting a nonexistent module (23) silently hallucinated a full
   quiz instead of being rejected.** `/api/quiz` and `/api/case-study`
   validated `module > 23`, one past the real range of 1-22 — so a
   request for module 23 passed validation, found no real content, and
   the model simply fabricated a plausible-looking quiz with
   `"module_title":"Module 23"` and generic, non-grounded questions
   about contextualization. This is a real risk: nothing in the output
   itself would tip off a missionary or mentor that "Module 23" isn't
   real curriculum content. Fixed the bound to `> 22` in both routes.
   (`routeToAgent` for regular chat was already safe here — an
   unmapped module number just falls through to whatever agent was
   already active — this bug was specific to the quiz/case-study
   endpoints.)

**Confirmed working end-to-end (no fix needed):**

- All 22 modules, asked a specific, content-grounded question each
  (not a generic one-liner), returned accurate answers correctly
  citing the actual synthesized source material — e.g. Module 14
  correctly explained Hwa Yung's mango/banana metaphor, Module 15
  correctly reproduced this project's own critique of the Camel
  Method, Module 17 correctly summarized Alex Smith on Thai folk-
  Buddhist divination.
- Quiz generation (`/api/quiz`) for a real module (17): produced a
  well-formed, bilingual, correctly-grounded 5-question multiple-
  choice quiz with accurate distractors and explanations.
- Case study generation (`/api/case-study`) for a real module (13),
  including a custom-instructions parameter ("house church context in
  China"): produced a realistic, well-contextualized case incorporating
  the requested detail (family honor/shame pressure, local authority
  opposition).
- Theological guardrail: a message nudging toward religious
  pluralism/universalism ("wouldn't it be kinder to tell Hindus all
  religions lead to the same God?") was correctly and firmly declined,
  citing John 14:6, exactly as the guardrail is designed to do.
- Multi-turn conversation: a follow-up question referencing "what you
  mentioned" in the prior turn was answered coherently, correctly
  recalling and building on the previous turn's definition.
- Mentor weekly digest generation: correctly summarized a missionary's
  actual logged activity (Module 1, biblical hospitality) with an
  accurate, relevant Scripture reference (1 Peter 4:9) and a sensible
  mentor follow-up suggestion.
- Groq daily/rate-limit handling: hit organically multiple times
  during this heavier test session; every time it degraded to the
  existing friendly bilingual message with a retry-after hint, never
  a crash or raw error.

**Content-quality risks found (not code bugs — generation-quality
issues a human reviewer needs to catch):**

- **Fabricated Scripture citation.** In one multi-turn response, the
  model closed with a Chinese/English "quote" attributed to Hebrews
  10:25 that does not match that verse's actual text (it produced
  content resembling a warning about purity/temptation; Hebrews 10:25
  is about not neglecting to meet together). The citation format and
  confidence make this easy to miss without a human checking it against
  an actual Bible. No code-level fix addresses this reliably — it is
  the single strongest argument in this whole project for mandatory
  human review before any Scripture-citing output reaches a missionary.
- **Invented Chinese terminology in Module 21 of all places.** Asked
  about honor/shame in Chinese evangelism, the model invented
  incorrect romanizations ("diu," "chushi") for "honor" and "shame,"
  including empty Chinese-character parentheses, even though the
  actual retrieved source content (`03_saving_gods_face_honor_shame_wu.md`)
  correctly uses 面子 (miànzi, "face"). The model did not reliably use
  the correct term that was right there in its own RAG context.
- **Simplified/Traditional Chinese inconsistency.** The mentor digest
  output used Traditional characters (傳教士, 聖經) while most other
  tested responses used Simplified (传教士, 圣经) — likely fine for
  Chinese readers either way, but worth standardizing given the rest
  of the app's UI is Simplified.
- **Catholic vs. Protestant book-naming convention.** One response
  labeled the Gospel of John "若望福音" (the Catholic Chinese Bible
  naming convention) rather than "约翰福音" (the standard Protestant/
  evangelical rendering) — a small but real mismatch for a platform
  built for evangelical missionaries.

These four items are the clearest evidence yet for why human
theological + bilingual review remains the last real blocker — good
RAG grounding measurably improves factual accuracy (see the accurate
Module 14/15/17 answers above) but does not eliminate the model's
capacity to fabricate a citation or a term with full confidence.

## QA session #1 — 2026-07-15 (first real end-to-end test of the app)

This was the first time the app was actually run, rather than just
written. Testing was done against a local Postgres instance and,
partway through, a real (now-rotated-recommended) Groq API key. Five
real bugs were found and fixed; two design gaps were also closed.

**Bugs found and fixed:**

1. **`prisma/migrations/` did not exist.** `npx prisma migrate deploy`
   — the exact command in this README's own setup instructions — is a
   no-op with no migration history to apply, meaning the mentor
   dashboard's tables would never have been created in a real
   deployment. Fixed by running `npx prisma migrate dev --name init`
   against a real Postgres instance and committing the generated
   `prisma/migrations/20260715194250_init/migration.sql`.
2. **Module 14 had zero live content in production.** `curriculumConfig.ts`
   points module 14 at `content/books/14_majority_world_theo/`, but
   all 14 synthesized files had been written into a sibling folder,
   `content/books/14_majority_world_theology/`, created in an earlier
   session — the app was silently reading an empty placeholder folder
   instead. Fixed by moving all 14 files into the folder the code
   actually reads and removing the now-empty duplicate. Confirmed
   fixed: Module 14's BM25 index now builds 48 chunks and returns
   correct, grounded answers. All other 21 modules were swept and
   confirmed to have no equivalent folder-name mismatch.
3. **Escalation-keyword list missed common self-harm phrasings.**
   A test message containing "kill myself" produced **zero** urgent
   flags — the keyword list had "suicidal" and "want to hurt myself"
   but not "kill myself," "want to die," "end my life," or several
   other common phrasings, in any of the three languages. Expanded
   `ESCALATION_KEYWORDS` in `src/lib/mentor.ts` with additional
   English, Chinese, and Portuguese phrasings. Still a blunt keyword
   pre-filter, not a classifier — the code's own comment on this
   already said so, and that framing remains accurate and important.
4. **Missionary identity could silently fragment.** `/api/session/identify`
   always minted a new random `missionaryId` unless the current
   browser session already had one — so a missionary whose 7-day
   session cookie expired, or who switched device/browser, would show
   up as a brand-new, separate person in the mentor's roster, splitting
   their activity history and urgent-flag trail. Added
   `findMissionaryByName()` (case-insensitive exact match) and used it
   in the identify route so a returning missionary with the same name
   reuses their existing record when no id is already in the session.
   Documented as a best-effort mitigation, not a perfect identity
   system — two real people with the same name, or a spelling change,
   can still create separate records.
5. **Raw provider errors were shown to missionaries.** An invalid/expired
   Groq key (or any non-rate-limit failure) surfaced as
   `⚠️ Error: Error: HTTP 401: {"error":{"message":"Invalid API
   Key"...}}` directly in the chat. Changed `callAgentStream`'s catch
   path to log the real error server-side (`console.error`) and show
   the missionary a friendly bilingual message instead, pointing them
   to their mentor if it persists.

**Design gaps closed:**

6. **Bilingual instruction caused the model to narrate its own
   language detection** ("Desculpe, mas parece que houve um erro de
   detecção de idioma...") in roughly half of tested responses across
   modules, instead of just answering. Reworded `BILINGUAL_RULE` and
   `LANG_HINTS` in `src/lib/guardrails.ts` to explicitly forbid
   mentioning/narrating the language rule and to frame the hint as an
   internal routing tag rather than a note. Confirmed fixed: 0/22
   modules narrated language detection on re-test after the change.
7. **Only one access code per role was possible.** `verifyAccessCode`
   now accepts a comma-separated list in `ACCESS_CODE` /
   `MENTOR_ACCESS_CODE` (e.g. issuing a distinct code per partner org
   or cohort) while remaining fully backward-compatible with a single
   code, which is still the default.

**Confirmed working end-to-end (no fix needed):**

- Missionary login → identify → chat → mentor login → roster → urgent
  flags → mentor message → missionary receives it → mentor resolves
  flag → roster reflects it, all tested via real HTTP calls against a
  running dev server and a real Postgres database.
- Routing (`routeToAgent`): module-selected messages route to the
  correct `mod_XX` agent; quiz keywords route to `quiz_master`; no
  selection stays on `orchestrator` — confirmed via the `X-Agent-Key`
  response header across multiple scenarios.
- BM25 RAG indexing builds successfully for **all 22 modules** (5 to
  91 chunks depending on module size) with no errors, after the
  Module 14 folder fix.
- `npm run build` compiles cleanly with no type or build errors.
- Daily Groq free-tier quota exhaustion (hit during this same testing
  session, from the volume of test calls) already degrades gracefully
  today — friendly bilingual message, retry-after hint, no crash — no
  fix was needed there.

**Important correction to the earlier "Multi-Agent System Report":**
that report described the orchestrator as reading free-text intent
and routing to the right specialist automatically. In the actual code,
routing is driven by which module the missionary has explicitly
selected in the sidebar (`selectedModule`), with only a lightweight
keyword check for quiz requests as automatic content-based routing;
the orchestrator itself only ever handles the no-module-selected case.
The report's Section 4.1 description should be read with this
correction in mind.

## QA session #3 — 2026-07-15 (guardrail expansion + honest limits found)

A third pass, testing areas not yet covered (other guardrail triggers,
mentor broadcast messages, input edge cases) and attempting a targeted
fix for the Scripture-fabrication risk flagged in session #2.

**Confirmed working (no fix needed):**

- Two additional theological guardrail triggers (ancestor worship,
  contact with the dead / necromancy) both fired correctly with
  appropriate Scripture grounding (Deut 18:9-12, Isa 8:19-20, 2 Cor
  1:3-5) — the guardrail is not a one-trigger fluke.
- Mentor broadcast messages (`missionaryId: null`): delivered
  independently and correctly to two different test missionaries, with
  per-missionary delivery tracking (a message read by one missionary
  does not disappear for the other; neither sees it twice).
- Input edge cases: empty message and whitespace-only message are both
  correctly rejected with 400; an emoji-only message is accepted and
  gets a sensible pastoral response; a ~6,000-character message is
  processed normally in about 6 seconds with no error.

**Attempted fix — honest result: partial and unreliable.** Session #2
found a fabricated citation ("Hebrews 10:25" with non-matching text).
Added a new guardrail section (`XI. SCRIPTURE CITATION ACCURACY` in
`src/lib/guardrails.ts`) instructing the model to paraphrase rather
than fabricate quotation-marked verse text, and to double-check that a
cited reference matches the content attributed to it. **Retesting
after this change showed only partial, inconsistent improvement — this
should not be reported as fixed:**

- A repeat test on Module 2 produced a *new* fabricated citation
  ("Hebrews 8:6" with non-matching text), the same fabricated-sounding
  quote duplicated under two different wrong references ("1
  Corinthians 1:18" and "2 Corinthians 1:18"), and a page-specific
  Grudem quote ("*Christian Beliefs*, p. 12") that is almost certainly
  invented — the model even added "(tradução livre / free
  translation)" as a hedge in one place, which does not actually solve
  fabrication, it just labels it more politely.
- A further test on Module 18 (asking Erickson's view on election,
  with citations) produced a mixed result in one response: an accurate
  rendering of Romans 8:29-30 and John 15:16, alongside an Ephesians
  citation that blends real text from Ephesians 2:8-9 under the wrong
  label "Ephesians 1:4-6," two more page-specific Erickson quotes that
  are almost certainly fabricated, and — a new failure mode — **the
  required Chinese versions of the same three verses came back as
  empty quotation marks** (`""`), a silent bilingual-rule failure
  distinct from fabrication.

**Conclusion — recorded plainly rather than oversold:** prompt-level
instructions measurably help in some cases (the guardrail addition is
still worth keeping — it didn't make anything worse, and some outputs
after the change were accurate) but do **not reliably prevent** a
capable-but-imperfect model from fabricating specific verse text or
page-numbered quotes with full confidence, and can introduce new
failure modes (empty bilingual output) elsewhere. Two follow-up
engineering options worth scoping as future work, neither done here:

1. **Post-generation verification.** Before displaying a response,
   detect Scripture references and cross-check quoted text against a
   real Bible text API (e.g., api.bible, bible-api.com), stripping or
   flagging quotation marks around text that doesn't match.
2. **Stronger structural constraint.** Require the model to output
   Scripture as `reference` + model's own paraphrase only, never as a
   quoted string at all, removing the fabrication surface area
   entirely at the cost of never showing exact wording.

Until one of these is built, **any AI-generated content containing a
direct, quotation-marked Scripture citation should be treated as
unverified until a human checks it against a real Bible** — this
applies to the existing 22 modules' curriculum content as much as to
live chat responses, and is the strongest concrete argument in this
whole project for why the human theological review item in the launch
checklist cannot be skipped or shortcut.

## QA session #4 — 2026-07-15 (built: live Scripture verification)

Building directly on session #3's finding that prompt-level fixes alone
could not reliably prevent Scripture fabrication, this session
implemented the more robust mitigation option that was only sketched
before: **a new module, `src/lib/scripture.ts`, that fetches REAL verse
text live from bible-api.com (no API key required, public domain) and
appends it to every chat response that mentions a recognizable Bible
reference — in both English (World English Bible) and Chinese (Chinese
Union Version, 和合本).**

**What it does:** after a response streams to completion, the raw text
is scanned for Bible references using a book-name table covering all
66 books in English, Portuguese, and (Traditional) Chinese names/
abbreviations. Any reference found (e.g. "Romanos 8:28-30," "1 Coríntios
13:4-7," "約翰福音 3:16") triggers a live fetch of the actual verse text
in both languages, appended as a clearly labeled "📖 Verified Scripture"
block. This does not stop the model from writing an inaccurate quote
inline — it gives the missionary an independently-fetched, real
reference point to compare against immediately below whatever the
model said, which is the most reliable mitigation available without a
much larger rebuild of the generation pipeline.

**Two real bugs found and fixed while building this (both in the new
module itself, not pre-existing code):**

1. **Greedy regex captured the wrong "book name."** An early version
   used a generic "any word(s) before chapter:verse" pattern, which
   matched "diz Romanos" (grabbing the preceding Portuguese word "diz")
   instead of just "Romanos" out of "...diz Romanos 8:28...". Since
   "dizromanos" isn't a real book alias, the whole reference was
   silently dropped. Fixed by building the regex directly from the
   known book-name table (longest names first) instead of a generic
   word pattern — it can now only ever match a real, known book name.
2. **Space-handling mismatch in alias lookup.** The lookup function
   stripped spaces before checking the alias table (`"1 coríntios"` →
   `"1coríntios"`), but two-word Portuguese/English entries were stored
   *with* a space in the table, so "1 Coríntios" (and similar two-word
   names) failed lookup and were silently dropped. Fixed by trying the
   space-preserved form first, then the space-stripped form, then the
   raw original — covering both storage conventions and Chinese (which
   has neither spaces nor case to normalize).

**Confirmed working end-to-end via a real chat request** (repeating
the exact question that produced a fabricated "Hebrews 8:6"-style
citation in session #3): the model this time cited four real,
contextually appropriate references (1 Peter 1:3-5, 1 John 2:19, Romans
8:30, 1 Peter 1:5) without inventing quoted wording, and the new
verification block correctly fetched and displayed the real English +
Chinese text for all four, live, via the actual `/api/chat` endpoint.

**Also fixed while in `groq.ts`:** the non-streaming `callAgent`
fallback (used when a stream-level error occurs) had the same
raw-technical-error problem fixed in session #1 for the streaming path,
but *not* for this fallback path — it still returned `"⚠️ Error calling
agent: ...\n\nPlease check your GROQ_API_KEY."` directly to the
missionary. Fixed to match the friendly bilingual message used
elsewhere, with the real error now only logged server-side.

**Honest limitation:** this verification block is additive, not
corrective — it does not stop a model from writing a wrong quote
inline, and a rushed reader could still skim past the verification
block without noticing a mismatch. It substantially lowers the risk
(ground truth is now one glance away in the same message, in both
languages) but does not eliminate the case for eventual human
theological review of the 22 modules' own written content, which this
live-chat feature does not touch at all.

## QA session #5 — 2026-07-15 (frontend/backend synchronization audit)

Prompted by the direct question "is the backend well synchronized with
the frontend?" — a fair challenge, since every prior QA session tested
the backend directly via curl/HTTP and never exercised the actual React
UI a missionary or mentor would use. This session used Playwright
(headless Chromium) to drive the real UI end-to-end and inspect the
actual rendered DOM, not just re-read the component source. **Found and
fixed four real synchronization bugs, two of them user-visible on every
single use of the app:**

1. **No markdown rendering anywhere in the chat UI.** Every agent's
   system prompt + guardrails (including the new Scripture verification
   block from session #4) consistently produce `**bold**` section
   headers, bullet lists, and horizontal rules — but `MessageList.tsx`
   rendered agent responses as plain `whitespace-pre-wrap` text. A
   missionary would have seen literal asterisks and markdown syntax in
   *every single response*, never actual bold text or lists. Installed
   `react-markdown` + `remark-gfm` and added matching dark-theme CSS
   (`.prose-chat` in `globals.css`). Verified via Playwright by
   extracting the actual rendered HTML: real `<strong>`, `<em>`, `<p>`
   tags now appear, and a regex check for literal `**` in the rendered
   text returned `false`.
2. **The mentor dashboard's digest had the same raw-markdown problem**
   (the digest-generation prompt also produces `**English:**` /
   `**中文：**` headers and bullet lists) — fixed the same way in
   `MentorDashboard.tsx`. Verified via Playwright: the digest panel now
   renders real `<ul><li>` and `<strong>` tags.
3. **Urgent flags showed a blank/undefined missionary name.** The
   `Flag` TypeScript interface and JSX in `MentorDashboard.tsx` expected
   a flat `f.name` field, but the real `/api/mentor/flags` response (via
   `listUrgentFlags` in `src/lib/mentor.ts`, which Prisma-includes the
   related missionary) nests it as `f.missionary.name`. This meant every
   urgent flag card — the single most safety-critical screen in the
   whole app — would have shown no name for who sent the concerning
   message. Fixed the interface and JSX to read `f.missionary?.name`.
   Verified via Playwright with a real end-to-end flow: logged in as a
   missionary, sent a message containing "kill myself," then logged in
   as a mentor and confirmed the flag card now displays the real name
   ("Playwright Missionario Real") instead of blank.
4. **Sidebar said "23 Modules" instead of "22."** A leftover, purely
   cosmetic copy error (there are only 22), but visible to every single
   user in the sidebar at all times. Fixed the label. (Grepped the rest
   of the frontend and backend for other stray "23"s — none found; the
   quiz/case-study route bound fixed in session #2 was the only other
   instance of this same off-by-one.)

**Confirmed already correctly synchronized (no fix needed):** the
`/api/chat` streaming contract (backend sends incremental deltas,
frontend correctly accumulates them — including the new Scripture
verification block, which arrives as one final extra delta and
displays correctly); `/api/auth/login` and `/api/session/identify`
request/response shapes; `QuizPanel.tsx` against `/api/quiz`'s question
schema; `CaseStudyPanel.tsx` against `/api/case-study`'s one-case-per-
request schema (its `cases[0]`-only usage is intentional, matching the
backend's own "always exactly one case" design, not a bug); mentor
broadcast + direct message + resolve-flag flows.

**Not fixed, noted for awareness:** the `X-Agent-Key` response header
(which reports which agent actually generated a response) is never
read by the frontend, so the Sidebar's "active agent" highlight can
drift from the truth in one specific case — a message containing a quiz
keyword silently routes to `quiz_master` server-side without the
Sidebar's orchestrator/module highlighting updating to reflect it. Not
a functional bug (the correct agent still answers), just a minor,
low-stakes UI truth-drift worth fixing if the Sidebar's agent
indicator is meant to be authoritative.

## QA session #6 — 2026-07-15 (fixed: X-Agent-Key truth-drift from session #5)

Closed the one item session #5 left as "noted, not fixed" — the
Sidebar's active-agent highlight could silently drift from the truth
when server-side routing picked a different agent than what the
frontend had sent (the only real case: a quiz-keyword message with no
module selected routes to `quiz_master`, per `routeToAgent` in
`src/lib/routing.ts`).

**The fix, deliberately not a one-line sync.** The obvious naive fix —
overwrite `activeAgent` from the `X-Agent-Key` response header — was
tried first and rejected on inspection: `activeAgent` is also what
gets sent back as `selectedAgent` on the *next* request, and
`routeToAgent`'s very first check is `if (activeAgent.startsWith("mod_"))
return activeAgent`. Syncing `activeAgent` to `"quiz_master"` after a
one-off quiz question would have made that persona silently "stick"
for the next unrelated question too, since `"quiz_master"` doesn't
start with `"mod_"` but also isn't reset anywhere — a new, worse bug
in place of the old cosmetic one. Instead, added a **second, separate**
piece of state, `lastAgentKey`, updated from the response header purely
for *display* (a small "Answered by 📝 Assessment Agent" badge in the
chat header), while `activeAgent` continues to drive only routing
continuity, untouched by this change.

**Verified via Playwright against the real, previously-broken
scenario:** with no module selected, a plain message correctly showed
"Answered by Global Harvest Coordinator"; a follow-up quiz-keyword
message correctly updated the badge to "Answered by Assessment Agent"
(this is the exact case that silently drifted before — the Sidebar
would have kept the orchestrator highlighted with no indication
quiz_master had actually answered); a further plain follow-up
correctly returned to "Answered by Global Harvest Coordinator" —
confirming quiz_master did *not* leak into the next unrelated
question, i.e. the naive fix's failure mode does not occur here.

## QA session #7 — 2026-07-15 (built: offline fallback question/case bank)

Addressed the first "importante" (yellow) checklist item: the offline
static fallback used only when both Groq and Cerebras are completely
unreachable. The original `harvest_question_bank.py` was never
uploaded into this project, so it could not be ported verbatim as the
old comments in `quiz.ts`/`caseStudies.ts` assumed — this is a
from-scratch replacement, hand-authored (not LLM-generated) directly
from this project's own synthesized curriculum content, covering all
22 modules (the original only covered 1-15).

**What was built:** `src/lib/questionBank.ts` — one quiz question and
one full case study per module, both bilingual (EN/ZH), matching the
exact `QuizQuestion`/`CaseStudy` schemas so no frontend changes were
needed. Wired into the actual last-resort catch paths in
`generateQuizQuestions` (`quiz.ts`) and `generateCaseStudies`
(`caseStudies.ts`) — triggered only after the real generation attempts
(including their own internal Groq/Cerebras retry and fallback logic)
have already failed.

**One bug found and fixed while writing it:** a copy-paste typo in
Module 2's quiz question mislabeled the Chinese translation of option
"c" as `b_zh` instead of `c_zh`, which would have silently duplicated
option b's Chinese text and left option c's Chinese field undefined
in the rendered UI. Caught before the first build succeeded.

**Confirmed working end-to-end:** ran the app with an intentionally
invalid `GROQ_API_KEY` and no `CEREBRAS_API_KEY` set (simulating both
providers being completely down) and called `/api/quiz` for all 22
modules via real HTTP requests — every single one correctly returned
its static fallback question instead of an error.

**Known, accepted limitation:** this is fixed, static content — one
question and one case per module, never varying — unlike live
generation's fresh, RAG-grounded output every time. That tradeoff is
inherent to the feature's purpose (last-resort continuity during a
provider outage, not a replacement for live generation) and matches
how the original Python fallback worked.

## QA session #8 — 2026-07-15 (built: basic monitoring)

Addressed the second "importante" (yellow) checklist item: basic
monitoring for API errors, DB outages, and provider usage. Two
genuine limits acknowledged upfront: a real APM (Sentry, Datadog, a
Groq/Cerebras billing dashboard) needs an account and API key only the
organization can create, and this session could not fabricate that.
What it *could* build, without any external account:

**`src/lib/logger.ts`** — a single structured-logging surface (JSON
lines to stdout/stderr) that most hosting platforms (Vercel, Railway,
Render, etc.) already capture as searchable logs with zero extra
setup, and that makes swapping in a real APM later a one-line change
per call site rather than a rewrite. Replaced the ad hoc
`console.error`/`console.warn` calls in `groq.ts` with this. Also
added simple in-memory counters for Groq/Cerebras call attempts and
errors (`recordProviderCall`) — explicitly documented as NOT a
substitute for the real provider billing consoles, just enough to
eyeball request volume and error rate without one.

**`GET /api/health`** — an unauthenticated health-check endpoint any
free external uptime monitor (UptimeRobot, Better Uptime, a cron job
with curl, etc.) can point at immediately, no account setup needed on
this project's side. Checks live Postgres connectivity (a real
`SELECT 1` query, not just "is the env var set") and whether
`GROQ_API_KEY` is configured (presence-only, not validated against the
real API — validating every poll would burn a real request each time).
Returns HTTP 503 with per-check detail when anything is unhealthy, 200
when all clear.

**Confirmed working via real tests, not just code review:** hit
`/api/health` with the database running (200, all checks green except
the intentionally-unset Groq key) and with Postgres deliberately
stopped mid-session (503, with the real Prisma connection error
surfaced in the response) — both in the same running server process,
confirming the check reflects live state rather than a cached value.
Also confirmed the provider counters increment correctly after a real
quiz request that exhausted Groq's retries and fell through to the
session #7 offline fallback bank.

## QA session #9 — 2026-07-15 (bug found by a real user testing manually)

A real missionary/user testing the app locally (not an automated QA
pass) reported that typing in the chat input felt laggy — and got
noticeably worse as the conversation grew longer. This is the first
bug in this whole file's history found by an actual human user rather
than a session initiated to look for problems, and it turned out to be
a real, meaningful performance issue introduced by session #5's own
markdown-rendering fix.

**Root cause.** Neither `MessageList` nor `Sidebar` were memoized.
Every keystroke in the chat input updates `ChatApp`'s `input` state,
re-rendering `ChatApp` and, by extension, every child — including
`MessageList`, which re-runs `react-markdown` parsing on *every*
message in the conversation, not just new ones, on *every single
keystroke*. The more messages in the conversation, the worse the lag
gets, exactly matching what the user described.

**The fix, in two parts (both were needed):**

1. Wrapped `MessageList` and its inner `Bubble` component in
   `React.memo`, and wrapped `Sidebar` in `React.memo` as well (it
   maps over 22 modules on every render, cheaper than markdown parsing
   but still unnecessary work on every keystroke).
2. `memo()` alone was not sufcient for `Sidebar`: it received
   `onQuickStart` as an inline arrow function and `onIdentify` as a
   plain (non-memoized) async function in `ChatApp`, both recreated
   with a new reference on every render — which defeats `memo`'s
   shallow prop comparison regardless of how the component itself is
   wrapped. Wrapped `send` and `identify` in `useCallback` (with the
   correct dependencies — `send` depends on `messages`, `streaming`,
   `selectedModule`, `activeAgent`, none of which change when the user
   is merely typing), and added a small `handleQuickStart` wrapper via
   `useCallback` around `send` for the Sidebar's quick-start buttons.

**Confirmed fixed, not just theorized.** Added a temporary render
counter on `window`, built a real conversation of 8 messages via
Playwright, reset the counter, typed a 20-character string one
keystroke at a time (matching real typing, not an instant paste), and
read the counter: **0 re-renders of `MessageList` during typing**,
down from re-rendering (and re-parsing every message's markdown) on
every one of the 20 keystrokes before the fix. The temporary counter
was removed after confirming the fix; it is not part of the shipped
code.

## QA session #10 — 2026-07-15 (bug found by a real user: Chinese names hidden)

Another real-usage report: the sidebar's 22 module names appeared
English-only. Checked the underlying data first — `MODULE_NAMES` in
`src/lib/agents.ts` already stores every module bilingually, formatted
as `"English Name | 中文名称"` (e.g. `"Sharing the Gospel with
Buddhists | 向佛教徒传福音"`). The Chinese half was never missing from the
data; `Sidebar.tsx` explicitly discarded it for the visible list label
via `.split(" | ")[0]`, keeping the Chinese half only in the button's
hover `title` tooltip — invisible on a touch device or to anyone who
doesn't hover.

**Fix:** `Sidebar.tsx` now splits the name into English and Chinese
and renders both, stacked in two compact lines per module (English on
top, Chinese smaller and dimmer below), instead of showing only
English with Chinese hidden in a tooltip.

**Confirmed via Playwright:** the Module 17 button's rendered text now
contains real Chinese characters (`向佛教徒传福音`) alongside the English
name, verified with a Unicode CJK-range regex against the actual
rendered button text, not just a code read.

## QA session #11 — 2026-07-15 (new: Module 23, Contextualization of the Gospel)

Added an entirely new module beyond the original 22, at the user's
request, from 6 uploaded academic missiology sources on
contextualization theory: A. Scott Moreau's *Contextualization:
Meanings, Methods, and Models* and *Contextualizing the Faith: A
Holistic Approach*; Dean Flemming's *Contextualization in the New
Testament*; a monograph on *Contextualization of the Gospel* engaging
the church fathers and the C1-C6 spectrum; *Contextualization or
Syncretism?* on Insider Movements and other-faith worship forms; and
*Issues in Contextualization* on incarnational communication. No
piracy markers found in any source. 8 original-synthesis files written
to `content/books/23_contextualization/`.

**This required wiring a new module into the system, not just adding
content** — unlike modules 1-22 (which already existed as empty
scaffolding folders), module 23 did not exist anywhere in the
codebase. Updated, in order: `curriculumConfig.ts` (`MODULE_FOLDERS`,
`MODULE_TITLES`, and a `MODULE_FALLBACK` entry matching the pattern
already used for modules 1-13 — modules 14-22 have no such entry, a
pre-existing gap from before this session, left as-is and out of
scope here); `agents.ts` (`MODULE_NAMES`, a new `mod_23` agent persona,
`MODULE_AGENT_MAP`); `agentsMeta.ts` (the client-safe `mod_23` entry);
`caseSeeds.ts` (module 23 keyword seeds); `Sidebar.tsx` (module count
label, corrected from "22 Modules" back to "23 Modules" — this is the
*same line* session #10 had corrected from a wrong "23" down to "22"
when there were genuinely only 22 modules; now there genuinely are 23,
so the label is right again for a different reason); the quiz and
case-study routes' validation bound (`> 22` → `> 23`); and
`questionBank.ts` (one hand-authored offline-fallback quiz question
and case study for module 23, matching the pattern built in session
#7).

**One real bug introduced and caught before shipping:** while adding
the Chinese title "福音的处境化" ("Contextualization of the Gospel") via a
Python script (used for two of the edits to avoid shell-escaping
issues with quotes inside the existing minified object literals), a
raw Unicode escape typo (`\u798d` instead of `\u798f`) substituted 禍
("disaster/calamity") for 福 ("blessing/gospel") — two visually similar
but semantically opposite characters. This slipped past the first
round of testing because that specific string wasn't the one checked
in the first Playwright pass (which checked the Sidebar button label
and agent badge, both typed correctly by hand via `str_replace`, not
generated by the buggy script) — it only surfaced when testing the
case-study API response directly, which happened to surface the
`MODULE_FALLBACK`-adjacent title string generated by the same script.
Fixed with a global find-replace across the two affected files and
confirmed via a fresh build and a repeat API call showing the correct
character.

**Confirmed working end-to-end via Playwright, not just code review:**
Sidebar now shows "23 Modules · 模块" and a correctly bilingual Module
23 button; selecting it and sending a message correctly routes to
`mod_23` (confirmed via the `X-Agent-Key`-driven "Answered by" badge);
the BM25 index builds successfully for the new module (23 chunks from
the 8 files); and both the quiz and case-study offline-fallback
endpoints for module 23 return the correct, module-specific content
with the correct Chinese title.

## QA session #12 — 2026-07-15 (new: Module 24, Global Diaspora)

Added a second new module beyond the original 22 (following the same
pattern as Module 23 in QA session #11), at the user's request, from 4
uploaded sources on diaspora and global migration: Kevin Kenny's
*Diaspora: A Very Short Introduction* (Oxford); *Doing Diaspora
Missiology Toward "Diaspora Mission Church"* (drawing on Enoch Wan,
Sadiri Joy Tira, and J. D. Payne's "to/through/beyond" framework);
*Mission through Diaspora: The Case of the Chinese Church in the
USA* (an empirical dissertation with real survey data from 273 US
Chinese churches); and Allen Yeh's *Polycentric Missiology*. No piracy
markers found in any source. 5 original-synthesis files written to
`content/books/24_global_diaspora/`.

**Wired into the same 7 integration points as Module 23**:
`curriculumConfig.ts` (`MODULE_FOLDERS`, `MODULE_TITLES`, a
`MODULE_FALLBACK` entry), `agents.ts` (`MODULE_NAMES`, a new `mod_24`
agent persona, `MODULE_AGENT_MAP`), `agentsMeta.ts` (client-safe
`mod_24` entry), `caseSeeds.ts` (module 24 keyword seeds), `Sidebar.tsx`
(module count label, "23 Modules" → "24 Modules" — this time a
straightforward correct increment, not a bug-fix-and-revert like the
23-module transition in session #11), and both the quiz and case-study
routes' validation bound (`> 23` → `> 24`).

**Applied the direct lesson from session #11's Unicode bug**: every
Chinese character this session was typed directly into `str_replace`
calls or, where a Python script was still needed to work around
shell-escaping issues with quotes inside existing minified object
literals, verified immediately afterward with a `grep` extracting the
literal inserted string — catching any mistyped codepoint before it
could ship, rather than after. No character errors this time,
confirmed by direct comparison between the `MODULE_TITLES` entry, the
`MODULE_FALLBACK` entry, and the module's own `README.md`, all of
which read identically ("Global Diaspora | 全球侨民").

**Confirmed working end-to-end via Playwright and direct API calls:**
Sidebar shows "24 Modules · 模块" with a correctly bilingual Module 24
button; selecting it and sending a message routes to `mod_24`
(confirmed via the "Answered by" badge); the BM25 index builds
successfully for the new module (15 chunks from the 5 files); the
quiz and case-study offline-fallback endpoints for module 24 return
correct, module-specific bilingual content; and — as a final
regression check — a sweep of all 24 modules' quiz-fallback endpoints
in one pass confirmed every single module (not just the new one)
still returns its correct title with no character corruption anywhere
in the system.

## QA session #13 — 2026-07-15 (new: Module 25, Biblical Hermeneutics — and a bug caught from sessions #11-12)

Added a third new module (following the same pattern as Modules 23-24
in QA sessions #11-12), at the user's request, from 5 uploaded sources
on biblical interpretation: D. A. Carson's *Exegetical Fallacies*;
Robert E. Van Voorst's *Commonly Misunderstood Verses of the Bible*;
a Bible college course, *Bible Study Methods and Rules of
Interpretation*; Robert L. Plummer's *40 Questions About Interpreting
the Bible*; and Henning Wrogemann's *Intercultural Hermeneutics*. No
piracy markers found in any source. 5 original-synthesis files written
to `content/books/25_biblical_hermeneutics/`.

**A real, previously invisible bug caught and fixed while integrating
this module.** `curriculumConfig.ts` has always declared `export const
TOTAL_MODULES = 22;` — but nothing in the entire codebase actually
imports or reads this constant, so it silently went stale across both
the Module 23 and Module 24 additions (sessions #11-12) without
anyone, including this same QA process, noticing. It was only spotted
this session while searching the file for the right insertion point
for Module 25's `MODULE_FALLBACK` entry. **Fixed at the root rather
than just updated to the current number**: changed the declaration to
`export const TOTAL_MODULES = Object.keys(MODULE_TITLES).length`,
deriving it from the actual title map instead of a hand-maintained
literal, so it cannot go stale again after any future module addition
— even though nothing currently reads it, a future feature that does
will get the right number automatically. Applied the identical fix to
`Sidebar.tsx`'s module-count label: it had been a hand-edited string
("22 Modules" → "23 Modules" → "24 Modules" across three separate
sessions, including once being *wrongly* "corrected" to 22 in session
#10 when the true count really was 22 at that specific moment, before
being correctly incremented twice more afterward). It now reads
`{moduleNums.length} Modules · 模块`, computed directly from the same
`MODULE_NAMES` map the sidebar already iterates over to render the
module list — eliminating this entire recurring class of bug for every
future module addition, not just this one.

**Character-insertion discipline from session #12 held up again**:
every Chinese string this session was verified immediately after
insertion via `grep`, comparing the `MODULE_TITLES` entry, the
`MODULE_FALLBACK` entry, and the module's own `README.md` — all three
read identically ("Biblical Hermeneutics | 圣经解释学") with no repeat of
session #11's Unicode-codepoint typo.

**Confirmed working end-to-end via Playwright and direct API calls:**
Sidebar shows "25 Modules · 模块" (the new dynamic count, not a
hand-edited string) with a correctly bilingual Module 25 button;
selecting it and sending a message routes to `mod_25`; the BM25 index
builds successfully for the new module (15 chunks from the 5 files);
and a full sweep of all 25 modules' quiz-fallback endpoints in one
pass confirmed every module, old and new, still returns its correct
title with no character corruption or regression anywhere in the
system.

## Copyright / framing notes specific to Module 15

- The apologetics volume behind `06_islam_bible_apologetics_contested_claims.md`
  and the classical-commentary volume behind
  `10_sharing_faith_muslim_quranic_christology.md` both make contested
  claims (particularly on abrogation, jihad, and Qur'anic Christology)
  that Muslim scholars and many academic Islamicists would dispute.
  Both files were written with explicit framing flagging this rather
  than presenting the claims as settled consensus.
- The Any-3 / Camel Method file (`11_any3_camel_method_greeson.md`)
  notes the live missiological debate about using Qur'anic verses
  about Isa as an evangelistic bridge, rather than presenting the
  method uncritically.
- The Marie Sinclair article on Muslim women and the supernatural
  (previously uploaded alongside the Module 17 Buddhist batch by
  mistake) has now been correctly placed in this module as
  `12_mulheres_folk_islam_mundo_sobrenatural.md`.
