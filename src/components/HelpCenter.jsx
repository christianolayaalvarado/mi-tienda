"use client";

import { useState, useRef, useEffect } from "react";
import { TUTORIAL_CATEGORIES, TUTORIALS } from "@/lib/helpTutorials";
import StepIllustration from "@/components/StepIllustration";

export default function HelpCenter({ open, onClose, initialCategory }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const stepsRef = useRef(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setSelectedTutorial(null);
      setActiveStep(0);
    }
  }, [initialCategory]);

  // Track which step is visible on scroll
  useEffect(() => {
    if (!selectedTutorial || !stepsRef.current) return;
    const container = stepsRef.current;
    const handleScroll = () => {
      const stepElements = container.querySelectorAll("[data-step]");
      let current = 0;
      stepElements.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top - containerRect.top < containerRect.height / 3) {
          current = i;
        }
      });
      setActiveStep(current);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedTutorial]);

  if (!open) return null;

  const handleCategory = (catId) => {
    setSelectedCategory(catId);
    setSelectedTutorial(null);
    setActiveStep(0);
  };

  const handleTutorial = (tutorial) => {
    setSelectedTutorial(tutorial);
    setActiveStep(0);
  };

  const handleBack = () => {
    if (selectedTutorial) {
      setSelectedTutorial(null);
      setActiveStep(0);
    } else {
      setSelectedCategory(null);
    }
  };

  const handleAction = (url) => {
    if (url.startsWith("#")) {
      onClose();
      return;
    }
    window.location.href = url;
  };

  const currentIllustration = selectedTutorial?.steps?.[activeStep]?.illustration;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-[fadeInScale_0.2s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(selectedCategory || selectedTutorial) && (
                <button onClick={handleBack} className="text-white/80 hover:text-white text-lg font-bold">
                  ←
                </button>
              )}
              <div>
                <h2 className="text-lg font-bold">
                  {selectedTutorial ? selectedTutorial.title : selectedCategory ? TUTORIAL_CATEGORIES.find(c => c.id === selectedCategory)?.label : "Centro de Ayuda"}
                </h2>
                <p className="text-white/70 text-xs">
                  {selectedTutorial ? `${selectedTutorial.steps.length} pasos` : selectedCategory ? TUTORIAL_CATEGORIES.find(c => c.id === selectedCategory)?.description : "Tutoriales y guías de uso"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Categorías */}
          {!selectedCategory && !selectedTutorial && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(90vh-80px)]">
              {TUTORIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-center"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{cat.label}</span>
                  <span className="text-[11px] text-gray-400">{cat.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Lista de tutoriales de una categoría */}
          {selectedCategory && !selectedTutorial && (
            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(90vh-80px)]">
              {TUTORIALS[selectedCategory]?.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => handleTutorial(tutorial)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <span className="text-2xl">{tutorial.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-700">{tutorial.title}</div>
                    <div className="text-[11px] text-gray-400">{tutorial.steps.length} pasos</div>
                  </div>
                  <span className="text-gray-300 text-lg">→</span>
                </button>
              ))}
            </div>
          )}

          {/* Tutorial detallado con pasos + ilustración */}
          {selectedTutorial && (
            <div className="flex flex-col sm:flex-row h-full max-h-[calc(90vh-80px)]">
              {/* Ilustración — visible en desktop (lado izquierdo), en mobile arriba */}
              {currentIllustration && (
                <div className="hidden sm:flex w-[280px] shrink-0 items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-r border-green-100">
                  <div className="w-full max-w-[240px] aspect-square">
                    <StepIllustration type={currentIllustration} animate={true} className="w-full h-full" />
                  </div>
                </div>
              )}

              {/* Ilustración mobile — compacta arriba */}
              {currentIllustration && (
                <div className="sm:hidden shrink-0 px-4 pt-3 pb-2 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
                  <div className="w-full h-[120px]">
                    <StepIllustration type={currentIllustration} animate={true} className="w-full h-full" />
                  </div>
                </div>
              )}

              {/* Steps */}
              <div ref={stepsRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
                {selectedTutorial.steps.map((step, i) => (
                  <div
                    key={i}
                    data-step={i}
                    className={`flex gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                      i === activeStep ? "bg-green-50 border border-green-200 shadow-sm" : "border border-transparent"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                      i === activeStep ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="text-sm text-gray-700 pt-0.5 leading-relaxed">{step.text}</div>
                  </div>
                ))}

                {/* Tip */}
                {selectedTutorial.tip && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div className="text-xs text-amber-700 leading-relaxed">{selectedTutorial.tip}</div>
                    </div>
                  </div>
                )}

                {/* Botón de acción */}
                <button
                  onClick={() => handleAction(selectedTutorial.url)}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors text-sm mt-3"
                >
                  {selectedTutorial.urlLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
