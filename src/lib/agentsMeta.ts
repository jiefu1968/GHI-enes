// Client-safe agent metadata (name/emoji/color only — no system
// prompts) so Sidebar/module pickers don't bundle the full prompt text.
// Auto-derived from lib/agents.ts's AGENTS registry.
// NOTE: Modules were reordered and renumbered on 2026-07-17 per a curriculum
// resequencing request; four new modules (Sharing the Gospel with Catholics,
// in Secular Cultures, in Animistic Culture, and in Patronage Culture) were
// added at that time. This file reflects the current 34-module lineup.

export interface AgentMeta {
  name: string;
  emoji: string;
  color: string;
  modules: number[];
}

export const AGENT_META: Record<string, AgentMeta> = {
  "orchestrator": {
    "name": "Global Harvest Coordinator",
    "emoji": "🌾",
    "color": "#C8860A",
    "modules": []
  },
      "mod_01": {
    "name": "1. Biblical Hospitality | Hospitalidad Bíblica",
    "emoji": "🏠",
    "color": "#2D5A8E",
    "modules": [
      1
    ]
  },
  "mod_02": {
    "name": "2. Essential Teachings of the Christian Faith | Enseñanzas Esenciales de la Fe Cristiana",
    "emoji": "📖",
    "color": "#2D5A8E",
    "modules": [
      2
    ]
  },
  "mod_03": {
    "name": "3. Biblical Panorama | Panorama Bíblico",
    "emoji": "🌅",
    "color": "#2D5A8E",
    "modules": [
      3
    ]
  },
  "mod_04": {
    "name": "4. Christian Theology | Teología Cristiana",
    "emoji": "✝️",
    "color": "#5A2D8E",
    "modules": [
      4
    ]
  },
  "mod_05": {
    "name": "5. Biblical Hermeneutics | Hermenéutica Bíblica",
    "emoji": "🔎",
    "color": "#8E5A2D",
    "modules": [
      5
    ]
  },
  "mod_06": {
    "name": "6. Theology of Missions | Teología de las Misiones",
    "emoji": "🕊️",
    "color": "#1F5C4A",
    "modules": [
      6
    ]
  },
  "mod_07": {
    "name": "7. Spiritual Life & Character | Vida Espiritual y Carácter",
    "emoji": "✨",
    "color": "#2D5A8E",
    "modules": [
      7
    ]
  },
  "mod_08": {
    "name": "8. Caring for Self & Others | Cuidado de Uno Mismo y de los Demás",
    "emoji": "🤝",
    "color": "#5A8E2D",
    "modules": [
      8
    ]
  },
  "mod_09": {
    "name": "9. Emotional Intelligence | Inteligencia Emocional",
    "emoji": "🧠",
    "color": "#6E4E9E",
    "modules": [
      9
    ]
  },
  "mod_10": {
    "name": "10. Security-Minded Culture | Cultura de Seguridad",
    "emoji": "🧭",
    "color": "#4A6FA5",
    "modules": [
      10
    ]
  },
  "mod_11": {
    "name": "11. Preventing Ministry Failure | Previniendo el Fracaso Ministerial",
    "emoji": "🛡️",
    "color": "#8B6F9E",
    "modules": [
      11
    ]
  },
  "mod_12": {
    "name": "12. Ministering Cross-Culturally | Ministrando Interculturalmente",
    "emoji": "🌾",
    "color": "#8E4E2E",
    "modules": [
      12
    ]
  },
  "mod_13": {
    "name": "13. Intercultural Communication | Comunicación Intercultural",
    "emoji": "💬",
    "color": "#2E6E8E",
    "modules": [
      13
    ]
  },
  "mod_14": {
    "name": "14. Intercultural Intelligence | Inteligencia Intercultural",
    "emoji": "🧭",
    "color": "#B23A48",
    "modules": [
      14
    ]
  },
  "mod_15": {
    "name": "15. Misreading the Scripture | Malinterpretando las Escrituras",
    "emoji": "🌏",
    "color": "#8E2D5A",
    "modules": [
      15
    ]
  },
  "mod_16": {
    "name": "16. Intercultural Discipleship | Discipulado Intercultural",
    "emoji": "👥",
    "color": "#8E2D5A",
    "modules": [
      16
    ]
  },
  "mod_17": {
    "name": "17. Intercultural Leadership | Liderazgo Intercultural",
    "emoji": "👑",
    "color": "#8E8E2D",
    "modules": [
      17
    ]
  },
  "mod_18": {
    "name": "18. Intercultural Counseling | Consejería Intercultural",
    "emoji": "💬",
    "color": "#2D8E5A",
    "modules": [
      18
    ]
  },
  "mod_19": {
    "name": "19. Teaching in Other Cultures | Enseñando en Otras Culturas",
    "emoji": "🎓",
    "color": "#8E2D5A",
    "modules": [
      19
    ]
  },
  "mod_20": {
    "name": "20. Mission Anthropology | Antropología Misionera",
    "emoji": "🔍",
    "color": "#2D4A8E",
    "modules": [
      20
    ]
  },
  "mod_21": {
    "name": "21. Phenomenology of Religion | Fenomenología de la Religión",
    "emoji": "🕯️",
    "color": "#5A3E8E",
    "modules": [
      21
    ]
  },
  "mod_22": {
    "name": "22. Contextualization of the Gospel | Contextualización del Evangelio",
    "emoji": "🌉",
    "color": "#2D6E8E",
    "modules": [
      22
    ]
  },
  "mod_23": {
    "name": "23. Majority World Theology | Teología del Mundo Mayoritario",
    "emoji": "🌍",
    "color": "#2D5A8E",
    "modules": [
      23
    ]
  },
  "mod_24": {
    "name": "24. Major Mission Strategies | Principales Estrategias Misioneras",
    "emoji": "🗺️",
    "color": "#8E5A2D",
    "modules": [
      24
    ]
  },
  "mod_25": {
    "name": "25. Intercultural Church Planting | Plantación de Iglesias Intercultural",
    "emoji": "⛪",
    "color": "#5A2D8E",
    "modules": [
      25
    ]
  },
  "mod_26": {
    "name": "26. Global Diaspora | Diáspora Global",
    "emoji": "🌐",
    "color": "#3E8E6E",
    "modules": [
      26
    ]
  },
  "mod_27": {
    "name": "27. Christian Community Development | Desarrollo Comunitario Cristiano",
    "emoji": "🏘️",
    "color": "#5E8E3E",
    "modules": [
      27
    ]
  },
  "mod_28": {
    "name": "28. Biblical Storytelling | Narrativa Bíblica",
    "emoji": "📜",
    "color": "#2D5A8E",
    "modules": [
      28
    ]
  },
  "mod_29": {
    "name": "29. Major World Religions | Principales Religiones Mundiales",
    "emoji": "🕌",
    "color": "#2D4A8E",
    "modules": [
      29
    ]
  },
  "mod_30": {
    "name": "30. Sharing the Gospel with Chinese | Compartiendo el Evangelio con Chinos",
    "emoji": "🐉",
    "color": "#C8860A",
    "modules": [
      30
    ]
  },
  "mod_31": {
    "name": "31. Sharing the Gospel with Buddhists | Compartiendo el Evangelio con Budistas",
    "emoji": "☸️",
    "color": "#8E5A2D",
    "modules": [
      31
    ]
  },
  "mod_32": {
    "name": "32. Sharing the Gospel with Hindus | Compartiendo el Evangelio con Hindúes",
    "emoji": "🕉️",
    "color": "#8E2D5A",
    "modules": [
      32
    ]
  },
  "mod_33": {
    "name": "33. Sharing the Gospel with Muslims | Compartiendo el Evangelio con Musulmanes",
    "emoji": "☪️",
    "color": "#2D5A8E",
    "modules": [
      33
    ]
  },
  "mod_34": {
    "name": "34. Sharing the Gospel with Catholics | Compartiendo el Evangelio con Católicos",
    "emoji": "📿",
    "color": "#6E2D5A",
    "modules": [
      34
    ]
  },
  "mod_35": {
    "name": "35. Sharing the Gospel in Secular Cultures | Compartiendo el Evangelio en Culturas Seculares",
    "emoji": "🏙️",
    "color": "#4A6E8E",
    "modules": [
      35
    ]
  },
  "mod_36": {
    "name": "36. Sharing the Gospel in Animistic Culture | Compartiendo el Evangelio en Cultura Animista",
    "emoji": "🔮",
    "color": "#3E6E3E",
    "modules": [
      36
    ]
  },
  "mod_37": {
    "name": "37. Sharing the Gospel in Patronage Culture | Compartiendo el Evangelio en Cultura de Clientelismo",
    "emoji": "🏛️",
    "color": "#8E6E2D",
    "modules": [
      37
    ]
  },
  "quiz_master": {
    "name": "Assessment Agent",
    "emoji": "📝",
    "color": "#4A4A4A",
    "modules": []
  }
};
