import { CheckCircle2, Copy, Crown, Link2, Play, Trophy, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BankQuestion } from "@/game/types";
import { trpc } from "@/lib/trpc";
import "./challenge-mode.css";

type ChallengeScreen = "home" | "play" | "result";

type ChallengeModeProps = {
  questions: BankQuestion[];
  onExit: () => void;
  initialCode?: string;
};

function cleanCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export function ChallengeMode({ questions, onExit, initialCode = "" }: ChallengeModeProps) {
  const [screen, setScreen] = useState<ChallengeScreen>("home");
  const [challengeCode, setChallengeCode] = useState(cleanCode(initialCode));
  const [name, setName] = useState("");
  const [challengeName, setChallengeName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(questions.slice(0, 10).map((question) => question.id));
  const [pickerSubject, setPickerSubject] = useState<"All" | BankQuestion["subject"]>("All");
  const [showSharedLeaderboard, setShowSharedLeaderboard] = useState(Boolean(initialCode));
  const [sharedLinkMode, setSharedLinkMode] = useState(Boolean(initialCode));
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<{ correctCount: number; questionCount: number; score: number; participantName: string } | null>(null);
  const [notice, setNotice] = useState("");
  const challengeQuery = trpc.challenges.get.useQuery({ challengeCode }, { enabled: challengeCode.length >= 6, retry: false });
  const leaderboardQuery = trpc.challenges.leaderboard.useQuery({ challengeCode }, { enabled: challengeCode.length >= 6 && (screen === "result" || Boolean(challengeQuery.data)), retry: false });
  const createMutation = trpc.challenges.create.useMutation({
    onSuccess: (created) => {
      setChallengeCode(created.challengeCode);
      setNotice(`Your challenge is ready: ${created.challengeCode}`);
      void navigator.clipboard?.writeText(`${window.location.origin}/?challenge=${created.challengeCode}`);
    },
    onError: (error) => setNotice(error.message),
  });
  const submitMutation = trpc.challenges.submit.useMutation({
    onSuccess: (submitted) => { setResult(submitted); setScreen("result"); void leaderboardQuery.refetch(); },
    onError: (error) => setNotice(error.message),
  });
  const playableQuestions = challengeQuery.data?.questions ?? [];
  const creatorLink = challengeCode ? `${window.location.origin}/?challenge=${challengeCode}` : "";
  const pickerSubjects = useMemo(() => ["All", ...Array.from(new Set(questions.map((question) => question.subject)))], [questions]);
  const pickerQuestions = useMemo(() => questions.filter((question) => pickerSubject === "All" || question.subject === pickerSubject).slice(0, 60), [pickerSubject, questions]);

  const toggleQuestion = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 30 ? [...current, id] : current);
  };

  const startChallenge = () => {
    if (!challengeQuery.data) return;
    setAnswers({}); setNotice(""); setStartedAt(Date.now()); setScreen("play");
  };

  const copyLink = async () => {
    if (!creatorLink) return;
    try { await navigator.clipboard.writeText(creatorLink); setNotice("Share link copied."); } catch { setNotice(creatorLink); }
  };

  const submit = () => {
    if (!challengeQuery.data || !name.trim()) { setNotice("Enter your name first."); return; }
    const durationSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    submitMutation.mutate({ challengeCode, participantName: name, durationSeconds, answers: playableQuestions.map((question) => ({ questionId: question.questionId, selectedIndex: answers[question.questionId] ?? null })) });
  };

  if (screen === "play" && challengeQuery.isLoading) return <main className="challenge-mode"><div className="challenge-loading">Opening your shared challenge…</div></main>;

  return <main className="challenge-mode" aria-labelledby="challenge-mode-title">
    <header className="challenge-head"><button className="challenge-back" onClick={onExit}><X size={17} /> Back to Arcade</button><span className="challenge-kicker"><Trophy size={16} /> ARCADE / CHALLENGE MODE</span><span className="challenge-live"><span /> GLOBAL SCOREBOARD</span></header>
    {screen === "home" && <>
      <section className="challenge-hero"><div><span className="eyebrow">MAKE A SHARED JAMB QUEST</span><h1 id="challenge-mode-title">Challenge your people.</h1><p>Pick approved JAMB Quest questions, give your challenge a name, and send the link. Everyone answers the same quiz and joins the same leaderboard.</p></div><div className="challenge-hero-mark"><Users size={30} /><b>REAL<br />QUESTIONS</b></div></section>
      {sharedLinkMode && challengeQuery.data && <section className="challenge-shared-landing"><div><span className="eyebrow">YOU HAVE A SHARED CHALLENGE</span><h2>{challengeQuery.data.challengeName}</h2><p>{challengeQuery.data.questionCount} questions · {challengeQuery.data.subjectScope} · one global leaderboard</p></div><div className="challenge-shared-actions"><button className="challenge-primary" onClick={startChallenge}><Play size={16} /> Play this challenge</button><button className="challenge-secondary" onClick={() => setShowSharedLeaderboard((value) => !value)}><Trophy size={16} /> {showSharedLeaderboard ? "Hide leaderboard" : "See leaderboard"}</button><button className="challenge-secondary" onClick={() => { setChallengeCode(""); setSharedLinkMode(false); setShowSharedLeaderboard(false); }}>Create your own</button></div>{showSharedLeaderboard && <div className="challenge-shared-leaderboard">{leaderboardQuery.data?.length ? leaderboardQuery.data.slice(0, 5).map((row) => <div className="leaderboard-row" key={`${row.rank}-${row.participantName}`}><b>{row.rank}</b><span>{row.participantName}</span><strong>{row.correctCount}/{row.questionCount}</strong><em>{row.score} pts</em></div>) : <p>No one has played yet. You can be the first.</p>}</div>}</section>}
      <section className="challenge-grid">
        <article className="challenge-card challenge-create-card"><span className="eyebrow">CREATE A CHALLENGE</span><h2>Name your battle.</h2><p>Choose between 5 and 30 questions from the approved JAMB Quest bank.</p><label>Challenge name<input value={challengeName} onChange={(event) => setChallengeName(event.target.value)} placeholder="Biology Boss Battle" maxLength={80} /></label><div className="challenge-question-picker"><div className="picker-head"><b>{selectedIds.length} questions picked</b><button onClick={() => setSelectedIds(questions.slice(0, 10).map((question) => question.id))}>Reset to 10</button></div><div className="picker-subjects" aria-label="Choose question subject">{pickerSubjects.map((subject) => <button key={subject} className={pickerSubject === subject ? "active" : ""} onClick={() => setPickerSubject(subject as "All" | BankQuestion["subject"])}>{subject}</button>)}</div><div className="picker-list">{pickerQuestions.map((question) => <button key={question.id} className={selectedIds.includes(question.id) ? "picked" : ""} onClick={() => toggleQuestion(question.id)}><span>{selectedIds.includes(question.id) ? "✓" : ""}</span><b>{question.subject}</b><small>{question.topic}</small></button>)}</div></div><button className="challenge-primary" disabled={createMutation.isPending || selectedIds.length < 5 || !challengeName.trim()} onClick={() => createMutation.mutate({ challengeName, questionIds: selectedIds })}><Play size={16} /> Create named challenge</button>{challengeCode && <div className="challenge-share-box"><b>{challengeName || "Your challenge"}</b><strong>{challengeCode}</strong><button onClick={copyLink}><Copy size={15} /> Copy share link</button></div>}</article>
        <article className="challenge-card challenge-join-card"><span className="eyebrow">JOIN A FRIEND</span><h2>Enter a code.</h2><p>Someone shared a JAMB Quest challenge? Put the code here and take your place.</p><label>Challenge code<input value={challengeCode} onChange={(event) => { setSharedLinkMode(false); setChallengeCode(cleanCode(event.target.value)); }} placeholder="A1B2C3D4" maxLength={16} /></label>{challengeQuery.error && <p className="challenge-error">{challengeQuery.error.message}</p>}{challengeQuery.data && <div className="challenge-found"><CheckCircle2 size={18} /><div><b>{challengeQuery.data.challengeName}</b><small>{challengeQuery.data.questionCount} questions · {challengeQuery.data.subjectScope}</small></div></div>}<button className="challenge-primary challenge-dark" disabled={!challengeQuery.data} onClick={startChallenge}><Link2 size={16} /> Open this challenge</button>{notice && <p className="challenge-notice">{notice}</p>}</article>
      </section>
    </>}
    {screen === "play" && challengeQuery.data && <section className="challenge-play"><div className="challenge-play-top"><div><span className="eyebrow">{challengeQuery.data.subjectScope}</span><h1 id="challenge-mode-title">{challengeQuery.data.challengeName}</h1><p>{challengeQuery.data.questionCount} questions · same questions for everybody</p></div><label>Your leaderboard name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={48} /></label></div><div className="challenge-question-stack">{playableQuestions.map((question, index) => <article className="challenge-question" key={question.questionId}><span className="challenge-question-number">{String(index + 1).padStart(2, "0")}</span><h2>{question.questionText}</h2>{question.diagramUrl && <img src={question.diagramUrl} alt="Question diagram" /> }<div className="challenge-options">{question.options.map((option, optionIndex) => <button key={`${question.questionId}-${optionIndex}`} className={answers[question.questionId] === optionIndex ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [question.questionId]: optionIndex }))}><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span></button>)}</div></article>)}</div><div className="challenge-submit-bar"><span>{Object.values(answers).filter((answer) => answer !== null && answer !== undefined).length} of {playableQuestions.length} answered</span><button className="challenge-primary" disabled={submitMutation.isPending} onClick={submit}><Trophy size={17} /> Finish and enter leaderboard</button></div></section>}
    {screen === "result" && result && <section className="challenge-result"><div className="result-hero"><span className="eyebrow">CHALLENGE COMPLETE</span><h1>Good fight, {result.participantName}.</h1><strong>{result.correctCount}/{result.questionCount}</strong><p>{result.score} points · your result is now on the global challenge leaderboard</p></div><div className="leaderboard-card"><div className="leaderboard-head"><div><span className="eyebrow">GLOBAL LEADERBOARD</span><h2>{challengeQuery.data?.challengeName}</h2></div><span>{leaderboardQuery.data?.length ?? 0} players</span></div>{leaderboardQuery.data?.map((row) => <div className={`leaderboard-row ${row.participantName === result.participantName ? "you" : ""}`} key={`${row.rank}-${row.participantName}`}><b>{row.rank === 1 ? <Crown size={18} /> : row.rank}</b><span>{row.participantName}{row.participantName === result.participantName && <small> YOU</small>}</span><strong>{row.correctCount}/{row.questionCount}</strong><em>{row.score} pts</em></div>)}</div><div className="challenge-result-actions"><button className="challenge-primary" onClick={copyLink}><Copy size={16} /> Copy challenge link</button><button className="challenge-secondary" onClick={onExit}>Back to Arcade</button></div></section>}
  </main>;
}
