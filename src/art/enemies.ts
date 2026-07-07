// ─── Sombras enemigas: adorables pero hay que purificarlas ───────────────────
// El color acento varía con la zona para que cada zona se sienta distinta.

const BODY = '#4a3d63';
const BODY_LIGHT = '#5d4f7a';

function zoneAccent(zone: number): string {
  return `hsl(${(zone * 47) % 360} 85% 78%)`;
}

function face(cx: number, cy: number, boss: boolean): string {
  const brow = boss
    ? `<path d="M${cx - 16},${cy - 14} L${cx - 6},${cy - 9}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
       <path d="M${cx + 16},${cy - 14} L${cx + 6},${cy - 9}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`
    : '';
  return `${brow}
  <circle cx="${cx - 11}" cy="${cy}" r="6" fill="#fff"/>
  <circle cx="${cx + 11}" cy="${cy}" r="6" fill="#fff"/>
  <circle cx="${cx - 10}" cy="${cy + 1}" r="3" fill="#2b2338"/>
  <circle cx="${cx + 12}" cy="${cy + 1}" r="3" fill="#2b2338"/>
  <circle cx="${cx - 11.5}" cy="${cy - 1.5}" r="1.2" fill="#fff"/>
  <circle cx="${cx + 10.5}" cy="${cy - 1.5}" r="1.2" fill="#fff"/>
  <path d="M${cx - 4},${cy + 9} Q${cx - 2},${cy + 12} ${cx},${cy + 9} Q${cx + 2},${cy + 12} ${cx + 4},${cy + 9}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

function blush(cx: number, cy: number, accent: string): string {
  return `<ellipse cx="${cx - 19}" cy="${cy + 6}" rx="5" ry="2.6" fill="${accent}" opacity="0.8"/>
  <ellipse cx="${cx + 19}" cy="${cy + 6}" rx="5" ry="2.6" fill="${accent}" opacity="0.8"/>`;
}

const CROWN = `<path d="M34,18 L40,8 L47,15 L54,6 L61,15 L68,8 L74,18 Z" fill="#ffd76e" stroke="#e8b93f" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="40" cy="8" r="2.4" fill="#ff8fb3"/><circle cx="54" cy="6" r="2.4" fill="#8fd0ff"/><circle cx="68" cy="8" r="2.4" fill="#b3f0a3"/>`;

/**
 * SVG del enemigo. kind 0..4 (especies) o -1 para el jefe de la zona.
 */
export function enemySVG(kind: number, zone: number): string {
  const accent = zoneAccent(zone);
  const boss = kind === -1;
  let body: string;
  let fy = 52; // altura de la carita

  switch (boss ? 0 : kind) {
    case 1: // fantasmita
      body = `<path d="M24,52 Q24,20 50,20 Q76,20 76,52 L76,80 L68,72 L60,82 L50,72 L40,82 L32,72 L24,80 Z" fill="${BODY}"/>
        <path d="M32,30 Q40,24 50,24" stroke="${BODY_LIGHT}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      fy = 46;
      break;
    case 2: // gatito sombra
      body = `<path d="M28,40 L24,18 L40,30 Z" fill="${BODY}"/><path d="M72,40 L76,18 L60,30 Z" fill="${BODY}"/>
        <path d="M30,34 L27,22 L38,30 Z" fill="${accent}" opacity="0.7"/><path d="M70,34 L73,22 L62,30 Z" fill="${accent}" opacity="0.7"/>
        <ellipse cx="50" cy="58" rx="28" ry="26" fill="${BODY}"/>`;
      fy = 56;
      break;
    case 3: // nubecita oscura
      body = `<circle cx="34" cy="58" r="17" fill="${BODY}"/><circle cx="66" cy="58" r="17" fill="${BODY}"/>
        <circle cx="50" cy="46" r="20" fill="${BODY}"/><ellipse cx="50" cy="62" rx="30" ry="16" fill="${BODY}"/>
        <path d="M38,36 Q46,30 56,33" stroke="${BODY_LIGHT}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      fy = 52;
      break;
    case 4: // estrellita caída
      body = `<path d="M50,14 L60,38 L86,40 L66,56 L72,82 L50,68 L28,82 L34,56 L14,40 L40,38 Z" fill="${BODY}" stroke-linejoin="round" stroke="${BODY}" stroke-width="8"/>`;
      fy = 50;
      break;
    default: // slime sombra (y cuerpo del jefe)
      body = `<path d="M22,66 Q16,34 50,28 Q84,34 78,66 Q84,84 50,86 Q16,84 22,66 Z" fill="${BODY}"/>
        <path d="M32,38 Q40,31 52,32" stroke="${BODY_LIGHT}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      fy = 56;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="sombra">
  ${body}
  ${boss ? CROWN : ''}
  ${face(50, fy, boss)}
  ${blush(50, fy, accent)}
</svg>`;
}

/** Mochi, el familiar conejito ✧ */
export function petSVG(level: number): string {
  const glow = level >= 15 ? `<circle cx="50" cy="58" r="42" fill="#fff3b8" opacity="0.5"/>` : '';
  const sparkles = level >= 5 ? `<path d="M16,30 l1.5,3 3,1.5 -3,1.5 -1.5,3 -1.5,-3 -3,-1.5 3,-1.5 Z" fill="#ffd76e"/>
    <circle cx="86" cy="40" r="2.2" fill="#ffd76e"/>` : '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mochi">
  ${glow}
  <!-- orejotas -->
  <ellipse cx="36" cy="26" rx="8" ry="20" fill="#fff" transform="rotate(-10 36 26)"/>
  <ellipse cx="64" cy="26" rx="8" ry="20" fill="#fff" transform="rotate(10 64 26)"/>
  <ellipse cx="36" cy="28" rx="4" ry="13" fill="#ffcede" transform="rotate(-10 36 28)"/>
  <ellipse cx="64" cy="28" rx="4" ry="13" fill="#ffcede" transform="rotate(10 64 28)"/>
  <!-- cuerpecito redondo -->
  <ellipse cx="50" cy="62" rx="30" ry="27" fill="#fff"/>
  <!-- carita -->
  <circle cx="40" cy="58" r="3.2" fill="#4a3d54"/>
  <circle cx="60" cy="58" r="3.2" fill="#4a3d54"/>
  <circle cx="41" cy="57" r="1.1" fill="#fff"/>
  <circle cx="61" cy="57" r="1.1" fill="#fff"/>
  <path d="M46,66 Q48,69 50,66 Q52,69 54,66" stroke="#e07a95" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="32" cy="65" rx="4.5" ry="2.5" fill="#ffb0c4" opacity="0.8"/>
  <ellipse cx="68" cy="65" rx="4.5" ry="2.5" fill="#ffb0c4" opacity="0.8"/>
  <!-- patitas -->
  <ellipse cx="38" cy="86" rx="7" ry="4" fill="#fff"/>
  <ellipse cx="62" cy="86" rx="7" ry="4" fill="#fff"/>
  ${sparkles}
</svg>`;
}
