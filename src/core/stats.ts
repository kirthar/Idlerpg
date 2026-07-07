// ─── Estadísticas derivadas: aquí se ve cómo TODO multiplica a TODO ──────────
import { BAL } from './balance';
import type { GameState } from './state';
import { GIRLS, GIRL_BY_ID, girlLevel, girlPower, isGirlUnlocked } from '../systems/girls';
import { amuletTier } from '../systems/forge';
import { petDamageBonus, petLuzBonus } from '../systems/pet';
import { constLevel } from '../systems/prestige';
import { isSkillActive, isTransformed } from '../systems/skills';
import { isUnlocked } from '../systems/milestones';

/** Multiplicador de daño global: polvo × amuletos × constelaciones × Mochi × pasivas × henshin. */
export function damageMult(s: GameState): number {
  let m = 1;
  m *= 1 + BAL.polvoDamageBonus * s.polvo;
  m *= 1 + BAL.amuletDamagePerTier * amuletTier(s, 'corazon');
  m *= 1 + BAL.constDamagePerLevel * constLevel(s, 'corazon');
  m *= 1 + petDamageBonus(s);
  for (const g of GIRLS) {
    if (g.passive.kind === 'all' && g.passive.value > 0 && isGirlUnlocked(s, g.id)) m *= 1 + g.passive.value;
  }
  if (isTransformed(s)) m *= BAL.transform.allMult;
  return m;
}

/** Multiplicador de Luz obtenida. */
export function luzMult(s: GameState): number {
  let m = 1;
  m *= 1 + BAL.polvoDamageBonus * s.polvo;
  m *= 1 + BAL.amuletLuzPerTier * amuletTier(s, 'lazo');
  m *= 1 + BAL.constLuzPerLevel * constLevel(s, 'luna');
  m *= 1 + petLuzBonus(s);
  for (const g of GIRLS) {
    if (g.passive.kind === 'luz' && isGirlUnlocked(s, g.id)) m *= 1 + g.passive.value;
  }
  return m;
}

/** Probabilidad de crítico (tap): base + Mira + Estrella Fugaz. */
export function critChance(s: GameState): number {
  let c = BAL.baseCritChance;
  for (const g of GIRLS) {
    if (g.passive.kind === 'crit' && isGirlUnlocked(s, g.id)) c += g.passive.value;
  }
  c += BAL.amuletCritPerTier * amuletTier(s, 'estrella');
  return Math.min(BAL.maxCritChance, c);
}

/** Daño de un tap (sin tirar el crítico; el combate decide si critica). */
export function tapDamage(s: GameState): number {
  const lumi = GIRL_BY_ID['lumi'];
  let dmg = girlPower(lumi, girlLevel(s, 'lumi'));
  dmg *= damageMult(s);
  dmg *= 1 + BAL.comboDamagePerStack * s.combo;
  if (isSkillActive(s, 'rafaga')) dmg *= BAL.rafaga.tapMult;
  return dmg;
}

/** DPS del equipo (auto-ataque; 0 hasta que Hana se une en la zona 3). */
export function teamDps(s: GameState): number {
  if (!isUnlocked(s, 'auto')) return 0;
  let dps = 0;
  for (const g of GIRLS) {
    if (!g.isTapper) dps += girlPower(g, girlLevel(s, g.id));
  }
  dps *= damageMult(s);
  for (const g of GIRLS) {
    if (g.passive.kind === 'dps' && isGirlUnlocked(s, g.id)) dps *= 1 + g.passive.value;
  }
  return dps;
}

/** Tope de horas de recompensa offline. */
export function offlineCapHours(s: GameState): number {
  return BAL.offlineBaseCapHours + BAL.constOfflineHoursPerLevel * constLevel(s, 'cometa');
}
