/**
 * Tracks vibrato characteristics from the recent smoothed pitch stream.
 */
export class VibratoAnalyzer {
  constructor() {
    this.frames = [];
  }

  push(frame, now = performance.now()) {
    if (frame?.voiced && Number.isFinite(frame.midi)) {
      this.frames.push({ now, midi: frame.midi });
    }
    this.frames = this.frames.filter((item) => now - item.now <= 1500);
    return this.result(now);
  }

  result(now = performance.now()) {
    const frames = this.frames.filter((item) => now - item.now <= 1500);
    if (frames.length < 8) {
      return null;
    }
    const duration = (frames.at(-1).now - frames[0].now) / 1000;
    if (duration < 0.6) {
      return null;
    }
    const residuals = frames.map((item, index) => {
      const nearby = frames.filter(
        (other) => Math.abs(other.now - item.now) <= 150,
      );
      const average =
        nearby.reduce((total, other) => total + other.midi, 0) / nearby.length;
      return item.midi - average;
    });
    let crossings = 0;
    for (let index = 1; index < residuals.length; index += 1) {
      if (
        (residuals[index - 1] <= 0 && residuals[index] > 0) ||
        (residuals[index - 1] >= 0 && residuals[index] < 0)
      ) {
        crossings += 1;
      }
    }
    const rms = Math.sqrt(
      residuals.reduce((total, value) => total + value ** 2, 0) /
        residuals.length,
    );
    const rate = crossings / 2 / duration;
    const extent = 2 * rms * 100 * Math.sqrt(2);
    if (rate < 4 || rate > 8 || extent < 20 || extent > 200) {
      return null;
    }
    return { rate, extent, duration };
  }
}

/**
 * Detects probable pressure from loud unstable target-matched singing.
 */
export class PressureDetector {
  constructor() {
    this.frames = [];
    this.lastAlertAt = -Infinity;
  }

  push(frame, now = performance.now()) {
    if (frame?.voiced && Number.isFinite(frame.rms)) {
      this.frames.push({
        now,
        rms: frame.rms,
        midi: Math.round(frame.midi),
        cents: Number(frame.cents) || 0,
      });
    }
    this.frames = this.frames.filter((item) => now - item.now <= 30000);
    const recent = this.frames.filter((item) => now - item.now <= 1000);
    if (
      this.frames.length < 5 ||
      recent.length < 3 ||
      now - this.frames[0].now < 5000
    ) {
      return false;
    }
    const baseline = median(this.frames.map((item) => item.rms));
    const meanRms =
      recent.reduce((total, item) => total + item.rms, 0) / recent.length;
    const mean = recent.reduce((total, item) => total + item.cents, 0) / recent.length;
    const variance =
      recent.reduce((total, item) => total + (item.cents - mean) ** 2, 0) /
      recent.length;
    const sameNote = recent.every((item) => item.midi === recent[0].midi);
    const alerted = now - this.lastAlertAt >= 20000 &&
      meanRms > baseline * 3 &&
      Math.sqrt(variance) > 60 &&
      sameNote;
    if (alerted) {
      this.lastAlertAt = now;
    }
    return alerted;
  }
}

/**
 * Starts live voice analysis, range-map persistence, and pressure alerts.
 */
export function initAnalysis({ store, bus, renderPressure, renderAnalysis }) {
  const vibrato = new VibratoAnalyzer();
  const pressure = new PressureDetector();
  let lastSave = 0;
  bus.addEventListener("pitch:frame", (event) => {
    const frame = event.detail;
    const now = performance.now();
    renderAnalysis?.(vibrato.push(frame, now), frame);
    if (pressure.push(frame, now)) {
      store.update((state) => {
        state.stats.pressureAlerts += 1;
      });
      renderPressure?.();
    }
    if (!frame?.voiced || !Number.isFinite(frame.midi)) {
      return;
    }
    const midi = Math.max(36, Math.min(96, Math.round(frame.midi)));
    const entry = store.state.analysis.rangeMap[midi] || {
      frames: 0,
      accSum: 0,
      hnrSum: 0,
    };
    entry.frames += 1;
    entry.accSum += Math.max(
      0,
      Math.min(1, 1 - Math.abs(Number(frame.cents) || 0) / 50),
    );
    entry.hnrSum += Number(frame.hnr) || 0;
    store.state.analysis.rangeMap[midi] = entry;
    if (now - lastSave > 500) {
      store.update(() => {});
      lastSave = now;
    }
  });
  return { vibrato, pressure };
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] || 0;
}
