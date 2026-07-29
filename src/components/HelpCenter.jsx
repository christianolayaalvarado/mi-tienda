"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

  // Reset step when tutorial changes
  useEffect(() => {
    setActiveStep(0);
    if (stepsRef.current) {
      stepsRef.current.scrollTop = 0;
    }
  }, [selectedTutorial]);

  // Scroll to active step when it changes
  useEffect(() => {
    if (!stepsRef.current) return;
    const el = stepsRef.current.querySelector(`[data-step="${activeStep}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeStep]);

  const goStep = useCallback((dir) => {
    if (!selectedTutorial) return;
    const total = selectedTutorial.steps.length;
    setActiveStep((prev) => {
      const next = prev + dir;
      if (next < 0) return 0;
      if (next >= total) return total - 1;
      return next;
    });
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
  const totalSteps = selectedTutorial?.steps?.length || 0;

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
                  {selectedTutorial ? `Paso ${activeStep + 1} de ${totalSteps}` : selectedCategory ? TUTORIAL_CATEGORIES.find(c => c.id === selectedCategory)?.description : "Tutoriales y guías de uso"}
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
              {/* Ilustración — desktop */}
              <div className="hidden sm:flex flex-col w-[280px] shrink-0 border-r border-green-100">
                <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                  {currentIllustration && (
                    <div className="w-full max-w-[240px] aspect-square">
                      <StepIllustration type={currentIllustration} animate={true} className="w-full h-full" />
                    </div>
                  )}
                </div>
                {/* Navegación desktop */}
                <div className="shrink-0 px-4 py-3 bg-white border-t border-green-100 flex items-center justify-between">
                  <button
                    onClick={() => goStep(-1)}
                    disabled={activeStep === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-1">
                    {selectedTutorial.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === activeStep ? "bg-green-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => goStep(1)}
                    disabled={activeStep === totalSteps - 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>

              {/* Ilustración mobile */}
              <div className="sm:hidden shrink-0 px-4 pt-3 pb-2 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
                <div className="w-full h-[120px]">
                  {currentIllustration && (
                    <StepIllustration type={currentIllustration} animate={true} className="w-full h-full" />
                  )}
                </div>
                {/* Navegación mobile */}
                <div className="flex items-center justify-between mt-2 pb-1">
                  <button
                    onClick={() => goStep(-1)}
                    disabled={activeStep === 0}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ←
                  </button>
                  <div className="flex gap-1">
                    {selectedTutorial.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === activeStep ? "bg-green-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => goStep(1)}
                    disabled={activeStep === totalSteps - 1}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div ref={stepsRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
                {selectedTutorial.steps.map((step, i) => (
                  <div
                    key={i}
                    data-step={i}
                    onClick={() => setActiveStep(i)}
                    className={`flex gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                      i === activeStep ? "bg-green-50 border border-green-200 shadow-sm" : "border border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                      i === activeStep ? "bg-green-600 text-white" : i < activeStep ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {i < activeStep ? "✓" : i + 1}
                    </div>
                    <div className={`text-sm pt-0.5 leading-relaxed ${i === activeStep ? "text-gray-900 font-medium" : i < activeStep ? "text-gray-500" : "text-gray-700"}`}>
                      {step.text}
                    </div>
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
