/** Badge definitions and their unlock rules. */
export const BADGES = [
  {
    id: "diaphragm",
    name: "Dominador del Diafragma",
    icon: "🥇",
    description: "Completa cinco prácticas de respiración.",
    rule: (s) => s.stats.breathRoutinesCompleted >= 5,
  },
  {
    id: "siren",
    name: "Siren Master",
    icon: "🚀",
    description: "Recorre tu rango con una sirena estable.",
    rule: (s) =>
      s.lastSiren &&
      s.lastSiren.maxJumpCents < 300 &&
      s.lastSiren.coveragePct >= 0.6,
  },
  {
    id: "steel",
    name: "Afinación de Acero",
    icon: "🎯",
    description: "Mantén diez segundos continuos en verde.",
    rule: (s) => s.stats.bestGreenStreakMs >= 10000,
  },
  {
    id: "first_range",
    name: "Cartógrafo Vocal",
    icon: "🗺️",
    description: "Guarda tu primera medición de rango.",
    rule: (s) => s.range?.history.length >= 1,
  },
  {
    id: "rest_respected",
    name: "Guardián de la Laringe",
    icon: "🛡️",
    description: "Respeta tres descansos vocales completos.",
    rule: (s) => s.stats.fullRestsTaken >= 3,
  },
  {
    id: "streak7",
    name: "Semana de Hierro",
    icon: "🔥",
    description: "Alcanza una racha de siete días.",
    rule: (s) => s.streak.best >= 7,
  },
  {
    id: "octave2",
    name: "Dos Octavas",
    icon: "🎹",
    description: "Mide una extensión de dos octavas.",
    rule: (s) => s.range?.current?.semitones >= 24,
  },
  {
    id: "tempo200",
    name: "Velocista",
    icon: "⚡",
    description: "Completa un ejercicio a 200 BPM.",
    rule: (s) => s.stats.maxBpmCompleted >= 200,
  },
  {
    id: "laxvox_first",
    name: "Burbujas de Oro",
    icon: "🫧",
    description: "Completa tu primera rutina Lax Vox.",
    rule: (s) => s.stats.laxvoxRoutinesCompleted >= 1,
  },
  {
    id: "laxvox_10",
    name: "Maestro del Tubo",
    icon: "🧪",
    description: "Completa diez rutinas Lax Vox.",
    rule: (s) => s.stats.laxvoxRoutinesCompleted >= 10,
  },
  {
    id: "cooldown_5",
    name: "Cierre Consciente",
    icon: "🌙",
    description: "Completa cinco rutinas de enfriamiento.",
    rule: (s) => s.stats.cooldownRoutinesCompleted >= 5,
  },
  {
    id: "agility_5",
    name: "Dedos de Voz",
    icon: "⚡",
    description: "Completa cinco rutinas de agilidad avanzada.",
    rule: (s) => s.stats.agilityRoutinesCompleted >= 5,
  },
];
/** Motivational phrases grouped by application context. */
export const PHRASES = [
  ["start", "Cantar es coordinación muscular, no magia."],
  ["start", "Hoy entrenas escucha y libertad."],
  ["start", "Una respiración tranquila abre espacio."],
  ["start", "Tu práctica empieza con curiosidad."],
  ["start", "La constancia afina más que la prisa."],
  [
    "struggle",
    "Permítete sonar imperfecto mientras descubres nuevos registros.",
  ],
  ["struggle", "Busca comodidad; la voz no necesita empujones."],
  ["struggle", "Acércate poco a poco, sin perseguir la nota."],
  ["struggle", "Relaja, deja caer y vuelve a escuchar."],
  ["struggle", "Cada ajuste pequeño también es progreso."],
  ["success", "¡Ahí está! Tu oído y tu laringe se pusieron de acuerdo."],
  ["success", "Tu centro aparece cuando le das tiempo."],
  ["success", "Centrado: guarda esta sensación."],
  ["success", "Cinco segundos de calma construyen coordinación."],
  ["success", "Tu voz acaba de encontrar un camino claro."],
  [
    "rest",
    "Los pliegues vocales se recuperan en silencio. Esto también es entrenar.",
  ],
  ["rest", "Hidratarte y descansar también es técnica."],
  ["rest", "El silencio cuida el instrumento."],
  ["range", "Conocer tu rango es escucharte, no ponerte límites."],
  ["range", "Tu tesitura es un mapa para practicar con seguridad."],
  ["range", "Explorar con cuidado amplía tus opciones."],
  ["start", "Cinco minutos también cuentan para tu voz."],
  ["start", "Escucha primero; la nota llega después."],
  ["start", "Tu cuerpo aprende con repeticiones amables."],
  ["start", "Una práctica breve puede cambiar tu día."],
  ["struggle", "Vuelve a la respiración y reduce la intensidad."],
  ["struggle", "La nota no se escapa: espera y escucha."],
  ["struggle", "Prueba menos volumen y más espacio."],
  ["struggle", "Tu voz puede reajustarse sin prisa."],
  ["struggle", "El descanso entre intentos también enseña."],
  ["success", "Ese ajuste fue preciso y tranquilo."],
  ["success", "Tu coordinación está ganando estabilidad."],
  ["success", "La voz se siente más libre cuando no la empujas."],
  ["success", "Tu oído acaba de darte una buena pista."],
  ["success", "Repite esta sensación cómoda."],
  ["rest", "Un vaso de agua es parte de tu entrenamiento."],
  ["rest", "Hoy cuidar la voz es el ejercicio correcto."],
  ["range", "Tu mapa cambia cuando aprendes a escucharte."],
  ["range", "Mide sin competir: la información te acompaña."],
  ["laxvox", "El agua hace el trabajo: tú solo mantén el flujo."],
  ["laxvox", "Burbujas suaves, mandíbula tranquila, sonido libre."],
  ["laxvox", "Deja que el tubo convierta el esfuerzo en facilidad."],
  ["laxvox", "Mantén el flujo y permite que la voz se acomode."],
];
/** Selects a random phrase for a context. */
export function phrase(context = "start") {
  const a = PHRASES.filter((p) => p[0] === context);
  return (a[Math.floor(Math.random() * a.length)] || PHRASES[0])[1];
}
/** Returns today's date using the stable YYYY-MM-DD format. */
export function today() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}
/** Updates the daily streak and weekly grace-day state. */
export function updateStreak(state) {
  const now = today();
  if (state.streak.lastDate === now) return;
  const last = state.streak.lastDate
    ? new Date(`${state.streak.lastDate}T12:00:00`)
    : null;
  const days = last
    ? Math.round((new Date(`${now}T12:00:00`) - last) / 86400000)
    : 99;
  if (days === 1) state.streak.current += 1;
  else if (days <= 2 && !state.streak.graceUsedWeekOf) {
    state.streak.current += 1;
    state.streak.graceUsedWeekOf = now.slice(0, 7);
  } else state.streak.current = 1;
  state.streak.lastDate = now;
  state.streak.best = Math.max(state.streak.best, state.streak.current);
}
/** Unlocks newly eligible badges and emits badge events. */
export function evaluateBadges(state, bus) {
  for (const b of BADGES)
    if (!state.badges[b.id] && b.rule(state)) {
      state.badges[b.id] = new Date().toISOString();
      bus.dispatchEvent(new CustomEvent("badge:unlocked", { detail: b }));
    }
}
/** Converts cents error into the non-punitive frame score. */
export function scoreFrame(cents) {
  return Math.max(0, Math.min(1, 1 - (Math.abs(cents) - 15) / 25));
}
