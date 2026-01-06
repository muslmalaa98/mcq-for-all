import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function rmDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

export async function readJson(file, fallback = null) {
  try {
    const s = await fs.readFile(file, "utf8");
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export async function writeJson(file, obj) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

export function titleFromSlug(slug) {
  return String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function listFilesRecursive(dir, ext) {
  const out = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (!ext || p.toLowerCase().endsWith(ext)) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

export async function copyDir(src, dst) {
  await ensureDir(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}
