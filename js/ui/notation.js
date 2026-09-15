import { NotationEngine } from "../notation.js";

const ROUTINE_EXERCISES = {
  mingoh: "ming-oh",
  twang: "name-ney",
  viva: "vi-va",
  chromatic: "chromatic",
  "laxvox-segundas": "laxvox-segundas",
  "laxvox-segundas-dobles": "laxvox-segundas-dobles",
  "laxvox-terceras": "laxvox-terceras",
  "laxvox-terceras-dobles": "laxvox-terceras-dobles",
  "arpeggio-major": "arpeggio-major",
  "scale-major": "scale-major",
  "scale-minor": "scale-minor",
  "fifths-fast": "fifths-fast",
  "octaves-gu": "octaves-gu",
  "fifths-down-mum": "fifths-down-mum",
  "calls-hey": "calls-hey",
};

/**
 * Initializes the Partituras panel and its lazy notation engine.
 */
export function initNotation({ bus, store, metronome, alertUser }) {
  let mainEngine = null;
  let routineEngine = null;
  let loaded = false;
  let waitForNote = false;

  const getRange = () => store.state.range.current;
  const getSettings = () => store.state.settings;

  const createEngine = (container) =>
    new NotationEngine({
      container,
      bus,
      getSettings,
      getRange,
      metronome,
    });

  async function ensureMainEngine() {
    if (!mainEngine) {
      mainEngine = createEngine(document.getElementById("notation-container"));
      window.__notationEngine = mainEngine;
    }

    if (!loaded) {
      setNotationStatus("Cargando OSMD y Ming-oh…");
      await mainEngine.loadExercise("ming-oh");
      loaded = true;
      hideNotationSkeleton();
      setNotationStatus("Ming-oh · transposición 0");
    }

    return mainEngine;
  }

  async function loadExercise(exerciseId) {
    const engine = await ensureMainEngine();
    await engine.loadExercise(exerciseId);
    engine.autoTranspose();
    setNotationStatus(
      `${engine.title} · transposición ${engine.transpose > 0 ? "+" : ""}${engine.transpose}`,
    );
  }

  document
    .querySelector('[data-tab="scores"]')
    .addEventListener("click", async () => {
      try {
        await ensureMainEngine();
      } catch (error) {
        setNotationStatus(error.message);
        alertUser(error.message);
      }
    });

  document.querySelectorAll(".notation-exercise").forEach((button) => {
    button.addEventListener("click", async () => {
      document.querySelectorAll(".notation-exercise").forEach((item) => {
        item.classList.remove("active");
      });
      button.classList.add("active");

      try {
        await loadExercise(button.dataset.exercise);
      } catch (error) {
        setNotationStatus(error.message);
        alertUser(error.message);
      }
    });
  });

  document
    .getElementById("notation-upload")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];

      if (!file) {
        return;
      }

      try {
        const engine = await ensureMainEngine();
        const source = file.name.toLowerCase().endsWith(".mxl")
          ? await file.arrayBuffer()
          : await file.text();
        await engine.loadMusicXml(source, file.name);
        setNotationStatus(`${file.name} · transposición 0`);
      } catch (error) {
        setNotationStatus(error.message);
        alertUser(error.message);
      }
    });

  document
    .getElementById("notation-auto")
    .addEventListener("click", async () => {
      const engine = await ensureMainEngine();
      engine.autoTranspose();
      setNotationStatus(
        `Auto · transposición ${formatTranspose(engine.transpose)}`,
      );
    });
  document
    .getElementById("notation-down-octave")
    .addEventListener("click", () => changeTranspose(-12));
  document
    .getElementById("notation-down")
    .addEventListener("click", () => changeTranspose(-1));
  document
    .getElementById("notation-reset")
    .addEventListener("click", () => setTranspose(0));
  document
    .getElementById("notation-up")
    .addEventListener("click", () => changeTranspose(1));
  document
    .getElementById("notation-up-octave")
    .addEventListener("click", () => changeTranspose(12));
  document
    .getElementById("notation-play")
    .addEventListener("click", async () => {
      const engine = await ensureMainEngine();
      await engine.play({
        loop: engine.loop,
        useMetronome: document.getElementById("notation-metronome").checked,
        waitForNote,
      });
      setNotationStatus("Reproduciendo");
    });
  document.getElementById("notation-stop").addEventListener("click", () => {
    mainEngine?.stop();
    setNotationStatus("Detenido");
  });
  document.getElementById("notation-loop").addEventListener("click", () => {
    if (!mainEngine) {
      return;
    }

    mainEngine.loop = !mainEngine.loop;
    document.getElementById("notation-loop").textContent =
      `Repetir: ${mainEngine.loop ? "sí" : "no"}`;
  });
  document.getElementById("notation-wait").addEventListener("click", () => {
    waitForNote = !waitForNote;
    document.getElementById("notation-wait").textContent =
      `Esperar mi nota: ${waitForNote ? "sí" : "no"}`;
    mainEngine?.setWaitForNote?.(waitForNote);
  });

  bus.addEventListener("notation:rendered", (event) => {
    if (event.detail.title === mainEngine?.title) {
      setNotationStatus(
        `${event.detail.title} · transposición ${formatTranspose(event.detail.transpose)}`,
      );
    }
  });

  async function loadRoutineExercise(exerciseId) {
    const bundledId = ROUTINE_EXERCISES[exerciseId];

    if (!bundledId) {
      return null;
    }

    if (!routineEngine) {
      routineEngine = createEngine(document.getElementById("routine-notation"));
      window.__routineNotationEngine = routineEngine;
    }

    await routineEngine.loadExercise(bundledId);
    const ratio =
      exerciseId === "mingoh" || exerciseId === "twang" ? 0.35 : 0.3;
    const range = getRange();
    if (range) {
      routineEngine.autoTranspose(ratio);
    } else {
      routineEngine.setTranspose(0);
    }
    const comfortRange = range || { lowMidi: 48, highMidi: 72 };
    routineEngine.setRoutineProgression({
      comfortLow: comfortRange.lowMidi + 3,
      comfortHigh: comfortRange.highMidi - 3,
    });
    document
      .getElementById("routine-notation-panel")
      .classList.remove("hidden");
    document.getElementById("routine-notation-title").textContent =
      routineEngine.title;
    document.getElementById("routine-notation-status").textContent =
      `Transposición ${formatTranspose(routineEngine.transpose)}`;
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    await routineEngine.play({
      loop: true,
      waitForNote: store.state.settings.waitForNote,
    });
    return routineEngine;
  }

  return {
    loadRoutineExercise,
    stop: () => {
      mainEngine?.stop();
      routineEngine?.stop();
    },
    getEngine: () => mainEngine,
  };
}

/**
 * Changes the current notation transpose by a relative number of semitones.
 */
export async function changeTranspose(delta) {
  const engine = window.__notationEngine;

  if (!engine) {
    return;
  }

  engine.setTranspose(engine.transpose + delta);
  setNotationStatus(`Transposición ${formatTranspose(engine.transpose)}`);
}

/**
 * Sets the notation transpose to an absolute semitone value.
 */
export async function setTranspose(value) {
  const engine = window.__notationEngine;

  if (!engine) {
    return;
  }

  engine.setTranspose(value);
  setNotationStatus(`Transposición ${formatTranspose(engine.transpose)}`);
}

/**
 * Formats a signed semitone transpose value for Spanish UI.
 */
export function formatTranspose(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * Updates the notation status line.
 */
export function setNotationStatus(text) {
  const status = document.getElementById("notation-status");
  if (status) {
    status.textContent = text;
  }
}

/**
 * Hides the lazy-loading skeleton after the first successful render.
 */
export function hideNotationSkeleton() {
  document.getElementById("notation-skeleton").classList.add("hidden");
}
