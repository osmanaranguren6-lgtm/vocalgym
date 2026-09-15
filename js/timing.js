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

/** Available routine definitions keyed by their persisted identifier. */
export const ROUTINES = {
  warmup: WARMUP,
  laxvox: LAXVOX,
};

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
    this.stages = stageOverride || ROUTINES[routineId] || WARMUP;
    this.index = 0;
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
      this.clock.reset();
      this.clock.start();
      this.bus.dispatchEvent(
        new CustomEvent("stage:change", {
          detail: { from, to: this.stages[this.index].id },
        }),
      );
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
      remaining = Math.max(0, this.duration(stage) - elapsed),
      progress = Math.min(1, elapsed / this.duration(stage));
    this.bus.dispatchEvent(
      new CustomEvent("timer:tick", {
        detail: {
          elapsed,
          remaining,
          stageId: stage.id,
          exerciseId: stage.exercises[0].id,
          progress,
        },
      }),
    );
    if (elapsed >= this.duration(stage)) this.skip();
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
