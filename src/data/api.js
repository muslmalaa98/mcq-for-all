const cache = {
  index: null,
  subjects: new Map()
};

export async function loadIndex() {
  if (cache.index) return cache.index;
  const res = await fetch(`${import.meta.env.BASE_URL}data/index.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error("Failed to load index.json");
  cache.index = await res.json();
  return cache.index;
}

export async function loadSubjectJson(subjectPath) {
  if (cache.subjects.has(subjectPath)) return cache.subjects.get(subjectPath);
  const res = await fetch(`${import.meta.env.BASE_URL}data/${subjectPath}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load subject: ${subjectPath}`);
  const json = await res.json();
  cache.subjects.set(subjectPath, json);
  return json;
}

export function getNodeBySlugs(index, { college, stage, term, subject }) {
  const c = index.colleges.find(x => x.slug === college);
  if (!c) return null;
  if (!stage) return c;

  const s = c.stages.find(x => x.slug === stage);
  if (!s) return null;
  if (!term) return { ...s, college: c };

  const t = s.terms.find(x => x.slug === term);
  if (!t) return null;
  if (!subject) return { ...t, stage: s, college: c };

  const sub = t.subjects.find(x => x.slug === subject);
  if (!sub) return null;

  return { ...sub, term: t, stage: s, college: c };
}

export function getBreadcrumb(index, route) {
  const base = import.meta.env.BASE_URL;
  const seg = route.segments;

  const crumbs = [{ label: "MCQ", href: base }];
  if (seg.length === 0) return crumbs;

  const node =
    seg.length === 1 ? getNodeBySlugs(index, { college: seg[0] }) :
    seg.length === 2 ? getNodeBySlugs(index, { college: seg[0], stage: seg[1] }) :
    seg.length === 3 ? getNodeBySlugs(index, { college: seg[0], stage: seg[1], term: seg[2] }) :
    seg.length === 4 ? getNodeBySlugs(index, { college: seg[0], stage: seg[1], term: seg[2], subject: seg[3] }) :
    null;

  if (!node) return crumbs;

  if (node.college) {
    crumbs.push({ label: node.college.title.ar, href: `${base}${node.college.slug}` });
  }
  if (node.stage) {
    crumbs.push({ label: node.stage.title.ar, href: `${base}${node.college.slug}/${node.stage.slug}` });
  }
  if (node.term) {
    crumbs.push({ label: node.term.title.ar, href: `${base}${node.college.slug}/${node.stage.slug}/${node.term.slug}` });
  }
  if (node.slug && node.path) {
    crumbs.push({
      label: node.title.ar,
      href: `${base}${node.college.slug}/${node.stage.slug}/${node.term.slug}/${node.slug}`
    });
  }

  return crumbs;
}
