import { describe, expect, it } from 'vitest';
import { BAL } from '../src/core/balance';
import { computeOffline } from '../src/core/offline';
import { newGame } from '../src/core/state';
import { tapDamage, teamDps } from '../src/core/stats';
import { playerTap, retryBoss, spawnEnemy, tickCombat, useSkill, type CombatEvent } from '../src/systems/combat';
import { buyLevels, GIRL_BY_ID, nextLevelCost } from '../src/systems/girls';
import { isUnlocked, nextMilestone } from '../src/systems/milestones';
import { canPrestige, pendingPolvo, prestige } from '../src/systems/prestige';
import { forgeAmulet } from '../src/systems/forge';
import { feedPet } from '../src/systems/pet';

const noCrit = () => 1; // rng que nunca critica

function freshGame() {
  const s = newGame();
  spawnEnemy(s);
  return s;
}

describe('combate básico', () => {
  it('el tap daña y al matar da Luz y avanza la oleada', () => {
    const s = freshGame();
    expect(s.enemyHp).toBe(10);
    const events: CombatEvent[] = [];
    for (let i = 0; i < 20 && s.wave === 1; i++) events.push(...playerTap(s, noCrit));
    expect(s.wave).toBe(2);
    expect(s.luz).toBeGreaterThan(0);
    expect(events.some(e => e.type === 'kill')).toBe(true);
  });

  it('la oleada 10 es un jefe con temporizador y fallar te devuelve a la 9', () => {
    const s = freshGame();
    s.wave = 10;
    spawnEnemy(s);
    expect(s.isBoss).toBe(true);
    expect(s.bossTimeLeft).toBe(BAL.bossTimeSec);
    const events = tickCombat(s, BAL.bossTimeSec + 1);
    expect(events.some(e => e.type === 'boss-failed')).toBe(true);
    expect(s.bossFailed).toBe(true);
    expect(s.wave).toBe(9);
    retryBoss(s);
    expect(s.wave).toBe(10);
    expect(s.isBoss).toBe(true);
  });

  it('derrotar al jefe sube de zona, da fragmentos y dispara milestones', () => {
    const s = freshGame();
    s.zone = 2;
    s.maxZone = 2;
    s.maxZoneEver = 2;
    s.wave = 10;
    spawnEnemy(s);
    s.girls.lumi = 1000; // fuerza bruta para el test
    const events = playerTap(s, noCrit);
    expect(s.zone).toBe(3);
    expect(s.fragmentos).toBe(1);
    const zoneUp = events.find(e => e.type === 'zone-up');
    expect(zoneUp && zoneUp.type === 'zone-up' && zoneUp.milestones.some(m => m.id === 'auto')).toBe(true);
    expect(zoneUp && zoneUp.type === 'zone-up' && zoneUp.girlsJoined).toContain('hana');
    expect(isUnlocked(s, 'auto')).toBe(true);
  });

  it('el combo sube al tapear y se pierde al expirar', () => {
    const s = freshGame();
    playerTap(s, noCrit);
    playerTap(s, noCrit);
    expect(s.combo).toBe(2);
    const events = tickCombat(s, BAL.comboWindowSec + 0.1);
    expect(events.some(e => e.type === 'combo-lost')).toBe(true);
    expect(s.combo).toBe(0);
  });
});

describe('chicas y compras', () => {
  it('subir de nivel cuesta Luz y aumenta el daño', () => {
    const s = freshGame();
    const before = tapDamage(s);
    s.luz = nextLevelCost(GIRL_BY_ID.lumi, 1) + 1;
    expect(buyLevels(s, 'lumi', 1)).toBe(1);
    expect(s.girls.lumi).toBe(2);
    expect(tapDamage(s)).toBeGreaterThan(before);
  });

  it('no se puede comprar sin Luz ni mejorar chicas no reclutadas', () => {
    const s = freshGame();
    s.luz = 0;
    expect(buyLevels(s, 'lumi', 1)).toBe(0);
    s.luz = 1e12;
    expect(buyLevels(s, 'sora', 1)).toBe(0); // Sora aún no se ha unido
  });

  it('el DPS es 0 hasta el milestone de auto-ataque', () => {
    const s = freshGame();
    s.girls.hana = 10;
    expect(teamDps(s)).toBe(0);
    s.maxZoneEver = 3;
    expect(teamDps(s)).toBeGreaterThan(0);
  });
});

describe('habilidades', () => {
  it('la Lluvia Estelar descarga 60 s de DPS y entra en cooldown', () => {
    const s = freshGame();
    s.maxZoneEver = 5;
    s.girls.hana = 5;
    s.zone = 5;
    s.wave = 1;
    spawnEnemy(s);
    const hpBefore = s.enemyHp;
    useSkill(s, 'lluvia');
    expect(s.enemyHp < hpBefore || s.wave > 1 || s.luz > 0).toBe(true);
    expect(s.skills.lluvia.cdLeft).toBe(BAL.lluvia.cdSec);
    expect(useSkill(s, 'lluvia')).toEqual([]); // en cooldown: no hace nada
  });
});

describe('offline', () => {
  it('sin auto-ataque no hay cofre', () => {
    const s = freshGame();
    expect(computeOffline(s, 3600)).toBeUndefined();
  });

  it('acumula Luz y respeta el tope de horas', () => {
    const s = freshGame();
    s.maxZoneEver = 5;
    s.zone = 5;
    s.girls.hana = 20;
    const oneHour = computeOffline(s, 3600)!;
    expect(oneHour.luz).toBeGreaterThan(0);
    expect(oneHour.capped).toBe(false);
    const capSec = BAL.offlineBaseCapHours * 3600;
    const week = computeOffline(s, 7 * 24 * 3600)!;
    expect(week.capped).toBe(true);
    expect(week.seconds).toBe(capSec);
    expect(week.luz).toBeCloseTo(oneHour.luz * BAL.offlineBaseCapHours, 4);
  });

  it('menos de un minuto no muestra cofre', () => {
    const s = freshGame();
    s.maxZoneEver = 3;
    s.girls.hana = 20;
    expect(computeOffline(s, 30)).toBeUndefined();
  });
});

describe('renacer estelar', () => {
  it('no se puede renacer antes de la zona 20', () => {
    const s = freshGame();
    s.maxZone = 19;
    expect(canPrestige(s)).toBe(false);
    expect(prestige(s)).toBe(0);
  });

  it('renacer da polvo, reinicia la partida y conserva lo permanente', () => {
    const s = freshGame();
    s.zone = 24;
    s.maxZone = 24;
    s.maxZoneEver = 24;
    s.luz = 9e9;
    s.girls = { lumi: 300, hana: 250, mira: 200, yuki: 100 };
    s.amulets = { corazon: 3 };
    s.petLevel = 7;
    s.fragmentos = 4;
    const expected = pendingPolvo(s);
    expect(canPrestige(s)).toBe(true);
    const gained = prestige(s);
    expect(gained).toBe(expected);
    expect(s.polvo).toBe(expected);
    expect(s.luz).toBe(0);
    expect(s.zone).toBe(1);
    expect(s.girls.lumi).toBe(1);
    expect(s.girls.yuki).toBe(1); // reclutada se queda, a nivel 1
    expect(s.amulets.corazon).toBe(3); // los amuletos sobreviven
    expect(s.petLevel).toBe(7); // Mochi también
    expect(s.maxZoneEver).toBe(24); // los milestones no se pierden
    expect(isUnlocked(s, 'prestige')).toBe(true);
    expect(s.renacimientos).toBe(1);
  });

  it('el polvo multiplica el daño: renacer potencia todo lo anterior', () => {
    const s = freshGame();
    const before = tapDamage(s);
    s.polvo = 50;
    expect(tapDamage(s)).toBeCloseTo(before * 2); // 50 × 2% = +100%
  });
});

describe('taller y familiar', () => {
  it('forjar amuletos consume fragmentos y sube el rango', () => {
    const s = freshGame();
    s.fragmentos = 3;
    expect(forgeAmulet(s, 'corazon')).toBe(true);
    expect(s.amulets.corazon).toBe(1);
    expect(s.fragmentos).toBe(0);
    expect(forgeAmulet(s, 'corazon')).toBe(false); // el rango 2 cuesta 5
  });

  it('alimentar a Mochi cuesta Luz y potencia el daño', () => {
    const s = freshGame();
    const before = tapDamage(s);
    s.luz = BAL.petBaseCost;
    expect(feedPet(s)).toBe(true);
    expect(s.petLevel).toBe(1);
    expect(tapDamage(s)).toBeGreaterThan(before);
  });
});

describe('objetivo siempre visible', () => {
  it('siempre hay un próximo milestone hasta completarlos todos', () => {
    const s = freshGame();
    expect(nextMilestone(s)?.zone).toBe(3);
    s.maxZoneEver = 8;
    expect(nextMilestone(s)?.id).toBe('forge');
    s.maxZoneEver = 99;
    expect(nextMilestone(s)).toBeUndefined();
  });
});
