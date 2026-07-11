"use client";

import { useEffect, useState } from "react";

import mascotEngine from "@/lib/mascot/MascotEngine";
import mascotLoop from "@/lib/mascot/core/MascotLoop";

export default function useRenderState() {
  const [renderState, setRenderState] = useState(() => {
    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    return mascotEngine.getRenderState();
  });

  useEffect(() => {
    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    mascotLoop.start();

    const unsubscribe = mascotLoop.subscribe((state) => {
      setRenderState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return renderState;
}