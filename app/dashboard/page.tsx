import type { Metadata } from "next";
import JambQuestApp from "@/components/jamb-quest-app";

export const metadata: Metadata = {
  title: "JAMB Quest",
  description: "The complete JAMB CBT practice and progress experience.",
};

export default function DashboardPage() {
  return <JambQuestApp />;
}
