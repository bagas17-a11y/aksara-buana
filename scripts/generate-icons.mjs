import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

// SVG replicating the Aksara Buana globe-of-letters style
function makeSvg(size) {
  const cx = size / 2
  const r  = size * 0.44
  const fs = size * 0.22   // main text font size
  const fs2 = size * 0.085 // secondary text
  const pad = size * 0.06

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- White background -->
  <rect width="${size}" height="${size}" fill="#faf9f5"/>

  <!-- Gold globe circle -->
  <circle cx="${cx}" cy="${cx}" r="${r}" fill="#8B7530"/>

  <!-- White overlay letters around the edge (decorative) -->
  <text x="${cx}" y="${cx - r*0.32}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${size*0.065}" fill="rgba(255,255,255,0.35)" transform="rotate(-18,${cx},${cx})">BUANA</text>
  <text x="${cx}" y="${cx + r*0.62}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${size*0.055}" fill="rgba(255,255,255,0.3)" transform="rotate(12,${cx},${cx})">1977</text>

  <!-- Main AKSARA text -->
  <text x="${cx}" y="${cx - size*0.025}" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="${fs}" fill="white" letter-spacing="${size*0.005}">AKSARA</text>

  <!-- BUANA text below -->
  <text x="${cx}" y="${cx + fs*0.85}" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="${fs * 0.82}" fill="white" letter-spacing="${size*0.005}">BUANA</text>
</svg>`
}

for (const size of [192, 512]) {
  await sharp(Buffer.from(makeSvg(size)))
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`✓ icon-${size}.png`)
}
