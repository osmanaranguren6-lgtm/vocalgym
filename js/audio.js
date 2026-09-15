/** Names of the twelve chromatic notes. */
export const NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
/** Converts a frequency in hertz into a MIDI pitch number. */
export const midiFromFreq = (f, a4 = 440) => 69 + 12 * Math.log2(f / a4);

/** Converts a MIDI pitch number into a frequency in hertz. */
export const freqFromMidi = (m, a4 = 440) => a4 * 2 ** ((m - 69) / 12);

/** Returns the interval between two frequencies in cents. */
export const cents = (a, b) => 1200 * Math.log2(a / b);

/** Formats a MIDI pitch number as a note name. */
export const noteName = (m) =>
  `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

/** Captures microphone audio and publishes smoothed pitch frames. */
export class AudioEngine extends EventTarget {
  constructor(bus, getSettings) {
    super();
    this.bus = bus;
    this.getSettings = getSettings;
    this.ctx = null;
    this.stream = null;
    this.node = null;
    this.history = [];
    this.target = null;
    this.recent = [];
  }
  async start() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia)
      throw Error("Este navegador no permite acceder al micrófono.");
    const s = this.getSettings();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 48000,
        deviceId: s.deviceId || undefined,
      },
      video: false,
    });
    this.ctx = new AudioContext({
      latencyHint: "interactive",
      sampleRate: 48000,
    });
    await this.ctx.audioWorklet.addModule("js/pitch-worklet.js");
    const src = this.ctx.createMediaStreamSource(this.stream),
      hp = new BiquadFilterNode(this.ctx, { type: "highpass", frequency: 60 });
    this.node = new AudioWorkletNode(this.ctx, "pitch-processor", {
      processorOptions: { bufferSize: 2048, hop: 512 },
    });
    src.connect(hp).connect(this.node);
    this.node.port.onmessage = (e) => this.onFrame(e.data);
    this.stream.getAudioTracks()[0].onended = () =>
      this.dispatchEvent(new CustomEvent("audio:ended"));
    const st = this.stream.getAudioTracks()[0].getSettings();
    const processing = [
      "echoCancellation",
      "noiseSuppression",
      "autoGainControl",
    ].filter((k) => st[k] === true);
    if (processing.length)
      this.bus.dispatchEvent(
        new CustomEvent("audio:warning", {
          detail: `El dispositivo mantiene procesamiento (${processing.join(", ")}). Para máxima precisión prueba Chrome/Edge.`,
        }),
      );
    this.dispatchEvent(
      new CustomEvent("audio:ready", {
        detail: { sampleRate: this.ctx.sampleRate, settings: st },
      }),
    );
  }
  onFrame(data) {
    let f0 = data.voiced ? data.f0 : null;
    if (f0) {
      this.recent.push(f0);
      if (this.recent.length > 5) this.recent.shift();
      const sorted = [...this.recent].sort((a, b) => a - b);
      f0 = sorted[Math.floor(sorted.length / 2)];
    }
    const s = this.getSettings(),
      a4 = s.a4 || 440;
    let midi = null,
      c = null,
      zone = "none";
    if (f0) {
      const near = Math.round(midiFromFreq(f0, a4));
      midi = near;
      c = cents(f0, freqFromMidi(this.target?.midi ?? near, a4));
      const t =
        s.tolerance === "beginner"
          ? [25, 50]
          : s.tolerance === "pro"
            ? [8, 25]
            : [15, 40];
      if (Math.abs(c) <= t[0]) zone = "green";
      else if (Math.abs(c) <= t[1]) zone = "yellow";
      else zone = "red";
    }
    const frame = {
      ...data,
      f0,
      midi,
      cents: c,
      zone,
      vibrato: false,
      voiced: Boolean(f0),
    };
    this.history.push(frame);
    if (this.history.length > 800) this.history.shift();
    this.bus.dispatchEvent(new CustomEvent("pitch:frame", { detail: frame }));
    this.dispatchEvent(new CustomEvent("pitch:frame", { detail: frame }));
  }
  setTarget(target) {
    this.target = target;
  }
  setEnabled(enabled) {
    if (this.stream)
      this.stream.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }
  stop() {
    this.setEnabled(false);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.node?.disconnect();
    this.node = null;
    this.stream = null;
    this.ctx?.close();
    this.ctx = null;
    this.target = null;
  }
  getState() {
    return this.ctx?.state || "suspended";
  }
}
