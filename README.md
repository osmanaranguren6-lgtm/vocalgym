# VocalGym

MVP de gimnasio vocal interactivo, con interfaz en español, detección MPM en AudioWorklet y persistencia local.

## Ejecutar

Desde `C:\Users\Administrator\vocalgym`:

```bash
python -m http.server 8080
```

Después abre http://localhost:8080. También funciona con `npx serve`.

El micrófono se solicita únicamente al pulsar **Activar micrófono**. No se guarda audio crudo.

## Debug de pitch

Abre `test/pitch-test.html` desde el servidor para probar tonos de 220 Hz y 440 Hz con el worklet.
