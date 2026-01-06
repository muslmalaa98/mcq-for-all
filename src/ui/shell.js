import { createRouter } from "../lib/router.js";
import { initTheme, toggleTheme } from "./theme.js";
import { loadIndex, getNodeBySlugs, getBreadcrumb } from "../data/api.js";

import { pageHome } from "../pages/home.js";
import { pageStages } from "../pages/stages.js";
import { pageTerms } from "../pages/terms.js";
import { pageSubjects } from "../pages/subjects.js";
import { pageReader } from "../pages/reader.js";
import { pageNotFound } from "../pages/notfound.js";

import { el, mount, setText } from "../lib/ui.js";

export function bootApp(root) {
  initTheme();

  const BASE = import.meta.env.BASE_URL; // expected: "/mcq/"

  const app = el("div", { class: "app" });

  // Header
  const header = el(
    "header",
    { class: "topbar" },

    // Brand (go home)
    el(
      "a",
      {
        class: "brand",
        href: BASE, // "/mcq/"
        "data-link": "1",
        "aria-label": "MCQ Home",
      },
      // IMPORTANT: root icon to avoid /mcq route issues in dev
      el("img", { class: "brand__icon", src: "/app-icon.svg", alt: "" }),
      el("span", { class: "brand__text" }, "MCQ")
    ),

    el("div", { class: "topbar__spacer" }),

    // Theme toggle
    el(
      "button",
      {
        class: "btn btn--ghost",
        type: "button",
        id: "themeToggle",
        "aria-label": "تبديل الثيم",
      },
      "🌓"
    )
  );

  const breadcrumb = el("nav", { class: "crumb", "aria-label": "Breadcrumb" });
  const hint = el("div", { class: "hint-landscape", role: "status" }, "أفضل تجربة أفقي");
  const main = el("main", { class: "main" });

  app.append(header, breadcrumb, hint, main);
  mount(root, app);

  // Theme toggle handler
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);

  // SPA link interception
  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a[data-link]");
    if (!a) return;
    if (a.target === "_blank") return;

    e.preventDefault();
    router.navigate(a.getAttribute("href"));
  });

  // Router
  const router = createRouter({
    base: BASE,
    onRoute: async (route) => {
      try {
        const index = await loadIndex();
        const view = await resolveView(route, index);

        // breadcrumb
        breadcrumb.innerHTML = "";
        const crumbs = getBreadcrumb(index, route);
        crumbs.forEach((c, i) => {
          const link = el("a", { href: c.href, "data-link": "1", class: "crumb__link" }, c.label);
          breadcrumb.append(link);
          if (i < crumbs.length - 1) breadcrumb.append(el("span", { class: "crumb__sep" }, "›"));
        });

        // mount view
        main.innerHTML = "";
        main.append(view.node);

        // title
        setText(document.querySelector("title"), view.title ? `mcq for all — ${view.title}` : "mcq for all");
      } catch (err) {
        // show friendly error instead of blank screen
        breadcrumb.innerHTML = "";
        main.innerHTML = "";

        main.append(
          el(
            "div",
            { class: "card" },
            el("div", { class: "card__title" }, "حدث خطأ أثناء تحميل البيانات"),
            el("p", { class: "muted ltr" }, String(err?.message || err)),
            el(
              "a",
              { class: "btn", href: BASE, "data-link": "1" },
              "العودة للرئيسية"
            )
          )
        );

        setText(document.querySelector("title"), "mcq for all — خطأ");
      }
    },
  });

  router.start();
}

async function resolveView(route, index) {
  const seg = route.segments; // after /mcq

  if (seg.length === 0) return pageHome(index);

  if (seg.length === 1) {
    const college = getNodeBySlugs(index, { college: seg[0] });
    if (!college) return pageNotFound();
    return pageStages(college);
  }

  if (seg.length === 2) {
    const node = getNodeBySlugs(index, { college: seg[0], stage: seg[1] });
    if (!node) return pageNotFound();
    return pageTerms(node);
  }

  if (seg.length === 3) {
    const node = getNodeBySlugs(index, { college: seg[0], stage: seg[1], term: seg[2] });
    if (!node) return pageNotFound();
    return pageSubjects(node);
  }

  if (seg.length === 4) {
    const node = getNodeBySlugs(index, {
      college: seg[0],
      stage: seg[1],
      term: seg[2],
      subject: seg[3],
    });
    if (!node) return pageNotFound();
    return pageReader(node);
  }

  return pageNotFound();
}
