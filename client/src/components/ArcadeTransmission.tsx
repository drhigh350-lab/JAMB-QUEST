import { useEffect, useState } from "react";
import { Radio, Sparkles } from "lucide-react";
import type { Subject } from "@/game/types";
import "./arcade-transmission.css";

type ArcadeWorld = "expedition" | "asterra" | "archive";

const worldLabels: Record<ArcadeWorld, string> = {
  expedition: "MAP LINK",
  asterra: "ASTERRA LINK",
  archive: "ARCHIVE LINK",
};

export function ArcadeTransmission({ world, subject, cardIndex, totalCards, feedback }: { world: ArcadeWorld; subject: Subject; cardIndex: number; totalCards: number; feedback: "correct" | "wrong" | null }) {
  const message = feedback === "correct"
    ? `Signal confirmed. ${subject} evidence is moving through this world.`
    : feedback === "wrong"
      ? `Repair signal logged. The exact card remains ready for your next correction.`
      : `Live scan: ${subject} card ${cardIndex} of ${totalCards}. Read the condition before you commit.`;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [typed, setTyped] = useState(message);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) { setTyped(message); return; }
    setTyped("");
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 1;
      setTyped(message.slice(0, cursor));
      if (cursor >= message.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [message, reducedMotion]);

  return <section className={`arcade-transmission ${world} ${feedback ?? "scanning"}`} data-testid="arcade-transmission" aria-label={`${worldLabels[world]} live game status`}>
    <div className="arcade-transmission-virtual" aria-hidden="true"><i /><i /><i /></div>
    <div className="arcade-transmission-copy"><span><Radio size={13} /> {worldLabels[world]} / LIVE</span><p aria-live="polite">{typed}<b aria-hidden="true" /></p></div>
    <div className="arcade-transmission-status"><Sparkles size={14} /><span>{feedback === "correct" ? "SECURED" : feedback === "wrong" ? "REPAIR" : "SCANNING"}</span></div>
  </section>;
}
