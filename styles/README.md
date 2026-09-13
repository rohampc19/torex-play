# TOREX PLAY CSS architecture

The shared stylesheet is intentionally layered so page-specific CSS can stay separate from global UI rules.

```text
core.css
  ├─ styles/tokens.css       # design tokens, colors, spacing, radii, z-index
  ├─ styles/base.css         # reset, typography, form controls, accessibility
  ├─ styles/layout.css       # containers, headers, global navigation, layout primitives
  ├─ styles/components.css   # buttons, cards, score cards, toast states
  ├─ styles/animations.css   # shared keyframes and page entrance motion
  └─ styles/responsive.css   # mobile/tablet guardrails and reduced-motion rules
```

## Rules

1. Put reusable design values in `tokens.css` instead of repeating literals.
2. Keep global selectors in `base.css` and `layout.css`.
3. Put reusable UI blocks in `components.css`.
4. Keep page-specific styles in the existing page CSS files.
5. Put breakpoint-only changes in `responsive.css` unless a component is truly page-specific.
6. Do not add a second global navigation implementation; use the shared `.global-*` classes.
7. Preserve existing class names while migrating pages so the API/HTML remains backward compatible.
