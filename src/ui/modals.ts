// ─── Overlays: milestones, cofre offline, henshin y confirmaciones ───────────
import { fmt, fmtTime } from '../core/numbers';
import type { OfflineReward } from '../core/offline';
import type { MilestoneDef } from '../systems/milestones';
import { girlSVG } from '../art/girls';
import { GIRL_BY_ID } from '../systems/girls';
import { $, el } from './dom';
import { emojiBurst } from './particles';

// Los modales se muestran de uno en uno: si llegan varios a la vez
// (milestone + chica nueva en la misma zona), esperan su turno en cola.
const queue: HTMLElement[] = [];
let modalOpen = false;

function openModal(content: HTMLElement): void {
  if (modalOpen) {
    queue.push(content);
    return;
  }
  modalOpen = true;
  const backdrop = el('div', 'modal-backdrop');
  backdrop.appendChild(content);
  $('#modals').appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('open'));
}

function closeModal(node: HTMLElement): void {
  const backdrop = node.closest('.modal-backdrop');
  backdrop?.classList.remove('open');
  setTimeout(() => {
    backdrop?.remove();
    modalOpen = false;
    const next = queue.shift();
    if (next) openModal(next);
  }, 250);
}

/** Celebración de milestone: mecánica nueva desbloqueada. */
export function milestonePopup(m: MilestoneDef, onClose?: () => void): void {
  const card = el('div', 'modal milestone-modal', `
    <div class="milestone-icon">${m.icon}</div>
    <div class="milestone-tag">¡Nueva mecánica!</div>
    <h2>${m.title}</h2>
    <p>${m.desc}</p>
    <button class="cta">¡A brillar! ✧</button>`);
  card.querySelector('.cta')!.addEventListener('click', () => { closeModal(card); onClose?.(); });
  openModal(card);
  emojiBurst(['🎉', '✨', '💖', '⭐', '🌸'], 14, true);
}

/** Una chica nueva se une al equipo. */
export function girlJoinedPopup(girlId: string, onClose?: () => void): void {
  const g = GIRL_BY_ID[girlId];
  if (!g) return;
  const card = el('div', 'modal milestone-modal girl-joined', `
    <div class="joined-portrait" style="--girl-accent:${g.colors.accent}">${girlSVG(g)}</div>
    <div class="milestone-tag">¡Se une al equipo!</div>
    <h2>${g.name} · ${g.title}</h2>
    <p>${g.passive.desc}</p>
    <button class="cta">¡Bienvenida, ${g.name}! 💕</button>`);
  card.querySelector('.cta')!.addEventListener('click', () => { closeModal(card); onClose?.(); });
  openModal(card);
  emojiBurst(['💖', '🎀', '✨'], 12, true);
}

/** Cofre de recompensa offline: primero se toca para abrir (dopamina). */
export function offlineChestModal(reward: OfflineReward, onClaim: () => void): void {
  const card = el('div', 'modal chest-modal', `
    <h2>¡Bienvenida de vuelta! 💫</h2>
    <p>Tu equipo estuvo purificando sombras durante <b>${fmtTime(reward.seconds)}</b>${reward.capped ? ' (tope alcanzado)' : ''}</p>
    <div class="chest">🎁</div>
    <p class="chest-hint">¡Toca el cofre para abrirlo!</p>`);
  const chest = card.querySelector<HTMLElement>('.chest')!;
  chest.addEventListener('pointerdown', () => {
    chest.classList.add('opened');
    chest.textContent = '✨';
    card.querySelector('.chest-hint')!.outerHTML = `
      <div class="chest-reward">⭐ +${fmt(reward.luz)}</div>
      <button class="cta">¡Recoger! 💖</button>`;
    emojiBurst(['⭐', '✨', '💛'], 16, true);
    card.querySelector('.cta')!.addEventListener('click', () => { onClaim(); closeModal(card); });
  }, { once: true });
  openModal(card);
}

/** Flash de transformación (henshin) a pantalla completa. */
export function henshinFlash(): void {
  const flash = el('div', 'henshin-flash', `<div class="henshin-text">✨ ¡TRANSFORMACIÓN PRISMA! ✨</div>`);
  document.body.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());
}

/** Confirmación de Renacer Estelar. */
export function confirmPrestige(polvo: number, onConfirm: () => void): void {
  const card = el('div', 'modal milestone-modal', `
    <div class="milestone-icon">🌠</div>
    <h2>¿Renacer Estelar?</h2>
    <p>Ganarás <b>✨ ${fmt(polvo)} Polvo de Estrellas</b> (+${fmt(polvo * 2)}% daño y Luz permanente).<br>
    Zonas, Luz y niveles vuelven a empezar; chicas, amuletos, Mochi y constelaciones se quedan contigo.</p>
    <div class="modal-actions">
      <button class="cta ghost">Todavía no</button>
      <button class="cta">🌠 ¡Renacer!</button>
    </div>`);
  const [no, yes] = Array.from(card.querySelectorAll('button'));
  no.addEventListener('click', () => closeModal(card));
  yes.addEventListener('click', () => { closeModal(card); onConfirm(); });
  openModal(card);
}
