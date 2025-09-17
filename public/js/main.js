// /public/js/main.js
// Global client behaviors + chart render + right-panel height sync

// ---- Prevent duplicate initialization if this script is included twice ----
if (!window.__dojoCrudMainInitialized__) {
  window.__dojoCrudMainInitialized__ = true;

  document.addEventListener("DOMContentLoaded", () => {
    /* === Dan stripes plugin (self-contained; no other file needed) === */
    (function registerDanStripes() {
      if (window.__danStripesRegistered__) return;
      if (!window.Chart || typeof Chart.register !== "function") return;

      const danStripes = {
        id: "danStripes",
        afterDatasetsDraw(chart, _args, opts) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          const labels = chart.data.labels || [];
          if (!meta || !meta.data) return;

          const stripeWidth = (opts && opts.stripeWidth) || 6;
          const stripeGap = (opts && opts.stripeGap) || 4;
          const inset = (opts && opts.inset) || 6;
          const heightRatio = (opts && opts.heightRatio) || 0.75;

          ctx.save();
          for (let i = 0; i < labels.length; i++) {
            const text = String(labels[i] || "");
            const m = text.match(/dan\s*(\d+)/i) || text.match(/(\d+)\s*dan/i);
            const n = m ? parseInt(m[1] || m[2], 10) : 0;
            if (!n) continue;

            const bar = meta.data[i];
            if (!bar) continue;

            const xCenter = bar.x;
            const halfW = bar.width / 2;
            const leftX = xCenter - halfW + inset;
            const topY = Math.min(bar.y, bar.base);
            const bottomY = Math.max(bar.y, bar.base);
            const h = Math.max(2, (bottomY - topY) * heightRatio);
            const yStart = bottomY - h - inset;

            const g = ctx.createLinearGradient(0, yStart, 0, yStart + h);
            g.addColorStop(0.0, "#b38b00");
            g.addColorStop(0.5, "#ffd700");
            g.addColorStop(1.0, "#b38b00");
            ctx.fillStyle = g;

            for (let s = 0; s < n; s++) {
              const sx = leftX + s * (stripeWidth + stripeGap);
              if (sx + stripeWidth > xCenter + halfW - inset) break;
              ctx.fillRect(sx, yStart, stripeWidth, h);
            }
          }
          ctx.restore();
        },
      };

      Chart.register(danStripes);
      window.__danStripesRegistered__ = true;
    })();

    /* ---------------- Belt label tint (on /forms/new) ---------------- */
    const beltColors = {
      white: "#ffffff",
      orange: "#c47e14",
      green: "#28a745",
      purple: "#7e4bdc",
      brown: "#855830",
      black: "#050505",
    };
    const beltSelect = document.getElementById("beltColor");
    const beltLabel = document.getElementById("beltLabel");
    if (beltSelect && beltLabel) {
      const tint = (v) => {
        beltLabel.style.color = beltColors[v] || "#222";
      };
      tint(beltSelect.value);
      beltSelect.addEventListener("change", () => tint(beltSelect.value));
    }

    /* -------------------------- Delete overlay ----------------------- */
    const overlay = document.getElementById("delete-overlay");
    const cancelBtn = document.getElementById("cancel-delete-btn");
    const confirmBtn = document.getElementById("confirm-delete-btn");
    if (overlay && cancelBtn && confirmBtn) {
      let deleteFormId = null;
      document.querySelectorAll(".delete-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          deleteFormId = link.getAttribute("data-id");
          overlay.style.display = "flex";
        });
      });
      cancelBtn.addEventListener("click", () => {
        overlay.style.display = "none";
        deleteFormId = null;
      });
      confirmBtn.addEventListener("click", () => {
        if (!deleteFormId) return;
        const form = document.getElementById("del-" + deleteFormId);
        if (form) form.submit();
      });
    }

    /* ------------------- Belt bar color helpers --------------------- */
    function canonicalRankId(label) {
      const s = String(label || "")
        .trim()
        .toLowerCase();
      const dan = s.match(/dan\s*(\d+)/) || s.match(/(\d+)\s*dan/);
      if (dan) return "dan:" + dan[1];
      const kyu =
        s.match(/(\d+)\s*(?:st|nd|rd|th)?\s*kyu/) ||
        s.match(/kyu\s*(\d+)/) ||
        s.match(/(\d+)\s*kyu/);
      if (kyu) return "kyu:" + kyu[1];
      return s;
    }

    const SOLID_BELT = {
      "kyu:10": "#ffffff",
      "kyu:9": "#c47e14",
      "kyu:8": "#c47e14",
      "kyu:7": "#28a745",
      "kyu:6": "#28a745",
      "kyu:5": "#7e4bdc",
      "kyu:4": "#7e4bdc",
      "kyu:3": "#855830",
      "kyu:2": "#855830",
      "kyu:1": "#050505",
      "dan:1": "#000000",
      "dan:2": "#000000",
      "dan:3": "#000000",
      "dan:4": "#000000",
      "dan:5": "#000000",
      "dan:6": "#000000",
      "dan:7": "#000000",
      "dan:8": "#000000",
    };

    function makeSmoothGradient(ctx, top, bottom) {
      const g = ctx.createLinearGradient(0, 0, 0, 400);
      g.addColorStop(0.0, top);
      g.addColorStop(1.0, bottom);
      return g;
    }

    const SMOOTH_MIX = {
      "kyu:9": ["#ffffff", "#c47e14"],
      "kyu:7": ["#c47e14", "#28a745"],
      "kyu:5": ["#28a745", "#7e4bdc"],
      "kyu:3": ["#7e4bdc", "#855830"],
    };

    function beltColorsForLabels(ctx, labels) {
      const bg = [];
      const border = [];
      const L = Array.isArray(labels) ? labels : [];
      for (let i = 0; i < L.length; i++) {
        const id = canonicalRankId(L[i]);

        if (id.indexOf("dan:") === 0) {
          bg.push("#000000");
          border.push("#000000");
          continue;
        }
        if (ctx && SMOOTH_MIX[id]) {
          const mix = SMOOTH_MIX[id];
          bg.push(makeSmoothGradient(ctx, mix[0], mix[1]));
          border.push("#000000");
          continue;
        }
        const hex = SOLID_BELT[id] || "#9ca3af";
        bg.push(hex);
        border.push(hex.toLowerCase() === "#ffffff" ? "#111111" : "#000000");
      }
      return { bg, border };
    }

    /* ---------------------- Chart.js safe helpers ------------------- */
    const chartRegistry = {};

    function destroyExistingChart(canvasId) {
      try {
        if (window.Chart && typeof Chart.getChart === "function") {
          const byId = Chart.getChart(canvasId);
          const byEl = Chart.getChart(document.getElementById(canvasId));
          (byId || byEl)?.destroy();
        }
      } catch (_) {
        /* ignore */
      }

      if (chartRegistry[canvasId]) {
        try {
          chartRegistry[canvasId].destroy();
        } catch (_) {}
        delete chartRegistry[canvasId];
      }
    }

    /* ------------------------- Chart rendering ----------------------- */
    function renderBarChart(canvasId, datasetLabel) {
      const el = document.getElementById(canvasId);
      if (!el || !window.Chart) return;

      let labels, counts;
      try {
        labels = JSON.parse(el.dataset.labels || "[]");
        counts = JSON.parse(el.dataset.counts || "[]");
      } catch (_) {
        labels = [];
        counts = [];
      }

      const filtered = labels
        .map((l, i) => [l, Number(counts[i]) || 0])
        .filter(([, c]) => c > 0);

      labels = filtered.map(([l]) => l);
      counts = filtered.map(([, c]) => c);

      if (labels.length === 0) {
        destroyExistingChart(canvasId);
        return;
      }

      const ctx = el.getContext && el.getContext("2d");
      const colors = beltColorsForLabels(ctx, labels);

      const maxCount = counts.reduce((m, v) => Math.max(m, v), 0);
      const suggestedMax = Math.max(5, maxCount);

      destroyExistingChart(canvasId);

      try {
        const instance = new Chart(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: datasetLabel,
                data: counts,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: 1,
                // wider bars without fiddling with canvas width
                categoryPercentage: 0.9,
                barPercentage: 0.95,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              // enables gold stripes on DAN bars
              danStripes: {
                stripeWidth: 6,
                stripeGap: 4,
                inset: 6,
                heightRatio: 0.75,
              },
            },
            scales: {
              x: { title: { display: true, text: "Rank (KYU/DAN)" } },
              y: {
                beginAtZero: true,
                suggestedMax,
                ticks: { stepSize: 1, precision: 0 },
                title: { display: true, text: "Count" },
              },
            },
          },
        });
        chartRegistry[canvasId] = instance;
      } catch (err) {
        console.error("Chart init failed:", err);
      }
    }

    // /forms/new and (optional) index page
    renderBarChart("rankChart", "Forms Available");
    renderBarChart("formsByRankChart", "Forms per Rank");

    /* ----- Make right reference panel scroll to match form height ---- */
    const leftForm = document.querySelector(".new-left");
    const rightPanel = document.querySelector(".new-right");
    let refScroll = null;

    if (leftForm && rightPanel) {
      refScroll = rightPanel.querySelector(".ref-scroll");
      if (!refScroll) {
        const children = Array.from(rightPanel.children);
        refScroll = document.createElement("div");
        refScroll.className = "ref-scroll";
        const heading = rightPanel.querySelector("h2");
        rightPanel.innerHTML = "";
        if (heading) rightPanel.appendChild(heading);
        children.forEach((ch) => {
          if (ch !== heading) refScroll.appendChild(ch);
        });
        rightPanel.appendChild(refScroll);
      }

      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

      const syncHeights = () => {
        const leftRect = leftForm.getBoundingClientRect();
        const panelStyle = getComputedStyle(rightPanel);
        const padY =
          parseFloat(panelStyle.paddingTop) +
          parseFloat(panelStyle.paddingBottom);
        const target = clamp(leftRect.height - padY, 300, 2000);
        refScroll.style.maxHeight = `${target}px`;
      };

      syncHeights();
      let rAF = null;
      window.addEventListener("resize", () => {
        if (rAF) cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(syncHeights);
      });
    }

    /* ---------------- Edit page: keyboard prev/next (← / →, or A / D) -------- */
    const prevLink = document.getElementById("nav-prev");
    const nextLink = document.getElementById("nav-next");

    if (prevLink || nextLink) {
      document.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          e.metaKey ||
          e.ctrlKey ||
          e.altKey
        )
          return;

        if (
          (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") &&
          prevLink
        ) {
          e.preventDefault();
          window.location.assign(prevLink.href);
        } else if (
          (e.key === "ArrowRight" || e.key.toLowerCase() === "d") &&
          nextLink
        ) {
          e.preventDefault();
          window.location.assign(nextLink.href);
        }
      });
    }
  });
}
