import { ArrowRight, Archive, Building2, Map, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cleanArcadeDisplayName, emptyArcadeProfile, readArcadeProfile, type GameArcadeProfile, writeArcadeProfile } from "@/game/arcadeProfile";
import "./game-arcade.css";
import "./game-arcade-personal.css";
import "./game-arcade-missions.css";

export type ArcadeMode = "expedition" | "president" | "archive";

export function GameArcade({ onExit, onSelect }: { onExit: () => void; onSelect: (mode: ArcadeMode) => void }) {
  const [profile, setProfile] = useState<GameArcadeProfile>(emptyArcadeProfile);
  useEffect(() => { setProfile(readArcadeProfile()); }, []);
  const totalStamps = Object.values(profile.expedition.stamps).reduce((total, value) => total + value, 0);
  const totalProjects = Object.values(profile.presidentsDesk.projects).reduce((total, value) => total + value, 0);
  const totalTiles = Object.values(profile.greatArchive.tiles).reduce((total, value) => total + value, 0);
  const nextMission = profile.expedition.routes.length === 0 ? { mode: "expedition" as const, title: "Draw your first route", note: "Choose one subject territory and complete a five-card Scout Route. Every card is a real approved JAMB question." } : totalProjects < 4 ? { mode: "president" as const, title: "Move one Asterra district", note: "Choose a build and complete one five-card turn. Misses remain available as repair cards." } : { mode: "archive" as const, title: "Restore a knowledge wing", note: "Choose a subject hall and secure real syllabus-topic tiles with fresh approved questions." };
  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "jamb-quest-arcade-progress.json"; anchor.click(); URL.revokeObjectURL(url);
  };
  const resetProgress = () => {
    if (!window.confirm("Reset only Game Arcade progression? Your Practice and CBT history will stay untouched.")) return;
    const next = emptyArcadeProfile(); writeArcadeProfile(next); setProfile(next);
  };
  const updateName = (displayName: string) => { const next = { ...profile, displayName: cleanArcadeDisplayName(displayName) }; setProfile(next); writeArcadeProfile(next); };
  return <main className="game-arcade" aria-labelledby="game-arcade-title">
    <header className="game-arcade-head"><button onClick={onExit}><X size={17} /> Back to practice</button><span className="game-arcade-brand"><i /><i /><i /><i /><b>JAMB QUEST ARCADE</b></span><span>THREE WORLDS / ONE QUESTION BANK</span></header>
    <section className="game-arcade-hero"><div><span className="eyebrow">YOUR STUDY GAMES</span><h1 id="game-arcade-title">{profile.displayName ? `${profile.displayName}, pick a game.` : "Pick a game."}</h1><p>These are ongoing study worlds, not one-off mini quizzes. Your paths, districts, tiles, and recent cards save on this device; each new turn draws a fresh approved mix and avoids immediate repeats. Normal Practice and CBT stay separate.</p></div><div className="game-arcade-orbit" aria-hidden="true"><span>ENG</span><span>BIO</span><span>CHE</span><span>PHY</span><b>IQ</b></div></section>
    <section className="game-arcade-player" aria-label="Personal arcade settings"><label><span>WHAT SHOULD WE CALL YOU?</span><input value={profile.displayName} onChange={(event) => updateName(event.target.value)} placeholder="Your first name" maxLength={24} /></label><small>This name is saved only on this device for the game screens.</small></section>
    <section className="game-arcade-profile" aria-label="Local game arcade profile"><div><span>MAP STAMPS</span><b>{totalStamps}</b></div><div><span>MAP PATHS</span><b>{profile.expedition.routes.length}</b></div><div><span>PRESIDENT TURNS</span><b>{profile.presidentsDesk.terms}</b></div><div><span>ARCHIVE TILES</span><b>{Object.values(profile.greatArchive.tiles).reduce((total, value) => total + value, 0)}</b></div><div className="game-profile-controls"><button onClick={exportProgress}>Export game progress</button><button onClick={resetProgress}>Reset game progress</button></div></section>
    <section className="game-arcade-missions" aria-label="Your next Arcade mission"><div><span className="eyebrow">RETURN BOARD / YOUR NEXT REAL MOVE</span><h2>{nextMission.title}</h2><p>{nextMission.note}</p><div className="game-arcade-mission-tracks"><span className={profile.expedition.routes.length ? "done" : ""}><i /> {profile.expedition.routes.length} routes secured</span><span className={totalProjects ? "done" : ""}><i /> {totalProjects} district marks</span><span className={totalTiles ? "done" : ""}><i /> {totalTiles} topic tiles</span></div></div><div className="game-arcade-mission-board"><span>NEXT MISSION</span><b>{nextMission.title}</b><small>World progress saves only on this device. There is no streak penalty, paid advantage, or random reward.</small><button className="button button-light" onClick={() => onSelect(nextMission.mode)}>Open mission <ArrowRight size={16} /></button></div></section>
    <section className="game-arcade-worlds" aria-label="JAMB Quest game modes">
      <article className="game-arcade-world expedition-world"><div className="game-world-icon"><Map size={24} /></div><span className="eyebrow">GAME 01 / STUDY MAP</span><h2>Study Expedition</h2><p>Pick a subject, answer fresh questions, build lasting map paths, and fix any mistakes.</p><div className="game-world-tags"><span>save paths</span><span>fresh routes</span><span>fix mistakes</span></div><button className="button button-dark" onClick={() => onSelect("expedition")}>Open Study Map <ArrowRight size={16} /></button></article>
      <article className="game-arcade-world president-world"><div className="game-world-icon"><Building2 size={24} /></div><span className="eyebrow">GAME 02 / BUILD A COUNTRY</span><h2>President’s Desk</h2><p>In fictional Asterra, each turn grows a district. Build four projects over twelve marks and repair misses before the next turn.</p><div className="game-world-tags"><span>save districts</span><span>12-mark journey</span><span>fix mistakes</span></div><button className="button button-dark" onClick={() => onSelect("president")}>Build Asterra <ArrowRight size={16} /></button></article>
      <article className="game-arcade-world archive-world"><div className="game-world-icon"><Archive size={24} /></div><span className="eyebrow">GAME 03 / COLLECT TOPICS</span><h2>The Great Archive</h2><p>Answer fresh questions to keep collecting the real topics you have learned and repair the ones you missed.</p><div className="game-world-tags"><span>save topic tiles</span><span>fresh cards</span><span>fix mistakes</span></div><button className="button button-dark" onClick={() => onSelect("archive")}>Open Archive <ArrowRight size={16} /></button></article>
    </section>
    <footer className="game-arcade-foot"><ShieldCheck size={16} /> Approved questions only. No paid power or chance mechanics.</footer>
  </main>;
}
