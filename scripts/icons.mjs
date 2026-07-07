// Genera los PNG del icono (PWA + launcher Android) a partir de public/icon.svg
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const svg = readFileSync('public/icon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

/** Renderiza el SVG a PNG. `pad` añade margen transparente (iconos adaptativos). */
async function render(size, out, pad = 0) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = size - pad * 2;
  await page.setContent(`<body style="margin:0;background:transparent">
    <div style="padding:${pad}px"><div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></div>
  </body>`);
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
  console.log('✓', out);
}

// PWA
await render(192, 'public/icon-192.png');
await render(512, 'public/icon-512.png');

// Android launcher (si la plataforma está añadida)
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
if (existsSync('android/app/src/main/res')) {
  for (const [d, size] of Object.entries(DENSITIES)) {
    const dir = `android/app/src/main/res/mipmap-${d}`;
    mkdirSync(dir, { recursive: true });
    await render(size, `${dir}/ic_launcher.png`);
    await render(size, `${dir}/ic_launcher_round.png`);
    // el foreground adaptativo lleva ~25% de margen de seguridad
    await render(FG[d], `${dir}/ic_launcher_foreground.png`, Math.round(FG[d] * 0.22));
  }
  // fondo del icono adaptativo a juego con el degradado
  const valuesDir = 'android/app/src/main/res/values';
  const colors = `${valuesDir}/ic_launcher_background.xml`;
  writeFileSync(colors, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFD6E8</color>\n</resources>\n`);
  console.log('✓', colors);
}

await browser.close();
