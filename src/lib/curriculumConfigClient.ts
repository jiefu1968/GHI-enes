// Client-safe subset of curriculumConfig.ts — just module titles, so
// Sidebar doesn't bundle the (much larger) MODULE_FALLBACK content strings.
import { MODULE_TITLES } from "./curriculumConfig";

export const MODULE_NAMES: Record<number, string> = MODULE_TITLES;
