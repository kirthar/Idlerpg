// ─── Nombres kawaii de las zonas ─────────────────────────────────────────────

const NAMES = [
  'Pradera Rosa',
  'Bosque de Algodón',
  'Colinas Caramelo',
  'Lago Estrellado',
  'Cuevas de Cristal',
  'Valle de las Nubes',
  'Jardín Lunar',
  'Picos de Merengue',
  'Ciudad Pastel',
  'Reino del Arcoíris',
];

export function zoneName(zone: number): string {
  const name = NAMES[(zone - 1) % NAMES.length];
  const cycle = Math.floor((zone - 1) / NAMES.length);
  return cycle > 0 ? `${name} ✦${cycle + 1}` : name;
}
