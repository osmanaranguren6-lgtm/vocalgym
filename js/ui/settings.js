/**
 * Initializes settings, device selection, export, and import controls.
 */
export function initSettings({ store, pitchMonitor, tunerMonitor, alertUser }) {
  const dialog = document.getElementById("settings-dialog");

  document
    .getElementById("settings-open")
    .addEventListener("click", async () => {
      const settings = store.state.settings;
      document.getElementById("setting-a4").value = settings.a4;
      document.getElementById("setting-tolerance").value = settings.tolerance;
      document.getElementById("setting-rest").value = settings.restAfterMin;
      document.getElementById("setting-accompaniment").value =
        settings.accompanimentVol ?? -12;
      document.getElementById("setting-accompaniment-value").textContent =
        `${settings.accompanimentVol ?? -12} dB`;

      const devices =
        (await navigator.mediaDevices?.enumerateDevices?.()) || [];
      document.getElementById("setting-device").innerHTML =
        '<option value="">Predeterminado</option>' +
        devices
          .filter((device) => device.kind === "audioinput")
          .map(
            (device) =>
              `<option value="${device.deviceId}">${
                device.label || "Micrófono"
              }</option>`,
          )
          .join("");
      document.getElementById("setting-device").value = settings.deviceId || "";
      dialog.showModal();
    });

  document.getElementById("save-settings").addEventListener("click", () => {
    store.update((state) => {
      state.settings.a4 =
        Number(document.getElementById("setting-a4").value) || 440;
      state.settings.tolerance =
        document.getElementById("setting-tolerance").value;
      state.settings.restAfterMin =
        Number(document.getElementById("setting-rest").value) || 50;
      state.settings.deviceId = document.getElementById("setting-device").value;
      state.settings.accompanimentVol = Number(
        document.getElementById("setting-accompaniment").value,
      );
    });
    pitchMonitor.setA4(store.state.settings.a4);
    tunerMonitor.setA4(store.state.settings.a4);
  });

  document
    .getElementById("setting-accompaniment")
    .addEventListener("input", (event) => {
      document.getElementById("setting-accompaniment-value").textContent =
        `${event.target.value} dB`;
    });

  document.getElementById("export-data").addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([store.exportJSON()], { type: "application/json" }),
    );
    link.download = "vocalgym-backup.json";
    link.click();
  });

  document.getElementById("import-data").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document
    .getElementById("import-file")
    .addEventListener("change", async (event) => {
      const file = event.target.files[0];

      if (file) {
        store.importJSON(await file.text());
        alertUser("Datos importados correctamente.");
      }
    });
}
