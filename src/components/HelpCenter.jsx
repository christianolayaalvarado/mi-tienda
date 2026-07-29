"use client";

import { useState } from "react";
import { TUTORIAL_CATEGORIES, TUTORIALS } from "@/lib/helpTutorials";

export default function HelpCenter({ open, onClose, initialCategory }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [selectedTutorial, setSelectedTutorial] = useState(null);

  if (!open) return null;

  const handleCategory = (catId) => {
    setSelectedCategory(catId);
    setSelectedTutorial(null);
  };

  const handleTutorial = (tutorial) => {
    setSelectedTutorial(tutorial);
  };

  const handleBack = () => {
    if (selectedTutorial) {
      setSelectedTutorial(null);
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-[fadeInScale_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(selectedCategory || selectedTutorial) && (
                <button onClick={handleBack} className="text-white/80 hover:text-white text-lg">
                  ←
                </button>
              )}
              <div>
                <h2 className="text-lg font-bold">
                  {selectedTutorial ? selectedTutorial.title : selectedCategory ? TUTORIAL_CATEGORIES.find(c => c.id === selectedCategory)?.label : "Centro de Ayuda"}
                </h2>
                <p className="text-white/70 text-xs">
                  {selectedTutorial ? "Guía paso a paso" : selectedCategory ? TUTORIAL_CATEGORIES.find(c => c.id === selectedCategory)?.description : "Tutoriales y guías de uso"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Categorías */}
          {!selectedCategory && !selectedTutorial && (
            <div className="p-4 grid grid-cols-2 gap-3">
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
            <div className="p-4 space-y-2">
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

          {/* Tutorial detallado con pasos */}
          {selectedTutorial && (
            <div className="p-5">
              {/* Pasos */}
              <div className="space-y-3 mb-4">
                {selectedTutorial.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="text-sm text-gray-700 pt-1 leading-relaxed">{step.text}</div>
                  </div>
                ))}
              </div>

              {/* Tip */}
              {selectedTutorial.tip && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div className="text-xs text-amber-700 leading-relaxed">{selectedTutorial.tip}</div>
                  </div>
                </div>
              )}

              {/* Botón de acción */}
              <button
                onClick={() => handleAction(selectedTutorial.url)}
                className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                {selectedTutorial.urlLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
