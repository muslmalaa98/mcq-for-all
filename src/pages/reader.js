import { el, clamp } from "../lib/ui.js";
import { formatScientific } from "../lib/safe-format.js";
import { lsGetInt, lsSet } from "../lib/storage.js";
import { loadSubjectJson } from "../data/api.js";

function keyFor(node) {
  return `mcq-last:${node.college.slug}/${node.stage.slug}/${node.term.slug}/${node.slug}`;
}

export async function pageReader(subjectNode) {
  const node = el("section", { class: "page" }, el("div", { class: "loading" }, "جارِ التحميل…"));

  const data = await loadSubjectJson(subjectNode.path);
  const total = data.questions.length;

  let index = clamp(lsGetInt(keyFor(subjectNode), 0), 0, Math.max(0, total - 1));
  let answered = false;
  let selectedIndex = -1;

  const title = el("h1", { class: "h1" }, subjectNode.title.ar);
  const subTitle = el("p", { class: "muted" }, subjectNode.title.en);

  const progressText = el("div", { class: "progress__text" }, "");
  const progressBar = el("div", { class: "progress__bar" }, el("div", { class: "progress__fill" }));

  const qBox = el("div", { class: "mcqBox ltr" });
  const optionsBox = el("div", { class: "options ltr" });

  const explainBox = el("div", { class: "explain", hidden: "1" });

  const jumpInput = el("input", { class: "input input--small ltr", type: "number", min: "1", max: String(total), value: String(index + 1) });
  const jumpBtn = el("button", { class: "btn btn--subtle", type: "button" }, "اذهب");
  const resetBtn = el("button", { class: "btn btn--ghost btn--small", type: "button", hidden: "1" }, "إعادة المحاولة");

  const prevBtn = el("button", { class: "btn btn--subtle", type: "button" }, "Prev");
  const nextBtn = el("button", { class: "btn btn--primary", type: "button" }, "Next");

  const actions = el("div", { class: "readerActions" },
    el("div", { class: "readerActions__row" },
      prevBtn, nextBtn
    )
  );

  const side = el("aside", { class: "readerSide" },
    el("div", { class: "card" },
      el("div", { class: "card__title" }, "التقدم"),
      progressText,
      progressBar,
      el("div", { class: "sideRow" },
        el("div", { class: "sideRow__label" }, "رقم السؤال"),
        el("div", { class: "sideRow__ctrl" }, jumpInput, jumpBtn)
      ),
      el("div", { class: "sideRow sideRow--end" }, resetBtn)
    )
  );

  const main = el("div", { class: "readerMain" },
    el("div", { class: "card" },
      qBox,
      optionsBox,
      explainBox
    ),
    actions
  );

  const grid = el("div", { class: "readerGrid" }, main, side);

  node.innerHTML = "";
  node.append(
    el("div", { class: "page__head" }, title, subTitle),
    grid
  );

  const savePos = () => lsSet(keyFor(subjectNode), String(index));

  function setAnsweredState(nextAnswered, nextSelected) {
    answered = nextAnswered;
    selectedIndex = nextSelected;
    resetBtn.hidden = !answered;
    render();
  }

  function goTo(i) {
    index = clamp(i, 0, total - 1);
    jumpInput.value = String(index + 1);
    savePos();
    // مهم: عند الانتقال للسؤال التالي تصفير حالة التحديد
    answered = false;
    selectedIndex = -1;
    resetBtn.hidden = true;
    render();
  }

  function render() {
    const q = data.questions[index];

    // progress
    progressText.textContent = `(${index + 1}/${total})`;
    const pct = total ? Math.round(((index + 1) / total) * 100) : 0;
    progressBar.querySelector(".progress__fill").style.width = `${pct}%`;

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= total - 1;

    // question
    qBox.innerHTML = `
      <div class="qNo">Q${index + 1}</div>
      <div class="qText">${formatScientific(q.question)}</div>
    `;

    // options
    optionsBox.innerHTML = "";
    const letters = ["A", "B", "C", "D"];
    const correct = q.answerIndex;

    q.options.forEach((opt, i) => {
      const btn = el("button", {
        class: "opt",
        type: "button",
        "aria-pressed": "false"
      });

      btn.innerHTML = `
        <span class="opt__letter">${letters[i]}</span>
        <span class="opt__text">${formatScientific(opt)}</span>
      `;

      if (answered) {
        btn.disabled = true;
        if (i === selectedIndex && selectedIndex === correct) btn.classList.add("opt--correct");
        if (i === selectedIndex && selectedIndex !== correct) btn.classList.add("opt--wrong");
        if (selectedIndex !== correct && i === correct) btn.classList.add("opt--correct");
      }

      btn.addEventListener("click", () => {
        if (answered) return;
        setAnsweredState(true, i);
      });

      optionsBox.append(btn);
    });

    // explanation + reference + difficulty + tags (إذا موجودة)
    const parts = [];
    if (answered && q.explanation) parts.push(`<div class="explain__p"><strong>Explanation:</strong> ${formatScientific(q.explanation)}</div>`);
    if (answered && q.reference) parts.push(`<div class="explain__p"><strong>Ref:</strong> ${formatScientific(q.reference)}</div>`);
    if (answered && q.difficulty) parts.push(`<div class="explain__p"><strong>Difficulty:</strong> ${formatScientific(q.difficulty)}</div>`);
    if (answered && Array.isArray(q.tags) && q.tags.length) parts.push(`<div class="explain__p"><strong>Tags:</strong> ${q.tags.map(t => `<span class="chip">${formatScientific(t)}</span>`).join(" ")}</div>`);

    explainBox.hidden = parts.length === 0;
    explainBox.innerHTML = parts.join("");
  }

  // events
  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  jumpBtn.addEventListener("click", () => {
    const n = Number.parseInt(jumpInput.value || "", 10);
    if (!Number.isFinite(n)) return;
    goTo(n - 1);
  });

  jumpInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") jumpBtn.click();
  });

  resetBtn.addEventListener("click", () => {
    // reset attempt لنفس السؤال فقط
    answered = false;
    selectedIndex = -1;
    resetBtn.hidden = true;
    render();
  });

  render();
  return { title: subjectNode.title.ar, node };
}
