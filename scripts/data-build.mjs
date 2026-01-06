import path from "node:path";
import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";

import { ensureDir, rmDir, readJson, writeJson, titleFromSlug, listFilesRecursive, copyDir } from "./_utils.mjs";

const CONTENT_DIR = "content";
const OUT_DIR = "data";
const PUBLIC_DATA_DIR = path.join("public", "mcq", "data");
const LABELS_FILE = path.join(CONTENT_DIR, "labels.ar.json");

const REQUIRED = ["question", "optionA", "optionB", "optionC", "optionD", "answer"];
const OPTIONAL_KNOWN = ["explanation", "reference", "difficulty", "tags", "note"];

function answerIndex(letter) {
  const m = { A: 0, B: 1, C: 2, D: 3 };
  return m[String(letter || "").trim().toUpperCase()] ?? -1;
}

function normalizeTags(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function getArabicTitle(labels, kind, key, fallbackEn) {
  const fromFile =
    (kind === "college" && labels?.colleges?.[key]) ||
    (kind === "term" && labels?.terms?.[key]) ||
    (kind === "subject" && labels?.subjects?.[key]) ||
    null;

  return fromFile && String(fromFile).trim() ? String(fromFile).trim() : fallbackEn;
}

function buildIndexSkeleton() {
  return { version: 1, generatedAt: new Date().toISOString(), colleges: [] };
}

function upsertCollege(index, collegeSlug, titles) {
  let c = index.colleges.find(x => x.slug === collegeSlug);
  if (!c) {
    c = { slug: collegeSlug, title: titles, stages: [] };
    index.colleges.push(c);
  }
  return c;
}

function upsertStage(college, stageSlug, titles) {
  let s = college.stages.find(x => x.slug === stageSlug);
  if (!s) {
    s = { slug: stageSlug, title: titles, terms: [] };
    college.stages.push(s);
  }
  return s;
}

function upsertTerm(stage, termSlug, titles) {
  let t = stage.terms.find(x => x.slug === termSlug);
  if (!t) {
    t = { slug: termSlug, title: titles, subjects: [] };
    stage.terms.push(t);
  }
  return t;
}

function sortIndex(index) {
  index.colleges.sort((a, b) => a.slug.localeCompare(b.slug));
  for (const c of index.colleges) {
    c.stages.sort((a, b) => a.slug.localeCompare(b.slug));
    for (const s of c.stages) {
      s.terms.sort((a, b) => a.slug.localeCompare(b.slug));
      for (const t of s.terms) {
        t.subjects.sort((a, b) => a.slug.localeCompare(b.slug));
      }
    }
  }
}

async function main() {
  // 1) validate first (quick)
  // (نفس منطق validate لكن داخل build لضمان عدم توليد بيانات خاطئة)
  const csvFiles = await listFilesRecursive(CONTENT_DIR, ".csv");
  if (csvFiles.length === 0) {
    console.log("No CSV files found under content/. Add files then run again.");
    return;
  }

  const labels = await readJson(LABELS_FILE, { colleges: {}, terms: {}, subjects: {} });

  const errors = [];
  await rmDir(OUT_DIR);
  await ensureDir(OUT_DIR);

  const index = buildIndexSkeleton();

  for (const file of csvFiles) {
    const rel = file.replaceAll("\\", "/");
    const parts = rel.split("/");
    // content/{college}/{stage}/{term}/{subject}.csv
    if (parts.length < 5) {
      errors.push(`${file}: invalid path. Expected content/{college}/{stage}/{term}/{subject}.csv`);
      continue;
    }

    const collegeSlug = parts[1];
    const stageSlug = parts[2];
    const termSlug = parts[3];
    const subjectSlug = path.basename(parts[4], ".csv");

    const raw = await fs.readFile(file, "utf8");
    const rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true
    });

    const headers = rows.length ? Object.keys(rows[0]) : [];

    for (const c of REQUIRED) if (!headers.includes(c)) errors.push(`${file}: missing column "${c}"`);
    if (rows.length === 0) errors.push(`${file}: empty file (no rows)`);

    const questions = [];
    rows.forEach((row, i) => {
      for (const c of REQUIRED) {
        if (!row[c] || String(row[c]).trim() === "") errors.push(`${file}: row ${i + 1} missing "${c}"`);
      }
      const ai = answerIndex(row.answer);
      if (ai < 0) errors.push(`${file}: row ${i + 1} invalid answer "${row.answer}" (must be A|B|C|D)`);

      const q = {
        id: i + 1,
        question: String(row.question ?? ""),
        options: [
          String(row.optionA ?? ""),
          String(row.optionB ?? ""),
          String(row.optionC ?? ""),
          String(row.optionD ?? "")
        ],
        answerIndex: ai
      };

      // optional known
      if (row.explanation) q.explanation = String(row.explanation);
      if (row.reference) q.reference = String(row.reference);
      if (row.difficulty) q.difficulty = String(row.difficulty);
      if (row.tags) q.tags = normalizeTags(row.tags);
      if (row.note) q.note = String(row.note);

      // extensible: any extra columns preserved
      const extra = {};
      for (const [k, v] of Object.entries(row)) {
        if (REQUIRED.includes(k) || OPTIONAL_KNOWN.includes(k)) continue;
        if (v == null) continue;
        const vv = String(v).trim();
        if (vv === "") continue;
        extra[k] = vv;
      }
      if (Object.keys(extra).length) q.extra = extra;

      questions.push(q);
    });

    // write subject json
    const subjectRel = path.join(collegeSlug, stageSlug, termSlug, `${subjectSlug}.json`);
    const outFile = path.join(OUT_DIR, subjectRel);

    const subjectKey = `${collegeSlug}/${stageSlug}/${termSlug}/${subjectSlug}`;
    const titleEn = titleFromSlug(subjectSlug);
    const titleAr = getArabicTitle(labels, "subject", subjectKey, titleEn);

    const payload = {
      meta: {
        version: 1,
        generatedAt: new Date().toISOString(),
        college: collegeSlug,
        stage: stageSlug,
        term: termSlug,
        subject: subjectSlug,
        title: { ar: titleAr, en: titleEn },
        count: questions.length,
        optionalColumnsSeen: headers.filter(h => !REQUIRED.includes(h))
      },
      questions
    };

    await writeJson(outFile, payload);

    // build index nodes
    const collegeTitleEn = titleFromSlug(collegeSlug);
    const collegeTitleAr = getArabicTitle(labels, "college", collegeSlug, collegeTitleEn);

    const stageTitleEn = titleFromSlug(stageSlug);
    const stageTitleAr = `المرحلة ${String(stageSlug).replace("stage-", "") || stageTitleEn}`;

    const termTitleEn = titleFromSlug(termSlug);
    const termTitleAr = getArabicTitle(labels, "term", termSlug, termTitleEn);

    const c = upsertCollege(index, collegeSlug, { ar: collegeTitleAr, en: collegeTitleEn });
    const s = upsertStage(c, stageSlug, { ar: stageTitleAr, en: stageTitleEn });
    const t = upsertTerm(s, termSlug, { ar: termTitleAr, en: termTitleEn });

    t.subjects.push({
      slug: subjectSlug,
      title: { ar: titleAr, en: titleEn },
      count: questions.length,
      path: subjectRel.replaceAll("\\", "/")
    });
  }

  if (errors.length) {
    console.error("Build failed (fix CSV issues first):\n");
    errors.forEach(e => console.error(" - " + e));
    process.exit(1);
  }

  sortIndex(index);
  await writeJson(path.join(OUT_DIR, "index.json"), index);

  // sync for the frontend (served under /mcq/data)
  await rmDir(PUBLIC_DATA_DIR);
  await copyDir(OUT_DIR, PUBLIC_DATA_DIR);

  console.log(`OK: built ${csvFiles.length} subject file(s).`);
  console.log(`- JSON: ${OUT_DIR}/...`);
  console.log(`- Index: ${OUT_DIR}/index.json`);
  console.log(`- Public sync: ${PUBLIC_DATA_DIR}/...`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
