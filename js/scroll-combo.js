// public/js/scroll-combo.js
// Accessible combobox for the Name field with rank-aware filtering + learned checkmarks.
//
// Markup required:
//
// <div class="combo"
//      data-source='["Sanchin","Geikisai #1 Kata", ...]'   // full syllabus (MASTER_FORMS)
//      data-kyu='{"10":["..."],"9":["..."], ...}'          // reqs by KYU
//      data-dan='{"1":["..."],"2":["..."], ...}'           // reqs by DAN
//      data-learned='["sanchin","geikisai #1 kata", ...]'> // lowercased names already learned
//   <input id="name" name="name" ... />
//   <button type="button" class="combo-toggle" ...>▾</button>
//   <ul id="name-list" class="combo-list" role="listbox" hidden></ul>
// </div>
//
// NEW/CHANGED:
// - Uses #rankType and #rankNumber to scope the list to that rank’s requirements.
// - Shows ✓ on learned items and sorts them to the bottom (still selectable).
// - Keeps original keyboard/mouse behavior.

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------- internal helpers ---------------- */
  const norm = (s) => String(s || "").trim().toLowerCase();

  const makeItem = (text, learned = false, index = 0) => {
    const li = document.createElement("li");
    li.role = "option";
    li.dataset.index = String(index);
    li.tabIndex = -1;

    // ✓ marker for learned (kept selectable, visually distinct)
    if (learned) {
      li.className = "is-learned";
      li.title = "Already learned";
      li.innerHTML = `<span class="checkmark" aria-hidden="true">✓</span> ${text}`;
      li.setAttribute("data-learned", "true");
    } else {
      li.textContent = text;
      li.removeAttribute("data-learned");
    }
    return li;
  };

  const textFilter = (arr, q) => {
    if (!q) return arr.slice();
    const s = norm(q);
    return arr.filter(v => norm(v).includes(s));
    // Change to .startsWith(s) if you prefer a stricter filter
  };

  // Sort: non-learned first, then alpha; learned items go to bottom (still selectable)
  const sortWithLearned = (arr, isLearned) =>
    arr.slice().sort((a, b) => {
      const la = isLearned(a) ? 1 : 0;
      const lb = isLearned(b) ? 1 : 0;
      if (la !== lb) return la - lb;                // learned to bottom
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });

  const closeOthers = currentUL => {
    $$(".combo-list").forEach(ul => {
      if (ul !== currentUL) {
        ul.hidden = true;
        const btn = $(".combo-toggle", ul.closest(".combo"));
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  };

  /* ---------------- init one combobox ---------------- */
  const init = (combo) => {
    const input   = $("input", combo);
    const button  = $(".combo-toggle", combo);
    const list    = $(".combo-list", combo);

    // CHANGED: pull in server-provided data
    let source = [];
    let kyuMap = {};
    let danMap = {};
    let learnedSet = new Set();

    try { source = JSON.parse(combo.getAttribute("data-source") || "[]") || []; } catch {}
    try { kyuMap = JSON.parse(combo.getAttribute("data-kyu") || "{}") || {}; } catch {}
    try { danMap = JSON.parse(combo.getAttribute("data-dan") || "{}") || {}; } catch {}
    try { learnedSet = new Set(JSON.parse(combo.getAttribute("data-learned") || "[]").map(norm)); } catch {}

    // rank inputs (optional; only used if present)
    const rankTypeEl   = $("#rankType");
    const rankNumberEl = $("#rankNumber");

    const isLearned = (name) => learnedSet.has(norm(name));

    // Compute the visible pool given current rank selection
    const visiblePool = () => {
      const t = rankTypeEl?.value;
      const n = Number(rankNumberEl?.value);
      if (t === "Kyu" && Number.isFinite(n) && kyuMap[n]) {
        return kyuMap[n].slice();
      }
      if (t === "Dan" && Number.isFinite(n) && danMap[n]) {
        return danMap[n].slice();
      }
      // Fallback: entire syllabus
      return source.slice();
    };

    // squash browser autofill noise
    if (input) {
      input.autocomplete   = "off";
      input.autocapitalize = "off";
      input.autocorrect    = "off";
      input.spellcheck     = false;
    }

    let items  = source.slice(); // current filtered list
    let active = -1;

    const render = (arr) => {
      list.innerHTML = "";
      arr.forEach((txt, i) => list.appendChild(makeItem(txt, isLearned(txt), i)));
      active = arr.length ? 0 : -1;
      highlight();
    };

    const open = ({ showAll = false } = {}) => {
      closeOthers(list);
      if (showAll) {
        items = sortWithLearned(visiblePool(), isLearned);
        render(items);
      } else if (!list.children.length) {
        render(items);
      }
      list.hidden = false;
      button?.setAttribute("aria-expanded", "true");
      input?.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      list.hidden = true;
      button?.setAttribute("aria-expanded", "false");
      input?.setAttribute("aria-expanded", "false");
    };

    const highlight = () => {
      const lis = $$("li", list);
      lis.forEach((li, i) => li.setAttribute("aria-selected", i === active ? "true" : "false"));
      if (active >= 0 && lis[active]) {
        const li = lis[active];
        const rLi = li.getBoundingClientRect();
        const rUl = list.getBoundingClientRect();
        if (rLi.top < rUl.top || rLi.bottom > rUl.bottom) {
          li.scrollIntoView({ block: "nearest" });
        }
      }
    };

    const commit = (idx) => {
      if (idx < 0 || idx >= items.length) return;
      input.value = items[idx];
      close();
      input.dispatchEvent(new Event("change", { bubbles: true })); // triggers auto-category.js
    };

    /* ---------- interactions ---------- */
    // Typing → filter within the current rank’s pool; learned stay shown with ✓ and at bottom
    input?.addEventListener("input", () => {
      const pool = visiblePool();
      const filtered = textFilter(pool, input.value);
      items = sortWithLearned(filtered, isLearned);
      render(items);
      open(); // keep open while typing
    });

    // Keyboard nav
    input?.addEventListener("keydown", (e) => {
      const lis = $$("li", list);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (list.hidden) open({ showAll: true });
        if (!lis.length) return;
        active = Math.min(active + 1, lis.length - 1);
        highlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (list.hidden) open({ showAll: true });
        if (!lis.length) return;
        active = Math.max(active - 1, 0);
        highlight();
      } else if (e.key === "Enter") {
        if (!list.hidden && lis.length) {
          e.preventDefault();
          commit(active);
        }
      } else if (e.key === "Escape") {
        close();
      }
    });

    // Prevent blur on toggle mousedown
    button?.addEventListener("mousedown", (e) => e.preventDefault());

    // Toggle full list
    button?.addEventListener("click", () => {
      if (list.hidden) {
        open({ showAll: true });
        input?.focus();
      } else {
        close();
        input?.focus();
      }
    });

    // Click option → select
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const idx = $$("li", list).indexOf(li);
      commit(idx);
    });

    // Hover → move active
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const idx = $$("li", list).indexOf(li);
      if (idx !== -1 && idx !== active) {
        active = idx;
        highlight();
      }
    });

    // Click outside → close
    document.addEventListener("click", (e) => {
      if (!combo.contains(e.target)) close();
    });

    // CHANGED: react to rank changes → rebuild pool
    const refreshForRank = () => {
      const pool = visiblePool();
      items = sortWithLearned(textFilter(pool, input?.value || ""), isLearned);
      render(items);
    };
    rankTypeEl?.addEventListener("change", refreshForRank);
    rankNumberEl?.addEventListener("input", refreshForRank);
    rankNumberEl?.addEventListener("change", refreshForRank);

    // Initial render
    items = sortWithLearned(visiblePool(), isLearned);
    render(items);
    close();
  };

  document.addEventListener("DOMContentLoaded", () => {
    $$(".combo").forEach(init);
  });
})();
