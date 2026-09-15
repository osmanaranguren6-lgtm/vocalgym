import { VoiceRecorder } from "../recorder.js";

/**
 * Initializes the shared in-memory recording list and controls.
 */
export function initRecordings({ audio, bus, alertUser }) {
  const recorder = new VoiceRecorder();
  const clips = [];
  let currentLabel = "";
  let currentExerciseId = "";
  let currentStartedAt = 0;
  const urls = new Set();
  const list = document.getElementById("recordings-list");
  const manualButton = document.getElementById("manual-record");
  const manualStopButton = document.getElementById("manual-stop");
  if (!window.MediaRecorder) {
    manualButton?.classList.add("hidden");
    manualStopButton?.classList.add("hidden");
    document.getElementById("record-exercises")?.closest("label")?.classList.add("hidden");
  }

  function render() {
    if (!list) {
      return;
    }
    list.innerHTML = clips.length
      ? clips
          .map(
            (clip) => `
              <li class="recording-row" data-recording-id="${clip.id}">
                <div>
                  <strong>${clip.label}</strong>
                  <span>${clip.duration}s</span>
                </div>
                <audio controls src="${clip.url}"></audio>
                <a class="secondary-button" href="${clip.url}" download="${clip.filename}">
                  Descargar
                </a>
                <button class="secondary-button recording-delete" type="button" data-recording-id="${clip.id}">
                  Borrar
                </button>
              </li>
            `,
          )
          .join("")
      : '<li class="text-sm text-slate-500">Todavía no hay clips en esta sesión.</li>';
    list.querySelectorAll(".recording-delete").forEach((button) => {
      button.addEventListener("click", () => remove(button.dataset.recordingId));
    });
  }

  function add(blob, label, exerciseId, startedAt) {
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    urls.add(url);
    clips.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${clips.length}`,
      label,
      duration: Math.max(1, Math.round((performance.now() - startedAt) / 1000)),
      url,
      filename: `vocalgym-${exerciseId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toTimeString().slice(0, 8).replaceAll(":", "")}.${blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm"}`,
    });
    render();
  }

  function remove(id) {
    const index = clips.findIndex((clip) => clip.id === id);
    if (index < 0) {
      return;
    }
    URL.revokeObjectURL(clips[index].url);
    urls.delete(clips[index].url);
    clips.splice(index, 1);
    render();
  }

  async function stop() {
    if (!recorder.isRecording) {
      return;
    }
    const startedAt = currentStartedAt;
    const label = currentLabel;
    const exerciseId = currentExerciseId;
    const blob = await recorder.stop();
    currentLabel = "";
    currentExerciseId = "";
    currentStartedAt = 0;
    add(blob, label || "Grabación manual", exerciseId || "manual", startedAt);
    updateButtons();
  }

  async function start(label, exerciseId = label) {
    if (!audio.stream) {
      alertUser("Activa el micrófono para grabar tu voz.");
      return false;
    }
    await stop();
    currentLabel = label;
    currentExerciseId = exerciseId;
    currentStartedAt = performance.now();
    if (!recorder.start(audio.stream)) {
      alertUser("Las grabaciones no están disponibles en este navegador.");
      currentLabel = "";
      currentExerciseId = "";
      currentStartedAt = 0;
      return false;
    }
    updateButtons();
    return true;
  }

  function updateButtons() {
    const recording = recorder.isRecording;
    manualButton?.classList.toggle("hidden", recording);
    manualStopButton?.classList.toggle("hidden", !recording);
  }

  manualButton?.addEventListener("click", async () => {
    try {
      await audio.start();
    await start("Grabación del afinador", "afinador");
    } catch (error) {
      alertUser(error.message);
    }
  });
  manualStopButton?.addEventListener("click", () => stop());
  bus.addEventListener("routine:stop", () => stop());
  bus.addEventListener("routine:complete", () => stop());
  addEventListener("pagehide", () => {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.clear();
  });

  render();
  updateButtons();

  return {
    startExercise: start,
    stop,
    isRecording: () => recorder.isRecording,
  };
}
