"use client";
// src/utils/authFlags.js
export const LOGOUT_GUARD_MS = 15000;

export const setLogoutInProgress = (v) => {
  try {
    if (typeof window !== "undefined") window.__auth_logout_in_progress = !!v;
  } catch { }
};

export const isLogoutInProgress = () =>
  !!(typeof window !== "undefined" && window.__auth_logout_in_progress);

export const markJustLoggedOut = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth:justLoggedOut", String(Date.now()));
    }
  } catch { }
};

export const isRecentLogout = () => {
  try {
    if (typeof window === "undefined") return false;
    const ts = Number(localStorage.getItem("auth:justLoggedOut"));
    return ts > 0 && Date.now() - ts < LOGOUT_GUARD_MS;
  } catch {
    return false;
  }
};

export const clearLogoutGuard = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth:justLoggedOut");
    }
  } catch { }
  setLogoutInProgress(false);
};
