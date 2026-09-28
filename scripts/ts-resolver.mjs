/**
 * A minimal ESM resolver that teaches bare Node the two conventions this
 * codebase uses and Next understands natively:
 *
 *   1. the `@/*` path alias from tsconfig.json
 *   2. extensionless imports, including directory `index` files
 *
 * Without it, scripts under `scripts/` can't import from `src/lib` and every
 * piece of shared logic would have to be duplicated.
 */
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs", ".json"];

function resolveFile(target) {
  if (existsSync(target) && statSync(target).isFile()) return target;
  for (const ext of EXTENSIONS) {
    if (existsSync(target + ext)) return target + ext;
  }
  for (const ext of EXTENSIONS) {
    const indexFile = path.join(target, `index${ext}`);
    if (existsSync(indexFile)) return indexFile;
  }
  return null;
}

export function resolve(specifier, context, next) {
  let candidate = null;

  if (specifier.startsWith("@/")) {
    candidate = resolveFile(path.join(SRC, specifier.slice(2)));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    if (context.parentURL?.startsWith("file:")) {
      const parent = fileURLToPath(context.parentURL);
      candidate = resolveFile(path.resolve(path.dirname(parent), specifier));
    }
  }

  if (candidate) return next(pathToFileURL(candidate).href, context);
  return next(specifier, context);
}
