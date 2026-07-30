import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

const LOCAL_ROOT =
  process.env.STORAGE_LOCAL_PATH ??
  path.join(process.cwd(), "storage", "uploads");

export interface StoredUpload {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

function buildKey(companyId: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${companyId}/${Date.now()}-${randomBytes(4).toString("hex")}-${safe}`;
}

export async function storeUpload(
  companyId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<StoredUpload> {
  const key = buildKey(companyId, fileName);
  const fullPath = path.join(LOCAL_ROOT, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);

  const record = await prisma.storedFile.create({
    data: {
      companyId,
      key,
      fileName,
      mimeType,
      sizeBytes: buffer.length,
    },
  });

  return {
    key: record.key,
    fileName: record.fileName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
  };
}

export async function readUpload(key: string): Promise<Buffer | null> {
  if (!key) return null;
  try {
    return await fs.readFile(path.join(LOCAL_ROOT, key));
  } catch {
    return null;
  }
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}
