import {
  EXPRESS,
  ROUTINE_META,
  ROUTINES,
  WARMUP,
  resolveRoutine,
  RoutineTimer,
} from "../timing.js";
import { evaluateBadges, phrase, updateStreak } from "../gamification.js";
import { renderStages } from "./header.js";

/**
 * Initializes the guided routine controls and event handlers.
 */
export function initRoutine({
  audio,
  bus,
  store,
  activateMicrophone,
  alertUser,
  renderHeader,
  loadRoutineExercise,
  metronome,
  recordings,
}) {
  let routineId = store.state.settings.routineId || "warmup";
  let activeStages = resolveRoutine(routineId, store.state);
  let expressMode = false;
  let metrics = createMetrics(activeStages[0]?.exercises[0]);
  let wakeLock = null;
  renderRoutineChoices();
  renderStages(activeStages);
  renderRoutineIntro(routineId);
  selectRoutineButton(routineId);

  const routine = new RoutineTimer(bus, audio, store.state);
  const recordToggle = document.getElementById("record-exercises");
  if (recordToggle) {
    recordToggle.checked = Boolean(store.state.settings.recordExercises);
    recordToggle.addEventListener("change", () => {
      store.update((state) => {
        state.settings.recordExercises = recordToggle.checked;
      });
    });
  }

  function setRoutine(nextId) {
    if (routine.running) {
      return;
    }
    routineId = resolveRoutine(nextId, store.state) ? nextId : "warmup";
    activeStages = resolveRoutine(routineId, store.state);
    expressMode = false;
    store.update((state) => {
      state.settings.routineId = routineId;
    });
    renderStages(activeStages);
    renderRoutineIntro(routineId);
    selectRoutineButton(routineId);
    resetMetrics(activeStages[0]?.exercises[0]);
  }

  async function start(selectedId, stages = null) {
    expressMode = Boolean(stages);
    routineId = selectedId;
    activeStages = stages || resolveRoutine(selectedId, store.state);
    renderStages(activeStages);
    renderRoutineIntro(stages ? "warmup" : selectedId);
    document
      .querySelectorAll(".routine-choice")
      .forEach((button) => (button.disabled = true));
    await activateMicrophone();
    if (!audio.ctx) {
      alertUser("Rutina iniciada sin micrófono. Puedes practicar los pasos igualmente.");
    }
    routine.start(selectedId, stages);
    await requestWakeLock();
    document.getElementById("routine-start").disabled = true;
    document.getElementById("routine-express").disabled = true;
    document.getElementById("routine-pause").disabled = false;
    document.getElementById("routine-skip").disabled = false;
    document.getElementById("motivation").textContent = phrase(
      routineId === "laxvox" ? "laxvox" : "start",
    );
  }

  document
    .getElementById("routine-selector")
    .addEventListener("click", (event) => {
      const button = event.target.closest(".routine-choice");
      if (button) {
        setRoutine(button.dataset.routineId);
      }
    });
  bus.addEventListener("custom-routines:change", () => {
    renderRoutineChoices();
    activeStages = resolveRoutine(routineId, store.state);
    renderStages(activeStages);
    renderRoutineIntro(routineId);
    selectRoutineButton(routineId);
  });
  document.getElementById("routine-start").addEventListener("click", () => {
    start(routineId);
  });
  document.getElementById("routine-express").addEventListener("click", () => {
    start("warmup", EXPRESS);
  });

  document.getElementById("routine-pause").addEventListener("click", () => {
    routine.pause();
    document.getElementById("routine-pause").textContent = "▶ Reanudar";
  });

  document.getElementById("routine-skip").addEventListener("click", () => {
    routine.skip();
  });

  bus.addEventListener("timer:tick", (event) => {
    renderRoutine(event.detail, activeStages);
  });

  bus.addEventListener("stage:change", (event) => {
    playStageBell();
  });

  bus.addEventListener("exercise:change", (event) => {
    const stage = activeStages.find((item) => item.id === event.detail.stageId);
    const exercise = stage?.exercises.find(
      (item) => item.id === event.detail.to,
    );
    finalizeSiren();
    resetMetrics(exercise);

    if (exercise?.type === "pattern" && loadRoutineExercise) {
      loadRoutineExercise(exercise.id).catch((error) =>
        alertUser(error.message),
      );
    }

    if (exercise?.type === "pattern" && exercise.bpm) {
      window.dispatchEvent(
        new CustomEvent("routine:bpm", { detail: { bpm: exercise.bpm } }),
      );
    }
    if (routineId === "laxvox") {
      document.getElementById("motivation").textContent = phrase("laxvox");
    }
    if (recordToggle?.checked && recordings && routine.running) {
      recordings.startExercise(exercise?.name || "Ejercicio");
    }
  });

  bus.addEventListener("pitch:frame", (event) => {
    if (!routine.running) {
      return;
    }
    updateMetrics(event.detail);
  });

  if (metronome) {
    window.addEventListener("routine:bpm", (event) => {
      metronome.setBpm(event.detail.bpm);
    });
  }

  bus.addEventListener("routine:complete", () => {
    finalizeSiren();
    store.update((state) => {
      updateStreak(state);
      const durationSec = activeStages.reduce(
        (total, stage) => total + stage.minutes,
        0,
      ) * 60;
      state.sessions.push({
        date: new Date().toISOString(),
        durationSec,
        score: 80,
        perExercise: [],
        greenStreakMs: 0,
        badges: [],
      });
      state.stats.totalActiveSec += durationSec;
      state.stats.routinesCompleted ??= {};
      state.stats.routinesCompleted[routineId] =
        (state.stats.routinesCompleted[routineId] || 0) + 1;
      if (routineId === "cooldown") {
        state.stats.cooldownRoutinesCompleted += 1;
      }
      if (routineId === "agility") {
        state.stats.agilityRoutinesCompleted += 1;
      }
      if (routineId === "laxvox") {
        state.stats.laxvoxRoutinesCompleted += 1;
      }
    });
    bus.dispatchEvent(
      new CustomEvent("score:update", {
        detail: {
          score: 80,
        },
      }),
    );
    evaluateBadges(store.state, bus);
    renderHeader();
    alertUser("Rutina completada. Tu constancia cuenta.");
    document
      .querySelectorAll(".routine-choice")
      .forEach((button) => (button.disabled = false));
    document.getElementById("routine-start").disabled = false;
    document.getElementById("routine-express").disabled = false;
    document.getElementById("routine-pause").disabled = true;
    document.getElementById("routine-skip").disabled = true;
    releaseWakeLock();
  });

  function stop() {
    finalizeSiren();
    routine.stop();
    releaseWakeLock();
    document.getElementById("routine-start").disabled = false;
    document.getElementById("routine-express").disabled = false;
    document.getElementById("routine-pause").disabled = true;
    document.getElementById("routine-skip").disabled = true;
    document
      .querySelectorAll(".routine-choice")
      .forEach((button) => (button.disabled = false));
  }

  async function requestWakeLock() {
    if (!store.state.settings.keepAwake || !navigator.wakeLock?.request) {
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch {
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    wakeLock?.release?.();
    wakeLock = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      releaseWakeLock();
    } else if (routine.running) {
      requestWakeLock();
    }
  });

  return { stop };

  function createMetrics(exercise) {
    return {
      exerciseId: exercise?.id || "",
      onsetCount: 0,
      onsetVoicedSince: 0,
      onsetCounted: false,
      onsetUnvoicedSince: performance.now(),
      rmsSamples: 0,
      rmsActive: 0,
      phaseIndex: 0,
      phaseStartedAt: performance.now(),
      phaseSamples: 0,
      phaseMatches: 0,
      sustainSince: 0,
      sustainBest: 0,
      sustainFrames: [],
      restUntil: 0,
      glissandoMidi: [],
      lastGlissandoAt: 0,
      maxJumpCents: 0,
      minMidi: Infinity,
      maxMidi: -Infinity,
      sirenFinalized: false,
    };
  }

  function resetMetrics(exercise) {
    metrics = createMetrics(exercise);
    window.__routineMetrics = metrics;
    renderRoutineFeedback(exercise);
  }

  function frameNow() {
    return performance.now();
  }

  function updateMetrics(frame) {
    const stage = activeStages.find((item) =>
      item.exercises.some((exercise) => exercise.id === metrics.exerciseId),
    );
    const exercise = stage?.exercises.find(
      (item) => item.id === metrics.exerciseId,
    );
    if (!exercise) {
      return;
    }
    const now = frameNow();
    if (exercise.type === "onsets") {
      updateOnsets(frame, exercise, now);
    } else if (exercise.type === "alternate") {
      updateAlternate(frame, exercise, now);
    } else if (exercise.type === "sustain") {
      updateSustain(frame, exercise, now);
    } else if (exercise.type === "breath") {
      updateBreath(frame, now);
    } else if (exercise.type === "glissando") {
      updateGlissando(frame, now);
    }
    renderRoutineFeedback(exercise);
  }

  function updateBreath(frame, now) {
    metrics.rmsSamples += 1;
    if (Number(frame.rms) > 10 ** (-50 / 20)) {
      metrics.rmsActive += 1;
    }
    metrics.lastFrameAt = now;
  }

  function updateGlissando(frame, now) {
    if (!frame.voiced || !Number.isFinite(frame.f0)) {
      return;
    }
    const midi =
      69 + 12 * Math.log2(frame.f0 / (store.state.settings.a4 || 440));
    if (
      metrics.lastGlissandoAt &&
      now - metrics.lastGlissandoAt < 250 &&
      metrics.glissandoMidi.length
    ) {
      metrics.maxJumpCents = Math.max(
        metrics.maxJumpCents,
        Math.abs(midi - metrics.glissandoMidi.at(-1)) * 100,
      );
    }
    metrics.glissandoMidi.push(midi);
    metrics.lastGlissandoAt = now;
    metrics.minMidi = Math.min(metrics.minMidi, midi);
    metrics.maxMidi = Math.max(metrics.maxMidi, midi);
  }

  function finalizeSiren() {
    if (metrics.sirenFinalized || !metrics.glissandoMidi.length) {
      return;
    }
    const history = store.state.range.history || [];
    const range = history[history.length - 1];
    const rangeSemitones =
      Number(range?.highMidi) - Number(range?.lowMidi) || 12;
    const coveragePct = Math.max(
      0,
      Math.min(1, (metrics.maxMidi - metrics.minMidi) / rangeSemitones),
    );
    store.update((state) => {
      state.lastSiren = {
        maxJumpCents: metrics.maxJumpCents,
        coveragePct,
        at: Date.now(),
      };
    });
    metrics.sirenFinalized = true;
    evaluateBadges(store.state, bus);
  }

  function updateOnsets(frame, exercise, now) {
    if (metrics.restUntil) {
      if (now < metrics.restUntil) {
        return;
      }
      metrics.onsetCount = 0;
      metrics.restUntil = 0;
      metrics.onsetUnvoicedSince = now;
    }
    if (frame.voiced) {
      if (!metrics.onsetVoicedSince) {
        if (now - metrics.onsetUnvoicedSince >= 150) {
          metrics.onsetVoicedSince = now;
          metrics.onsetCounted = false;
        }
      }
      if (
        metrics.onsetVoicedSince &&
        !metrics.onsetCounted &&
        now - metrics.onsetVoicedSince >= 100
      ) {
        metrics.onsetCount += 1;
        metrics.onsetCounted = true;
        document.getElementById("routine-feedback").classList.add("routine-pop");
        window.setTimeout(
          () =>
            document
              .getElementById("routine-feedback")
              .classList.remove("routine-pop"),
          300,
        );
        if (metrics.onsetCount >= exercise.target) {
          metrics.restUntil = now + 5000;
        }
      }
    } else {
      if (!metrics.onsetUnvoicedSince || metrics.onsetVoicedSince) {
        metrics.onsetUnvoicedSince = now;
      }
      if (
        metrics.onsetVoicedSince &&
        !metrics.onsetCounted &&
        now - metrics.onsetVoicedSince >= 100
      ) {
        metrics.onsetCount += 1;
        metrics.onsetCounted = true;
      }
      metrics.onsetVoicedSince = 0;
      metrics.onsetCounted = false;
    }
  }

  function updateAlternate(frame, exercise, now) {
    const phase = exercise.phases[metrics.phaseIndex];
    const elapsed = now - metrics.phaseStartedAt;
    const matches =
      phase.kind === "blow"
        ? Number(frame.rms) > 10 ** (-50 / 20) && !frame.voiced
        : Boolean(frame.voiced);
    metrics.phaseSamples += 1;
    if (matches) {
      metrics.phaseMatches += 1;
    }
    if (elapsed >= phase.seconds * 1000) {
      metrics.phaseIndex =
        (metrics.phaseIndex + 1) % exercise.phases.length;
      metrics.phaseStartedAt = now;
      metrics.phaseSamples = 0;
      metrics.phaseMatches = 0;
    }
  }

  function updateSustain(frame, exercise, now) {
    if (!frame.voiced || !Number.isFinite(frame.midi)) {
      metrics.sustainSince = 0;
      metrics.sustainFrames = [];
      return;
    }
    if (!metrics.sustainSince) {
      metrics.sustainSince = now;
    }
    metrics.sustainFrames.push({
      now,
      cents: frame.midi * 100 + (Number(frame.cents) || 0),
    });
    metrics.sustainFrames = metrics.sustainFrames.filter(
      (item) => now - item.now <= 1000,
    );
    const values = metrics.sustainFrames.map((item) => item.cents);
    const average =
      values.reduce((total, value) => total + value, 0) / values.length;
    const variance =
      values.reduce((total, value) => total + (value - average) ** 2, 0) /
      values.length;
    const stable = Math.sqrt(variance) < 50;
    const held = stable ? (now - metrics.sustainSince) / 1000 : 0;
    if (!stable) {
      metrics.sustainSince = now;
    }
    metrics.sustainBest = Math.max(metrics.sustainBest, held);
    metrics.sustainTarget = exercise.target;
  }

  function renderRoutineFeedback(exercise) {
    const element = document.getElementById("routine-feedback");
    if (!element || !exercise) {
      return;
    }
    if (exercise.type === "onsets") {
      const rest = metrics.restUntil
        ? ` · descanso ${Math.max(0, Math.ceil((metrics.restUntil - frameNow()) / 1000))} s`
        : "";
      element.textContent = `${Math.min(metrics.onsetCount, exercise.target)}/${exercise.target}${rest}`;
    } else if (exercise.type === "alternate") {
      const phase = exercise.phases[metrics.phaseIndex];
      const ratio = metrics.phaseSamples
        ? metrics.phaseMatches / metrics.phaseSamples
        : 0;
      element.textContent = `${phase.name}: ${ratio >= 0.6 ? "✓ OK" : "escucha el flujo"}`;
    } else if (exercise.type === "sustain") {
      element.textContent = `Sostenido ${Math.floor(
        Math.min(exercise.target, metrics.sustainBest || 0),
      )} s · mejor ${Math.floor(metrics.sustainBest || 0)} s`;
    } else if (exercise.type === "glissando") {
      const range = store.state.range.history.at(-1);
      const rangeSemitones =
        Number(range?.highMidi) - Number(range?.lowMidi) || 12;
      const coverage = metrics.glissandoMidi.length
        ? ((metrics.maxMidi - metrics.minMidi) / rangeSemitones) * 100
        : 0;
      element.textContent = `Cobertura del rango: ${Math.round(coverage)}%${
        metrics.maxJumpCents > 300 ? " · Salto detectado" : ""
      }`;
    } else if (exercise.detector === "rms") {
      const continuity = metrics.rmsSamples
        ? Math.round((metrics.rmsActive / metrics.rmsSamples) * 100)
        : 0;
      element.textContent = `Continuidad del soplo: ${continuity}%`;
    } else {
      element.textContent = "";
    }
  }

  function renderRoutineIntro(id) {
    const custom = store.state.customRoutines.find((routine) => routine.id === id);
    document.getElementById("routine-intro").textContent =
      ROUTINE_META[id]?.intro || custom?.intro || ROUTINE_META.warmup.intro;
  }

  function renderRoutineChoices() {
    const root = document.getElementById("routine-selector");
    const custom = store.state.customRoutines.map((routine) => [
      routine.id,
      { label: routine.label, intro: routine.intro },
    ]);
    root.innerHTML = [...Object.entries(ROUTINE_META), ...custom]
      .map(
        ([id, meta]) =>
          `<button type="button" class="routine-choice" data-routine-id="${id}">${meta.label}</button>`,
      )
      .join("");
  }

  function selectRoutineButton(id) {
    document.querySelectorAll(".routine-choice").forEach((button) => {
      button.classList.toggle("active", button.dataset.routineId === id);
    });
  }
}

/**
 * Renders stage name, exercise instructions, progress, and timer.
 */
export function renderRoutine(detail, stages = WARMUP) {
  const stage = stages.find((item) => item.id === detail.stageId) || stages[0];
  const exercise =
    stage.exercises.find((item) => item.id === detail.exerciseId) ||
    stage.exercises[0];

  document.getElementById("stage-name").textContent = stage.name;
  document.getElementById("exercise-name").textContent = exercise.name;
  document.getElementById("exercise-instruction").textContent =
    exercise.instruction;
  document.getElementById("exercise-why").textContent = exercise.why || "";
  document.getElementById("timer-value").textContent = `${Math.floor(
    detail.remaining / 60,
  )
    .toString()
    .padStart(2, "0")}:${Math.floor(detail.remaining % 60)
    .toString()
    .padStart(2, "0")}`;
  document.getElementById("stage-progress").style.width =
    `${detail.progress * 100}%`;
  document
    .getElementById("timer-ring")
    .style.setProperty("--progress", `${detail.progress * 100}%`);

  document.querySelectorAll(".stage-card").forEach((card) => {
    card.classList.toggle("current", card.id === `stage-card-${stage.id}`);
  });
}

/**
 * Plays a soft transition bell between routine stages.
 */
export function playStageBell() {
  if (!window.Tone) {
    return;
  }

  const bell = new Tone.Synth({
    oscillator: { type: "triangle" },
    volume: -12,
  }).toDestination();
  bell.triggerAttackRelease("C6", ".3");
}
