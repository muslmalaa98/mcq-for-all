import path from "node:path";
import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { listFilesRecursive } from "./_utils.mjs";

const CONTENT_DIR = "content";
const REQUIRED = ["question", "optionA", "optionB", "optionC", "optionD", "answer"];

function validateRow(row, rowIndex, file, errors) {
  for (const col of REQUIRED) {
    if (!row[col] || String(row[col]).trim() === "") {
      errors.push(`${file}: row ${rowIndex + 1} missing "${col}"`);
    }
  }
  const ans = String(row.answer || "").trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(ans)) {
    errors.push(`${file}: row ${rowIndex + 1} invalid answer "${row.answer}" (must be A|B|C|D)`);
  }
}

function validateHeaders(headers, file, errors) {
  for (const c of REQUIRED) {
    if (!headers.includes(c)) errors.push(`${file}: missing column "${c}"`);
  }
}

async function main() {
  const csvFiles = await listFilesRecursive(CONTENT_DIR, ".csv");
  if (csvFiles.length === 0) {
    console.log("No CSV files found under content/. Nothing to validate.");
    return;
  }

  const errors = [];

  for (const file of csvFiles) {
    const rel = file.replaceAll("\\", "/");
    const parts = rel.split("/");
    // content/{college}/{stage}/{term}/{subject}.csv
    if (parts.length < 5) {
      errors.push(`${file}: invalid path. Expected content/{college}/{stage}/{term}/{subject}.csv`);
      continue;
    }

    const raw = await fs.readFile(file, "utf8");
    const rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true
    });

    const headers = rows.length ? Object.keys(rows[0]) : [];
    validateHeaders(headers, file, errors);

    rows.forEach((row, i) => validateRow(row, i, file, errors));
  }

  if (errors.length) {
    console.error("Validation failed:\n");
    errors.forEach(e => console.error(" - " + e));
    process.exit(1);
  }

  console.log(`OK: validated ${csvFiles.length} file(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
