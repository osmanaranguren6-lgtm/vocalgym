/**
 * Records microphone audio into an in-memory Blob.
 */
export class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.startedAt = 0;
    this.stopResolve = null;
  }

  get isRecording() {
    return this.mediaRecorder?.state === "recording";
  }

  /**
   * Starts recording a microphone stream.
   */
  start(stream) {
    if (this.isRecording) {
      return true;
    }
    if (!stream || !window.MediaRecorder) {
      return false;
    }
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];
    const mimeType = mimeTypes.find((type) =>
      window.MediaRecorder.isTypeSupported?.(type),
    );
    try {
      this.mediaRecorder = mimeType
        ? new window.MediaRecorder(stream, { mimeType })
        : new window.MediaRecorder(stream);
    } catch {
      this.mediaRecorder = null;
      return false;
    }
    this.chunks = [];
    this.startedAt = performance.now();
    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) {
        this.chunks.push(event.data);
      }
    });
    this.mediaRecorder.addEventListener("stop", () => {
      const blob = this.chunks.length
        ? new Blob(this.chunks, {
            type: this.mediaRecorder?.mimeType || "audio/webm",
          })
        : null;
      this.mediaRecorder = null;
      this.chunks = [];
      this.stopResolve?.(blob);
      this.stopResolve = null;
    });
    try {
      this.mediaRecorder.start(1000);
      return true;
    } catch {
      this.mediaRecorder = null;
      return false;
    }
  }

  /**
   * Stops recording and resolves with the captured Blob.
   */
  stop() {
    if (!this.isRecording) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      this.stopResolve = resolve;
      this.mediaRecorder.stop();
    });
  }
}
