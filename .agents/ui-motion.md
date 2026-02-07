# UI, Shop, and Motion / UI, Shop y Animaciones

## UI Rules / Reglas de UI
- Keep visual consistency in `/shop`: header, filters, cards, spacing.  
  Mantener coherencia visual de `/shop`: header, filtros, cards y spacing.
- Contrast/background updates must prioritize readability over effects.  
  Cualquier ajuste de contraste/fondo debe priorizar legibilidad sobre efectos.
- Do not reduce perceived product-image quality in cards.  
  No reducir calidad percibida de imagenes de producto en cards.

## Motion Rules / Reglas de Animacion
- Preserve existing animations (timing, easing, behavior).  
  Preservar animaciones existentes (timing, easing y comportamiento).
- Do not remove or simplify animations without explicit request.  
  No eliminar ni simplificar animaciones sin solicitud explicita.
- Do not use or suggest `prefers-reduced-motion` or related variants.  
  No usar ni proponer `prefers-reduced-motion` o variantes asociadas.

## SSR/Hydration
- Avoid initial style differences between server and client.
- For `motion` components rendered in SSR, use deterministic `initial`.
- Do not base initial markup on values that change at hydration.
