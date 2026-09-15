import {
  EXERCISE_LIBRARY,
  ROUTINE_META,
  ROUTINES,
} from "../timing.js";

const COLORS = ["cyan", "violet", "fuchsia", "amber"];

/**
 * Initializes the custom routine editor and saved-routine list.
 */
export function initBuilder({ store, bus, alertUser }) {
  const labelInput = document.getElementById("builder-label");
  const introInput = document.getElementById("builder-intro");
  const presetSelect = document.getElementById("builder-preset");
  const stepsRoot = document.getElementById("builder-steps");
  const savedRoot = document.getElementById("builder-saved");
  let steps = [];
  let editingId = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function libraryOptions(selectedId) {
    const groups = new Map();
    EXERCISE_LIBRARY.forEach((exercise) => {
      const key = exercise.sourceRoutineId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(exercise);
    });
    return [...groups.entries()]
      .map(
        ([routineId, exercises]) => `
          <optgroup label="${ROUTINE_META[routineId]?.label || routineId}">
            ${exercises
              .map(
                (exercise) =>
                  `<option value="${exercise.id}" ${
                    exercise.id === selectedId ? "selected" : ""
                  } title="${exercise.why || ""}">${exercise.name}</option>`,
              )
              .join("")}
          </optgroup>
        `,
      )
      .join("");
  }

  function renderSteps() {
    stepsRoot.innerHTML = steps
      .map(
        (step, index) => `
          <div class="builder-step rounded-2xl border border-slate-800 bg-slate-900/60 p-3" data-index="${index}">
            <div class="flex flex-wrap items-center gap-2">
              <select class="input-field builder-exercise" title="${
                step.why || ""
              }">${libraryOptions(step.exerciseId)}</select>
              <label class="flex items-center gap-2 text-sm text-slate-400">
                min
                <input class="input-field builder-minutes w-24" type="number" min="0.5" max="10" step="0.5" value="${
                  step.minutes
                }" />
              </label>
              <button class="secondary-button builder-up" type="button" ${
                index === 0 ? "disabled" : ""
              }>↑</button>
              <button class="secondary-button builder-down" type="button" ${
                index === steps.length - 1 ? "disabled" : ""
              }>↓</button>
              <button class="secondary-button builder-remove" type="button">✕</button>
            </div>
            <p class="mt-2 text-xs text-slate-500">${step.why || ""}</p>
          </div>
        `,
      )
      .join("");
  }

  function renderSaved() {
    savedRoot.innerHTML = store.state.customRoutines.length
      ? store.state.customRoutines
          .map(
            (routine) => `
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 p-3">
                <div>
                  <strong>${routine.label}</strong>
                  <p class="text-xs text-slate-500">${routine.stages.length} pasos · ${
                    routine.intro || ""
                  }</p>
                </div>
                <div class="flex gap-2">
                  <button class="secondary-button builder-edit" data-id="${
                    routine.id
                  }" type="button">Editar</button>
                  <button class="secondary-button builder-delete" data-id="${
                    routine.id
                  }" type="button">Eliminar</button>
                </div>
              </div>
            `,
          )
          .join("")
      : '<p class="text-sm text-slate-500">Todavía no has guardado rutinas.</p>';
  }

  function resetEditor() {
    editingId = null;
    labelInput.value = "";
    introInput.value = "";
    steps = [];
    document.getElementById("builder-cancel").classList.add("hidden");
    renderSteps();
  }

  function loadPreset(id) {
    const stages = ROUTINES[id] || [];
    labelInput.value = ROUTINE_META[id]?.label || id;
    introInput.value = ROUTINE_META[id]?.intro || "";
    steps = stages.flatMap((stage) =>
      stage.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        minutes: stage.minutes,
        why: exercise.why,
      })),
    );
    renderSteps();
  }

  presetSelect.innerHTML = Object.entries(ROUTINE_META)
    .map(([id, meta]) => `<option value="${id}">${meta.label}</option>`)
    .join("");
  document.getElementById("builder-add").addEventListener("click", () => {
    const exercise = EXERCISE_LIBRARY[0];
    steps.push({
      exerciseId: exercise.id,
      minutes: 1,
      why: exercise.why,
    });
    renderSteps();
  });
  document
    .getElementById("builder-duplicate")
    .addEventListener("click", () => loadPreset(presetSelect.value));
  document
    .getElementById("builder-cancel")
    .addEventListener("click", resetEditor);
  document.getElementById("builder-save").addEventListener("click", () => {
    const label = labelInput.value.trim();
    if (!label || !steps.length) {
      alertUser("Añade un nombre y al menos un paso.");
      return;
    }
    const stages = steps.map((step, index) => {
      const exercise = EXERCISE_LIBRARY.find(
        (item) => item.id === step.exerciseId,
      );
      return {
        id: `${exercise.id}-${index}`,
        name: exercise.name,
        minutes: Math.max(0.5, Math.min(10, Number(step.minutes) || 1)),
        color: COLORS[index % COLORS.length],
        description: exercise.instruction,
        exercises: [clone(exercise)],
      };
    });
    const routine = {
      id: editingId || `custom-${Date.now()}`,
      label,
      intro: introInput.value.trim(),
      stages,
    };
    store.update((state) => {
      const index = state.customRoutines.findIndex(
        (item) => item.id === routine.id,
      );
      if (index >= 0) {
        state.customRoutines[index] = routine;
      } else {
        state.customRoutines.unshift(routine);
      }
      state.customRoutines = state.customRoutines.slice(0, 20);
    });
    bus.dispatchEvent(new CustomEvent("custom-routines:change"));
    alertUser("Rutina guardada.");
    resetEditor();
    renderSaved();
  });
  stepsRoot.addEventListener("change", (event) => {
    const row = event.target.closest(".builder-step");
    if (!row) {
      return;
    }
    const index = Number(row.dataset.index);
    if (event.target.classList.contains("builder-exercise")) {
      const exercise = EXERCISE_LIBRARY.find(
        (item) => item.id === event.target.value,
      );
      steps[index].exerciseId = exercise.id;
      steps[index].why = exercise.why;
      renderSteps();
    }
    if (event.target.classList.contains("builder-minutes")) {
      steps[index].minutes = Number(event.target.value);
    }
  });
  stepsRoot.addEventListener("click", (event) => {
    const row = event.target.closest(".builder-step");
    if (!row) {
      return;
    }
    const index = Number(row.dataset.index);
    if (event.target.classList.contains("builder-up") && index > 0) {
      [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
    } else if (
      event.target.classList.contains("builder-down") &&
      index < steps.length - 1
    ) {
      [steps[index + 1], steps[index]] = [steps[index], steps[index + 1]];
    } else if (event.target.classList.contains("builder-remove")) {
      steps.splice(index, 1);
    }
    renderSteps();
  });
  savedRoot.addEventListener("click", (event) => {
    const id = event.target.dataset.id;
    if (!id) {
      return;
    }
    const routine = store.state.customRoutines.find((item) => item.id === id);
    if (event.target.classList.contains("builder-edit") && routine) {
      editingId = routine.id;
      labelInput.value = routine.label;
      introInput.value = routine.intro || "";
      steps = routine.stages.map((stage) => ({
        exerciseId: stage.exercises[0].id,
        minutes: stage.minutes,
        why: stage.exercises[0].why,
      }));
      document.getElementById("builder-cancel").classList.remove("hidden");
      renderSteps();
    }
    if (event.target.classList.contains("builder-delete")) {
      store.update((state) => {
        state.customRoutines = state.customRoutines.filter(
          (item) => item.id !== id,
        );
      });
      bus.dispatchEvent(new CustomEvent("custom-routines:change"));
      renderSaved();
    }
  });
  renderSaved();
  renderSteps();
}
