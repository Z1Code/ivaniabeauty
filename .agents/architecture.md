# Architecture and Boundaries / Arquitectura y Limites

## Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Framer Motion.
- Backend via route handlers in `src/app/api`.  
  Backend integrado via route handlers en `src/app/api`.
- Persistence with Firebase/Firestore and assets in Firebase Storage.  
  Persistencia con Firebase/Firestore y assets en Firebase Storage.

## Relevant Structure / Estructura Relevante
- `src/app/shop/*`: public shop experience / experiencia publica de tienda.
- `src/components/shop/*`: sections, filters, cards / secciones, filtros, cards.
- `src/components/ui/ProductCard.tsx`: key image and CTA rendering / render clave de imagen y CTA.
- `src/components/admin/ProductForm.tsx`: admin flow, AI and processing / flujo admin, IA y procesamiento.
- `src/lib/product-image-ai/*`: generation, enhancement and transparency / generacion, mejora y transparencia.

## Change Criteria / Criterios de Cambio
- Avoid massive refactors in critical pipelines.  
  Evitar refactors masivos en pipelines criticos.
- Keep SSR/CSR stable (no hydration mismatches).  
  Mantener SSR/CSR estables (sin hydration mismatches).
- Avoid mixing UI changes and deep backend changes in one commit unless needed.  
  No mezclar cambios de UI con cambios profundos de backend en el mismo commit si no es necesario.
