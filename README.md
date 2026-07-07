# ✨ Prisma Girls

**RPG incremental idle kawaii para Android.** Un escuadrón de magical girls chibi purifica las sombras que invaden un mundo pastel. Toca para atacar, mejora a tus chicas, deja que luchen solas mientras no estás… y renace más fuerte.

Hecho con HTML5 + TypeScript + Vite, empaquetado como app Android con Capacitor. Todo el arte es SVG generado a mano (sin assets externos) y los sonidos se sintetizan con WebAudio.

## 🎮 Cómo se juega

- **Toca a la sombra** para purificarla → sueltan **⭐ Luz**.
- Con la Luz **sube de nivel a tus chicas** (cada 25 niveles su poder se duplica).
- Cada zona tiene 9 oleadas y un **jefe con temporizador** (30 s). Si escapa, farmea y reinténtalo.
- Tapear rápido acumula **combo** (+2 % de daño por stack, hasta 50).
- Al cerrar el juego tu equipo sigue luchando: al volver te espera un **cofre offline** 🎁.

## 🗺️ Milestones (cada mecánica potencia lo anterior)

| Zona | Desbloqueo |
|------|------------|
| 1 | **Lumi** — tu tap canaliza su magia |
| 3 | **Hana** se une → **auto-ataque** (nace el idle) |
| 5 | **Habilidades activas**: Ráfaga Prisma y Lluvia Estelar |
| 8 | **Mira** se une + **Transformación** (henshin ×10, 20 s) |
| 12 | **Taller de Amuletos**: multiplicadores permanentes con fragmentos de jefe |
| 15 | **Yuki** se une + familiar **Mochi** 🐰 (bonus pasivos crecientes) |
| 20 | **Renacer Estelar**: prestige con Polvo de Estrellas + constelaciones |
| 25 | **Sora** se une (+25 % a TODO) |

Lo permanente sobrevive al Renacer: chicas reclutadas, amuletos, Mochi, constelaciones y las mecánicas desbloqueadas.

## 🧠 Diseño (por qué engancha)

Inspirado en el análisis de los grandes del género:

- **Clicker Heroes / Tap Titans**: combate visible con números de daño y críticos → feedback inmediato.
- **AFK Arena**: el cofre de recompensa offline al abrir la app es el mayor pico de dopamina.
- **Leaf Blower Revolution**: la mejor recompensa de un milestone es automatizar lo que hacías a mano.
- **Melvor Idle**: sinergias — cada sistema nuevo multiplica a los anteriores.
- Objetivo **siempre visible**: el banner superior te dice qué desbloqueas y cuánto falta.

Las curvas viven en `src/core/balance.ts` (HP ×1.55/zona, costes ×1.15/nivel, polvo ~ zona^1.9…): ajustar el juego es tocar un solo archivo.

## 🛠️ Desarrollo

```bash
npm install
npm run dev        # jugar en el navegador (localhost:5173)
npm test           # tests de la lógica (Vitest)
npm run build      # build de producción en dist/
```

### Verificación end-to-end

Juega la partida de verdad con un navegador automatizado y captura pantallas en `shots/`:

```bash
npm run build && npx vite preview --port 4173 &
node scripts/e2e.mjs
```

### APK de Android (Capacitor)

Requisitos: JDK 17+, Android SDK (`ANDROID_HOME` o `android/local.properties`).

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK en android/app/build/outputs/apk/debug/app-debug.apk
```

Los iconos (PWA + launcher) se regeneran desde `public/icon.svg` con `node scripts/icons.mjs`.

### PWA

El build incluye manifest y service worker: servido por HTTPS se puede **instalar desde Chrome en Android** (menú → «Añadir a pantalla de inicio») y funciona sin conexión.

## 📁 Estructura

```
src/
  core/      estado, balance, guardado, offline, formato de números
  systems/   combate, chicas, habilidades, taller, familiar, prestige, milestones
  ui/        pantallas, HUD, partículas, modales
  art/       SVG kawaii generado (chicas chibi, sombras, Mochi)
  audio/     efectos de sonido sintetizados (WebAudio)
tests/       lógica pura (Vitest)
scripts/     e2e.mjs (verificación jugando) · icons.mjs (generar iconos)
android/     proyecto Capacitor
```
