// ─── Combate: oleadas, jefes con temporizador y recompensas ──────────────────
import { BAL, bossHp, enemyHp, luzReward } from '../core/balance';
import type { GameState } from '../core/state';
import { critChance, luzMult, tapDamage, teamDps } from '../core/stats';
import { GIRLS, joinGirl } from './girls';
import { MILESTONES, milestonesAtZone, type MilestoneDef } from './milestones';
import { activateSkill, tickSkills } from './skills';

export type CombatEvent =
  | { type: 'hit'; amount: number; crit: boolean; source: 'tap' | 'dps' | 'skill' }
  | { type: 'kill'; luz: number }
  | { type: 'boss-defeated'; luz: number; fragmentos: number }
  | { type: 'boss-failed' }
  | { type: 'zone-up'; zone: number; milestones: MilestoneDef[]; girlsJoined: string[] }
  | { type: 'combo-lost'; had: number };

/** Crea el enemigo correspondiente a la zona/oleada actuales. */
export function spawnEnemy(s: GameState): void {
  s.isBoss = s.wave >= BAL.wavesPerZone;
  s.enemyMaxHp = s.isBoss ? bossHp(s.zone) : enemyHp(s.zone, s.wave);
  s.enemyHp = s.enemyMaxHp;
  s.bossTimeLeft = s.isBoss ? BAL.bossTimeSec : 0;
}

/** Especie del enemigo actual (solo para el arte, determinista). */
export function enemyKind(zone: number, wave: number, isBoss: boolean): number {
  if (isBoss) return -1;
  return (zone * 7 + wave) % 5;
}

function grantLuz(s: GameState, amount: number): number {
  const total = amount * luzMult(s);
  s.luz += total;
  s.stats.luzTotal += total;
  return total;
}

function onEnemyDefeated(s: GameState, events: CombatEvent[]): void {
  s.stats.kills += 1;
  const base = luzReward(s.zone, s.wave, s.isBoss);
  const luz = grantLuz(s, base);

  if (s.isBoss) {
    s.stats.bosses += 1;
    s.fragmentos += BAL.fragmentsPerBoss;
    events.push({ type: 'boss-defeated', luz, fragmentos: BAL.fragmentsPerBoss });
    s.zone += 1;
    s.wave = 1;
    s.bossFailed = false;
    if (s.zone > s.maxZone) s.maxZone = s.zone;
    const isNewEver = s.zone > s.maxZoneEver;
    if (isNewEver) s.maxZoneEver = s.zone;
    const unlocked = isNewEver ? milestonesAtZone(s.zone) : [];
    const joined: string[] = [];
    for (const g of GIRLS) {
      if (g.unlockZone === s.zone && !(s.girls[g.id] > 0)) {
        joinGirl(s, g.id);
        joined.push(g.id);
      }
    }
    events.push({ type: 'zone-up', zone: s.zone, milestones: unlocked, girlsJoined: joined });
  } else {
    events.push({ type: 'kill', luz });
    s.wave += 1;
  }
  spawnEnemy(s);
}

/** Aplica daño directo al enemigo actual. */
export function dealDamage(s: GameState, amount: number, source: 'tap' | 'dps' | 'skill', crit: boolean, events: CombatEvent[]): void {
  if (amount <= 0 || s.enemyHp <= 0) return;
  s.enemyHp -= amount;
  events.push({ type: 'hit', amount, crit, source });
  if (s.enemyHp <= 0) onEnemyDefeated(s, events);
}

/** Tap del jugador: daño + combo + posible crítico. */
export function playerTap(s: GameState, rng: () => number = Math.random): CombatEvent[] {
  const events: CombatEvent[] = [];
  s.stats.taps += 1;
  s.combo = Math.min(BAL.comboMaxStacks, s.combo + 1);
  s.comboTimeLeft = BAL.comboWindowSec;
  const crit = rng() < critChance(s);
  const dmg = tapDamage(s) * (crit ? BAL.critMult : 1);
  dealDamage(s, dmg, 'tap', crit, events);
  return events;
}

/** Usa una habilidad; la Lluvia Estelar descarga daño instantáneo. */
export function useSkill(s: GameState, id: string): CombatEvent[] {
  const events: CombatEvent[] = [];
  const result = activateSkill(s, id);
  if (result === 'instant' && id === 'lluvia') {
    const dmg = teamDps(s) * BAL.lluvia.dpsSeconds;
    dealDamage(s, dmg, 'skill', false, events);
  }
  return events;
}

/** Reintenta el jefe tras fallar el temporizador. */
export function retryBoss(s: GameState): void {
  if (!s.bossFailed) return;
  s.bossFailed = false;
  s.wave = BAL.wavesPerZone;
  spawnEnemy(s);
}

/** Tick de combate: DPS del equipo, temporizador del jefe, combo y cooldowns. */
export function tickCombat(s: GameState, dt: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  tickSkills(s, dt);

  if (s.combo > 0) {
    s.comboTimeLeft -= dt;
    if (s.comboTimeLeft <= 0) {
      events.push({ type: 'combo-lost', had: s.combo });
      s.combo = 0;
      s.comboTimeLeft = 0;
    }
  }

  const dps = teamDps(s);
  if (dps > 0) dealDamage(s, dps * dt, 'dps', false, events);

  // El temporizador del jefe corre después del daño: si ha muerto ya no aplica.
  if (s.isBoss && s.enemyHp > 0) {
    s.bossTimeLeft -= dt;
    if (s.bossTimeLeft <= 0) {
      s.bossFailed = true;
      s.wave = BAL.wavesPerZone - 1;
      spawnEnemy(s);
      events.push({ type: 'boss-failed' });
    }
  }
  return events;
}

/** Requisito de zona de la siguiente mecánica (para el panel de objetivo). */
export function zonesToNext(s: GameState): number | undefined {
  const next = MILESTONES.find(m => s.maxZoneEver < m.zone);
  return next ? next.zone - s.zone : undefined;
}
