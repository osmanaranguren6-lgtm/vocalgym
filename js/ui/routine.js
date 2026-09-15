import { EXPRESS, WARMUP, RoutineTimer } from "../timing.js";
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
  let activeStages = WARMUP;
  renderStages(activeStages);

  const routine = new RoutineTimer(bus, audio, store.state);

  async function start(stages) {
    activeStages = stages;
    renderStages(activeStages);
    await activateMicrophone();
    routine.start(activeStages);
    document.getElementById("routine-start").disabled = true;
    document.getElementById("routine-express").disabled = true;
    document.getElementById("routine-pause").disabled = false;
    document.getElementById("routine-skip").disabled = false;
    document.getElementById("motivation").textContent = phrase("start");
  }

  document.getElementById("routine-start").addEventListener("click", () => {
    start(WARMUP);
  });
  document.getElementById("routine-express").addEventListener("click", () => {
    start(EXPRESS);
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
    const stage = activeStages.find((item) => item.id === event.detail.to);
    const exercise = stage?.exercises[0];

    if (exercise?.type === "pattern" && loadRoutineExercise) {
      loadRoutineExercise(exercise.id).catch((error) =>
        alertUser(error.message),
      );
    }

    playStageBell();
  });

  bus.addEventListener("routine:complete", () => {
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
    document.getElementById("routine-start").disabled = false;
    document.getElementById("routine-express").disabled = false;
    document.getElementById("routine-pause").disabled = true;
    document.getElementById("routine-skip").disabled = true;
  });

  function stop() {
    routine.stop();
    document.getElementById("routine-start").disabled = false;
    document.getElementById("routine-express").disabled = false;
    document.getElementById("routine-pause").disabled = true;
    document.getElementById("routine-skip").disabled = true;
  }

  return { stop };
}

/**
 * Renders stage name, exercise instructions, progress, and timer.
 */
export function renderRoutine(detail) {
  const stage =
    WARMUP.find((item) => item.id === detail.stageId) || WARMUP[0];
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
