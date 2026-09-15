const KEY = "vocalgym.v1";

/** Creates a fresh version-one application state. */
export const defaults = () => ({
  version: 1,
  settings: {
    a4: 440,
    tolerance: "standard",
    restAfterMin: 50,
    routineOverrides: {},
    deviceId: "",
      accompanimentVol: -12,
      waitForNote: false,
      routineId: "warmup",
      recordExercises: false,
  },
  streak: { current: 0, best: 0, lastDate: "", graceUsedWeekOf: "" },
  range: { history: [] },
  sessions: [],
  stats: {
    breathRoutinesCompleted: 0,
    bestGreenStreakMs: 0,
    fullRestsTaken: 0,
    maxBpmCompleted: 0,
    totalActiveSec: 0,
      lastDiscomfortDate: "",
      laxvoxRoutinesCompleted: 0,
  },
  badges: {},
  lastSiren: null,
});
/** Migrates persisted data into the current version-one schema. */
export function migrate(input) {
  const base = defaults();
  if (!input || typeof input !== "object") return base;
  const s = {
    ...base,
    ...input,
    version: 1,
    settings: { ...base.settings, ...(input.settings || {}) },
    streak: { ...base.streak, ...(input.streak || {}) },
    range: { ...base.range, ...(input.range || {}) },
    stats: { ...base.stats, ...(input.stats || {}) },
    badges: { ...(input.badges || {}) },
  };
  s.sessions = (input.sessions || []).slice(-365);
  s.range.history = (s.range.history || []).slice(-50);
  return s;
}
/** Creates the debounced localStorage persistence service. */
export function createStorage() {
  let state = migrate(load());
  let timer;
  const saveNow = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("No se pudo guardar VocalGym", e);
    }
  };
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(saveNow, 500);
  }
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }
  const api = {
    get state() {
      return state;
    },
    setState(next) {
      state = migrate(next);
      schedule();
      return state;
    },
    update(fn) {
      fn(state);
      schedule();
      return state;
    },
    save: saveNow,
    exportJSON() {
      return JSON.stringify(state, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (parsed?.version !== 1) {
        throw new Error("El respaldo no pertenece a una versión compatible.");
      }
      const next = migrate(parsed);
      state = next;
      saveNow();
      return state;
    },
  };
  addEventListener(
    "visibilitychange",
    () => document.visibilityState === "hidden" && saveNow(),
  );
  addEventListener("pagehide", saveNow);
  return api;
}
