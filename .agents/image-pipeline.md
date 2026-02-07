# AI Image Pipeline / Pipeline IA de Imagenes

## Goal / Objetivo
Generate commercially usable product images with real transparency and clean edges.  
Generar imagenes de producto comercialmente usables, con transparencia real y bordes limpios.

## Critical Rules / Reglas Criticas
- Transparency must be real alpha (PNG RGBA), never fake checkerboard.
- Validate output after generate/regenerate and before publishing.
- Keep retry/fallback provider flow when possible.
- Never irreversibly overwrite the original image.

## Operational Robustness / Robustez Operativa
- Apply transparency and quality validations on every HD/4K regeneration.
- If background/transparency validation fails, retry that specific image.
- Log errors with context (model, provider, reason, attempt).

## Security / Seguridad
- API keys only in server-side env vars.
- Never hardcode keys or expose them to client code.
