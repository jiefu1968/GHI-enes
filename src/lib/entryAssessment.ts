// Fixed 100-question entry diagnostic assessment — taken ONCE by a new
// missional Christian when they join the mentorship program, BEFORE
// using the multi-agent system in earnest. Purpose: give the human
// mentor a concrete picture of the person's existing theological and
// missiological knowledge (strengths and gaps), area by area, rather
// than starting completely blind.
//
// Deliberately NOT AI-generated: this is a fixed, hand-written question
// bank, identical for everyone, so results are comparable across people
// and over time — and so scoring is 100% deterministic (plain code, zero
// AI/token cost) rather than something an LLM has to grade.
//
// 20 questions per area (100 total), distributed across that area's
// modules roughly in proportion to how many modules it has:
//   foundations   (modules 1–6):   20 — 4,4,3,3,3,3
//   formation     (modules 7–11):  20 — 4,4,4,4,4
//   intercultural (modules 12–19): 20 — 3,3,3,3,2,2,2,2
//   strategy      (modules 20–27): 20 — 3,3,3,3,2,2,2,2
//   evangelism    (modules 28–37): 20 — 2,2,2,2,2,2,2,2,2,2
//
// Difficulty level is intentionally BASIC/diagnostic — this tests
// existing general knowledge someone should plausibly already have (or
// not) walking in the door, not mastery of the curriculum itself (that's
// what the per-module Quiz feature is for, after they've studied).

export type AssessmentArea = "foundations" | "formation" | "intercultural" | "strategy" | "evangelism";

export interface AssessmentQuestion {
  id: number;
  area: AssessmentArea;
  moduleNum: number;
  question_pt: string;
  question_es: string;
  options_pt: [string, string, string, string];
  options_es: [string, string, string, string];
  correct: number; // 0-3
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // ═══ FOUNDATIONS (modules 1-6) — 20 questions ═══
  // Module 1: Biblical Hospitality (4)
  {
    id: 1, area: "foundations", moduleNum: 1,
    question_pt: "Which of these is the most accurate definition of \"biblical hospitality\" (philoxenia)?",
    question_es: "¿Cuál de estas es la definición más precisa de \"hospitalidad bíblica\" (philoxenia)?",
    options_pt: ["Welcoming the stranger as if welcoming Christ, even without expecting anything in return", "Organizing social events at church", "Offering food to someone who asks on the street", "Being polite to guests we already know"],
    options_es: ["Acoger al extraño como si fuera Cristo, sin esperar nada a cambio", "Organizar eventos sociales en la iglesia", "Ofrecer comida a quien la pide en la calle", "Ser educado con visitas conocidas"],
    correct: 0,
  },
  {
    id: 2, area: "foundations", moduleNum: 1,
    question_pt: "In the book \"Radically Ordinary Hospitality,\" what is the main difference between hospitality and \"entertaining\"?",
    question_es: "En el libro \"Hospitalidad Radicalmente Común\", ¿cuál es la principal diferencia entre hospitalidad y \"entretenimiento\"?",
    options_pt: ["Hospitality is only for family", "Entertaining impresses guests; hospitality opens up someone's real, messy life to someone in need", "Entertaining is more biblical", "There is no real difference"],
    options_es: ["La hospitalidad es solo para la familia", "El entretenimiento impresiona a los invitados; la hospitalidad abre la vida real de alguien a quien lo necesita, incluso con el desorden", "El entretenimiento es más bíblico", "No hay diferencia real"],
    correct: 1,
  },
  {
    id: 3, area: "foundations", moduleNum: 1,
    question_pt: "In Genesis 18, Abraham receives three unknown visitors. What does this episode illustrate about hospitality?",
    question_es: "En Génesis 18, Abraham recibe a tres visitantes desconocidos. ¿Qué ilustra este episodio sobre la hospitalidad?",
    options_pt: ["That hospitality is optional for the believer", "That Abraham feared the visitors", "That in welcoming strangers, we may unknowingly be welcoming messengers of God", "That we should only host people we know"],
    options_es: ["Que la hospitalidad es opcional para el creyente", "Que Abraham temía a los visitantes", "Que al acoger extraños, podemos estar acogiendo mensajeros de Dios sin saberlo", "Que solo debemos hospedar a personas conocidas"],
    correct: 2,
  },
  {
    id: 4, area: "foundations", moduleNum: 1,
    question_pt: "How do shared meals function as \"mission\" in Jesus's ministry?",
    question_es: "¿Cómo funcionan las comidas compartidas como \"misión\" en el ministerio de Jesús?",
    options_pt: ["Jesus avoided eating with sinners to protect his reputation", "Jesus only ate alone in order to pray", "Meals were only formal religious rituals", "Jesus ate with sinners and the marginalized, breaking social barriers and demonstrating the Kingdom of God"],
    options_es: ["Jesús evitaba comer con pecadores para preservar su reputación", "Jesús solo comía solo para orar", "Las comidas eran solo rituales religiosos formales", "Jesús comía con pecadores y marginados, rompiendo barreras sociales y demostrando el Reino de Dios"],
    correct: 3,
  },
  // Module 2: Essential Teachings of the Christian Faith (4)
  {
    id: 5, area: "foundations", moduleNum: 2,
    question_pt: "What makes a doctrine \"essential\" (as opposed to secondary) in the Christian faith?",
    question_es: "¿Qué caracteriza a una doctrina como \"esencial\" (en oposición a secundaria) en la fe cristiana?",
    options_pt: ["It's something so central that denying it calls into question the identity of the gospel itself (e.g. the deity of Christ, the resurrection)", "It's a matter of cultural preference", "It's any doctrine mentioned in the Bible", "It's the doctrine most churches prefer"],
    options_es: ["Es algo tan central que negarlo pone en duda la identidad misma del evangelio (ej: divinidad de Cristo, resurrección)", "Es una cuestión de preferencia cultural", "Es cualquier doctrina mencionada en la Biblia", "Es la doctrina que prefiere la mayoría de las iglesias"],
    correct: 0,
  },
  {
    id: 6, area: "foundations", moduleNum: 2,
    question_pt: "Which statement correctly describes the doctrine of the Trinity?",
    question_es: "¿Qué afirmación describe correctamente la doctrina de la Trinidad?",
    options_pt: ["The Trinity is a later invention with no biblical basis", "One eternal God, in three distinct persons (Father, Son, and Holy Spirit), fully equal in essence", "God manifests in three different forms at different times", "Father, Son, and Spirit are three separate gods"],
    options_es: ["La Trinidad es una invención posterior sin base bíblica", "Un solo Dios eterno, en tres personas distintas (Padre, Hijo y Espíritu Santo), plenamente iguales en esencia", "Dios se manifiesta en tres formas diferentes en momentos distintos", "Padre, Hijo y Espíritu son tres dioses separados"],
    correct: 1,
  },
  {
    id: 7, area: "foundations", moduleNum: 2,
    question_pt: "According to biblical doctrine on salvation, how is a person saved?",
    question_es: "Según la doctrina bíblica de la salvación, ¿cómo es salva una persona?",
    options_pt: ["By their own good works accumulated over a lifetime", "By correctly following religious rituals", "By God's grace, through faith in Christ, not by their own merit", "By being born into a Christian family"],
    options_es: ["Por sus propias buenas obras acumuladas a lo largo de la vida", "Por seguir rituales religiosos correctamente", "Por la gracia de Dios, mediante la fe en Cristo, no por mérito propio", "Por nacer en una familia cristiana"],
    correct: 2,
  },
  {
    id: 8, area: "foundations", moduleNum: 2,
    question_pt: "What is the historic Christian position on the authority of Scripture?",
    question_es: "¿Cuál es la posición histórica cristiana sobre la autoridad de las Escrituras?",
    options_pt: ["Each tradition can rewrite the Bible however it wants", "The Bible is one book of wisdom among many others", "The Bible only has authority in the New Testament", "The Bible is the inspired Word of God and the final authority for faith and practice"],
    options_es: ["Cada tradición puede reescribir la Biblia como quiera", "La Biblia es un libro de sabiduría entre tantos otros", "La Biblia solo tiene autoridad en el Nuevo Testamento", "La Biblia es la Palabra inspirada de Dios y la autoridad final para la fe y la práctica"],
    correct: 3,
  },
  // Module 3: Biblical Panorama (3)
  {
    id: 9, area: "foundations", moduleNum: 3,
    question_pt: "Which of these best describes the overall structure of the Old Testament?",
    question_es: "¿Cuál de estas describe mejor la estructura general del Antiguo Testamento?",
    options_pt: ["The Pentateuch, historical books, poetic/wisdom books, and major and minor prophets", "It only contains prophecies about the future", "It's just a collection of laws with no narrative", "Only the Ten Commandments repeated"],
    options_es: ["Pentateuco, libros históricos, poéticos/sapienciales, y profetas mayores y menores", "Solo contiene profecías sobre el futuro", "Es solo una colección de leyes sin narrativa", "Solo los Diez Mandamientos repetidos"],
    correct: 0,
  },
  {
    id: 10, area: "foundations", moduleNum: 3,
    question_pt: "What unites the entire biblical narrative, from Genesis to Revelation, as a single thread?",
    question_es: "¿Qué une toda la narrativa bíblica, de Génesis a Apocalipsis, como un único hilo conductor?",
    options_pt: ["Only the history of Israel", "The story of redemption: God restoring a fallen world through Christ", "Isolated rules of moral conduct", "A random collection of unconnected stories"],
    options_es: ["Solo la historia de Israel", "La historia de la redención: Dios restaurando un mundo caído a través de Cristo", "Reglas de conducta moral aisladas", "Una colección aleatoria de historias sin conexión"],
    correct: 1,
  },
  {
    id: 11, area: "foundations", moduleNum: 3,
    question_pt: "What do the Gospels and the book of Acts, in the New Testament, mainly record?",
    question_es: "Los Evangelios y el libro de Hechos, en el Nuevo Testamento, ¿registran principalmente qué?",
    options_pt: ["Only Paul's doctrinal letters", "Prophecies about the end times", "The life, death, and resurrection of Jesus, and the expansion of the early church", "The history of Israel in the Old Testament"],
    options_es: ["Solo cartas doctrinales de Pablo", "Profecías sobre el fin de los tiempos", "La vida, muerte y resurrección de Jesús, y la expansión de la iglesia primitiva", "La historia de Israel en el Antiguo Testamento"],
    correct: 2,
  },
  // Module 4: Christian Theology (3)
  {
    id: 12, area: "foundations", moduleNum: 4,
    question_pt: "What does Christian doctrine affirm about the nature of Jesus Christ?",
    question_es: "¿Qué afirma la doctrina cristiana sobre la naturaleza de Jesucristo?",
    options_pt: ["He was only a great human teacher", "He became God after the resurrection", "He was an angel who appeared human", "He is fully God and fully man, at the same time"],
    options_es: ["Era solo un gran maestro humano", "Se convirtió en Dios después de la resurrección", "Era un ángel que parecía humano", "Es plenamente Dios y plenamente hombre, al mismo tiempo"],
    correct: 3,
  },
  {
    id: 13, area: "foundations", moduleNum: 4,
    question_pt: "What is \"systematic theology\"?",
    question_es: "¿Qué es la \"teología sistemática\"?",
    options_pt: ["The coherent, ordered organization of what the whole Bible teaches on each topic (God, humanity, salvation, etc.)", "A modern invention with no biblical value", "A random study of favorite verses", "Just one theologian's personal opinion"],
    options_es: ["La organización coherente y ordenada de lo que enseña toda la Biblia sobre cada tema (Dios, hombre, salvación, etc.)", "Una invención moderna sin valor bíblico", "Un estudio aleatorio de versículos favoritos", "Solo la opinión personal de un teólogo"],
    correct: 0,
  },
  {
    id: 14, area: "foundations", moduleNum: 4,
    question_pt: "Which of these is a biblical characteristic attributed to God (His \"attributes\")?",
    question_es: "¿Cuál de estas es una característica bíblica atribuida a Dios (sus \"atributos\")?",
    options_pt: ["He learns new things over time", "He is omniscient, omnipotent, and omnipresent, as well as holy and loving", "He has physical limitations like humans", "He frequently changes His mind"],
    options_es: ["Aprende cosas nuevas con el tiempo", "Es omnisciente, omnipotente y omnipresente, además de santo y amoroso", "Tiene limitaciones físicas como los humanos", "Cambia de opinión con frecuencia"],
    correct: 1,
  },
  // Module 5: Biblical Hermeneutics (3)
  {
    id: 15, area: "foundations", moduleNum: 5,
    question_pt: "What does \"biblical hermeneutics\" mean?",
    question_es: "¿Qué significa \"hermenéutica bíblica\"?",
    options_pt: ["The practice of reading the Bible aloud", "A synonym for automatic translation", "The science and art of correctly interpreting the biblical text, respecting its original context", "The art of memorizing verses"],
    options_es: ["La práctica de leer la Biblia en voz alta", "Un sinónimo de traducción automática", "La ciencia y el arte de interpretar correctamente el texto bíblico, respetando su contexto original", "El arte de memorizar versículos"],
    correct: 2,
  },
  {
    id: 16, area: "foundations", moduleNum: 5,
    question_pt: "What is \"eisegesis,\" and why is it considered an interpretive error?",
    question_es: "¿Qué es la \"eiségesis\", y por qué se considera un error de interpretación?",
    options_pt: ["It's translating from Hebrew to Greek", "It's simply reading the text aloud", "It's the correct, recommended method of Bible study", "It's importing one's own meanings or assumptions (or those of one's own culture) INTO the text, instead of drawing out what the text actually says"],
    options_es: ["Es la traducción del hebreo al griego", "Es simplemente leer el texto en voz alta", "Es el método correcto y recomendado de estudio bíblico", "Es importar significados y suposiciones propias (o de la propia cultura) HACIA el texto, en lugar de extraer lo que el texto realmente dice"],
    correct: 3,
  },
  {
    id: 17, area: "foundations", moduleNum: 5,
    question_pt: "Why does the original historical and cultural context of a biblical passage matter so much for its interpretation?",
    question_es: "¿Por qué el contexto histórico y cultural original de un pasaje bíblico importa tanto para su interpretación?",
    options_pt: ["Because understanding the original audience and circumstances prevents mistaken conclusions and reveals the author's intended meaning", "It doesn't matter — the text means whatever each reader wants", "Historical context is irrelevant because the Bible is timeless", "Only scholars need to worry about this"],
    options_es: ["Porque entender la audiencia original y las circunstancias evita conclusiones equivocadas y revela el sentido pretendido por el autor", "No importa — el texto significa lo que cada lector quiera", "El contexto histórico es irrelevante porque la Biblia es atemporal", "Solo los académicos necesitan preocuparse por esto"],
    correct: 0,
  },
  // Module 6: Theology of Missions (3)
  {
    id: 18, area: "foundations", moduleNum: 6,
    question_pt: "What does the Latin term \"Missio Dei\" (Mission of God) mean?",
    question_es: "¿Qué significa el término latino \"Missio Dei\" (Misión de Dios)?",
    options_pt: ["It's just the name of a missionary organization", "Mission belongs to God first; the church participates in the mission He is already carrying out in the world", "It refers only to historic Catholic missions", "Mission is the church's own initiative and property, not God's"],
    options_es: ["Es solo el nombre de una organización misionera", "La misión pertenece primero a Dios; la iglesia participa en la misión que Él ya está realizando en el mundo", "Se refiere solo a las misiones católicas históricas", "La misión es iniciativa y propiedad de la iglesia, no de Dios"],
    correct: 1,
  },
  {
    id: 19, area: "foundations", moduleNum: 6,
    question_pt: "The Great Commission (Matthew 28:18-20) commands the disciples to do what?",
    question_es: "La Gran Comisión (Mateo 28:18-20) ordena a los discípulos que hagan qué?",
    options_pt: ["Build grand temples", "Stay isolated while waiting for Christ's return", "Make disciples of all nations, baptizing and teaching", "Avoid contact with other cultures"],
    options_es: ["Que construyan templos grandiosos", "Que se queden aislados esperando el regreso de Cristo", "Que hagan discípulos de todas las naciones, bautizando y enseñando", "Que eviten el contacto con otras culturas"],
    correct: 2,
  },
  {
    id: 20, area: "foundations", moduleNum: 6,
    question_pt: "According to the biblical theology of mission, what is the central theme running through all of Scripture regarding the nations?",
    question_es: "Según la teología bíblica de la misión, ¿cuál es el tema central que recorre toda la Escritura en relación con las naciones?",
    options_pt: ["The nations are just an obstacle to God's plan", "God only cares about one specific people, ignoring the other nations", "Mission to the nations only began in the book of Acts", "From the promise to Abraham, God's purpose is to bless all the nations of the earth through him"],
    options_es: ["Las naciones son solo un obstáculo para el plan de Dios", "Dios solo se preocupa por un pueblo específico, ignorando a las demás naciones", "La misión a las naciones comenzó solo en el libro de Hechos", "Desde la promesa a Abraham, Dios tiene el propósito de bendecir a todas las naciones de la tierra a través de él"],
    correct: 3,
  },
  // ═══ FORMATION (modules 7-11) — 20 questions ═══
  // Module 7: Spiritual Life & Character (4)
  {
    id: 21, area: "formation", moduleNum: 7,
    question_pt: "Why is personal devotional life (prayer, Bible reading) considered foundational even before going to the mission field?",
    question_es: "¿Por qué la vida devocional personal (oración, lectura bíblica) se considera fundamental incluso antes de ir al campo misionero?",
    options_pt: ["Because ministry flows out of one's relationship with God — without it, a person ministers from their own depletable resources", "Only pastors need a devotional life", "It's just a religious formality with no practical effect", "Devotional life can be replaced by academic study"],
    options_es: ["Porque el ministerio fluye de la relación con Dios — sin eso, la persona ministra desde recursos propios agotables", "Solo los pastores necesitan tener vida devocional", "Es solo una formalidad religiosa sin efecto práctico", "La vida devocional es sustituible por el estudio académico"],
    correct: 0,
  },
  {
    id: 22, area: "formation", moduleNum: 7,
    question_pt: "What characterizes \"Christian character\" in the context of spiritual formation?",
    question_es: "¿Qué caracteriza al \"carácter cristiano\" en el contexto de la formación espiritual?",
    options_pt: ["Appearing spiritual in public", "Consistent inner transformation that reflects the fruit of the Spirit, not just outward behavior", "Rigidly following religious rules", "Being approved of by other people at church"],
    options_es: ["Aparentar espiritualidad en público", "La transformación interior y consistente que refleja el fruto del Espíritu, no solo el comportamiento externo", "Seguir reglas religiosas rígidamente", "Ser aprobado por otras personas en la iglesia"],
    correct: 1,
  },
  {
    id: 23, area: "formation", moduleNum: 7,
    question_pt: "What is a common risk when a missionary neglects their own spiritual formation over time?",
    question_es: "¿Cuál es un riesgo común cuando un misionero descuida su propia formación espiritual con el tiempo?",
    options_pt: ["No real risk, as long as the work stays productive", "This only affects people weak in faith", "Spiritual burnout, decisions driven by ego rather than calling, and moral vulnerability", "Greater efficiency in ministry"],
    options_es: ["Ningún riesgo real, mientras el trabajo sea productivo", "Esto solo afecta a personas débiles en la fe", "Agotamiento espiritual, decisiones motivadas por el ego en lugar del llamado, y vulnerabilidad moral", "Mayor eficiencia en el ministerio"],
    correct: 2,
  },
  {
    id: 24, area: "formation", moduleNum: 7,
    question_pt: "\"Christian spiritual formation\" mainly refers to what?",
    question_es: "\"Formación espiritual cristiana\" se refiere principalmente a qué?",
    options_pt: ["A one-time emotional experience", "A formal certification from a church", "A single, definitive academic course", "A continuous, lifelong process of becoming more like Christ"],
    options_es: ["Una experiencia emocional puntual", "Una certificación formal de una iglesia", "Un curso académico único y definitivo", "Un proceso continuo y de toda la vida de llegar a ser más semejante a Cristo"],
    correct: 3,
  },
  // Module 8: Caring for Self & Others (4)
  {
    id: 25, area: "formation", moduleNum: 8,
    question_pt: "Why is \"member care\" (caring for the missionary) considered essential in serious mission organizations?",
    question_es: "¿Por qué el \"member care\" (cuidado del misionario) se considera esencial en organizaciones misioneras serias?",
    options_pt: ["Missionaries without adequate support have a much higher risk of burnout, early departure from the field, and personal crises", "Only weak missionaries need care", "Personal care gets in the way of ministry productivity", "It's a dispensable luxury if the budget is tight"],
    options_es: ["Los misioneros sin apoyo adecuado tienen un riesgo mucho mayor de agotamiento, salida prematura del campo y crisis personales", "Solo los misioneros débiles necesitan cuidado", "El cuidado personal obstaculiza la productividad ministerial", "Es un lujo prescindible si el presupuesto es ajustado"],
    correct: 0,
  },
  {
    id: 26, area: "formation", moduleNum: 8,
    question_pt: "What is a healthy self-care practice recommended for missionaries in the field?",
    question_es: "¿Cuál es una práctica saludable de autocuidado recomendada para misioneros en el campo?",
    options_pt: ["Avoiding any form of leisure because it's \"worldly\"", "Maintaining healthy boundaries, regular rest, and supportive connections, while acknowledging one's own human limits", "Working without rest to maximize results", "Hiding every sign of difficulty from colleagues"],
    options_es: ["Evitar cualquier forma de ocio por ser \"mundano\"", "Mantener límites saludables, descanso regular y conexiones de apoyo, reconociendo los propios límites humanos", "Trabajar sin descanso para maximizar resultados", "Ocultar toda señal de dificultad de los colegas"],
    correct: 1,
  },
  {
    id: 27, area: "formation", moduleNum: 8,
    question_pt: "How can missionaries effectively \"care for one another\" on a team?",
    question_es: "¿Cómo pueden los misioneros cuidar efectivamente unos de otros en equipo?",
    options_pt: ["Leaving that only to the organization's leaders", "Competing with each other over results", "Creating spaces of mutual honesty, regularly checking on each other's well-being, and not hiding struggles", "Avoiding any conversation about personal struggles"],
    options_es: ["Dejando esto solo para los líderes de la organización", "Compitiendo entre sí por resultados", "Creando espacios de honestidad mutua, revisando el bienestar mutuo regularmente, y no ocultando las dificultades", "Evitando cualquier conversación sobre dificultades personales"],
    correct: 2,
  },
  {
    id: 28, area: "formation", moduleNum: 8,
    question_pt: "What commonly precedes an emotional breakdown or early departure from the mission field, according to member care research?",
    question_es: "¿Qué suele preceder a un colapso emocional o salida prematura del campo misionero, según estudios de member care?",
    options_pt: ["It always happens suddenly, with no prior signs", "It only happens to theologically unprepared missionaries", "It's always caused by a single isolated traumatic event", "There are often gradual signs of isolation, burnout, and lack of support that go unnoticed"],
    options_es: ["Siempre ocurre de repente, sin señales previas", "Solo ocurre con misioneros teológicamente mal preparados", "Siempre es causado por un único evento traumático aislado", "Frecuentemente hay señales graduales de aislamiento, agotamiento y falta de apoyo que pasan desapercibidas"],
    correct: 3,
  },
  // Module 9: Emotional Intelligence (4)
  {
    id: 29, area: "formation", moduleNum: 9,
    question_pt: "What is \"emotional intelligence\" (according to Daniel Goleman's model)?",
    question_es: "¿Qué es la \"inteligencia emocional\" (según el modelo de Daniel Goleman)?",
    options_pt: ["The ability to recognize, understand, and manage one's own emotions and those of others", "The total absence of negative feelings", "The ability to completely suppress emotions", "A synonym for IQ (logical intelligence)"],
    options_es: ["La capacidad de reconocer, entender y administrar las propias emociones y las de los demás", "La ausencia total de sentimientos negativos", "La capacidad de suprimir completamente las emociones", "Un sinónimo de CI (inteligencia lógica)"],
    correct: 0,
  },
  {
    id: 30, area: "formation", moduleNum: 9,
    question_pt: "Why does emotional intelligence require caution when applied across different cultures?",
    question_es: "¿Por qué la inteligencia emocional exige precaución al aplicarse entre culturas diferentes?",
    options_pt: ["Emotional intelligence only exists in Western cultures", "Norms about appropriate emotional expression vary culturally, so what's \"intelligent\" in one culture may be misread in another", "It doesn't change at all between cultures — it's universal and identical everywhere", "Emotions don't exist in some cultures"],
    options_es: ["Solo existe la inteligencia emocional en culturas occidentales", "Las normas sobre la expresión emocional apropiada varían culturalmente, así que lo \"inteligente\" en una cultura puede malinterpretarse en otra", "No cambia nada entre culturas, es universal e idéntica en todas partes", "Las emociones no existen en algunas culturas"],
    correct: 1,
  },
  {
    id: 31, area: "formation", moduleNum: 9,
    question_pt: "What is \"empathy\" in the context of emotional intelligence applied to ministry?",
    question_es: "¿Qué es la \"empatía\" en el contexto de la inteligencia emocional aplicada al ministerio?",
    options_pt: ["Feeling superficial pity for someone", "A skill that can't be developed — you're either born with it or not", "The ability to genuinely perceive and consider another person's emotional experience, without necessarily agreeing", "Agreeing with everything the other person says or feels"],
    options_es: ["Sentir lástima por alguien de forma superficial", "Una habilidad que no se puede desarrollar, solo se nace con ella", "La capacidad de percibir y considerar genuinamente la experiencia emocional del otro, sin necesariamente estar de acuerdo", "Estar de acuerdo con todo lo que la otra persona dice o siente"],
    correct: 2,
  },
  {
    id: 32, area: "formation", moduleNum: 9,
    question_pt: "How does emotional intelligence relate to resilience in difficult ministry contexts?",
    question_es: "¿Cómo se relaciona la inteligencia emocional con la resiliencia en contextos ministeriales difíciles?",
    options_pt: ["They have no relationship at all", "Emotional intelligence is irrelevant in a crisis", "Resilience means never feeling hardship", "Self-awareness and emotional self-regulation help a person process hardship without being overwhelmed by it"],
    options_es: ["No tienen ninguna relación", "La inteligencia emocional es irrelevante en las crisis", "La resiliencia significa nunca sentir dificultad", "La autoconciencia y la autorregulación emocional ayudan a la persona a procesar las dificultades sin ser dominada por ellas"],
    correct: 3,
  },
  // Module 10: Security-Minded Culture (4)
  {
    id: 33, area: "formation", moduleNum: 10,
    question_pt: "What does it mean to have a healthy \"security-minded culture,\" given the principle that \"paranoia is the opposite of real security\"?",
    question_es: "¿Qué significa tener una \"cultura de seguridad\" saludable, según el principio de que \"la paranoia es lo opuesto a la seguridad real\"?",
    options_pt: ["Ongoing, practical discernment without living paralyzed by fear — clarity, pragmatism, self-control, and dependence on God", "Never using digital technology", "Blindly trusting anyone who presents themselves as a believer", "Living in constant fear of any new contact"],
    options_es: ["Discernimiento práctico y continuo, sin vivir paralizado por el miedo — claridad, pragmatismo, autocontrol y dependencia de Dios", "Nunca usar tecnología digital", "Confiar ciegamente en cualquier persona que se presente como creyente", "Vivir con miedo constante de cualquier contacto nuevo"],
    correct: 0,
  },
  {
    id: 34, area: "formation", moduleNum: 10,
    question_pt: "What is \"pretexting\" (a common social engineering technique)?",
    question_es: "¿Qué es el \"pretexting\" (una técnica común de ingeniería social)?",
    options_pt: ["A recommended security practice for protecting yourself", "Inventing a plausible false identity or reason to approach someone and obtain sensitive information", "A method of data encryption", "A type of computer virus"],
    options_es: ["Una práctica de seguridad recomendada para protegerse", "Inventar una identidad o motivo falso y plausible para acercarse a alguien y obtener información sensible", "Un método de encriptación de datos", "Un tipo de virus informático"],
    correct: 1,
  },
  {
    id: 35, area: "formation", moduleNum: 10,
    question_pt: "Why can posting information and location on social media be risky for missionaries in sensitive contexts?",
    question_es: "¿Por qué publicar información y ubicación en redes sociales puede ser riesgoso para misioneros en contextos sensibles?",
    options_pt: ["Social media is always safe for ministry use", "There's no real risk in this at all", "That information can be used by hostile actors (OSINT) to map networks of local believers and put people at risk", "Only Western governments monitor social media"],
    options_es: ["Las redes sociales siempre son seguras para uso ministerial", "No hay ningún riesgo real en esto", "Esa información puede ser usada por actores hostiles (OSINT) para mapear redes de creyentes locales y poner a personas en riesgo", "Solo los gobiernos occidentales monitorean las redes sociales"],
    correct: 2,
  },
  {
    id: 36, area: "formation", moduleNum: 10,
    question_pt: "When communicating with a missionary in a restricted-access country, what should be avoided in letters, emails, or messages?",
    question_es: "Al comunicarse con un misionero en un país de acceso restringido, ¿qué se debe evitar en cartas, correos o mensajes?",
    options_pt: ["Asking about the local weather", "Sending family photos", "Asking about the person's health", "Mentioning terms like \"mission,\" \"gospel,\" or the names of other local believers and churches"],
    options_es: ["Preguntar sobre el clima local", "Enviar fotos de la familia", "Preguntar sobre la salud de la persona", "Mencionar términos como \"misión\", \"evangelio\", o nombres de otros creyentes locales e iglesias"],
    correct: 3,
  },
  // Module 11: Preventing Ministry Failure (4)
  {
    id: 37, area: "formation", moduleNum: 11,
    question_pt: "What is the \"god complex\" in the context of ministry failure?",
    question_es: "¿Qué es el \"complejo de Dios\" en el contexto del fracaso ministerial?",
    options_pt: ["Forgetting that the ministry belongs to God, treating its results as a reflection of one's own personal worth", "A synonym for excessive humility", "A trait found only in very experienced leaders", "A diagnosable mental illness"],
    options_es: ["Olvidar que el ministerio pertenece a Dios, tratando los resultados como reflejo del propio valor personal", "Un sinónimo de humildad excesiva", "Una característica solo de líderes muy experimentados", "Una enfermedad mental diagnosticable"],
    correct: 0,
  },
  {
    id: 38, area: "formation", moduleNum: 11,
    question_pt: "What is the correct sequence of restoration for someone who went through a moral failure in ministry?",
    question_es: "¿Cuál es la secuencia correcta de restauración para alguien que pasó por una falla moral en el ministerio?",
    options_pt: ["There's no need for any formal process", "Genuine confession and repentance, reconciliation and restitution, and the gradual rebuilding of a trustworthy daily life", "Hide what happened to protect the ministry's reputation", "Return immediately to public leadership to prove everything is fine"],
    options_es: ["No hay necesidad de ningún proceso formal", "Confesión y arrepentimiento genuinos, reconciliación y restitución, y reconstrucción gradual de una vida diaria confiable", "Ocultar lo ocurrido para proteger la reputación del ministerio", "Volver inmediatamente al liderazgo público para demostrar que todo está bien"],
    correct: 1,
  },
  {
    id: 39, area: "formation", moduleNum: 11,
    question_pt: "According to the \"Seven Foundation Stones\" principle for sustainable ministry, which of these is one of them?",
    question_es: "Según el principio de las \"Siete Piedras Fundamentales\" para un ministerio sostenible, ¿cuál de estas es una de ellas?",
    options_pt: ["Avoiding any form of rest", "Total isolation from other believers", "Intimacy with God and with people, calling, and healthy boundaries", "Personal ambition and the pursuit of recognition"],
    options_es: ["Evitar cualquier forma de descanso", "Aislamiento total de otros creyentes", "Intimidad con Dios y con las personas, llamado, y límites saludables", "Ambición personal y búsqueda de reconocimiento"],
    correct: 2,
  },
  {
    id: 40, area: "formation", moduleNum: 11,
    question_pt: "What does the book \"Humilitas\" argue about the relationship between humility and effective leadership?",
    question_es: "¿Qué argumenta el libro \"Humilitas\" sobre la relación entre humildad y liderazgo eficaz?",
    options_pt: ["Humility is a sign of weakness and gets in the way of leadership", "Only authoritarian leaders get results", "Humility means never having your own opinion", "The most genuinely influential leaders tend to combine strong conviction with real humility, not self-promotion"],
    options_es: ["La humildad es señal de debilidad y obstaculiza el liderazgo", "Solo los líderes autoritarios logran resultados", "La humildad significa nunca tener opinión propia", "Los líderes más influyentes de verdad suelen combinar convicción fuerte con humildad genuina, no autopromoción"],
    correct: 3,
  },
  // ═══ INTERCULTURAL (modules 12-19) — 20 questions ═══
  // Module 12: Ministering Cross-Culturally (3)
  {
    id: 41, area: "intercultural", moduleNum: 12,
    question_pt: "What is the \"incarnational model\" of intercultural ministry (based on Lingenfelter and Mayers)?",
    question_es: "¿Qué es el \"modelo encarnacional\" de ministerio intercultural (basado en Lingenfelter y Mayers)?",
    options_pt: ["Following the example of Christ, who became \"flesh\" (the Incarnation) and truly entered human experience, adapting deeply to the culture of others", "Imposing the missionary's own culture onto the local culture", "A purely academic method with no practical application", "Avoiding any contact with the local culture"],
    options_es: ["Seguir el ejemplo de Cristo, que se hizo \"carne\" (Encarnación) y entró verdaderamente en la experiencia humana, adaptándose profundamente a la cultura del otro", "Imponer la propia cultura del misionero sobre la cultura local", "Un método puramente académico sin aplicación práctica", "Evitar cualquier contacto con la cultura local"],
    correct: 0,
  },
  {
    id: 42, area: "intercultural", moduleNum: 12,
    question_pt: "According to the \"Three Worldviews\" model (3D Gospel — guilt/innocence, shame/honor, fear/power), why do these categories matter for ministry?",
    question_es: "Según el modelo de las \"Tres Cosmovisiones\" (3D Gospel — culpa/inocencia, vergüenza/honor, miedo/poder), ¿por qué importan estas categorías para el ministerio?",
    options_pt: ["Only the guilt/innocence category is biblical", "Different cultures emphasize different moral categories, and the gospel fully answers all of them — presenting it in a balanced way increases understanding", "These categories are secular theories with no basis in Scripture", "They don't matter — the gospel is always presented the same way in every culture"],
    options_es: ["Solo la categoría de culpa/inocencia es bíblica", "Culturas diferentes enfatizan categorías morales distintas, y el evangelio responde plenamente a todas ellas — presentarlo de forma equilibrada aumenta la comprensión", "Estas categorías son teorías seculares sin base en las Escrituras", "No importan — el evangelio siempre se presenta de la misma forma en toda cultura"],
    correct: 1,
  },
  {
    id: 43, area: "intercultural", moduleNum: 12,
    question_pt: "What is \"receptor-oriented communication\" (a concept from Charles Kraft)?",
    question_es: "¿Qué es la \"comunicación orientada al receptor\" (concepto de Charles Kraft)?",
    options_pt: ["A method that completely ignores the content of the message", "A technique used only in secular marketing", "Adapting the way you communicate so the message is understood as intended by the audience, not just transmitted the communicator's way", "Speaking the same way no matter who is listening"],
    options_es: ["Un método que ignora completamente el contenido del mensaje", "Una técnica exclusiva de marketing secular", "Adaptar la forma de comunicar para que el mensaje se comprenda como se pretende por parte de la audiencia, no solo transmitirlo a la manera del comunicador", "Hablar de la misma manera sin importar quién esté escuchando"],
    correct: 2,
  },
  // Module 13: Intercultural Communication (3)
  {
    id: 44, area: "intercultural", moduleNum: 13,
    question_pt: "What is the difference between \"high-context\" and \"low-context\" cultures in communication?",
    question_es: "¿Cuál es la diferencia entre culturas de \"alto contexto\" y \"bajo contexto\" en la comunicación?",
    options_pt: ["High-context means speaking more loudly", "Low-context means less developed cultures", "There's no real difference between them", "High-context cultures communicate a great deal through implicit cues and relationship; low-context cultures value explicit, direct messages"],
    options_es: ["Alto contexto significa hablar más alto", "Bajo contexto significa culturas menos desarrolladas", "No hay diferencia real entre ellas", "Las culturas de alto contexto comunican mucho a través de señales implícitas y relación; las de bajo contexto valoran mensajes explícitos y directos"],
    correct: 3,
  },
  {
    id: 45, area: "intercultural", moduleNum: 13,
    question_pt: "Why does nonverbal communication (gestures, physical distance, silence) deserve special attention in intercultural contexts?",
    question_es: "¿Por qué la comunicación no verbal (gestos, distancia física, silencio) merece atención especial en contextos interculturales?",
    options_pt: ["The meaning of gestures, personal space, and silence varies widely between cultures, and can cause serious misunderstandings if ignored", "Nonverbal communication only matters in \"primitive\" cultures", "Nonverbal communication is the same in every culture", "Only verbal communication really matters"],
    options_es: ["El significado de los gestos, el espacio personal y el silencio varía mucho entre culturas, pudiendo generar malentendidos serios si se ignora", "Lo no verbal solo importa en culturas \"primitivas\"", "La comunicación no verbal es igual en todas las culturas", "Solo la comunicación verbal importa de verdad"],
    correct: 0,
  },
  {
    id: 46, area: "intercultural", moduleNum: 13,
    question_pt: "What is a common mistake when translating the gospel into another language/culture?",
    question_es: "¿Cuál es un error común al traducir el evangelio a otro idioma/cultura?",
    options_pt: ["There are no real risks in translating the gospel", "Translating in a technically correct way but using terms that carry inappropriate or offensive cultural meanings without realizing it", "Every literal translation is automatically the most accurate", "Translations always perfectly preserve the original meaning"],
    options_es: ["No hay riesgos reales en la traducción del evangelio", "Traducir de forma técnicamente correcta pero usando términos que cargan sentidos culturales inadecuados u ofensivos sin darse cuenta", "Toda traducción literal es automáticamente la más precisa", "Las traducciones siempre preservan perfectamente el sentido original"],
    correct: 1,
  },
  // Module 14: Intercultural Intelligence (3)
  {
    id: 47, area: "intercultural", moduleNum: 14,
    question_pt: "What is \"CQ\" (Cultural Intelligence), according to David Livermore's four-factor model?",
    question_es: "¿Qué es el \"CQ\" (Inteligencia Cultural), según el modelo de cuatro factores de David Livermore?",
    options_pt: ["An IQ test adapted for different languages", "A simple synonym for \"speaking several languages\"", "The ability to function effectively in culturally diverse contexts, involving motivation, knowledge, strategy, and action", "An innate ability that can't be developed"],
    options_es: ["Una prueba de CI adaptada para diferentes idiomas", "Un sinónimo simple de \"hablar varios idiomas\"", "La capacidad de funcionar eficazmente en contextos culturalmente diversos, involucrando motivación, conocimiento, estrategia y acción", "Una habilidad innata que no se puede desarrollar"],
    correct: 2,
  },
  {
    id: 48, area: "intercultural", moduleNum: 14,
    question_pt: "According to Hofstede's cultural dimensions, what does the \"individualism vs. collectivism\" dimension describe?",
    question_es: "Según las dimensiones culturales de Hofstede, ¿qué describe la dimensión \"individualismo vs. colectivismo\"?",
    options_pt: ["How much a society values modern technology", "How religious a society is", "The number of laws in a country", "The degree to which people see themselves as independent individuals versus interconnected members of a group"],
    options_es: ["Cuánto valora una sociedad la tecnología moderna", "El nivel de religiosidad de una sociedad", "La cantidad de leyes en un país", "El grado en que las personas se ven a sí mismas como individuos independientes versus miembros interconectados de un grupo"],
    correct: 3,
  },
  {
    id: 49, area: "intercultural", moduleNum: 14,
    question_pt: "Why is \"culture shock\" a normal, expected experience, not a sign of failure?",
    question_es: "¿Por qué el \"choque cultural\" es una experiencia normal y esperada, no una señal de fracaso?",
    options_pt: ["Because adapting to completely different norms, values, and routines is a natural psychological process every human being goes through", "Culture shock doesn't really exist", "Because only weak people experience culture shock", "It only happens to people who didn't study enough before traveling"],
    options_es: ["Porque adaptarse a normas, valores y rutinas completamente diferentes es un proceso psicológico natural que todo ser humano atraviesa", "El choque cultural no existe de verdad", "Porque solo las personas débiles sienten choque cultural", "Solo ocurre a quien no estudió lo suficiente antes de viajar"],
    correct: 0,
  },
  // Module 15: Misreading the Scripture (3)
  {
    id: 50, area: "intercultural", moduleNum: 15,
    question_pt: "According to the book \"Misreading Scripture with Western Eyes,\" what is a common risk for Western readers of the Bible?",
    question_es: "Según el libro \"Malinterpretando las Escrituras con Ojos Occidentales\", ¿cuál es un riesgo común para los lectores occidentales de la Biblia?",
    options_pt: ["The Bible was originally written in English", "Projecting modern Western cultural categories (individualism, rigid linear time) onto a text originally written in a collectivist ancient Middle Eastern culture", "Only non-Western readers make interpretive mistakes", "None — Western readers interpret the Bible in a neutral, universal way"],
    options_es: ["La Biblia fue escrita originalmente en inglés", "Proyectar categorías culturales occidentales modernas (individualismo, tiempo lineal rígido) sobre un texto escrito originalmente en una cultura colectivista del Oriente Medio antiguo", "Solo los lectores no occidentales cometen errores de interpretación", "Ninguno — los lectores occidentales interpretan la Biblia de forma neutral y universal"],
    correct: 1,
  },
  {
    id: 51, area: "intercultural", moduleNum: 15,
    question_pt: "How can an \"individualistic\" reading distort the meaning of biblical promises originally given to a community?",
    question_es: "¿Cómo puede una lectura \"individualista\" distorsionar el sentido de promesas bíblicas originalmente dadas a una comunidad?",
    options_pt: ["It doesn't distort anything, since the Bible has always spoken only of individuals", "It's always the correct interpretation", "It can lead the reader to apply, in isolation to themselves, promises that were originally for God's people as a collective", "It only affects the Psalms"],
    options_es: ["No distorsiona nada, pues la Biblia siempre habló solo de individuos", "Siempre es la interpretación correcta", "Puede hacer que el lector se aplique a sí mismo, de forma aislada, promesas que originalmente eran para el pueblo de Dios como colectivo", "Solo afecta a los Salmos"],
    correct: 2,
  },
  {
    id: 52, area: "intercultural", moduleNum: 15,
    question_pt: "According to \"Jesus Through Middle Eastern Eyes\" (Kenneth Bailey), why does understanding ancient Middle Eastern customs illuminate Jesus's parables?",
    question_es: "Según \"Jesús a través de Ojos del Medio Oriente\" (Kenneth Bailey), ¿por qué entender las costumbres del Medio Oriente antiguo ilumina las parábolas de Jesús?",
    options_pt: ["This is just academic theory with no practical application", "It doesn't illuminate anything — parables are self-explanatory in any culture", "Jesus didn't use local customs in His teaching", "Many details (hospitality, family honor, social roles) make more sense and reveal layers of meaning when seen through the original cultural context"],
    options_es: ["Esto es solo una teoría académica sin aplicación práctica", "No ilumina nada — las parábolas se explican por sí mismas en cualquier cultura", "Jesús no usaba costumbres locales en sus enseñanzas", "Muchos detalles (hospitalidad, honor familiar, roles sociales) tienen más sentido y revelan capas de significado cuando se ven a través del contexto cultural original"],
    correct: 3,
  },
  // Module 16: Intercultural Discipleship (2)
  {
    id: 53, area: "intercultural", moduleNum: 16,
    question_pt: "Why might a discipleship curriculum developed in the West need adaptation in another culture?",
    question_es: "¿Por qué un currículo de discipulado desarrollado en Occidente puede necesitar adaptación en otra cultura?",
    options_pt: ["Because assumptions, examples, and learning structures may not match how people in that culture process information and relationship", "It needs no adaptation at all — discipleship is always identical everywhere", "Discipleship curricula can never be adapted without losing biblical fidelity", "Only locally written curricula have any value"],
    options_es: ["Porque los supuestos, ejemplos y estructuras de aprendizaje pueden no corresponder a la forma en que las personas de esa cultura procesan información y relación", "No necesita ninguna adaptación — el discipulado es siempre idéntico en cualquier lugar", "Los currículos de discipulado nunca pueden adaptarse sin perder fidelidad bíblica", "Solo los currículos escritos localmente tienen valor"],
    correct: 0,
  },
  {
    id: 54, area: "intercultural", moduleNum: 16,
    question_pt: "What did Dietrich Bonhoeffer mean by \"cheap grace\" in \"The Cost of Discipleship\"?",
    question_es: "¿Qué quiso decir Dietrich Bonhoeffer con \"gracia barata\" en \"El Costo del Discipulado\"?",
    options_pt: ["That God's grace should literally cost money", "Forgiveness without real repentance, discipleship without genuine commitment — receiving the benefits of grace without the call to follow Christ", "An efficient, low-cost method of evangelism", "A concept with no relevance today"],
    options_es: ["Que la gracia de Dios debería costar dinero literal", "Perdón sin arrepentimiento real, discipulado sin compromiso genuino — recibir los beneficios de la gracia sin el llamado a seguir a Cristo", "Un método de evangelismo eficiente y barato", "Un concepto sin relevancia hoy"],
    correct: 1,
  },
  // Module 17: Intercultural Leadership (2)
  {
    id: 55, area: "intercultural", moduleNum: 17,
    question_pt: "Why might Western leadership styles (e.g. participative/horizontal leadership) not work well in high power-distance cultures?",
    question_es: "¿Por qué los estilos de liderazgo occidentales (ej: liderazgo participativo/horizontal) pueden no funcionar bien en culturas de alta distancia de poder?",
    options_pt: ["Participative leadership is always superior in any context", "Power distance is a concept with no real basis", "In high power-distance cultures, openly asking subordinates for their opinions can be interpreted as weakness or insecurity in the leader", "They work equally well in any culture without adjustment"],
    options_es: ["El liderazgo participativo siempre es superior en cualquier contexto", "La distancia de poder es un concepto sin base real", "En culturas de alta distancia de poder, pedir opiniones abiertamente a subordinados puede interpretarse como debilidad o inseguridad del líder", "Funcionan igualmente bien en cualquier cultura sin ajuste"],
    correct: 2,
  },
  {
    id: 56, area: "intercultural", moduleNum: 17,
    question_pt: "According to Lingenfelter, what does it mean to \"lead interculturally\" effectively?",
    question_es: "Según Lingenfelter, ¿qué significa \"liderar interculturalmente\" de forma eficaz?",
    options_pt: ["Copying the host culture's leadership style exactly, without discernment", "Imposing one's own leadership style regardless of context", "Avoiding any leadership position in another culture", "Deeply understanding local cultural values and expectations about leadership, adapting without abandoning biblical principles"],
    options_es: ["Copiar exactamente el estilo de liderazgo de la cultura anfitriona sin discernimiento", "Imponer el propio estilo de liderazgo independientemente del contexto", "Evitar cualquier posición de liderazgo en otra cultura", "Entender profundamente los valores y expectativas culturales locales sobre el liderazgo, adaptándose sin abandonar los principios bíblicos"],
    correct: 3,
  },
  // Module 18: Intercultural Counseling (2)
  {
    id: 57, area: "intercultural", moduleNum: 18,
    question_pt: "Why might Western counseling techniques (focused on individual introspection) need adaptation in collectivist cultures?",
    question_es: "¿Por qué las técnicas de consejería occidentales (centradas en la introspección individual) pueden necesitar adaptación en culturas colectivistas?",
    options_pt: ["In collectivist cultures, personal problems are often understood and resolved in the context of family/community, not just individually", "There's only one valid counseling method in the entire world", "They need no adaptation at all", "Counseling doesn't exist in collectivist cultures"],
    options_es: ["En culturas colectivistas, los problemas personales suelen entenderse y resolverse en el contexto de la familia/comunidad, no solo individualmente", "Solo existe un método válido de consejería en todo el mundo", "No necesitan ninguna adaptación", "La consejería no existe en culturas colectivistas"],
    correct: 0,
  },
  {
    id: 58, area: "intercultural", moduleNum: 18,
    question_pt: "What does \"Christ-centered biblical counseling\" mean?",
    question_es: "¿Qué significa la \"consejería bíblica centrada en Cristo\"?",
    options_pt: ["Completely ignoring modern psychology", "Integrating sound biblical principles with genuine care for the person, pointing to Christ as the ultimate source of transformation and hope", "A method that never listens to the person's real problems", "Counseling only with verses, with no active listening at all"],
    options_es: ["Ignorar completamente la psicología moderna", "Integrar principios bíblicos sólidos con el cuidado genuino por la persona, apuntando a Cristo como fuente última de transformación y esperanza", "Un método que nunca escucha los problemas reales de la persona", "Aconsejar solo con versículos, sin ninguna escucha activa"],
    correct: 1,
  },
  // Module 19: Teaching in Other Cultures (2)
  {
    id: 59, area: "intercultural", moduleNum: 19,
    question_pt: "Why does teaching theology in \"oral\" contexts (cultures that prefer spoken stories to written texts) require different methods?",
    question_es: "¿Por qué enseñar teología en contextos de \"oralidad\" (culturas que prefieren historias habladas a textos escritos) requiere métodos diferentes?",
    options_pt: ["It requires no different method — everyone learns the same way", "Oral cultures can't learn deep theology", "Methods based on reading/writing may not engage or be accessible to those who learn primarily through oral narrative, memorization, and repetition", "Only academic books are valid for teaching theology"],
    options_es: ["No requiere ningún método diferente — todos aprenden de la misma forma", "Las culturas orales no pueden aprender teología profunda", "Los métodos basados en lectura/escritura pueden no involucrar o ser accesibles para quien aprende principalmente por narrativa oral, memorización y repetición", "Solo los libros académicos son válidos para enseñar teología"],
    correct: 2,
  },
  {
    id: 60, area: "intercultural", moduleNum: 19,
    question_pt: "What is Elmer's \"Cross-Cultural Teaching Framework,\" in general terms?",
    question_es: "¿Qué es el marco de \"Enseñanza Intercultural\" de Elmer, en términos generales?",
    options_pt: ["A fixed method applied equally without considering the audience", "A purely secular theory with no ministry value", "A system that replaces the need to study theology", "An approach that adjusts teaching style, pace, and method to the learner's cultural context, while keeping the biblical content faithful"],
    options_es: ["Un método fijo aplicado por igual sin considerar a la audiencia", "Una teoría puramente secular sin valor ministerial", "Un sistema que reemplaza la necesidad de estudiar teología", "Un enfoque que ajusta el estilo, ritmo y método de enseñanza al contexto cultural del alumno, manteniendo el contenido bíblico fiel"],
    correct: 3,
  },
  // ═══ STRATEGY (modules 20-27) — 20 questions ═══
  // Module 20: Mission Anthropology (3)
  {
    id: 61, area: "strategy", moduleNum: 20,
    question_pt: "Why is anthropology considered a useful tool (not a substitute for theology) for missionaries?",
    question_es: "¿Por qué la antropología se considera una herramienta útil (no sustituta de la teología) para los misioneros?",
    options_pt: ["It helps in understanding how human societies actually function, which informs more effective communication and contextualization of the gospel", "Anthropology and mission have no relationship at all", "It's a purely secular discipline with no ministry use", "It completely replaces the need for theology"],
    options_es: ["Ayuda a entender cómo funcionan realmente las sociedades humanas, lo que informa una comunicación y contextualización más eficaces del evangelio", "La antropología y la misión no tienen ninguna relación", "Es una disciplina puramente secular sin uso ministerial", "Sustituye completamente la necesidad de la teología"],
    correct: 0,
  },
  {
    id: 62, area: "strategy", moduleNum: 20,
    question_pt: "What did Paul Hiebert mean by \"the excluded middle\" in the Western worldview?",
    question_es: "¿Qué quiso decir Paul Hiebert con \"lo excluido de en medio\" (the excluded middle) en la cosmovisión occidental?",
    options_pt: ["It's a concept only about geography", "The Western worldview tends to think in terms of science (the \"low\") and formal theology (the \"high\"), but ignores or denies the middle level of everyday supernatural experience that many cultures live with", "The Western worldview handles everyday supernatural things (spirits, witchcraft) just as well as science and formal theology", "It refers to the middle class in Western societies"],
    options_es: ["Es un concepto solo sobre geografía", "La cosmovisión occidental tiende a pensar en términos de ciencia (lo \"alto\") y teología formal (lo \"muy alto\"), pero ignora o niega el nivel intermedio de lo sobrenatural cotidiano que muchas culturas viven", "La cosmovisión occidental maneja bien lo sobrenatural cotidiano (espíritus, brujería) tanto como la ciencia y la teología formal", "Se refiere a la clase media en sociedades occidentales"],
    correct: 1,
  },
  {
    id: 63, area: "strategy", moduleNum: 20,
    question_pt: "What does \"transforming worldviews\" mean, according to Hiebert, in the discipleship process?",
    question_es: "¿Qué significa \"transformar cosmovisiones\", según Hiebert, en el proceso de discipulado?",
    options_pt: ["Worldviews can't really change", "Just changing visible external behaviors", "Genuine, deep discipleship transforms a person's deepest assumptions about reality, not just their surface behaviors", "It's a process that happens automatically at conversion, with no need for discipleship"],
    options_es: ["Las cosmovisiones no pueden realmente cambiar", "Solo cambiar comportamientos externos visibles", "El discipulado genuino y profundo transforma los supuestos más profundos de una persona sobre la realidad, no solo sus comportamientos superficiales", "Es un proceso que ocurre automáticamente en la conversión, sin necesidad de discipulado"],
    correct: 2,
  },
  // Module 21: Phenomenology of Religion (3)
  {
    id: 64, area: "strategy", moduleNum: 21,
    question_pt: "What is \"folk religion,\" according to Paul Hiebert?",
    question_es: "¿Qué es la \"religión popular\" (folk religion), según Paul Hiebert?",
    options_pt: ["An invention with no basis in any real culture", "A term that only applies to tribal religions", "A synonym for any official world religion", "The everyday practices and beliefs about the supernatural (magic, spirits, luck) that often coexist underneath a person's \"official\" religion"],
    options_es: ["Una invención sin base en ninguna cultura real", "Un término que solo se aplica a religiones tribales", "Un sinónimo de cualquier religión oficial mundial", "Las prácticas cotidianas y creencias sobre lo sobrenatural (magia, espíritus, suerte) que a menudo coexisten por debajo de la religión \"oficial\" de una persona"],
    correct: 3,
  },
  {
    id: 65, area: "strategy", moduleNum: 21,
    question_pt: "Why is understanding the phenomenology of a religion (how it's actually lived in practice) different from just knowing its formal written theology?",
    question_es: "¿Por qué entender la fenomenología de una religión (cómo se vive realmente en la práctica) es diferente de solo conocer su teología formal escrita?",
    options_pt: ["Ordinary people's everyday practice often differs significantly from the official doctrine of texts and religious leaders", "Only popular practice matters — formal theology has no value", "Formal theology is always irrelevant", "They're always exactly the same thing"],
    options_es: ["La práctica cotidiana de las personas comunes a menudo difiere significativamente de la doctrina oficial de los textos y líderes religiosos", "Solo la práctica popular importa, la teología formal no tiene valor", "La teología formal siempre es irrelevante", "Son exactamente lo mismo siempre"],
    correct: 0,
  },
  {
    id: 66, area: "strategy", moduleNum: 21,
    question_pt: "When studying a religion different from your own (for evangelism purposes), which approach is most recommended?",
    question_es: "Al estudiar una religión diferente a la propia (con fines de evangelismo), ¿qué enfoque es más recomendado?",
    options_pt: ["Assuming all religions are fundamentally the same as each other", "Studying with genuine understanding and respect, seeking real bridges of connection before pointing out differences", "Learning just enough to debate and win arguments", "Avoiding studying other religions altogether"],
    options_es: ["Asumir que todas las religiones son fundamentalmente iguales entre sí", "Estudiar con genuina comprensión y respeto, buscando puentes de conexión verdaderos antes de señalar diferencias", "Aprender solo lo suficiente para debatir y ganar argumentos", "Evitar estudiar otras religiones por completo"],
    correct: 1,
  },
  // Module 22: Contextualization of the Gospel (3)
  {
    id: 67, area: "strategy", moduleNum: 22,
    question_pt: "What is \"contextualization\" of the gospel, in short?",
    question_es: "¿Qué es la \"contextualización\" del evangelio, de forma resumida?",
    options_pt: ["Changing the essential content of the gospel to please the local culture", "A modern concept with no precedent in the New Testament", "Communicating the gospel faithfully using forms, language, and categories that make sense in the receiving culture, without altering its substance", "Avoiding any cultural adaptation when communicating the gospel"],
    options_es: ["Cambiar el contenido esencial del evangelio para agradar a la cultura local", "Un concepto moderno sin precedente en el Nuevo Testamento", "Comunicar el evangelio fielmente usando formas, lenguaje y categorías que tienen sentido en la cultura receptora, sin alterar su sustancia", "Evitar cualquier adaptación cultural al comunicar el evangelio"],
    correct: 2,
  },
  {
    id: 68, area: "strategy", moduleNum: 22,
    question_pt: "What is the fundamental difference between healthy \"contextualization\" and \"syncretism\"?",
    question_es: "¿Cuál es la diferencia fundamental entre \"contextualización\" saludable y \"sincretismo\"?",
    options_pt: ["There's no real difference between the two terms", "Contextualization means accepting any local belief without distinction", "Syncretism is always the correct, recommended method", "Contextualization adapts the FORM of communicating while keeping the biblical CONTENT intact; syncretism mixes incompatible elements of another belief into the gospel's own content"],
    options_es: ["No hay diferencia real entre los dos términos", "La contextualización significa aceptar cualquier creencia local sin distinción", "El sincretismo es siempre el método correcto y recomendado", "La contextualización adapta la FORMA de comunicar manteniendo el CONTENIDO bíblico intacto; el sincretismo mezcla elementos incompatibles de otra creencia con el propio contenido del evangelio"],
    correct: 3,
  },
  {
    id: 69, area: "strategy", moduleNum: 22,
    question_pt: "What are \"insider movements,\" and why do they generate debate among missiologists?",
    question_es: "¿Qué son los \"movimientos de dentro\" (insider movements), y por qué generan debate entre misiólogos?",
    options_pt: ["Believers in Jesus who remain socially/religiously within their original community (e.g. Muslim, Hindu) — this generates debate about how much of that remaining is healthy contextualization versus a risk of syncretism", "Movements that only exist in Western Christianity", "A synonym for traditionally planted churches", "A concept with no controversy at all in missiology"],
    options_es: ["Creyentes en Jesús que permanecen social/religiosamente dentro de su comunidad original (ej: musulmana, hindú) — genera debate sobre hasta dónde esa permanencia es contextualización saludable o riesgo de sincretismo", "Movimientos que solo existen en el cristianismo occidental", "Sinónimo de iglesias plantadas tradicionalmente", "Un concepto sin controversia alguna en la misiología"],
    correct: 0,
  },
  // Module 23: Majority World Theology (3)
  {
    id: 70, area: "strategy", moduleNum: 23,
    question_pt: "What does the term \"majority world theology\" mean?",
    question_es: "¿Qué significa el término \"teología del mundo mayoritario\"?",
    options_pt: ["A theology inferior to traditional Western theology", "Theological reflection done by Christians in Africa, Asia, and Latin America, where most of the world's Christians live today, with their own legitimate emphases", "A synonym for Western liberal theology", "A movement that rejects all Western theology"],
    options_es: ["Una teología inferior a la teología occidental tradicional", "La reflexión teológica hecha por cristianos de África, Asia y América Latina, donde vive hoy la mayoría de los cristianos del mundo, con sus propios énfasis legítimos", "Un sinónimo de teología liberal occidental", "Un movimiento que rechaza toda teología occidental"],
    correct: 1,
  },
  {
    id: 71, area: "strategy", moduleNum: 23,
    question_pt: "Why is it useful for a missionary to know how Christians from other parts of the (majority) world interpret certain theological topics?",
    question_es: "¿Por qué es útil para un misionero conocer cómo interpretan ciertos temas teológicos los cristianos de otras partes del mundo (mayoritario)?",
    options_pt: ["Majority world theology is always less reliable", "It only serves as academic curiosity with no application", "It broadens one's understanding of the full richness of the Bible, and helps recognize when one's own cultural emphases (Western or otherwise) have been confused with the biblical text itself", "It's not useful, since there's only one valid way to do theology"],
    options_es: ["La teología del mundo mayoritario siempre es menos confiable", "Sirve solo como curiosidad académica sin aplicación", "Amplía la comprensión de la riqueza bíblica plena, y ayuda a reconocer cuándo énfasis culturales propios (occidentales u otros) se han confundido con el texto bíblico mismo", "No es útil, pues solo existe una forma válida de hacer teología"],
    correct: 2,
  },
  {
    id: 72, area: "strategy", moduleNum: 23,
    question_pt: "What does the book \"Mangoes or Bananas?\" (by Hwa Yung) question about theology in the majority world?",
    question_es: "¿Qué cuestiona el libro \"¿Mangos o Bananas?\" (de Hwa Yung) sobre la teología en el mundo mayoritario?",
    options_pt: ["It's just a book about agriculture", "It argues that only Western theology is valid", "It doesn't question anything relevant", "Whether Asian Christians (and those from other regions) should simply import Western theology (\"bananas\" — yellow outside, white inside) or develop theological reflection genuinely rooted in their own culture (\"mangoes\")"],
    options_es: ["Es solo un libro sobre agricultura", "Defiende que solo la teología occidental es válida", "No cuestiona nada relevante", "Si los cristianos asiáticos (y de otras regiones) deben simplemente importar la teología occidental (\"bananas\", amarilla por fuera, blanca por dentro) o desarrollar una reflexión teológica genuinamente arraigada en su propia cultura (\"mangos\")"],
    correct: 3,
  },
  // Module 24: Major Mission Strategies (2)
  {
    id: 73, area: "strategy", moduleNum: 24,
    question_pt: "In the book \"Missionary Methods\" by Roland Allen, what critique does he make of the missionary methods of his time?",
    question_es: "En el libro \"Métodos Misioneros\" de Roland Allen, ¿qué crítica hace a los métodos misioneros de su época?",
    options_pt: ["That they relied excessively on prolonged foreign control, instead of quickly entrusting leadership and resources to local churches, as Paul did", "That they were identical to the apostle Paul's methods", "That missionaries should never leave the field", "That there was no problem at all with the methods of that era"],
    options_es: ["Que dependían excesivamente del control extranjero prolongado, en lugar de confiar rápidamente el liderazgo y los recursos a las iglesias locales, como hacía Pablo", "Que eran idénticos a los métodos del apóstol Pablo", "Que los misioneros nunca deberían salir del campo", "Que no había ningún problema en los métodos de esa época"],
    correct: 0,
  },
  {
    id: 74, area: "strategy", moduleNum: 24,
    question_pt: "What generally characterizes an effective \"mission strategy\"?",
    question_es: "¿Qué caracteriza a una \"estrategia misionera\" eficaz, de forma general?",
    options_pt: ["Mission strategies are unnecessary if faith is strong enough", "An intentional, adaptable, biblically grounded plan that considers the specific context of the people and place being reached", "Relying only on intuition, with no planning at all", "Applying exactly the same plan in any context, with no adjustments"],
    options_es: ["Las estrategias misioneras son innecesarias si la fe es suficientemente fuerte", "Un plan intencional y adaptable, fundamentado bíblicamente, que considera el contexto específico del pueblo y lugar alcanzado", "Confiar solo en la intuición, sin ninguna planificación", "Aplicar exactamente el mismo plan en cualquier contexto, sin ajustes"],
    correct: 1,
  },
  // Module 25: Intercultural Church Planting (2)
  {
    id: 75, area: "strategy", moduleNum: 25,
    question_pt: "What are \"Disciple Making Movements\" (DMM)?",
    question_es: "¿Qué son los \"Movimientos de Multiplicación de Discípulos\" (DMM)?",
    options_pt: ["A method that depends on large buildings and outside resources", "A practice exclusive to traditional Western churches", "Approaches that seek rapid, organic multiplication of disciples and local churches, usually through small groups that reproduce themselves", "A concept with no basis in the Acts of the Apostles"],
    options_es: ["Un método que depende de grandes edificios y recursos externos", "Una práctica exclusiva de iglesias occidentales tradicionales", "Enfoques que buscan la multiplicación rápida y orgánica de discípulos e iglesias locales, generalmente a través de grupos pequeños que se reproducen", "Un concepto sin ninguna base en Hechos de los Apóstoles"],
    correct: 2,
  },
  {
    id: 76, area: "strategy", moduleNum: 25,
    question_pt: "Why is \"healthy multiplication\" of churches preferable to just \"addition\" of members to one large church, in many mission contexts?",
    question_es: "¿Por qué la \"multiplicación saludable\" de iglesias es preferible a solo la \"adición\" de miembros a una única iglesia grande, en muchos contextos misioneros?",
    options_pt: ["There's no real difference between the two models", "Multiplication is always a sign of doctrinal heresy", "Large, centralized churches are always superior", "Multiplication allows for faster, more sustainable reach, with local leadership emerging naturally, instead of depending on a single centralized point"],
    options_es: ["No hay diferencia real entre los dos modelos", "La multiplicación siempre es señal de herejía doctrinal", "Las iglesias grandes y centralizadas siempre son superiores", "La multiplicación permite un alcance más rápido y sostenible, con liderazgo local surgiendo naturalmente, en lugar de depender de un único punto centralizado"],
    correct: 3,
  },
  // Module 26: Global Diaspora (2)
  {
    id: 77, area: "strategy", moduleNum: 26,
    question_pt: "Why is reaching \"diaspora\" peoples (who have migrated from their home country) considered a relevant mission strategy today?",
    question_es: "¿Por qué alcanzar a los pueblos de la \"diáspora\" (que migraron de su país de origen) se considera una estrategia misionera relevante hoy?",
    options_pt: ["These people are often more open to the gospel while away from home, and reaching them can have an impact back on their family and home networks", "Only a Chinese diaspora exists in the world", "Diaspora is a rare phenomenon with no numerical importance", "It's not relevant, since only the home country matters for mission"],
    options_es: ["Muchas veces estas personas están más abiertas al evangelio lejos de casa, y alcanzarlas puede tener impacto de vuelta en sus redes familiares y de origen", "Solo existe diáspora china en el mundo", "La diáspora es un fenómeno raro y sin importancia numérica", "No es relevante, pues solo el país de origen importa para la misión"],
    correct: 0,
  },
  {
    id: 78, area: "strategy", moduleNum: 26,
    question_pt: "What is \"polycentric missiology,\" reflected in the legacy of the Edinburgh Conference?",
    question_es: "¿Qué es la \"misiología policéntrica\", reflejada en el legado de la Conferencia de Edimburgo?",
    options_pt: ["The idea that global mission has a single, permanent geographic center (the West)", "The recognition that global mission today flows in multiple directions, from and to different regions of the world, not just from the West to \"the rest\"", "A concept that denies any international cooperation", "It refers only to digital media strategies"],
    options_es: ["La idea de que la misión global tiene un único centro geográfico permanente (Occidente)", "El reconocimiento de que hoy la misión global fluye en múltiples direcciones, desde y hacia diferentes regiones del mundo, no solo de Occidente al \"resto\"", "Un concepto que niega cualquier cooperación internacional", "Se refiere solo a estrategias de medios digitales"],
    correct: 1,
  },
  // Module 27: Christian Community Development (2)
  {
    id: 79, area: "strategy", moduleNum: 27,
    question_pt: "What is \"Christian Community Development\"?",
    question_es: "¿Qué es el \"desarrollo comunitario cristiano\"?",
    options_pt: ["Just donating material resources with no relational involvement", "Building only church buildings in needy communities", "Serving a community's real practical needs (health, economy, education) in a way that reflects Christ's character and points to the Kingdom of God", "A purely secular method with no connection to evangelism"],
    options_es: ["Solo donar recursos materiales sin involucramiento relacional", "Construir solo edificios de iglesia en comunidades necesitadas", "Servir necesidades prácticas reales de una comunidad (salud, economía, educación) de forma que refleje el carácter y apunte al Reino de Dios", "Un método puramente secular sin conexión con el evangelismo"],
    correct: 2,
  },
  {
    id: 80, area: "strategy", moduleNum: 27,
    question_pt: "What is a key principle for avoiding harmful dependency when doing community development?",
    question_es: "¿Cuál es un principio clave para evitar la dependencia perjudicial al hacer desarrollo comunitario?",
    options_pt: ["Total dependency on outside help is always healthy in the long run", "Doing everything for the community, without involving it in decisions", "Never helping a community materially", "Empowering and involving the community itself as the protagonist of solutions, instead of creating permanent dependency on outside help"],
    options_es: ["La dependencia total de la ayuda externa siempre es saludable a largo plazo", "Hacerlo todo por la comunidad, sin involucrarla en las decisiones", "Nunca ayudar materialmente a una comunidad", "Capacitar e involucrar a la propia comunidad como protagonista de las soluciones, en lugar de crear una dependencia permanente de ayuda externa"],
    correct: 3,
  },
  // ═══ EVANGELISM (modules 28-37) — 20 questions ═══
  // Module 28: Biblical Storytelling (2)
  {
    id: 81, area: "evangelism", moduleNum: 28,
    question_pt: "Why is \"Bible storytelling\" an effective evangelistic tool in many cultures around the world?",
    question_es: "¿Por qué \"contar historias bíblicas\" es una herramienta evangelística eficaz en muchas culturas alrededor del mundo?",
    options_pt: ["Many cultures deeply value oral tradition, and well-told Bible stories communicate truth in a memorable, accessible way, even to those who can't read", "Storytelling was never used by Jesus or the apostles", "Because stories are less biblical than expository sermons", "It's a method only for children"],
    options_es: ["Muchas culturas valoran profundamente la tradición oral, y las historias bíblicas bien contadas comunican verdad de forma memorable y accesible, incluso a quien no lee", "Contar historias nunca fue usado por Jesús o los apóstoles", "Porque las historias son menos bíblicas que los sermones expositivos", "Es un método solo para niños"],
    correct: 0,
  },
  {
    id: 82, area: "evangelism", moduleNum: 28,
    question_pt: "What characterizes a good orally told biblical narrative, for evangelism purposes?",
    question_es: "¿Qué caracteriza a una buena narrativa bíblica contada oralmente, con fines de evangelismo?",
    options_pt: ["Adding fictional details to make the story more interesting", "Faithfulness to the original biblical text, combined with an engaging, natural delivery, adapted to the listening culture's narrative style", "Always summarizing the story in a single sentence", "Reading the text mechanically, with no expression at all"],
    options_es: ["Añadir detalles ficticios para hacer la historia más interesante", "Fidelidad al texto bíblico original, combinada con una presentación atractiva y natural, adaptada al estilo narrativo de la cultura oyente", "Resumir la historia en una sola frase siempre", "Leer el texto de forma mecánica, sin ninguna expresión"],
    correct: 1,
  },
  // Module 29: Major World Religions (2)
  {
    id: 83, area: "evangelism", moduleNum: 29,
    question_pt: "Why is it important to know the basic beliefs of other world religions (Buddhism, Hinduism, Islam, etc.) before evangelizing their followers?",
    question_es: "¿Por qué es importante conocer las creencias básicas de otras religiones mundiales (budismo, hinduismo, islam, etc.) antes de evangelizar a sus seguidores?",
    options_pt: ["Studying other religions is always a sin", "It's not important — the gospel should be presented the same way to everyone", "Understanding a person's worldview helps find genuine bridges of connection and avoid communication that sounds unnecessarily strange or offensive", "You only need to know the name of the religion, nothing more"],
    options_es: ["Estudiar otras religiones siempre es un pecado", "No es importante — el evangelio debe presentarse de la misma forma para todos", "Entender la cosmovisión de la persona ayuda a encontrar puentes genuinos de conexión y evitar una comunicación que suene extraña u ofensiva sin necesidad", "Solo hace falta saber el nombre de la religión, nada más"],
    correct: 2,
  },
  {
    id: 84, area: "evangelism", moduleNum: 29,
    question_pt: "What do the major world religions generally have in common, despite their deep doctrinal differences?",
    question_es: "¿Qué suelen tener en común las principales religiones mundiales, a pesar de sus profundas diferencias doctrinales?",
    options_pt: ["They all teach exactly the same thing about salvation", "They all completely reject the existence of the supernatural", "None of them address moral questions", "They seek to answer universal human questions about suffering, purpose, morality, and what happens after death"],
    options_es: ["Todas enseñan exactamente lo mismo sobre la salvación", "Todas rechazan completamente la existencia de lo sobrenatural", "Ninguna de ellas aborda cuestiones morales", "Buscan responder a preguntas humanas universales sobre el sufrimiento, el propósito, la moralidad y qué sucede después de la muerte"],
    correct: 3,
  },
  // Module 30: Sharing the Gospel with Chinese (2)
  {
    id: 85, area: "evangelism", moduleNum: 30,
    question_pt: "What is \"guanxi\" in Chinese culture, and why does it matter for evangelism?",
    question_es: "¿Qué es el \"guanxi\" en la cultura china, y por qué importa para el evangelismo?",
    options_pt: ["Relationship networks built over time through reciprocity and trust — effective evangelism among Chinese people usually flows through these genuine relationships, not cold contacts", "A concept with no relevance to evangelism", "A type of traditional Chinese food", "A term used only in business contexts"],
    options_es: ["Redes de relación construidas a lo largo del tiempo a través de la reciprocidad y la confianza — el evangelismo eficaz entre chinos generalmente fluye a través de esas relaciones genuinas, no de contactos fríos", "Un concepto sin relevancia para el evangelismo", "Un tipo de comida tradicional china", "Un término usado solo en contextos de negocios"],
    correct: 0,
  },
  {
    id: 86, area: "evangelism", moduleNum: 30,
    question_pt: "Why is the concept of \"honor and shame\" (not just guilt and innocence) especially relevant when evangelizing Chinese people?",
    question_es: "¿Por qué el concepto de \"honor y vergüenza\" (no solo culpa e inocencia) es especialmente relevante al evangelizar a chinos?",
    options_pt: ["It's not relevant — Chinese culture only thinks in terms of individual guilt", "Many decisions (including conversion) are strongly influenced by the impact on family and group honor, not just individual conscience", "This concept has no biblical basis at all", "Honor and shame are exclusively Western concepts"],
    options_es: ["No es relevante — la cultura china solo piensa en términos de culpa individual", "Muchas decisiones (incluyendo la conversión) están fuertemente influenciadas por el impacto en el honor de la familia y del grupo, no solo en la conciencia individual", "Este concepto no tiene ninguna base bíblica", "El honor y la vergüenza son conceptos exclusivamente occidentales"],
    correct: 1,
  },
  // Module 31: Sharing the Gospel with Buddhists (2)
  {
    id: 87, area: "evangelism", moduleNum: 31,
    question_pt: "What is a core belief of Buddhism that a Christian evangelist should understand before dialoguing with a Buddhist?",
    question_es: "¿Cuál es una creencia central del budismo que un evangelista cristiano debe entender antes de dialogar con un budista?",
    options_pt: ["Buddhism is identical to Hinduism in every respect", "Buddhists believe in a personal God identical to the Christian God", "Traditional Buddhism doesn't affirm a personal creator God; it seeks liberation from suffering (dukkha) through the elimination of desire", "Buddhists completely reject any spiritual practice"],
    options_es: ["El budismo es idéntico al hinduismo en todos los aspectos", "Los budistas creen en un Dios personal idéntico al Dios cristiano", "El budismo tradicional no afirma un Dios creador personal; busca la liberación del sufrimiento (dukkha) a través de la eliminación del deseo", "Los budistas rechazan completamente cualquier práctica espiritual"],
    correct: 2,
  },
  {
    id: 88, area: "evangelism", moduleNum: 31,
    question_pt: "What can be a useful bridge when presenting Christ to someone with a Buddhist background?",
    question_es: "¿Cuál puede ser un puente útil al presentar a Cristo a alguien de formación budista?",
    options_pt: ["Insisting that Buddhism and Christianity are the same thing", "Avoiding any mention of suffering", "Directly attacking the figure of Buddha", "Exploring the universal theme of human suffering (which Buddhism also takes seriously) and presenting Christ as the one who answers that suffering personally and definitively"],
    options_es: ["Insistir en que el budismo y el cristianismo son lo mismo", "Evitar cualquier mención al sufrimiento", "Atacar directamente la figura de Buda", "Explorar el tema universal del sufrimiento humano (que el budismo también toma en serio) y presentar a Cristo como quien responde a ese sufrimiento de forma personal y definitiva"],
    correct: 3,
  },
  // Module 32: Sharing the Gospel with Hindus (2)
  {
    id: 89, area: "evangelism", moduleNum: 32,
    question_pt: "What is the concept of \"karma\" in Hinduism, and how does it differ from Christian grace?",
    question_es: "¿Qué es el concepto de \"karma\" en el hinduismo, y en qué se diferencia de la gracia cristiana?",
    options_pt: ["Karma teaches that past actions determine future consequences (including in other lives); Christian grace offers forgiveness and salvation as an undeserved gift, not as a result of one's own accumulated merit", "Karma is an exclusively Buddhist concept, not Hindu", "Karma and grace are exactly the same concept", "Hindus don't believe in any form of moral consequence"],
    options_es: ["El karma enseña que las acciones pasadas determinan consecuencias futuras (incluso en otras vidas); la gracia cristiana ofrece perdón y salvación como don inmerecido, no como resultado del propio mérito acumulado", "El karma es un concepto exclusivamente budista, no hindú", "El karma y la gracia son exactamente el mismo concepto", "Los hindúes no creen en ninguna forma de consecuencia moral"],
    correct: 0,
  },
  {
    id: 90, area: "evangelism", moduleNum: 32,
    question_pt: "Why is \"ancestor veneration\" a sensitive and important topic to understand when evangelizing in Hindu contexts?",
    question_es: "¿Por qué la \"veneración a los ancestros\" es un tema sensible e importante de entender al evangelizar en contextos hindúes?",
    options_pt: ["Ancestor veneration is always identical to idolatry, without exception", "It's deeply tied to family honor and social obligation, so addressing it requires discernment between honoring memory (acceptable) and religious veneration practice (which creates theological tension)", "It's not a relevant topic in these cultures", "It's a topic that only exists in Chinese cultures, not Hindu ones"],
    options_es: ["La veneración a los ancestros siempre es idéntica a la idolatría sin excepción", "Está profundamente ligada al honor familiar y la obligación social, por lo que abordar el tema exige discernimiento entre honrar la memoria (aceptable) y la práctica de veneración religiosa (que genera tensión teológica)", "No es un tema relevante en esas culturas", "Es un tema que solo existe en culturas chinas, no hindúes"],
    correct: 1,
  },
  // Module 33: Sharing the Gospel with Muslims (2)
  {
    id: 91, area: "evangelism", moduleNum: 33,
    question_pt: "What is generally a more fruitful approach to starting a spiritual conversation with a Muslim?",
    question_es: "¿Cuál es un enfoque generalmente más fructífero al iniciar una conversación espiritual con un musulmán?",
    options_pt: ["Completely avoiding any mention of Jesus as divine", "Debating complex theology at the very first meeting", "Building a genuine relationship of respect, and exploring bridges such as mutual respect for prophets and scriptures, before addressing doctrinal differences", "Directly attacking the figure of Muhammad or the Quran"],
    options_es: ["Evitar completamente cualquier mención a Jesús como divino", "Debatir teología compleja ya en el primer encuentro", "Construir una relación genuina de respeto, y explorar puentes como el respeto mutuo por los profetas y las escrituras, antes de tratar las diferencias doctrinales", "Atacar directamente la figura de Mahoma o el Corán"],
    correct: 2,
  },
  {
    id: 92, area: "evangelism", moduleNum: 33,
    question_pt: "What is a central difference between the Islamic view of Jesus (Isa) and the Christian view?",
    question_es: "¿Cuál es una diferencia central entre la visión islámica de Jesús (Isa) y la visión cristiana?",
    options_pt: ["Islam completely denies the historical existence of Jesus", "There's no difference at all between the two views", "Christianity denies that Jesus is a prophet", "Islam recognizes Jesus as an important prophet, but denies His divinity and His death on the cross; Christianity affirms that Jesus is God incarnate who died and rose again"],
    options_es: ["El Islam niega completamente la existencia histórica de Jesús", "No hay ninguna diferencia entre las dos visiones", "El cristianismo niega que Jesús sea un profeta", "El Islam reconoce a Jesús como un profeta importante, pero niega Su divinidad y Su muerte en la cruz; el cristianismo afirma que Jesús es Dios encarnado que murió y resucitó"],
    correct: 3,
  },
  // Module 34: Sharing the Gospel with Catholics (2)
  {
    id: 93, area: "evangelism", moduleNum: 34,
    question_pt: "What is a genuine point of agreement between Catholic and evangelical theology that can serve as a bridge in conversation?",
    question_es: "¿Cuál es un punto de acuerdo genuino entre la teología católica y la evangélica que puede servir de puente en la conversación?",
    options_pt: ["Both affirm the Trinity, the deity of Christ, and the authority of Scripture as the Word of God, even with differences on other topics", "Evangelicals and Catholics agree on absolutely everything without exception", "Catholics completely reject the Bible as an authority", "There's no real point of agreement between the two traditions"],
    options_es: ["Ambas afirman la Trinidad, la divinidad de Cristo, y la autoridad de las Escrituras como Palabra de Dios, incluso con diferencias sobre otros temas", "Evangélicos y católicos concuerdan en absolutamente todo sin excepción", "Los católicos rechazan completamente la Biblia como autoridad", "No existe ningún punto de acuerdo real entre las dos tradiciones"],
    correct: 0,
  },
  {
    id: 94, area: "evangelism", moduleNum: 34,
    question_pt: "When talking with a Catholic about faith, why is it useful to first identify their \"profile\" (convinced practitioner, cultural/nominal, or distanced from the faith)?",
    question_es: "Al conversar con un católico sobre la fe, ¿por qué es útil primero identificar su \"perfil\" (practicante convencido, cultural/nominal, o alejado de la fe)?",
    options_pt: ["Profiles are stereotypes with no pastoral usefulness", "People at different points on the spectrum of practice/conviction respond better to different approaches in conversation", "There's only a single type of Catholic in the world", "It makes no difference at all — every Catholic thinks exactly the same way"],
    options_es: ["Los perfiles son estereotipos sin ninguna utilidad pastoral", "Las personas en diferentes puntos del espectro de práctica/convicción responden mejor a enfoques diferentes en la conversación", "Solo existe un único tipo de católico en el mundo", "No hace ninguna diferencia — todo católico piensa exactamente igual"],
    correct: 1,
  },
  // Module 35: Sharing the Gospel in Secular Cultures (2)
  {
    id: 95, area: "evangelism", moduleNum: 35,
    question_pt: "According to the book \"A Leap of Doubt\" (seven objections), what is an effective approach to evangelizing in secular/skeptical contexts?",
    question_es: "Según el libro \"A Leap of Doubt\" (siete objeciones), ¿cuál es un enfoque eficaz al evangelizar en contextos seculares/escépticos?",
    options_pt: ["Assuming secular people never have sincere questions", "Completely ignoring the person's doubts and objections", "Taking real intellectual objections seriously (suffering, science, religious exclusivity) and responding honestly, without oversimplifying", "Avoiding any rational discussion of the faith"],
    options_es: ["Asumir que las personas seculares nunca tienen preguntas sinceras", "Ignorar completamente las dudas y objeciones de la persona", "Tomar en serio las objeciones intelectuales reales (sufrimiento, ciencia, exclusividad religiosa) y responder con honestidad, sin simplificar demasiado", "Evitar cualquier discusión racional sobre la fe"],
    correct: 2,
  },
  {
    id: 96, area: "evangelism", moduleNum: 35,
    question_pt: "Why do many people in modern secular cultures seek \"discovered meaning\" instead of \"given meaning\" (a concept related to Nietzsche's critique)?",
    question_es: "¿Por qué muchas personas en culturas seculares modernas buscan \"sentido descubierto\" en lugar de \"sentido dado\" (concepto relacionado con la crítica de Nietzsche)?",
    options_pt: ["Because they completely reject any search for purpose in life", "This has no relation at all to secular evangelism", "Secular people always accept meaning imposed from outside without question", "In a culture that questions traditional authorities and imposed objective truths, many prefer to construct their own meaning, which changes how the gospel needs to be presented"],
    options_es: ["Porque rechazan completamente cualquier búsqueda de propósito en la vida", "Esto no tiene ninguna relación con el evangelismo secular", "Las personas seculares siempre aceptan el sentido impuesto desde fuera sin cuestionarlo", "En una cultura que cuestiona autoridades tradicionales y verdades objetivas impuestas, muchos prefieren construir su propio sentido, lo que cambia cómo debe presentarse el evangelio"],
    correct: 3,
  },
  // Module 36: Sharing the Gospel in Animistic Culture (2)
  {
    id: 97, area: "evangelism", moduleNum: 36,
    question_pt: "What is a \"power encounter,\" in the context of evangelism in animistic cultures?",
    question_es: "¿Qué es el \"encuentro de poder\" (power encounter), en el contexto del evangelismo en culturas animistas?",
    options_pt: ["A visible demonstration of God's power over feared spiritual forces (healing, deliverance), which often communicates the gospel powerfully in cultures that live in constant fear of the spiritual", "A technique of psychological manipulation", "A concept with no biblical precedent at all", "A synonym for academic theological debate"],
    options_es: ["Una demostración visible del poder de Dios sobre fuerzas espirituales temidas (sanidad, liberación), que muchas veces comunica el evangelio de forma poderosa en culturas que viven con miedo constante de lo espiritual", "Una técnica de manipulación psicológica", "Un concepto sin ningún precedente bíblico", "Un sinónimo de debate teológico académico"],
    correct: 0,
  },
  {
    id: 98, area: "evangelism", moduleNum: 36,
    question_pt: "Why is \"spiritual fear\" (of spirits, curses, witchcraft) a central point to understand in animistic cultures?",
    question_es: "¿Por qué el \"miedo espiritual\" (a espíritus, maldiciones, brujería) es un punto central a entender en culturas animistas?",
    options_pt: ["This topic has no relation to effective evangelism at all", "A large part of daily life is organized around protection from feared spiritual forces, and the gospel offers genuine security in Christ over these fears", "Spiritual fear is just a Western invention about these cultures", "It's not relevant — people in animistic cultures have no real spiritual fear"],
    options_es: ["Este tema no tiene ninguna relación con el evangelismo eficaz", "Gran parte de la vida cotidiana se organiza en torno a la protección contra fuerzas espirituales temidas, y el evangelio ofrece seguridad genuina en Cristo sobre esos miedos", "El miedo espiritual es solo una invención occidental sobre esas culturas", "No es relevante — las personas en culturas animistas no tienen ningún miedo espiritual real"],
    correct: 1,
  },
  // Module 37: Sharing the Gospel in Patronage Culture (2)
  {
    id: 99, area: "evangelism", moduleNum: 37,
    question_pt: "What is a \"patronage culture,\" and why does it matter for evangelism?",
    question_es: "¿Qué es una \"cultura de clientelismo/patronazgo\", y por qué importa para el evangelismo?",
    options_pt: ["A system that doesn't exist in any New Testament culture", "A synonym for modern political corruption", "A system where relationships of favor, loyalty, and mutual obligation between patron and client shape nearly every social interaction — understanding this illuminates how Jesus is presented as the ultimate \"broker\" (mediator) between God and humanity", "A purely economic concept with no spiritual relevance"],
    options_es: ["Un sistema que no existe en ninguna cultura del Nuevo Testamento", "Sinónimo de corrupción política moderna", "Un sistema donde las relaciones de favor, lealtad y obligación mutua entre patrón y cliente moldean prácticamente toda interacción social — entender esto ilumina cómo Jesús es presentado como el \"broker\" (mediador) supremo entre Dios y la humanidad", "Un concepto exclusivamente económico sin relevancia espiritual"],
    correct: 2,
  },
  {
    id: 100, area: "evangelism", moduleNum: 37,
    question_pt: "How does the concept of the covenant between Yahweh and Israel relate to patronage dynamics in the Old Testament?",
    question_es: "¿Cómo se relaciona el concepto del pacto entre Yahweh e Israel con las dinámicas de patronazgo en el Antiguo Testamento?",
    options_pt: ["This concept only applies to the New Testament", "Biblical covenants are completely different from any social relationship of that era", "There's no relationship at all between the two concepts", "The covenant reflects a patron-client structure recognizable at the time: God as sovereign patron offers protection and blessing, and Israel responds with loyalty and obedience"],
    options_es: ["Este concepto solo se aplica al Nuevo Testamento", "Los pactos bíblicos son completamente diferentes de cualquier relación social de la época", "No hay ninguna relación entre los dos conceptos", "El pacto refleja una estructura de patrón-cliente reconocible en la época: Dios como patrón soberano ofrece protección y bendición, e Israel responde con lealtad y obediencia"],
    correct: 3,
  },
];
