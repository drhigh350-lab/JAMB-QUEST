import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Map, X } from "lucide-react";
import { confirmSyllabusRead, entryFor, readSyllabusJourney, type SyllabusJourneyProfile, writeSyllabusJourney } from "@/game/syllabusJourney";
import type { Subject } from "@/game/types";
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

export function SyllabusJourney({ onExit, defaultPlannerOpen = false }: { onExit: () => void; defaultPlannerOpen?: boolean }) {
  const [subject, setSubject] = useState<Subject>("Biology");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [profile, setProfile] = useState<SyllabusJourneyProfile>(() => typeof window !== "undefined" ? readSyllabusJourney() : { version: 1, entries: {} });
  const groups = getSyllabusParentGroups(subject);
  const allTopics = groups.flatMap((group) => group.topics);
  const activeTopic = selectedTopic || allTopics[0] || "";
  const detail = activeTopic ? getSyllabusJourneyDetail(subject, activeTopic) : null;
  const entry = activeTopic ? entryFor(profile, subject, activeTopic) : null;

  useEffect(() => { setSelectedTopic(""); }, [subject]);

  const markStudied = () => {
    if (!activeTopic) return;
    const nextProfile = confirmSyllabusRead(profile, subject, activeTopic);
    setProfile(nextProfile);
    writeSyllabusJourney(nextProfile);
  };
  return <main className="syllabus-journey syllabus-planner" aria-labelledby="syllabus-journey-title">
    <header className="journey-head"><button onClick={onExit}><X size={17} /> Back to study</button><span><Map size={16} /> JAMB QUEST / SYLLABUS JOURNEY</span><b>READ → PLAN</b></header>
    <section className="journey-hero journey-planner-hero"><div><span className="eyebrow">OFFICIAL JAMB SYLLABUS</span><h1 id="syllabus-journey-title">Plan what<br /><em>to read.</em></h1><p>Follow the official outline with a learning objective, what-to-read direction, and subtopics. Topic Drill stays separate.</p></div><div className="journey-steps"><span><b>1</b> Choose an area</span><span><b>2</b> Read the direction</span><span><b>3</b> Plan your return</span></div></section>
    <section className="journey-subjects" aria-label="Syllabus subject selector">{subjects.map((item) => <button key={item.name} className={subject === item.name ? "active" : ""} onClick={() => setSubject(item.name)}><b>{item.short}</b><small>{item.name}</small></button>)}</section>
    <section className="journey-plan-cards" aria-label="Syllabus Journey reading plan">
      <details className="journey-plan-card" open={defaultPlannerOpen}>
        <summary><span><b>Study Planner</b><small>See the learning objective and subtopics before you practise.</small></span><ArrowRight size={16} /></summary>
        <div className="journey-plan-card-body journey-planner-card-body">
          <div className="journey-focus-card" data-testid="syllabus-topic-focus"><span>LEARNING OBJECTIVE</span><p>{detail?.objective ?? "Choose an official area to see its study focus."}</p><span>WHAT TO READ</span><p>Read the official area below in your notes or textbook, then use the subtopics as your study checklist.</p><span>SUBTOPICS</span>{detail?.subtopics.length ? <ul>{detail.subtopics.map((subtopic) => <li key={subtopic}>{subtopic}</li>)}</ul> : <small>Subtopic details will appear here when this official area is ready.</small>}</div>
          <div className="journey-study-status"><span>Study status</span><b>{entry?.readAt ? `Marked studied on ${new Date(entry.readAt).toLocaleDateString()}` : "Not marked studied yet"}</b></div>
          {!entry?.readAt ? <button className="button button-outline" onClick={markStudied}><BookOpenCheck size={16} /> I have studied this area</button> : <section className="journey-drill-suggestion"><b>Continue your direction</b><p>Return to these subtopics in your next reading session. Use the separate Topic Drill only when you decide to check this area.</p></section>}
          <small className="journey-honesty">Marking a section studied is a planning reminder, not a mastery claim.</small>
        </div>
      </details>
    </section>
  </main>;
}
