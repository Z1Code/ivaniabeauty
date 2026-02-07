# IvaniaBeauty Agent Guide / Guia de Agente

Next.js ecommerce (App Router) for catalog, admin, and AI product-image pipeline.  
Ecommerce Next.js (App Router) para catalogo, admin y pipeline IA de imagenes de producto.

## Always-On Behavior / Comportamiento Siempre Activo
- Apply this guide by default for every task in this repository.  
  Aplicar esta guia por defecto en cada tarea dentro de este repositorio.
- If a subfolder contains a more specific agent file, that file has precedence for that scope.  
  Si una subcarpeta tiene una guia mas especifica, esa guia tiene prioridad en su alcance.

## Quick Commands / Comandos Rapidos
- `npm run dev` - local development / desarrollo local
- `npm run dev:webpack` - webpack fallback / fallback webpack
- `npm run build` - production build / build de produccion
- `npm run lint` - lint
- `npx tsc --noEmit` - typecheck
- `npm run test:fit-guide` - fit-guide tests / pruebas fit-guide
- `npm run backfill:fit-guides` - fit-guide backfill / backfill de guias de talla

## Hard Rules / Reglas Criticas
- Do not change or degrade existing animations without explicit request.  
  No tocar ni degradar animaciones existentes sin peticion explicita.
- Do not introduce or suggest `prefers-reduced-motion` or reduce-motion variants.  
  No introducir ni sugerir `prefers-reduced-motion` ni variantes de reduce motion.
- Treat AI image pipeline as critical flow: small, validated, reversible changes.  
  Tratar el pipeline IA como flujo critico: cambios pequenos, validados y reversibles.
- Prioritize visual consistency in `/shop` and product image quality without breaking load performance.  
  Priorizar consistencia visual en `/shop` y calidad de imagen sin romper carga.
- Never expose secrets client-side; use server-side environment variables.  
  Nunca exponer secretos en cliente; usar variables de entorno server-side.

## Working Files / Archivos de Trabajo
- [Architecture and boundaries / Arquitectura y limites](.agents/architecture.md)
- [UI, shop, and motion / UI, shop y animaciones](.agents/ui-motion.md)
- [AI image pipeline / Pipeline IA de imagenes](.agents/image-pipeline.md)
- [Quality, performance, validation / Calidad, performance y validacion](.agents/quality-performance.md)
- [Git and delivery / Git y entrega](.agents/git-delivery.md)
