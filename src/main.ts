// ─── Prisma Girls: arranque y orquestación ───────────────────────────────────
import './style.css';
import { claimOffline, computeOffline } from './core/offline';
import { loadGame, saveGame } from './core/save';
import { newGame, type GameState } from './core/state';
import { initAudio, setSoundEnabled, sfx } from './audio/sfx';
import { playerTap, retryBoss, spawnEnemy, tickCombat, useSkill, type CombatEvent } from './systems/combat';
import { buyLevels, GIRL_BY_ID } from './systems/girls';
import { isUnlocked } from './systems/milestones';
import { forgeAmulet } from './systems/forge';
import { feedPet } from './systems/pet';
import { buyConstellation, pendingPolvo, prestige } from './systems/prestige';
import { activateTransform } from './systems/skills';
import { $, el } from './ui/dom';
import { confirmPrestige, girlJoinedPopup, henshinFlash, milestonePopup, offlineChestModal } from './ui/modals';
import { damageNumber, emojiBurst, enemyDefeated, enemyHit, luzGain, shake, toast } from './ui/particles';
import { bindPanel, renderPanel, type TabId } from './ui/screens';
import { bindStage, updateStage } from './ui/stage';

// ── Estado ──────────────────────────────────────────────────────────────────

const S: GameState = loadGame() ?? newGame();
if (S.enemyMaxHp <= 0) spawnEnemy(S);
setSoundEnabled(S.soundOn);

let currentTab: TabId = 'combate';
let luzFlyAccum = 0; // agrupa la lluvia de "+Luz" para no saturar

// ── Reacciones a los eventos de combate (la dopamina vive aquí) ─────────────

function handleEvents(events: CombatEvent[], fromTap: boolean): void {
  for (const ev of events) {
    switch (ev.type) {
      case 'hit':
        if (ev.source === 'tap' || ev.source === 'skill') {
          damageNumber(ev.amount, ev.crit);
          enemyHit();
          if (ev.crit) {
            shake();
            emojiBurst(['💗', '✨'], 4);
            sfx.crit();
          } else if (fromTap) {
            sfx.tap();
          }
        }
        break;
      case 'kill':
        enemyDefeated();
        luzFlyAccum += ev.luz;
        sfx.kill();
        break;
      case 'boss-defeated':
        enemyDefeated();
        shake(true);
        emojiBurst(['👑', '🎉', '⭐', '💖'], 12, true);
        luzGain(ev.luz);
        toast(`👑 ¡Jefe purificado! +🔮${ev.fragmentos} fragmento`);
        sfx.bossDown();
        break;
      case 'boss-failed':
        toast('💦 El jefe escapó… ¡mejora al equipo y reinténtalo!');
        sfx.fail();
        break;
      case 'zone-up': {
        for (const m of ev.milestones) {
          milestonePopup(m);
          sfx.milestone();
        }
        for (const id of ev.girlsJoined) {
          girlJoinedPopup(id);
        }
        if (ev.milestones.length === 0 && ev.girlsJoined.length === 0 && ev.zone % 5 === 0) {
          toast(`🌸 ¡Zona ${ev.zone} alcanzada!`);
        }
        break;
      }
      case 'combo-lost':
        break; // perder el combo no merece castigo sonoro
    }
  }
}

// ── Acciones del jugador ────────────────────────────────────────────────────

bindStage({
  onTap() {
    initAudio();
    handleEvents(playerTap(S), true);
    updateStage(S);
  },
  onSkill(id) {
    initAudio();
    const before = S.skills[id]?.cdLeft ?? 0;
    const events = useSkill(S, id);
    if ((S.skills[id]?.cdLeft ?? 0) > before) sfx.skill();
    handleEvents(events, false);
    updateStage(S);
  },
  onTransform() {
    initAudio();
    if (activateTransform(S)) {
      henshinFlash();
      sfx.henshin();
      emojiBurst(['🌟', '💖', '✨', '🌈'], 16, true);
    }
    updateStage(S);
  },
  onRetryBoss() {
    initAudio();
    retryBoss(S);
    sfx.bossAppear();
    updateStage(S);
  },
});

bindPanel({
  onBuyGirl(id, count) {
    const bought = buyLevels(S, id, count);
    if (bought > 0) {
      sfx.levelup();
      const g = GIRL_BY_ID[id];
      toast(`💕 ${g.name} sube a nivel ${S.girls[id]}`);
    }
    refreshPanel();
  },
  onSetBuyMode() { refreshPanel(); },
  onForge(id) {
    if (forgeAmulet(S, id)) { sfx.levelup(); emojiBurst(['🔮', '✨'], 8); }
    refreshPanel();
  },
  onFeedPet() {
    if (feedPet(S)) { sfx.coin(); emojiBurst(['🍡', '💕'], 6); toast('¡Mochi está feliz! 🐰'); }
    refreshPanel();
  },
  onBuyConst(id) {
    if (buyConstellation(S, id)) { sfx.milestone(); emojiBurst(['✨', '🌙'], 8); }
    refreshPanel();
  },
  onPrestige() {
    const polvo = pendingPolvo(S);
    if (polvo <= 0) return;
    confirmPrestige(polvo, () => {
      const gained = prestige(S);
      spawnEnemy(S);
      saveGame(S);
      henshinFlash();
      sfx.henshin();
      emojiBurst(['🌠', '✨', '💜'], 18, true);
      toast(`🌠 ¡Renaciste con ✨${gained} Polvo de Estrellas!`);
      switchTab('combate');
    });
  },
});

// ── Pestañas ────────────────────────────────────────────────────────────────

const TAB_LOCKS: Partial<Record<TabId, { milestone: string; zone: number }>> = {
  taller: { milestone: 'forge', zone: 12 },
  familiar: { milestone: 'pet', zone: 15 },
  estrellas: { milestone: 'prestige', zone: 20 },
};

function switchTab(tab: TabId): void {
  currentTab = tab;
  document.querySelectorAll<HTMLElement>('.tab').forEach(t => t.classList.toggle('sel', t.dataset.tab === tab));
  $('#panel').classList.toggle('open', tab !== 'combate');
  renderPanel(S, tab);
}

$('#tabs').addEventListener('click', e => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('.tab');
  if (!btn) return;
  initAudio();
  const tab = btn.dataset.tab as TabId;
  const lock = TAB_LOCKS[tab];
  if (lock && !isUnlocked(S, lock.milestone)) {
    toast(`🔒 Se desbloquea en la zona ${lock.zone}`);
  }
  switchTab(tab);
});

function refreshPanel(): void {
  if (currentTab !== 'combate') renderPanel(S, currentTab);
  updateStage(S);
}

function updateTabLocks(): void {
  document.querySelectorAll<HTMLElement>('.tab').forEach(t => {
    const lock = TAB_LOCKS[t.dataset.tab as TabId];
    t.classList.toggle('locked', !!lock && !isUnlocked(S, lock.milestone));
  });
}

// ── Sonido ──────────────────────────────────────────────────────────────────

function renderSoundBtn(): void {
  $('#sound-toggle').textContent = S.soundOn ? '🔊' : '🔇';
}
$('#sound-toggle').addEventListener('click', () => {
  S.soundOn = !S.soundOn;
  setSoundEnabled(S.soundOn);
  renderSoundBtn();
});

// ── Cofre offline ───────────────────────────────────────────────────────────

function maybeOfflineChest(): void {
  const elapsed = (Date.now() - S.lastSeen) / 1000;
  const reward = computeOffline(S, elapsed);
  S.lastSeen = Date.now();
  if (reward) {
    offlineChestModal(reward, () => {
      claimOffline(S, reward);
      sfx.chest();
      updateStage(S);
      saveGame(S);
    });
  }
}

// ── Bucle principal ─────────────────────────────────────────────────────────

let lastTick = performance.now();
let wasBoss = S.isBoss;

setInterval(() => {
  const now = performance.now();
  const dt = Math.min((now - lastTick) / 1000, 2); // evita saltos enormes
  lastTick = now;

  handleEvents(tickCombat(S, dt), false);

  if (S.isBoss && !wasBoss && !S.bossFailed) sfx.bossAppear();
  wasBoss = S.isBoss;

  if (luzFlyAccum > 0) {
    luzGain(luzFlyAccum);
    sfx.coin();
    luzFlyAccum = 0;
  }

  updateStage(S);
  updateTabLocks();
}, 100);

// Refresco lento del panel abierto (precios y estados cambian con el idle)
setInterval(() => {
  if (currentTab !== 'combate') renderPanel(S, currentTab);
}, 1000);

// Autoguardado
setInterval(() => saveGame(S), 10_000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveGame(S);
  } else {
    maybeOfflineChest();
    lastTick = performance.now();
  }
});
window.addEventListener('pagehide', () => saveGame(S));

// ── Arranque ────────────────────────────────────────────────────────────────

renderSoundBtn();
updateStage(S);
updateTabLocks();
maybeOfflineChest();

// Un saludo la primera vez
if (S.stats.taps === 0 && S.stats.kills === 0) {
  const hello = el('div', 'toast', '💖 ¡Toca a la sombra para purificarla!');
  $('#toasts').appendChild(hello);
  hello.addEventListener('animationend', () => hello.remove());
}

// PWA: service worker solo en producción (vite dev no lo sirve)
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* opcional */ });
}
