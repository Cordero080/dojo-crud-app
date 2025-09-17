// /public/js/beltColors.js
// One-file setup: palette + DAN gold-stripe plugin + chart init (Chart.js v3)

// ---------- label normalization ----------
const canonical = (label = '') =>
  String(label).trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/kyu\s*(\d+)/, '$1th kyu')
    .replace(/^(\d+)\s*kyu$/, '$1th kyu')
    .replace(/^(\d+)th\s*kyu$/, '$1th kyu')
    .replace(/^dan\s*(\d+)$/, 'dan $1')
    .replace(/^(\d+)\s*dan$/, 'dan $1');

// ---------- palette (DAN 1..8 are black) ----------
const SOLID = {
  '10th kyu':'#ffffff','9th kyu':'#ff7f00','8th kyu':'#ff7f00',
  '7th kyu':'#10b981','6th kyu':'#10b981','5th kyu':'#7c3aed',
  '4th kyu':'#7c3aed','3rd kyu':'#8b5a2b','2nd kyu':'#8b5a2b',
  '1st kyu':'#000000',
  'dan 1':'#000000','dan 2':'#000000','dan 3':'#000000','dan 4':'#000000',
  'dan 5':'#000000','dan 6':'#000000','dan 7':'#000000','dan 8':'#000000'
};

const MIX = {
  '8th kyu':['#ff7f00','#ffffff'],
  '6th kyu':['#10b981','#ffffff'],
  '4th kyu':['#7c3aed','#ffffff'],
  '2nd kyu':['#8b5a2b','#ffffff'],
};

const splitGradient = (ctx, top, bottom) => {
  const h = (ctx && ctx.canvas && ctx.canvas.height) || 400;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, top); g.addColorStop(0.5, top);
  g.addColorStop(0.5, bottom); g.addColorStop(1.0, bottom);
  return g;
};

function backgroundColorsFor(ctx, labels = []) {
  return labels.map(label => {
    const key = canonical(label);
    const mix = MIX[key];
    if (mix) return splitGradient(ctx, mix[0], mix[1]);
    return SOLID[key] || '#9ca3af';
  });
}

function borderColorsFor(labels = []) {
  const isWhiteish = (hex='') => /^#(?:fff|ffffff|fffff0|fefefe)$/i.test(hex);
  return labels.map(label => {
    const hex = (SOLID[canonical(label)] || '').toLowerCase();
    return isWhiteish(hex) ? '#111111' : '#000000';
  });
}

// ---------- DAN gold stripes plugin (overlays bars) ----------
const danStripes = {
  id: 'danStripes',
  afterDatasetsDraw(chart, _args, opts) {
    const ctx = chart.ctx;
    const labels = chart.data.labels || [];
    const meta = chart.getDatasetMeta(0);
    if (!meta) return;

    const stripeW   = opts?.stripeWidth ?? 5;
    const stripeGap = opts?.stripeGap   ?? 4;
    const inset     = opts?.inset       ?? 6;
    const hRatio    = opts?.heightRatio ?? 0.8;

    labels.forEach((label, i) => {
      const m = canonical(label).match(/^dan\s+(\d+)$/);
      if (!m) return;
      const count = Math.max(1, Math.min(8, +m[1]));
      const el = meta.data[i];
      if (!el) return;

      const {x, y, base, width, height} = el.getProps(['x','y','base','width','height'], true);
      const top = Math.min(y, base), bottom = Math.max(y, base);
      const right = x + width/2;

      const h = (bottom - top) * hRatio;
      const y0 = top + ((bottom - top) - h) / 2;

      const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
      grad.addColorStop(0.00, '#7a5c22');
      grad.addColorStop(0.35, '#d9b650');
      grad.addColorStop(0.50, '#fff1a8');
      grad.addColorStop(0.65, '#d9b650');
      grad.addColorStop(1.00, '#7a5c22');

      ctx.save();
      ctx.fillStyle = grad;
      for (let s = 0; s < count; s++) {
        const xr = right - inset - s * (stripeW + stripeGap);
        ctx.fillRect(xr - stripeW, y0, stripeW, h);
      }
      ctx.restore();
    });
  }
};

// ---------- auto-register plugin + defaults (Chart.js must already be loaded) ----------
if (typeof Chart !== 'undefined' && Chart?.register) {
  Chart.register(danStripes);
  Chart.defaults.plugins.danStripes = {
    stripeWidth: 5, stripeGap: 4, inset: 6, heightRatio: 0.8
  };
}

// ---------- build the chart if #rankChart exists ----------
function initRankChart() {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('rankChart');
  if (!canvas) return;

  const ctx     = canvas.getContext('2d');
  const labels  = JSON.parse(canvas.dataset.labels || '[]');
  const counts  = JSON.parse(canvas.dataset.counts || '[]');

  // Control bar thickness via canvas width (works with your scroll container)
  const BAR_WIDTH = 48, BAR_GAP = 16, PAD = 24;
  canvas.width  = PAD + labels.length * (BAR_WIDTH + BAR_GAP) + PAD;
  canvas.height = 220;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: backgroundColorsFor(ctx, labels),
        borderColor: borderColorsFor(labels),
        borderWidth: 1
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 0 } },
        y: { beginAtZero: true, grace: '10%', grid: { color: 'rgba(255,255,255,.12)' } }
      }
    }
  });
}

// Call immediately (file is loaded at the end of the page), but safe if earlier too.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRankChart);
} else {
  initRankChart();
}

// (Optional) export helpers if you need them elsewhere
export { backgroundColorsFor, borderColorsFor };
