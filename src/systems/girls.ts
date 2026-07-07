// ─── Las Prisma Girls ────────────────────────────────────────────────────────
import { BAL, girlLevelCost, girlLevelCostBulk, girlMaxAffordable, girlMilestoneMult } from '../core/balance';
import type { GameState } from '../core/state';

export type PassiveKind = 'dps' | 'crit' | 'luz' | 'all';

export interface GirlDef {
  id: string;
  name: string;
  title: string;
  element: string;
  /** Paleta kawaii de la chica (pelo, vestido, acento) */
  colors: { hair: string; dress: string; accent: string };
  hairstyle: 'twintails' | 'bob' | 'long' | 'ponytail' | 'buns';
  unlockZone: number;
  baseCost: number;
  basePower: number; // daño de tap (Lumi) o DPS (resto)
  isTapper: boolean; // Lumi potencia el tap; las demás dan DPS
  passive: { kind: PassiveKind; value: number; desc: string };
}

export const GIRLS: GirlDef[] = [
  {
    id: 'lumi', name: 'Lumi', title: 'Corazón de Luz', element: 'Luz',
    colors: { hair: '#ff9ec7', dress: '#ffd6e8', accent: '#ff5fa2' },
    hairstyle: 'twintails', unlockZone: 1, baseCost: 5, basePower: 1, isTapper: true,
    passive: { kind: 'all', value: 0, desc: 'La líder: tu toque canaliza su magia' },
  },
  {
    id: 'hana', name: 'Hana', title: 'Pétalo Danzarín', element: 'Flor',
    colors: { hair: '#8fd6a8', dress: '#d9f5e3', accent: '#3dbd77' },
    hairstyle: 'bob', unlockZone: 3, baseCost: 50, basePower: 4, isTapper: false,
    passive: { kind: 'dps', value: 0.25, desc: '+25% DPS del equipo' },
  },
  {
    id: 'mira', name: 'Mira', title: 'Destello Fugaz', element: 'Estrella',
    colors: { hair: '#c5a3ff', dress: '#eadcff', accent: '#8a5cf5' },
    hairstyle: 'long', unlockZone: 8, baseCost: 2500, basePower: 45, isTapper: false,
    passive: { kind: 'crit', value: 0.07, desc: '+7% probabilidad de crítico' },
  },
  {
    id: 'yuki', name: 'Yuki', title: 'Escarcha Dulce', element: 'Hielo',
    colors: { hair: '#9edbff', dress: '#dff3ff', accent: '#3fa9e8' },
    hairstyle: 'ponytail', unlockZone: 15, baseCost: 500_000, basePower: 700, isTapper: false,
    passive: { kind: 'luz', value: 0.3, desc: '+30% de Luz obtenida' },
  },
  {
    id: 'sora', name: 'Sora', title: 'Cielo Radiante', element: 'Cielo',
    colors: { hair: '#ffd98f', dress: '#fff3d6', accent: '#f5a623' },
    hairstyle: 'buns', unlockZone: 25, baseCost: 500_000_000, basePower: 25_000, isTapper: false,
    passive: { kind: 'all', value: 0.25, desc: '+25% a TODO el daño' },
  },
];

export const GIRL_BY_ID: Record<string, GirlDef> = Object.fromEntries(GIRLS.map(g => [g.id, g]));

export function girlLevel(s: GameState, id: string): number {
  return s.girls[id] ?? 0;
}

export function isGirlUnlocked(s: GameState, id: string): boolean {
  return girlLevel(s, id) > 0;
}

/** Poder propio de la chica (sin multiplicadores globales). */
export function girlPower(def: GirlDef, level: number): number {
  if (level <= 0) return 0;
  return def.basePower * level * girlMilestoneMult(level);
}

export function nextLevelCost(def: GirlDef, level: number): number {
  return girlLevelCost(def.baseCost, level);
}

export function bulkCost(def: GirlDef, level: number, count: number): number {
  return girlLevelCostBulk(def.baseCost, level, count);
}

export function maxAffordable(def: GirlDef, level: number, luz: number): number {
  return girlMaxAffordable(def.baseCost, level, luz);
}

/**
 * Compra `count` niveles si hay Luz suficiente. Devuelve los niveles comprados.
 * count = 'max' compra todos los que se puedan pagar.
 */
export function buyLevels(s: GameState, id: string, count: number | 'max'): number {
  const def = GIRL_BY_ID[id];
  if (!def || !isGirlUnlocked(s, id)) return 0;
  const level = girlLevel(s, id);
  const n = count === 'max' ? maxAffordable(def, level, s.luz) : count;
  if (n <= 0) return 0;
  const cost = bulkCost(def, level, n);
  if (s.luz < cost) return 0;
  s.luz -= cost;
  s.girls[id] = level + n;
  return n;
}

/** Se llama al alcanzar la zona de una chica: se une al equipo a nivel 1. */
export function joinGirl(s: GameState, id: string): void {
  if (!isGirlUnlocked(s, id)) s.girls[id] = 1;
}

/** Niveles que faltan para el próximo hito ×2 de la chica. */
export function levelsToMilestone(level: number): number {
  return BAL.girlMilestoneEvery - (level % BAL.girlMilestoneEvery);
}
