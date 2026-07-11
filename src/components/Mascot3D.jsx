"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Mascot3D — attractive idle behaviors without view rotation.
 *
 * Keeps: breathing, zoom, per-species behaviors, tilt.
 * Removed: view rotation, crossfade, blink overlay (caused artifacts).
 *
 * Props:
 *   children     — the mascot element
 *   size         — base size
 *   idleTime     — seconds idle
 *   isScrolling  — whether user is scrolling
 *   mascotType   — mascot id for per-species behaviors
 */
export default function Mascot3D({
  children,
  size = 96,
  idleTime = 0,
  isScrolling = false,
  mascotType = "box",
}) {
  const [peckOffset, setPeckOffset] = useState({ x: 0, y: 0 });
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [breathScale, setBreathScale] = useState(1);
  const peckAnimRef = useRef(null);
  const breathRef = useRef(null);

  // Breathing
  useEffect(() => {
    let frame;
    let phase = 0;
    const animate = () => {
      phase += 0.025;
      setBreathScale(1 + Math.sin(phase) * 0.02);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Zoom on idle
  useEffect(() => {
    if (idleTime > 12) setZoomScale(1.25);
    else if (idleTime > 6) setZoomScale(1.1);
    else setZoomScale(1);
  }, [idleTime]);

  // Per-mascot idle behaviors
  useEffect(() => {
    if (isScrolling || idleTime < 4) {
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
          setPeckOffset({ x: 0, y: 12 * p });
          setTiltX(15 * p);
        } else {
          const p = (phase - 3) / 2;
          setPeckOffset({ x: 0, y: 12 * (1 - p) });
          setTiltX(15 * (1 - p));
        }
        peckAnimRef.current = setTimeout(peck, 400);
      };
      peckAnimRef.current = setTimeout(peck, 1000);
    } else if (isCat) {
      let phase = 0;
      const stretch = () => {
        phase = (phase + 1) % 8;
        if (phase < 2) { setTiltX(-5); setTiltY(4); }
        else if (phase < 4) { setTiltX(5); setTiltY(-4); }
        else if (phase < 6) { setTiltX(-2); setTiltY(0); }
        else { setTiltX(0); setTiltY(0); }
        peckAnimRef.current = setTimeout(stretch, 600);
      };
      peckAnimRef.current = setTimeout(stretch, 1500);
    } else if (isDog) {
      let phase = 0;
      const tilt = () => {
        phase = (phase + 1) % 6;
        setTiltY(phase < 3 ? 8 : -8);
        setTiltX(phase < 3 ? -3 : 3);
        peckAnimRef.current = setTimeout(tilt, 700);
      };
      peckAnimRef.current = setTimeout(tilt, 1200);
    } else if (isCuy) {
      let phase = 0;
      const wiggle = () => {
        phase = (phase + 1) % 4;
        setPeckOffset({ x: phase % 2 === 0 ? 2 : -2, y: phase < 2 ? 1 : -1 });
        peckAnimRef.current = setTimeout(wiggle, 200);
      };
      peckAnimRef.current = setTimeout(wiggle, 800);
    } else {
      let phase = 0;
      const sway = () => {
        phase = (phase + 1) % 6;
        setTiltY(Math.sin(phase * Math.PI / 3) * 4);
        peckAnimRef.current = setTimeout(sway, 500);
      };
      peckAnimRef.current = setTimeout(sway, 1000);
    }

    return () => clearTimeout(peckAnimRef.current);
  }, [isScrolling, idleTime, mascotType]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `
            scale(${breathScale * zoomScale})
            translateX(${peckOffset.x}px)
            translateY(${peckOffset.y}px)
            rotateX(${tiltX}deg)
            rotateY(${tiltY}deg)
          `,
          transformStyle: "preserve-3d",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
