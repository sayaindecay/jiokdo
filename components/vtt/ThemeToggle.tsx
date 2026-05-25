"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "jiokdo-theme";

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  if (theme === "dark") el.setAttribute("data-theme", "dark");
  else el.removeAttribute("data-theme");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    const initial: Theme = stored
      ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
    >
      {theme === "dark" ? "☾" : "✶"}
    </button>
  );
}

/**
 * SSR/CSR 차이로 인한 플래시 방지: localStorage / prefers-color-scheme 을
 * 페인트 전에 읽어서 html data-theme 을 미리 세팅.
 */
export function ThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{
          var k='${STORAGE_KEY}';
          var v=localStorage.getItem(k);
          if(!v){v=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
          if(v==='dark'){document.documentElement.setAttribute('data-theme','dark');}
        }catch(e){}})();`,
      }}
    />
  );
}
