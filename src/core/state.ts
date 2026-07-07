// ─── Estado del juego ────────────────────────────────────────────────────────

export interface SkillState {
  cdLeft: number; // segundos de enfriamiento restantes
  activeLeft: number; // segundos de efecto restantes
}

export interface GameState {
  version: number;
  createdAt: number;
  lastSeen: number;

  // Monedas
  luz: number;
  polvo: number; // Polvo de Estrellas (prestige)
  fragmentos: number; // fragmentos prismáticos (jefes → taller)

  // Progreso
  zone: number;
  wave: number; // 1..9 normales; 10 = jefe
  maxZone: number; // zona máxima de esta vida (para polvo)
  maxZoneEver: number; // zona máxima histórica (los milestones no se pierden)
  renacimientos: number;

  // Enemigo actual
  enemyHp: number;
  enemyMaxHp: number;
  isBoss: boolean;
  bossTimeLeft: number;
  bossFailed: boolean; // el jefe venció al timer: farmeamos oleada 9 hasta reintentar

  // Equipo
  girls: Record<string, number>; // id → nivel (0 = no se ha unido aún)
  skills: Record<string, SkillState>;
  transform: SkillState;

  // Sistemas desbloqueables
  amulets: Record<string, number>; // id → rango
  petLevel: number;
  constellations: Record<string, number>; // id → nivel

  // Combo de taps
  combo: number;
  comboTimeLeft: number;

  // Ajustes y stats
  soundOn: boolean;
  stats: { taps: number; kills: number; bosses: number; luzTotal: number };
}

export const SAVE_VERSION = 1;

export function newGame(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    luz: 0,
    polvo: 0,
    fragmentos: 0,
    zone: 1,
    wave: 1,
    maxZone: 1,
    maxZoneEver: 1,
    renacimientos: 0,
    enemyHp: 0, // combat.spawnEnemy lo rellena al arrancar
    enemyMaxHp: 0,
    isBoss: false,
    bossTimeLeft: 0,
    bossFailed: false,
    girls: { lumi: 1 }, // Lumi empieza en el equipo
    skills: {},
    transform: { cdLeft: 0, activeLeft: 0 },
    amulets: {},
    petLevel: 0,
    constellations: {},
    combo: 0,
    comboTimeLeft: 0,
    soundOn: true,
    stats: { taps: 0, kills: 0, bosses: 0, luzTotal: 0 },
  };
}
