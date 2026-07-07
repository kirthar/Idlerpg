// ─── Retratos chibi de las Prisma Girls (SVG generado, estética kawaii) ──────
import type { GirlDef } from '../systems/girls';

const SKIN = '#ffe9dc';
const EYE_DARK = '#40324a';

/** Aclara un color hex mezclándolo con blanco. */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount);
  const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amount);
  const b = Math.round((n & 255) + (255 - (n & 255)) * amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function backHair(style: GirlDef['hairstyle'], hair: string): string {
  const dark = hair;
  switch (style) {
    case 'twintails':
      return `<ellipse cx="13" cy="62" rx="11" ry="24" fill="${dark}" transform="rotate(12 13 62)"/>
        <ellipse cx="87" cy="62" rx="11" ry="24" fill="${dark}" transform="rotate(-12 87 62)"/>
        <circle cx="19" cy="38" r="4" fill="#fff" opacity="0.9"/>
        <circle cx="81" cy="38" r="4" fill="#fff" opacity="0.9"/>`;
    case 'bob':
      return `<ellipse cx="50" cy="48" rx="34" ry="32" fill="${dark}"/>`;
    case 'long':
      return `<path d="M18,42 Q12,80 20,112 Q28,104 30,84 L30,50 Z" fill="${dark}"/>
        <path d="M82,42 Q88,80 80,112 Q72,104 70,84 L70,50 Z" fill="${dark}"/>
        <ellipse cx="50" cy="46" rx="33" ry="31" fill="${dark}"/>`;
    case 'ponytail':
      return `<ellipse cx="78" cy="26" rx="10" ry="21" fill="${dark}" transform="rotate(38 78 26)"/>
        <circle cx="70" cy="18" r="4" fill="#fff" opacity="0.9"/>
        <ellipse cx="50" cy="46" rx="32" ry="30" fill="${dark}"/>`;
    case 'buns':
      return `<circle cx="26" cy="17" r="10" fill="${dark}"/>
        <circle cx="74" cy="17" r="10" fill="${dark}"/>
        <circle cx="26" cy="14" r="3" fill="#fff" opacity="0.85"/>
        <circle cx="74" cy="14" r="3" fill="#fff" opacity="0.85"/>`;
  }
}

/**
 * Retrato chibi completo: cabeza enorme, ojazos con brillos, rubor,
 * vestido de magical girl y varita con estrella.
 */
export function girlSVG(def: GirlDef): string {
  const { hair, dress, accent } = def.colors;
  const hairShine = lighten(hair, 0.45);
  const dressDark = accent;

  return `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${def.name}">
  ${backHair(def.hairstyle, hair)}

  <!-- vestido -->
  <path d="M39,76 L61,76 L71,110 Q50,121 29,110 Z" fill="${dress}"/>
  <path d="M29,110 Q50,121 71,110 L69,104 Q50,114 31,104 Z" fill="#fff" opacity="0.85"/>
  <path d="M39,76 L61,76 L63,84 L37,84 Z" fill="${dressDark}" opacity="0.55"/>
  <!-- lacito del pecho -->
  <path d="M46,80 L50,84 L54,80 L54,88 L50,84 L46,88 Z" fill="${accent}"/>

  <!-- brazos -->
  <ellipse cx="33" cy="90" rx="4.5" ry="10" fill="${SKIN}" transform="rotate(18 33 90)"/>
  <ellipse cx="70" cy="86" rx="4.5" ry="10" fill="${SKIN}" transform="rotate(-38 70 86)"/>

  <!-- varita mágica -->
  <line x1="74" y1="80" x2="86" y2="58" stroke="#f7dfa8" stroke-width="3" stroke-linecap="round"/>
  <path d="M86,50 L88.4,55.4 L94,56 L89.8,59.8 L91,65.4 L86,62.5 L81,65.4 L82.2,59.8 L78,56 L83.6,55.4 Z" fill="#ffd76e"/>
  <circle cx="86" cy="57.5" r="1.6" fill="#fff" opacity="0.9"/>

  <!-- zapatitos -->
  <ellipse cx="43" cy="117" rx="5" ry="3" fill="${accent}"/>
  <ellipse cx="57" cy="117" rx="5" ry="3" fill="${accent}"/>

  <!-- cabeza -->
  <ellipse cx="50" cy="47" rx="29" ry="27" fill="${SKIN}"/>

  <!-- flequillo -->
  <path d="M21,49 Q20,20 50,17 Q80,20 79,49 Q71,40 64,48 Q57,38 50,47 Q43,38 36,48 Q29,40 21,49 Z" fill="${hair}"/>
  <path d="M30,26 Q40,20 52,21" stroke="${hairShine}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.9"/>

  <!-- lacito del pelo -->
  <path d="M67,22 L75,16 L75,28 Z" fill="${accent}"/>
  <path d="M83,22 L75,16 L75,28 Z" fill="${accent}"/>
  <circle cx="75" cy="22" r="3" fill="${lighten(accent, 0.4)}"/>

  <!-- ojazos kawaii -->
  <g>
    <ellipse cx="38" cy="55" rx="6.5" ry="8" fill="${EYE_DARK}"/>
    <ellipse cx="38" cy="56.5" rx="5" ry="6.2" fill="${accent}"/>
    <ellipse cx="38" cy="59" rx="3.4" ry="3.6" fill="${EYE_DARK}" opacity="0.55"/>
    <circle cx="36" cy="52.5" r="2.3" fill="#fff"/>
    <circle cx="40.5" cy="58" r="1.1" fill="#fff" opacity="0.95"/>
  </g>
  <g>
    <ellipse cx="62" cy="55" rx="6.5" ry="8" fill="${EYE_DARK}"/>
    <ellipse cx="62" cy="56.5" rx="5" ry="6.2" fill="${accent}"/>
    <ellipse cx="62" cy="59" rx="3.4" ry="3.6" fill="${EYE_DARK}" opacity="0.55"/>
    <circle cx="60" cy="52.5" r="2.3" fill="#fff"/>
    <circle cx="64.5" cy="58" r="1.1" fill="#fff" opacity="0.95"/>
  </g>
  <!-- cejitas -->
  <path d="M32,44 Q38,41.5 44,44" stroke="${EYE_DARK}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/>
  <path d="M56,44 Q62,41.5 68,44" stroke="${EYE_DARK}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/>

  <!-- rubor -->
  <ellipse cx="29" cy="64" rx="5.5" ry="3" fill="#ffb0c4" opacity="0.65"/>
  <ellipse cx="71" cy="64" rx="5.5" ry="3" fill="#ffb0c4" opacity="0.65"/>

  <!-- boquita -->
  <path d="M46,68 Q50,72.5 54,68" stroke="#e07a95" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- brillitos -->
  <path d="M14,26 l1.6,3.4 3.4,1.6 -3.4,1.6 -1.6,3.4 -1.6,-3.4 -3.4,-1.6 3.4,-1.6 Z" fill="#ffe9a8"/>
  <circle cx="90" cy="86" r="2" fill="#ffe9a8"/>
</svg>`;
}

/** Silueta misteriosa para chicas aún no reclutadas. */
export function girlSilhouetteSVG(def: GirlDef): string {
  return `<div class="silhouette">${girlSVG(def)}</div>`;
}
