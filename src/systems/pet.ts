// ─── Mochi, el familiar kawaii (zona 15) ─────────────────────────────────────
// Se alimenta con Luz; cada nivel da bonus pasivos permanentes.
import { BAL, petCost } from '../core/balance';
import type { GameState } from '../core/state';

export function feedCost(s: GameState): number {
  return petCost(s.petLevel);
}

export function feedPet(s: GameState): boolean {
  const cost = feedCost(s);
  if (s.luz < cost) return false;
  s.luz -= cost;
  s.petLevel += 1;
  return true;
}

export function petDamageBonus(s: GameState): number {
  return BAL.petDamagePerLevel * s.petLevel;
}

export function petLuzBonus(s: GameState): number {
  return BAL.petLuzPerLevel * s.petLevel;
}

/** Estado de ánimo de Mochi según nivel (solo cosmético kawaii). */
export function petMood(level: number): string {
  if (level === 0) return 'Mochi tiene hambre… 🥺';
  if (level < 5) return 'Mochi está contento ♪';
  if (level < 15) return '¡Mochi brilla de felicidad! ✧';
  if (level < 30) return '¡¡Mochi resplandece!! ✧✧';
  return 'Mochi es pura luz estelar ✧✧✧';
}
