import { useState } from "react";
import { OfflineStudyPackPanel } from "@/components/OfflineStudyPackPanel";
import { isUnsavedQuestionFlow } from "@/lib/appUpdateSafety";

export function DeferredAppUpdateFixture() {
  const startAfterExit = new URLSearchParams(window.location.search).get("afterExit") === "1";
  const [inQuestion, setInQuestion] = useState(!startAfterExit);
  const activeQuestionFlow = isUnsavedQuestionFlow(inQuestion ? "quiz" : "home", false);
  const updateStatus = activeQuestionFlow ? "deferred" as const : "idle" as const;
  return <main className="page-shell"><section className="fixture-notice"><span>UPDATE SAFETY CHECK</span><h1>{activeQuestionFlow ? "A question is still open." : "Question closed safely."}</h1><p>{activeQuestionFlow ? "The update remains deferred until you leave this question." : "The latest JAMB Quest update can now be applied."}</p><button className="button button-dark" data-testid="leave-question-for-update" onClick={() => setInQuestion(false)}>{activeQuestionFlow ? "Leave question safely" : "Update is ready"}</button></section><OfflineStudyPackPanel pwa={{ isOnline: true, canInstall: false, installStatus: "installed", onInstall: () => undefined, update: { available: true, status: updateStatus, onUpdate: () => undefined } }} /><output data-testid="deferred-update-status">{updateStatus}</output></main>;
}
