"use client";

import { useState, useEffect, useRef, Children } from "react";

/**
 * Mascot3D — realistic 3D feel via view switching + parallax + idle behaviors.
 *
 * Renders only the active view (no crossfade artifacts).
 * Transitions use scale + translate for depth illusion.
 *
 * Children should be 3 elements: [front, side, rear]
 *
 * Props:
 *   children     — [front, side, rear] mascot elements
 *   view         — "front" | "side" | "rear"
 *   size         — base size
 *   idleTime     — seconds idle
 *   isScrolling  — whether user is scrolling
 *   mascotType   — mascot id for per-species behaviors
 */
export default function Mascot3D({
  children,
  view = "front",
  size = 96,
  idleTime = 0,
  isScrolling = false,
  mascotType = "box",
}) {
  const [peckOffset, setPeckOffset] = useState({ x: 0, y: 0 });
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [parallaxX, setParallaxX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const peckAnimRef = useRef(null);
  const transTimerRef = useRef(null);
  const prevViewRef = useRef(view);

  const childArray = Children.toArray(children);
  const viewIndex = { front: 0, side: 1, rear: 2 };
  const activeIdx = viewIndex[view] ?? 0;

  // Detect view change — trigger scale transition
  useEffect(() => {
    if (view === prevViewRef.current) return;

    setIsTransitioning(true);
    clearTimeout(transTimerRef.current);

    transTimerRef.current = setTimeout(() => {
      prevViewRef.current = view;
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 150);

    return () => clearTimeout(transTimerRef.current);
  }, [view]);

  // Parallax per view
  useEffect(() => {
    if (view === "side") setParallaxX(6);
    else if (view === "rear") setParallaxX(-4);
    else setParallaxX(0);
  }, [view]);

  // Zoom on idle
  useEffect(() => {
    if (idleTime > 10) setZoomScale(1.2);
    else if (idleTime > 5) setZoomScale(1.08);
    else setZoomScale(1);
  }, [idleTime]);

  // Per-mascot idle behaviors
  useEffect(() => {
    if (isScrolling || idleTime < 3) {
      setPeckOffset({ x: 0, y: 0 });
      setTiltX(0);
      setTiltY(0);
      return;
    }

    clearTimeout(peckAnimRef.current);

    const isBird = ["chicken_b", "rooster_b"].includes(mascotType);
    const isCat = mascotType === "cat_b";
    const isDog = mascotType === "dog_c";
    const isCuy = mascotType === "cuy_c";

    if (isBird) {
      let phase = 0;
      const peck = () => {
        phase = (phase + 1) % 6;
        if (phase < 3) {
          const p = phase / 2;
          setPeckOffset({ x: 0, y: 10 * p });
          setTiltX(12 * p);
        } else {
          const p = (phase - 3) / 2;
          setPeckOffset({ x: 0, y: 10 * (1 - p) });
          setTiltX(12 * (1 - p));
        }
        peckAnimRef.current = setTimeout(peck, 450);
      };
      peckAnimRef.current = setTimeout(peck, 1200);
    } else if (isCat) {
      let phase = 0;
      const stretch = () => {
        phase = (phase + 1) % 8;
        if (phase < 2) { setTiltX(-6); setTiltY(4); }
        else if (phase < 4) { setTiltX(6); setTiltY(-4); }
        else if (phase < 6) { setTiltX(-2); setTiltY(0); setZoomScale(1.04); }
        else { setTiltX(0); setTiltY(0); setZoomScale(1); }
        peckAnimRef.current = setTimeout(stretch, 650);
      };
      peckAnimRef.current = setTimeout(stretch, 1500);
    } else if (isDog) {
      let phase = 0;
      const tilt = () => {
        phase = (phase + 1) % 6;
        setTiltY(phase < 3 ? 10 : -10);
        setTiltX(phase < 3 ? -3 : 3);
        peckAnimRef.current = setTimeout(tilt, 750);
      };
      peckAnimRef.current = setTimeout(tilt, 1200);
    } else if (isCuy) {
      let phase = 0;
      const wiggle = () => {
        phase = (phase + 1) % 4;
        setPeckOffset({ x: phase % 2 === 0 ? 2 : -2, y: phase < 2 ? 1 : -1 });
        peckAnimRef.current = setTimeout(wiggle, 220);
      };
      peckAnimRef.current = setTimeout(wiggle, 900);
    } else {
      let phase = 0;
      const sway = () => {
        phase = (phase + 1) % 6;
        setTiltY(Math.sin(phase * Math.PI / 3) * 4);
        peckAnimRef.current = setTimeout(sway, 550);
      };
      peckAnimRef.current = setTimeout(sway, 1100);
    }

    return () => clearTimeout(peckAnimRef.current);
  }, [isScrolling, idleTime, mascotType]);

  // Scale: normal 1, transitioning 0.92 (slight shrink for depth feel)
  const transitionScale = isTransitioning ? 0.92 : 1;

  return (
    <div
      style={{
        perspective: "600px",
        perspectiveOrigin: "center center",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        position: "relative",
      }}
    >
      {/* Only active view rendered — no layering artifacts */}
      <div
        style={{
          transform: `
            scale(${zoomScale * transitionScale})
            translateX(${parallaxX + peckOffset.x}px)
            translateY(${peckOffset.y}px)
            rotateX(${tiltX}deg)
            rotateY(${tiltY}deg)
          `,
          transformStyle: "preserve-3d",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          willChange: "transform",
        }}
      >
        {childArray[activeIdx]}
      </div>
    </div>
  );
}
