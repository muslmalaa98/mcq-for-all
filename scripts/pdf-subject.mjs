import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

function getArg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function safeText(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

async function main() {
  const inPath = getArg("--path");
  if (!inPath) {
    console.error('Usage: npm run pdf:subject -- --path data/.../subject.json');
    process.exit(1);
  }

  const raw = await fs.readFile(inPath, "utf8");
  const json = JSON.parse(raw);

  const outDir = "pdf";
  await fs.mkdir(outDir, { recursive: true });

  const dt = new Date();
  const stamp = dt.toISOString().slice(0, 10);
  const baseName = `${json.meta?.college || "college"}_${json.meta?.stage || "stage"}_${json.meta?.term || "term"}_${json.meta?.subject || "subject"}_${stamp}.pdf`;
  const outPath = path.join(outDir, baseName);

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const stream = (await fs.open(outPath, "w")).createWriteStream();
  doc.pipe(stream);

  // Header
  doc.fontSize(18).text("mcq for all", { align: "left" });
  doc.moveDown(0.25);
  doc.fontSize(12).fillColor("#444").text(`Subject: ${safeText(json.meta?.title?.en || json.meta?.subject)}`, { align: "left" });
  doc.text(`Generated: ${dt.toLocaleString()}`, { align: "left" });
  doc.moveDown(1);
  doc.fillColor("#000");

  const questions = json.questions || [];
  questions.forEach((q, idx) => {
    doc.fontSize(12).text(`Q${idx + 1}. ${safeText(q.question)}`, { align: "left" });
    doc.moveDown(0.25);

    const letters = ["A", "B", "C", "D"];
    (q.options || []).forEach((opt, i) => {
      doc.fontSize(11).text(`${letters[i]}) ${safeText(opt)}`, { align: "left", indent: 12 });
    });

    doc.moveDown(0.75);

    // page break guard
    if (doc.y > 740) doc.addPage();
  });

  doc.end();

  await new Promise((resolve) => stream.on("finish", resolve));
  console.log(`OK: PDF generated -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
