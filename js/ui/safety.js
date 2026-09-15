/**
 * Wires vocal discomfort handling and the 24-hour rest banner.
 */
export function initSafety({ store, routine, audio, notation, alertUser }) {
  const dialog = document.getElementById("discomfort-dialog");
  const today = new Date().toISOString().slice(0, 10);
  const last = store.state.stats.lastDiscomfortDate;
  const lastTime = last ? new Date(`${last}T00:00:00`).getTime() : 0;
  const restActive =
    last && Date.now() - lastTime < 24 * 60 * 60 * 1000;
  if (restActive) {
    document.getElementById("vocal-rest-banner").classList.remove("hidden");
  }

  document.getElementById("discomfort-button").addEventListener("click", () => {
    dialog.showModal();
  });

  document
    .getElementById("discomfort-confirm")
    .addEventListener("click", () => {
      routine.stop();
      notation.stop();
      audio.stop();
      store.update((state) => {
        state.stats.lastDiscomfortDate = today;
        state.streak.graceUsedWeekOf = today.slice(0, 7);
      });
      document.getElementById("vocal-rest-banner").classList.remove("hidden");
      alertUser("Día de descanso vocal registrado.");
    });
}
