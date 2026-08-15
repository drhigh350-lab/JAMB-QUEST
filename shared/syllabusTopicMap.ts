export type SyllabusSubject = "Use of English" | "Biology" | "Chemistry" | "Physics";

export const OFFICIAL_SYLLABUS_AREAS: Record<SyllabusSubject, readonly string[]> = {
  "Use of English": [
    "Comprehension passages",
    "Summary",
    "Cloze passages",
    "Reading text",
    "Sentence meaning",
    "Synonyms",
    "Antonyms",
    "Clause and sentence patterns",
    "Word classes",
    "Tense, aspect, number and agreement",
    "Mechanics",
    "Ordinary, figurative and idiomatic usage",
    "Vowels",
    "Consonants",
    "Rhymes and homophones",
    "Word stress",
    "Emphatic stress",
    "Approved reading text",
  ],
  Biology: [
    "Living organisms and organization",
    "Evolution and classification",
    "Adaptations of organisms",
    "Plant and mammal structure",
    "Nutrition and digestion",
    "Transport",
    "Respiration",
    "Excretion",
    "Support and movement",
    "Reproduction",
    "Growth",
    "Coordination and control",
    "Factors affecting distribution",
    "Symbiotic interactions",
    "Natural habitats",
    "Nigerian biomes",
    "Population ecology",
    "Soil",
    "Humans and environment",
    "Variation",
    "Heredity",
    "Biotechnology",
    "Theories of evolution",
    "Evidence of evolution",
  ],
  Chemistry: [
    "Separation of mixtures",
    "Chemical combination",
    "Kinetic theory of matter and gases",
    "Atomic structure and bonding",
    "Nuclear chemistry",
    "Solubility",
    "Environmental pollution",
    "Acids, bases and salts",
    "Oxidation and reduction",
    "Electrolysis",
    "Energy changes",
    "Rates of reaction",
    "Chemical equilibria",
    "Non-metals and their compounds",
    "Metals and their compounds",
    "Organic compounds",
    "Chemistry and industry",
    "Astronomical chemistry",
  ],
  Physics: [
    "Measurements and units",
    "Motion",
    "Gravitational field",
    "Equilibrium of forces",
    "Work, energy and power",
    "Machines",
    "Elasticity",
    "Pressure",
    "Liquids at rest",
    "Temperature and measurement",
    "Quantity of heat",
    "Change of state",
    "Thermal expansion",
    "Gas laws",
    "Vapours",
    "Structure of matter and kinetic theory",
    "Heat transfer",
    "Waves",
    "Propagation of sound",
    "Characteristics of sound",
    "Light energy",
    "Reflection",
    "Refraction",
    "Optical instruments",
    "Dispersion and colours",
    "Electrostatics",
    "Capacitors",
    "Electric cells",
    "Current electricity",
    "Electrical energy and power",
    "Magnets and magnetic fields",
    "Force on a current-carrying conductor",
    "Electromagnetic induction",
    "AC circuits",
    "Conduction of electricity",
    "Modern physics",
    "Introductory electronics",
    "Fibre optics and lasers",
  ],
};

const aliases: Record<SyllabusSubject, Array<[string, string]>> = {
  "Use of English": [
        ["comprehension", "Comprehension passages"], ["passage", "Comprehension passages"], ["phrasal verb", "Ordinary, figurative and idiomatic usage"], ["collocation", "Ordinary, figurative and idiomatic usage"], ["register", "Ordinary, figurative and idiomatic usage"], ["subjunctive", "Tense, aspect, number and agreement"], ["question tag", "Tense, aspect, number and agreement"], ["preposition", "Word classes"], ["determiner", "Word classes"], ["quantifier", "Word classes"], ["conjunction", "Word classes"], ["relative pronoun", "Word classes"], ["direct indirect speech", "Clause and sentence patterns"], ["active passive voice", "Clause and sentence patterns"], ["oral english", "Oral Forms"],
 ["summary", "Summary"], ["cloze", "Cloze passages"], ["reading text", "Reading text"], ["sentence interpretation", "Sentence meaning"], ["sentence meaning", "Sentence meaning"], ["synonym", "Synonyms"], ["antonym", "Antonyms"], ["clause", "Clause and sentence patterns"], ["sentence pattern", "Clause and sentence patterns"], ["word class", "Word classes"], ["grammar", "Tense, aspect, number and agreement"], ["tense", "Tense, aspect, number and agreement"], ["agreement", "Tense, aspect, number and agreement"], ["mechanic", "Mechanics"], ["idiom", "Ordinary, figurative and idiomatic usage"], ["figurative", "Ordinary, figurative and idiomatic usage"], ["ordinary usage", "Ordinary, figurative and idiomatic usage"], ["vowel", "Vowels"], ["consonant", "Consonants"], ["rhyme", "Rhymes and homophones"], ["homophone", "Rhymes and homophones"], ["word stress", "Word stress"], ["emphatic stress", "Emphatic stress"], ["lekki headmaster", "Approved reading text"], ["chapter", "Approved reading text"],
  ],
  Biology: [
        ["classification", "Evolution and classification"], ["evolution", "Theories of evolution"], ["genetics", "Heredity"], ["plant biology", "Plant and mammal structure"], ["plant growth", "Growth"], ["ecology", "Natural habitats"], ["nutrition and diet", "Nutrition and digestion"], ["nutrition and digestion", "Nutrition and digestion"], ["respiration and gas exchange", "Respiration"], ["excretion and osmoregulation", "Excretion"], ["support movement", "Support and movement"], ["sensory", "Coordination and control"], ["endocrine", "Coordination and control"], ["blood and circulation", "Transport"], ["health and disease", "Humans and environment"], ["behaviour and social organization", "Coordination and control"],
 ["adaptation", "Adaptations of organisms"], ["cell", "Living organisms and organization"], ["tissue", "Living organisms and organization"], ["plant", "Plant and mammal structure"], ["mammal", "Plant and mammal structure"], ["nutrition", "Nutrition and digestion"], ["digestion", "Nutrition and digestion"], ["transport", "Transport"], ["respiration", "Respiration"], ["excretion", "Excretion"], ["support", "Support and movement"], ["movement", "Support and movement"], ["reproduction", "Reproduction"], ["growth", "Growth"], ["coordination", "Coordination and control"], ["ecology", "Natural habitats"], ["habitat", "Natural habitats"], ["symbiosis", "Symbiotic interactions"], ["biome", "Nigerian biomes"], ["population", "Population ecology"], ["soil", "Soil"], ["environment", "Humans and environment"], ["variation", "Variation"], ["heredity", "Heredity"], ["biotechnology", "Biotechnology"],
  ],
  Chemistry: [
        ["separation", "Separation of mixtures"], ["mixture", "Separation of mixtures"], ["separation techniques", "Separation of mixtures"], ["mole concept", "Chemical combination"], ["stoichiometry", "Chemical combination"], ["atomic structure", "Atomic structure and bonding"], ["bonding", "Atomic structure and bonding"], ["general chemistry", "Chemical combination"], ["industrial chemistry", "Chemistry and industry"], ["combustion", "Organic compounds"], ["fuel", "Organic compounds"], ["qualitative analysis", "Solubility"], ["chemical kinetics", "Rates of reaction"], ["energetics", "Energy changes"], ["thermodynamics", "Energy changes"], ["chemical equilibrium", "Chemical equilibria"], ["redox", "Oxidation and reduction"], ["electrochemistry", "Electrolysis"], ["metals and extraction", "Metals and their compounds"], ["hydrocarbon", "Organic compounds"], ["petroleum", "Organic compounds"], ["water treatment", "Environmental pollution"], ["environmental chemistry", "Environmental pollution"], ["ph calculations", "Acids, bases and salts"],
 ["combination", "Chemical combination"], ["mole", "Kinetic theory of matter and gases"], ["gas", "Kinetic theory of matter and gases"], ["atom", "Atomic structure and bonding"], ["bond", "Atomic structure and bonding"], ["nuclear", "Nuclear chemistry"], ["solubility", "Solubility"], ["pollution", "Environmental pollution"], ["acid", "Acids, bases and salts"], ["base", "Acids, bases and salts"], ["salt", "Acids, bases and salts"], ["oxidation", "Oxidation and reduction"], ["reduction", "Oxidation and reduction"], ["electrolysis", "Electrolysis"], ["energy", "Energy changes"], ["rate", "Rates of reaction"], ["equilibrium", "Chemical equilibria"], ["non-metal", "Non-metals and their compounds"], ["metal", "Metals and their compounds"], ["organic", "Organic compounds"], ["industry", "Chemistry and industry"], ["astronom", "Astronomical chemistry"],
  ],
  Physics: [
        ["measurement", "Measurements and units"], ["unit", "Measurements and units"], ["mechanic", "Motion"], ["motion", "Motion"], ["general physics", "Motion"], ["thermal physics", "Quantity of heat"], ["electricity and electronics", "Current electricity"], ["electricity", "Current electricity"], ["waves optics and modern physics", "Waves"], ["x ray", "Modern physics"],
 ["kinematics", "Motion"], ["force", "Equilibrium of forces"], ["equilibrium", "Equilibrium of forces"], ["gravity", "Gravitational field"], ["gravitational", "Gravitational field"], ["work", "Work, energy and power"], ["energy", "Work, energy and power"], ["power", "Work, energy and power"], ["machine", "Machines"], ["elastic", "Elasticity"], ["pressure", "Pressure"], ["liquid", "Liquids at rest"], ["temperature", "Temperature and measurement"], ["heat", "Quantity of heat"], ["state", "Change of state"], ["expansion", "Thermal expansion"], ["gas law", "Gas laws"], ["vapour", "Vapours"], ["kinetic theory", "Structure of matter and kinetic theory"], ["heat transfer", "Heat transfer"], ["wave", "Waves"], ["sound", "Propagation of sound"], ["light", "Light energy"], ["reflection", "Reflection"], ["refraction", "Refraction"], ["optical", "Optical instruments"], ["dispersion", "Dispersion and colours"], ["electrostatic", "Electrostatics"], ["capacitor", "Capacitors"], ["cell", "Electric cells"], ["current", "Current electricity"], ["magnet", "Magnets and magnetic fields"], ["electromagnetic", "Electromagnetic induction"], ["ac circuit", "AC circuits"], ["conduction", "Conduction of electricity"], ["modern physics", "Modern physics"], ["electronic", "Introductory electronics"], ["fibre", "Fibre optics and lasers"], ["laser", "Fibre optics and lasers"],
  ],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}

export function resolveSyllabusTopic(subject: SyllabusSubject, label: string): string | null {
  const value = normalize(label);
  if (!value) return null;
  const exact = OFFICIAL_SYLLABUS_AREAS[subject].find((area) => normalize(area) === value);
  if (exact) return exact;
  const match = aliases[subject].find(([needle]) => value.includes(needle));
  return match?.[1] ?? null;
}

export function isOfficialSyllabusTopic(subject: SyllabusSubject, label: string) {
  return resolveSyllabusTopic(subject, label) !== null;
}
