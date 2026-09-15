import { noteName } from "../audio.js";

/**
 * Initializes progress-card and CSV export actions.
 */
export function initExport({ store, alertUser }) {
  document.getElementById("export-progress")?.addEventListener("click", () => {
    exportProgress(store.state, alertUser);
  });
  document
    .getElementById("export-history-csv")
    ?.addEventListener("click", () => exportCsv(store.state));
}

function exportProgress(state, alertUser) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(1, "#164e63");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1080);
  context.fillStyle = "#e2e8f0";
  context.font = "bold 76px system-ui";
  context.fillText("VocalGym", 80, 150);
  context.font = "32px system-ui";
  const range = state.range.current;
  const bestScore = Math.max(
    0,
    ...state.sessions
      .map((session) => session.score)
      .filter((score) => Number.isFinite(score)),
  );
  const lines = [
    `Racha: ${state.streak.best} días`,
    `Sesiones: ${state.sessions.length}`,
    `Mejor puntaje: ${bestScore}`,
    `Rango: ${range ? `${noteName(range.lowMidi)}–${noteName(range.highMidi)}` : "—"}`,
    `Mejor verde: ${Math.round((state.stats.bestGreenStreakMs || 0) / 1000)} s`,
    new Date().toLocaleDateString("es-ES"),
  ];
  lines.forEach((line, index) => context.fillText(line, 90, 280 + index * 78));
  canvas.toBlob(async (blob) => {
    if (!blob) {
      return;
    }
    const filename = `vocalgym-progreso-${new Date().toISOString().slice(0, 10)}.png`;
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: "image/png" })] })) {
      try {
        await navigator.share({
          files: [new File([blob], filename, { type: "image/png" })],
          title: "Mi progreso en VocalGym",
        });
        return;
      } catch {
        // Fall back to a download when sharing is cancelled or unavailable.
      }
    }
    download(blob, filename);
    alertUser("Tarjeta de progreso lista.");
  }, "image/png");
}

function exportCsv(state) {
  const rows = [
    ["date", "durationSec", "score", "greenStreakMs", "routineId", "exercises"],
    ...state.sessions.map((session) => [
      session.date,
      session.durationSec || 0,
      session.score ?? "",
      session.greenStreakMs || 0,
      session.routineId || "",
      (session.perExercise || [])
        .map((exercise) => `${exercise.id}:${exercise.score ?? ""}`)
        .join("|"),
    ]),
  ];
  const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), "vocalgym-historial.csv");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
