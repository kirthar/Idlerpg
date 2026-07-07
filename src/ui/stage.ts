// ─── Pantalla de combate: enemigo, barras, habilidades y equipo ──────────────
import { BAL } from '../core/balance';
import { fmt, fmtTime } from '../core/numbers';
import type { GameState } from '../core/state';
import { critChance, tapDamage, teamDps } from '../core/stats';
import { enemySVG } from '../art/enemies';
import { girlSVG } from '../art/girls';
import { enemyKind } from '../systems/combat';
import { GIRLS, isGirlUnlocked } from '../systems/girls';
import { isUnlocked, nextMilestone } from '../systems/milestones';
import { SKILLS, isTransformed, skillState } from '../systems/skills';
import { $, el } from './dom';
import { zoneName } from './zones';

export interface StageActions {
  onTap: () => void;
  onSkill: (id: string) => void;
  onTransform: () => void;
  onRetryBoss: () => void;
}

let lastEnemyKey = '';
let lastTeamKey = '';

export function bindStage(actions: StageActions): void {
  $('#enemy-area').addEventListener('pointerdown', e => {
    e.preventDefault();
    actions.onTap();
  });
  $('#skill-bar').addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-skill]');
    if (!btn) return;
    const id = btn.dataset.skill!;
    if (id === 'transform') actions.onTransform();
    else actions.onSkill(id);
  });
  $('#retry-boss').addEventListener('click', actions.onRetryBoss);
}

export function updateStage(s: GameState): void {
  // Cabecera: monedas
  $('#luz-counter').textContent = `⭐ ${fmt(s.luz)}`;
  const polvoEl = $('#polvo-counter');
  polvoEl.textContent = `✨ ${fmt(s.polvo)}`;
  polvoEl.style.display = isUnlocked(s, 'prestige') || s.polvo > 0 ? '' : 'none';
  const fragEl = $('#frag-counter');
  fragEl.textContent = `🔮 ${fmt(s.fragmentos)}`;
  fragEl.style.display = isUnlocked(s, 'forge') ? '' : 'none';

  // Objetivo siempre visible
  const next = nextMilestone(s);
  $('#objective').innerHTML = next
    ? `<span class="obj-icon">${next.icon}</span> <b>Zona ${next.zone}:</b> ${next.title.replace('¡', '').replace('!', '')} <span class="obj-left">· faltan ${next.zone - s.zone} zonas</span>`
    : `🌈 ¡Todas las mecánicas desbloqueadas! Llega más lejos y renace ✨`;

  // Zona y oleada
  $('#zone-label').textContent = `Zona ${s.zone} · ${zoneName(s.zone)}`;
  const dots = $('#wave-dots');
  if (dots.childElementCount !== BAL.wavesPerZone) {
    dots.innerHTML = '';
    for (let i = 1; i <= BAL.wavesPerZone; i++) {
      dots.appendChild(el('span', i === BAL.wavesPerZone ? 'dot boss-dot' : 'dot'));
    }
  }
  Array.from(dots.children).forEach((d, i) => {
    d.classList.toggle('done', i + 1 < s.wave);
    d.classList.toggle('current', i + 1 === s.wave);
  });

  // Enemigo (solo re-renderiza el SVG al cambiar de bicho)
  const kind = enemyKind(s.zone, s.wave, s.isBoss);
  const key = `${s.zone}:${s.wave}:${s.isBoss}`;
  if (key !== lastEnemyKey) {
    lastEnemyKey = key;
    $('#enemy-sprite').innerHTML = enemySVG(kind, s.zone);
    $('#enemy-sprite').classList.toggle('boss', s.isBoss);
  }

  // Barra de vida del enemigo
  const pct = s.enemyMaxHp > 0 ? Math.max(0, s.enemyHp / s.enemyMaxHp) * 100 : 0;
  ($('#hp-fill') as HTMLElement).style.width = `${pct}%`;
  $('#hp-text').textContent = `${fmt(Math.max(0, s.enemyHp))} / ${fmt(s.enemyMaxHp)}`;

  // Temporizador del jefe
  const bossBar = $('#boss-bar');
  if (s.isBoss && !s.bossFailed) {
    bossBar.style.display = '';
    $('#boss-time').textContent = `👑 ¡JEFE! ${Math.ceil(s.bossTimeLeft)}s`;
    ($('#boss-time-fill') as HTMLElement).style.width = `${(s.bossTimeLeft / BAL.bossTimeSec) * 100}%`;
  } else {
    bossBar.style.display = 'none';
  }
  $('#retry-boss').style.display = s.bossFailed ? '' : 'none';

  // Combo
  const combo = $('#combo-badge');
  if (s.combo >= 3) {
    combo.style.display = '';
    combo.textContent = `Combo ×${s.combo} 💞 +${Math.round(s.combo * BAL.comboDamagePerStack * 100)}%`;
  } else {
    combo.style.display = 'none';
  }

  // Stats rápidas
  $('#stat-tap').textContent = `👆 ${fmt(tapDamage(s))}`;
  const dps = teamDps(s);
  $('#stat-dps').textContent = dps > 0 ? `⚔️ ${fmt(dps)}/s` : '';
  $('#stat-crit').textContent = `💥 ${Math.round(critChance(s) * 100)}%`;

  updateSkillBar(s);
  updateTeamRow(s);
}

function updateSkillBar(s: GameState): void {
  const bar = $('#skill-bar');
  const showSkills = isUnlocked(s, 'skills');
  const showTransform = isUnlocked(s, 'transform');
  bar.style.display = showSkills || showTransform ? '' : 'none';
  if (!showSkills && !showTransform) return;

  if (bar.childElementCount === 0) {
    for (const sk of SKILLS) {
      const b = el('button', 'skill-btn', `<span class="skill-icon">${sk.icon}</span><span class="skill-name">${sk.name}</span><span class="skill-cd"></span>`);
      b.dataset.skill = sk.id;
      b.title = sk.desc;
      bar.appendChild(b);
    }
    const t = el('button', 'skill-btn transform-btn', `<span class="skill-icon">🌟</span><span class="skill-name">¡Henshin!</span><span class="skill-cd"></span>`);
    t.dataset.skill = 'transform';
    t.title = `Transformación: todo el daño ×${BAL.transform.allMult} durante ${BAL.transform.durSec} s`;
    bar.appendChild(t);
  }

  for (const btn of Array.from(bar.children) as HTMLElement[]) {
    const id = btn.dataset.skill!;
    const isT = id === 'transform';
    btn.style.display = (isT ? showTransform : showSkills) ? '' : 'none';
    const st = isT ? s.transform : skillState(s, id);
    const cdTotal = isT ? BAL.transform.cdSec : SKILLS.find(x => x.id === id)!.cdSec;
    const cd = btn.querySelector<HTMLElement>('.skill-cd')!;
    btn.classList.toggle('active', st.activeLeft > 0);
    btn.classList.toggle('cooling', st.cdLeft > 0 && st.activeLeft <= 0);
    if (st.activeLeft > 0) {
      cd.textContent = `${Math.ceil(st.activeLeft)}s`;
    } else if (st.cdLeft > 0) {
      cd.textContent = fmtTime(st.cdLeft);
      btn.style.setProperty('--cd-pct', `${(st.cdLeft / cdTotal) * 100}%`);
    } else {
      cd.textContent = '¡Lista!';
    }
  }
  $('#stage').classList.toggle('transformed', isTransformed(s));
}

function updateTeamRow(s: GameState): void {
  const row = $('#team-row');
  const key = GIRLS.map(g => (isGirlUnlocked(s, g.id) ? '1' : '0')).join('');
  if (key !== lastTeamKey) {
    lastTeamKey = key;
    row.innerHTML = '';
    for (const g of GIRLS) {
      const unlocked = isGirlUnlocked(s, g.id);
      const av = el('div', unlocked ? 'avatar' : 'avatar locked', unlocked ? girlSVG(g) : `<span class="avatar-q">?</span>`);
      av.title = unlocked ? `${g.name} — ${g.title}` : `Se une en la zona ${g.unlockZone}`;
      if (unlocked) av.style.animationDelay = `${Math.random() * 1.5}s`;
      row.appendChild(av);
    }
  }
}
