# Quality, Performance, and Validation / Calidad, Performance y Validacion

## Image Quality in Shop / Calidad de Imagen en Shop
- Configure `next/image` with realistic `sizes` per breakpoint.
- Increase quality only where it matters (cards/detail), avoid global overuse.
- Verify sharpness in desktop and mobile before closing changes.

## Performance
- Prioritize incremental, measurable optimizations.
- Avoid unnecessary client-side work in `/shop`.
- Reuse server cache when applicable and safe.

## Validation Checklist / Checklist de Validacion
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` for architecture/routing/render changes.
- Manually verify `/shop` and any touched admin flow.
