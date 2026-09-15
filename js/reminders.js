/**
 * Starts the open-app daily vocal practice reminder.
 */
export function initReminders({ store, alertUser }) {
  let lastCheck = "";

  async function requestPermission() {
    if (!("Notification" in window)) {
      alertUser("Las notificaciones no están disponibles en este navegador.");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alertUser("No se concedió permiso para las notificaciones.");
      return false;
    }
    return true;
  }

  async function check() {
    const reminder = store.state.settings.reminder;
    if (!reminder?.enabled) {
      return;
    }
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const [hour, minute] = reminder.time.split(":").map(Number);
    if (
      reminder.lastFiredDate === today ||
      now.getHours() < hour ||
      (now.getHours() === hour && now.getMinutes() < minute) ||
      store.state.sessions.some((session) =>
        session.date?.startsWith(today),
      )
    ) {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }
    const body = "Tu voz te espera: 5 minutos bastan para mantener la racha.";
    const registration = await navigator.serviceWorker?.ready;
    if (registration?.showNotification) {
      await registration.showNotification("VocalGym", { body });
    } else {
      new Notification("VocalGym", { body });
    }
    store.update((state) => {
      state.settings.reminder.lastFiredDate = today;
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      check();
    }
  });
  window.setInterval(() => {
    const minute = new Date().toISOString().slice(0, 16);
    if (minute !== lastCheck) {
      lastCheck = minute;
      check();
    }
  }, 60000);

  return {
    requestPermission,
    check,
  };
}
