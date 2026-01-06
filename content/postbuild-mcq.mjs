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
  // overwrite if exists
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

  // Move everything from dist root into dist/mcq EXCEPT:
  // - "mcq" folder itself
  // - "_redirects" (we will generate at dist root)
  const entries = await fs.readdir(distDir, { withFileTypes: true });

  for (const ent of entries) {
    const name = ent.name;
    if (name === "mcq") continue;
    if (name === "_redirects") continue;

    const from = path.join(distDir, name);
    const to = path.join(mcqDir, name);

    await move(from, to);
  }

  // Create Cloudflare Pages SPA redirects at dist root
  // So any deep-link under /mcq/* loads /mcq/index.html
  const redirects = [
    "/mcq /mcq/index.html 200",
    "/mcq/* /mcq/index.html 200",
    "",
  ].join("\n");

  await fs.writeFile(path.join(distDir, "_redirects"), redirects, "utf8");

  console.log("postbuild: moved build output into dist/mcq and generated dist/_redirects");
}

main().catch((e) => {
  console.error("postbuild error:", e);
  process.exit(1);
});
