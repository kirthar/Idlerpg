// ─── Renacer Estelar (prestige, zona 20) ─────────────────────────────────────
// Renacer reinicia el progreso de la partida a cambio de Polvo de Estrellas:
// cada Polvo en posesión da +2% de daño y Luz, y además se puede invertir en
// constelaciones permanentes. Amuletos, Mochi, constelaciones y las chicas
// reclutadas se conservan.
import { BAL, polvoGain } from '../core/balance';
import type { GameState } from '../core/state';
import { GIRLS } from './girls';

export interface ConstellationDef {
  id: string;
  icon: string;
  name: string;
  desc: (lvl: number) => string;
  baseCost: number;
  maxLevel: number;
}

export const CONSTELLATIONS: ConstellationDef[] = [
  { id: 'corazon', icon: '💞', name: 'Constelación del Corazón', baseCost: 3, maxLevel: 50, desc: l => `+${Math.round(BAL.constDamagePerLevel * 100 * l)}% daño total` },
  { id: 'luna', icon: '🌙', name: 'Constelación de la Luna', baseCost: 3, maxLevel: 50, desc: l => `+${Math.round(BAL.constLuzPerLevel * 100 * l)}% Luz obtenida` },
  { id: 'cometa', icon: '☄️', name: 'Constelación del Cometa', baseCost: 5, maxLevel: 10, desc: l => `+${BAL.constOfflineHoursPerLevel * l}h de tope de recompensa offline` },
  { id: 'aurora', icon: '🌅', name: 'Constelación de la Aurora', baseCost: 8, maxLevel: 20, desc: l => `Renaces en la zona ${1 + BAL.constStartZonesPerLevel * l}` },
];

export function constLevel(s: GameState, id: string): number {
  return s.constellations[id] ?? 0;
}

/** Coste del siguiente nivel de una constelación: base × 2^nivel. */
export function constCost(def: ConstellationDef, level: number): number {
  return def.baseCost * Math.pow(2, level);
}

export function buyConstellation(s: GameState, id: string): boolean {
  const def = CONSTELLATIONS.find(c => c.id === id);
  if (!def) return false;
  const level = constLevel(s, id);
  if (level >= def.maxLevel) return false;
  const cost = constCost(def, level);
  if (s.polvo < cost) return false;
  s.polvo -= cost;
  s.constellations[id] = level + 1;
  return true;
}

/** Polvo que daría renacer ahora mismo. */
export function pendingPolvo(s: GameState): number {
  return polvoGain(s.maxZone);
}

export function canPrestige(s: GameState): boolean {
  return s.maxZone >= BAL.prestigeMinZone && pendingPolvo(s) > 0;
}

/** Zona inicial tras renacer (mejorable con la Constelación de la Aurora). */
export function startZone(s: GameState): number {
  return 1 + BAL.constStartZonesPerLevel * constLevel(s, 'aurora');
}

/** Ejecuta el Renacer Estelar. Devuelve el Polvo ganado. */
export function prestige(s: GameState): number {
  const gained = pendingPolvo(s);
  if (gained <= 0) return 0;
  s.polvo += gained;
  s.renacimientos += 1;

  // Se reinicia el progreso de la partida…
  s.luz = 0;
  const zone = startZone(s);
  s.zone = zone;
  s.wave = 1;
  s.maxZone = zone;
  s.isBoss = false;
  s.bossFailed = false;
  s.bossTimeLeft = 0;
  s.combo = 0;
  s.comboTimeLeft = 0;
  for (const k of Object.keys(s.skills)) s.skills[k] = { cdLeft: 0, activeLeft: 0 };
  s.transform = { cdLeft: 0, activeLeft: 0 };

  // …pero las chicas reclutadas se quedan (a nivel 1), y amuletos, fragmentos,
  // Mochi, constelaciones y milestones (maxZoneEver) se conservan.
  for (const g of GIRLS) {
    if ((s.girls[g.id] ?? 0) > 0) s.girls[g.id] = 1;
  }
  return gained;
}
