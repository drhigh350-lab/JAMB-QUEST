"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function QuizCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStartQuiz = () => {
    startTransition(() => {
      router.push("/quiz");
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold mb-2">Biology Practice</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Master biology concepts with our comprehensive question set
        </p>
        <Button onClick={handleStartQuiz} disabled={isPending}>
          {isPending ? "Loading..." : "Start Quiz"}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold mb-2">Chemistry Practice</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Practice chemistry problems and improve your exam readiness
        </p>
        <Button onClick={handleStartQuiz} disabled={isPending}>
          {isPending ? "Loading..." : "Start Quiz"}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold mb-2">Physics Practice</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Test your physics knowledge with challenging questions
        </p>
        <Button onClick={handleStartQuiz} disabled={isPending}>
          {isPending ? "Loading..." : "Start Quiz"}
        </Button>
      </div>
    </div>
  );
}
