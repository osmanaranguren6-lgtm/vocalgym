import { noteName } from "../audio.js";

/**
 * Initializes the hand-drawn history charts and summary statistics.
 */
export function initHistory({ store, bus }) {
  const scoreCanvas = document.getElementById("history-score-chart");
  const rangeCanvas = document.getElementById("history-range-chart");
  const tooltip = document.getElementById("history-tooltip");
  let scorePoints = [];

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function empty(canvas, message) {
    const context = canvas.getContext("2d");
    const { width, height } = resizeCanvas(canvas);
    context.fillStyle = "#94a3b8";
    context.font = "14px system-ui";
    context.textAlign = "center";
    context.fillText(message, width / 2, height / 2);
  }

  function renderStats(state) {
    const values = [
      ["Minutos activos", Math.round(state.stats.totalActiveSec / 60)],
      ["Sesiones", state.sessions.length],
      ["Mejor verde", `${Math.round(state.stats.bestGreenStreakMs / 1000)} s`],
      ["Mejor racha", `${state.streak.best} días`],
    ];
    document.getElementById("history-stats").innerHTML = values
      .map(
        ([label, value]) => `
          <div class="stat-card">
            <span>${label}</span>
            <strong>${value}</strong>
          </div>
        `,
      )
      .join("");
  }

  function renderScore(state) {
    const sessions = state.sessions.slice(-30);
    scorePoints = [];
    if (!sessions.length) {
      empty(scoreCanvas, "Todavía no hay sesiones para mostrar.");
      return;
    }
    const context = scoreCanvas.getContext("2d");
    const { width, height } = resizeCanvas(scoreCanvas);
    const pad = { left: 34, right: 16, top: 18, bottom: 30 };
    const innerWidth = width - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(148,163,184,.2)";
    context.fillStyle = "#94a3b8";
    context.font = "11px system-ui";
    context.textAlign = "right";
    [0, 50, 100].forEach((value) => {
      const y = pad.top + innerHeight * (1 - value / 100);
      context.beginPath();
      context.moveTo(pad.left, y);
      context.lineTo(width - pad.right, y);
      context.stroke();
      context.fillText(value, pad.left - 6, y + 4);
    });
    const gradient = context.createLinearGradient(
      pad.left,
      0,
      width - pad.right,
      0,
    );
    gradient.addColorStop(0, "#22d3a5");
    gradient.addColorStop(1, "#67e8f9");
    context.strokeStyle = gradient;
    context.lineWidth = 3;
    context.beginPath();
    sessions.forEach((session, index) => {
      const x =
        sessions.length === 1
          ? pad.left + innerWidth / 2
          : pad.left + (innerWidth * index) / (sessions.length - 1);
      const score = Math.max(0, Math.min(100, Number(session.score) || 0));
      const y = pad.top + innerHeight * (1 - score / 100);
      scorePoints.push({ x, y, session });
      if (!index) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    context.fillStyle = "#e2e8f0";
    context.textAlign = "center";
    scorePoints.forEach(({ x, y, session }, index) => {
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
      if (index === 0 || index === scorePoints.length - 1 || scorePoints.length < 8) {
        context.fillStyle = "#94a3b8";
        context.fillText(
          new Date(session.date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
          }),
          x,
          height - 9,
        );
        context.fillStyle = "#e2e8f0";
      }
    });
  }

  function renderRange(state) {
    const measurements = state.range.history || [];
    if (!measurements.length) {
      empty(rangeCanvas, "Aún no hay mediciones de rango.");
      return;
    }
    const context = rangeCanvas.getContext("2d");
    const { width, height } = resizeCanvas(rangeCanvas);
    const pad = { left: 42, right: 16, top: 14, bottom: 24 };
    const low = Math.floor(
      Math.min(...measurements.map((item) => item.lowMidi)) / 12,
    ) * 12;
    const high =
      (Math.floor(Math.max(...measurements.map((item) => item.highMidi)) / 12) +
        1) *
      12;
    const scale = (height - pad.top - pad.bottom) / (high - low);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(148,163,184,.18)";
    context.fillStyle = "#94a3b8";
    context.font = "11px system-ui";
    context.textAlign = "right";
    for (let midi = low; midi <= high; midi += 12) {
      const y = pad.top + (high - midi) * scale;
      context.beginPath();
      context.moveTo(pad.left, y);
      context.lineTo(width - pad.right, y);
      context.stroke();
      context.fillText(noteName(midi), pad.left - 6, y + 4);
    }
    const barWidth = Math.max(
      4,
      Math.min(24, (width - pad.left - pad.right) / measurements.length - 8),
    );
    measurements.forEach((item, index) => {
      const x =
        pad.left +
        ((width - pad.left - pad.right) * (index + 0.5)) / measurements.length;
      const yTop = pad.top + (high - item.highMidi) * scale;
      const yBottom = pad.top + (high - item.lowMidi) * scale;
      const gradient = context.createLinearGradient(0, yTop, 0, yBottom);
      gradient.addColorStop(0, "#67e8f9");
      gradient.addColorStop(1, "#a78bfa");
      context.fillStyle = gradient;
      context.fillRect(x - barWidth / 2, yTop, barWidth, yBottom - yTop);
    });
  }

  function render() {
    renderStats(store.state);
    renderScore(store.state);
    renderRange(store.state);
  }

  scoreCanvas.addEventListener("mousemove", (event) => {
    const rect = scoreCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const point = scorePoints.find(({ x: pointX }) => Math.abs(pointX - x) < 12);
    if (!point) {
      tooltip.classList.add("hidden");
      return;
    }
    tooltip.textContent = `${new Date(point.session.date).toLocaleDateString(
      "es-ES",
    )}: ${point.session.score}%`;
    tooltip.style.left = `${event.clientX + 12}px`;
    tooltip.style.top = `${event.clientY - 34}px`;
    tooltip.classList.remove("hidden");
  });
  scoreCanvas.addEventListener("mouseleave", () => {
    tooltip.classList.add("hidden");
  });
  const observer = new ResizeObserver(render);
  observer.observe(scoreCanvas);
  observer.observe(rangeCanvas);
  document
    .querySelector('[data-tab="history"]')
    .addEventListener("click", render);
  bus.addEventListener("routine:complete", render);
  bus.addEventListener("range:measured", render);
  render();
}
