import { describe, expect, it } from 'vitest';
import { BAL, bossHp, enemyHp, girlLevelCost, girlLevelCostBulk, girlMaxAffordable, girlMilestoneMult, luzReward, polvoGain } from '../src/core/balance';
import { fmt, fmtTime } from '../src/core/numbers';

describe('curvas de enemigos', () => {
  it('el HP crece con la zona y la oleada', () => {
    expect(enemyHp(1, 1)).toBe(10);
    expect(enemyHp(2, 1)).toBeCloseTo(15.5);
    expect(enemyHp(1, 5)).toBeGreaterThan(enemyHp(1, 1));
    expect(enemyHp(10, 5)).toBeGreaterThan(enemyHp(9, 5));
  });

  it('el jefe multiplica el HP de la oleada final', () => {
    expect(bossHp(3)).toBeCloseTo(enemyHp(3, 10) * BAL.bossHpMult);
  });

  it('la Luz escala con el HP y los jefes pagan más', () => {
    expect(luzReward(1, 1, false)).toBeCloseTo(8);
    expect(luzReward(5, 1, true)).toBeGreaterThan(luzReward(5, 9, false) * BAL.bossLuzMult);
  });
});

describe('costes de las chicas', () => {
  it('coste geométrico ×1.15 por nivel', () => {
    expect(girlLevelCost(5, 1)).toBeCloseTo(5.75);
    expect(girlLevelCost(5, 2) / girlLevelCost(5, 1)).toBeCloseTo(1.15);
  });

  it('el coste en lote equivale a sumar nivel a nivel', () => {
    let manual = 0;
    for (let l = 7; l < 17; l++) manual += girlLevelCost(50, l);
    expect(girlLevelCostBulk(50, 7, 10)).toBeCloseTo(manual, 6);
  });

  it('maxAffordable compra exactamente lo que se puede pagar', () => {
    const luz = girlLevelCostBulk(50, 0, 13);
    expect(girlMaxAffordable(50, 0, luz + 0.01)).toBe(13);
    expect(girlMaxAffordable(50, 0, luz - 1)).toBe(12);
    expect(girlMaxAffordable(50, 0, 1)).toBe(0);
  });

  it('hito ×2 cada 25 niveles', () => {
    expect(girlMilestoneMult(24)).toBe(1);
    expect(girlMilestoneMult(25)).toBe(2);
    expect(girlMilestoneMult(50)).toBe(4);
    expect(girlMilestoneMult(100)).toBe(16);
  });
});

describe('polvo de estrellas', () => {
  it('no hay polvo antes de la zona 20', () => {
    expect(polvoGain(19)).toBe(0);
    expect(polvoGain(1)).toBe(0);
  });

  it('crece superlinealmente con la zona', () => {
    const p20 = polvoGain(20);
    const p30 = polvoGain(30);
    const p40 = polvoGain(40);
    expect(p20).toBeGreaterThan(0);
    expect(p30 - p20).toBeLessThan(p40 - p30);
  });
});

describe('formato de números', () => {
  it('formatea las escalas del género incremental', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(999)).toBe('999');
    expect(fmt(1500)).toBe('1.50K');
    expect(fmt(2_340_000)).toBe('2.34M');
    expect(fmt(1.2e9)).toBe('1.20B');
    expect(fmt(3.5e12)).toBe('3.50T');
    expect(fmt(1e15)).toBe('1.00aa');
    expect(fmt(1e18)).toBe('1.00ab');
  });

  it('formatea tiempos', () => {
    expect(fmtTime(45)).toBe('45s');
    expect(fmtTime(125)).toBe('2m 05s');
    expect(fmtTime(7300)).toBe('2h 1m');
  });
});
