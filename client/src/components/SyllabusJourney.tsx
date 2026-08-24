import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CircleCheck, Map, X } from "lucide-react";
import { confirmSyllabusRead, entryFor, readSyllabusJourney, type SyllabusJourneyProfile, writeSyllabusJourney } from "@/game/syllabusJourney";
import type { BankQuestion, RoundConfig, Subject } from "@/game/types";
import { getSyllabusParentGroups } from "@shared/syllabusTopicGroups";
import { getSyllabusJourneyDetail } from "@shared/syllabusJourneyDetails";
import "./syllabus-journey.css";
import "./syllabus-journey-states.css";
import "./syllabus-journey-details.css";

const subjects: Array<{ name: Subject; short: string }> = [
  { name: "Use of English", short: "ENG" },
  { name: "Biology", short: "BIO" },
  { name: "Chemistry", short: "CHE" },
  { name: "Physics", short: "PHY" },
];

export function SyllabusJourney({ questions, onExit, onStart, defaultPlannerOpen = false }: { questions: BankQuestion[]; onExit: () => void; onStart: (config: RoundConfig) => void; defaultPlannerOpen?: boolean }) {
  const [subject, setSubject] = useState<Subject>("Biology");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [drillCount, setDrillCount] = useState(20);
  const [profile, setProfile] = useState<SyllabusJourneyProfile>(() => typeof window !== "undefined" ? readSyllabusJourney() : { version: 1, entries: {} });
  const topicCounts = useMemo(() => questions.filter((question) => question.subject === subject).reduce<Record<string, number>>((counts, question) => ({ ...counts, [question.topic]: (counts[question.topic] ?? 0) + 1 }), {}), [questions, subject]);
  const groups = getSyllabusParentGroups(subject);
  const allTopics = groups.flatMap((group) => group.topics);
  const activeTopic = selectedTopic || allTopics.find((topic) => topicCounts[topic]) || allTopics[0] || "";
  const activeCount = topicCounts[activeTopic] ?? 0;
  const detail = activeTopic ? getSyllabusJourneyDetail(subject, activeTopic) : null;
  const entry = activeTopic ? entryFor(profile, subject, activeTopic) : null;

  useEffect(() => { setSelectedTopic(""); }, [subject]);

  const markStudied = () => {
    if (!activeTopic) return;
    const nextProfile = confirmSyllabusRead(profile, subject, activeTopic);
    setProfile(nextProfile);
    writeSyllabusJourney(nextProfile);
  };
  const startTopicDrill = (count = drillCount) => {
    if (!activeTopic || !activeCount) return;
    onStart({ subject, mode: "sprint", count, timing: "study", topic: activeTopic });
  };

  return <main className="syllabus-journey syllabus-planner" aria-labelledby="syllabus-journey-title">
    <header className="journey-head"><button onClick={onExit}><X size={17} /> Back to practice</button><span><Map size={16} /> JAMB QUEST / SYLLABUS &amp; TOPIC PLAN</span><b>PLAN → PRACTISE</b></header>
    <section className="journey-hero journey-planner-hero"><div><span className="eyebrow">OFFICIAL JAMB SYLLABUS</span><h1 id="syllabus-journey-title">Plan your<br /><em>syllabus study.</em></h1><p>Use the official outline to plan what to read. When you are ready, choose the separate Topic Drill for that exact area.</p></div><div className="journey-steps"><span><b>1</b> Choose an area</span><span><b>2</b> Read &amp; plan</span><span><b>3</b> Practise separately</span></div></section>
    <section className="journey-subjects" aria-label="Syllabus subject selector">{subjects.map((item) => <button key={item.name} className={subject === item.name ? "active" : ""} onClick={() => setSubject(item.name)}><b>{item.short}</b><small>{item.name}</small></button>)}</section>
    <section className="journey-plan-cards" aria-label="Syllabus study options">
      <details className="journey-plan-card" open>
        <summary><span><b>Topic Drill</b><small>Choose one official area and practise it in the main question mode.</small></span><ArrowRight size={16} /></summary>
        <div className="journey-plan-card-body">
          <label className="journey-field"><span>Official area</span><select aria-label="Choose official syllabus area for a topic drill" value={activeTopic} onChange={(event) => setSelectedTopic(event.target.value)}>{groups.map((group) => <optgroup key={group.label} label={group.label}>{group.topics.map((topic) => <option key={topic} value={topic}>{topic}{topicCounts[topic] ? ` · ${topicCounts[topic]} questions ready` : " · not ready yet"}</option>)}</optgroup>)}</select></label>
          <div className="journey-topic-status">{activeCount ? <><CircleCheck size={15} /> {activeCount} matching questions ready</> : "Questions for this official area are not ready yet."}</div>
          <div className="journey-drill-count"><span>Drill size</span><div>{[10, 20, 40, 50].map((count) => <button key={count} className={drillCount === count ? "active" : ""} onClick={() => setDrillCount(count)}>{count}</button>)}</div></div>
          <button className="button button-dark journey-start-drill" onClick={() => startTopicDrill()} disabled={!activeCount}>Start {drillCount}-question Topic Drill <ArrowRight size={16} /></button>
        </div>
      </details>
      <details className="journey-plan-card" open={defaultPlannerOpen}>
        <summary><span><b>Study Planner</b><small>See the learning objective and subtopics before you practise.</small></span><ArrowRight size={16} /></summary>
        <div className="journey-plan-card-body journey-planner-card-body">
          <div className="journey-focus-card" data-testid="syllabus-topic-focus"><span>LEARNING OBJECTIVE</span><p>{detail?.objective ?? "Choose an official area to see its study focus."}</p><span>SUBTOPICS</span>{detail?.subtopics.length ? <ul>{detail.subtopics.map((subtopic) => <li key={subtopic}>{subtopic}</li>)}</ul> : <small>Subtopic details will appear here when this official area is ready.</small>}</div>
          <div className="journey-study-status"><span>Study status</span><b>{entry?.readAt ? `Marked studied on ${new Date(entry.readAt).toLocaleDateString()}` : "Not marked studied yet"}</b></div>
          {!entry?.readAt ? <button className="button button-outline" onClick={markStudied}><BookOpenCheck size={16} /> I have studied this area</button> : activeCount ? <section className="journey-drill-suggestion"><b>Suggested next step</b><p>Try a separate {Math.min(20, activeCount)}-question Topic Drill for {activeTopic} when you are ready.</p><button className="button button-dark" onClick={() => startTopicDrill(Math.min(20, activeCount))}>Open Topic Drill <ArrowRight size={16} /></button></section> : <p className="journey-honesty">You have marked this area as studied. A Topic Drill will be available when matching approved questions are ready.</p>}
          <small className="journey-honesty">Marking a section studied is a planning reminder, not a mastery claim.</small>
        </div>
      </details>
    </section>
  </main>;
}
