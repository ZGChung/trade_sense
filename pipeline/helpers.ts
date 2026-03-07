import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const CACHE_DIR = path.resolve(process.cwd(), ".cache");

export function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

export async function writeJson<T>(name: string, value: T): Promise<void> {
  await ensureCacheDir();
  const filePath = path.join(CACHE_DIR, name);
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function readJson<T>(name: string): Promise<T> {
  const filePath = path.join(CACHE_DIR, name);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
