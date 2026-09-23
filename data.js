/* De Leesgym — alle inhoud staat hier, los van de werking in app.js */

var START = "2026-09-23"; // woensdag 23 september 2026

var BOOKS = [
  {
    id: "atomic", t: "Atomic Habits", a: "James Clear", p: 320, lang: "EN",
    m: "tot 10 nov '26", due: "2026-11-10", tag: "Start · gewoontes",
    art: { s: "classic", bg: "#EFE7D6", fg: "#1B1B1A", ac: "#D4562E" },
    why: "Je eerste Engelstalige boek ooit, en dat is bewust: dit is het makkelijkste Engels van de hele lijst. Korte zinnen, korte hoofdstukken, geen jargon. Het bouwt bovendien het systeem waarmee je de negen andere afmaakt. Je krijgt er zeven weken voor, precies de periode waarin je van 15 naar 40 minuten per dag klimt.",
    q: "Welke gewoonte heb je effectief veranderd sinds je dit boek las?"
  },
  {
    id: "goal", t: "The Goal", a: "Eliyahu Goldratt", p: 384, lang: "EN", buy: true,
    m: "tot 10 dec '26", due: "2026-12-10", tag: "Supply chain · roman",
    art: { s: "band", bg: "#B23A2E", fg: "#F8F1E4", ac: "#EFC94C" },
    why: "Het belangrijkste boek van je SCM-lijst, geschreven als een roman. Een fabrieksmanager heeft drie maanden om zijn fabriek te redden; onderweg leer je waarom één bottleneck het tempo van je hele keten bepaalt. Je zit dan drie maanden in Odisee — precies het moment waarop dit begint te leven.",
    q: "Welke bottleneck herken je in je eigen week — school, werk, sport? Wat is jouw traagste station?"
  },
  {
    id: "money", t: "The Psychology of Money", a: "Morgan Housel", p: 256, lang: "EN",
    m: "tot 10 jan '27", due: "2027-01-10", tag: "Geld",
    art: { s: "minimal", bg: "#1C6B72", fg: "#F4EFE4", ac: "#E3B23C" },
    why: "Korte essays over waarom mensen domme geldbeslissingen nemen: ego, geduld, geluk versus skill. Geen techniek, wel het gedrag dat het grootste deel van je rendement bepaalt. Korte stukken passen goed rond de feestdagen, als je hoofd overal tegelijk zit.",
    q: "Wat zegt dit boek over hoe jij vandaag met geld omgaat?"
  },
  {
    id: "mom", t: "The Mom Test", a: "Rob Fitzpatrick", p: 136, lang: "EN", buy: true,
    m: "tot 10 feb '27", due: "2027-02-10", tag: "Zelf bouwen · examens",
    art: { s: "classic", bg: "#F6F2E7", fg: "#16213A", ac: "#D2402F" },
    why: "Honderdzesendertig pagina's, het kortste boek van de tien, en daarom staat het in je examenmaand. Het is meteen ook het antwoord op je vraag waar er geld te maken valt: niet door je een idee te geven, wel de methode om met mensen te praten en te ontdekken waar ze écht last van hebben.",
    q: "Met wie ga je deze maand praten over een probleem dat je zou kunnen oplossen?"
  },
  {
    id: "box", t: "The Box", a: "Marc Levinson", p: 500, lang: "EN", buy: true,
    m: "tot 10 mrt '27", due: "2027-03-10", tag: "Supply chain",
    art: { s: "band", bg: "#1B3555", fg: "#F2EDE2", ac: "#E07B39" },
    why: "Hoe één stalen doos de wereldeconomie omgooide. Verhalende geschiedenis, geen handboek: havens, vakbonden, kosten die instortten. Je woont naast Antwerpen — dit maakt zichtbaar wat je daar elke dag ziet staan. Vijfhonderd pagina's, maar tegen februari lees je een uur per dag.",
    q: "Wat begreep je over globalisering dat je in de les nog niet gehoord had?"
  },
  {
    id: "hsm", t: "Happy Sexy Millionaire", a: "Steven Bartlett", p: 304, lang: "EN",
    m: "tot 10 apr '27", due: "2027-04-10", tag: "Licht",
    art: { s: "minimal", bg: "#161616", fg: "#F7F3EA", ac: "#E0A93B" },
    why: "Half memoir, half aanval op de hustlecultuur. Licht en vlot — bewust na vier stevige boeken, om even op adem te komen zonder je ritme te verliezen.",
    q: "Waar ben je het eens en oneens met Bartlett over succes?"
  },
  {
    id: "beleggen", t: "Je bent jong en je wilt… beleggen", a: "Cédric Proost", p: 240, lang: "NL", buy: true,
    m: "tot 10 mei '27", due: "2027-05-10", tag: "Geld · Belgisch",
    art: { s: "classic", bg: "#2C6E49", fg: "#F5F2E7", ac: "#F2C14E" },
    why: "Geschreven voor jonge Belgen die willen starten met beleggen. Legt uit waarom vroeg beginnen zo veel uitmaakt door samengestelde interest, en overloopt de opties met aandacht voor risico en spreiding. Jouw land, jouw leeftijd, jouw taal.",
    q: "Wat ga je concreet doen met je eerste honderd euro — en waarom net dat?"
  },
  {
    id: "war", t: "The Art of War", a: "Sun Tzu", p: 120, lang: "EN",
    m: "tot 10 jun '27", due: "2027-06-10", tag: "Kort · examens",
    art: { s: "minimal", bg: "#6E1B1B", fg: "#EFD9A3", ac: "#C9A227" },
    why: "Honderdtwintig pagina's in je tweede examenmaand. Kort maar aforistisch, dus neem een editie mét commentaar — anders lees je spreuken en onthou je niets.",
    q: "Welke passage kon je niet plaatsen zonder de toelichting?"
  },
  {
    id: "cointel", t: "Co-Intelligence", a: "Ethan Mollick", p: 256, lang: "EN", buy: true,
    m: "tot 10 jul '27", due: "2027-07-10", tag: "AI",
    art: { s: "band", bg: "#143D5B", fg: "#EDF3F6", ac: "#55B3D9" },
    why: "De minst hypegevoelige gids over werken mét AI: behandel het als een collega en niet als een orakel, hou een mens in de lus, en wees altijd zelf degene die het werk nakijkt. Hoogleraar aan Wharton die het maandenlang zelf uittestte.",
    q: "Hoe verschilt jouw manier van AI gebruiken na dit boek van daarvoor?"
  },
  {
    id: "deugen", t: "De meeste mensen deugen", a: "Rutger Bregman", p: 528, lang: "NL", buy: true,
    m: "tot 10 aug '27", due: "2027-08-10", tag: "Psychologie",
    art: { s: "classic", bg: "#D9602E", fg: "#2A1206", ac: "#F7E7C6" },
    why: "Het dikste boek van de tien, in de vrijste maand van je jaar. Origineel Nederlands geschreven en het leest als een trein. Geen zelfhulp maar echte geschiedenis en psychologie — Bregman haalt beroemde experimenten onderuit. Meteen munitie voor de volwassen gesprekken die je wil kunnen voeren.",
    q: "Welk 'bewijs' over de menselijke natuur bleek na dit boek niet te kloppen?"
  }
];

var CORE_Q = [
  { id: "q1", label: "Waarom dat cijfer?" },
  { id: "q2", label: "Het ene idee dat je bijblijft" },
  { id: "q3", label: "Waar was je het niet mee eens, of wat vond je zwak onderbouwd?" },
  { id: "q4", label: "Wat heb je concreet toegepast of ga je toepassen?" },
  { id: "q5", label: "Hoe zwaar las het? Te makkelijk, juist, of te zwaar?" },
  { id: "q6", label: "Waar dwaalde je het meest af — en waarom denk je?" },
  { id: "q7", label: "Meer of net minder van dit soort boek hierna?" }
];

/* trainingsschema — from/to in dagen sinds de start */
var PHASES = [
  { w: "Week 1–2", label: "15 min", min: 15, from: 0, to: 13,
    note: "Het doel is niet vooruitgang in je boek. Het doel is dat je elke dag gaat zitten." },
  { w: "Week 3–4", label: "25 min", min: 25, from: 14, to: 27,
    note: "Rond minuut 12 wil je stoppen. Dát moment is de hele training. Blijf zitten." },
  { w: "Week 5–6", label: "2 × 20 min", min: 40, from: 28, to: 41,
    note: "Vijf minuten pauze ertussen. Rechtstaan, water halen, geen gsm." },
  { w: "Week 7–8", label: "40 min", min: 40, from: 42, to: 55,
    note: "Aan één stuk. Hier merk je dat het vlotter gaat dan in week 1." },
  { w: "Week 9+", label: "60 min", min: 60, from: 56, to: 99999,
    note: "Waar je wilde zijn. Vanaf nu onderhoud je het gewoon." }
];

var RULES = [
  ["Gsm in een andere kamer", "Niet omgedraaid, niet op stil. Een andere kamer. Hier onderhandel je niet met jezelf."],
  ["Vaste plek, vast uur", "Zelfde stoel, zelfde tijdstip. Je hoofd leert die combinatie herkennen als lezen."],
  ["Timer aan", "Je leest tot de timer gaat, niet tot je er geen zin meer in hebt. Papieren boek."],
  ["Vinger onder de regel", "Klinkt kinderachtig, werkt. Je ogen dwalen minder en je merkt sneller dat je weg bent."],
  ["Niet snellezen", "Traag lezen met begrip is sneller dan drie keer snel lezen."]
];

var TECHNIQUES = [
  ["De 3-secondencheck", "Na elke pagina: kijk weg, zeg in één zin wat er stond. Lukt niet? Die pagina één keer over, maar tráger."],
  ["Eén zin per hoofdstuk", "Schrijf in eigen woorden op wat er stond. Traint begrip, geheugen én je schrijven tegelijk."],
  ["Vijf minuten hardop", "Lees één alinea luidop voor. Je directe oefening voor uitspraak en articulatie."],
  ["De afdwaalnotitie", "Hoofd loopt weg naar iets dat je nog moet doen? Twee woorden op een blad naast je, en verder."],
  ["Stop midden in een hoofdstuk", "Stoppen op een onafgewerkt punt maakt dat je er morgen makkelijker terug invalt."]
];

var BENEFITS = [
  ["Concentratie terug", "Eén ding 40 minuten vasthouden is het omgekeerde van scrollen. Zelfde spier als blokken."],
  ["Minder uitstellen", "Een boek beloont pas na 300 pagina's. Elke keer dat je dat volhoudt, herbouw je dat vermogen."],
  ["Beter spreken", "Woorden in context, meerdere keren, correct gespeld. Het hardop lezen traint je uitspraak direct."],
  ["Grammatica", "Duizenden goede zinnen passief oppikken. Het schriftje maakt het actief."],
  ["Geheugen", "Een argumentatie over hoofdstukken heen volgen ís werkgeheugen in actie."],
  ["Meepraten", "Na tien boeken heb je referenties en kaders. Dan knik je niet meer mee, dan zeg je iets."],
  ["Mensen inschatten", "Onderbouwde modellen over waarom mensen doen wat ze doen. Werkt thuis, op de receptie en later op je werk."],
  ["Rust en slaap", "Een half uur papier voor het slapen doet iets anders met je hoofd dan een half uur scrollen."]
];

var VERDICT = {
  ja:    { label: "Aanrader",      cls: "b-green" },
  later: { label: "Later",         cls: "b-grey" },
  les:   { label: "Naslagwerk",    cls: "b-blue" },
  nee:   { label: "Sla over",      cls: "b-red" },
  check: { label: "Eerst checken", cls: "b-gold" }
};

var FUTURE = [
  { cat: "Zelf bouwen · AI", items: [
    { t: "Make", a: "Pieter Levels", v: "ja", w: "Een Nederlander die in z'n eentje winstgevende internetproducten bouwt, zonder team of investeerders. Ruw geschreven, maar exact het model dat jij beschrijft." },
    { t: "Zero to One", a: "Peter Thiel", v: "ja", w: "Kort en scherp over waarom kopiëren je nergens brengt. Contrair en soms irritant — precies waarom het de moeite is." },
    { t: "Prediction Machines", a: "Agrawal, Gans & Goldfarb", v: "later", w: "AI is in de kern goedkope voorspelling, en daardoor verschuift de waarde naar oordeel. Voor als je verder wil dan tools, richting strategie." }
  ]},
  { cat: "Psychologie", items: [
    { t: "Influence", a: "Robert Cialdini", v: "ja", w: "Beïnvloeding met écht onderzoek erachter. Doet wat Read People Like a Book alleen belooft." },
    { t: "Never Split the Difference", a: "Chris Voss", v: "ja", w: "Onderhandelen en luisteren, van een FBI-gijzelingsonderhandelaar. Direct bruikbaar op je werk." },
    { t: "Thinking, Fast and Slow", a: "Daniel Kahneman", v: "later", w: "Nobelprijswinnaar over hoe je brein beslist. Zwaar — pas als je 60 minuten comfortabel aankan." }
  ]},
  { cat: "Geld", items: [
    { t: "The Little Book of Common Sense Investing", a: "John Bogle", v: "ja", w: "De klassieker over indexfondsen en spreiding. Hoe het praktisch werkt." },
    { t: "A Random Walk Down Wall Street", a: "Burton Malkiel", v: "later", w: "Waarom bijna niemand de markt verslaat, en wat dat betekent voor je eerste portefeuille." }
  ]},
  { cat: "Politiek · economie", items: [
    { t: "Prisoners of Geography", a: "Tim Marshall", v: "ja", w: "Waarom landen doen wat ze doen, uitgelegd via kaarten. Het toegankelijkste startpunt voor geopolitiek." },
    { t: "Naked Economics", a: "Charles Wheelan", v: "ja", w: "Economie zonder wiskunde en zonder politiek kamp. Geeft je het vocabulaire." }
  ]},
  { cat: "Romans", items: [
    { t: "The Circle", a: "Dave Eggers · EN", v: "ja", w: "Een techbedrijf waar totale transparantie de norm wordt. Over aandacht, data en sociale media — dus over precies waarom je TikTok verwijderde." },
    { t: "L'Étranger", a: "Albert Camus · FR", v: "ja", w: "Kort en kraakhelder Frans, en dé Franse klassieker waar je overal naar hoort verwijzen. Jouw Frans is er ruim goed genoeg voor." },
    { t: "De helaasheid der dingen", a: "Dimitri Verhulst · NL", v: "ja", w: "Vlaams, hard en grappig tegelijk, en kort. Om te testen of fictie in je eigen taal je beter ligt." },
    { t: "Nineteen Eighty-Four", a: "George Orwell · EN", v: "later", w: "Macht, politiek en taal. Kort genoeg om af te maken, en je hoort er levenslang naar verwijzen." }
  ]},
  { cat: "Supply chain", items: [
    { t: "Logistics and Supply Chain Management", a: "Martin Christopher", v: "later", w: "De leesbaarste van de academische boeken en in Europa een klassieker. Pas in je tweede jaar." },
    { t: "The Supply Chain Revolution", a: "Suman Sarkar", v: "later", w: "Voor directieniveau, vooral casussen. Lezers vinden het vaak vaag en weinig praktisch. Pas als je zelf in een keten werkt." },
    { t: "Chopra · Stevenson", a: "handboeken", v: "les", w: "800+ pagina's met formules en oefeningen, en duur. Check eerst je boekenlijst en de bib van Odisee." },
    { t: "SCM For Dummies", a: "Daniel Stanton", v: "les", w: "Geen leesboek maar naslagwerk. Gebruik het naast je cursus als je vastloopt op vakjargon." },
    { t: "Blockchain and the Supply Chain", a: "Nick Vyas e.a.", v: "nee", w: "Cursusboek met quizzen, en het veld schoof verder: TradeLens van Maersk en IBM werd in 2023 stopgezet. Lees hier artikelen over." },
    { t: "The Lean Supply Chain", a: "auteurs onduidelijk", v: "check", w: "Meerdere boeken met die titel. Check eerst welke je bedoelt — lean leer je sowieso beter via The Goal." }
  ]},
  { cat: "Doorgeschoven", items: [
    { t: "The 48 Laws of Power", a: "Robert Greene", v: "later", w: "Te zwaar voor dit jaar. Dik, dicht en amoreel — pas als 60 minuten lezen vanzelf gaat." },
    { t: "The Diary of a CEO", a: "Steven Bartlett", v: "later", w: "Prima boek, maar er stonden dit jaar sterkere kandidaten voor hetzelfde slot." },
    { t: "Read People Like a Book", a: "Patrick King", v: "later", w: "Vervangen door Cialdini en Voss, die hetzelfde beloven maar met onderzoek erachter." },
    { t: "Emotional Alchemy", a: "Max Öchsner", v: "later", w: "Weinig over bekend. Lees het ooit met de vraag: waarop baseert deze auteur zich?" },
    { t: "Rich Dad Poor Dad", a: "Robert Kiyosaki", v: "later", w: "Neem de mindset over bezit versus last, laat de tactiek rond schuld en hefboom liggen." },
    { t: "The Secret", a: "Rhonda Byrne", v: "nee", w: "Pseudowetenschap. Als je het ooit leest, doe het als oefening in bronkritiek — niet als levensles." }
  ]}
];

/* palet voor boeken die je zelf toevoegt */
var ART_POOL = [
  { s: "classic", bg: "#2F4858", fg: "#F3EFE6", ac: "#E0A93B" },
  { s: "minimal", bg: "#7A3B2E", fg: "#F6EDE1", ac: "#E8C07D" },
  { s: "band",    bg: "#33553F", fg: "#F4F1E6", ac: "#D9A441" },
  { s: "classic", bg: "#EFE9DC", fg: "#22262B", ac: "#2F6E52" },
  { s: "minimal", bg: "#1F3552", fg: "#EEF2F6", ac: "#7FB2D6" },
  { s: "band",    bg: "#8C3B52", fg: "#F8EFE9", ac: "#F0C86A" }
];
