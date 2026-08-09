"use client";

import { useState, useEffect, useCallback } from "react";

const SEEN_KEY = "modal_flags_seen";

function getSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markSeen(key) {
  const seen = getSeen();
  if (!seen.includes(key)) {
    seen.push(key);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
}

export function useModalFlags(isLoggedIn) {
  const [flags, setFlags] = useState([]);
  const [currentModal, setCurrentModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/modal-flags?loggedIn=${isLoggedIn ? "true" : "false"}`);
        const data = await res.json();
        if (!cancelled) {
          const seen = getSeen();
          const unseen = (data.flags || []).filter((f) => !seen.includes(f.key));
          setFlags(unseen);
        }
      } catch {
        if (!cancelled) setFlags([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const dismiss = useCallback((key) => {
    markSeen(key);
    setFlags((prev) => prev.filter((f) => f.key !== key));
    setCurrentModal(null);
  }, []);

  const dismissAll = useCallback(() => {
    flags.forEach((f) => markSeen(f.key));
    setFlags([]);
    setCurrentModal(null);
  }, [flags]);

  const showNext = useCallback(() => {
    if (flags.length > 0) {
      setCurrentModal(flags[0]);
    }
  }, [flags]);

  useEffect(() => {
    if (!loading && flags.length > 0 && !currentModal) {
      const timer = setTimeout(() => setCurrentModal(flags[0]), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, flags, currentModal]);

  return { flags, currentModal, loading, dismiss, dismissAll, showNext };
}
