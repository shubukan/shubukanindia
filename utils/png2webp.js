const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Usage: node utils/png2webp.js <dir> [maxKb]
// Converts every .png in <dir> to a .webp alongside it, stepping down
// lossy quality (then downscaling if needed) until under maxKb (default 20).
const dir = process.argv[2];
const maxKb = Number(process.argv[3]) || 20;
if (!dir) {
  console.error("Usage: node utils/png2webp.js <dir> [maxKb]");
  process.exit(1);
}

async function compressUnder(src, dest, maxBytes) {
  const qualities = [90, 80, 70, 60, 50, 40, 30, 20];
  for (const quality of qualities) {
    const buf = await sharp(src).webp({ quality }).toBuffer();
    if (buf.length <= maxBytes) {
      fs.writeFileSync(dest, buf);
      return { quality, scale: 1, size: buf.length };
    }
  }
  // Still too big at lowest quality — downscale and retry.
  const scales = [0.85, 0.7, 0.55, 0.4, 0.25];
  const meta = await sharp(src).metadata();
  for (const scale of scales) {
    const buf = await sharp(src)
      .resize({ width: Math.max(1, Math.round(meta.width * scale)) })
      .webp({ quality: 20 })
      .toBuffer();
    if (buf.length <= maxBytes) {
      fs.writeFileSync(dest, buf);
      return { quality: 20, scale, size: buf.length };
    }
  }
  // Fall back to the smallest attempt even if still over budget.
  const buf = await sharp(src)
    .resize({ width: Math.max(1, Math.round(meta.width * 0.25)) })
    .webp({ quality: 20 })
    .toBuffer();
  fs.writeFileSync(dest, buf);
  return { quality: 20, scale: 0.25, size: buf.length };
}

async function main() {
  const maxBytes = maxKb * 1024;
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png"));
  for (const file of files) {
    const src = path.join(dir, file);
    const dest = path.join(dir, file.replace(/\.png$/i, ".webp"));
    try {
      const { quality, scale, size } = await compressUnder(src, dest, maxBytes);
      console.log(
        `${file} -> ${path.basename(dest)} (${(size / 1024).toFixed(1)}KB, q${quality}${scale !== 1 ? `, scale ${scale}` : ""})`
      );
    } catch (error) {
      console.error(`Failed: ${file}`, error.message);
    }
  }
}
main();
