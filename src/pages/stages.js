import { el } from "../lib/ui.js";

export function pageStages(college) {
  const base = import.meta.env.BASE_URL;

  const cards = college.stages.map((s) =>
    el("a", { class: "card card--link", href: `${base}${college.slug}/${s.slug}`, "data-link": "1" },
      el("div", { class: "card__title" }, s.title.ar),
      el("div", { class: "card__meta" }, s.title.en)
    )
  );

  const node = el("section", { class: "page" },
    el("div", { class: "page__head" },
      el("h1", { class: "h1" }, college.title.ar),
      el("p", { class: "muted" }, "اختر المرحلة.")
    ),
    el("div", { class: "grid" }, cards)
  );

  return { title: college.title.ar, node };
}
