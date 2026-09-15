/** The four-stage guided vocal warmup routine. */
export const WARMUP = [
  {
    id: "breath",
    name: "Alineación y Respiración",
    minutes: 3,
    color: "cyan",
    description: "Respira y coordina la salida de aire.",
    exercises: [
      {
        id: "hiss",
        name: "Breathe & Hiss",
        type: "breath",
        instruction: "Inhala 4, pausa 2 y deja salir un “sss” continuo.",
      },
    ],
  },
  {
    id: "sovte",
    name: "Fonación de baja tensión (SOVTE)",
    minutes: 5,
    color: "violet",
    description: "Estira los pliegues sin colisión agresiva.",
    exercises: [
      {
        id: "liproll",
        name: "Lip Rolls",
        type: "sustain",
        instruction: "Deja vibrar los labios con una voz cómoda.",
      },
      {
        id: "siren",
        name: "Sirenas ↑↓",
        type: "glissando",
        instruction: "Desliza suavemente entre el 20 y el 80 % de tu rango.",
      },
    ],
  },
  {
    id: "resonance",
    name: "Resonancia y Colocación",
    minutes: 5,
    color: "fuchsia",
    description: "Encuentra vibración sin empujar.",
    exercises: [
      {
        id: "mingoh",
        name: "Ming-oh (Sol-Fa-Mi-Re-Do)",
        type: "pattern",
        pattern: [7, 5, 4, 2, 0],
        bpm: 90,
        instruction: "Sigue el patrón con una voz clara y cómoda.",
      },
      {
        id: "twang",
        name: "Twang / Name-Ney",
        type: "pattern",
        pattern: [0, 4, 7, 4, 0],
        bpm: 90,
        instruction: "Explora una resonancia brillante sin apretar.",
      },
    ],
  },
  {
    id: "agility",
    name: "Agilidad y Articulación",
    minutes: 4,
    color: "amber",
    description: "Coordina cambios pequeños con ligereza.",
    exercises: [
      {
        id: "viva",
        name: "Vi-Va quintas",
        type: "pattern",
        pattern: [0, 7, 0, 7, 0],
        bpm: 120,
        instruction: "Alterna las quintas con precisión relajada.",
      },
      {
        id: "chromatic",
        name: "Trabalenguas cromático",
        type: "pattern",
        pattern: [0, 1, 2, 3, 4, 3, 2, 1, 0],
        bpm: 100,
        instruction: "Sube y baja cromáticamente sin correr.",
      },
    ],
  },
];

/** The twelve-minute semi-occluded Lax Vox routine. */
export const LAXVOX = [
  {
    id: "laxvox-breath",
    name: "Soplo 5 s y 10 s",
    minutes: 1.5,
    color: "cyan",
    description: "Sopla burbujas constantes sin sonido.",
    exercises: [
      {
        id: "laxvox-breath",
        name: "Soplo 5 s y 10 s",
        type: "breath",
        detector: "rms",
        cycles: [
          { inhale: 3, blow: 5 },
          { inhale: 3, blow: 5 },
          { inhale: 4, blow: 10 },
          { inhale: 4, blow: 10 },
        ],
        instruction: "Sopla burbujas constantes sin sonido.",
      },
    ],
  },
  {
    id: "laxvox-onsets",
    name: "10 sonidos cortos",
    minutes: 1,
    color: "violet",
    description: "Emite 'uuu' corto en el tubo, 10 veces.",
    exercises: [
      {
        id: "laxvox-onsets",
        name: "10 sonidos cortos",
        type: "onsets",
        target: 10,
        instruction: "Emite 'uuu' corto en el tubo, 10 veces.",
      },
    ],
  },
  {
    id: "laxvox-alternate",
    name: "Soplo / Sonido",
    minutes: 1.5,
    color: "fuchsia",
    description: "Alterna soplo sin voz y sonido.",
    exercises: [
      {
        id: "laxvox-alternate",
        name: "Soplo / Sonido",
        type: "alternate",
        phases: [
          { name: "Soplo", kind: "blow", seconds: 3 },
          { name: "Sonido", kind: "sound", seconds: 3 },
        ],
        instruction: "Alterna soplo sin voz y sonido, sin cortar el aire.",
      },
    ],
  },
  {
    id: "laxvox-sustain",
    name: "Sonido largo",
    minutes: 1.5,
    color: "amber",
    description: "Mantén un sonido cómodo y estable.",
    exercises: [
      {
        id: "laxvox-sustain",
        name: "Sonido largo",
        type: "sustain",
        target: 15,
        instruction: "Un sonido largo y cómodo, burbujas constantes.",
      },
    ],
  },
  {
    id: "laxvox-segundas",
    name: "Segundas",
    minutes: 1.5,
    color: "cyan",
    description: "Canta segundas con un flujo suave.",
    exercises: [
      {
        id: "laxvox-segundas",
        name: "Segundas",
        type: "pattern",
        bpm: 80,
        instruction: "Canta el patrón con burbujas constantes.",
      },
    ],
  },
  {
    id: "laxvox-segundas-dobles",
    name: "Segundas dobles",
    minutes: 1.5,
    color: "violet",
    description: "Agiliza las segundas sin perder el flujo.",
    exercises: [
      {
        id: "laxvox-segundas-dobles",
        name: "Segundas dobles",
        type: "pattern",
        bpm: 80,
        instruction: "Mantén el tubo relajado mientras aceleras.",
      },
    ],
  },
  {
    id: "laxvox-terceras",
    name: "Terceras",
    minutes: 1.5,
    color: "fuchsia",
    description: "Explora terceras con comodidad.",
    exercises: [
      {
        id: "laxvox-terceras",
        name: "Terceras",
        type: "pattern",
        bpm: 80,
        instruction: "Deja que el agua suavice cada intervalo.",
      },
    ],
  },
  {
    id: "laxvox-terceras-dobles",
    name: "Terceras dobles",
    minutes: 1.5,
    color: "amber",
    description: "Coordina terceras dobles con ligereza.",
    exercises: [
      {
        id: "laxvox-terceras-dobles",
        name: "Terceras dobles",
        type: "pattern",
        bpm: 80,
        instruction: "Termina suave, sin apretar la mandíbula.",
      },
    ],
  },
];

/** Five-minute vocal cooldown routine. */
export const COOLDOWN = [
  {
    id: "cooldown-sirens",
    name: "Sirenas descendentes suaves",
    minutes: 2,
    color: "cyan",
    description: "Desliza de agudo a grave, muy suave, como un suspiro.",
    exercises: [
      {
        id: "cooldown-sirens",
        name: "Sirenas descendentes suaves",
        type: "glissando",
        instruction: "Desliza de agudo a grave, muy suave, como un suspiro",
      },
    ],
  },
  {
    id: "cooldown-humming",
    name: "Humming grave",
    minutes: 2,
    color: "violet",
    description: "Mmm cómodo en tu zona grave, sin empujar.",
    exercises: [
      {
        id: "cooldown-humming",
        name: "Humming grave",
        type: "sustain",
        target: 15,
        instruction: "Mmm cómodo en tu zona grave, sin empujar",
      },
    ],
  },
  {
    id: "cooldown-breath",
    name: "Respiración de cierre",
    minutes: 1,
    color: "fuchsia",
    description: "Inhala 4, exhala 8, hombros sueltos.",
    exercises: [
      {
        id: "cooldown-breath",
        name: "Respiración de cierre",
        type: "breath",
        instruction: "Inhala 4, exhala 8, hombros sueltos",
      },
    ],
  },
];

/** Ten-minute advanced agility routine. */
export const AGILITY = [
  {
    id: "agility-arpeggio",
    name: "Arpegio mayor",
    minutes: 2.5,
    color: "cyan",
    description: "Recorre el arpegio con ligereza.",
    exercises: [
      {
        id: "arpeggio-major",
        name: "Arpegio mayor",
        type: "pattern",
        bpm: 100,
        instruction: "Canta con sílabas ia, ligero y preciso.",
      },
    ],
  },
  {
    id: "agility-scale-major",
    name: "Escala mayor",
    minutes: 2.5,
    color: "violet",
    description: "Sube y baja la escala mayor.",
    exercises: [
      {
        id: "scale-major",
        name: "Escala mayor",
        type: "pattern",
        bpm: 105,
        instruction: "Mantén la articulación clara y cómoda.",
      },
    ],
  },
  {
    id: "agility-scale-minor",
    name: "Escala menor",
    minutes: 2.5,
    color: "fuchsia",
    description: "Explora el color de la escala menor.",
    exercises: [
      {
        id: "scale-minor",
        name: "Escala menor",
        type: "pattern",
        bpm: 110,
        instruction: "Deja que cada intervalo se acomode sin empujar.",
      },
    ],
  },
  {
    id: "agility-fifths",
    name: "Quintas rápidas",
    minutes: 2.5,
    color: "amber",
    description: "Coordina quintas rápidas con precisión.",
    exercises: [
      {
        id: "fifths-fast",
        name: "Quintas rápidas",
        type: "pattern",
        bpm: 120,
        instruction: "Mantén un pulso estable y una voz libre.",
      },
    ],
  },
];

/** Six-minute guided siren routine. */
export const SIRENS = [
  {
    id: "sirens-up",
    name: "Sirena ascendente",
    minutes: 2,
    color: "cyan",
    description: "Desliza de grave a agudo sin saltos bruscos.",
    exercises: [
      {
        id: "sirens-up",
        name: "Sirena ascendente",
        type: "glissando",
        instruction: "Desliza de grave a agudo con suavidad.",
      },
    ],
  },
  {
    id: "sirens-down",
    name: "Sirena descendente",
    minutes: 2,
    color: "violet",
    description: "Desliza de agudo a grave con calma.",
    exercises: [
      {
        id: "sirens-down",
        name: "Sirena descendente",
        type: "glissando",
        instruction: "Desliza de agudo a grave con suavidad.",
      },
    ],
  },
  {
    id: "sirens-full",
    name: "Sirena completa ↑↓",
    minutes: 2,
    color: "fuchsia",
    description: "Une subida y bajada en un solo gesto.",
    exercises: [
      {
        id: "sirens-full",
        name: "Sirena completa ↑↓",
        type: "glissando",
        instruction: "Sube y baja por tu rango con suavidad.",
      },
    ],
  },
];

/** Available routine definitions keyed by their persisted identifier. */
export const ROUTINES = {
  warmup: WARMUP,
  laxvox: LAXVOX,
  cooldown: COOLDOWN,
  agility: AGILITY,
  sirens: SIRENS,
};

/** Labels and instructions shown by the routine selector. */
export const ROUTINE_META = {
  warmup: {
    label: "Calentamiento (17 min)",
    intro: "Calentamiento progresivo de respiración, SOVTE, resonancia y agilidad.",
  },
  laxvox: {
    label: "Lax Vox (12 min)",
    intro:
      "Tubo de silicona 1–2 cm bajo el agua, labios sellados, mandíbula relajada.",
  },
  cooldown: {
    label: "Enfriamiento (5 min)",
    intro: "Cierra tu práctica con sonidos suaves, cómodos y sin empujar.",
  },
  agility: {
    label: "Agilidad avanzada (10 min)",
    intro: "Coordina patrones rápidos con precisión y ligereza.",
  },
  sirens: {
    label: "Sirenas guiadas (6 min)",
    intro: "Recorre tu rango con deslizamientos continuos y amables.",
  },
};

const EXERCISE_WHY = {
  hiss: "Entrena el control del aire: una salida constante es la base de una emisión sin tensión.",
  liproll: "Coordina aire y vibración con poca presión para preparar una fonación cómoda.",
  siren: "Estira los pliegues en todo el rango y suaviza los pasajes entre registros.",
  mingoh: "Conecta resonancia y afinación descendente para organizar el centro de la voz.",
  twang: "Entrena una resonancia brillante y eficiente sin apretar la garganta.",
  viva: "Coordina saltos amplios con precisión para mejorar la agilidad vocal.",
  chromatic: "Afina movimientos pequeños entre notas para ganar control y flexibilidad.",
  "laxvox-breath": "La salida de aire constante mantiene las burbujas y reduce el esfuerzo laríngeo.",
  "laxvox-onsets": "Practica ataques breves y claros sin perder el flujo del aire.",
  "laxvox-alternate": "Diferencia aire y sonido para coordinar presión y vibración con calma.",
  "laxvox-sustain": "Mejora la estabilidad del sonido mientras la resistencia del agua reduce el impacto.",
  "laxvox-segundas": "Coordina intervalos cercanos con un flujo suave y una afinación estable.",
  "laxvox-segundas-dobles": "Aumenta la velocidad de intervalos cercanos sin sacrificar relajación.",
  "laxvox-terceras": "Amplía la coordinación entre registros mediante saltos cómodos y precisos.",
  "laxvox-terceras-dobles": "Desarrolla agilidad en terceras manteniendo una presión equilibrada.",
  "cooldown-sirens": "Ayuda a soltar la voz recorriendo el rango con menos intensidad.",
  "cooldown-humming": "Relaja la emisión grave y conserva una vibración cómoda al cerrar la práctica.",
  "cooldown-breath": "Baja la activación corporal con una exhalación larga y tranquila.",
  "arpeggio-major": "Ordena saltos de tercera y quinta para mejorar la precisión de la agilidad.",
  "scale-major": "Conecta pasos conjuntos y entrena una afinación uniforme al subir y bajar.",
  "scale-minor": "Explora intervalos menores para ampliar el control expresivo sin forzar.",
  "fifths-fast": "Mejora la coordinación rápida entre raíz y quinta con un pulso estable.",
  "sirens-up": "Estira los pliegues en todo el rango y suaviza los pasajes entre registros.",
  "sirens-down": "Estira los pliegues en todo el rango y suaviza los pasajes entre registros.",
  "sirens-full": "Estira los pliegues en todo el rango y suaviza los pasajes entre registros.",
};

for (const routine of Object.values(ROUTINES)) {
  for (const stage of routine) {
    for (const exercise of stage.exercises) {
      exercise.why =
        EXERCISE_WHY[exercise.id] ||
        "Este ejercicio coordina aire, vibración y afinación para cantar con comodidad.";
    }
  }
}

/** Returns all preset exercises grouped by their source routine. */
export const EXERCISE_LIBRARY = [
  ...new Map(
    Object.entries(ROUTINES)
      .flatMap(([routineId, stages]) =>
        stages.flatMap((stage) =>
          stage.exercises.map((exercise) => [
            exercise.id,
            {
              ...exercise,
              sourceRoutineId: routineId,
              sourceRoutineLabel: ROUTINE_META[routineId]?.label || routineId,
            },
          ]),
        ),
      ),
  ).values(),
];

/** Resolves a preset or persisted custom routine by identifier. */
export function resolveRoutine(id, state) {
  return (
    ROUTINES[id] ||
    state?.customRoutines?.find((routine) => routine.id === id)?.stages ||
    WARMUP
  );
}

/** Five-minute routine for low-energy days. */
export const EXPRESS = WARMUP.slice(0, 2).map((stage, index) => ({
  ...stage,
  minutes: index === 0 ? 2 : 3,
}));
/** Publishes elapsed audio-clock ticks for routine timing. */
export class MasterClock {
  constructor(ctx, bus) {
    this.ctx = ctx;
    this.bus = bus;
    this.t0 = null;
    this.paused = 0;
    this.raf = 0;
    this.last = 0;
    this.onTick = this.onTick.bind(this);
  }
  get elapsed() {
    const now = this.ctx?.currentTime ?? performance.now() / 1000;
    return this.t0 === null ? this.paused : now - this.t0;
  }
  start() {
    const now = this.ctx?.currentTime ?? performance.now() / 1000;
    this.t0 = now - this.paused;
    this.last = 0;
    this.raf = requestAnimationFrame(this.onTick);
  }
  pause() {
    this.paused = this.elapsed;
    this.t0 = null;
    cancelAnimationFrame(this.raf);
  }
  reset() {
    this.pause();
    this.paused = 0;
  }
  onTick() {
    if (this.t0 !== null) {
      const now = this.elapsed;
      if (now - this.last > 0.01) {
        this.bus.dispatchEvent(
          new CustomEvent("clock:tick", { detail: { elapsed: now } }),
        );
        this.last = now;
      }
      this.raf = requestAnimationFrame(this.onTick);
    }
  }
}
/** Controls routine stages, pausing, skipping, and completion. */
export class RoutineTimer extends EventTarget {
  constructor(bus, audio, state) {
    super();
    this.bus = bus;
    this.audio = audio;
    this.state = state;
    this.clock = null;
    this.running = false;
    this.index = 0;
    this.startedAt = 0;
    this.activeSeconds = 0;
    this.lastTick = 0;
    this.routineId = "warmup";
    this.stages = WARMUP;
    this.exerciseIndex = 0;
    bus.addEventListener("clock:tick", () => this.tick());
  }
  duration(stage) {
    return (
      (stage.minutes + (this.state.settings.routineOverrides[stage.id] || 0)) *
      60
    );
  }
  start(routineId = "warmup", stageOverride = null) {
    if (this.running) return;
    this.routineId = routineId;
    this.stages =
      stageOverride || resolveRoutine(routineId, this.state) || WARMUP;
    this.index = 0;
    this.exerciseIndex = 0;
    this.clock ??= new MasterClock(this.audio.ctx, this.bus);
    this.running = true;
    this.clock.start();
    this.startedAt = this.clock.elapsed;
    this.lastTick = this.startedAt;
    this.bus.dispatchEvent(
      new CustomEvent("stage:change", {
        detail: { from: null, to: this.stages[this.index].id },
      }),
    );
    this.dispatchExerciseChange(null);
    this.tick();
  }
  pause() {
    this.running = false;
    this.clock?.pause();
  }
  skip() {
    if (this.index < this.stages.length - 1) {
      const from = this.stages[this.index].id;
      this.index++;
      this.exerciseIndex = 0;
      this.clock.reset();
      this.clock.start();
      this.bus.dispatchEvent(
        new CustomEvent("stage:change", {
          detail: { from, to: this.stages[this.index].id },
        }),
      );
      this.dispatchExerciseChange(null);
      this.tick();
    } else this.finish();
  }
  stop() {
    this.running = false;
    this.clock?.pause();
    this.bus.dispatchEvent(new CustomEvent("routine:stop"));
  }
  tick() {
    if (!this.running) return;
    const stage = this.stages[this.index],
      elapsed = this.clock.elapsed,
      stageDuration = this.duration(stage),
      exerciseDuration = stageDuration / stage.exercises.length;
    if (elapsed >= stageDuration) {
      this.skip();
      return;
    }
    const nextExerciseIndex = Math.min(
      stage.exercises.length - 1,
      Math.floor(elapsed / exerciseDuration),
    );
    if (nextExerciseIndex !== this.exerciseIndex) {
      const from = stage.exercises[this.exerciseIndex]?.id || null;
      this.exerciseIndex = nextExerciseIndex;
      this.dispatchExerciseChange(from);
    }
    const exerciseElapsed =
      elapsed - this.exerciseIndex * exerciseDuration;
    const exerciseRemaining = Math.max(
      0,
      exerciseDuration - exerciseElapsed,
    );
    this.bus.dispatchEvent(
      new CustomEvent("timer:tick", {
        detail: {
          elapsed,
          remaining: Math.max(0, stageDuration - elapsed),
          stageId: stage.id,
          exerciseId: stage.exercises[this.exerciseIndex].id,
          progress: Math.min(1, elapsed / stageDuration),
          exerciseProgress: Math.min(1, exerciseElapsed / exerciseDuration),
          exerciseRemaining,
        },
      }),
    );
  }
  dispatchExerciseChange(from) {
    const stage = this.stages[this.index];
    const exercise = stage?.exercises[this.exerciseIndex];
    if (!exercise) return;
    this.bus.dispatchEvent(
      new CustomEvent("exercise:change", {
        detail: {
          stageId: stage.id,
          from,
          to: exercise.id,
        },
      }),
    );
  }
  finish() {
    this.running = false;
    this.clock?.pause();
    this.bus.dispatchEvent(new CustomEvent("routine:complete"));
  }
}
/** Controls Tone.js tempo, signatures, accents, and beat events. */
export class Metronome {
  constructor(bus) {
    this.bus = bus;
    this.bpm = 90;
    this.signature = "4/4";
    this.running = false;
    this.loop = null;
    this.beat = 0;
    this.synth = null;
    this.accent = null;
  }
  async toggle() {
    if (!window.Tone) return;
    if (!this.running) {
      await Tone.start();
      this.synth ??= new Tone.MembraneSynth({ volume: -6 }).toDestination();
      this.accent ??= new Tone.MembraneSynth({ volume: -6 }).toDestination();
      this.beat = 0;
      this.loop = new Tone.Loop((time) => {
        const bar = Number(this.signature.split("/")[0]),
          down = this.beat % bar === 0;
        (down ? this.accent : this.synth).triggerAttackRelease(
          down ? "A5" : "E5",
          "32n",
          time,
        );
        Tone.Draw.schedule(
          () =>
            this.bus.dispatchEvent(
              new CustomEvent("metronome:beat", {
                detail: { beat: this.beat, isDownbeat: down, bpm: this.bpm },
              }),
            ),
          time,
        );
        this.beat++;
      }, "4n").start(0);
      Tone.Transport.bpm.value = this.bpm;
      Tone.Transport.start();
      this.running = true;
    } else {
      this.loop?.stop();
      Tone.Transport.stop();
      this.running = false;
    }
  }
  setBpm(v) {
    this.bpm = Math.max(40, Math.min(240, Number(v) || 90));
    if (window.Tone) Tone.Transport.bpm.value = this.bpm;
  }
}
