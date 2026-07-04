<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DevLance CRM — project commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npx eslint .`
- Typecheck: `npx tsc --noEmit`

## Stack notes
- Next.js 16 (Turbopack default, React Compiler enabled via `reactCompiler: true`). Async request APIs (`params`/`searchParams` are Promises) — always `await`.
- Tailwind v4 via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css` (no `tailwind.config.js`).
- `next lint` is removed — use ESLint directly.
- Lucide React has no brand icons (no `Linkedin`); use generic icons.

## Architecture
- Feature-based: `src/components/{ui,layout,features}`, `src/app/(app)/*` (CRM shell), `src/app/(auth)/*` (auth pages).
- Global state via Zustand (`src/lib/store.ts`). Mock data in `src/lib/mock-data.ts`. Types in `src/lib/types.ts`.
- The app shell (`src/components/layout/app-shell.tsx`) mounts the Drawer (company details), Add-Company modal, and Command Palette globally.
