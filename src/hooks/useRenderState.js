"use client";

import { useEffect, useState } from "react";

import mascotEngine from "@/lib/mascot/MascotEngine";
import mascotLoop from "@/lib/mascot/core/MascotLoop";

export default function useRenderState() {
  const [renderState, setRenderState] = useState(null);

  useEffect(() => {
    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    setRenderState(mascotEngine.getRenderState());

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