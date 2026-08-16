import { OFFICIAL_SYLLABUS_AREAS, type SyllabusSubject } from "./syllabusTopicMap";

export type SyllabusParentGroup = { label: string; topics: readonly string[] };

const GROUPS: Record<SyllabusSubject, readonly SyllabusParentGroup[]> = {
  "Use of English": [
    { label: "Reading and comprehension", topics: ["Comprehension passages", "Summary", "Cloze passages", "Reading text", "Sentence meaning", "Approved reading text"] },
    { label: "Lexis and grammar", topics: ["Synonyms", "Antonyms", "Clause and sentence patterns", "Word classes", "Tense, aspect, number and agreement", "Ordinary, figurative and idiomatic usage", "Mechanics"] },
    { label: "Oral English", topics: ["Vowels", "Consonants", "Rhymes and homophones", "Word stress", "Emphatic stress"] },
  ],
  Biology: [
    { label: "Living systems and diversity", topics: ["Living organisms and organization", "Evolution and classification", "Adaptations of organisms", "Plant and mammal structure", "Variation", "Heredity", "Biotechnology", "Theories of evolution", "Evidence of evolution"] },
    { label: "Life processes", topics: ["Nutrition and digestion", "Transport", "Respiration", "Excretion", "Support and movement", "Reproduction", "Growth", "Coordination and control"] },
    { label: "Ecology and environment", topics: ["Factors affecting distribution", "Symbiotic interactions", "Natural habitats", "Nigerian biomes", "Population ecology", "Soil", "Humans and environment"] },
  ],
  Chemistry: [
    { label: "Matter and chemical principles", topics: ["Separation of mixtures", "Chemical combination", "Kinetic theory of matter and gases", "Atomic structure and bonding", "Nuclear chemistry", "Solubility"] },
    { label: "Reactions and energy", topics: ["Acids, bases and salts", "Oxidation and reduction", "Electrolysis", "Energy changes", "Rates of reaction", "Chemical equilibria"] },
    { label: "Elements, compounds and applications", topics: ["Non-metals and their compounds", "Metals and their compounds", "Organic compounds", "Chemistry and industry", "Environmental pollution", "Astronomical chemistry"] },
  ],
  Physics: [
    { label: "Mechanics and properties of matter", topics: ["Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces", "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest"] },
    { label: "Heat and thermal physics", topics: ["Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion", "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer"] },
    { label: "Waves, light and sound", topics: ["Waves", "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction", "Optical instruments", "Dispersion and colours"] },
    { label: "Electricity, magnetism and modern physics", topics: ["Electrostatics", "Capacitors", "Electric cells", "Current electricity", "Electrical energy and power", "Magnets and magnetic fields", "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits", "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers"] },
  ],
};

export function getSyllabusParentGroups(subject: SyllabusSubject): readonly SyllabusParentGroup[] {
  const official = new Set(OFFICIAL_SYLLABUS_AREAS[subject]);
  return GROUPS[subject].map((group) => ({ ...group, topics: group.topics.filter((topic) => official.has(topic)) }));
}

export function getSyllabusParentLabel(subject: SyllabusSubject, topic: string): string | null {
  return getSyllabusParentGroups(subject).find((group) => group.topics.includes(topic))?.label ?? null;
}
