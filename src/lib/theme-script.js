/**
 * Theme bootstrap — runs before first paint.
 *
 * Kept as a standalone file (not a template string) so it is a normal,
 * lintable script. Injected by `themeScript()` in `src/lib/theme.ts`.
 */
(function () {
  try {
    var stored = localStorage.getItem("wn.theme.v1");
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    /* Private mode or storage disabled — the light theme is a fine fallback. */
  }
})();
