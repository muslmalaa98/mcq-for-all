import { el } from "../lib/ui.js";

export function pageTerms(stageNode) {
  const base = import.meta.env.BASE_URL;
  const { college } = stageNode;

  const cards = stageNode.terms.map((t) =>
    el("a", { class: "card card--link", href: `${base}${college.slug}/${stageNode.slug}/${t.slug}`, "data-link": "1" },
      el("div", { class: "card__title" }, t.title.ar),
      el("div", { class: "card__meta" }, t.title.en)
    )
  );

  const node = el("section", { class: "page" },
    el("div", { class: "page__head" },
      el("h1", { class: "h1" }, `${college.title.ar} — ${stageNode.title.ar}`),
      el("p", { class: "muted" }, "اختر الكورس.")
    ),
    el("div", { class: "grid" }, cards)
  );

  return { title: stageNode.title.ar, node };
}
