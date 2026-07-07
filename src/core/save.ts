// ─── Guardado en localStorage con migración por versión ──────────────────────
import { newGame, SAVE_VERSION, type GameState } from './state';

const KEY = 'prismaGirlsSave';

export function saveGame(s: GameState, storage: Storage = localStorage): void {
  s.lastSeen = Date.now();
  try {
    storage.setItem(KEY, JSON.stringify(s));
  } catch {
    // almacenamiento lleno o bloqueado: el juego sigue, solo no persiste
  }
}

export function loadGame(storage: Storage = localStorage): GameState | undefined {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return undefined;
    const data = JSON.parse(raw) as Partial<GameState>;
    if (typeof data.version !== 'number' || data.version > SAVE_VERSION) return undefined;
    // Migración defensiva: cualquier campo nuevo toma el valor de una partida nueva
    const base = newGame();
    return { ...base, ...data, stats: { ...base.stats, ...data.stats }, version: SAVE_VERSION } as GameState;
  } catch {
    return undefined;
  }
}

export function wipeSave(storage: Storage = localStorage): void {
  try {
    storage.removeItem(KEY);
  } catch { /* nada */ }
}
