export type TopicSubject = "Use of English" | "Biology" | "Chemistry" | "Physics";

const placeholder = "to be tagged during syllabus mapping";

export function inferVerifiedTopic(subject: TopicSubject, questionText: string) {
  const text = questionText.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(text);
  if (subject === "Chemistry") {
    if (has(/diffus|graham|vapou?r density|gas m|molar mass.*gas/)) return "Gas Laws and Diffusion";
    if (has(/equilibrium|le chatelier|equilibrium constant|yield of ammonia|n₂.*h₂|n2.*h2/)) return "Chemical Equilibrium";
    if (has(/rate of reaction|activation energy|catalyst|collision theory/)) return "Chemical Kinetics";
    if (has(/electroly|faraday|moles of electrons|cathode|anode|conducting highest electricity|deposit.*magnesium|deposit.*aluminium/)) return "Electrochemistry";
    if (has(/acid|alkali|neutralis|aqua regia|lime-water|\bph\b|litmus/)) return "Acids, Bases and Salts";
    if (has(/oxidizing agent|reducing agent|oxidation state|oxidation of|oxidation.*so₂|oxidation.*so2/)) return "Redox Chemistry";
    if (has(/enthalpy|free energy|spontaneous/)) return "Energetics and Thermodynamics";
    if (has(/flame|combustion|fuel|anti-knock|tetraethyl lead/)) return "Combustion and Fuels";
    if (has(/petroleum|destructive distillation|fractional distillation|crude oil|coal/)) return "Hydrocarbons and Petroleum";
    if (has(/water treatment|hard water|brine|water supply|water is caused/)) return "Water and Its Treatment";
    if (has(/filtration|immiscible|separation technique|purification of bauxite/)) return "Separation Techniques";
    if (has(/molecules escaping|volatile|physical change|van der waals/)) return "States of Matter and Intermolecular Forces";
    if (has(/precipitate|unknown substance|qualitative|cation is/)) return "Qualitative Analysis";
    if (has(/polymer|plastic|monomer|pvc|perspex|detergent/)) return "Organic Chemistry and Polymers";
    if (has(/moles|molar|empirical formula|percentage composition|solubility|s\.t\.p|stp|water of crystallization/)) return "Mole Concept and Stoichiometry";
    if (has(/benzene|alcohol|alkane|alkene|homologous|decarboxyl|organic compound|ester|alkanone|ethanol|fermentation|functional group|soap/)) return "Organic Chemistry";
    if (has(/iron|gold|steel|solder|extraction|blast furnace|ore/)) return "Metals and Extraction";
    if (has(/hydrogen|haber|bosch|chlorine|bleaching|anaesthetic|aerodrome|miners.? lamps|ripen fruits/)) return "Industrial Chemistry";
    if (has(/bond|ionisation|electron|periodic|atomic|protons and neutrons|radiation|half-life|valency|methane.*shape/)) return "Atomic Structure and Bonding";
  }
  if (subject === "Biology") {
    if (has(/gene|allele|chromosome|meiosis|mitosis|inheritance|blood group|sex-linked|evolution/)) return "Genetics and Evolution";
    if (has(/ecology|succession|savanna|food chain|ddt|pollution|brackish|desert/)) return "Ecology";
    if (has(/termite|colony|behavio[u]?r|courtship|territorial/)) return "Behaviour and Social Organization";
    if (has(/disease|sexually transmitted|immuni[sz]|pathogen|infection/)) return "Health and Disease";
    if (has(/vitamin|deficiency|balanced diet|nutrient|malnutrition/)) return "Nutrition and Diet";
    if (has(/humidity|soil|drainage|structural adaptation|biological control|ecosystem|rainfall|vegetation|population|habitat|food producer/)) return "Ecology";
    if (has(/fertili[sz]|reproductive|ovary|testes|uterus|pregnan|menstru|gamete/)) return "Reproduction";
    if (has(/nitrogenous waste|osmoreg|malpighian|excess water|urine|urea|ammonia/)) return "Excretion and Osmoregulation";
    if (has(/enzyme|digestive|digestion|nutrition|stomach|pepsin/)) return "Nutrition and Digestion";
    if (has(/respiratory|gaseous exchange|trachea|alveoli|submerged/)) return "Respiration and Gas Exchange";
    if (has(/fibrinogen|prothrombin|platelet|blood clot|circulation/)) return "Blood and Circulation";
    if (has(/insulin|pituitary|endocrine|master gland/)) return "Endocrine Regulation";
    if (has(/eye|retina|atlas|axis|bone|skeletal|vitamin d|joint|muscle|vertebrae|exoskeleton/)) return "Support, Movement and Sensory Systems";
    if (has(/bulb|germination|cotyledon|hypocotyl|epicotyl|seed dispersal/)) return "Plant Growth and Reproduction";
    if (has(/heart|blood|lung|kidney|brain|ear|liver|pancreas|hormone|excret/)) return "Human Physiology";
    if (has(/plant|flower|xylem|transpiration|photosynthesis|root|stamen/)) return "Plant Biology";
    if (has(/kingdom|phylum|taxonomic|classification|hydra|arthropod|monera|fungi|bacteria|biological organization|organism division|maize belongs|scales, teeth|nares|vertebrate|paramecium|homodont|aves|mammal|flightless bird/)) return "Classification and Diversity";
    if (has(/cell|dna|protein|respiration|glucose|organelle|vacuole|structural and functional unit/)) return "Cell Biology and Metabolism";
  }
  if (subject === "Physics") {
    if (has(/current|voltage|resistance|transformer|fuse|circuit|power|ammeter|electric|electroscope|semiconductor|ohm.?s law|silicon|germanium/)) return "Electricity and Electronics";
    if (has(/wave|sound|light|mirror|lens|refraction|diffraction|doppler|colour|radioactivity|camera|short-sighted|vibration|x-ray|pin mistakenly/)) return "Waves, Optics and Modern Physics";
    if (has(/motion|velocity|acceleration|force|work|energy|momentum|projectile|pendulum|fall freely|friction|vector|magnitude and direction/)) return "Mechanics";
    if (has(/heat|temperature|specific heat|thermal|viscosity|thermometric|dew|radiation|melting point/)) return "Thermal Physics";
    if (has(/magnetic|induction|motor|lenz|resonance/)) return "Magnetism and Electromagnetism";
  }
  return null;
}

export function inferTopicFromQuestion(subject: TopicSubject, questionText: string, suppliedTopic?: string) {
  const topic = suppliedTopic?.trim() ?? "";
  if (topic && topic.toLowerCase() !== placeholder) return topic;
  return inferVerifiedTopic(subject, questionText) ?? "Unclassified";
}
