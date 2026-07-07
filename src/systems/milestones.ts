// ─── Milestones: cada zona clave desbloquea una mecánica nueva ───────────────
import type { GameState } from '../core/state';

export interface MilestoneDef {
  zone: number;
  id: string;
  icon: string;
  title: string;
  desc: string;
}

export const MILESTONES: MilestoneDef[] = [
  { zone: 3, id: 'auto', icon: '🌸', title: '¡Hana se une al equipo!', desc: 'Auto-ataque desbloqueado: el equipo lucha solo mientras descansas' },
  { zone: 5, id: 'skills', icon: '💫', title: 'Habilidades activas', desc: 'Ráfaga Prisma y Lluvia Estelar: botones de poder con enfriamiento' },
  { zone: 8, id: 'transform', icon: '⭐', title: '¡Mira se une! + Transformación', desc: 'Henshin: ×10 a todo el daño durante 20 segundos' },
  { zone: 12, id: 'forge', icon: '🔮', title: 'Taller de Amuletos', desc: 'Forja amuletos con fragmentos de jefe: multiplicadores permanentes' },
  { zone: 15, id: 'pet', icon: '🐰', title: '¡Yuki se une! + Familiar Mochi', desc: 'Alimenta a Mochi con Luz: bonus pasivos que crecen contigo' },
  { zone: 20, id: 'prestige', icon: '✨', title: 'Renacer Estelar', desc: 'Renace con Polvo de Estrellas: multiplicadores permanentes y constelaciones' },
  { zone: 25, id: 'sora', icon: '🌈', title: '¡Sora se une al equipo!', desc: 'La quinta Prisma Girl: +25% a TODO' },
];

/** Las mecánicas desbloqueadas no se pierden al renacer (usa maxZoneEver). */
export function isUnlocked(s: GameState, id: string): boolean {
  const m = MILESTONES.find(x => x.id === id);
  return !!m && s.maxZoneEver >= m.zone;
}

/** Próximo milestone pendiente (objetivo a la vista, siempre). */
export function nextMilestone(s: GameState): MilestoneDef | undefined {
  return MILESTONES.find(m => s.maxZoneEver < m.zone);
}

/** Milestones que se acaban de alcanzar al llegar a `zone` (para celebrarlos). */
export function milestonesAtZone(zone: number): MilestoneDef[] {
  return MILESTONES.filter(m => m.zone === zone);
}
