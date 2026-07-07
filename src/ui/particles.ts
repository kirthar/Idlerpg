// ─── Partículas de dopamina: números flotantes, corazones, confeti ───────────
import { fmt } from '../core/numbers';
import { $, el } from './dom';

function floatLayer(): HTMLElement {
  return $('#float-layer');
}

/** Número de daño flotante sobre el enemigo. */
export function damageNumber(amount: number, crit: boolean): void {
  const layer = floatLayer();
  if (layer.childElementCount > 40) return; // no saturar el DOM tapeando como loca
  const n = el('span', crit ? 'dmg crit' : 'dmg', crit ? `💥${fmt(amount)}` : fmt(amount));
  n.style.left = `${34 + Math.random() * 32}%`;
  n.style.top = `${28 + Math.random() * 24}%`;
  layer.appendChild(n);
  n.addEventListener('animationend', () => n.remove());
}

/** Luz ganada: monedita que vuela hacia el contador. */
export function luzGain(amount: number): void {
  const layer = floatLayer();
  const n = el('span', 'luz-fly', `⭐ +${fmt(amount)}`);
  n.style.left = `${40 + Math.random() * 20}%`;
  layer.appendChild(n);
  n.addEventListener('animationend', () => n.remove());
}

/** Explosión de emojis (críticos, jefes, milestones). */
export function emojiBurst(emojis: string[], count = 8, big = false): void {
  const layer = floatLayer();
  for (let i = 0; i < count; i++) {
    const n = el('span', big ? 'burst big' : 'burst', emojis[i % emojis.length]);
    n.style.left = `${20 + Math.random() * 60}%`;
    n.style.top = `${20 + Math.random() * 45}%`;
    n.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
    n.style.setProperty('--rot', `${(Math.random() - 0.5) * 240}deg`);
    n.style.animationDelay = `${Math.random() * 0.15}s`;
    layer.appendChild(n);
    n.addEventListener('animationend', () => n.remove());
  }
}

/** Sacudida de pantalla (críticos y jefes). */
export function shake(hard = false): void {
  const stage = $('#stage');
  stage.classList.remove('shake', 'shake-hard');
  void stage.offsetWidth; // reinicia la animación
  stage.classList.add(hard ? 'shake-hard' : 'shake');
}

/** Squish del enemigo al recibir un golpe. */
export function enemyHit(): void {
  const enemy = $('#enemy-sprite');
  enemy.classList.remove('hit');
  void enemy.offsetWidth;
  enemy.classList.add('hit');
}

/** Pop del enemigo al morir. */
export function enemyDefeated(): void {
  const enemy = $('#enemy-sprite');
  enemy.classList.remove('defeated');
  void enemy.offsetWidth;
  enemy.classList.add('defeated');
}

/** Aviso pequeño no bloqueante. */
export function toast(msg: string): void {
  const t = el('div', 'toast', msg);
  $('#toasts').appendChild(t);
  t.addEventListener('animationend', () => t.remove());
}
