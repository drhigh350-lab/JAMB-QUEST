import { useState } from "react";
import { QuestOpening } from "@/components/QuestOpening";

export default function OpeningSequenceFixture() {
  const [open, setOpen] = useState(true);
  const hold = new URLSearchParams(window.location.search).get("holdOpening") === "1";
  return <>{open && <QuestOpening onComplete={() => setOpen(false)} hold={hold} />}{!open && <main data-e2e="opening-handoff">Original JAMB Quest app handoff ready.</main>}</>;
}
