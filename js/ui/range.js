import { measure, pianoHTML } from "../range.js";
import { evaluateBadges, updateStreak } from "../gamification.js";

/**
 * Initializes the two-pass vocal-range recording workflow.
 */
export function initRange({
  audio,
  bus,
  store,
  activateMicrophone,
  alertUser,
  renderHeader,
}) {
  let lowFrames = [];
  let highFrames = [];

  async function record(kind) {
    await activateMicrophone();

    const button = document.getElementById(
      kind === "low" ? "range-low" : "range-high",
    );
    const status = document.getElementById(
      kind === "low" ? "range-low-status" : "range-high-status",
    );

    button.disabled = true;

    for (let count = 3; count > 0; count -= 1) {
      status.textContent = `${count}…`;
      await new Promise((resolve) => window.setTimeout(resolve, 700));
    }

    status.textContent = "Grabando…";
    const frames = [];
    const listener = (event) => frames.push(event.detail);

    bus.addEventListener("pitch:frame", listener);
    await new Promise((resolve) => window.setTimeout(resolve, 6000));
    bus.removeEventListener("pitch:frame", listener);
    button.disabled = false;

    try {
      if (kind === "low") {
        lowFrames = frames;
        status.textContent = "Medida guardada";
        document.getElementById("range-high").focus();
        return;
      }

      highFrames = frames;
      status.textContent = "Medida guardada";
      const result = measure(
        lowFrames,
        highFrames,
        store.state.settings.a4,
        document.getElementById("range-falsetto").checked,
      );

      store.update((state) => {
        state.range.current = result;
        state.range.history.push(result);
        updateStreak(state);
      });
      renderRange(result);
      evaluateBadges(store.state, bus);
      renderHeader();
      bus.dispatchEvent(
        new CustomEvent("range:measured", {
          detail: result,
        }),
      );
    } catch (error) {
      status.textContent = "Repite con una nota sostenida";
      alertUser(error.message);
    }
  }

  document.getElementById("range-low").addEventListener("click", () => {
    record("low");
  });
  document.getElementById("range-high").addEventListener("click", () => {
    record("high");
  });
}

/**
 * Renders the measured range result and piano visualization.
 */
export function renderRange(result) {
  const element = document.getElementById("range-result");
  element.classList.remove("hidden");
  element.innerHTML = `
    <div class="range-result">
      <p class="eyebrow">Tu mapa vocal</p>
      <h2 class="mt-2 text-2xl font-black">
        ${result.lowNote} — ${result.highNote}
      </h2>
      <p class="mt-2 text-cyan-300">
        ${result.semitones.toFixed(1)} semitonos ·
        ${result.octaves.toFixed(1)} octavas
      </p>
      <div class="mt-4">${pianoHTML(result)}</div>
      <p class="mt-4 text-lg">
        Estimación:
        <strong>${result.voiceType}</strong>
        <span class="text-slate-400">(posible ${result.secondary})</span>
      </p>
      <p class="mt-2 text-sm text-slate-500">
        El tipo real depende de timbre, passaggi y tesitura cómoda;
        esto orienta la transposición.
      </p>
    </div>
  `;
}
