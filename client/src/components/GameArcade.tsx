import { ArrowRight, Archive, Building2, Map, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { emptyArcadeProfile, readArcadeProfile, type GameArcadeProfile, writeArcadeProfile } from "@/game/arcadeProfile";
import "./game-arcade.css";

export type ArcadeMode = "expedition" | "president" | "archive";

export function GameArcade({ onExit, onSelect }: { onExit: () => void; onSelect: (mode: ArcadeMode) => void }) {
  const [profile, setProfile] = useState<GameArcadeProfile>(emptyArcadeProfile);
  useEffect(() => { setProfile(readArcadeProfile()); }, []);
  const totalStamps = Object.values(profile.expedition.stamps).reduce((total, value) => total + value, 0);
  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "jamb-quest-arcade-progress.json"; anchor.click(); URL.revokeObjectURL(url);
  };
  const resetProgress = () => {
    if (!window.confirm("Reset only Game Arcade progression? Your Practice and CBT history will stay untouched.")) return;
    const next = emptyArcadeProfile(); writeArcadeProfile(next); setProfile(next);
  };
  return <main className="game-arcade" aria-labelledby="game-arcade-title">
    <header className="game-arcade-head"><button onClick={onExit}><X size={17} /> Back to practice</button><span className="game-arcade-brand"><i /><i /><i /><i /><b>JAMB QUEST ARCADE</b></span><span>THREE WORLDS / ONE QUESTION BANK</span></header>
    <section className="game-arcade-hero"><div><span className="eyebrow">CHOOSE A WORLD, NOT A TIMER</span><h1 id="game-arcade-title">Questions are the<br /><em>power source.</em></h1><p>Every game uses the same approved JAMB question bank. Your choices shape the story, but every answer still receives a real correction and a route back to repair.</p></div><div className="game-arcade-orbit" aria-hidden="true"><span>ENG</span><span>BIO</span><span>CHE</span><span>PHY</span><b>IQ</b></div></section>
    <section className="game-arcade-profile" aria-label="Local game arcade profile"><div><span>STUDY STAMPS</span><b>{totalStamps}</b></div><div><span>ROUTES SECURED</span><b>{profile.expedition.routes.length}</b></div><div><span>ASTERRA TERMS</span><b>{profile.presidentsDesk.terms}</b></div><div><span>ARCHIVE TILES</span><b>{Object.values(profile.greatArchive.tiles).reduce((total, value) => total + value, 0)}</b></div><div className="game-profile-controls"><button onClick={exportProgress}>Export arcade progress</button><button onClick={resetProgress}>Reset arcade only</button></div></section>
    <section className="game-arcade-worlds" aria-label="JAMB Quest game modes">
      <article className="game-arcade-world expedition-world"><div className="game-world-icon"><Map size={24} /></div><span className="eyebrow">MODE 01 / ROUTE COLLECTION</span><h2>Study Expedition</h2><p>Map four subject territories. Sign a route, pack a study tool, collect stamps, and turn every missed card into a repair route.</p><div className="game-world-tags"><span>no timer</span><span>map contracts</span><span>repair cards</span></div><button className="button button-dark" onClick={() => onSelect("expedition")}>Open Expedition <ArrowRight size={16} /></button></article>
      <article className="game-arcade-world president-world"><div className="game-world-icon"><Building2 size={24} /></div><span className="eyebrow">MODE 02 / CIVIC STRATEGY</span><h2>President’s Desk</h2><p>Lead fictional Asterra. Fund a public project through cabinet briefings, balance confidence with treasury, and repair any briefing that slows the term.</p><div className="game-world-tags"><span>project choices</span><span>cabinet tools</span><span>term reports</span></div><button className="button button-dark" onClick={() => onSelect("president")}>Take the Desk <ArrowRight size={16} /></button></article>
      <article className="game-arcade-world archive-world"><div className="game-world-icon"><Archive size={24} /></div><span className="eyebrow">MODE 03 / COLLECTION STRATEGY</span><h2>The Great Archive</h2><p>Restore knowledge mosaics across four halls by choosing blueprints, collecting real topic tiles, and rebuilding a repair vault from exact misses.</p><div className="game-world-tags"><span>blueprints</span><span>topic tiles</span><span>repair vault</span></div><button className="button button-dark" onClick={() => onSelect("archive")}>Open Archive <ArrowRight size={16} /></button></article>
    </section>
    <footer className="game-arcade-foot"><ShieldCheck size={16} /> Approved questions only. No paid power, chance mechanics, or CBT-history changes.</footer>
  </main>;
}
