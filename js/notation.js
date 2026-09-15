import { freqFromMidi } from "./audio.js";

const OSMD_URL =
  "https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.5.0/build/opensheetmusicdisplay.min.js";

const EXERCISES = {
  "ming-oh": {
    title: "Ming-oh",
    url: "assets/exercises/ming-oh.musicxml",
  },
  "name-ney": {
    title: "Name-Ney",
    url: "assets/exercises/name-ney.musicxml",
  },
  "vi-va": {
    title: "Vi-Va",
    url: "assets/exercises/vi-va.musicxml",
  },
  chromatic: {
    title: "Cromático",
    url: "assets/exercises/chromatic.musicxml",
  },
  "laxvox-segundas": {
    title: "Lax Vox · Segundas",
    url: "assets/exercises/laxvox-segundas.musicxml",
  },
  "laxvox-segundas-dobles": {
    title: "Lax Vox · Segundas dobles",
    url: "assets/exercises/laxvox-segundas-dobles.musicxml",
  },
  "laxvox-terceras": {
    title: "Lax Vox · Terceras",
    url: "assets/exercises/laxvox-terceras.musicxml",
  },
  "laxvox-terceras-dobles": {
    title: "Lax Vox · Terceras dobles",
    url: "assets/exercises/laxvox-terceras-dobles.musicxml",
  },
  "arpeggio-major": {
    title: "Arpegio mayor",
    url: "assets/exercises/arpeggio-major.musicxml",
  },
  "scale-major": {
    title: "Escala mayor",
    url: "assets/exercises/scale-major.musicxml",
  },
  "scale-minor": {
    title: "Escala menor",
    url: "assets/exercises/scale-minor.musicxml",
  },
  "fifths-fast": {
    title: "Quintas rápidas",
    url: "assets/exercises/fifths-fast.musicxml",
  },
  "octaves-gu": {
    title: "Octavas en gu",
    url: "assets/exercises/octaves-gu.musicxml",
  },
  "fifths-down-mum": {
    title: "Quintas descendentes mum",
    url: "assets/exercises/fifths-down-mum.musicxml",
  },
  "calls-hey": {
    title: "Llamadas hey",
    url: "assets/exercises/calls-hey.musicxml",
  },
  estrellita: {
    title: "Estrellita (demo)",
    url: "assets/songs/estrellita.musicxml",
  },
};

let osmdLibraryPromise = null;

function firstLyric(note) {
  const entries = note?.ParentVoiceEntry?.LyricsEntries;
  if (!entries) {
    return "";
  }
  const values =
    entries instanceof Map
      ? [...entries.values()]
      : Array.isArray(entries)
        ? entries
        : entries.table
          ? Object.values(entries.table).map((item) => item.value || item)
          : Object.values(entries);
  const lyric = values?.[0];
  return String(lyric?.Text || lyric?.text || "").trim();
}

/**
 * Loads OpenSheetMusicDisplay once through a dynamic script tag.
 */
function loadOsmdLibrary() {
  if (window.opensheetmusicdisplay) {
    return Promise.resolve(window.opensheetmusicdisplay);
  }

  if (osmdLibraryPromise) {
    return osmdLibraryPromise;
  }

  osmdLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = OSMD_URL;
    script.async = true;
    script.onload = () => {
      if (window.opensheetmusicdisplay) {
        resolve(window.opensheetmusicdisplay);
      } else {
        reject(
          new Error("OSMD no quedó disponible después de cargar el script."),
        );
      }
    };
    script.onerror = () => {
      reject(new Error("No se pudo cargar el visor de partituras."));
    };
    document.head.append(script);
  });

  return osmdLibraryPromise;
}

/**
 * Renders and synchronizes one MusicXML score with Tone.Transport.
 */
export class NotationEngine {
  constructor({ container, bus, getSettings, getRange, metronome = null }) {
    this.container = container;
    this.bus = bus;
    this.getSettings = getSettings;
    this.getRange = getRange;
    this.metronome = metronome;
    this.osmd = null;
    this.source = null;
    this.title = "";
    this.transpose = 0;
    this.timeline = [];
    this.phrases = [];
    this.currentPhraseIndex = 0;
    this.loopPhraseIndex = null;
    this.scheduleIds = [];
    this.playing = false;
    this.loop = true;
    this.cursorIndex = -1;
    this.renderTimer = null;
    this.synth = null;
    this.reverb = null;
    this.routineProgression = null;
    this.routineShift = 0;
    this.adaptiveShift = 0;
    this.routineDirection = 1;
    this.apiFacts = {};
    this.waitForNote = false;
    this.waitListener = null;
    this.waitIndex = -1;
    this.waitGreenSince = 0;
    this.waitYellowSince = 0;
    this.routinePlaybackStartedAt = 0;
    this.lastRoutineAdvanceAt = 0;
    this.routineLoopSeconds = 0;
  }

  /**
   * Loads the selected bundled exercise or a user-provided MusicXML string.
   */
  async loadExercise(exerciseId) {
    const exercise = EXERCISES[exerciseId];

    if (!exercise) {
      throw new Error("No encontramos ese ejercicio.");
    }

    const response = await fetch(exercise.url);
    const musicXml = await response.text();
    return this.loadMusicXml(musicXml, exercise.title);
  }

  /**
   * Loads and renders MusicXML from text.
   */
  async loadMusicXml(musicXml, title = "Partitura") {
    const library = await loadOsmdLibrary();

    if (!this.osmd) {
      this.osmd = new library.OpenSheetMusicDisplay(this.container, {
        backend: "svg",
        autoResize: true,
        drawTitle: false,
        drawPartNames: false,
        followCursor: true,
        darkMode: true,
        defaultColorNotehead: "#e2e8f0",
        defaultColorStem: "#e2e8f0",
        pageBackgroundColor: "transparent",
      });
      this.osmd.TransposeCalculator = new library.TransposeCalculator();
    }

    this.source = musicXml;
    this.title = title;
    this.loopPhraseIndex = null;
    await this.osmd.load(musicXml);
    this.transpose = 0;
    this.render();
    this.inspectApi();
    return this;
  }

  /**
   * Schedules a debounced render after a transpose change.
   */
  scheduleRender() {
    window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => {
      this.render();
    }, 150);
  }

  /**
   * Applies a semitone transpose and schedules a fresh SVG render.
   */
  setTranspose(semitones) {
    this.transpose = Math.max(-24, Math.min(24, Math.round(semitones)));
    this.routineShift = 0;
    this.adaptiveShift = 0;
    this.routineDirection = 1;

    if (this.osmd?.Sheet) {
      this.osmd.Sheet.Transpose = this.transpose;
      this.scheduleRender();
    }

    this.bus.dispatchEvent(
      new CustomEvent("transpose:change", {
        detail: { semitones: this.transpose },
      }),
    );
  }

  /**
   * Calculates the best transpose for the stored comfortable range.
   */
  autoTranspose(rootRatio = null) {
    const notes = this.extractNoteMidis(false);
    const range = this.getRange() || { lowMidi: 48, highMidi: 72 };
    const comfortLow = range.lowMidi + 3;
    const comfortHigh = range.highMidi - 3;

    if (!notes.length) {
      this.setTranspose(0);
      return 0;
    }

    if (rootRatio !== null) {
      const target =
        range.lowMidi + (range.highMidi - range.lowMidi) * rootRatio;
      const root = Math.min(...notes);
      const candidate = Math.round(target - root);
      this.setTranspose(candidate);
      return this.transpose;
    }

    const candidates = [];

    for (let semitones = -24; semitones <= 24; semitones += 1) {
      const outside = notes.reduce((count, midi) => {
        const transposed = midi + semitones;
        return (
          count + (transposed < comfortLow || transposed > comfortHigh ? 1 : 0)
        );
      }, 0);
      candidates.push({ semitones, outside });
    }

    candidates.sort(
      (first, second) =>
        first.outside - second.outside ||
        Math.abs(first.semitones) - Math.abs(second.semitones),
    );
    this.setTranspose(candidates[0].semitones);
    return this.transpose;
  }

  /**
   * Enables semitone-by-semitone routine progression within comfort bounds.
   */
  setRoutineProgression({ comfortLow, comfortHigh }) {
    this.routineProgression = { comfortLow, comfortHigh };
    this.routineShift = 0;
    this.adaptiveShift = 0;
    this.routineDirection = 1;
  }

  /**
   * Updates the preferred playback mode for the next play action.
   */
  setWaitForNote(enabled) {
    this.waitForNote = Boolean(enabled);
  }

  /**
   * Sets the shared transport tempo used by scheduled score notes.
   */
  setBpm(bpm) {
    this.bpm = Math.max(40, Math.min(240, Number(bpm) || 90));
    if (window.Tone) {
      Tone.Transport.bpm.value = this.bpm;
    }
  }

  /**
   * Converts score beats using the active transport tempo.
   */
  beatsToSeconds(beats) {
    if (!window.Tone) {
      return 0;
    }
    return Number(beats) * Tone.Time("4n").toSeconds();
  }

  /**
   * Returns the full score loop duration in transport seconds.
   */
  getLoopSeconds() {
    const last = this.timeline.at(-1);
    return last ? this.beatsToSeconds(last.beats + last.durationBeats) : 0;
  }

  /**
   * Renders the score and rebuilds its cursor timeline.
   */
  render() {
    if (!this.osmd) {
      return;
    }

    this.osmd.Sheet.Transpose = this.transpose;
    this.osmd.updateGraphic();
    this.osmd.render();
    this.applyDarkSvgTheme();
    this.buildTimeline();
    this.osmd.cursor.show();
    this.bus.dispatchEvent(
      new CustomEvent("notation:rendered", {
        detail: {
          title: this.title,
          transpose: this.transpose,
          timeline: this.timeline,
        },
      }),
    );
  }

  /**
   * Applies dark-theme colors to OSMD-generated SVG elements.
   */
  applyDarkSvgTheme() {
    this.container
      .querySelectorAll("svg path, svg line, svg rect")
      .forEach((element) => {
        element.style.stroke = "#e2e8f0";
        element.style.fill = element.tagName === "path" ? "#e2e8f0" : "none";
      });
    this.container.querySelectorAll("svg text").forEach((element) => {
      element.style.fill = "#e2e8f0";
    });
  }

  /**
   * Builds the cursor timeline in quarter-note beats.
   */
  buildTimeline() {
    this.timeline = [];
    this.phrases = [];
    this.cursorIndex = -1;

    if (!this.osmd?.cursor?.Iterator) {
      return;
    }

    const cursor = this.osmd.cursor;
    cursor.reset();
    let index = 0;
    while (!cursor.Iterator.EndReached && index < 1000) {
      const timestamp = cursor.Iterator.currentTimeStamp;
      const beats = Number(timestamp?.RealValue || 0) * 4;
      const notes = cursor.NotesUnderCursor?.() || [];
      const midis = notes
        .map((note) => this.noteMidi(note, true))
        .filter((midi) => Number.isFinite(midi));
      const lyric = firstLyric(notes[0]);

      this.timeline.push({
        index,
        beats,
        midis,
        lyric,
        phraseIndex: lyric ? Math.floor(index / 16) : Math.floor(index / 8),
        transposed: this.transpose !== 0,
      });
      index += 1;
      cursor.next();
    }

    this.timeline.forEach((entry, entryIndex) => {
      const next = this.timeline[entryIndex + 1];
      entry.durationBeats = Math.max(
        0.25,
        (next?.beats ?? entry.beats + 1) - entry.beats,
      );
    });
    cursor.reset();
    const phraseCount = Math.max(
      1,
      ...this.timeline.map((entry) => entry.phraseIndex + 1),
    );
    this.phrases = Array.from({ length: phraseCount }, (_, phraseIndex) => {
      const entries = this.timeline.filter(
        (entry) => entry.phraseIndex === phraseIndex,
      );
      return {
        index: phraseIndex,
        startEntry: entries[0]?.index ?? 0,
        endEntry: entries.at(-1)?.index ?? 0,
        startBeats: entries[0]?.beats ?? 0,
        endBeats: (entries.at(-1)?.beats || 0) +
          (entries.at(-1)?.durationBeats || 1),
        text: entries.map((entry) => entry.lyric).filter(Boolean).join(" "),
      };
    });
    this.bus.dispatchEvent(
      new CustomEvent("notation:timeline", {
        detail: { timeline: this.timeline, phrases: this.phrases },
      }),
    );
  }

  /**
   * Returns a pitch MIDI value and records the verified OSMD pitch shape.
   */
  noteMidi(note, applyTranspose) {
    const pitch = note?.Pitch;
    const rawHalfTone = pitch?.getHalfTone?.();

    if (!Number.isFinite(rawHalfTone)) {
      return null;
    }

    const offset = 12;
    const midi = rawHalfTone + offset;
    return applyTranspose ? midi + this.transpose : midi;
  }

  /**
   * Extracts note MIDI values from the first OSMD instrument.
   */
  extractNoteMidis(applyTranspose = true) {
    const voices = this.osmd?.Sheet?.Instruments?.[0]?.Voices || [];
    const notes = [];

    for (const voice of voices) {
      for (const voiceEntry of voice.VoiceEntries || []) {
        for (const note of voiceEntry.Notes || []) {
          const midi = this.noteMidi(note, applyTranspose);
          if (Number.isFinite(midi)) {
            notes.push(midi);
          }
        }
      }
    }

    return notes;
  }

  /**
   * Records runtime OSMD API facts for diagnostics and verification.
   */
  inspectApi() {
    const firstNote =
      this.osmd?.Sheet?.Instruments?.[0]?.Voices?.[0]?.VoiceEntries?.[0]
        ?.Notes?.[0];
    const rawHalfTone = firstNote?.Pitch?.getHalfTone?.();
    this.osmd?.cursor?.reset();
    this.osmd?.cursor?.show();
    const cursorNotes = this.osmd?.cursor?.NotesUnderCursor?.() || [];
    const cursorRawHalfTone = cursorNotes[0]?.Pitch?.getHalfTone?.();
    const currentTranspose = this.transpose;
    let transposedCursorRawHalfTone = cursorRawHalfTone;

    if (this.osmd?.Sheet) {
      this.osmd.Sheet.Transpose = currentTranspose + 1;
      this.osmd.updateGraphic();
      this.osmd.render();
      this.osmd.cursor.reset();
      this.osmd.cursor.show();
      transposedCursorRawHalfTone = this.osmd.cursor
        .NotesUnderCursor?.()[0]
        ?.Pitch?.getHalfTone?.();
      this.osmd.Sheet.Transpose = currentTranspose;
      this.osmd.updateGraphic();
      this.osmd.render();
      this.osmd.cursor.reset();
      this.osmd.cursor.show();
    }

    this.apiFacts = {
      hasTransposeCalculator: Boolean(this.osmd?.TransposeCalculator),
      hasSheetTranspose: "Transpose" in (this.osmd?.Sheet || {}),
      rawHalfTone,
      pitchOffsetApplied: Number.isFinite(rawHalfTone) ? 12 : 0,
      notesUnderCursorCount: cursorNotes.length,
      notesUnderCursorHavePitch: Boolean(cursorNotes[0]?.Pitch?.getHalfTone),
      notesUnderCursorRawHalfTone: cursorRawHalfTone,
      notesUnderCursorTransposedRawHalfTone: transposedCursorRawHalfTone,
      notesUnderCursorUsesSheetTranspose:
        transposedCursorRawHalfTone !== cursorRawHalfTone,
    };
    window.__notationApiFacts = this.apiFacts;
  }

  /**
   * Starts playback and schedules cursor, target, and accompaniment events.
   */
  async play({ loop = true, useMetronome = false, waitForNote = false } = {}) {
    if (!this.osmd || !window.Tone || !this.timeline.length) {
      return;
    }

    if (this.renderTimer) {
      window.clearTimeout(this.renderTimer);
      this.renderTimer = null;
      this.render();
    }

    await Tone.start();
    this.stop();
    this.loop = loop;
    this.playing = true;
    this.waitForNote = waitForNote;
    this.routinePlaybackStartedAt = performance.now();
    this.lastRoutineAdvanceAt = this.routinePlaybackStartedAt;
    this.ensureSynth();
    this.osmd.cursor.reset();
    this.cursorIndex = -1;

    if (useMetronome && this.metronome && !this.metronome.running) {
      await this.metronome.toggle();
    }

    if (waitForNote) {
      this.startWaitForNote();
      return;
    }

    const last = this.timeline[this.timeline.length - 1];
    const loopBeats = last.beats + last.durationBeats;
    const quarterSeconds = Tone.Time("4n").toSeconds();
    const loopSeconds = this.beatsToSeconds(loopBeats);
    this.loopSeconds = loopSeconds;
    this.routineLoopSeconds = loopSeconds;

    this.timeline.forEach((entry) => {
      const seconds = entry.beats * quarterSeconds;
      const id = Tone.Transport.schedule(() => {
        this.moveCursor(entry.index);
        this.emitTargets(entry);
      }, seconds);
      this.scheduleIds.push(id);
    });

    if (loop) {
      Tone.Transport.loop = true;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = loopSeconds;
      if (this.routineProgression) {
        const progressionId = Tone.Transport.scheduleRepeat(
          () => this.advanceRoutineProgression(),
          loopSeconds,
        );
        this.scheduleIds.push(progressionId);
      }
    } else {
      Tone.Transport.loop = false;
    }

    Tone.Transport.start();
    this.bus.dispatchEvent(
      new CustomEvent("notation:play", {
        detail: { title: this.title, transpose: this.transpose },
      }),
    );
  }

  /**
   * Stops notation scheduling without stopping a shared metronome transport.
   */
  stop() {
    if (window.Tone) {
      this.scheduleIds.forEach((id) => Tone.Transport.clear(id));
    }
    this.scheduleIds = [];
    this.playing = false;
    if (this.waitListener) {
      this.bus.removeEventListener("pitch:frame", this.waitListener);
      this.waitListener = null;
    }
    this.waitIndex = -1;
    this.waitGreenSince = 0;
    this.waitYellowSince = 0;

    if (this.osmd?.cursor) {
      this.osmd.cursor.reset();
      this.cursorIndex = -1;
    }

    if (window.Tone) {
      Tone.Transport.loop = false;
    }
    this.bus.dispatchEvent(
      new CustomEvent("notation:stop", {
        detail: { title: this.title },
      }),
    );
  }

  /**
   * Starts note-by-note playback driven by green pitch frames.
   */
  startWaitForNote() {
    this.waitIndex = -1;
    this.waitListener = (event) => this.handleWaitFrame(event.detail);
    this.bus.addEventListener("pitch:frame", this.waitListener);
    this.advanceWaitNote();
    this.bus.dispatchEvent(
      new CustomEvent("notation:play", {
        detail: {
          title: this.title,
          transpose: this.transpose,
          waitForNote: true,
        },
      }),
    );
  }

  /**
   * Advances the wait mode cursor and emits the next target.
   */
  advanceWaitNote() {
    const nextIndex = this.waitIndex + 1;
    if (nextIndex >= this.timeline.length) {
      if (!this.loop) {
        this.stop();
        return;
      }
      this.waitIndex = -1;
      this.advanceRoutineProgression();
      this.advanceWaitNote();
      return;
    }
    this.waitIndex = nextIndex;
    const entry = this.timeline[this.waitIndex];
    this.moveCursor(entry.index);
    this.emitTargets(entry);
    this.waitGreenSince = 0;
    this.waitYellowSince = 0;
  }

  /**
   * Accumulates a continuous green note with a short yellow grace.
   */
  handleWaitFrame(frame) {
    if (!this.playing || !this.waitForNote || !frame) {
      return;
    }
    const target =
      this.timeline[this.waitIndex]?.midis?.[0] +
      this.routineShift +
      this.adaptiveShift;
    if (!Number.isFinite(target) || frame.midi !== target) {
      this.waitGreenSince = 0;
      this.waitYellowSince = 0;
      return;
    }
    const now = performance.now();
    if (!frame.voiced || frame.zone === "red" || frame.zone === "none") {
      this.waitGreenSince = 0;
      this.waitYellowSince = 0;
      return;
    }
    if (frame.zone === "green") {
      if (!this.waitGreenSince) {
        this.waitGreenSince = now;
      }
      this.waitYellowSince = 0;
      if (now - this.waitGreenSince >= 300) {
        this.advanceWaitNote();
      }
      return;
    }
    if (frame.zone === "yellow") {
      if (!this.waitGreenSince) {
        this.waitYellowSince = now;
        return;
      }
      if (!this.waitYellowSince) {
        this.waitYellowSince = now;
      }
      if (now - this.waitYellowSince > 300) {
        this.waitGreenSince = 0;
      }
    }
  }

  /**
   * Moves the visual cursor forward to a timeline entry.
   */
  moveCursor(index) {
    if (!this.osmd?.cursor) {
      return;
    }

    if (index < this.cursorIndex) {
      this.osmd.cursor.reset();
      this.cursorIndex = -1;
    }

    while (this.cursorIndex < index) {
      this.osmd.cursor.next();
      this.cursorIndex += 1;
    }
  }

  /**
   * Emits note targets and plays reference pitches for one timeline entry.
   */
  emitTargets(entry) {
    if (
      this.loopPhraseIndex !== null &&
      entry.phraseIndex !== this.loopPhraseIndex
    ) {
      return;
    }
    entry.midis.forEach((baseMidi) => {
      const midi = baseMidi + this.routineShift + this.adaptiveShift;
      const frequency = freqFromMidi(midi, this.getSettings().a4);
      this.bus.dispatchEvent(
        new CustomEvent("note:target", {
          detail: {
            midi,
            freq: frequency,
            startBeat: entry.beats,
            durBeats: entry.durationBeats,
            index: entry.index,
            phraseIndex: entry.phraseIndex,
            lyric: entry.lyric,
          },
        }),
      );
      this.bus.dispatchEvent(
        new CustomEvent("score:update", {
          detail: {
            midi,
            source: "notation",
          },
        }),
      );
      this.synth?.triggerAttackRelease(
        frequency,
        `${Math.max(0.25, entry.durationBeats)}n`,
      );
    });
  }

  /**
   * Advances routine pitch by one semitone and reverses at comfort bounds.
   */
  advanceRoutineProgression() {
    if (!this.routineProgression || !this.timeline.length) {
      return;
    }
    const now = performance.now();
    if (
      now - this.lastRoutineAdvanceAt <
      Math.max(0.25, this.routineLoopSeconds) * 1000 - 50
    ) {
      return;
    }
    this.lastRoutineAdvanceAt = now;
    this.bus.dispatchEvent(new CustomEvent("routine:loop"));

    const baseMidis = this.timeline.flatMap((entry) => entry.midis);
    const highest =
      Math.max(...baseMidis) + this.routineShift + this.adaptiveShift;
    const lowest =
      Math.min(...baseMidis) + this.routineShift + this.adaptiveShift;

    if (
      this.routineDirection > 0 &&
      highest >= this.routineProgression.comfortHigh
    ) {
      this.routineDirection = -1;
    } else if (
      this.routineDirection < 0 &&
      lowest <= this.routineProgression.comfortLow
    ) {
      this.routineDirection = 1;
    }

    this.routineShift += this.routineDirection;
  }

  /**
   * Creates the sine accompaniment through a shared reverb.
   */
  ensureSynth() {
    if (this.synth || !window.Tone) {
      return;
    }

    this.reverb = new Tone.Reverb(1.5).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      volume: this.getSettings().accompanimentVol ?? -12,
    }).connect(this.reverb);
  }
}

/**
 * Returns the bundled exercise metadata.
 */
export function notationExercises() {
  return { ...EXERCISES };
}
