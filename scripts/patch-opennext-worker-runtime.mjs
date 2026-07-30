import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const serverRoot = join(process.cwd(), ".open-next", "server-functions", "default");
const manifestFile = join(serverRoot, ".next", "server", "middleware-manifest.json");
const handlerFile = join(serverRoot, "handler.mjs");

const emptyMiddlewareManifest = {
  version: 3,
  middleware: {},
  functions: {},
  sortedMiddleware: [],
};

assertPatchableMiddlewareManifest();
patchHandler();

console.log("OpenNext Worker runtime patch complete: server middleware manifest require is disabled.");

function assertPatchableMiddlewareManifest() {
  if (!existsSync(manifestFile)) {
    throw new Error(`Missing middleware manifest: ${manifestFile}`);
  }

  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  if (isEmptyMiddlewareManifest(manifest) || isEdgeMiddlewareManifest(manifest)) {
    return;
  }

  throw new Error("Refusing to patch unsupported middleware manifest for Cloudflare Worker runtime.");
}

function isEmptyMiddlewareManifest(manifest) {
  return JSON.stringify(manifest) === JSON.stringify(emptyMiddlewareManifest);
}

function isEdgeMiddlewareManifest(manifest) {
  return Boolean(
    manifest &&
      manifest.version === 3 &&
      manifest.middleware &&
      typeof manifest.middleware === "object" &&
      Object.keys(manifest.middleware).length > 0 &&
      manifest.functions &&
      typeof manifest.functions === "object" &&
      Object.keys(manifest.functions).length === 0 &&
      Array.isArray(manifest.sortedMiddleware),
  );
}

function patchHandler() {
  if (!existsSync(handlerFile)) {
    throw new Error(`Missing OpenNext handler bundle: ${handlerFile}`);
  }

  const source = readFileSync(handlerFile, "utf8");
  const target = "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}";
  const replacement = "getMiddlewareManifest(){return null}";
  const count = source.split(target).length - 1;

  if (count === 0 && source.includes(replacement)) {
    return;
  }

  if (count !== 1) {
    throw new Error(`Expected one middleware manifest require in OpenNext handler, found ${count}.`);
  }

  writeFileSync(handlerFile, source.replace(target, replacement));
}
