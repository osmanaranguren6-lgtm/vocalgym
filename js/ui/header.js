import { WARMUP } from "../timing.js";
import { phrase } from "../gamification.js";

/**
 * Shows a temporary application alert.
 */
export function alertUser(text) {
  const element = document.getElementById("app-alert");
  element.textContent = text;
  element.classList.remove("hidden");

  window.setTimeout(() => {
    element.classList.add("hidden");
  }, 7000);
}

/**
 * Renders the stage cards for the routine panel.
 */
export function renderStages(stages = WARMUP) {
  const root = document.getElementById("stage-cards");

  root.innerHTML = stages.map(
    (stage, index) => `
      <article class="stage-card" id="stage-card-${stage.id}">
        <div class="flex items-center gap-2">
          <i class="stage-color bg-${stage.color}-400"></i>
          <span class="text-xs uppercase tracking-widest text-slate-400">
            Etapa ${index + 1}
          </span>
        </div>
        <h3 class="mt-3 font-bold">${stage.name}</h3>
        <p class="mt-2 text-sm text-slate-500">${stage.description}</p>
        <div class="mt-4 text-sm text-cyan-300">${stage.minutes} min</div>
      </article>
    `,
  ).join("");
}

/**
 * Updates the streak, medal, and motivational phrase in the header.
 */
export function renderHeader(state) {
  document.getElementById("streak-value").textContent = state.streak.current;
  document.getElementById("medal").textContent =
    state.streak.best >= 100
      ? "💎"
      : state.streak.best >= 30
        ? "🥇"
        : state.streak.best >= 7
          ? "🥈"
          : "🥉";
  document.getElementById("motivation").textContent = phrase("start");
}

/**
 * Updates the tuner zone chip and feedback chip.
 */
export function setZone(zone, text) {
  const zoneChip = document.getElementById("zone-chip");
  zoneChip.className = `zone-chip ${zone}`;
  zoneChip.textContent = text;

  const tunerChip = document.getElementById("tuner-feedback");
  if (tunerChip) {
    tunerChip.className = `zone-chip ${zone}`;
    tunerChip.textContent = text;
  }
}
