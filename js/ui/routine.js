import { WARMUP, RoutineTimer } from "../timing.js";
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
}) {
  renderStages();

  const routine = new RoutineTimer(bus, audio, store.state);

  document
    .getElementById("routine-start")
    .addEventListener("click", async () => {
      await activateMicrophone();
      routine.start();
      document.getElementById("routine-start").disabled = true;
      document.getElementById("routine-pause").disabled = false;
      document.getElementById("routine-skip").disabled = false;
      document.getElementById("motivation").textContent = phrase("start");
    });

  document.getElementById("routine-pause").addEventListener("click", () => {
    routine.pause();
    document.getElementById("routine-pause").textContent = "▶ Reanudar";
  });

  document.getElementById("routine-skip").addEventListener("click", () => {
    routine.skip();
  });

  bus.addEventListener("timer:tick", (event) => {
    renderRoutine(event.detail);
  });

  bus.addEventListener("stage:change", (event) => {
    const stage = WARMUP.find((item) => item.id === event.detail.to);
    const exercise = stage?.exercises[0];

    if (exercise?.type === "pattern" && loadRoutineExercise) {
      loadRoutineExercise(exercise.id).catch((error) =>
        alertUser(error.message),
      );
    }

    playStageBell();
  });

  bus.addEventListener("routine:complete", () => {
    updateStreak(store.state);
    store.update((state) => {
      state.sessions.push({
        date: new Date().toISOString(),
        durationSec:
          WARMUP.reduce((total, stage) => total + stage.minutes, 0) * 60,
        score: 80,
        perExercise: [],
        greenStreakMs: 0,
        badges: [],
      });
      state.stats.totalActiveSec += 1020;
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
  });
}

/**
 * Renders stage name, exercise instructions, progress, and timer.
 */
export function renderRoutine(detail) {
  const stage = WARMUP.find((item) => item.id === detail.stageId) || WARMUP[0];
  const exercise = stage.exercises[0];

  document.getElementById("stage-name").textContent = stage.name;
  document.getElementById("exercise-name").textContent = exercise.name;
  document.getElementById("exercise-instruction").textContent =
    exercise.instruction;
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
