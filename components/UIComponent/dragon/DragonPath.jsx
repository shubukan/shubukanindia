"use client";

import React, { useEffect, useRef } from "react";
import "./DragonPath.scss";

// ---------------------------------------------------------------------
// Ported from dragon/overlap-divs.html (the standalone prototype - see
// that file for the full derivation/history of this math). Same
// behavior, adapted to:
//   (a) live inside a React-owned DOM subtree instead of the whole
//       document, so a mount/unmount (Strict Mode, Fast Refresh, route
//       change) can never leak state into the next run - everything
//       mutable is created fresh inside the effect below;
//   (b) scale every size (div widths, path size, speed) to the actual
//       measured width of its own container instead of a fixed 900px
//       stage, so it fits whatever width `.Home` gives it at any
//       breakpoint (see DESIGN_WIDTH below).
// ---------------------------------------------------------------------

// Base tuning values, as hand-tuned in the standalone tool at a
// DESIGN_WIDTH-px-wide stage. Everything below scales from these by
// (actual measured stage width / DESIGN_WIDTH) - see rescaleConfig().
const DESIGN_WIDTH = 900;
const BASE_CONFIG = {
  firstWidth: 70, // px @ DESIGN_WIDTH - width/height of the 1st (head) div
  nthWidth: 20, // px @ DESIGN_WIDTH - width/height of the last (tail) div
  divCount: 39, // number of divs - MUST be a multiple of 3 (not scaled)
  arcCoveragePercent: 18, // % of one lap the chain spans (not scaled)
  speed: 1000, // px/second @ DESIGN_WIDTH
  frameRate: 60, // animation updates/second - caps position writes to this
  // rate regardless of display refresh rate (not scaled; distance covered
  // per second still matches `speed` exactly, only the update granularity
  // changes)
};

const IMAGES = {
  head: "/dragon/h2.png", // 1st div
  body: "/dragon/b2.png", // every div between head and tail
  leg: "/dragon/l1.png", // hangs off the last div of section A, and of section B
  tail: "/dragon/t2.png", // last div
};

// --- the custom track: ONE closed SVG path, exported from the reference
// design (public/dragon/vector_path.svg) together with its own viewBox.
// P1(=P4) and P2(=P3) are two specific vertices along it - see
// overlap-divs.html for how these were originally found (this path is the
// same shape, to the pixel, as that one). Pure/deterministic, so safe to
// derive once and share across every mount.

const RAW_FULL_D =
  "M387.389 534.512C351.625 611.43 387.389 693.486 485.389 731.511" +
  "C550.5 756.775 577.889 778.481 577.889 843.011" +
  "C577.889 902.011 522.889 934.099 522.889 992.011" +
  "C522.889 1105.01 604.313 1106.65 646.889 1181.51" +
  "C679.517 1238.88 658.579 1321.06 625.389 1375.51" +
  "C534.02 1525.4 30.4596 1430.73 14.3893 1181.51" +
  "C5.91842 1050.14 136.624 1057.58 153.389 927.011" +
  "C169.889 798.511 -7.88855 755.697 1.88929 626.511" +
  "C18.3893 408.511 259.077 484.486 368.389 185.511" +
  "C420.5 42.9865 583.41 -79.0698 698.389 68.5114" +
  "C895.889 323.512 472.014 352.512 387.389 534.512"; // 12 commands total
// (1 M + 11 C) - same structure/vertex order as the previous path, just
// shifted by (-1.5, -1.5) (a Figma stroke-export artifact) - so
// P1/P2_VERTEX_INDEX below are unchanged.

const P2_VERTEX_INDEX = 1;
const P1_VERTEX_INDEX = 9;

// The exact frame (public/dragon/vector_path.svg's viewBox) the artist
// positioned this path within, by hand, to show where it should sit
// relative to .Home - this frame maps 1:1 onto .Home's content box (see
// .dragon-path-stage's width/aspect-ratio in DragonPath.scss), so the
// path's coordinates can be used completely as-is: scale everything by
// (stage's actual measured width / FRAME_WIDTH) and place the origin
// (0,0) at the stage's own top-left - no re-centering, no independent
// per-axis fill percentage, none of that - the artist already did the
// positioning work in Figma; this just has to reproduce it faithfully.
const FRAME_WIDTH = 752;
const FRAME_HEIGHT = 1449;

// The path only ever uses absolute M / C commands, so a small parser
// tailored to exactly that is enough.
function parsePathCommands(d) {
  const commands = [];
  const re = /([MC])([^MC]*)/g;
  let m;
  while ((m = re.exec(d))) {
    const nums = m[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    commands.push({ type: m[1], nums });
  }
  return commands;
}

// Rebuild a 'd' string from parsed commands, mapping every (x,y) pair
// through fn(x,y) -> [x,y]. The transform used (uniform scale +
// translate) is affine, so this maps the exact bezier curve, not an
// approximation.
function buildPathD(commands, fn) {
  let out = "";
  commands.forEach((cmd) => {
    const pts = [];
    for (let i = 0; i < cmd.nums.length; i += 2) {
      const [nx, ny] = fn(cmd.nums[i], cmd.nums[i + 1]);
      pts.push(nx.toFixed(2), ny.toFixed(2));
    }
    out += cmd.type + " " + pts.join(" ") + " ";
  });
  return out.trim();
}

const FULL_COMMANDS = parsePathCommands(RAW_FULL_D);

export default function DragonPath() {
  const stageRef = useRef(null);
  const guideRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const pathGuide = guideRef.current;
    if (!stage || !pathGuide) return;

    // --- everything below is per-instance state, local to this one
    // effect run, so a remount never inherits a stale run from before ---

    let boxes = [];
    let boxWidths = []; // each box's current width in px (tapered 1st -> nth)
    let lastAIndex = -1;
    let lastBIndex = -1;
    let attachmentA = null;
    let attachmentB = null;
    let lastFrameTime = null;
    let rafId = null;
    let frameAccumulator = 0; // seconds of un-applied real time, for the frameRate cap below

    let trackFullEl = null; // live <path>: both the visible guide AND the
    // source of getTotalLength/getPointAtLength
    let trackScratchEl = null; // hidden, reused only to measure partial lengths
    let trackDistance = 0; // the LEAD div's distance travelled, in px
    let trackStopped = false;
    let lapsAfterInitial = 0; // +1 each restart, once already stopped
    let totalLoopLength = 0;
    let blackLength = 0; // P1 -> P2, the initial (on-load) stretch
    let p1CumLen = 0;
    let trackPolygon = []; // sampled boundary points, in final stage-pixel space
    let trackFlip = false; // true if the divs' default "top" needs a vertical mirror

    let config = { ...BASE_CONFIG }; // rescaled below before first use

    // Rescales the div sizes/speed to the stage's actual measured width,
    // so the chain fits whatever width `.Home` gives it at the current
    // breakpoint. (The path itself is scaled separately, directly off
    // FRAME_WIDTH - see trackScale() below.)
    function rescaleConfig() {
      const scale =
        stage.clientWidth > 0 ? stage.clientWidth / DESIGN_WIDTH : 1;
      config = {
        firstWidth: BASE_CONFIG.firstWidth * scale,
        nthWidth: BASE_CONFIG.nthWidth * scale,
        speed: BASE_CONFIG.speed * scale,
        divCount: BASE_CONFIG.divCount,
        arcCoveragePercent: BASE_CONFIG.arcCoveragePercent,
        frameRate: BASE_CONFIG.frameRate,
      };
    }

    trackFullEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    pathGuide.appendChild(trackFullEl);
    trackScratchEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    trackScratchEl.style.display = "none";
    pathGuide.appendChild(trackScratchEl);

    // A single uniform scale factor: the stage's actual measured width
    // divided by FRAME_WIDTH. Uniform (not independent X/Y) on purpose -
    // the artist's frame already has its own intended aspect ratio
    // (.dragon-path-stage's aspect-ratio in DragonPath.scss matches
    // FRAME_WIDTH/FRAME_HEIGHT exactly), so scaling both axes by the same
    // factor reproduces the reference exactly rather than distorting it.
    function trackScale() {
      return FRAME_WIDTH > 0 ? stage.clientWidth / FRAME_WIDTH : 1;
    }

    // Rebuilds the live path element at the current stage size, by
    // transforming the exact bezier control points (uniform scale from
    // the frame's own (0,0) origin - no re-centering), so
    // getTotalLength/getPointAtLength on it afterwards already return
    // final on-screen pixel coordinates.
    function rebuildCustomTrackGeometry() {
      const scale = trackScale();
      const toStage = (x, y) => [x * scale, y * scale];
      trackFullEl.setAttribute("d", buildPathD(FULL_COMMANDS, toStage));
    }

    // Cumulative length, in the path's OWN native start-to-vertexIndex
    // order, using the same on-screen scale as trackFullEl.
    function cumulativeLengthAt(vertexIndex) {
      if (vertexIndex === 0) return 0;
      const scale = trackScale();
      const toStage = (x, y) => [x * scale, y * scale];
      trackScratchEl.setAttribute(
        "d",
        buildPathD(FULL_COMMANDS.slice(0, vertexIndex + 1), toStage),
      );
      return trackScratchEl.getTotalLength();
    }

    function currentStopLength() {
      return blackLength + lapsAfterInitial * totalLoopLength;
    }

    // Full reset to the very start (P1, stopping at P2 first). Used once,
    // on mount.
    function resetTrack() {
      trackDistance = 0;
      trackStopped = false;
      lapsAfterInitial = 0;
    }

    // Restart: let the SAME distance counter keep growing for one more
    // full lap (P2->P3->P4->(=P1)->P2) before stopping again - nothing is
    // reset, so no div snaps or respawns. Triggered by clicking the chain
    // once it has stopped - see handleClick below.
    function extendTrackForRestart() {
      lapsAfterInitial += 1;
      trackStopped = false;
    }

    // Recompute lengths after a resize, WITHOUT resetting the run, so an
    // in-progress animation doesn't snap when the viewport changes.
    function refreshCustomTrackScale() {
      rebuildCustomTrackGeometry();
      totalLoopLength = trackFullEl.getTotalLength();
      p1CumLen = cumulativeLengthAt(P1_VERTEX_INDEX);
      const p2CumLen = cumulativeLengthAt(P2_VERTEX_INDEX);
      blackLength = p1CumLen - p2CumLen;
      trackDistance = Math.min(trackDistance, currentStopLength());
      buildTrackPolygon();
      computeTrackFlip();
    }

    // Point on the track at "distance d past P1". The underlying path's
    // own native direction runs the opposite way around, which is why
    // this walks backward from P1's native position, wrapping via modulo.
    function getPointOnTrack(d) {
      if (!totalLoopLength) return { x: 0, y: 0 };
      let nativeDist = p1CumLen - d;
      nativeDist =
        ((nativeDist % totalLoopLength) + totalLoopLength) % totalLoopLength;
      return trackFullEl.getPointAtLength(nativeDist);
    }

    function buildTrackPolygon() {
      const SAMPLES = 300;
      trackPolygon = [];
      for (let i = 0; i < SAMPLES; i++) {
        const len = (i / SAMPLES) * totalLoopLength;
        trackPolygon.push(trackFullEl.getPointAtLength(len));
      }
    }

    // Standard ray-casting point-in-polygon test.
    function isPointInsideTrack(x, y) {
      let inside = false;
      for (
        let i = 0, j = trackPolygon.length - 1;
        i < trackPolygon.length;
        j = i++
      ) {
        const xi = trackPolygon[i].x,
          yi = trackPolygon[i].y;
        const xj = trackPolygon[j].x,
          yj = trackPolygon[j].y;
        const intersects =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersects) inside = !inside;
      }
      return inside;
    }

    // Checks, once, whether a div's default "top" actually lands outside
    // the shape or not, and sets trackFlip accordingly.
    function computeTrackFlip() {
      if (!trackPolygon.length) {
        trackFlip = false;
        return;
      }
      const DELTA = 0.5;
      const p = getPointOnTrack(0);
      const p2 = getPointOnTrack(DELTA);
      const rot = Math.atan2(p2.y - p.y, p2.x - p.x);
      const topX = Math.sin(rot),
        topY = -Math.cos(rot);
      // Small nudge off the curve to test inside/outside - proportional to
      // the stage's smaller dimension so it stays sensible at any size.
      const eps = Math.max(
        2,
        Math.min(stage.clientWidth, stage.clientHeight) * 0.02,
      );
      trackFlip = isPointInsideTrack(p.x + topX * eps, p.y + topY * eps);
    }

    // --- building the divs ----------------------------------------------

    function rebuildBoxes() {
      const count = config.divCount;

      stage.querySelectorAll(".dragon-path-box").forEach((el) => el.remove());
      boxes = [];
      attachmentA = null;
      attachmentB = null;

      // Divide the divs into 3 equal sections - A, B, C - and note the
      // index of the last div in Section A and in Section B.
      const sectionSize = count / 3;
      lastAIndex = sectionSize - 1;
      lastBIndex = sectionSize * 2 - 1;

      for (let i = 0; i < count; i++) {
        const box = document.createElement("div");
        box.className = "dragon-path-box";
        box.style.zIndex = count - i; // 1st div stays on top

        const partImg = document.createElement("img");
        partImg.className = "dragon-path-part-image";
        partImg.alt = "";
        partImg.dataset.part =
          i === 0 ? "head" : i === count - 1 ? "tail" : "body";
        box.appendChild(partImg);

        if (i === lastAIndex) {
          attachmentA = document.createElement("div");
          attachmentA.className = "dragon-path-attachment";
          const legImgA = document.createElement("img");
          legImgA.className = "dragon-path-part-image";
          legImgA.alt = "";
          legImgA.dataset.part = "leg";
          attachmentA.appendChild(legImgA);
          box.appendChild(attachmentA);
        }
        if (i === lastBIndex) {
          attachmentB = document.createElement("div");
          attachmentB.className = "dragon-path-attachment";
          const legImgB = document.createElement("img");
          legImgB.className = "dragon-path-part-image";
          legImgB.alt = "";
          legImgB.dataset.part = "leg";
          attachmentB.appendChild(legImgB);
          box.appendChild(attachmentB);
        }

        stage.appendChild(box);
        boxes.push(box);
      }

      applySizes();
      applyPartImages();
    }

    // Sets each part-image's src/visibility from IMAGES, by its data-part.
    function applyPartImages() {
      stage.querySelectorAll(".dragon-path-part-image").forEach((img) => {
        const src = IMAGES[img.dataset.part];
        if (src) {
          img.src = src;
          img.style.display = "block";
        } else {
          img.removeAttribute("src");
          img.style.display = "none";
        }
      });
    }

    function applySizes() {
      const count = boxes.length;
      const firstWidth = config.firstWidth;
      const nthWidth = config.nthWidth;

      // Every div's width is linearly interpolated between the 1st div's
      // width and the nth (last) div's width, so the chain tapers
      // smoothly from one end to the other.
      boxWidths = boxes.map((box, i) => {
        const frac = count > 1 ? i / (count - 1) : 0;
        const w = firstWidth + (nthWidth - firstWidth) * frac;
        box.style.width = w + "px";
        box.style.height = w + "px";
        return w;
      });

      // divA / divB: sized off their OWN parent div's width (which
      // varies, since widths taper), not a single global width.
      if (attachmentA && boxWidths[lastAIndex] !== undefined) {
        const w = boxWidths[lastAIndex];
        attachmentA.style.height = w + "px";
        attachmentA.style.width = w + "px";
      }
      if (attachmentB && boxWidths[lastBIndex] !== undefined) {
        const w = boxWidths[lastBIndex];
        attachmentB.style.height = w + "px";
        attachmentB.style.width = w + "px";
      }
    }

    // divA / divB swing back and forth within a 45deg range (+/-22.5deg)
    // around their top-center attachment point.
    function applyAttachmentSwing(basis) {
      const SWING_AMPLITUDE_DEG = 22.5;
      const SWING_FREQUENCY = 0.02;
      const swingDeg = SWING_AMPLITUDE_DEG * Math.sin(basis * SWING_FREQUENCY);

      [attachmentA, attachmentB].forEach((el) => {
        if (!el) return;
        el.style.transform = `translate(-50%, 0) rotate(${swingDeg.toFixed(2)}deg)`;
      });
    }

    // Positioning for the custom (open, single-path) track. Distance is
    // clamped to [0, currentStopLength()], so trailing divs simply pile
    // up at the start until the lead has moved far enough, and everything
    // freezes once the lead (div #1) reaches the current stop point.
    function positionBoxesCustomTrack() {
      const count = boxes.length;
      const stopLength = currentStopLength();
      // Spacing is a % of ONE lap (a fixed reference), not of the current
      // stop length - stopLength grows by a full lap every restart, and
      // using it here would make the divs spread further apart on every
      // single restart.
      const coverage = (config.arcCoveragePercent / 100) * totalLoopLength;
      const spacing = count > 1 ? coverage / count : 0;
      const DELTA = 0.5; // px, for a numerical tangent (native arc-length, so this is exact)

      boxes.forEach((box, i) => {
        const half = (boxWidths[i] || 0) / 2;
        let dist = trackDistance - i * spacing;
        dist = Math.max(0, Math.min(dist, stopLength));

        const p = getPointOnTrack(dist);
        const p2 = getPointOnTrack(dist + DELTA);
        const dx = p2.x - p.x;
        const dy = p2.y - p.y;
        const rotationDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

        // scaleY(-1), applied last, mirrors which physical side is "top"
        // so the div's dorsal side always faces outward from the track.
        const flipPart = trackFlip ? " scaleY(-1)" : "";

        box.style.transform = `translate(${(p.x - half).toFixed(1)}px, ${(p.y - half).toFixed(1)}px) rotate(${rotationDeg.toFixed(2)}deg) scaleX(-1)${flipPart}`;
      });

      applyAttachmentSwing(trackDistance);
    }

    function tick(now) {
      if (lastFrameTime === null) lastFrameTime = now;
      let dt = (now - lastFrameTime) / 1000; // seconds
      lastFrameTime = now;
      dt = Math.min(dt, 0.05); // avoid a big jump if the tab was throttled/backgrounded

      // Cap actual position updates to config.frameRate, independent of the
      // display's own refresh rate (rAF still fires every display frame, but
      // only spends a fixed-size step of real time per applied update - so
      // `speed` still means px/second exactly, just stepped/chunkier at a
      // low frameRate rather than smoothed across every display frame).
      frameAccumulator += dt;
      const frameInterval = 1 / config.frameRate;

      if (frameAccumulator >= frameInterval) {
        while (frameAccumulator >= frameInterval) {
          if (!trackStopped) {
            trackDistance += config.speed * frameInterval;
            const stopLength = currentStopLength();
            if (trackDistance >= stopLength) {
              trackDistance = stopLength;
              trackStopped = true; // lead div reached the current stop point - freeze everything
            }
          }
          frameAccumulator -= frameInterval;
        }
        positionBoxesCustomTrack();
      }

      rafId = requestAnimationFrame(tick);
    }

    // Click anywhere on the chain to restart it - but ONLY once it has
    // actually stopped (clicking mid-run does nothing).
    function handleClick(e) {
      if (!e.target.closest(".dragon-path-box")) return;
      if (!trackStopped) return;
      extendTrackForRestart(); // continues on, no jump: P2->P3->P4->(=P1)->P2
      positionBoxesCustomTrack();
    }

    // --- boot ---
    rescaleConfig();
    rebuildBoxes();
    refreshCustomTrackScale();
    resetTrack();
    positionBoxesCustomTrack();
    stage.addEventListener("click", handleClick);
    rafId = requestAnimationFrame(tick);

    // Recompute the scale-dependent geometry whenever the stage's
    // measured width changes (viewport resize, sidebar toggling, etc.) -
    // WITHOUT resetting trackDistance/lapsAfterInitial, so an
    // in-progress run doesn't snap.
    const resizeObserver = new ResizeObserver(() => {
      rescaleConfig();
      applySizes();
      refreshCustomTrackScale();
      positionBoxesCustomTrack();
    });
    resizeObserver.observe(stage);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      stage.removeEventListener("click", handleClick);
      stage.querySelectorAll(".dragon-path-box").forEach((el) => el.remove());
      pathGuide.replaceChildren();
    };
  }, []);

  return (
    <div className="dragon-path-stage" ref={stageRef}>
      <svg className="dragon-path-guide" ref={guideRef}></svg>
    </div>
  );
}
