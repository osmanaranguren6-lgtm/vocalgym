/** Draws pitch history, target bands, grid lines, and cents needle. */
export class PitchMonitor {
  constructor(canvas, bus, a4 = 440) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.bus = bus;
    this.a4 = a4;
    this.points = [];
    this.target = null;
    this.last = null;
    this.resize = new ResizeObserver(() => this.size());
    this.resize.observe(canvas);
    this.size();
    bus.addEventListener("pitch:frame", (e) => {
      this.points.push(e.detail);
      if (this.points.length > 750) this.points.shift();
      this.last = e.detail;
    });
    bus.addEventListener("note:target", (e) => (this.target = e.detail));
    this.raf = 0;
    this.draw();
  }
  setA4(a4) {
    this.a4 = a4;
  }
  size() {
    const r = this.canvas.getBoundingClientRect(),
      d = devicePixelRatio || 1;
    this.canvas.width = Math.max(1, r.width * d);
    this.canvas.height = Math.max(1, r.height * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.w = r.width;
    this.h = r.height;
  }
  draw() {
    const c = this.ctx,
      w = this.w || 300,
      h = this.h || 220;
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#020617";
    c.fillRect(0, 0, w, h);
    const minMidi = this.target?.midi ? this.target.midi - 5 : 48,
      maxMidi = minMidi + 12;
    for (let m = Math.ceil(minMidi); m <= maxMidi; m++) {
      const y = h - ((m - minMidi) / (maxMidi - minMidi)) * h;
      c.strokeStyle = m % 12 === 0 ? "#334155" : "#1e293b";
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    if (this.target) {
      const y = h - ((this.target.midi - minMidi) / (maxMidi - minMidi)) * h;
      c.fillStyle = "#22d3a522";
      c.fillRect(0, y - 10, w, 20);
      c.fillStyle = "#fbbf2420";
      c.fillRect(0, y - 26, w, 52);
    }
    const start = Date.now() / 1000 - 8;
    this.points.forEach((p, i) => {
      if (!p.voiced) return;
      const x = w - (Date.now() / 1000 - p.t);
      if (x < 0 || x > w) return;
      const midi = p.midi ?? 69 + 12 * Math.log2(p.f0 / this.a4);
      const y = h - ((midi - minMidi) / (maxMidi - minMidi)) * h;
      c.fillStyle =
        p.zone === "green"
          ? "#22d3a5"
          : p.zone === "yellow"
            ? "#fbbf24"
            : "#fb7185";
      c.beginPath();
      c.arc(x, y, 2.5, 0, Math.PI * 2);
      c.fill();
    });
    if (this.last?.voiced) {
      const cents = Math.max(-50, Math.min(50, this.last.cents || 0));
      c.strokeStyle = "#e2e8f0";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(w - 18, h - 18);
      c.lineTo(w - 18 + (cents / 50) * 14, h - 38);
      c.stroke();
    }
    this.raf = requestAnimationFrame(() => this.draw());
  }
}
