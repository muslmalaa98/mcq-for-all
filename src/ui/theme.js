import { lsGet, lsSet } from "../lib/storage.js";

const KEY = "mcq-theme"; // "light" | "dark"

export function getPreferredTheme() {
  const saved = lsGet(KEY);
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", theme === "dark");
  root.dataset.theme = theme;
  lsSet(KEY, theme);
}

export function initTheme() {
  applyTheme(getPreferredTheme());
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
}
