import type { Metadata } from "next";
import { QuizCard } from "@/components/quiz-card";

export const metadata: Metadata = {
  title: "Dashboard - JAMB Quest",
  description: "Your personalized JAMB practice dashboard",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back to JAMB Quest
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Continue your exam preparation with our comprehensive question bank
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Questions Attempted</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">0</p>
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Correct Answers</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">0</p>
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Success Rate</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">0%</p>
          </div>
        </div>

        {/* Quiz Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Practice by Subject
          </h2>
          <QuizCard />
        </div>
      </div>
    </div>
  );
}
