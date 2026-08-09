// Shared between Sidebar.tsx (compact list) and MessageList.tsx's
// empty-state welcome cards (larger, clickable grid) — extracted here so
// both surfaces show the exact same options without duplicating the
// label→prompt mapping in two places.
//
// Mirrors the 5 sidebar module groups (see lib/moduleGroups.ts) plus
// direct shortcuts into the dedicated Quiz and Case Study views.
//
// DESIGN NOTE: QUICK_STARTS holds stable, English-only KEYS used for
// lookups (QUICK_START_VIEW, QUICK_START_GROUP_ID, quickStartText) —
// keeping those simple avoids every dictionary in this file needing a
// " | "-separated multi-language string as its key. These keys are
// never shown to the user — what's actually SEEN is
// QUICK_START_DISPLAY_LABEL, which is bilingual (English | Español).

export const QUICK_STARTS = [
  "🌾 Start",
  "📝 Quiz Me",
  "📚 Case Studies",
  "📖 Foundations",
  "🌱 Formation",
  "🌏 Intercultural",
  "🗺️ Strategy",
  "✝️ Evangelism",
];

// What's actually rendered on each card/button — "English | Español",
// same convention as MODULE_NAMES.
export const QUICK_START_DISPLAY_LABEL: Record<string, string> = {
  "🌾 Start": "🌾 Start | Inicio",
  "📝 Quiz Me": "📝 Quiz Me | Ponme a prueba",
  "📚 Case Studies": "📚 Case Studies | Estudios de Caso",
  "📖 Foundations": "📖 Foundations | Fundamentos",
  "🌱 Formation": "🌱 Formation | Formación",
  "🌏 Intercultural": "🌏 Intercultural | Intercultural",
  "🗺️ Strategy": "🗺️ Strategy | Estrategia",
  "✝️ Evangelism": "✝️ Evangelism | Evangelismo",
};

// Short one-line descriptions shown under each card in the empty-state
// welcome grid (MessageList.tsx). Sidebar's compact list doesn't have
// room for these, so they're kept separate from the label itself.
export const QUICK_START_DESCRIPTIONS: Record<string, string> = {
  "🌾 Start":
    "A short introduction to the platform | Una breve introducción a la plataforma",
  "📝 Quiz Me":
    "Go to the Quiz tab and pick a module | Ve a la pestaña de Prueba y elige un módulo",
  "📚 Case Studies":
    "Go to the Case Study tab and pick a module | Ve a la pestaña de Estudio de Caso y elige un módulo",
  "📖 Foundations":
    "Biblical hospitality, doctrine, panorama, theology, hermeneutics, theology of mission | " +
    "Hospitalidad bíblica, doctrina, panorama, teología, hermenéutica, teología de la misión",
  "🌱 Formation":
    "Spiritual life, self-care, emotional intelligence, security-minded culture, preventing ministry failure | " +
    "Vida espiritual, autocuidado, inteligencia emocional, cultura de seguridad, prevención del fracaso ministerial",
  "🌏 Intercultural":
    "Intercultural ministry, communication, CQ, discipleship, leadership, counseling, teaching | " +
    "Ministerio intercultural, comunicación, CQ, discipulado, liderazgo, consejería, enseñanza",
  "🗺️ Strategy":
    "Anthropology, phenomenology of religion, contextualization, mission strategy, church planting, diaspora | " +
    "Antropología, fenomenología de religiones, contextualización, estrategia misionera, plantación de iglesias, diáspora",
  "✝️ Evangelism":
    "Storytelling, world religions, and how to share with Chinese, Buddhists, Hindus, Muslims, " +
    "Catholics, secular audiences, animists, and patronage cultures | " +
    "Narrativa, religiones mundiales, y cómo compartir con chinos, budistas, hindúes, musulmanes, " +
    "católicos, audiencias seculares, animistas y culturas de clientelismo",
};

// Labels that jump straight to a dedicated view (Quiz / Case Study)
// instead of sending a chat message — those tabs already have their own
// module + language pickers, so routing through chat text is unnecessary.
export const QUICK_START_VIEW: Record<string, "quiz" | "case"> = {
  "📝 Quiz Me": "quiz",
  "📚 Case Studies": "case",
};

// Labels that scope the chat to one of the 5 sidebar groups (see
// lib/moduleGroups.ts) — same effect as clicking that group's header —
// in addition to sending the opening prompt below.
export const QUICK_START_GROUP_ID: Record<string, string> = {
  "📖 Foundations": "foundations",
  "🌱 Formation": "formation",
  "🌏 Intercultural": "intercultural",
  "🗺️ Strategy": "strategy",
  "✝️ Evangelism": "evangelism",
};

// "Start" no longer round-trips through the AI (see STATIC_WELCOME_MESSAGE
// below) — asking the orchestrator for "a program overview" reliably
// produced a long, module-by-module study-schedule-style response, which
// is the opposite of the short pitch this button is meant to give.
export function quickStartText(label: string): string {
  const map: Record<string, string> = {
    "📖 Foundations":
      "I want to explore Biblical & Theological Foundations. " +
      "Give me an overview of this area. Respond in English and Spanish.",
    "🌱 Formation":
      "I want to explore Personal Formation & Missionary Care. " +
      "Give me an overview of this area. Respond in English and Spanish.",
    "🌏 Intercultural":
      "I want to explore Intercultural Intelligence & Communication. " +
      "Give me an overview of this area. Respond in English and Spanish.",
    "🗺️ Strategy":
      "I want to explore Mission Strategy & Contextualization. " +
      "Give me an overview of this area. Respond in English and Spanish.",
    "✝️ Evangelism":
      "I want to explore Evangelism by Religious & Cultural Context. " +
      "Give me an overview of this area. Respond in English and Spanish.",
  };
  return map[label] ?? label;
}

// "Start" shows this immediately, without an API call — see the comment
// above quickStartText for why. Short and bilingual (EN/ES) on purpose:
// this is a pitch for the platform, not a curriculum walkthrough.
export const STATIC_WELCOME_MESSAGE =
  "🌾 **Welcome to the Global Harvest Initiative.**\n\n" +
  "This isn't a generic chatbot — it's a multi-agent AI system built specifically for cross-cultural " +
  "missionary training: 37 specialist agents, each trained on curated theological and missiological " +
  "content, working together with an automatic doctrinal review before any answer reaches you.\n\n" +
  "Built with the same generation of AI technology used by the world's most advanced companies today " +
  "— applied here to equip missionaries, not just answer questions. And a human mentor is always part " +
  "of the picture, never replaced by the AI.\n\n" +
  "---\n\n" +
  "**Bienvenido al Global Harvest Initiative.**\n\n" +
  "Esto no es un chatbot genérico — es un sistema de IA multiagente construido específicamente para la " +
  "formación misionera intercultural: 37 agentes especialistas, cada uno entrenado con contenido " +
  "teológico y misiológico curado, trabajando juntos con una revisión doctrinal automática antes de que " +
  "cualquier respuesta llegue a usted.\n\n" +
  "Construido con la misma generación de tecnología de IA que usan hoy las empresas más avanzadas del " +
  "mundo — aplicada aquí para equipar misioneros, no solo responder preguntas. Y un mentor humano " +
  "siempre forma parte del proceso, nunca reemplazado por la IA.\n\n" +
  "---\n\n" +
  "Pick a topic in the sidebar, or just type your question below. · Elige un tema en la barra " +
  "lateral, o simplemente escribe tu pregunta a continuación.";

// Fixed, hand-written one-line explanation of what each of the 37
// specialists actually covers — shown when a group card is expanded on
// the welcome screen (see MessageList.tsx's WelcomeScreen). Bilingual,
// "English | Español" — same convention as MODULE_NAMES. Deliberately
// NOT AI-generated: static copy the person can rely on being the same
// every time, and costs nothing to render.
export const MODULE_QUICK_EXPLANATIONS: Record<number, string> = {
  1: "How the Bible views welcoming the stranger and what that means for missions. | Cómo ve la Biblia la acogida al extranjero y qué significa para las misiones.",
  2: "The core doctrines every missionary needs to master before teaching others. | Las doctrinas centrales que todo misionero necesita dominar antes de enseñar a otros.",
  3: "The Bible's whole story, from Genesis to Revelation, as one narrative of God's mission. | La historia completa de la Biblia, de Génesis a Apocalipsis, como una sola narrativa de la misión de Dios.",
  4: "The great themes of the Christian faith (God, Christ, salvation, church) explained in depth. | Los grandes temas de la fe cristiana (Dios, Cristo, salvación, iglesia) explicados con profundidad.",
  5: "How to interpret the Bible correctly, avoiding misreadings caused by culture. | Cómo interpretar correctamente la Biblia, evitando lecturas erróneas por causa de la cultura.",
  6: "Why God sends his people into the world, from the perspective of all of Scripture. | Por qué Dios envía a su pueblo al mundo, desde la perspectiva de toda la Escritura.",
  7: "How to maintain a solid devotional life and real integrity of character in the field. | Cómo mantener una vida devocional sólida y un carácter íntegro en el campo.",
  8: "Emotional self-care and how to care for other missionaries around you. | Autocuidado emocional y cómo cuidar de otros misioneros a su alrededor.",
  9: "Recognizing and managing your own emotions — essential for lasting in the field. | Reconocer y administrar las propias emociones, esencial para durar en el campo.",
  10: "How to protect yourself from social engineering, surveillance, and digital risk in sensitive contexts. | Cómo protegerse de la ingeniería social, la vigilancia y los riesgos digitales en contextos sensibles.",
  11: "Recognizing the warning signs of burnout and moral failure before they happen. | Reconocer las señales de agotamiento y falla moral antes de que sucedan.",
  12: "Practical principles for serving effectively in a culture different from your own. | Principios prácticos para servir eficazmente en una cultura diferente a la suya.",
  13: "How to communicate clearly when cultural codes are different. | Cómo comunicarse con claridad cuando los códigos culturales son diferentes.",
  14: "The ability to adapt and function well in culturally diverse settings. | La capacidad de adaptarse y funcionar bien en entornos culturalmente diversos.",
  15: "The most common mistakes when reading the Bible through the wrong cultural lens. | Los errores más comunes al leer la Biblia a través de lentes culturales equivocados.",
  16: "How to form disciples in a way that makes sense in the local culture. | Cómo formar discípulos de una manera que tenga sentido en la cultura local.",
  17: "Leading teams and churches in contexts where leadership means different things. | Liderar equipos e iglesias en contextos donde el liderazgo significa cosas diferentes.",
  18: "Counseling people from another culture without imposing categories that don't make sense to them. | Aconsejar a personas de otra cultura sin imponer categorías que no tienen sentido para ellas.",
  19: "How to teach in a way that's actually understood, not just translated. | Cómo enseñar de una manera que realmente se comprenda, no solo se traduzca.",
  20: "Understanding how human societies work — essential for any mission strategy. | Entender cómo funcionan las sociedades humanas, esencial para cualquier estrategia misionera.",
  21: "How to study and understand outside religions, without judging or oversimplifying. | Cómo estudiar y entender religiones ajenas, sin juzgar ni simplificar.",
  22: "How to communicate the gospel faithfully without imposing a foreign culture. | Cómo comunicar el evangelio fielmente sin imponer cultura extranjera.",
  23: "How Christians in Africa, Asia, and Latin America read the faith, and why it matters. | Cómo los cristianos de África, Asia y América Latina interpretan la fe, y por qué importa.",
  24: "The methods and approaches most used in the mission field today. | Los métodos y enfoques más usados hoy en el campo misionero.",
  25: "How to plant churches that are genuinely local, not imported. | Cómo iniciar iglesias genuinamente locales, no importadas.",
  26: "Reaching migrated peoples, often more accessible than in their home country. | Alcanzar a pueblos que han migrado, muchas veces más accesibles que en su país de origen.",
  27: "How to meet a community's practical needs in a way that points to Christ. | Cómo servir necesidades prácticas de una comunidad de manera que apunte a Cristo.",
  28: "Telling Bible stories in a way that connects with oral cultures. | Contar historias bíblicas de una manera que conecte con culturas orales.",
  29: "What Buddhists, Hindus, Muslims, and others actually believe. | Lo que budistas, hindúes, musulmanes y otros realmente creen.",
  30: "Specific cultural and theological bridges for reaching Chinese people. | Puentes culturales y teológicos específicos para alcanzar a los chinos.",
  31: "How to present Christ to someone coming from a Buddhist worldview. | Cómo presentar a Cristo a quienes vienen de una cosmovisión budista.",
  32: "Specific bridges and challenges when evangelizing Hindus. | Puentes y desafíos específicos al evangelizar hindúes.",
  33: "How to dialogue with respect and clarity with Muslims. | Cómo dialogar con respeto y claridad con musulmanes.",
  34: "Points of agreement and difference when talking with Catholics. | Puntos de acuerdo y diferencia al conversar con católicos.",
  35: "Reaching people with no religious framework at all. | Alcanzar a quienes no tienen ningún referente religioso.",
  36: "How to respond to spiritual fear without falling into syncretism. | Cómo responder al miedo espiritual sin caer en sincretismo.",
  37: "Evangelizing where favor and patronage relationships shape everything. | Evangelizar donde las relaciones de favor y patronazgo lo moldean todo.",
};

// Fuller, clearer explanation of the Quiz and Case Study features
// themselves — shown when those two cards are expanded.
export const FEATURE_EXPLANATIONS: Record<string, string> = {
  "📝 Quiz Me":
    "A multiple-choice quiz generated specifically on the module you choose — 5 questions, " +
    "an explanation for every right and wrong answer, and immediate feedback. Useful for confirming what you " +
    "actually absorbed, not just what you read. | " +
    "Una prueba de opción múltiple generada específicamente sobre el módulo que elijas — 5 preguntas, " +
    "explicación de cada respuesta correcta e incorrecta, y retroalimentación inmediata. Sirve para " +
    "confirmar lo que realmente absorbiste, no solo lo que leíste.",
  "📚 Case Studies":
    "A real, detailed case study, written specifically to illustrate a dilemma from the chosen " +
    "module — with context, the challenge, the biblical principles at stake, discussion questions, and a " +
    "recommended approach. Useful for practicing hard decisions before facing them for real. | " +
    "Un estudio de caso real y detallado, escrito específicamente para ilustrar un dilema del módulo " +
    "elegido — con contexto, desafío, principios bíblicos involucrados, preguntas de discusión y un " +
    "enfoque recomendado. Sirve para practicar decisiones difíciles antes de enfrentarlas de verdad.",
};
