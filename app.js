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

const bus = new EventTarget();
const store = createStorage();
const audio = new AudioEngine(bus, () => store.state.settings);
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
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  renderHeader(store.state);
  const notation = initNotation({
    bus,
    store,
    metronome,
    alertUser: shell.alertUser,
  });
  initRoutine({
    audio,
    bus,
    store,
    activateMicrophone: shell.activateMicrophone,
    alertUser: shell.alertUser,
    renderHeader: shell.renderHeader,
    loadRoutineExercise: notation.loadRoutineExercise,
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
  initSettings({
    store,
    pitchMonitor,
    tunerMonitor,
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
