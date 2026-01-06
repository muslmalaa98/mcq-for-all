import chokidar from "chokidar";
import { spawn } from "node:child_process";

function runBuild() {
  const p = spawn(process.execPath, ["scripts/data-build.mjs"], { stdio: "inherit" });
  p.on("exit", (code) => {
    if (code !== 0) console.log(`data:build exited with code ${code}`);
  });
}

console.log("Watching content/ for changes…");
runBuild();

const watcher = chokidar.watch(["content/**/*.csv", "content/labels.ar.json"], {
  ignoreInitial: true
});

let t = null;
watcher.on("all", () => {
  clearTimeout(t);
  t = setTimeout(runBuild, 250);
});
