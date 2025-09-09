// public/js/main.js
// Global client behaviors + chart render + right-panel height sync

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- Belt label tint (on /forms/new) ---------------- */
  const beltColors = {
    white:  '#ffffff',
    orange: '#c47e14',
    green:  '#28a745',
    purple: '#7e4bdc',
    brown:  '#855830',
    black:  '#050505'
  };
  const beltSelect = document.getElementById('beltColor');
  const beltLabel  = document.getElementById('beltLabel');
  if (beltSelect && beltLabel) {
    const tint = v => { beltLabel.style.color = beltColors[v] || '#222'; };
    tint(beltSelect.value);
    beltSelect.addEventListener('change', () => tint(beltSelect.value));
  }

  /* -------------------------- Delete overlay ----------------------- */
  const overlay    = document.getElementById('delete-overlay');
  const cancelBtn  = document.getElementById('cancel-delete-btn');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  if (overlay && cancelBtn && confirmBtn) {
    let deleteFormId = null;
    document.querySelectorAll('.delete-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        deleteFormId = link.getAttribute('data-id');
        overlay.style.display = 'flex';
      });
    });
    cancelBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      deleteFormId = null;
    });
    confirmBtn.addEventListener('click', () => {
      if (!deleteFormId) return;
      const form = document.getElementById('del-' + deleteFormId);
      if (form) form.submit();
    });
  }

  /* ------------------- Belt bar color helpers --------------------- */
  // Canonical IDs like "kyu:3" or "dan:2"
  function canonicalRankId(label) {
    const s = String(label || '').trim().toLowerCase();
    const dan = s.match(/dan\s*(\d+)/) || s.match(/(\d+)\s*dan/);
    if (dan) return 'dan:' + dan[1];
    const kyu =
      s.match(/(\d+)\s*(?:st|nd|rd|th)?\s*kyu/) || // "1st kyu", "4th kyu", "3 kyu"
      s.match(/kyu\s*(\d+)/)                   || // "kyu 3"
      s.match(/(\d+)\s*kyu/);                     // "3 kyu"
    if (kyu) return 'kyu:' + kyu[1];
    return s;
  }

  // Base palette (some overridden by gradients below)
  const SOLID_BELT = {
    'kyu:10': '#ffffff', // white
    'kyu:9' : '#c47e14', // orange (gradient: white→orange)
    'kyu:8' : '#c47e14', // orange
    'kyu:7' : '#28a745', // green (gradient: orange→green)
    'kyu:6' : '#28a745', // green
    'kyu:5' : '#7e4bdc', // purple (gradient: green→purple)
    'kyu:4' : '#7e4bdc', // purple
    'kyu:3' : '#855830', // brown (gradient: purple→brown)
    'kyu:2' : '#855830', // brown
    'kyu:1' : '#050505', // black
    'dan:1' : '#000000',
    'dan:2' : '#000000',
    'dan:3' : '#000000'
  };

  function makeSmoothGradient(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, 400);
    g.addColorStop(0.0, top);
    g.addColorStop(1.0, bottom);
    return g;
  }

  // Fades for specific kyus
  const SMOOTH_MIX = {
    'kyu:9': ['#ffffff', '#c47e14'], // white → orange
    'kyu:7': ['#c47e14', '#28a745'], // orange → green
    'kyu:5': ['#28a745', '#7e4bdc'], // green → purple
    'kyu:3': ['#7e4bdc', '#855830']  // purple → brown
  };

  function beltColorsForLabels(ctx, labels) {
    const bg = [];
    const border = [];
    const L = Array.isArray(labels) ? labels : [];
    for (let i = 0; i < L.length; i++) {
      const id = canonicalRankId(L[i]);

      if (String(id).indexOf('dan:') === 0) {
        bg.push('#000000');
        border.push('#000000');
        continue;
      }
      if (SMOOTH_MIX[id]) {
        const mix = SMOOTH_MIX[id];
        bg.push(makeSmoothGradient(ctx, mix[0], mix[1]));
        border.push('#000000');
        continue;
      }
      const hex = SOLID_BELT[id] || '#9ca3af';
      bg.push(hex);
      const isLight = hex.toLowerCase() === '#ffffff';
      border.push(isLight ? '#111111' : '#000000');
    }
    return { bg, border };
  }

  /* ------------------------- Chart rendering ----------------------- */
  function renderBarChart(canvasId, datasetLabel) {
    const el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    try {
      const labels = JSON.parse(el.dataset.labels || '[]');
      const counts = JSON.parse(el.dataset.counts || '[]');
      const ctx = el.getContext('2d');

      const colors = beltColorsForLabels(ctx, labels);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: datasetLabel,
            data: counts,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Rank (KYU/DAN)' } },
            y: { beginAtZero: true, title: { display: true, text: 'Count' }, ticks: { precision: 0 } }
          }
        }
      });
    } catch (err) {
      console.error('Chart init failed:', err);
    }
  }

  // /forms/new and (optional) index page
  renderBarChart('rankChart', 'Forms Available');
  renderBarChart('formsByRankChart', 'Forms per Rank');

  /* ----- Make right reference panel scroll to match form height ---- */
  const leftForm   = document.querySelector('.new-left');
  const rightPanel = document.querySelector('.new-right');
  let refScroll    = null;

  if (leftForm && rightPanel) {
    refScroll = rightPanel.querySelector('.ref-scroll');
    if (!refScroll) {
      const children = Array.from(rightPanel.children);
      refScroll = document.createElement('div');
      refScroll.className = 'ref-scroll';
      const heading = rightPanel.querySelector('h2');
      rightPanel.innerHTML = '';
      if (heading) rightPanel.appendChild(heading);
      children.forEach(ch => { if (ch !== heading) refScroll.appendChild(ch); });
      rightPanel.appendChild(refScroll);
    }

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const syncHeights = () => {
      const leftRect  = leftForm.getBoundingClientRect();
      const panelStyle = getComputedStyle(rightPanel);
      const padY = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom);
      const target = clamp(leftRect.height - padY, 300, 2000);
      refScroll.style.maxHeight = `${target}px`;
    };

    syncHeights();
    let rAF = null;
    window.addEventListener('resize', () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(syncHeights);
    });
  }
});
