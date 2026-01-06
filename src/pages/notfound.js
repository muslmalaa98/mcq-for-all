import { el } from "../lib/ui.js";

export function pageNotFound() {
  const base = import.meta.env.BASE_URL;
  const node = el("section", { class: "page" },
    el("div", { class: "page__head" },
      el("h1", { class: "h1" }, "غير موجود"),
      el("p", { class: "muted" }, "المسار غير صحيح.")
    ),
    el("a", { class: "btn btn--primary", href: base, "data-link": "1" }, "العودة للرئيسية")
  );
  return { title: "404", node };
}
