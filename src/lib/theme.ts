import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Inlined theme bootstrap.
 *
 * This must run before first paint, which rules out a React effect — the
 * browser would paint the light theme and then flash back. It is a synchronous
 * script at the top of <head> that resolves the stored preference, falls back
 * to the OS setting, and stamps the class on <html>.
 *
 * Read from disk at build time rather than inlined as a string so the
 * preference logic lives in one normal, lintable, testable file.
 */
export function themeScript(): string {
  const path = join(process.cwd(), "src", "lib", "theme-script.js");
  return readFileSync(path, "utf8");
}
