import { freqFromMidi, noteName } from "../audio.js";

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];
const MINOR = [0, 2, 3, 5, 7, 8, 10, 12];
const ARPEGGIO = [0, 4, 7, 12];

/**
 * Initializes guided reference notes and the tuner drone.
 */
export function initGuide({ audio, bus, store, alertUser, stopRoutine }) {
  const rootSelect = document.getElementById("guide-root");
  const modeSelect = document.getElementById("guide-mode");
  const playButton = document.getElementById("guide-play");
  const droneToggle = document.getElementById("guide-drone");
  const status = document.getElementById("guide-status");
  let timer = null;
  let synth = null;
  let drone = null;
  let playing = false;

  for (let midi = 36; midi <= 84; midi++) {
    const option = document.createElement("option");
    option.value = midi;
    option.textContent = `${noteName(midi)} · ${midi}`;
    if (midi === 60) {
      option.selected = true;
    }
    rootSelect.append(option);
  }

  function stopSequence() {
    window.clearTimeout(timer);
    timer = null;
    playing = false;
    synth?.dispose();
    synth = null;
    audio.setTarget(null);
    status.textContent = "";
    playButton.textContent = "▶ Tocar";
  }

  function stopDrone() {
    drone?.stop();
    drone?.dispose();
    drone = null;
    droneToggle.checked = false;
  }

  function setTarget(midi) {
    audio.setTarget({
      midi,
      freq: freqFromMidi(midi, store.state.settings.a4),
    });
    status.textContent = `Nota guía: ${noteName(midi)}`;
    document.getElementById("guide-target").textContent = ` · ${noteName(midi)}`;
  }

  function sequence() {
    const root = Number(rootSelect.value);
    const intervals =
      modeSelect.value === "major"
        ? MAJOR
        : modeSelect.value === "minor"
          ? MINOR
          : modeSelect.value === "arpeggio"
            ? ARPEGGIO
            : [0];
    return [...intervals, ...intervals.slice(-2, -1), ...intervals.slice(0, -1).reverse()].map(
      (interval) => root + interval,
    );
  }

  async function playSequence() {
    stopSequence();
    stopRoutine?.();
    await Tone.start();
    synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      volume: -8,
    }).toDestination();
    const notes = sequence();
    let index = 0;
    playing = true;
    playButton.textContent = "■ Detener";
    const next = () => {
      if (!playing || index >= notes.length) {
        stopSequence();
        return;
      }
      const midi = notes[index];
      setTarget(midi);
      synth.triggerAttackRelease(
        Tone.Frequency(freqFromMidi(midi, store.state.settings.a4)),
        0.6,
      );
      index += 1;
      timer = window.setTimeout(next, 60000 / 90);
    };
    next();
  }

  playButton.addEventListener("click", async () => {
    if (playing) {
      stopSequence();
    } else if (window.Tone) {
      await playSequence();
    } else {
      alertUser("El audio guía no está disponible en este navegador.");
    }
  });
  droneToggle.addEventListener("change", () => {
    stopDrone();
    if (!droneToggle.checked) {
    audio.setTarget(null);
    status.textContent = "";
    document.getElementById("guide-target").textContent = "";
      return;
    }
    Tone.start();
    const midi = Number(rootSelect.value);
    drone = new Tone.Oscillator({
      frequency: freqFromMidi(midi, store.state.settings.a4),
      type: "sine",
      volume: -18,
    }).toDestination();
    drone.start();
    setTarget(midi);
  });
  window.addEventListener("tab:change", (event) => {
    if (event.detail !== "tuner") {
      stopSequence();
      stopDrone();
    }
  });
  bus.addEventListener("stage:change", () => {
    stopSequence();
    stopDrone();
  });

  return {
    stop() {
      stopSequence();
      stopDrone();
    },
  };

}
