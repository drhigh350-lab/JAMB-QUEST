import { useEffect, useState } from "react";
import { buildAchievementShareCardSvg } from "../game/achievementShareCard";
import { rasterizeSvgToPngFile } from "../game/shareCardFile";

export default function AchievementSharePngFixture() {
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const svg = buildAchievementShareCardSvg({
          key: "answers-250",
          label: "Knowledge builder",
          note: "Get 250 answers correct",
          category: "mastery",
          target: 250,
          evidenceValue: 342,
          learnerName: "Dr. High",
          earnedOn: "Recorded in JAMB Quest",
        });
        const png = await rasterizeSvgToPngFile(svg, "jamb-quest-raster-check.svg", 1080, 1920);
        objectUrl = URL.createObjectURL(png);
        if (active) setPngUrl(objectUrl);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "PNG rasterisation failed");
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <main data-share-png-state={error ? "error" : pngUrl ? "ready" : "loading"} style={{ minHeight: "100vh", background: "#12283f", padding: 24 }}>
      <p style={{ color: "white", fontFamily: "Arial, sans-serif" }}>{error ? `PNG error: ${error}` : pngUrl ? "Actual share PNG" : "Rasterising actual share PNG…"}</p>
      {pngUrl ? <img src={pngUrl} alt="Actual rasterised JAMB Quest achievement card" style={{ display: "block", width: "min(100%, 540px)", height: "auto", margin: "0 auto" }} /> : null}
    </main>
  );
}
