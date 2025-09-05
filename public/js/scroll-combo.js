// public/js/scroll-combo.js
// Accessible custom combobox for the "Choose form name" field.
// Expects markup:
//
// <div class="combo" data-source='["A","B","C"]'>
//   <input id="name" name="name" ... />
//   <button type="button" class="combo-toggle" aria-label="Show options" aria-controls="name-list">▾</button>
//   <ul id="name-list" class="combo-list" role="listbox" hidden></ul>
// </div>

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const makeItem = (text, index) => {
    const li = document.createElement("li");
    li.textContent = text;
    li.role = "option";
    li.dataset.index = String(index);
    li.tabIndex = -1;
    return li;
  };

  const filter = (arr, q) => {
    if (!q) return arr.slice();
    const s = q.trim().toLowerCase();
    return arr.filter(v => v.toLowerCase().includes(s));
    // (If you want "startsWith" instead of "includes", change the line above.)
  };

  const closeOthers = currentUL => {
    $$(".combo-list").forEach(ul => {
      if (ul !== currentUL) {
        ul.hidden = true;
        const btn = $(".combo-toggle", ul.closest(".combo"));
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  };

  const init = combo => {
    const input  = $("input", combo);
    const button = $(".combo-toggle", combo);
    const list   = $(".combo-list", combo);

    // source options
    let source = [];
    try {
      source = JSON.parse(combo.getAttribute("data-source") || "[]") || [];
    } catch (_) { source = []; }

    // squash browser autofill noise
    input.autocomplete   = "off";
    input.autocapitalize = "off";
    input.autocorrect    = "off";
    input.spellcheck     = false;

    let items = source.slice(); // filtered view
    let active = -1;

    const render = (arr) => {
      list.innerHTML = "";
      arr.forEach((txt, i) => list.appendChild(makeItem(txt, i)));
      active = arr.length ? 0 : -1;
      highlight();
    };

    const open = ({showAll=false} = {}) => {
      closeOthers(list);
      if (showAll) {
        items = source.slice();
        render(items);
      } else if (!list.children.length) {
        render(items);
      }
      list.hidden = false;
      button.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      list.hidden = true;
      button.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-expanded", "false");
    };

    const highlight = () => {
      const lis = $$("li", list);
      lis.forEach((li, i) => {
        li.setAttribute("aria-selected", i === active ? "true" : "false");
      });
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
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    // typing -> filter
    input.addEventListener("input", () => {
      items = filter(source, input.value);
      render(items);
      open(); // keep open while typing
    });

    // keyboard nav
    input.addEventListener("keydown", (e) => {
      const lis = $$("li", list);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (list.hidden) open({showAll:true});
        if (!lis.length) return;
        active = Math.min(active + 1, lis.length - 1);
        highlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (list.hidden) open({showAll:true});
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

    // prevent button mousedown from blurring the input (which can close the list)
    button.addEventListener("mousedown", (e) => e.preventDefault());

    // click arrow -> toggle full list
    button.addEventListener("click", () => {
      if (list.hidden) {
        open({showAll:true});
        input.focus();
      } else {
        close();
        input.focus();
      }
    });

    // click option -> select
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const idx = $$("li", list).indexOf(li);
      commit(idx);
    });

    // hover -> move active
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const idx = $$("li", list).indexOf(li);
      if (idx !== -1 && idx !== active) {
        active = idx;
        highlight();
      }
    });

    // click outside -> close
    document.addEventListener("click", (e) => {
      if (!combo.contains(e.target)) close();
    });

    // initial
    render(items);
    close();
  };

  document.addEventListener("DOMContentLoaded", () => {
    $$(".combo").forEach(init);
  });
})();
