import { useEffect, useMemo, useState } from "react";
import { getAtomicIntroStory } from "@/content/atomicIntroStories";
import { getTypewriterDuration, getTypewriterStepDelay } from "@/lib/openingTypewriter";

export function QuestOpening({ onComplete, hold = false }: { onComplete: () => void; hold?: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const story = getAtomicIntroStory();
  const dailyQuote = story.kicker;
  const typedQuote = useMemo(() => Array.from(dailyQuote).slice(0, typedLength).join(""), [dailyQuote, typedLength]);
  const complete = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onComplete, 180);
  };

  useEffect(() => {
    if (hold) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => setReducedMotion(mediaQuery.matches);
    applyMotionPreference();
    mediaQuery.addEventListener?.("change", applyMotionPreference);
    return () => mediaQuery.removeEventListener?.("change", applyMotionPreference);
  }, [hold]);

  useEffect(() => {
    if (hold) return;
    if (reducedMotion) {
      setTypedLength(Array.from(dailyQuote).length);
      return;
    }
    const characters = Array.from(dailyQuote);
    let cursor = 0;
    let timer: number | undefined;
    const typeNext = () => {
      cursor += 1;
      setTypedLength(cursor);
      if (cursor < characters.length) timer = window.setTimeout(typeNext, getTypewriterStepDelay(characters[cursor - 1]));
    };
    timer = window.setTimeout(typeNext, 640);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [dailyQuote, hold, reducedMotion]);

  useEffect(() => {
    if (hold) return;
    const duration = reducedMotion ? 120 : 1500 + getTypewriterDuration(dailyQuote) + 1750;
    const timer = window.setTimeout(complete, duration);
    return () => window.clearTimeout(timer);
  }, [dailyQuote, hold, reducedMotion]);

  return <section className={`quest-opening ${leaving ? "quest-opening-leaving" : ""}`} aria-label="JAMB Quest opening" data-e2e="quest-opening">
    <button className="quest-opening-skip" onClick={complete}>Skip intro</button>
    <div className="quest-opening-stage" aria-hidden="true">
      <span className="quest-opening-mark"><i /><i /><i /><i /></span>
      <span className="quest-opening-dust dust-one" /><span className="quest-opening-dust dust-two" /><span className="quest-opening-dust dust-three" />
    </div>
    <div className="quest-opening-copy">
      <span className="eyebrow">JAMB QUEST</span>
      <strong>Build your system.<br /><em>Win JAMB.</em></strong>
      <div className="quest-opening-story quest-opening-typewriter" data-e2e="atomic-intro-story">
        <span>{story.label} · QUOTE OF THE DAY</span>
        <p className="quest-typing-line" data-e2e="atomic-intro-typewriter" data-typing={typedLength < Array.from(dailyQuote).length} aria-live="polite" aria-label={dailyQuote}>
          <b aria-hidden="true">{typedQuote}</b><i className="quest-typing-caret" aria-hidden="true" />
        </p>
        <small className={typedLength >= Array.from(dailyQuote).length ? "quest-opening-action-visible" : ""}>{story.action}</small>
      </div>
    </div>
  </section>;
}
