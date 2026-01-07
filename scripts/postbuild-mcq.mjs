import { promises as fs } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const mcqDir = path.join(distDir, "mcq");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function move(src, dest) {
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

  // Move everything from dist root into dist/mcq except the mcq folder and _redirects
  const entries = await fs.readdir(distDir, { withFileTypes: true });

  for (const ent of entries) {
    const name = ent.name;
    if (name === "mcq") continue;
    if (name === "_redirects") continue; // keep dist/_redirects from public/_redirects

    const from = path.join(distDir, name);
    const to = path.join(mcqDir, name);
    await move(from, to);
  }

  // DO NOT write dist/_redirects here.
  // Redirect rules should live in public/_redirects only.
  console.log("postbuild: moved build output into dist/mcq (kept dist/_redirects from public/_redirects)");
}

main().catch((e) => {
  console.error("postbuild error:", e);
  process.exit(1);
});
