export function isUnsavedQuestionFlow(screen: string, historicalReview: boolean) {
  return screen === "quiz" && !historicalReview;
}
