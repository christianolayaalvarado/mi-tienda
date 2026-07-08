"use client";

import { useEffect, useState } from "react";

import mascotEngine from "../MascotEngine";
import mascotLoop from "../core/MascotLoop";

export default function useRenderState() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    mascotLoop.start();

    const unsubscribe = mascotLoop.subscribe(() => {
      forceUpdate((v) => v + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return mascotEngine.getRenderState();
}