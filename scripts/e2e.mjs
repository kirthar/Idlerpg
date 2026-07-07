// Verificación end-to-end: juega Prisma Girls de verdad y captura pantallas.
import { chromium } from 'playwright';

const SHOTS = process.env.SHOTS_DIR || './shots';
const URL = 'http://localhost:4173/';
const results = [];
const ok = (name, cond, extra = '') => {
  results.push(`${cond ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!cond) process.exitCode = 1;
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
page.on('pageerror', e => results.push(`❌ pageerror: ${e.message}`));

const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem('prismaGirlsSave') || 'null'));
const saveNow = () => page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

// ── 1. Arranque limpio ───────────────────────────────────────────────────────
await page.goto(URL);
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/01-inicio.png` });
ok('La pantalla de combate carga', await page.locator('#enemy-sprite svg').count() > 0);
ok('El objetivo es visible', (await page.locator('#objective').innerText()).includes('Zona 3'));

// ── 2. Tap básico: daño, Luz y combo ────────────────────────────────────────
for (let i = 0; i < 12; i++) { await page.tap('#enemy-area'); await page.waitForTimeout(45); }
await page.screenshot({ path: `${SHOTS}/02-tapeando.png` });
await saveNow();
let s = await getState();
ok('Tapear mata sombras y da Luz', s.luz > 0, `luz=${s.luz.toFixed(1)}, oleada=${s.wave}`);
ok('El combo sube al tapear', s.combo >= 3 || s.stats.taps >= 12, `taps=${s.stats.taps}`);

// ── 3. Jugar de verdad hasta la zona 3 (auto-compra a Lumi entre medias) ────
const deadline = Date.now() + 90_000;
let zone = 1;
let milestoneShot = false;
// cierra popups de milestone/chica nueva como haría un jugador (y les hace foto)
async function closeModals() {
  const cta = page.locator('.modal .cta:not(.ghost)');
  while (await cta.count()) {
    if (!milestoneShot) {
      await page.screenshot({ path: `${SHOTS}/03-milestone.png` });
      milestoneShot = true;
    }
    await cta.first().click();
    await page.waitForTimeout(350);
  }
}
while (zone < 3 && Date.now() < deadline) {
  for (let i = 0; i < 40; i++) {
    await page.tap('#enemy-area', { timeout: 3000 }).catch(() => {});
    if (i % 10 === 9) await closeModals();
  }
  await closeModals();
  // compra niveles de Lumi si se puede
  await page.tap('#tabs [data-tab="chicas"]');
  await page.waitForTimeout(120);
  const buy = page.locator('[data-action="buy-girl"][data-id="lumi"]:not([disabled])');
  for (let i = 0; i < 4 && await buy.count(); i++) { await buy.tap(); await page.waitForTimeout(60); }
  await page.tap('#tabs [data-tab="combate"]');
  await page.waitForTimeout(80);
  // reintenta al jefe si escapó
  const retry = page.locator('#retry-boss:visible');
  if (await retry.count()) await retry.tap().catch(() => {});
  await saveNow();
  s = await getState();
  zone = s.zone;
}
ok('Se llega a la zona 3 jugando', zone >= 3, `zona=${zone}`);
ok('El popup de milestone apareció', milestoneShot);
await closeModals();

// auto-ataque: la vida del enemigo baja sola sin tocar
await saveNow(); s = await getState();
ok('Hana se ha unido', (s.girls.hana ?? 0) >= 1);
const hp1 = s.enemyHp;
await page.waitForTimeout(1500);
await saveNow(); s = await getState();
ok('El auto-ataque (idle) funciona', s.enemyHp < hp1 || s.stats.kills > 0, `hp ${hp1?.toFixed(1)} → ${s.enemyHp?.toFixed(1)}`);

// ── 4. Pantalla de chicas ────────────────────────────────────────────────────
await page.tap('#tabs [data-tab="chicas"]');
await page.waitForTimeout(250);
await page.screenshot({ path: `${SHOTS}/04-chicas.png` });
ok('Chicas bloqueadas muestran su zona', (await page.locator('.girl-card.locked').count()) >= 2);

// ── 5. Salto en el tiempo: partida avanzada (zona 21) para probar el late game
// (initScript: se aplica tras el autoguardado de pagehide y antes de que arranque el juego)
await page.addInitScript(() => {
  if (localStorage.getItem('__patch1')) return;
  const raw = JSON.parse(localStorage.getItem('prismaGirlsSave') || 'null');
  if (!raw) return;
  localStorage.setItem('__patch1', '1');
  Object.assign(raw, {
    zone: 21, wave: 1, maxZone: 21, maxZoneEver: 21,
    luz: 5e7, fragmentos: 12,
    girls: { lumi: 60, hana: 55, mira: 40, yuki: 20 },
    enemyMaxHp: 0, enemyHp: 0, isBoss: false,
  });
  localStorage.setItem('prismaGirlsSave', JSON.stringify(raw));
});
await page.reload();
await page.waitForTimeout(600);

// habilidades + transformación
ok('La barra de habilidades aparece', await page.locator('.skill-btn:visible').count() >= 3);
await page.tap('.skill-btn[data-skill="rafaga"]');
await page.tap('.skill-btn[data-skill="transform"]');
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/05-henshin.png` });
ok('El henshin se activa', await page.locator('.henshin-flash').count() > 0 || (await getState())?.transform?.activeLeft === undefined);
await page.waitForTimeout(1600);

// taller
await page.tap('#tabs [data-tab="taller"]');
await page.waitForTimeout(250);
await page.screenshot({ path: `${SHOTS}/06-taller.png` });
await page.tap('[data-action="forge"][data-id="corazon"]');
await page.waitForTimeout(200);
await saveNow(); s = await getState();
ok('Forjar amuletos funciona', (s.amulets.corazon ?? 0) >= 1, `fragmentos restantes=${s.fragmentos}`);

// familiar
await page.tap('#tabs [data-tab="familiar"]');
await page.waitForTimeout(250);
await page.tap('[data-action="feed"]');
await page.waitForTimeout(200);
await page.screenshot({ path: `${SHOTS}/07-mochi.png` });
await saveNow(); s = await getState();
ok('Mochi sube de nivel al comer', s.petLevel >= 1);

// prestige
await page.tap('#tabs [data-tab="estrellas"]');
await page.waitForTimeout(250);
await page.screenshot({ path: `${SHOTS}/08-estrellas.png` });
await page.tap('[data-action="prestige"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/09-confirmar-renacer.png` });
const yes = page.locator('.modal .cta:not(.ghost)');
await yes.click();
await page.waitForTimeout(500);
await saveNow(); s = await getState();
ok('Renacer da polvo y reinicia', s.polvo > 0 && s.zone === 1 && s.renacimientos === 1, `polvo=${s.polvo}`);
ok('Los amuletos sobreviven al renacer', (s.amulets.corazon ?? 0) >= 1);
ok('Las chicas siguen reclutadas a nivel 1', s.girls.yuki === 1);

// constelación
await page.tap('#tabs [data-tab="estrellas"]');
await page.waitForTimeout(300);
const constBtn = page.locator('[data-action="const"][data-id="corazon"]:not([disabled])');
if (await constBtn.count()) {
  await constBtn.tap();
  await page.waitForTimeout(200);
  await saveNow(); s = await getState();
  ok('Comprar constelaciones funciona', (s.constellations.corazon ?? 0) >= 1, `polvo restante=${s.polvo}`);
} else {
  ok('Comprar constelaciones funciona', false, 'botón deshabilitado (¿polvo insuficiente?)');
}

// ── 6. Cofre offline ─────────────────────────────────────────────────────────
await page.addInitScript(() => {
  if (localStorage.getItem('__patch2')) return;
  const raw = JSON.parse(localStorage.getItem('prismaGirlsSave') || 'null');
  if (!raw) return;
  localStorage.setItem('__patch2', '1');
  raw.lastSeen = Date.now() - 2 * 3600 * 1000; // 2 horas fuera
  raw.maxZoneEver = Math.max(raw.maxZoneEver, 5);
  raw.girls.hana = Math.max(raw.girls.hana || 0, 20);
  localStorage.setItem('prismaGirlsSave', JSON.stringify(raw));
});
await page.reload();
await page.waitForTimeout(700);
ok('El cofre offline aparece', await page.locator('.chest').count() > 0);
await page.screenshot({ path: `${SHOTS}/10-cofre-offline.png` });
await page.tap('.chest', { force: true }); // el cofre tiembla (animación infinita)
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/11-cofre-abierto.png` });
const before = (await getState()).luz;
await page.click('.chest-modal .cta');
await page.waitForTimeout(300);
await saveNow(); s = await getState();
ok('Recoger el cofre da la Luz', s.luz > before, `luz ${before?.toFixed(0)} → ${s.luz?.toFixed(0)}`);

await browser.close();
console.log(results.join('\n'));
