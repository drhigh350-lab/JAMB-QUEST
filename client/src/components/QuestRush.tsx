import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BrainCircuit, Check, CirclePause, CircleX, Flame, Lightbulb, Play, ShieldCheck, TimerReset, Trophy, X } from "lucide-react";
import { formatLearnerText } from "@/game/learnerText";
import type { BankQuestion, Subject } from "@/game/types";
import "./quest-rush.css";

const subjects: Array<{ subject: Subject; short: string; accent: string }> = [
  { subject: "Use of English", short: "ENG", accent: "english" },
  { subject: "Biology", short: "BIO", accent: "biology" },
  { subject: "Chemistry", short: "CHE", accent: "chemistry" },
  { subject: "Physics", short: "PHY", accent: "physics" },
];
const ROUND_LENGTH = 12;
const ROUND_SECONDS = 75;

type RushPhase = "setup" | "playing" | "paused" | "results";
type RushAnswer = { questionId: string; selectedIndex: number | null; correct: boolean };

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

function asClock(seconds: number) {
  return `0:${Math.max(0, seconds).toString().padStart(2, "0")}`;
}

export function QuestRush({ questions, defaultSubject = "Biology", onExit, onOpenCorrection, autoStart = false }: { questions: BankQuestion[]; defaultSubject?: Subject; onExit: () => void; onOpenCorrection: (subject: Subject, questionIds: string[]) => void; autoStart?: boolean }) {
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [phase, setPhase] = useState<RushPhase>("setup");
  const [round, setRound] = useState<BankQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answers, setAnswers] = useState<RushAnswer[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const nextTimer = useRef<number | null>(null);
  const autoStarted = useRef(false);
  const available = useMemo(() => questions.filter((question) => question.subject === subject), [questions, subject]);
  const question = round[index];
  const clearNextTimer = () => { if (nextTimer.current !== null) { window.clearTimeout(nextTimer.current); nextTimer.current = null; } };

  useEffect(() => () => clearNextTimer(), []);
  useEffect(() => {
    if (phase !== "playing") return;
    if (secondsLeft <= 0) {
      setPhase("results");
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft]);

  const start = () => {
    clearNextTimer();
    setRound(shuffled(available).slice(0, Math.min(ROUND_LENGTH, available.length)));
    setIndex(0);
    setSecondsLeft(ROUND_SECONDS);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setFeedback(null);
    setPhase("playing");
  };
  useEffect(() => {
    if (!autoStart || autoStarted.current || phase !== "setup" || available.length < 4) return;
    autoStarted.current = true;
    start();
  }, [autoStart, available.length, phase]);
  const finishQuestion = () => {
    clearNextTimer();
    if (index + 1 >= round.length) { setPhase("results"); return; }
    setIndex((value) => value + 1);
    setFeedback(null);
  };
  const selectAnswer = (selectedIndex: number) => {
    if (phase !== "playing" || !question || feedback) return;
    const correct = selectedIndex === question.answer_index;
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    setBestStreak((value) => Math.max(value, nextStreak));
    if (correct) setScore((value) => value + 100 + Math.min(streak, 10) * 10 + Math.min(secondsLeft, 10));
    setAnswers((value) => [...value, { questionId: question.id, selectedIndex, correct }]);
    setFeedback(correct ? "correct" : "wrong");
    nextTimer.current = window.setTimeout(finishQuestion, 850);
  };
  const incorrectIds = answers.filter((answer) => !answer.correct).map((answer) => answer.questionId);
  const correctCount = answers.filter((answer) => answer.correct).length;
  const accuracy = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;

  if (phase === "setup") return <section className="quest-rush" aria-labelledby="quest-rush-title">
    <header className="quest-rush-head"><button className="quest-rush-close" onClick={onExit}><X size={17} /> Back to practice</button><span className="quest-rush-brand" aria-label="JAMB Quest"><i /><i /><i /><i /><b>JAMB QUEST</b></span><span className="quest-rush-stamp"><BrainCircuit size={15} /> QUEST TAPE / RUSH</span></header>
    <div className="quest-rush-intro"><div><span className="eyebrow">FAST STUDY / SHORT BURST</span><h1 id="quest-rush-title">Turn tired practice<br /><em>into a live mission.</em></h1><p>Race through a short, focused question burst. Correct answers build score and momentum; every miss remains available for correction afterwards.</p></div><aside><Flame size={34} /><b>75 seconds</b><span>12 questions<br />one subject</span></aside></div>
    <div className="quest-rush-rules" aria-label="Quest Rush learning safeguards"><span><ShieldCheck size={16} /> Uses approved JAMB Quest questions only</span><span><Lightbulb size={16} /> Does not overwrite your CBT history</span><span><TimerReset size={16} /> Review every miss after the burst</span></div>
    <div className="quest-rush-setup"><div><span className="eyebrow">SELECT YOUR ARENA</span><h2>Choose one subject</h2><div className="quest-rush-subjects">{subjects.map((item) => <button key={item.subject} className={`quest-rush-subject ${item.accent} ${subject === item.subject ? "active" : ""}`} onClick={() => setSubject(item.subject)}><b>{item.short}</b><span>{item.subject}</span><small>{questions.filter((question) => question.subject === item.subject).length} ready</small></button>)}</div></div>
      <div className="quest-rush-start-card"><span>ROUND SETUP</span><b>{subject}</b><small>{Math.min(ROUND_LENGTH, available.length)} questions · {ROUND_SECONDS} seconds · streak points on</small><button className="button button-dark" onClick={start} disabled={available.length < 4}><Play size={16} /> Start Quest Rush <ArrowRight size={16} /></button>{available.length < 4 && <small className="quest-rush-warning">This subject needs at least four ready questions.</small>}</div>
    </div>
  </section>;

  if (phase === "paused") return <section className="quest-rush quest-rush-pause" aria-label="Quest Rush paused"><header className="quest-rush-head"><span className="quest-rush-stamp"><CirclePause size={15} /> PAUSED</span><button className="quest-rush-close" onClick={onExit}><X size={17} /> Exit rush</button></header><div className="quest-rush-pause-card"><CirclePause size={36} /><h1>Take a breath.</h1><p>Your short round is paused. Resume when you are ready, or return to normal practice; your CBT work remains untouched.</p><button className="button button-dark" onClick={() => setPhase("playing")}><Play size={16} /> Resume rush</button><button className="button button-outline" onClick={onExit}>Return to practice</button></div></section>;

  if (phase === "results") return <section className="quest-rush quest-rush-results" aria-labelledby="rush-results-title"><header className="quest-rush-head"><button className="quest-rush-close" onClick={onExit}><X size={17} /> Back to practice</button><span className="quest-rush-stamp"><Trophy size={15} /> ROUND COMPLETE</span></header><div className="quest-rush-result-hero"><div><span className="eyebrow">QUEST RUSH / EVIDENCE</span><h1 id="rush-results-title">Your burst is<br /><em>on the board.</em></h1><p>Speed can make practice lighter. Correction turns it into progress.</p></div><div className="quest-rush-score"><b>{score.toLocaleString()}</b><span>rush score</span><div><strong>{accuracy}%</strong><small>accuracy</small><strong>{bestStreak}</strong><small>best streak</small></div></div></div><div className="quest-rush-result-actions"><button className="button button-dark" onClick={start}><TimerReset size={16} /> Play another burst</button>{incorrectIds.length ? <button className="button button-outline" onClick={() => onOpenCorrection(subject, incorrectIds)}><Lightbulb size={16} /> Correct {incorrectIds.length} miss{incorrectIds.length === 1 ? "" : "es"}</button> : <button className="button button-outline" onClick={onExit}>Return to practice</button>}</div><section className="quest-rush-corrections" aria-label="Quest Rush corrections"><div><span className="eyebrow">ROUND CORRECTION</span><h2>{incorrectIds.length ? "See exactly what to repair" : "Clean round — protect the habit"}</h2></div>{incorrectIds.length ? answers.filter((answer) => !answer.correct).map((answer) => { const missed = round.find((item) => item.id === answer.questionId); return missed ? <details key={missed.id}><summary><CircleX size={17} /><span>{missed.topic}</span><b>Open correction</b></summary><p>{formatLearnerText(missed.question)}</p><strong>Correct answer: {formatLearnerText(missed.answer_text)}</strong><small>{formatLearnerText(missed.explanation)}</small></details> : null; }) : <p className="quest-rush-clean-note"><Check size={18} /> All answered questions were correct. Use another burst or a normal drill to keep the signal honest.</p>}</section></section>;

  return <section className="quest-rush quest-rush-play" aria-live="polite"><header className="quest-rush-head"><button className="quest-rush-close" onClick={() => setPhase("paused")}><CirclePause size={17} /> Pause</button><span className="quest-rush-stamp"><Flame size={15} /> {streak ? `${streak}× MOMENTUM` : "BUILD MOMENTUM"}</span><div className={`quest-rush-clock ${secondsLeft <= 15 ? "urgent" : ""}`}><span>TIME</span><b>{asClock(secondsLeft)}</b></div></header><div className="quest-rush-play-stats"><span>{subject} / {index + 1} of {round.length}</span><b>{score.toLocaleString()} pts</b><i style={{ width: `${round.length ? (index / round.length) * 100 : 0}%` }} /></div>{question && <article className={`quest-rush-question ${feedback ?? ""}`}><span className="eyebrow">QUESTION {String(index + 1).padStart(2, "0")}</span><span className="quest-rush-topic">{question.topic}</span>{question.diagram_url && <img src={question.diagram_url} alt="Question visual" />}<h1>{formatLearnerText(question.question)}</h1><div className="quest-rush-options">{question.options.map((option, optionIndex) => <button key={`${question.id}-${optionIndex}`} className={`${feedback && optionIndex === question.answer_index ? "correct" : ""} ${feedback === "wrong" && answers.at(-1)?.selectedIndex === optionIndex ? "wrong" : ""}`} onClick={() => selectAnswer(optionIndex)} disabled={Boolean(feedback)}><b>{String.fromCharCode(65 + optionIndex)}</b><span>{formatLearnerText(option)}</span>{feedback && optionIndex === question.answer_index && <Check size={18} />}</button>)}</div>{feedback && <div className={`quest-rush-feedback ${feedback}`}><b>{feedback === "correct" ? "Correct — momentum rising." : `Correct answer: ${formatLearnerText(question.answer_text)}`}</b><small>{formatLearnerText(question.explanation)}</small></div>}</article>}</section>;
}
