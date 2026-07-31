import "server-only";

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type LocalObjectMetadata = {
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
  };
  contentType?: string;
  contentDisposition?: string;
  customMetadata?: Record<string, string>;
};

export type LocalObject = {
  body: ReadableStream<Uint8Array>;
  size: number;
  httpMetadata: {
    contentType?: string;
  };
};

export async function putLocalObject(
  key: string,
  value: ArrayBuffer,
  metadata: LocalObjectMetadata = {},
): Promise<void> {
  const filePath = localObjectPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(value));
  await writeFile(`${filePath}.json`, JSON.stringify(metadata, null, 2), "utf8");
}

export async function getLocalObject(key: string): Promise<LocalObject | null> {
  const filePath = localObjectPath(key);
  let bytes: Buffer;
  let info;
  try {
    [bytes, info] = await Promise.all([readFile(filePath), stat(filePath)]);
  } catch {
    return null;
  }

  const metadata = await readLocalObjectMetadata(filePath);
  return {
    body: new Response(new Uint8Array(bytes)).body as ReadableStream<Uint8Array>,
    size: info.size,
    httpMetadata: {
      contentType: metadata.httpMetadata?.contentType || metadata.contentType,
    },
  };
}

function localObjectPath(key: string): string {
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid local object key.");
  }

  const root = process.env.PRICEAI_STORAGE_DIR?.trim() ||
    path.join(process.cwd(), ".data", "storage");
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(resolvedRoot, normalized);
  if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Invalid local object key.");
  }
  return resolvedFile;
}

async function readLocalObjectMetadata(filePath: string): Promise<LocalObjectMetadata> {
  try {
    const text = await readFile(`${filePath}.json`, "utf8");
    const parsed = JSON.parse(text) as LocalObjectMetadata;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
