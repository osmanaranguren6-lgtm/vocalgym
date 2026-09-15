/**
 * Initializes BPM controls, signatures, tap tempo, and visual beats.
 */
export function initMetronome({ bus, metronome }) {
  const setBpm = (value) => {
    const bpm = Math.max(40, Math.min(240, Number(value) || 90));
    document.getElementById("bpm-slider").value = bpm;
    document.getElementById("bpm-input").value = bpm;
    document.getElementById("bpm-label").textContent = bpm;
    metronome.setBpm(bpm);
  };

  document.getElementById("bpm-slider").addEventListener("input", (event) => {
    setBpm(event.target.value);
  });
  document.getElementById("bpm-input").addEventListener("change", (event) => {
    setBpm(event.target.value);
  });

  document.querySelectorAll(".bpm-adjust").forEach((button) => {
    button.addEventListener("click", () => {
      setBpm(
        Number(document.getElementById("bpm-input").value) +
          Number(button.dataset.delta),
      );
    });
  });

  document.querySelectorAll(".signature-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".signature-button").forEach((item) => {
        item.classList.remove("active");
      });
      button.classList.add("active");
      metronome.signature = button.dataset.signature;
    });
  });

  document
    .getElementById("metronome-toggle")
    .addEventListener("click", async () => {
      await metronome.toggle();
      document.getElementById("metronome-toggle").textContent =
        metronome.running ? "Detener" : "Iniciar";
    });

  const taps = [];
  document.getElementById("tap-tempo").addEventListener("click", () => {
    const now = performance.now();
    taps.push(now);

    if (taps.length > 4) {
      taps.shift();
    }

    if (taps.length > 1) {
      setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
    }
  });

  bus.addEventListener("metronome:beat", () => {
    const pulse = document.getElementById("metronome-pulse");
    pulse.classList.remove("beat");
    void pulse.offsetWidth;
    pulse.classList.add("beat");
  });
}
