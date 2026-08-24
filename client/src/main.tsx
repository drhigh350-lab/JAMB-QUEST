import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import CbtFlowFixture from "./e2e/CbtFlowFixture";
import CalculatorFixture from "./e2e/CalculatorFixture";
import CbtResumeFixture from "./e2e/CbtResumeFixture";
import ProgressAnalyticsFixture from "./e2e/ProgressAnalyticsFixture";
import ReadyQuestionCountFixture from "./e2e/ReadyQuestionCountFixture";
import RealGameCbtFixture from "./e2e/RealGameCbtFixture";
import RecoveryEmptyStateFixture from "./e2e/RecoveryEmptyStateFixture";
import ReminderFixture from "./e2e/ReminderFixture";
import QuizFlowFixture from "./e2e/QuizFlowFixture";
import SubmittedRichQuestionFixture from "./e2e/SubmittedRichQuestionFixture";
import TopicPracticeFixture from "./e2e/TopicPracticeFixture";
import LekkiChapterLaunchFixture from "./e2e/LekkiChapterLaunchFixture";
import FiveOptionCbtFixture from "./e2e/FiveOptionCbtFixture";
import OpeningSequenceFixture from "./e2e/OpeningSequenceFixture";
import EnglishQuestionPresentationFixture from "./e2e/EnglishQuestionPresentationFixture";
import { QuestRushFixture } from "./e2e/QuestRushFixture";
import { PresidentsDeskFixture } from "./e2e/PresidentsDeskFixture";
import { GameArcadeLaunchFixture } from "./e2e/GameArcadeLaunchFixture";
import { GreatArchiveFixture } from "./e2e/GreatArchiveFixture";
import { SyllabusJourneyFixture } from "./e2e/SyllabusJourneyFixture";
import OwnerOriginalEnergyProfileFixture from "./e2e/OwnerOriginalEnergyProfileFixture";
import OwnerOriginalOrganicStructureFixture from "./e2e/OwnerOriginalOrganicStructureFixture";
import OwnerOriginalBiologyPlantTransportFixture from "./e2e/OwnerOriginalBiologyPlantTransportFixture";
import AchievementSharePngFixture from "./e2e/AchievementSharePngFixture";
import { DeferredAppUpdateFixture } from "./e2e/DeferredAppUpdateFixture";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();
const isRealCountProbe = new URLSearchParams(window.location.search).get("e2eRealCountProbe") === "1";

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (isRealCountProbe) return;
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const isQuizFlowFixture = new URLSearchParams(window.location.search).get("e2eQuizFixture") === "1";
const isCbtFlowFixture = new URLSearchParams(window.location.search).get("e2eCbtFixture") === "1";
const isProgressAnalyticsFixture = new URLSearchParams(window.location.search).get("e2eProgressAnalyticsFixture") === "1";
const isReadyQuestionCountFixture = new URLSearchParams(window.location.search).get("e2eReadyQuestionCountFixture") === "1";
const isRealGameCbtFixture = new URLSearchParams(window.location.search).get("e2eRealGameCbtFixture") === "1";
const isRecoveryEmptyStateFixture = new URLSearchParams(window.location.search).get("e2eRecoveryEmptyFixture") === "1";
const isSubmittedRichQuestionFixture = new URLSearchParams(window.location.search).get("e2eSubmittedRichQuestionFixture") === "1";
const isCalculatorFixture = new URLSearchParams(window.location.search).get("e2eCalculatorFixture") === "1";
const isCbtResumeFixture = new URLSearchParams(window.location.search).get("e2eCbtResumeFixture") === "1";
const isTopicPracticeFixture = new URLSearchParams(window.location.search).get("e2eTopicPracticeFixture") === "1";
const isReminderFixture = new URLSearchParams(window.location.search).get("e2eReminderFixture") === "1";
const isLekkiChapterFixture = new URLSearchParams(window.location.search).get("e2eLekkiChapterFixture") === "1";
const isFiveOptionCbtFixture = new URLSearchParams(window.location.search).get("e2eFiveOptionCbtFixture") === "1";
const isOpeningSequenceFixture = new URLSearchParams(window.location.search).get("e2eOpeningSequenceFixture") === "1";
const isEnglishQuestionPresentationFixture = new URLSearchParams(window.location.search).get("e2eEnglishQuestionPresentationFixture") === "1";
const isQuestRushFixture = new URLSearchParams(window.location.search).get("e2eQuestRushFixture") === "1";
const isPresidentsDeskFixture = new URLSearchParams(window.location.search).get("e2ePresidentsDeskFixture") === "1";
const isGameArcadeLaunchFixture = new URLSearchParams(window.location.search).get("e2eGameArcadeLaunchFixture") === "1";
const isGreatArchiveFixture = new URLSearchParams(window.location.search).get("e2eGreatArchiveFixture") === "1";
const isSyllabusJourneyFixture = new URLSearchParams(window.location.search).get("e2eSyllabusJourneyFixture") === "1";
const isOwnerOriginalEnergyProfileFixture = new URLSearchParams(window.location.search).get("e2eOwnerOriginalEnergyProfileFixture") === "1";
const isOwnerOriginalOrganicStructureFixture = new URLSearchParams(window.location.search).get("e2eOwnerOriginalOrganicStructureFixture") === "1";
const isOwnerOriginalBiologyPlantTransportFixture = new URLSearchParams(window.location.search).get("e2eOwnerOriginalBiologyPlantTransportFixture") === "1";
const isAchievementSharePngFixture = new URLSearchParams(window.location.search).get("e2eAchievementSharePngFixture") === "1";
const isDeferredAppUpdateFixture = new URLSearchParams(window.location.search).get("e2eDeferredAppUpdateFixture") === "1";

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      {isDeferredAppUpdateFixture ? <DeferredAppUpdateFixture /> : isAchievementSharePngFixture ? <AchievementSharePngFixture /> : isCalculatorFixture ? <CalculatorFixture /> : isQuizFlowFixture ? <QuizFlowFixture /> : isCbtFlowFixture ? <CbtFlowFixture /> : isProgressAnalyticsFixture ? <ProgressAnalyticsFixture /> : isReadyQuestionCountFixture ? <ReadyQuestionCountFixture /> : isRealGameCbtFixture ? <RealGameCbtFixture /> : isCbtResumeFixture ? <CbtResumeFixture /> : isRecoveryEmptyStateFixture ? <RecoveryEmptyStateFixture /> : isSubmittedRichQuestionFixture ? <SubmittedRichQuestionFixture /> : isTopicPracticeFixture ? <TopicPracticeFixture /> : isLekkiChapterFixture ? <LekkiChapterLaunchFixture /> : isFiveOptionCbtFixture ? <FiveOptionCbtFixture /> : isOpeningSequenceFixture ? <OpeningSequenceFixture /> : isEnglishQuestionPresentationFixture ? <EnglishQuestionPresentationFixture /> : isQuestRushFixture ? <QuestRushFixture /> : isPresidentsDeskFixture ? <PresidentsDeskFixture /> : isGreatArchiveFixture ? <GreatArchiveFixture /> : isSyllabusJourneyFixture ? <SyllabusJourneyFixture /> : isGameArcadeLaunchFixture ? <GameArcadeLaunchFixture /> : isOwnerOriginalEnergyProfileFixture ? <OwnerOriginalEnergyProfileFixture /> : isOwnerOriginalOrganicStructureFixture ? <OwnerOriginalOrganicStructureFixture /> : isOwnerOriginalBiologyPlantTransportFixture ? <OwnerOriginalBiologyPlantTransportFixture /> : isReminderFixture ? <ReminderFixture /> : <App />}
    </QueryClientProvider>
  </trpc.Provider>
);
