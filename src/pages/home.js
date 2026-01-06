import { el } from "../lib/ui.js";

export function pageHome(index) {
  const base = import.meta.env.BASE_URL;

  const cards = index.colleges.map((c) =>
    el("a", { class: "card card--link", href: `${base}${c.slug}`, "data-link": "1" },
      el("div", { class: "card__title" }, c.title.ar),
      el("div", { class: "card__meta" }, c.title.en)
    )
  );

  const node = el("section", { class: "page" },
    el("div", { class: "page__head" },
      el("h1", { class: "h1" }, "mcq for all"),
      el("p", { class: "muted" }, "اختر الكلية ثم المرحلة ثم الكورس ثم المادة.")
    ),
    el("div", { class: "grid" }, cards)
  );

  return { title: "الرئيسية", node };
}
