/**
 * Slice Element Forge thumbnail grids into individual images.
 *
 * Usage:
 *   1. Generate 2 grid images in Cinema Studio using GPT Image 2 (text-to-image, 1:1)
 *   2. Download them and place in public/storytica/element_forge/grids/
 *   3. Run: node scripts/slice-forge-thumbs.mjs
 *
 * Expected grid files:
 *   - eyes-grid.png          (2 rows x 3 cols = 6 eyes)
 *   - hair-facial-grid.png   (3 rows x 4 cols = 4 hair textures + 7 facial hair + 1 blank)
 *
 * Output: public/storytica/element_forge/thumbs/eye-*.jpg, hair-texture-*.jpg, facial-*.jpg
 */

import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const GRID_DIR = "public/storytica/element_forge/grids";
const OUT_DIR = "public/storytica/element_forge/thumbs";
const SIZE = 512; // output thumbnail size

mkdirSync(OUT_DIR, { recursive: true });

// ── Grid definitions ─────────────────────────────────────────────────────────

const grids = [
  {
    file: "eyes-grid.png",
    rows: 2,
    cols: 3,
    items: [
      "eye-brown", "eye-blue", "eye-green",
      "eye-hazel", "eye-gray", "eye-amber",
    ],
  },
  {
    file: "hair-facial-grid.png",
    rows: 3,
    cols: 4,
    items: [
      // Row 1: hair textures
      "hair-texture-straight", "hair-texture-wavy", "hair-texture-curly", "hair-texture-coily",
      // Row 2: facial hair
      "facial-clean-shaven", "facial-stubble", "facial-short-beard", "facial-full-beard",
      // Row 3: facial hair continued (last cell is blank, skip it)
      "facial-goatee", "facial-moustache", "facial-long-beard",
    ],
  },
];

// ── Slice logic ──────────────────────────────────────────────────────────────

for (const grid of grids) {
  const src = join(GRID_DIR, grid.file);
  if (!existsSync(src)) {
    console.log(`SKIP: ${src} not found`);
    continue;
  }

  const img = sharp(src);
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;

  const cellW = Math.floor(w / grid.cols);
  const cellH = Math.floor(h / grid.rows);

  console.log(`\n${grid.file}: ${w}x${h} -> ${grid.cols}x${grid.rows} cells (${cellW}x${cellH} each)`);

  for (let i = 0; i < grid.items.length; i++) {
    const name = grid.items[i];
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);

    const left = col * cellW;
    const top = row * cellH;

    const outPath = join(OUT_DIR, `${name}.jpg`);

    await sharp(src)
      .extract({ left, top, width: cellW, height: cellH })
      .resize(SIZE, SIZE, { fit: "cover" })
      .jpeg({ quality: 88 })
      .toFile(outPath);

    console.log(`  ${name}.jpg (${col},${row})`);
  }
}

console.log("\nDone! Thumbnails saved to", OUT_DIR);
