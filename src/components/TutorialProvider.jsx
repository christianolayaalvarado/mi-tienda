"use client";

import { createContext, useContext, useCallback, useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { buyerSteps, sellerSteps, isTutorialCompleted, markTutorialCompleted } from "@/lib/tutorials";
import { useAuthContext } from "@/context/AuthProvider";

const TutorialContext = createContext(null);

export function useTutorial() {
  return useContext(TutorialContext);
}

export function TutorialProvider({ children }) {
  const { user } = useAuthContext() || {};
  const pathname = usePathname();
  const shepherdRef = useRef(null);
  const [active, setActive] = useState(false);

  const cleanup = useCallback(() => {
    if (shepherdRef.current) {
      try { shepherdRef.current.complete(); } catch {}
      shepherdRef.current = null;
    }
    setActive(false);
  }, []);

  const startTutorial = useCallback(async (force = false) => {
    if (!force && isTutorialCompleted()) return;

    const Shepherd = (await import("shepherd.js")).default;
    await import("shepherd.js/dist/css/shepherd.css");

    cleanup();

    const isShop = pathname?.startsWith("/dashboard") ? false : true;
    const steps = isShop ? buyerSteps : sellerSteps;

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        classes: "shadow-xl rounded-xl",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: { enabled: true },
      },
      useEffectOverlay: true,
    });

    steps.forEach((step) => {
      tour.addStep({
        id: step.id,
        title: `<span style="font-weight:700;font-size:14px">${step.title}</span>`,
        text: `<span style="font-size:13px;line-height:1.5">${step.text}</span>`,
        attachTo: step.attachTo,
        buttons: step.buttons.map((btn) => ({
          text: btn.text,
          classes: `shepherd-button ${btn.classes || ""}`,
          action: () => {
            if (btn.action === "next") tour.next();
            else if (btn.action === "back") tour.back();
            else if (btn.action === "complete") {
              tour.complete();
              markTutorialCompleted();
            }
            else if (btn.action === "cancel") {
              tour.cancel();
              markTutorialCompleted();
            }
          },
        })),
        when: {
          show: () => { setActive(true); },
          hide: () => { setActive(false); },
        },
      });
    });

    tour.on("complete", () => { markTutorialCompleted(); shepherdRef.current = null; setActive(false); });
    tour.on("cancel", () => { markTutorialCompleted(); shepherdRef.current = null; setActive(false); });

    shepherdRef.current = tour;
    tour.start();
  }, [pathname, cleanup]);

  const skipTutorial = useCallback(() => {
    cleanup();
    markTutorialCompleted();
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Listen for auto-start event from RootLayoutClientInit
  useEffect(() => {
    const handler = () => startTutorial(false);
    window.addEventListener("tutorial:auto-start", handler);
    return () => window.removeEventListener("tutorial:auto-start", handler);
  }, [startTutorial]);

  return (
    <TutorialContext.Provider value={{ startTutorial, skipTutorial, active }}>
      {children}
    </TutorialContext.Provider>
  );
}
