// ─── Pantallas: Chicas · Taller · Familiar · Estrellas ───────────────────────
import { fmt, fmtPct } from '../core/numbers';
import type { GameState } from '../core/state';
import { girlSVG } from '../art/girls';
import { petSVG } from '../art/enemies';
import { AMULETS, amuletCost, amuletTier } from '../systems/forge';
import { GIRLS, bulkCost, girlLevel, girlPower, isGirlUnlocked, levelsToMilestone, maxAffordable, type GirlDef } from '../systems/girls';
import { isUnlocked } from '../systems/milestones';
import { petDamageBonus, petLuzBonus, petMood, feedCost } from '../systems/pet';
import { BAL } from '../core/balance';
import { CONSTELLATIONS, canPrestige, constCost, constLevel, pendingPolvo } from '../systems/prestige';
import { $ } from './dom';

export type TabId = 'combate' | 'chicas' | 'taller' | 'familiar' | 'estrellas';

export interface PanelActions {
  onBuyGirl: (id: string, count: number | 'max') => void;
  onSetBuyMode: (mode: string) => void;
  onForge: (id: string) => void;
  onFeedPet: () => void;
  onBuyConst: (id: string) => void;
  onPrestige: () => void;
}

let buyMode: string = '1';

export function currentBuyMode(): number | 'max' {
  return buyMode === 'max' ? 'max' : parseInt(buyMode, 10);
}

export function bindPanel(actions: PanelActions): void {
  $('#panel').addEventListener('pointerdown', e => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!t || (t as HTMLButtonElement).disabled) return;
    e.preventDefault();
    const a = t.dataset.action!;
    if (a === 'buy-girl') actions.onBuyGirl(t.dataset.id!, currentBuyMode());
    else if (a === 'buy-mode') { buyMode = t.dataset.mode!; actions.onSetBuyMode(buyMode); }
    else if (a === 'forge') actions.onForge(t.dataset.id!);
    else if (a === 'feed') actions.onFeedPet();
    else if (a === 'const') actions.onBuyConst(t.dataset.id!);
    else if (a === 'prestige') actions.onPrestige();
  });
}

export function renderPanel(s: GameState, tab: TabId): void {
  const panel = $('#panel');
  switch (tab) {
    case 'chicas': panel.innerHTML = renderGirls(s); break;
    case 'taller': panel.innerHTML = renderForge(s); break;
    case 'familiar': panel.innerHTML = renderPet(s); break;
    case 'estrellas': panel.innerHTML = renderStars(s); break;
    default: panel.innerHTML = '';
  }
}

// ── Chicas ──────────────────────────────────────────────────────────────────

function girlCard(s: GameState, g: GirlDef): string {
  if (!isGirlUnlocked(s, g.id)) {
    return `<div class="card girl-card locked">
      <div class="portrait silhouette">${girlSVG(g)}</div>
      <div class="girl-info">
        <div class="girl-name">???</div>
        <div class="girl-sub">Se une a tu equipo en la <b>zona ${g.unlockZone}</b> 🔒</div>
      </div>
    </div>`;
  }
  const level = girlLevel(s, g.id);
  const n = buyMode === 'max' ? Math.max(1, maxAffordable(g, level, s.luz)) : parseInt(buyMode, 10);
  const cost = bulkCost(g, level, n);
  const afford = s.luz >= cost;
  const power = girlPower(g, level);
  const toMilestone = levelsToMilestone(level);
  return `<div class="card girl-card" style="--girl-accent:${g.colors.accent}">
    <div class="portrait">${girlSVG(g)}</div>
    <div class="girl-info">
      <div class="girl-name">${g.name} <span class="girl-title">${g.title}</span></div>
      <div class="girl-sub">Nv. <b>${level}</b> · ${g.isTapper ? `👆 ${fmt(power)} por tap` : `⚔️ ${fmt(power)} DPS`}</div>
      <div class="girl-passive">${g.passive.value > 0 ? `💠 ${g.passive.desc}` : `💗 ${g.passive.desc}`}</div>
      <div class="girl-milestone">⭐ ×2 en ${toMilestone} nivel${toMilestone === 1 ? '' : 'es'}</div>
    </div>
    <button class="buy-btn" data-action="buy-girl" data-id="${g.id}" ${afford ? '' : 'disabled'}>
      +${n}<br><span class="cost">⭐ ${fmt(cost)}</span>
    </button>
  </div>`;
}

function renderGirls(s: GameState): string {
  const modes = ['1', '10', 'max'].map(m =>
    `<button class="mode-btn ${buyMode === m ? 'sel' : ''}" data-action="buy-mode" data-mode="${m}">×${m === 'max' ? 'Máx' : m}</button>`).join('');
  return `<div class="screen">
    <div class="screen-head"><h2>🎀 Prisma Girls</h2><div class="mode-group">${modes}</div></div>
    ${GIRLS.map(g => girlCard(s, g)).join('')}
  </div>`;
}

// ── Taller de amuletos ──────────────────────────────────────────────────────

function renderForge(s: GameState): string {
  if (!isUnlocked(s, 'forge')) return lockedScreen('🔮', 'Taller de Amuletos', 12);
  const cards = AMULETS.map(a => {
    const tier = amuletTier(s, a.id);
    const cost = amuletCost(tier);
    const afford = s.fragmentos >= cost;
    return `<div class="card amulet-card">
      <div class="amulet-icon">${a.icon}</div>
      <div class="girl-info">
        <div class="girl-name">${a.name} <span class="girl-title">rango ${tier}</span></div>
        <div class="girl-sub">${tier > 0 ? `Ahora: <b>${a.effectDesc(tier)}</b>` : 'Sin forjar todavía'}</div>
        <div class="girl-passive">Siguiente rango: ${a.effectDesc(tier + 1)}</div>
      </div>
      <button class="buy-btn" data-action="forge" data-id="${a.id}" ${afford ? '' : 'disabled'}>
        Forjar<br><span class="cost">🔮 ${cost}</span>
      </button>
    </div>`;
  }).join('');
  return `<div class="screen">
    <div class="screen-head"><h2>🔮 Taller de Amuletos</h2><div class="chip">🔮 ${fmt(s.fragmentos)} fragmentos</div></div>
    <p class="hint">Los jefes de zona sueltan fragmentos prismáticos. Los amuletos son <b>permanentes</b>: sobreviven al Renacer Estelar ✨</p>
    ${cards}
  </div>`;
}

// ── Familiar ────────────────────────────────────────────────────────────────

function renderPet(s: GameState): string {
  if (!isUnlocked(s, 'pet')) return lockedScreen('🐰', 'Familiar Mochi', 15);
  const cost = feedCost(s);
  const afford = s.luz >= cost;
  return `<div class="screen">
    <div class="screen-head"><h2>🐰 Mochi</h2><div class="chip">Nv. ${s.petLevel}</div></div>
    <div class="pet-stage"><div class="pet-sprite ${afford ? 'excited' : ''}">${petSVG(s.petLevel)}</div></div>
    <p class="pet-mood">${petMood(s.petLevel)}</p>
    <div class="card">
      <div class="girl-info">
        <div class="girl-sub">Bonus actuales: <b>${fmtPct(petDamageBonus(s))} daño</b> · <b>${fmtPct(petLuzBonus(s))} Luz</b></div>
        <div class="girl-passive">Cada comidita: +${Math.round(BAL.petDamagePerLevel * 100)}% daño y +${Math.round(BAL.petLuzPerLevel * 100)}% Luz — para siempre</div>
      </div>
      <button class="buy-btn feed-btn" data-action="feed" ${afford ? '' : 'disabled'}>
        🍡 Alimentar<br><span class="cost">⭐ ${fmt(cost)}</span>
      </button>
    </div>
  </div>`;
}

// ── Estrellas (prestige) ────────────────────────────────────────────────────

function renderStars(s: GameState): string {
  if (!isUnlocked(s, 'prestige')) return lockedScreen('✨', 'Renacer Estelar', 20);
  const pending = pendingPolvo(s);
  const can = canPrestige(s);
  const consts = CONSTELLATIONS.map(c => {
    const lvl = constLevel(s, c.id);
    const maxed = lvl >= c.maxLevel;
    const cost = constCost(c, lvl);
    const afford = !maxed && s.polvo >= cost;
    return `<div class="card amulet-card">
      <div class="amulet-icon">${c.icon}</div>
      <div class="girl-info">
        <div class="girl-name">${c.name} <span class="girl-title">Nv. ${lvl}${maxed ? ' · MÁX' : ''}</span></div>
        <div class="girl-sub">${lvl > 0 ? `Ahora: <b>${c.desc(lvl)}</b>` : 'Sin activar'}</div>
        ${maxed ? '' : `<div class="girl-passive">Siguiente: ${c.desc(lvl + 1)}</div>`}
      </div>
      <button class="buy-btn" data-action="const" data-id="${c.id}" ${afford ? '' : 'disabled'}>
        ${maxed ? 'MÁX' : `Activar<br><span class="cost">✨ ${fmt(cost)}</span>`}
      </button>
    </div>`;
  }).join('');
  return `<div class="screen">
    <div class="screen-head"><h2>✨ Renacer Estelar</h2><div class="chip">✨ ${fmt(s.polvo)} polvo</div></div>
    <div class="card prestige-card">
      <div class="girl-info">
        <div class="girl-name">Renacer ahora da <b>✨ ${fmt(pending)}</b></div>
        <div class="girl-sub">Cada Polvo de Estrellas otorga <b>+${Math.round(BAL.polvoDamageBonus * 100)}% daño y Luz</b> para siempre</div>
        <div class="girl-passive">Se reinician zonas, Luz y niveles · Se conservan chicas, amuletos, Mochi y constelaciones</div>
        <div class="girl-milestone">Llega más lejos (zona máx. ${s.maxZone}) para ganar más polvo · Renacimientos: ${s.renacimientos}</div>
      </div>
      <button class="buy-btn prestige-btn" data-action="prestige" ${can ? '' : 'disabled'}>
        🌠 ¡Renacer!${can ? '' : `<br><span class="cost">zona ${BAL.prestigeMinZone} mín.</span>`}
      </button>
    </div>
    <h3 class="const-head">Constelaciones</h3>
    ${consts}
  </div>`;
}

function lockedScreen(icon: string, name: string, zone: number): string {
  return `<div class="screen locked-screen">
    <div class="locked-big">${icon}</div>
    <h2>${name}</h2>
    <p>Se desbloquea al llegar a la <b>zona ${zone}</b> 🔒</p>
  </div>`;
}
