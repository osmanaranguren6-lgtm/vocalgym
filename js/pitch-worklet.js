const RMS_GATE = 10 ** (-50 / 20);
const MIN_FREQUENCY = 60;
const MAX_FREQUENCY = 1400;
const CLARITY_GATE = 0.9;

/**
 * AudioWorklet processor that estimates monophonic pitch with MPM.
 */
class PitchProcessor extends AudioWorkletProcessor {
  constructor({ processorOptions = {} }) {
    super();

    this.bufferSize = processorOptions.bufferSize || 2048;
    this.hopSize = processorOptions.hop || 512;
    this.ringBuffer = new Float32Array(this.bufferSize);
    this.analysisBuffer = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.samplesSinceAnalysis = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];

    if (!channel) {
      return true;
    }

    for (const sample of channel) {
      this.ringBuffer[this.writeIndex] = sample;
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
      this.samplesSinceAnalysis += 1;

      if (this.samplesSinceAnalysis >= this.hopSize) {
        this.samplesSinceAnalysis = 0;
        this.analyze();
      }
    }

    return true;
  }

  analyze() {
    this.copyRingBuffer();

    const rms = this.prepareSignal();
    let frequency = null;
    let clarity = 0;

    if (rms > RMS_GATE) {
      const result = this.detectPitch();
      frequency = result.frequency;
      clarity = result.clarity;
    }

    const voiced = Boolean(
      frequency &&
        frequency >= MIN_FREQUENCY &&
        frequency <= MAX_FREQUENCY &&
        clarity >= CLARITY_GATE &&
        rms > RMS_GATE,
    );

    this.port.postMessage({
      t: currentTime,
      f0: voiced ? frequency : null,
      clarity,
      rms,
      voiced,
    });
  }

  copyRingBuffer() {
    for (let index = 0; index < this.bufferSize; index += 1) {
      this.analysisBuffer[index] =
        this.ringBuffer[(this.writeIndex + index) % this.bufferSize];
    }
  }

  prepareSignal() {
    let mean = 0;

    for (const sample of this.analysisBuffer) {
      mean += sample;
    }

    mean /= this.bufferSize;

    let energy = 0;

    for (let index = 0; index < this.bufferSize; index += 1) {
      this.analysisBuffer[index] -= mean;
      energy += this.analysisBuffer[index] ** 2;
    }

    return Math.sqrt(energy / this.bufferSize);
  }

  detectPitch() {
    const maxTau = Math.min(
      Math.floor(sampleRate / MIN_FREQUENCY),
      this.bufferSize - 2,
    );
    const nsdf = this.calculateNsdf(maxTau);
    const keyMaxima = this.findKeyMaxima(nsdf, maxTau);

    if (keyMaxima.length === 0) {
      return { frequency: null, clarity: 0 };
    }

    const highest = Math.max(...keyMaxima.map((maximum) => maximum.value));
    const selected = keyMaxima.find(
      (maximum) => maximum.value >= 0.93 * highest,
    );

    if (!selected) {
      return { frequency: null, clarity: 0 };
    }

    return {
      frequency: sampleRate / selected.tau,
      clarity: selected.value,
    };
  }

  calculateNsdf(maxTau) {
    const nsdf = new Float32Array(maxTau + 1);

    for (let tau = 0; tau <= maxTau; tau += 1) {
      let autocorrelation = 0;
      let energy = 0;

      for (let index = 0; index < this.bufferSize - tau; index += 1) {
        const first = this.analysisBuffer[index];
        const second = this.analysisBuffer[index + tau];
        autocorrelation += first * second;
        energy += first ** 2 + second ** 2;
      }

      nsdf[tau] = energy > 0 ? (2 * autocorrelation) / energy : 0;
    }

    return nsdf;
  }

  findKeyMaxima(nsdf, maxTau) {
    const firstCrossing = this.findFirstPositiveToNegativeCrossing(
      nsdf,
      maxTau,
    );

    if (firstCrossing === -1) {
      return [];
    }

    const maxima = [];
    let index = firstCrossing + 1;

    while (index < maxTau) {
      while (index < maxTau && !(nsdf[index - 1] <= 0 && nsdf[index] > 0)) {
        index += 1;
      }

      if (index >= maxTau) {
        break;
      }

      const regionStart = index;

      while (index < maxTau && !(nsdf[index] >= 0 && nsdf[index + 1] < 0)) {
        index += 1;
      }

      const regionEnd = index;

      if (regionEnd > regionStart) {
        maxima.push(this.interpolateMaximum(nsdf, regionStart, regionEnd));
      }

      index += 1;
    }

    return maxima;
  }

  findFirstPositiveToNegativeCrossing(nsdf, maxTau) {
    for (let tau = 1; tau < maxTau; tau += 1) {
      if (nsdf[tau] >= 0 && nsdf[tau + 1] < 0) {
        return tau;
      }
    }

    return -1;
  }

  interpolateMaximum(nsdf, start, end) {
    let peakIndex = start;

    for (let index = start + 1; index <= end; index += 1) {
      if (nsdf[index] > nsdf[peakIndex]) {
        peakIndex = index;
      }
    }

    if (peakIndex <= 0 || peakIndex >= nsdf.length - 1) {
      return {
        tau: peakIndex,
        value: nsdf[peakIndex],
      };
    }

    const previous = nsdf[peakIndex - 1];
    const current = nsdf[peakIndex];
    const next = nsdf[peakIndex + 1];
    const denominator = 2 * (previous - 2 * current + next);
    const offset = denominator ? (previous - next) / denominator : 0;

    return {
      tau: peakIndex + offset,
      value: current,
    };
  }
}

registerProcessor("pitch-processor", PitchProcessor);
