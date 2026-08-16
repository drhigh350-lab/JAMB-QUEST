export function getTypewriterStepDelay(character: string) {
  if (/[,;:]/.test(character)) return 86;
  if (/[.!?]/.test(character)) return 148;
  if (/\s/.test(character)) return 26;
  return 38;
}

export function getTypewriterDuration(text: string) {
  return Array.from(text).reduce((total, character) => total + getTypewriterStepDelay(character), 0);
}
