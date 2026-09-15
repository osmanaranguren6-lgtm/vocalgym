import { AudioEngine } from "./js/audio.js";
import { createStorage } from "./js/storage.js";
import { Metronome } from "./js/timing.js";
import { PitchMonitor } from "./js/ui/pitch-monitor.js";
import { initMetronome } from "./js/ui/metronome.js";
import { renderRange, initRange } from "./js/ui/range.js";
import { initRewards } from "./js/ui/rewards.js";
import { initRoutine } from "./js/ui/routine.js";
import { initSettings } from "./js/ui/settings.js";
import { createShell } from "./js/ui/shell.js";
import { renderHeader } from "./js/ui/header.js";
import { initNotation } from "./js/ui/notation.js";
import { initHistory } from "./js/ui/history.js";
import { initSafety } from "./js/ui/safety.js";
import { initRecordings } from "./js/ui/recordings.js";
import { initBuilder } from "./js/ui/builder.js";
import { initGuide } from "./js/ui/guide.js";
import { initReminders } from "./js/reminders.js";
import { initOnboarding } from "./js/ui/onboarding.js";

const bus = new EventTarget();
const store = createStorage();
window.__bus = bus;
window.__store = store;
const audio = new AudioEngine(bus, () => store.state.settings);
window.__audio = audio;
const metronome = new Metronome(bus);
const pitchMonitor = new PitchMonitor(
  document.getElementById("pitch-canvas"),
  bus,
  store.state.settings.a4,
);
const tunerMonitor = new PitchMonitor(
  document.getElementById("tuner-canvas"),
  bus,
  store.state.settings.a4,
);
const shell = createShell({
  audio,
  bus,
  store,
  pitchMonitor,
  tunerMonitor,
});

/**
 * Displays the requested application tab.
 */
function showTab(name) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `tab-${name}`);
  });
}

/**
 * Wires tab navigation and initializes all application panels.
 */
function bootstrap() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      showTab(button.dataset.tab);
      window.dispatchEvent(
        new CustomEvent("tab:change", { detail: button.dataset.tab }),
      );
    });
  });

  renderHeader(store.state);
  const notation = initNotation({
    bus,
    store,
    metronome,
    alertUser: shell.alertUser,
  });
  const recordings = initRecordings({
    audio,
    bus,
    alertUser: shell.alertUser,
  });
  const routine = initRoutine({
    audio,
    bus,
    store,
    activateMicrophone: shell.activateMicrophone,
    alertUser: shell.alertUser,
    renderHeader: shell.renderHeader,
    loadRoutineExercise: notation.loadRoutineExercise,
    metronome,
    recordings,
  });
  window.__routine = routine;
  initBuilder({
    store,
    bus,
    alertUser: shell.alertUser,
  });
  initGuide({
    audio,
    bus,
    store,
    alertUser: shell.alertUser,
    stopRoutine: routine.stop,
  });
  initRange({
    audio,
    bus,
    store,
    activateMicrophone: shell.activateMicrophone,
    alertUser: shell.alertUser,
    renderHeader: shell.renderHeader,
  });
  initMetronome({ bus, metronome });
  initRewards({ bus, store });
  const reminders = initReminders({
    store,
    alertUser: shell.alertUser,
  });
  initSettings({
    store,
    audio,
    pitchMonitor,
    tunerMonitor,
    alertUser: shell.alertUser,
    reminders,
  });
  initOnboarding({
    store,
    activateMicrophone: shell.activateMicrophone,
  });
  initHistory({ store, bus });
  initSafety({
    store,
    routine,
    audio,
    notation,
    alertUser: shell.alertUser,
  });

  if (store.state.range.current) {
    renderRange(store.state.range.current);
  }

  if (!navigator.mediaDevices) {
    shell.alertUser(
      "Este navegador no expone micrófono; puedes explorar la interfaz y el metrónomo.",
    );
  }
}

bootstrap();

/**
 * Registers the relative service worker on supported origins.
 */
function registerServiceWorker() {
  if (
    !("serviceWorker" in navigator) ||
    (location.protocol !== "https:" && location.hostname !== "localhost")
  ) {
    return;
  }
  navigator.serviceWorker.register("./sw.js").then((registration) => {
    const notify = () => shell.alertUser("Nueva versión disponible — recargar");
    if (registration.waiting) {
      notify();
    }
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          notify();
        }
      });
    });
  });
}

registerServiceWorker();
