"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Mascot States:
 *   walking  — moving to a random destination
 *   sitting  — seated, looking around
 *   lying    — lying down, relaxed
 *   sleeping — eyes closed, ZZZ
 *   playing  — bouncing, active
 *   idle     — standing still
 */

const STATES = {
  IDLE: "idle",
  WALKING: "walking",
  SITTING: "sit",
  LYING: "lie",
  SLEEPING: "sleep",
  PLAYING: "play",
};

const STATE_DURATIONS = {
  [STATES.IDLE]: { min: 3000, max: 8000 },
  [STATES.WALKING]: { min: 4000, max: 10000 },
  [STATES.SITTING]: { min: 8000, max: 20000 },
  [STATES.LYING]: { min: 10000, max: 25000 },
  [STATES.SLEEPING]: { min: 15000, max: 40000 },
  [STATES.PLAYING]: { min: 5000, max: 12000 },
};

const STATE_TRANSITIONS = {
  [STATES.IDLE]: [STATES.WALKING, STATES.SITTING, STATES.PLAYING],
  [STATES.WALKING]: [STATES.IDLE, STATES.SITTING, STATES.PLAYING],
  [STATES.SITTING]: [STATES.IDLE, STATES.WALKING, STATES.LYING],
  [STATES.LYING]: [STATES.SITTING, STATES.SLEEPING, STATES.IDLE],
  [STATES.SLEEPING]: [STATES.IDLE, STATES.LYING],
  [STATES.PLAYING]: [STATES.IDLE, STATES.WALKING],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function useMascotBehavior({
  screenWidth = 1200,
  screenHeight = 800,
  navHeight = 130,
  isActive = true,
}) {
  const [state, setState] = useState(STATES.IDLE);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState(null);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isGrounded, setIsGrounded] = useState(true);
  const [zzz, setZzz] = useState(false);

  const stateTimer = useRef(null);
  const moveTimer = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });

  // Initialize position
  useEffect(() => {
    const startX = Math.random() * (screenWidth - 120) + 60;
    const startY = screenHeight - 120;
    setPosition({ x: startX, y: startY });
    posRef.current = { x: startX, y: startY };
  }, [screenWidth, screenHeight]);

  // Pick next state
  const pickNextState = useCallback(() => {
    if (!isActive) return;
    const current = state;
    const candidates = STATE_TRANSITIONS[current] || [STATES.IDLE];
    const next = pickRandom(candidates);

    // For sleeping, only allow if idle for a long time
    if (next === STATES.SLEEPING && current !== STATES.LYING) {
      return pickRandom(STATE_TRANSITIONS[current].filter(s => s !== STATES.SLEEPING));
    }

    return next;
  }, [state, isActive]);

  // Pick random target position for walking
  const pickTarget = useCallback(() => {
    const margin = 80;
    const tx = randomBetween(margin, screenWidth - margin);
    const ty = randomBetween(screenHeight - 140, screenHeight - 80);
    setTarget({ x: tx, y: ty });
    setDirection(tx > posRef.current.x ? 1 : -1);
  }, [screenWidth, screenHeight]);

  // Move toward target
  useEffect(() => {
    if (state !== STATES.WALKING || !target || !isActive) {
      clearInterval(moveTimer.current);
      return;
    }

    const speed = 1.5;
    moveTimer.current = setInterval(() => {
      const pos = posRef.current;
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        clearInterval(moveTimer.current);
        setState(STATES.IDLE);
        return;
      }

      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      const newX = Math.max(40, Math.min(screenWidth - 40, pos.x + vx));
      const newY = Math.max(navHeight + 20, Math.min(screenHeight - 60, pos.y + vy));

      posRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });
      setDirection(vx > 0 ? 1 : -1);
    }, 30);

    return () => clearInterval(moveTimer.current);
  }, [state, target, isActive, screenWidth, screenHeight, navHeight]);

  // State machine timer
  useEffect(() => {
    if (!isActive) return;

    clearTimeout(stateTimer.current);

    if (state === STATES.WALKING) {
      pickTarget();
    }

    if (state === STATES.SLEEPING) {
      setZzz(true);
    } else {
      setZzz(false);
    }

    const duration = randomBetween(
      STATE_DURATIONS[state].min,
      STATE_DURATIONS[state].max
    );

    stateTimer.current = setTimeout(() => {
      const next = pickNextState();
      if (next) setState(next);
    }, duration);

    return () => clearTimeout(stateTimer.current);
  }, [state, isActive, pickNextState, pickTarget]);

  // React to user activity
  const reactToActivity = useCallback(() => {
    if (state === STATES.SLEEPING) {
      setState(STATES.IDLE);
    }
  }, [state]);

  // Jump (for playing)
  const jump = useCallback(() => {
    setIsGrounded(false);
    setTimeout(() => setIsGrounded(true), 600);
  }, []);

  return {
    state,
    position,
    direction,
    isGrounded,
    zzz,
    jump,
    reactToActivity,
    STATES,
  };
}
