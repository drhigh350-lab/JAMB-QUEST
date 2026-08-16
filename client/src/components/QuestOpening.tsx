import { useEffect, useState } from "react";
import { getAtomicIntroStory } from "@/content/atomicIntroStories";

export function QuestOpening({ onComplete, hold = false }: { onComplete: () => void; hold?: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const story = getAtomicIntroStory();
  const complete = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onComplete, 180);
  };

  useEffect(() => {
    if (hold) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(complete, reducedMotion ? 120 : 8500);
    return () => window.clearTimeout(timer);
  }, [hold]);

  return <section className={`quest-opening ${leaving ? "quest-opening-leaving" : ""}`} aria-label="JAMB Quest opening" data-e2e="quest-opening">
    <button className="quest-opening-skip" onClick={complete}>Skip intro</button>
    <div className="quest-opening-stage" aria-hidden="true">
      <span className="quest-opening-mark"><i /><i /><i /><i /></span>
      <span className="quest-opening-dust dust-one" /><span className="quest-opening-dust dust-two" /><span className="quest-opening-dust dust-three" />
    </div>
    <div className="quest-opening-copy">
      <span className="eyebrow">JAMB QUEST</span>
      <strong>Build your system.<br /><em>Win JAMB.</em></strong>
      <div className="quest-opening-story" data-e2e="atomic-intro-story">
        <span>{story.label}</span>
        <b>{story.kicker}</b>
        <p>{story.story}</p>
        <small>{story.action}</small>
      </div>
    </div>
  </section>;
}
