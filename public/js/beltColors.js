// /public/js/beltColors.js

// --- Canonical keys we'll map to from whatever labels you render ---
const canonical = (label = '') => {
  const s = String(label).trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/kyu\s*(\d+)/, '$1th kyu')   // "Kyu 7" -> "7th kyu"
    .replace(/^(\d+) kyu$/, '$1th kyu')   // "7 kyu" -> "7th kyu"
    .replace(/^kyu\s*(\d+)$/, '$1th kyu') // "kyu7" -> "7th kyu"
    .replace(/^(\d+)th\s*kyu$/, '$1th kyu')
    .replace(/^dan\s*(\d+)$/, 'dan $1')
    .replace(/^(\d+)dan$/, 'dan $1');
  return s;
};

// --- Pick solids for your dojo palette (edit as needed) ---
const SOLID = {
  '10th kyu': '#ffffff', // white
  '9th kyu' : '#ff7f00', // orange
  '8th kyu' : '#ff7f00', // orange (or make this a mix with white)
  '7th kyu' : '#10b981', // green
  '6th kyu' : '#10b981', // green (or mix with white)
  '5th kyu' : '#7c3aed', // purple
  '4th kyu' : '#7c3aed', // purple (or mix with white)
  '3rd kyu' : '#8b5a2b', // brown
  '2nd kyu' : '#8b5a2b', // brown (or mix with white)
  '1st kyu' : '#000000', // black (pre-dan)
  'dan 1'   : '#000000',
  'dan 2'   : '#000000',
  'dan 3'   : '#000000'
};

// --- Ranks you want as split/mixed bars (50/50) ---
const MIX = {
  // Example mixes — tweak to match your belt chip scheme:
  '8th kyu': ['#ff7f00', '#ffffff'], // orange/white
  '6th kyu': ['#10b981', '#ffffff'], // green/white
  '4th kyu': ['#7c3aed', '#ffffff'], // purple/white
  '2nd kyu': ['#8b5a2b', '#ffffff']  // brown/white
};

// Build a vertical 50/50 split gradient
const splitGradient = (ctx, top, bottom) => {
  const g = ctx.createLinearGradient(0, 0, 0, 400);
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
    if (MIX[key]) return splitGradient(ctx, MIX[key][0], MIX[key][1]);
    return SOLID[key] || '#9ca3af'; // fallback gray
  });
}

// Optional: darker border for very light bars
export function borderColorsFor(labels = []) {
  return labels.map((label) => {
    const key = canonical(label);
    const hex = (SOLID[key] || '').toLowerCase();
    return (hex === '#ffffff' || hex === '#fffff0') ? '#111111' : '#000000';
  });
}
