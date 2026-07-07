// ─── Taller de Amuletos (zona 12) ────────────────────────────────────────────
// Los jefes sueltan fragmentos prismáticos; aquí se forjan amuletos con
// multiplicadores permanentes que sobreviven al Renacer Estelar.
import { BAL } from '../core/balance';
import type { GameState } from '../core/state';

export interface AmuletDef {
  id: string;
  icon: string;
  name: string;
  effectDesc: (tier: number) => string;
}

export const AMULETS: AmuletDef[] = [
  { id: 'corazon', icon: '💗', name: 'Corazón Rosa', effectDesc: t => `+${Math.round(BAL.amuletDamagePerTier * 100 * t)}% daño total` },
  { id: 'lazo', icon: '🎀', name: 'Lazo Lunar', effectDesc: t => `+${Math.round(BAL.amuletLuzPerTier * 100 * t)}% Luz obtenida` },
  { id: 'estrella', icon: '🌠', name: 'Estrella Fugaz', effectDesc: t => `+${Math.round(BAL.amuletCritPerTier * 100 * t)}% prob. de crítico` },
];

export function amuletTier(s: GameState, id: string): number {
  return s.amulets[id] ?? 0;
}

/** Coste en fragmentos del siguiente rango: 3, 5, 7, 9… */
export function amuletCost(tier: number): number {
  return 3 + tier * 2;
}

export function forgeAmulet(s: GameState, id: string): boolean {
  const tier = amuletTier(s, id);
  const cost = amuletCost(tier);
  if (s.fragmentos < cost) return false;
  s.fragmentos -= cost;
  s.amulets[id] = tier + 1;
  return true;
}
