import { noteName } from "../audio.js";
import { phrase } from "../gamification.js";
import { alertUser, renderHeader, setZone } from "./header.js";

/**
 * Creates the shared shell behavior used by every application panel.
 */
export function createShell({ audio, bus, store, pitchMonitor, tunerMonitor }) {
  let lastFrame = null;
  let activeSeconds = 0;
  let lastElapsed = 0;
  let restSeconds = null;

  /**
   * Returns a page element by ID.
   */
  function getElement(id) {
    return document.getElementById(id);
  }

  /**
   * Activates the microphone from a user gesture.
   */
  async function activateMicrophone() {
    try {
      await audio.start();
      getElement("mic-status-text").textContent =
        `Micrófono activo · ${audio.ctx.sampleRate} Hz`;
      getElement("mic-button").textContent = "Micrófono activo";
      getElement("mic-button").disabled = true;
      document.querySelector(".status-dot").classList.add("live");
    } catch (error) {
      alertUser(error.message);
    }
  }

  /**
   * Updates both tuner panels from a pitch frame.
   */
  function updatePitchFeedback(frame) {
    if (!frame.voiced) {
      setZone("none", "Te escucho cuando quieras");
      return;
    }

    const cents = frame.cents || 0;
    const message =
      frame.zone === "green"
        ? Math.abs(cents) < 4
          ? "¡Ahí está!"
          : "Centrado"
        : frame.zone === "yellow"
          ? cents < 0
            ? "Un poco más de aire ↑"
            : "Relaja, deja caer ↓"
          : "Buscando… acércate a la nota";

    setZone(frame.zone, message);
    getElement("pitch-note").textContent = noteName(frame.midi);
    const frequency = Number.isFinite(frame.f0) ? `${frame.f0.toFixed(1)} Hz` : "Voz detectada";
    getElement("pitch-frequency").textContent =
      `${frequency} · ${cents > 0 ? "+" : ""}${cents.toFixed(0)} cents`;
    getElement("tuner-note").textContent = noteName(frame.midi);
    getElement("tuner-cents").textContent =
      `${cents > 0 ? "+" : ""}${cents.toFixed(0)} cents`;

    const needle = Math.max(-50, Math.min(50, cents));
    getElement("cents-needle").style.transform = `rotate(${needle * 1.2}deg)`;
    getElement("pitch-feedback").textContent =
      getElement("zone-chip").textContent;
  }

  /**
   * Updates the vocal-health total and emits a rest requirement.
   */
  function updateVocalHealth(detail) {
    if (lastFrame?.voiced) {
      const delta = Math.max(0, Math.min(0.2, detail.elapsed - lastElapsed));
      activeSeconds += delta;
      store.state.stats.totalActiveSec += delta;

      const threshold = store.state.settings.restAfterMin * 60;
      if (activeSeconds >= threshold - 300 && activeSeconds < threshold - 299) {
        alertUser("5 min para tu descanso vocal.");
      }

      if (activeSeconds >= threshold) {
        bus.dispatchEvent(
          new CustomEvent("rest:required", {
            detail: { activeSeconds },
          }),
        );
        showRestOverlay();
      }
    }

    lastElapsed = detail.elapsed;
  }

  /**
   * Shows the mandatory vocal rest overlay and countdown.
   */
  function showRestOverlay() {
    if (restSeconds !== null) {
      return;
    }

    restSeconds = 600;
    audio.setEnabled(false);
    getElement("rest-overlay").classList.remove("hidden");
    getElement("rest-overlay").classList.add("flex");
    getElement("motivation").textContent = phrase("rest");

    const unlockTimer = window.setTimeout(() => {
      getElement("rest-continue").classList.remove("hidden");
    }, 60000);
    const interval = window.setInterval(() => {
      updateRestCountdown();

      if (restSeconds <= 0) {
        closeRestOverlay(interval, unlockTimer);
      }
    }, 1000);

    getElement("rest-continue").onclick = () => {
      if (restSeconds < 540) {
        closeRestOverlay(interval, unlockTimer);
      }
    };

    updateRestCountdown();
  }

  /**
   * Updates the visible rest countdown.
   */
  function updateRestCountdown() {
    getElement("rest-countdown").textContent = `${Math.floor(restSeconds / 60)
      .toString()
      .padStart(2, "0")}:${(restSeconds % 60).toString().padStart(2, "0")}`;

    if (restSeconds > 0) {
      restSeconds -= 1;
    }
  }

  /**
   * Closes the rest overlay and restores microphone input.
   */
  function closeRestOverlay(interval, unlockTimer) {
    window.clearInterval(interval);
    window.clearTimeout(unlockTimer);
    getElement("rest-overlay").classList.add("hidden");
    getElement("rest-overlay").classList.remove("flex");
    getElement("rest-continue").classList.add("hidden");
    audio.setEnabled(true);
    store.update((state) => {
      state.stats.fullRestsTaken += 1;
    });
    activeSeconds = 0;
    restSeconds = null;
  }

  bus.addEventListener("pitch:frame", (event) => {
    lastFrame = event.detail;
    updatePitchFeedback(event.detail);
  });
  bus.addEventListener("note:target", (event) => {
    audio.setTarget(event.detail);
    pitchMonitor.target = event.detail;
    tunerMonitor.target = event.detail;
  });
  bus.addEventListener("audio:warning", (event) => {
    alertUser(event.detail);
  });
  bus.addEventListener("audio:error", (event) => {
    alertUser(event.detail.message || "No se pudo activar el audio.");
  });
  bus.addEventListener("timer:tick", (event) => {
    updateVocalHealth(event.detail);
  });

  getElement("mic-button").addEventListener("click", activateMicrophone);
  getElement("tuner-mic").addEventListener("click", activateMicrophone);

  return {
    activateMicrophone,
    alertUser,
    renderHeader: () => renderHeader(store.state),
  };
}
