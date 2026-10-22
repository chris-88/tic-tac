// Renders the PWA icons from one SVG. Run with `npm run icons`; output is committed.
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const icon = (pad, radius) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="30%" cy="20%" r="90%">
      <stop offset="0" stop-color="#1b1c23"/>
      <stop offset="1" stop-color="#0b0c10"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
    <g stroke="#ffffff" stroke-opacity="0.12" stroke-width="10" stroke-linecap="round">
      <path d="M203 96v320M309 96v320M96 203h320M96 309h320"/>
    </g>
    <path d="M118 118l64 64M182 118l-64 64" stroke="#f3efe6" stroke-width="30" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="40" fill="none" stroke="#d9a94f" stroke-width="30"/>
    <path d="M330 330l64 64M394 330l-64 64" stroke="#f3efe6" stroke-width="30" stroke-linecap="round"/>
  </g>
</svg>`

await mkdir('public/icons', { recursive: true })
const render = (svg, size, out) =>
  sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer()
    .then((b) => writeFile(out, b))

await Promise.all([
  render(icon(0, 110), 192, 'public/icons/icon-192.png'),
  render(icon(0, 110), 512, 'public/icons/icon-512.png'),
  render(icon(64, 0), 512, 'public/icons/icon-512-maskable.png'),
  render(icon(0, 0), 180, 'public/apple-touch-icon.png'),
])
console.log('icons written')
