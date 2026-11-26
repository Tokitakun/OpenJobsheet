"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";

function getThemeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("openjobsheet_theme") as "light" | "dark" | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ThemeToggle() {
  const theme = React.useSyncExternalStore(subscribe, getThemeSnapshot, () => "light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("openjobsheet_theme", next);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="h-8 w-8 rounded-md flex items-center justify-center border border-line text-ink-secondary hover:text-ink hover:bg-muted transition-colors cursor-pointer"
      title={`Tema: ${theme === "light" ? "Terang" : "Gelap"}`}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
