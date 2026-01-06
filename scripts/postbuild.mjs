import fs from "node:fs/promises";
import path from "node:path";

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function move(from, to) {
  if (!(await exists(from))) return;
  await fs.mkdir(path.dirname(to), { recursive: true });
  try {
    await fs.rename(from, to);
  } catch {
    // fallback copy+delete
    const st = await fs.stat(from);
    if (st.isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      const entries = await fs.readdir(from, { withFileTypes: true });
      for (const e of entries) await move(path.join(from, e.name), path.join(to, e.name));
      await fs.rm(from, { recursive: true, force: true });
    } else {
      await fs.copyFile(from, to);
      await fs.rm(from, { force: true });
    }
  }
}

async function main() {
  const dist = "dist";
  const mcq = path.join(dist, "mcq");

  await fs.mkdir(mcq, { recursive: true });

  // Vite outputs dist/index.html and dist/assets/
  // We want: dist/mcq/index.html and dist/mcq/assets/
  await move(path.join(dist, "assets"), path.join(mcq, "assets"));
  await move(path.join(dist, "index.html"), path.join(mcq, "index.html"));

  // Create a tiny root index that redirects to /mcq/
  const rootIndex = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=/mcq/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mcq for all</title>
</head>
<body style="font-family: system-ui, Segoe UI, Tahoma, Arial; padding: 24px;">
  <p>Redirecting to <strong>/mcq/</strong>…</p>
</body>
</html>
`;
  await fs.writeFile(path.join(dist, "index.html"), rootIndex, "utf8");

  console.log("OK: postbuild arranged dist/ for /mcq deployment.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
