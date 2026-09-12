"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuizPage() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject") || "General";
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Placeholder questions - replace with actual data from tRPC
  const questions = [
    {
      id: 1,
      question: "What is the basic unit of life?",
      options: ["Atom", "Cell", "Molecule", "Organ"],
      correct: "Cell",
      explanation: "The cell is considered the basic unit of life as it is the smallest unit that can carry out all life processes.",
    },
  ];

  const question = questions[currentQuestion];

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {subject} Quiz
          </h1>
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-base font-semibold">{Math.round((currentQuestion + 1) / questions.length * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestion + 1) / questions.length * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question {currentQuestion + 1}</CardTitle>
            <CardDescription>Choose the correct answer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-6">
              {question.question}
            </p>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showExplanation && handleAnswer(option)}
                  disabled={showExplanation}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === option
                      ? option === question.correct
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-red-500 bg-red-50 dark:bg-red-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Explanation
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {question.explanation}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentQuestion === questions.length - 1 || !showExplanation}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
