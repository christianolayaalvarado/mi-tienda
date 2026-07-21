// components/navbar/SearchBox.jsx
"use client";

import { useEffect, useState, useRef } from "react";

const POPULAR_SEARCHES = ["laptop", "celular", "zapatillas", "mochila", "reloj"];

export default function SearchBox({ initial = "", onSearch }) {
  const [value, setValue] = useState(initial);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const lastExternalRef = useRef(initial);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      setRecentSearches(Array.isArray(stored) ? stored.slice(0, 5) : []);
    } catch { setRecentSearches([]); }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => onSearch?.(value || ""), 500);
    return () => clearTimeout(handler);
  }, [value, onSearch]);

  useEffect(() => {
    if (initial !== lastExternalRef.current) {
      lastExternalRef.current = initial;
      setValue(initial);
    }
  }, [initial]);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/products?search=${encodeURIComponent(value)}&limit=5`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const products = data?.products || [];
        setSuggestions(products.slice(0, 5).map(p => ({
          title: p.title,
          category: p.category?.name || "",
          url: `/product/${p.id}`,
        })));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveRecentSearch = (term) => {
    if (!term) return;
    try {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveRecentSearch(value);
    setShowDropdown(false);
    onSearch?.(value || "");
  };

  const handleSuggestionClick = (term) => {
    setValue(term);
    saveRecentSearch(term);
    setShowDropdown(false);
    onSearch?.(term);
  };

  const hasDropdown = showDropdown && (suggestions.length > 0 || recentSearches.length > 0 || value.length >= 2);

  return (
    <div className="w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
          aria-autocomplete="list"
          aria-expanded={hasDropdown}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 sm:pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />
        {hasDropdown && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {suggestions.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sugerencias</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(s.title)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="flex-1 truncate">{s.title}</span>
                    {s.category && <span className="text-xs text-gray-400 shrink-0">{s.category}</span>}
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && suggestions.length === 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recientes</p>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(term)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="flex-1 truncate">{term}</span>
                  </button>
                ))}
              </div>
            )}
            {suggestions.length === 0 && recentSearches.length === 0 && value.length >= 2 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Populares</p>
                {POPULAR_SEARCHES.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(term)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    <span className="flex-1 truncate">{term}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
