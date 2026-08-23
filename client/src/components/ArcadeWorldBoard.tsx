import { AlertTriangle, Compass, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Subject } from "@/game/types";
import "./arcade-world-board.css";

export type ArcadeWorld = "expedition" | "asterra" | "archive";

const worlds: Record<ArcadeWorld, { label: string; image: string; success: string; repair: string; idle: string }> = {
  expedition: {
    label: "FIELD ROUTE",
    image: "/manus-storage/jamb-quest-expedition-world_2926b469.png",
    idle: "Find the next marker and secure the route.",
    success: "Beacon lit — the route is moving forward.",
    repair: "Trail marker saved — repair this card before the next pass.",
  },
  asterra: {
    label: "ASTERRA BUILD",
    image: "/manus-storage/jamb-quest-asterra-world_9684561a.png",
    idle: "The district is waiting for a clear decision.",
    success: "Build pulse confirmed — the district gains momentum.",
    repair: "Site paused — use the repair card to strengthen the next build.",
  },
  archive: {
    label: "ARCHIVE RESTORATION",
    image: "/manus-storage/jamb-quest-archive-world_304d6e93.png",
    idle: "Locate the next knowledge tile for this hall.",
    success: "Tile illuminated — the archive remembers this topic.",
    repair: "Tile held at the repair vault for an exact correction.",
  },
};

export function ArcadeWorldBoard({ world, subject, cardIndex, totalCards, mission, feedback, children }: { world: ArcadeWorld; subject: Subject; cardIndex: number; totalCards: number; mission: string; feedback: "correct" | "wrong" | null; children: ReactNode }) {
  const config = worlds[world];
  const message = feedback === "correct" ? config.success : feedback === "wrong" ? config.repair : config.idle;
  const [typedMessage, setTypedMessage] = useState(message);
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setTypedMessage(message); return; }
    setTypedMessage("");
    let position = 0;
    const timer = window.setInterval(() => { position += 1; setTypedMessage(message.slice(0, position)); if (position >= message.length) window.clearInterval(timer); }, 16);
    return () => window.clearInterval(timer);
  }, [message]);
  const Icon = feedback === "wrong" ? AlertTriangle : feedback === "correct" ? Sparkles : Compass;
  return <section className={`arcade-world-board ${world} ${feedback ?? "scouting"}`} style={{ "--world-art": `url(${config.image})` } as React.CSSProperties} aria-label={`${config.label.toLowerCase()} game board`}>
    <div className="arcade-world-board-art" aria-hidden="true"><i /><i /><i /><b /></div>
    <header className="arcade-world-board-hud">
      <div><span>{config.label}</span><b>{subject}</b></div>
      <div><span>ACTIVE MISSION</span><b>{mission}</b></div>
      <div><span>TURN</span><b>{cardIndex} / {totalCards}</b></div>
    </header>
    <div className="arcade-world-board-signal" role="status"><Icon size={16} /><span>{typedMessage}<em aria-hidden="true" /></span><i aria-hidden="true" /></div>
    <div className="arcade-world-board-console">{children}</div>
  </section>;
}
