import { BADGES } from "../gamification.js";

/**
 * Initializes badge events and reward rendering.
 */
export function initRewards({ bus, store }) {
  renderBadges(store.state);

  bus.addEventListener("badge:unlocked", (event) => {
    showBadgeToast(event.detail);
    renderBadges(store.state);
  });
}

/**
 * Renders unlocked badges and recent session history.
 */
export function renderBadges(state) {
  document.getElementById("badges-grid").innerHTML = BADGES.map(
    (badge) => `
      <article class="badge-card ${state.badges[badge.id] ? "unlocked" : ""}">
        <div class="text-4xl">${badge.icon}</div>
        <h3 class="mt-3 font-bold">${badge.name}</h3>
        <p class="mt-2 text-sm text-slate-400">${badge.description}</p>
        <p class="mt-1 text-xs text-slate-500">
          ${
            state.badges[badge.id]
              ? `Desbloqueado · ${new Date(
                  state.badges[badge.id],
                ).toLocaleDateString("es-ES")}`
              : "Bloqueado · En progreso"
          }
        </p>
      </article>
    `,
  ).join("");

  document.getElementById("session-history").innerHTML =
    state.sessions
      .slice()
      .reverse()
      .slice(0, 8)
      .map(
        (session) => `
          <div class="flex justify-between rounded-xl border border-slate-800 p-3">
            <span>${new Date(session.date).toLocaleDateString("es-ES")}</span>
            <strong class="text-cyan-300">${session.score}%</strong>
          </div>
        `,
      )
      .join("") ||
    "<p>Aún no hay sesiones. Tu primera práctica aparecerá aquí.</p>";
}

/**
 * Displays a badge toast with confetti and a short sound.
 */
export function showBadgeToast(badge) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <strong>${badge.icon} ${badge.name}</strong>
    <p class="mt-1 text-sm text-slate-300">¡Nuevo logro desbloqueado!</p>
  `;

  for (let index = 0; index < 14; index += 1) {
    const confetti = document.createElement("i");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = ["#22d3a5", "#fbbf24", "#fb7185", "#67e8f9"][
      index % 4
    ];
    toast.append(confetti);
  }

  document.getElementById("toast-root").append(toast);
  window.setTimeout(() => toast.remove(), 4000);

  if (window.Tone) {
    const synth = new Tone.Synth({ volume: -16 }).toDestination();
    synth.triggerAttackRelease("C6", ".15");
  }
}
