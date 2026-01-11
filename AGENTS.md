# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the TypeScript + React app.
- Entry points: `src/main.tsx` mounts the app, `src/App.tsx` is the root component.
- UI code lives in `src/components/` (editor, dialogs, properties); logic helpers are in `src/utils/`; shared types are in `src/types/`.
- Custom hooks live in `src/hooks/`; static assets used by the app are in `src/assets/`.
- `public/` contains Vite-served static files; `dist/` is the production build output.

## Build, Test, and Development Commands
Use your package manager (npm/pnpm/bun). Key scripts from `package.json`:
- `npm run dev` starts the Vite dev server on port 5188 (strict).
- `npm run build` runs `tsc` and outputs a production build to `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.
- `npm run typecheck` performs a TypeScript check without emitting files.

## Coding Style & Naming Conventions
- TypeScript + React with `react-jsx`; `.ts` for logic, `.tsx` for components.
- 2-space indentation, single quotes, and no semicolons (match existing files).
- Components and component files use PascalCase (`DiagramEditor.tsx`).
- Hooks use the `useX` naming pattern and live under `src/hooks/`.
- Utilities are camelCase exports in `src/utils/`.
- Prefer the `@/` alias for `src` imports when it improves clarity.

## Testing Guidelines
- There is no automated test runner configured yet.
- Validate changes with `npm run typecheck` and `npm run lint`.
- If you add tests, document the runner here and place tests under `src/__tests__/` or alongside the feature.

## Commit & Pull Request Guidelines
- Recent history uses emoji-prefixed, present-tense summaries (e.g., “♻️ Migrate codebase to TypeScript”). Follow that pattern when possible.
- Keep commits focused; add a brief body when the intent is not obvious.
- PRs should describe behavior changes, include screenshots for UI updates, and link related issues.

## Configuration & Assets
- Tailwind is loaded via `@import "tailwindcss";` in `src/index.css`.
- Runtime assets belong in `src/assets/`; static public files go in `public/`.
