// ─── Habilidades activas (zona 5) y Transformación (zona 8) ─────────────────
import { BAL } from '../core/balance';
import type { GameState, SkillState } from '../core/state';

export interface SkillDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  durSec: number;
  cdSec: number;
}

export const SKILLS: SkillDef[] = [
  { id: 'rafaga', icon: '💗', name: 'Ráfaga Prisma', desc: `Daño de tap ×${BAL.rafaga.tapMult} durante ${BAL.rafaga.durSec} s`, durSec: BAL.rafaga.durSec, cdSec: BAL.rafaga.cdSec },
  { id: 'lluvia', icon: '🌟', name: 'Lluvia Estelar', desc: `Golpe instantáneo: ${BAL.lluvia.dpsSeconds} s de DPS de golpe`, durSec: 0, cdSec: BAL.lluvia.cdSec },
];

export function skillState(s: GameState, id: string): SkillState {
  return s.skills[id] ?? { cdLeft: 0, activeLeft: 0 };
}

export function isSkillReady(s: GameState, id: string): boolean {
  return skillState(s, id).cdLeft <= 0;
}

export function isSkillActive(s: GameState, id: string): boolean {
  return skillState(s, id).activeLeft > 0;
}

/**
 * Activa una habilidad si está lista. La Lluvia Estelar es instantánea:
 * el llamador aplica el daño (devuelve 'instant').
 */
export function activateSkill(s: GameState, id: string): 'started' | 'instant' | false {
  const def = SKILLS.find(x => x.id === id);
  if (!def || !isSkillReady(s, id)) return false;
  s.skills[id] = { cdLeft: def.cdSec, activeLeft: def.durSec };
  return def.durSec > 0 ? 'started' : 'instant';
}

export function activateTransform(s: GameState): boolean {
  if (s.transform.cdLeft > 0) return false;
  s.transform = { cdLeft: BAL.transform.cdSec, activeLeft: BAL.transform.durSec };
  return true;
}

export function isTransformed(s: GameState): boolean {
  return s.transform.activeLeft > 0;
}

/** Avanza cooldowns y duraciones. */
export function tickSkills(s: GameState, dt: number): void {
  for (const k of Object.keys(s.skills)) {
    const st = s.skills[k];
    st.cdLeft = Math.max(0, st.cdLeft - dt);
    st.activeLeft = Math.max(0, st.activeLeft - dt);
  }
  s.transform.cdLeft = Math.max(0, s.transform.cdLeft - dt);
  s.transform.activeLeft = Math.max(0, s.transform.activeLeft - dt);
}
