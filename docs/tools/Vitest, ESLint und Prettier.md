---
titel: Vitest, ESLint und Prettier
status: aktiv
erstellt: 2026-10-24
tags: [tools, vitest, eslint, prettier, tests]
---

# Vitest, ESLint und Prettier

Teil der [[projects/tages-dashboard/docs/tools/Tools Übersicht|Tools Übersicht]]. Grundlagen stehen in der Notiz
von musik-app: [[projects/musik-app/docs/tools/Vitest, ESLint und Prettier|Vitest, ESLint und Prettier (musik-app)]].

## Was ist hier anders als in musik-app?

- **Vitest 5 ohne `vite-tsconfig-paths`:** Vite löst die Pfad-Kürzel aus `tsconfig.json` (z. B. `@/app/page`)
  selbst auf. In `vitest.config.mts` steht dafür `resolve: { tsconfigPaths: true }`. Mit dem Plugin meldet Vitest:
  „The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively …“.
- **Prettier 3.9.10**, fest eingetragen (`--save-exact`), damit die Formatierung nicht mit einem Update wechselt.

## Erster Test

`__tests__/page.test.tsx`: Die Startseite zeigt die Überschrift „Tages-Dashboard“. Erst rot gegen die
Beispielseite von Next.js, dann grün.
