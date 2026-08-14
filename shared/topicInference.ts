export type TopicSubject = "Use of English" | "Biology" | "Chemistry" | "Physics";

const placeholder = "to be tagged during syllabus mapping";

export function inferVerifiedTopic(subject: TopicSubject, questionText: string) {
  const text = questionText.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);
  if (subject === "Chemistry") {
    if (has(/diffus|graham|vapou?r density|gas m|molar mass.*gas/)) return "Gas Laws and Diffusion";
    if (has(/equilibrium|le chatelier|equilibrium constant/)) return "Chemical Equilibrium";
    if (has(/rate of reaction|activation energy|catalyst|collision theory/)) return "Chemical Kinetics";
    if (has(/electroly|faraday|moles of electrons|cathode|anode/)) return "Electrochemistry";
    if (has(/acid|alkali|neutralis|aqua regia/)) return "Acids, Bases and Salts";
    if (has(/polymer|plastic|monomer|pvc|perspex|detergent/)) return "Organic Chemistry and Polymers";
    if (has(/moles|molar|empirical formula|percentage composition|solubility/)) return "Mole Concept and Stoichiometry";
    if (has(/benzene|alcohol|alkane|alkene|homologous|decarboxyl/)) return "Organic Chemistry";
    if (has(/iron|gold|steel|solder|extraction|blast furnace|ore/)) return "Metals and Extraction";
    if (has(/hydrogen|haber|bosch|chlorine|bleaching/)) return "Industrial Chemistry";
    if (has(/bond|ionisation|electron|periodic|atomic/)) return "Atomic Structure and Bonding";
  }
  if (subject === "Biology") {
    if (has(/gene|allele|chromosome|meiosis|mitosis|inheritance|blood group|sex-linked|evolution/)) return "Genetics and Evolution";
    if (has(/ecology|succession|savanna|food chain|ddt|pollution|brackish|desert/)) return "Ecology";
    if (has(/heart|blood|lung|kidney|brain|ear|liver|pancreas|hormone|excret/)) return "Human Physiology";
    if (has(/plant|flower|xylem|transpiration|photosynthesis|root|stamen/)) return "Plant Biology";
    if (has(/kingdom|phylum|taxonomic|classification|hydra|arthropod|monera|fungi|bacteria/)) return "Classification and Diversity";
    if (has(/cell|dna|protein|respiration|glucose|organelle|vacuole|structural and functional unit/)) return "Cell Biology and Metabolism";
  }
  if (subject === "Physics") {
    if (has(/current|voltage|resistance|transformer|fuse|circuit|power|ammeter|electric/)) return "Electricity";
    if (has(/wave|sound|light|mirror|lens|refraction|diffraction|doppler|colour|radioactivity/)) return "Waves, Optics and Modern Physics";
    if (has(/motion|velocity|acceleration|force|work|energy|momentum|projectile|pendulum/)) return "Mechanics";
    if (has(/heat|temperature|specific heat|thermal|viscosity/)) return "Thermal Physics";
    if (has(/magnetic|induction|motor|lenz|resonance/)) return "Magnetism and Electromagnetism";
  }
  return null;
}

export function inferTopicFromQuestion(subject: TopicSubject, questionText: string, suppliedTopic?: string) {
  const topic = suppliedTopic?.trim() ?? "";
  if (topic && topic.toLowerCase() !== placeholder) return topic;
  return inferVerifiedTopic(subject, questionText) ?? "Unclassified";
}
