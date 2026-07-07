// ─── Recompensa offline: el cofre que te espera al volver ────────────────────
import { BAL, enemyHp, luzReward } from './balance';
import type { GameState } from './state';
import { luzMult, offlineCapHours, teamDps } from './stats';

export interface OfflineReward {
  luz: number;
  seconds: number; // tiempo realmente contabilizado (tras el tope)
  capped: boolean;
}

/**
 * Calcula lo que el equipo ha farmeado mientras la app estaba cerrada.
 * Modelo: el equipo mata enemigos normales de la zona actual a un ritmo de
 * DPS/HP muertes por segundo (con tope), y cada muerte da su Luz habitual.
 */
export function computeOffline(s: GameState, elapsedSec: number): OfflineReward | undefined {
  if (elapsedSec < BAL.offlineMinSec) return undefined;
  const dps = teamDps(s);
  if (dps <= 0) return undefined;

  const capSec = offlineCapHours(s) * 3600;
  const counted = Math.min(elapsedSec, capSec);
  const wave = Math.min(s.wave, BAL.wavesPerZone - 1); // offline no pelea contra jefes
  const hp = enemyHp(s.zone, wave);
  const killsPerSec = Math.min(BAL.offlineMaxKillsPerSec, dps / hp);
  const kills = killsPerSec * counted;
  const luz = kills * luzReward(s.zone, wave, false) * luzMult(s);
  if (luz <= 0) return undefined;
  return { luz, seconds: counted, capped: elapsedSec > capSec };
}

/** Aplica la recompensa al estado (cuando el jugador abre el cofre). */
export function claimOffline(s: GameState, reward: OfflineReward): void {
  s.luz += reward.luz;
  s.stats.luzTotal += reward.luz;
}
