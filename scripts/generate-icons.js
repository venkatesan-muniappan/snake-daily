// Generates Daily Snake icons. Usage: npx -p sharp@0.34 node scripts/generate-icons.js assets
const sharp = require('sharp');
const path = require('path');

const out = process.argv[2];
const BG = '#0d1117';
const GREEN = '#4ade80';
const HEAD = '#22c55e';
const RED = '#f87171';
const LEAF = '#86efac';

// Snake path on a 7x7 grid (cell units), tail -> head: an "S".
const PATH = [
  [5, 1], [1, 1], [1, 3], [5, 3], [5, 5], [2.3, 5],
];
const APPLE = [0.9, 5];

/**
 * Logo group in a 7x7 unit box. `mono` draws everything in one color (Android themed icon).
 */
function logo({ mono = null } = {}) {
  const body = mono ?? GREEN;
  const head = mono ?? HEAD;
  const apple = mono ?? RED;
  const pts = PATH.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(' ');
  const [hx, hy] = PATH[PATH.length - 1].map((v) => v + 0.5);
  const [ax, ay] = APPLE.map((v) => v + 0.5);
  const eyes = mono
    ? ''
    : `<circle cx="${hx - 0.12}" cy="${hy - 0.17}" r="0.09" fill="${BG}"/>
       <circle cx="${hx - 0.12}" cy="${hy + 0.17}" r="0.09" fill="${BG}"/>`;
  const leaf = `<ellipse cx="${ax + 0.12}" cy="${ay - 0.42}" rx="0.17" ry="0.08" transform="rotate(-35 ${ax + 0.12} ${ay - 0.42})" fill="${mono ?? LEAF}"/>`;
  return `
    <polyline points="${pts}" fill="none" stroke="${body}" stroke-width="0.78" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${hx}" cy="${hy}" r="0.5" fill="${head}"/>
    ${eyes}
    <circle cx="${ax}" cy="${ay}" r="0.34" fill="${apple}"/>
    ${leaf}`;
}

/** SVG of `size` px with the 7x7 logo scaled to `logoFrac` of the canvas, centered. */
function svg({ size, logoFrac, bg = null, mono = null, grid = false }) {
  const scale = (size * logoFrac) / 7;
  const offset = (size - size * logoFrac) / 2;
  const cell = size / 9;
  const gridRects = grid
    ? Array.from({ length: 81 }, (_, i) => {
        const x = i % 9;
        const y = Math.floor(i / 9);
        return (x + y) % 2 ? `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#131a23"/>` : '';
      }).join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    ${gridRects}
    <g transform="translate(${offset} ${offset}) scale(${scale})">${logo({ mono })}</g>
  </svg>`;
}

const jobs = [
  // iOS/store icon: full bleed, opaque (iOS applies its own mask).
  ['icon.png', svg({ size: 1024, logoFrac: 0.78, bg: BG, grid: true })],
  // Android adaptive: foreground must sit inside the central ~66% safe zone.
  ['android-icon-foreground.png', svg({ size: 512, logoFrac: 0.56 })],
  ['android-icon-background.png', svg({ size: 512, logoFrac: 0, bg: BG, grid: true })],
  ['android-icon-monochrome.png', svg({ size: 432, logoFrac: 0.56, mono: '#ffffff' })],
  ['splash-icon.png', svg({ size: 1024, logoFrac: 0.9 })],
  ['favicon.png', svg({ size: 48, logoFrac: 0.86, bg: BG })],
];

(async () => {
  for (const [name, markup] of jobs) {
    await sharp(Buffer.from(markup)).png().toFile(path.join(out, name));
    console.log('wrote', name);
  }
  // Preview sheet for eyeballing.
  await sharp(Buffer.from(svg({ size: 1024, logoFrac: 0.78, bg: BG, grid: true })))
    .resize(256)
    .png()
    .toFile(path.join(__dirname, 'preview-256.png'));
})();
