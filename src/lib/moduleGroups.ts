// Groups the 37 module specialists into 5 thematic categories for the
// sidebar. Client-safe (no fs/server imports) — used by Sidebar.tsx and
// by the chat API route (which only needs the module-number lists, not
// any UI-only fields) to restrict supervisor routing to a chosen group.
//
// label/description are bilingual, formatted as "English | Español"
// — Sidebar.tsx splits on " | " to show both, same convention as
// agents.ts's MODULE_NAMES.

export interface ModuleGroup {
  id: string;
  label: string;
  description: string;
  moduleNums: number[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: "foundations",
    label: "Biblical & Theological Foundations | Fundamentos Bíblicos y Teológicos",
    description:
      "Biblical hospitality. Essential doctrines. Biblical panorama. Christian theology. " +
      "Biblical hermeneutics. Biblical theology of mission. | " +
      "Hospitalidad bíblica. Doctrinas esenciales. Panorama bíblico. Teología cristiana. " +
      "Hermenéutica bíblica. Teología bíblica de la misión.",
    moduleNums: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "formation",
    label: "Personal Formation & Missionary Care | Formación Personal y Cuidado Misionero",
    description:
      "Spiritual life and character. Self-care. Emotional intelligence. Security-minded culture. " +
      "Preventing ministry failure. | " +
      "Vida espiritual y carácter. Autocuidado. Inteligencia emocional. Cultura de seguridad. " +
      "Prevención del fracaso ministerial.",
    moduleNums: [7, 8, 9, 10, 11],
  },
  {
    id: "intercultural",
    label: "Intercultural Intelligence & Communication | Inteligencia y Comunicación Intercultural",
    description:
      "Intercultural ministry. Intercultural communication. Cultural intelligence. " +
      "Reading the Bible through intercultural eyes. Discipleship, leadership, counseling, " +
      "and teaching across cultures. | " +
      "Ministerio intercultural. Comunicación intercultural. Inteligencia cultural. " +
      "Lectura de la Biblia con ojos interculturales. Discipulado, liderazgo, consejería " +
      "y enseñanza a través de culturas.",
    moduleNums: [12, 13, 14, 15, 16, 17, 18, 19],
  },
  {
    id: "strategy",
    label: "Mission Strategy & Contextualization | Estrategia Misionera y Contextualización",
    description:
      "Missionary anthropology. Phenomenology of religion. Contextualization of the Gospel. " +
      "Majority world theology. Mission strategies. Church planting. Global diaspora. " +
      "Christian community development. | " +
      "Antropología misionera. Fenomenología de la religión. Contextualización del Evangelio. " +
      "Teología del mundo mayoritario. Estrategias de misión. Plantación de iglesias. Diáspora " +
      "global. Desarrollo comunitario cristiano.",
    moduleNums: [20, 21, 22, 23, 24, 25, 26, 27],
  },
  {
    id: "evangelism",
    label: "Evangelism by Religious & Cultural Context | Evangelismo por Contexto Religioso y Cultural",
    description:
      "Biblical storytelling. World religions. How to share the gospel with Chinese, " +
      "Buddhists, Hindus, Muslims, Catholics, secular audiences, animists, and patronage " +
      "cultures. | " +
      "Narrativa bíblica. Religiones mundiales. Cómo compartir el evangelio con chinos, " +
      "budistas, hindúes, musulmanes, católicos, audiencias seculares, animistas y culturas " +
      "de clientelismo.",
    moduleNums: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  },
];

export function groupForModule(moduleNum: number): ModuleGroup | undefined {
  return MODULE_GROUPS.find((g) => g.moduleNums.includes(moduleNum));
}
