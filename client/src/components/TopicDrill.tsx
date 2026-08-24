import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleCheck, Map, X } from "lucide-react";
import { getSyllabusParentGroups } from "@shared/syllabusTopicGroups";
import type { BankQuestion, RoundConfig, Subject } from "@/game/types";
import "./syllabus-journey.css";
import "./topic-drill.css";

const subjects: Array<{ name: Subject; short: string }> = [
  { name: "Use of English", short: "ENG" }, { name: "Biology", short: "BIO" }, { name: "Chemistry", short: "CHE" }, { name: "Physics", short: "PHY" },
];

export function TopicDrill({ questions, onExit, onStart }: { questions: BankQuestion[]; onExit: () => void; onStart: (config: RoundConfig) => void }) {
  const [subject, setSubject] = useState<Subject>("Biology");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [drillCount, setDrillCount] = useState(20);
  const groups = getSyllabusParentGroups(subject);
  const topicCounts = useMemo(() => questions.filter((question) => question.subject === subject).reduce<Record<string, number>>((counts, question) => ({ ...counts, [question.topic]: (counts[question.topic] ?? 0) + 1 }), {}), [questions, subject]);
  const activeGroup = groups.find((group) => group.label === selectedGroup);
  const groupTopics = activeGroup?.topics ?? [];
  const activeTopic = selectedTopic;
  const activeCount = selectedTopic ? (topicCounts[selectedTopic] ?? 0) : 0;
  useEffect(() => { setSelectedGroup(""); setSelectedTopic(""); }, [subject]);
  useEffect(() => setSelectedTopic(""), [selectedGroup]);
  return <main className="syllabus-journey topic-drill" aria-labelledby="topic-drill-title">
    <header className="journey-head"><button onClick={onExit}><X size={17} /> Back to study</button><span><Map size={16} /> JAMB QUEST / TOPIC DRILL</span><b>CHOOSE → PRACTISE</b></header>
    <section className="journey-hero journey-planner-hero"><div><span className="eyebrow">OFFICIAL JAMB SYLLABUS</span><h1 id="topic-drill-title">Choose a<br /><em>topic drill.</em></h1><p>Choose a core subject, an official syllabus area, and a specific topic. Then start an untimed drill when you are ready.</p></div><div className="journey-steps"><span><b>1</b> Choose subject</span><span><b>2</b> Choose area</span><span><b>3</b> Start drill</span></div></section>
    <section className="journey-subjects" aria-label="Topic Drill subject selector">{subjects.map((item) => <button key={item.name} className={subject === item.name ? "active" : ""} onClick={() => setSubject(item.name)}><b>{item.short}</b><small>{item.name}</small></button>)}</section>
    <section className="journey-plan-cards" aria-label="Topic Drill controls"><section className="journey-plan-card topic-drill-card"><div className="journey-plan-card-body"><label className="journey-field"><span>Official syllabus area</span><select aria-label="Choose official syllabus area for topic drill" value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}><option value="" disabled>Choose official syllabus area</option>{groups.map((group) => <option key={group.label} value={group.label}>{group.label}</option>)}</select></label><label className="journey-field"><span>Specific topic</span><select aria-label="Choose specific topic for topic drill" value={activeTopic} onChange={(event) => setSelectedTopic(event.target.value)} disabled={!activeGroup}><option value="" disabled>{activeGroup ? "Choose specific topic" : "Choose an official area first"}</option>{groupTopics.map((topic) => <option key={topic} value={topic}>{topic}{topicCounts[topic] ? ` · ${topicCounts[topic]} questions ready` : " · not ready yet"}</option>)}</select></label><div className="journey-topic-status">{!selectedGroup ? "Choose an official area to continue." : !selectedTopic ? "Choose a specific topic to continue." : activeCount ? <><CircleCheck size={15} /> {activeCount} matching questions ready</> : "Questions for this specific topic are not ready yet."}</div><div className="journey-drill-count"><span>Drill size</span><div>{[10, 20, 40, 50].map((count) => <button key={count} className={drillCount === count ? "active" : ""} onClick={() => setDrillCount(count)}>{count}</button>)}</div></div><button className="button button-dark journey-start-drill" onClick={() => activeCount && onStart({ subject, mode: "sprint", count: drillCount, timing: "study", topic: activeTopic })} disabled={!selectedGroup || !selectedTopic || !activeCount}>Start {drillCount}-question Topic Drill <ArrowRight size={16} /></button></div></section></section>
  </main>;
}
