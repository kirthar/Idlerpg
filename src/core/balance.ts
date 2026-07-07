// ─── Balance central del juego ───────────────────────────────────────────────
// Todas las curvas y constantes viven aquí para poder ajustar el juego
// tocando un solo archivo.

export const BAL = {
  // Combate
  enemyBaseHp: 10,
  zoneHpGrowth: 1.55, // HP ×1.55 por zona
  waveHpGrowth: 0.12, // +12% por oleada dentro de la zona
  wavesPerZone: 10, // la oleada 10 es el jefe
  bossHpMult: 8,
  bossTimeSec: 30,

  // Recompensas
  luzPerHp: 0.8, // Luz por punto de HP del enemigo derrotado
  bossLuzMult: 5,
  fragmentsPerBoss: 1, // fragmentos prismáticos que suelta cada jefe

  // Chicas
  girlCostGrowth: 1.15, // coste ×1.15 por nivel
  girlMilestoneEvery: 25, // cada 25 niveles la chica duplica su poder
  girlMilestoneMult: 2,

  // Críticos
  baseCritChance: 0.05,
  critMult: 3,
  maxCritChance: 0.5,

  // Combo de taps (dopamina): tapear rápido acumula combo que da bonus
  comboWindowSec: 1.2, // si no tapeas en este tiempo, el combo se pierde
  comboDamagePerStack: 0.02, // +2% daño de tap por stack
  comboMaxStacks: 50,

  // Habilidades activas
  rafaga: { durSec: 15, cdSec: 60, tapMult: 5 },
  lluvia: { cdSec: 90, dpsSeconds: 60 }, // golpe = 60 s de DPS

  // Transformación (henshin)
  transform: { durSec: 20, cdSec: 300, allMult: 10 },

  // Taller de amuletos (efecto por rango)
  amuletDamagePerTier: 0.25,
  amuletLuzPerTier: 0.25,
  amuletCritPerTier: 0.03,

  // Familiar (Mochi)
  petBaseCost: 1000,
  petCostGrowth: 2.2,
  petDamagePerLevel: 0.03,
  petLuzPerLevel: 0.03,

  // Prestige — Renacer Estelar
  prestigeMinZone: 20,
  prestigeZoneOffset: 15, // el polvo empieza a contar desde la zona 15
  prestigeExp: 1.9,
  polvoDamageBonus: 0.02, // +2% daño y Luz por Polvo de Estrellas en posesión

  // Constelaciones (mejoras permanentes compradas con Polvo)
  constDamagePerLevel: 0.1,
  constLuzPerLevel: 0.1,
  constOfflineHoursPerLevel: 2,
  constStartZonesPerLevel: 3,

  // Offline
  offlineBaseCapHours: 4,
  offlineMaxKillsPerSec: 2,
  offlineMinSec: 60, // por debajo de esto no se muestra el cofre
} as const;

/** HP de un enemigo normal en una zona/oleada dadas. */
export function enemyHp(zone: number, wave: number): number {
  return BAL.enemyBaseHp * Math.pow(BAL.zoneHpGrowth, zone - 1) * (1 + BAL.waveHpGrowth * (wave - 1));
}

/** HP del jefe de una zona. */
export function bossHp(zone: number): number {
  return enemyHp(zone, BAL.wavesPerZone) * BAL.bossHpMult;
}

/** Luz base (sin multiplicadores) por derrotar a un enemigo. */
export function luzReward(zone: number, wave: number, isBoss: boolean): number {
  const hp = isBoss ? bossHp(zone) : enemyHp(zone, wave);
  return hp * BAL.luzPerHp * (isBoss ? BAL.bossLuzMult : 1);
}

/** Coste del siguiente nivel de una chica. */
export function girlLevelCost(baseCost: number, level: number): number {
  return baseCost * Math.pow(BAL.girlCostGrowth, level);
}

/** Coste de comprar `count` niveles desde `level` (suma geométrica cerrada). */
export function girlLevelCostBulk(baseCost: number, level: number, count: number): number {
  const r = BAL.girlCostGrowth;
  return baseCost * Math.pow(r, level) * (Math.pow(r, count) - 1) / (r - 1);
}

/** Cuántos niveles se pueden comprar con `luz` disponible. */
export function girlMaxAffordable(baseCost: number, level: number, luz: number): number {
  const r = BAL.girlCostGrowth;
  const first = girlLevelCost(baseCost, level);
  if (luz < first) return 0;
  // luz >= first * (r^n - 1)/(r - 1)  →  n = log_r(luz*(r-1)/first + 1)
  const n = Math.floor(Math.log(luz * (r - 1) / first + 1) / Math.log(r));
  return Math.max(1, n);
}

/** Multiplicador por hitos de nivel de chica (×2 cada 25 niveles). */
export function girlMilestoneMult(level: number): number {
  return Math.pow(BAL.girlMilestoneMult, Math.floor(level / BAL.girlMilestoneEvery));
}

/** Polvo de Estrellas que otorgaría renacer con esta zona máxima. */
export function polvoGain(maxZone: number): number {
  if (maxZone < BAL.prestigeMinZone) return 0;
  return Math.floor(Math.pow((maxZone - BAL.prestigeZoneOffset) / 2, BAL.prestigeExp));
}

/** Coste del siguiente nivel del familiar. */
export function petCost(level: number): number {
  return BAL.petBaseCost * Math.pow(BAL.petCostGrowth, level);
}
