import { useState } from "react";
import { ExperimentFrame, getMeta } from "./ui";
import { IntroLaunch } from "./Intros";
import { LAB_IMAGES } from "./data";

type Doc = {
  duration: string;
  sequencing: string;
  desktop: string;
  mobile: string;
  reduced: string;
  preload: string;
  reference: string;
};

const DOCS: Record<string, Doc> = {
  "INTRO-01": {
    duration: "≈ 2.8s (5 shots × ~0.36s + hold)",
    sequencing:
      "Reel order is hand-set in LAB_IMAGES: a rendered atmosphere opens, then scenic, then architecture, then the noir set, closing on the payphone hero so the last frame already matches the homepage image.",
    desktop:
      "Full-bleed cover images, fast cross-dissolve with a slight scale-down; wordmark wipes on over the final two shots.",
    mobile:
      "Identical, images switch to a portrait-friendly crop via object-fit: cover; wordmark drops to clamp() min size.",
    reduced: "One still frame (payphone) + wordmark wipe only, ~1.4s. No cross-dissolves.",
    preload:
      "All reel srcs decoded by useLabPreload before the sequence can start; a spinner + progress bar shows until ready.",
    reference: "Studio K95 (k95.it) — bold image-driven loader + hero.",
  },
  "INTRO-02": {
    duration: "≈ 3.4s",
    sequencing:
      "A tinted field (first project's accent) resolves first; three image planes settle front-to-back on a 0.28s stagger; the frontmost black plane then lifts to reveal the homepage.",
    desktop:
      "Planes carry a small blur that clears as they land, reading as depth; lift is a single translateY.",
    mobile: "Same, plane insets widen so images stay legible on a narrow screen.",
    reduced: "Planes simple-fade with no blur and no lift travel; ~1.5s.",
    preload: "Planes use reel images 2–4, all preloaded. Field is CSS only.",
    reference:
      "Scheme Engine (schemeengine.com) — layered entrance, measured pacing, handoff into the homepage.",
  },
  "INTRO-03": {
    duration: "≈ 3.2s",
    sequencing:
      "Four images each arrive through a different clip-path aperture — a wide slot, a tall portal, a centred window, then full frame — each closing back to a point that hands to the next.",
    desktop:
      "Pure clip-path animation over stacked cover images; last frame opens fully and holds under the wordmark.",
    mobile: "Aperture shapes are proportional (%), so they read the same on any ratio.",
    reduced: "Apertures snap open/closed with no travel; ~1.5s.",
    preload: "First four reel images, preloaded.",
    reference: "Original — architectural apertures / cropped windows.",
  },
  "INTRO-04": {
    duration: "≈ 3.0s",
    sequencing:
      "Nine square highlight thumbnails scale in on a 60ms stagger to a full mosaic, hold ~0.4s, then the whole grid translates left and scales down toward where the homepage lockup sits, fading as the homepage takes over.",
    desktop: "3×3 grid; collapse is one transform on the grid container (cheap).",
    mobile: "Grid stays 3×3 but cells crop tighter; collapse distance scales with viewport.",
    reduced: "Mosaic fades in, no collapse move; ~1.5s.",
    preload: "All nine highlight thumbnails preloaded.",
    reference: "Original — FLIP-style grid reflow into the real homepage grid.",
  },
  "INTRO-05": {
    duration: "≈ 3.6s (desktop only)",
    sequencing:
      "Eight frames travel down a perspective rail from far to near like film through a projector, each fading as it passes the camera; the last decelerates to rest as the hero frame while the title assembles.",
    desktop: "CSS 3D (translateZ) on 8 planes inside one perspective context.",
    mobile: "Not run — the runner substitutes INTRO-01 on viewports ≤ 700px.",
    reduced: "Falls back to a simple fade of the final frame + wordmark; ~1.5s.",
    preload: "Reel images (repeated to 8), preloaded.",
    reference: "21st.dev image-trail / marquee patterns, adapted to a spatial filmstrip.",
  },
};

function DocBlock({ id }: { id: string }) {
  const d = DOCS[id];
  return (
    <dl>
      <dt>Duration</dt>
      <dd>{d.duration}</dd>
      <dt>Sequencing</dt>
      <dd>{d.sequencing}</dd>
      <dt>Desktop</dt>
      <dd>{d.desktop}</dd>
      <dt>Mobile</dt>
      <dd>{d.mobile}</dd>
      <dt>Reduced motion</dt>
      <dd>{d.reduced}</dd>
      <dt>Preload</dt>
      <dd>{d.preload}</dd>
      <dt>Reference</dt>
      <dd>{d.reference}</dd>
    </dl>
  );
}

export function SectionEntrance() {
  const [live, setLive] = useState<string | null>(null);
  const ids = ["INTRO-01", "INTRO-02", "INTRO-03", "INTRO-04", "INTRO-05"];
  const poster = LAB_IMAGES;

  return (
    <>
      <div className="lab-grid">
        {ids.map((id, n) => (
          <ExperimentFrame
            key={id}
            meta={getMeta(id)}
            details={<DocBlock id={id} />}
            actions={
              <button
                className="lab-btn"
                data-variant="primary"
                onClick={() => setLive(id)}
                type="button"
              >
                ▶ Play {id}
              </button>
            }
          >
            <div className="lab-entr-poster">
              <span className="lab-entr-poster-id">{id}</span>
              <img src={poster[n % poster.length].src} alt="" />
              <button className="lab-entr-poster-play" onClick={() => setLive(id)} type="button">
                ▶ Play full screen
              </button>
            </div>
          </ExperimentFrame>
        ))}
      </div>

      {ids.map((id) => (
        <IntroLaunch key={id} id={id} open={live === id} onClose={() => setLive(null)} />
      ))}
    </>
  );
}
