"use client";

import { createContext, useContext, useState, useCallback } from "react";
import HelpCenter from "@/components/HelpCenter";

const HelpCenterContext = createContext(null);

export function useHelpCenter() {
  return useContext(HelpCenterContext);
}

export function HelpCenterProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState(null);

  const openHelp = useCallback((category) => {
    setInitialCategory(category || null);
    setOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setOpen(false);
    setInitialCategory(null);
  }, []);

  return (
    <HelpCenterContext.Provider value={{ openHelp, closeHelp }}>
      {children}
      <HelpCenter open={open} onClose={closeHelp} initialCategory={initialCategory} />
    </HelpCenterContext.Provider>
  );
}
