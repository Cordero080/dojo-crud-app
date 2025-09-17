// /public/js/beltColors.js
// Palette helpers for Chart.js bars/legend (not the CSS pills).

// — Normalize labels so different inputs map to one key —
const canonical = (label = '') => {
  return String(label).trim().toLowerCase()
    .replace(/\s+/g, ' ')
    // “Kyu 7”, “7 kyu”, “kyu7”, “7th   kyu” → “7th kyu”
    .replace(/kyu\s*(\d+)/, '$1th kyu')
    .replace(/^(\d+)\s*kyu$/, '$1th kyu')
    .replace(/^(\d+)th\s*kyu$/, '$1th kyu')
    // “dan3”, “Dan 3”, “3 dan” → “dan 3”
    .replace(/^dan\s*(\d+)$/, 'dan $1')
    .replace(/^(\d+)\s*dan$/, 'dan $1');
};

// — Solid colors (fallback when no MIX is defined) —
const SOLID = {
  '10th kyu': '#ffffff', // white
   '9th kyu': '#ff7f00', // orange
   '8th kyu': '#ff7f00', // (has MIX w/ white; SOLID is fallback)
   '7th kyu': '#10b981', // green
   '6th kyu': '#10b981', // (has MIX w/ white; SOLID is fallback)
   '5th kyu': '#7c3aed', // purple
   '4th kyu': '#7c3aed', // (has MIX w/ white; SOLID is fallback)
   '3rd kyu': '#8b5a2b', // brown
   '2nd kyu': '#8b5a2b', // (has MIX w/ white; SOLID is fallback)
   '1st kyu': '#000000', // black (pre-dan)
   'dan 1'  : '#000000',
   'dan 2'  : '#000000',
   'dan 3'  : '#000000',
   'dan 4'  : '#000000',
   'dan 5'  : '#000000',
   'dan 6'  : '#000000',
   'dan 7'  : '#000000',
   'dan 8'  : '#000000',
};

// — 50/50 split mixes (overrides SOLID when present) —
const MIX = {
  '8th kyu': ['#ff7f00', '#ffffff'], // orange/white
  '6th kyu': ['#10b981', '#ffffff'], // green/white
  '4th kyu': ['#7c3aed', '#ffffff'], // purple/white
  '2nd kyu': ['#8b5a2b', '#ffffff'], // brown/white
};

// Build a vertical 50/50 split gradient sized to the canvas height
const splitGradient = (ctx, top, bottom) => {
  const h = (ctx && ctx.canvas && ctx.canvas.height) || 400;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, top);
  g.addColorStop(0.5, top);
  g.addColorStop(0.5, bottom);
  g.addColorStop(1.0, bottom);
  return g;
};

// Public API: background colors for the given chart labels
export function backgroundColorsFor(ctx, labels = []) {
  return labels.map((label) => {
    const key = canonical(label);
    const mix = MIX[key];
    if (mix) return splitGradient(ctx, mix[0], mix[1]);
    return SOLID[key] || '#9ca3af'; // fallback gray if unknown
  });
}

// Optional: darker border for light fills or white mixes
export function borderColorsFor(labels = []) {
  const isWhiteish = (hex = '') => /^#(?:fff|ffffff|fffff0|fefefe)$/i.test(hex);
  return labels.map((label) => {
    const key = canonical(label);
    const solid = (SOLID[key] || '').toLowerCase();
    const mix = MIX[key];
    const hasLight = mix ? mix.some(isWhiteish) : isWhiteish(solid);
    return hasLight ? '#111111' : '#000000';
  });
}
