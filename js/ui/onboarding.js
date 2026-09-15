/**
 * Initializes the first-run onboarding dialog.
 */
export function initOnboarding({ store, activateMicrophone }) {
  const dialog = document.getElementById("onboarding-dialog");
  const content = document.getElementById("onboarding-step");
  const next = document.getElementById("onboarding-next");
  const skip = document.getElementById("onboarding-skip");
  const close = document.getElementById("onboarding-close");
  const dots = [...document.querySelectorAll(".onboarding-dot")];
  let step = 0;

  function finish() {
    store.update((state) => {
      state.onboarded = true;
    });
    dialog.close();
  }

  function render() {
    const steps = [
      [
        "Activa el micrófono",
        "La detección de tono funciona mejor con una señal clara y sin forzar.",
        "Activar micrófono",
      ],
      [
        "Mide tu rango",
        "Dos notas cómodas ayudan a colocar los ejercicios en tu zona.",
        "Ir a Rango",
      ],
      [
        "Tu primera rutina",
        "Empieza con una sesión express de cinco minutos para conocer el flujo.",
        "Ir a Rutina",
      ],
    ];
    const current = steps[step];
    content.innerHTML = `
      <h2 class="text-2xl font-bold">${current[0]}</h2>
      <p class="mt-3 text-slate-400">${current[1]}</p>
      <button id="onboarding-action" class="secondary-button mt-5" type="button">${current[2]}</button>
    `;
    dots.forEach((dot, index) => dot.classList.toggle("active", index === step));
    next.textContent = step === steps.length - 1 ? "Terminar" : "Continuar";
    document.getElementById("onboarding-action").onclick = async () => {
      if (step === 0) {
        await activateMicrophone();
      } else {
        const tab = step === 1 ? "range" : "routine";
        document.querySelector(`[data-tab="${tab}"]`)?.click();
      }
    };
  }

  function open() {
    step = 0;
    render();
    dialog.showModal();
  }

  next.addEventListener("click", () => {
    if (step === 2) {
      finish();
    } else {
      step += 1;
      render();
    }
  });
  skip.addEventListener("click", finish);
  close.addEventListener("click", finish);
  window.addEventListener("onboarding:open", open);
  if (!store.state.onboarded) {
    window.setTimeout(open, 0);
  }
}
