import { el } from "../lib/ui.js";

export function pageSubjects(termNode) {
  const base = import.meta.env.BASE_URL;
  const { college, stage } = termNode;

  const search = el("input", {
    class: "input",
    type: "search",
    placeholder: "بحث عن مادة…",
    value: ""
  });

  const list = el("div", { class: "list" });

  const render = () => {
    const q = (search.value || "").trim();
    const items = termNode.subjects
      .filter(s => !q || s.title.ar.includes(q) || s.title.en.toLowerCase().includes(q.toLowerCase()));

    list.innerHTML = "";
    items.forEach((s) => {
      list.append(
        el("a", {
          class: "card card--link card--row",
          href: `${base}${college.slug}/${stage.slug}/${termNode.slug}/${s.slug}`,
          "data-link": "1"
        },
          el("div", { class: "card__rowMain" },
            el("div", { class: "card__title" }, s.title.ar),
            el("div", { class: "card__meta" }, s.title.en)
          ),
          el("div", { class: "pill" }, `${s.count} سؤال`)
        )
      );
    });

    if (items.length === 0) {
      list.append(el("div", { class: "empty" }, "لا توجد نتائج."));
    }
  };

  search.addEventListener("input", render);

  const node = el("section", { class: "page" },
    el("div", { class: "page__head" },
      el("h1", { class: "h1" }, `${college.title.ar} — ${stage.title.ar} — ${termNode.title.ar}`),
      el("div", { class: "page__tools" }, search)
    ),
    list
  );

  render();
  return { title: termNode.title.ar, node };
}
