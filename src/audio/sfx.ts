// ─── Efectos de sonido sintetizados (WebAudio, sin assets) ───────────────────
// Bleeps suaves y campanitas acordes con la estética kawaii.

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** Debe llamarse tras el primer gesto del usuario (política de autoplay). */
export function initAudio(): void {
  if (ctx) return;
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
  } catch { /* sin audio: el juego sigue */ }
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', delay = 0, vol = 1): void {
  if (!ctx || !master || !enabled) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap(): void { beep(520 + Math.random() * 80, 0.07, 'triangle', 0, 0.5); },
  crit(): void { beep(660, 0.1, 'square', 0, 0.4); beep(990, 0.12, 'square', 0.05, 0.4); beep(1320, 0.16, 'square', 0.1, 0.35); },
  kill(): void { beep(784, 0.09, 'sine', 0, 0.6); beep(1046, 0.14, 'sine', 0.06, 0.5); },
  coin(): void { beep(1568, 0.1, 'sine', 0, 0.35); },
  levelup(): void { beep(523, 0.1, 'triangle'); beep(659, 0.1, 'triangle', 0.08); beep(784, 0.18, 'triangle', 0.16); },
  milestone(): void { [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.22, 'triangle', i * 0.09, 0.7)); },
  bossAppear(): void { beep(196, 0.3, 'sawtooth', 0, 0.3); beep(185, 0.35, 'sawtooth', 0.2, 0.3); },
  bossDown(): void { [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.25, 'triangle', i * 0.1, 0.7)); },
  fail(): void { beep(330, 0.2, 'sine', 0, 0.5); beep(262, 0.3, 'sine', 0.15, 0.5); },
  chest(): void { [659, 784, 1046, 1318, 1568].forEach((f, i) => beep(f, 0.16, 'sine', i * 0.07, 0.6)); },
  henshin(): void { [440, 554, 659, 880, 1108, 1318].forEach((f, i) => beep(f, 0.3, 'triangle', i * 0.08, 0.7)); },
  skill(): void { beep(880, 0.12, 'triangle'); beep(1174, 0.16, 'triangle', 0.06); },
};
