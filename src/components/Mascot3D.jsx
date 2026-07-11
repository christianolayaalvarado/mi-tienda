"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Mascot3D — wraps a mascot with 3D perspective transforms.
 *
 * Props:
 *   children     — the mascot element to wrap
 *   view         — "front" | "side" | "rear"
 *   size         — base size of the mascot
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
  const [rotateY, setRotateY] = useState(0);
  const [targetRotateY, setTargetRotateY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [peckOffset, setPeckOffset] = useState({ x: 0, y: 0 });
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const rotateAnimRef = useRef(null);
  const peckAnimRef = useRef(null);

  // Map view to rotateY
  const viewAngles = { front: 0, side: -30, rear: 180 };

  // Smooth rotateY interpolation
  useEffect(() => {
    const target = viewAngles[view] || 0;
    setTargetRotateY(target);
  }, [view]);

  useEffect(() => {
    const animate = () => {
      setRotateY((prev) => {
        const diff = targetRotateY - prev;
        if (Math.abs(diff) < 0.5) return targetRotateY;
        return prev + diff * 0.08;
      });
      rotateAnimRef.current = requestAnimationFrame(animate);
    };
    rotateAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rotateAnimRef.current);
  }, [targetRotateY]);

  // Zoom effect on long idle
  useEffect(() => {
    if (idleTime > 10) {
      setZoomScale(1.25);
    } else if (idleTime > 5) {
      setZoomScale(1.1);
    } else {
      setZoomScale(1);
    }
  }, [idleTime]);

  // Per-mascot idle behaviors
  useEffect(() => {
    if (isScrolling || idleTime < 3) {
      setPeckOffset({ x: 0, y: 0 });
      setTiltX(0);
      setTiltY(0);
      return;
    }

    cancelAnimationFrame(peckAnimRef.current);

    // Different behaviors per species
    const isBird = ["chicken_b", "rooster_b"].includes(mascotType);
    const isCat = mascotType === "cat_b";
    const isDog = mascotType === "dog_c";
    const isCuy = mascotType === "cuy_c";

    if (isBird) {
      // Pecking behavior
      let phase = 0;
      const peck = () => {
        phase = (phase + 1) % 6;
        if (phase < 3) {
          // Head down (peck)
          const progress = phase / 2;
          setPeckOffset({ x: 0, y: 8 * progress });
          setTiltX(15 * progress);
        } else {
          // Head up
          const progress = (phase - 3) / 2;
          setPeckOffset({ x: 0, y: 8 * (1 - progress) });
          setTiltX(15 * (1 - progress));
        }
        peckAnimRef.current = setTimeout(peck, 400);
      };
      peckAnimRef.current = setTimeout(peck, 1000);
    } else if (isCat) {
      // Stretching / looking around
      let phase = 0;
      const stretch = () => {
        phase = (phase + 1) % 8;
        if (phase < 2) {
          setTiltX(-8);
          setTiltY(5);
        } else if (phase < 4) {
          setTiltX(8);
          setTiltY(-5);
        } else if (phase < 6) {
          setTiltX(-3);
          setTiltY(0);
          setZoomScale(1.05);
        } else {
          setTiltX(0);
          setTiltY(0);
          setZoomScale(1);
        }
        peckAnimRef.current = setTimeout(stretch, 600);
      };
      peckAnimRef.current = setTimeout(stretch, 1500);
    } else if (isDog) {
      // Head tilt
      let phase = 0;
      const tilt = () => {
        phase = (phase + 1) % 6;
        if (phase < 3) {
          setTiltY(12);
          setTiltX(-5);
        } else {
          setTiltY(-12);
          setTiltX(5);
        }
        peckAnimRef.current = setTimeout(tilt, 700);
      };
      peckAnimRef.current = setTimeout(tilt, 1200);
    } else if (isCuy) {
      // Nose wiggle (small rapid movements)
      let phase = 0;
      const wiggle = () => {
        phase = (phase + 1) % 4;
        setPeckOffset({
          x: phase % 2 === 0 ? 2 : -2,
          y: phase < 2 ? 1 : -1,
        });
        peckAnimRef.current = setTimeout(wiggle, 200);
      };
      peckAnimRef.current = setTimeout(wiggle, 800);
    } else {
      // Generic gentle sway
      let phase = 0;
      const sway = () => {
        phase = (phase + 1) % 6;
        setTiltY(Math.sin(phase * Math.PI / 3) * 5);
        peckAnimRef.current = setTimeout(sway, 500);
      };
      peckAnimRef.current = setTimeout(sway, 1000);
    }

    return () => clearTimeout(peckAnimRef.current);
  }, [isScrolling, idleTime, mascotType]);

  return (
    <div
      style={{
        perspective: "400px",
        perspectiveOrigin: "center center",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      <div
        style={{
          transform: `
            scale(${zoomScale})
            rotateY(${rotateY}deg)
            rotateX(${tiltX}deg)
            translateX(${peckOffset.x}px)
            translateY(${peckOffset.y}px)
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
