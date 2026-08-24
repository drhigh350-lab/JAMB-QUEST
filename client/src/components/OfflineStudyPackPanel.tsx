import { CheckCircle2, Download, HardDriveDownload, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";

export type OfflineStudyPackControls = {
  status: "idle" | "downloading" | "ready" | "failed" | "clearing";
  questionCount: number;
  visualCount: number;
  savedAt: number | null;
  isCurrent: boolean;
  canDownload: boolean;
  error: string | null;
  onDownload: () => void;
  onClear: () => void;
};

export type PwaControls = {
  isOnline: boolean;
  canInstall: boolean;
  installStatus: "idle" | "installing" | "installed" | "dismissed";
  onInstall: () => void;
  update?: { available: boolean; status: "idle" | "updating" | "deferred"; onUpdate: () => void };
  offlinePack?: OfflineStudyPackControls;
};

export function OfflineStudyPackPanel({ pwa }: { pwa: PwaControls }) {
  const pack = pwa.offlinePack ?? { status: "idle" as const, questionCount: 0, visualCount: 0, savedAt: null, isCurrent: false, canDownload: false, error: null, onDownload: () => undefined, onClear: () => undefined };
  const hasPack = pack.questionCount > 0;
  const busy = pack.status === "downloading" || pack.status === "clearing";
  const savedLabel = hasPack ? `${pack.questionCount.toLocaleString()} online questions${pack.visualCount ? ` · ${pack.visualCount} question visuals` : ""}` : "No full study pack downloaded yet";
  return <section className="pwa-section tab-section" aria-label="Install and offline access">
    <div className="pwa-copy">
      <div className="pwa-icon" aria-hidden="true">{pwa.isOnline ? <Wifi size={22} /> : <WifiOff size={22} />}</div>
      <div>
        <span className="eyebrow">YOUR DOWNLOADABLE STUDY APP</span>
        <h2>{pwa.isOnline ? "Download your full study bank." : hasPack ? "Your full study pack is ready." : "Reconnect to download your study pack."}</h2>
        <p>{pwa.isOnline ? "Install JAMB Quest, then download the approved online question bank and linked question visuals for data-free practice. Your core app files remain installed; marks sync again when you reconnect." : hasPack ? "Practice from the saved question bank and question visuals without data. Your profile sync and reminders resume once you reconnect." : "The installed app opens offline, but download the full study bank while connected before relying on offline practice."}</p>
        <div className="offline-pack-status" role="status"><HardDriveDownload size={15} /><span><b>{savedLabel}</b>{hasPack && pack.savedAt ? <small>{pack.isCurrent ? " Current bank saved on this device" : " A newer online bank is available"}{pack.status === "ready" && pack.isCurrent && " · Ready offline"}</small> : <small> Download once to practise the complete available bank offline</small>}</span></div>
        {pack.error && <p className="offline-pack-error">{pack.error}</p>}
      </div>
    </div>
    <div className="pwa-actions offline-pack-actions">
      {pwa.update?.available && <div className="app-update-control" data-testid="app-update-control"><small>{pwa.update.status === "deferred" ? "Update ready after you leave this question" : "A newer JAMB Quest version is ready"}</small><button className="button button-dark" onClick={pwa.update.onUpdate} disabled={pwa.update.status === "updating" || pwa.update.status === "deferred"}><RefreshCw size={16} /> {pwa.update.status === "updating" ? "Updating JAMB Quest" : pwa.update.status === "deferred" ? "Finish question first" : "Update JAMB Quest"}</button></div>}
      {pwa.canInstall ? <button className="button button-dark" onClick={pwa.onInstall} disabled={pwa.installStatus === "installing"}><Download size={16} /> {pwa.installStatus === "installing" ? "Opening install" : "Install JAMB Quest"}</button> : pwa.installStatus === "installed" ? <span className="pwa-status"><CheckCircle2 size={16} /> Installed on this device</span> : <span className="pwa-status"><Download size={16} /> Use your browser menu to install</span>}
      <button className="button button-push" onClick={pack.onDownload} disabled={!pack.canDownload || busy}><HardDriveDownload size={16} /> {pack.status === "downloading" ? "Downloading study pack" : hasPack && !pack.isCurrent ? "Update downloaded bank" : hasPack ? "Download again" : "Download full study bank"}</button>
      {hasPack && <button className="button button-outline offline-clear-button" onClick={pack.onClear} disabled={busy}><Trash2 size={15} /> {pack.status === "clearing" ? "Removing" : "Remove download"}</button>}
      {hasPack && !pack.isCurrent && <span className="offline-pack-update"><RefreshCw size={14} /> Update available</span>}
    </div>
  </section>;
}
