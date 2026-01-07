import { promises as fs } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const mcqDir = path.join(distDir, "mcq");

// ملفات لازم تبقى بجذر dist لأن Cloudflare Pages يقراها من هناك
const KEEP_IN_DIST_ROOT = new Set(["_redirects", "_headers"]);

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function move(src, dest) {
  // تأكد إن مجلد وجهة النقل موجود
  await fs.mkdir(path.dirname(dest), { recursive: true });

  if (await exists(dest)) {
    await fs.rm(dest, { recursive: true, force: true });
  }
  await fs.rename(src, dest);
}

async function main() {
  if (!(await exists(distDir))) {
    console.error("postbuild: dist folder not found. Run vite build first.");
    process.exit(1);
  }

  await fs.mkdir(mcqDir, { recursive: true });

  // انقل كل شي من dist إلى dist/mcq ما عدا:
  // - مجلد mcq نفسه
  // - _redirects / _headers
  const entries = await fs.readdir(distDir, { withFileTypes: true });

  for (const ent of entries) {
    const name = ent.name;
    if (name === "mcq") continue;
    if (KEEP_IN_DIST_ROOT.has(name)) continue;

    const from = path.join(distDir, name);
    const to = path.join(mcqDir, name);
    await move(from, to);
  }

  // إذا ماكو _redirects (مثلاً ناسي تحطه بـ public)، نولده هنا كـ fallback
  const redirectsPath = path.join(distDir, "_redirects");
  if (!(await exists(redirectsPath))) {
    const redirects = [
      "/      /mcq/            302",
      "/mcq   /mcq/            301",
      "/mcq/* /mcq/index.html  200",
      "",
    ].join("\n");
    await fs.writeFile(redirectsPath, redirects, "utf8");
    console.log("postbuild: created dist/_redirects (fallback)");
  }

  console.log("postbuild: moved build output into dist/mcq (kept _redirects in dist root)");
}

main().catch((e) => {
  console.error("postbuild error:", e);
  process.exit(1);
});
