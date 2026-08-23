import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpenCheck, Check, ChevronRight, Compass, Flag, Map, Route, ShieldCheck, Sparkles, Stamp, X } from "lucide-react";
import { formatLearnerText } from "@/game/learnerText";
import type { BankQuestion, Subject } from "@/game/types";
import { readArcadeProfile, selectArcadeQuestions, type ExpeditionArcadeState, writeArcadeProfile } from "@/game/arcadeProfile";
import "./quest-rush.css";

const subjects: Array<{ subject: Subject; short: string; accent: string; icon: string }> = [
  { subject: "Use of English", short: "ENG", accent: "english", icon: "✦" },
  { subject: "Biology", short: "BIO", accent: "biology", icon: "⌘" },
  { subject: "Chemistry", short: "CHE", accent: "chemistry", icon: "◌" },
  { subject: "Physics", short: "PHY", accent: "physics", icon: "⌁" },
];

const contracts = [
  { id: "scout", name: "Scout Route", length: 5, subtitle: "A careful first connection", reward: "1 map segment" },
  { id: "builder", name: "Builder Route", length: 10, subtitle: "Build a dependable study line", reward: "2 map segments" },
  { id: "mastery", name: "Mastery Route", length: 15, subtitle: "Secure a long learning corridor", reward: "3 map segments" },
] as const;

const tools = [
  { id: "lens", name: "Topic Lens", description: "Reveal the syllabus territory before every question." },
  { id: "focus", name: "Focus Stamp", description: "Earn one extra subject stamp for each correct answer." },
  { id: "recovery", name: "Recovery Pass", description: "Protect your route integrity from the first wrong answer." },
] as const;

type ContractId = (typeof contracts)[number]["id"];
type ToolId = (typeof tools)[number]["id"];
type ExpeditionPhase = "setup" | "playing" | "results";
type ExpeditionAnswer = { questionId: string; selectedIndex: number; correct: boolean };
type Passport = ExpeditionArcadeState;

const blankPassport = (): Passport => ({ stamps: {}, routes: [], recentQuestionIds: [] });

export function QuestRush({ questions, defaultSubject = "Biology", onExit, onOpenCorrection, autoStart = false }: { questions: BankQuestion[]; defaultSubject?: Subject; onExit: () => void; onOpenCorrection: (subject: Subject, questionIds: string[]) => void; autoStart?: boolean }) {
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [contractId, setContractId] = useState<ContractId>("builder");
  const [toolId, setToolId] = useState<ToolId>("lens");
  const [phase, setPhase] = useState<ExpeditionPhase>("setup");
  const [route, setRoute] = useState<BankQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ExpeditionAnswer[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [integrity, setIntegrity] = useState(3);
  const [recoveryUsed, setRecoveryUsed] = useState(false);
  const [passport, setPassport] = useState<Passport>(blankPassport);
  const [playerName, setPlayerName] = useState("");
  const [sessionStamps, setSessionStamps] = useState(0);
  const autoStarted = useRef(false);
  const awardSaved = useRef(false);

  const contract = contracts.find((item) => item.id === contractId) ?? contracts[1];
  const available = useMemo(() => questions.filter((question) => question.subject === subject), [questions, subject]);
  const question = route[index];
  const incorrectIds = answers.filter((answer) => !answer.correct).map((answer) => answer.questionId);
  const correctCount = answers.filter((answer) => answer.correct).length;
  const accuracy = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
  const routeKey = `${subject}:${contractId}`;
  const mapSegments = contractId === "scout" ? 1 : contractId === "builder" ? 2 : 3;
  const segmentAward = accuracy >= 70 && integrity > 0 ? mapSegments : 0;

  useEffect(() => { const profile = readArcadeProfile(); setPassport(profile.expedition); setPlayerName(profile.displayName); }, []);

  const persistPassport = (next: Passport) => {
    setPassport(next);
    const profile = readArcadeProfile();
    writeArcadeProfile({ ...profile, expedition: next });
  };

  const start = () => {
    const selected = selectArcadeQuestions(available, subject, Math.min(contract.length, available.length), passport.recentQuestionIds);
    awardSaved.current = false;
    setRoute(selected);
    setIndex(0);
    setAnswers([]);
    setFeedback(null);
    setIntegrity(3);
    setRecoveryUsed(false);
    setSessionStamps(0);
    setPhase("playing");
  };

  useEffect(() => {
    if (!autoStart || autoStarted.current || phase !== "setup" || available.length < 5) return;
    autoStarted.current = true;
    start();
  }, [autoStart, available.length, phase]);

  useEffect(() => {
    if (phase !== "results" || awardSaved.current || !route.length) return;
    awardSaved.current = true;
    const isNewRoute = !passport.routes.includes(routeKey);
    const earnedStamps = sessionStamps + segmentAward;
    const next: Passport = {
      stamps: { ...passport.stamps, [subject]: (passport.stamps[subject] ?? 0) + earnedStamps },
      routes: isNewRoute && segmentAward ? [...passport.routes, routeKey] : passport.routes,
      recentQuestionIds: [...passport.recentQuestionIds, ...route.map((item) => item.id)].slice(-120),
    };
    persistPassport(next);
  }, [phase, route.length, passport, routeKey, segmentAward, sessionStamps, subject]);

  const selectAnswer = (selectedIndex: number) => {
    if (!question || feedback) return;
    const correct = selectedIndex === question.answer_index;
    if (correct) setSessionStamps((value) => value + (toolId === "focus" ? 2 : 1));
    if (!correct) {
      if (toolId === "recovery" && !recoveryUsed) setRecoveryUsed(true);
      else setIntegrity((value) => Math.max(0, value - 1));
    }
    setAnswers((value) => [...value, { questionId: question.id, selectedIndex, correct }]);
    setFeedback(correct ? "correct" : "wrong");
  };

  const continueRoute = () => {
    if (index + 1 >= route.length) setPhase("results");
    else { setIndex((value) => value + 1); setFeedback(null); }
  };

  if (phase === "setup") return <section className="quest-rush expedition" aria-labelledby="expedition-title">
    <header className="quest-rush-head"><button className="quest-rush-close" onClick={onExit}><X size={17} /> Back to practice</button><span className="quest-rush-brand" aria-label="JAMB Quest"><i /><i /><i /><i /><b>JAMB QUEST</b></span><span className="quest-rush-stamp"><Map size={15} /> STUDY EXPEDITION</span></header>
    <div className="expedition-hero"><div><div className="expedition-brand-seal" aria-label="JAMB Quest Study Expedition"><span><i /><i /><i /><i /></span><b>JAMB QUEST</b><small>APPROVED QUESTION MAP</small></div><span className="eyebrow">{playerName ? `${playerName.toUpperCase()} / YOUR STUDY MAP` : "YOUR BOARD / YOUR ROUTE"}</span><h1 id="expedition-title">Build a learning map.<br /><em>Not a countdown.</em></h1><p>Choose a territory, sign a route contract, and collect study stamps by answering approved JAMB questions. Every miss becomes a repair card—not a dead end.</p><div className="expedition-passport"><Stamp size={18} /><span><b>{Object.values(passport.stamps).reduce((sum, value) => sum + value, 0)}</b> study stamps collected</span><span><b>{passport.routes.length}</b> routes secured</span></div></div><div className="expedition-map-art" aria-hidden="true"><img src="/manus-storage/study-expedition-board_e70ad981.png" alt="" /><div className="expedition-map-overlay"><span>START</span><i /><i /><i /><i /><b>JAMB<br />MAP</b></div></div></div>
    <div className="expedition-rules" aria-label="Study Expedition learning safeguards"><span><ShieldCheck size={16} /> Uses approved JAMB Quest questions only</span><span><BookOpenCheck size={16} /> Every miss becomes a repair card</span><span><Compass size={16} /> No timer, no CBT overwrite, no chance mechanics</span></div>
    <section className="expedition-setup"><div className="expedition-step"><span className="eyebrow">01 / CHOOSE A TERRITORY</span><div className="quest-rush-subjects">{subjects.map((item) => <button key={item.subject} className={`quest-rush-subject ${item.accent} ${subject === item.subject ? "active" : ""}`} onClick={() => setSubject(item.subject)}><b>{item.short}</b><span>{item.subject}</span><small>{questions.filter((question) => question.subject === item.subject).length} question cards</small><i>{passport.stamps[item.subject] ?? 0} stamps</i></button>)}</div></div>
      <div className="expedition-step"><span className="eyebrow">02 / SIGN A ROUTE CONTRACT</span><div className="expedition-contracts">{contracts.map((item) => <button key={item.id} className={`expedition-contract ${contractId === item.id ? "active" : ""}`} onClick={() => setContractId(item.id)}><Flag size={16} /><b>{item.name}</b><span>{item.length} question cards</span><small>{item.subtitle}</small><i>{item.reward}</i></button>)}</div></div>
      <div className="expedition-step"><span className="eyebrow">03 / PACK ONE STUDY TOOL</span><div className="expedition-tools">{tools.map((item) => <button key={item.id} className={`expedition-tool ${toolId === item.id ? "active" : ""}`} onClick={() => setToolId(item.id)}><Sparkles size={15} /><b>{item.name}</b><small>{item.description}</small></button>)}</div></div>
    </section>
    <footer className="expedition-launch"><div><span className="eyebrow">YOUR NEXT MOVE</span><b>{subject} · {contract.name}</b><small>{contract.length} question cards · up to {mapSegments} map segment{mapSegments === 1 ? "" : "s"} · {tools.find((item) => item.id === toolId)?.name}</small></div><button className="button button-dark" onClick={start} disabled={available.length < 5}><Route size={17} /> Begin Expedition <ArrowRight size={17} /></button></footer>
  </section>;

  if (phase === "results") return <section className="quest-rush expedition expedition-results" aria-labelledby="expedition-results-title">
    <header className="quest-rush-head"><button className="quest-rush-close" onClick={onExit}><X size={17} /> Back to practice</button><span className="quest-rush-stamp"><Map size={15} /> ROUTE REPORT</span></header>
    <div className="quest-rush-result-hero"><div><span className="eyebrow">{subject.toUpperCase()} / {contract.name.toUpperCase()}</span><h1 id="expedition-results-title">Your route is<br /><em>{segmentAward ? "on the map." : "ready to repair."}</em></h1><p>{segmentAward ? `You secured ${segmentAward} map segment${segmentAward === 1 ? "" : "s"}. Keep the evidence honest by repairing every missed card.` : "This route needs a stronger correction pass before it earns its map segment. The board keeps the route open."}</p></div><div className="expedition-report"><Stamp size={23} /><b>{sessionStamps + segmentAward}</b><span>stamps earned</span><div><strong>{accuracy}%</strong><small>accuracy</small><strong>{integrity}/3</strong><small>route integrity</small></div></div></div>
    <div className="expedition-route-summary"><span>START</span>{route.map((item, itemIndex) => { const answer = answers[itemIndex]; return <i key={item.id} className={answer?.correct ? "correct" : answer ? "repair" : ""}>{answer?.correct ? <Check size={14} /> : answer ? "!" : itemIndex + 1}</i>; })}<span>DESTINATION</span></div>
    <div className="quest-rush-result-actions"><button className="button button-dark" onClick={start}><Route size={16} /> Take another route</button>{incorrectIds.length ? <button className="button button-outline" onClick={() => onOpenCorrection(subject, incorrectIds)}><BookOpenCheck size={16} /> Repair {incorrectIds.length} card{incorrectIds.length === 1 ? "" : "s"}</button> : <button className="button button-outline" onClick={onExit}>Return to practice</button>}</div>
    <section className="quest-rush-corrections" aria-label="Study Expedition repair cards"><div><span className="eyebrow">REPAIR CARD RACK</span><h2>{incorrectIds.length ? "Every missed card remains visible" : "Clean route — keep the signal honest"}</h2></div>{incorrectIds.length ? answers.filter((answer) => !answer.correct).map((answer) => { const missed = route.find((item) => item.id === answer.questionId); return missed ? <details key={missed.id}><summary><span>{missed.topic}</span><b>Open repair card</b></summary><p>{formatLearnerText(missed.question)}</p><strong>Correct answer: {formatLearnerText(missed.answer_text)}</strong><small>{formatLearnerText(missed.explanation)}</small></details> : null; }) : <p className="quest-rush-clean-note"><Check size={18} /> All route cards were correct. Choose a longer contract or explore another territory.</p>}</section>
  </section>;

  return <section className="quest-rush expedition expedition-play" aria-live="polite">
    <header className="quest-rush-head"><button className="quest-rush-close" onClick={onExit}><X size={17} /> Leave expedition</button><span className="quest-rush-brand" aria-label="JAMB Quest"><i /><i /><i /><i /><b>JAMB QUEST</b></span><span className="quest-rush-stamp"><Compass size={15} /> {contract.name.toUpperCase()}</span></header>
    <div className="expedition-play-status"><div><span>{subject}</span><b>Card {index + 1} of {route.length}</b></div><div className="expedition-integrity" aria-label={`Route integrity ${integrity} of 3`}>{[0, 1, 2].map((mark) => <i key={mark} className={mark < integrity ? "full" : ""} />)}<small>route integrity</small></div><div><span>PACKED TOOL</span><b>{tools.find((item) => item.id === toolId)?.name}</b></div></div>
    <div className="expedition-route-line" aria-hidden="true"><span>BASE</span>{route.map((item, itemIndex) => <i key={item.id} className={itemIndex < index ? (answers[itemIndex]?.correct ? "correct" : "repair") : itemIndex === index ? "current" : ""}>{itemIndex + 1}</i>)}<span>MAP</span></div>
    {question && <article className={`quest-rush-question ${feedback ?? ""}`}><span className="eyebrow">ROUTE CARD {String(index + 1).padStart(2, "0")}</span>{toolId === "lens" && <span className="quest-rush-topic">Territory: {question.topic}</span>}{question.diagram_url && <img src={question.diagram_url} alt="Question visual" />}<h1>{formatLearnerText(question.question)}</h1><div className="quest-rush-options">{question.options.map((option, optionIndex) => <button key={`${question.id}-${optionIndex}`} className={`${feedback && optionIndex === question.answer_index ? "correct" : ""} ${feedback === "wrong" && answers.at(-1)?.selectedIndex === optionIndex ? "wrong" : ""}`} onClick={() => selectAnswer(optionIndex)} disabled={Boolean(feedback)}><b>{String.fromCharCode(65 + optionIndex)}</b><span>{formatLearnerText(option)}</span>{feedback && optionIndex === question.answer_index && <Check size={18} />}</button>)}</div>{feedback && <div className={`quest-rush-feedback ${feedback}`}><b>{feedback === "correct" ? "Route card secured." : "This card needs a repair note."}</b><small>{feedback === "wrong" ? `Correct answer: ${formatLearnerText(question.answer_text)} — ` : ""}{formatLearnerText(question.explanation)}</small><button className="button button-dark" onClick={continueRoute}>{index + 1 >= route.length ? "Read route report" : "Continue route"} <ChevronRight size={16} /></button></div>}</article>}
  </section>;
}
