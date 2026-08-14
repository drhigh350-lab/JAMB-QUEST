import React from "react";
import { ArrowRight, Gauge, Target } from "lucide-react";
import type { RoundConfig } from "@/game/types";

export function DailyMissionPanel({ label, note, config, onStart }: { label: string; note: string; config: RoundConfig; onStart: (config: RoundConfig) => void }) {
  const recovery = config.mode === "review";
  return <section className={`daily-mission-panel tab-section ${recovery ? "daily-mission-recovery" : ""}`}>
    <div><span className="eyebrow">TODAY'S AUTOMATIC MISSION</span><h2><Target size={20} /> {label}</h2><p>{note}</p></div>
    <div className="daily-mission-action"><span><Gauge size={14} /> {config.count} questions</span><button className="button button-dark" onClick={() => onStart(config)}>{recovery ? "Repair my mistakes" : "Start today's mission"} <ArrowRight size={16} /></button></div>
  </section>;
}
