/* Field Notes Arcade: the profile panel is a personal study slip, not a generic account modal. */

import { useEffect, useState } from "react";
import { Flag, LogOut, Save, X } from "lucide-react";

interface ProfilePanelProps {
  open: boolean;
  displayName: string;
  targetScore: number;
  totalAnswered: number;
  accuracy: number;
  onClose: () => void;
  onSave: (displayName: string, targetScore: number) => void;
  onLogout: () => void;
  saving: boolean;
}

export function ProfilePanel({ open, displayName, targetScore, totalAnswered, accuracy, onClose, onSave, onLogout, saving }: ProfilePanelProps) {
  const [name, setName] = useState(displayName);
  const [target, setTarget] = useState(targetScore);

  useEffect(() => {
    if (open) {
      setName(displayName);
      setTarget(targetScore);
    }
  }, [displayName, open, targetScore]);

  if (!open) return null;
  return (
    <div className="profile-overlay" role="presentation" onMouseDown={onClose}>
      <section className="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button profile-close" onClick={onClose} aria-label="Close profile"><X size={18} /></button>
        <div className="profile-tape">PERSONAL LEDGER</div>
        <span className="eyebrow">YOUR JAMB QUEST PROFILE</span>
        <h2 id="profile-title">Make your study plan yours.</h2>
        <p>Signed-in rounds, review notes, and targets stay with this profile across devices.</p>
        <div className="profile-stats"><div><strong>{totalAnswered || "—"}</strong><span>marks made</span></div><div><strong>{totalAnswered ? `${accuracy}%` : "—"}</strong><span>accuracy</span></div></div>
        <label className="profile-field"><span>DISPLAY NAME</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Your name" /></label>
        <label className="profile-field"><span>TARGET SCORE</span><div className="target-input"><Flag size={16} /><input type="number" min="1" max="400" value={target} onChange={(event) => setTarget(Number(event.target.value))} /><b>/ 400</b></div></label>
        <button className="button button-primary profile-save" onClick={() => onSave(name, Math.min(400, Math.max(1, Number.isFinite(target) ? target : 300)))} disabled={saving}><Save size={16} /> {saving ? "Saving ledger" : "Save profile"}</button>
        <button className="profile-logout" onClick={onLogout}><LogOut size={15} /> Sign out</button>
      </section>
    </div>
  );
}
