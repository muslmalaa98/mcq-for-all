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
  // remove destination if exists (safe)
  if (await exists(dest)) {
    await fs.rm(dest, { recursive: true, force: true });
  }
  await fs.rename(src, dest);
}

async function main() {
  // ensure dist exists
  if (!(await exists(distDir))) {
    console.error("postbuild-mcq: dist folder not found. Run vite build first.");
    process.exit(1);
  }

  // ensure dist/mcq exists
  await fs.mkdir(mcqDir, { recursive: true });

  // Move everything from dist root into dist/mcq
  // EXCEPT:
  // - "mcq" folder itself (destination)
  // - "_redirects" (must stay at dist/_redirects for Cloudflare Pages)
  const entries = await fs.readdir(distDir, { withFileTypes: true });

  for (const ent of entries) {
    const name = ent.name;

    if (name === "mcq") continue;
    if (name === "_redirects") continue;

    const from = path.join(distDir, name);
    const to = path.join(mcqDir, name);

    await move(from, to);
  }

  console.log("postbuild-mcq: moved build output into dist/mcq (kept dist/_redirects intact)");
}

main().catch((e) => {
  console.error("postbuild-mcq error:", e);
  process.exit(1);
});
