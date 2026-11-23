# TanStack Start - Supabase Example

A TanStack Start example demonstrating integration with Supabase for authentication and database.

- [TanStack Router Docs](https://tanstack.com/router)
- [Supabase Documentation](https://supabase.com/docs)

## Start a new project based on this example

To start a new project based on this example, run:

```sh
npx gitpick TanStack/router/tree/main/examples/react/start-supabase-basic start-supabase-basic
```

## Repository Layout

This repository is a [moon](https://moonrepo.dev) monorepo. Vite+ (`vp`) manages Node.js, pnpm and dependency installs; moon orchestrates tasks across projects.

| Path                  | Contents                                           |
| --------------------- | -------------------------------------------------- |
| `apps/web`            | TanStack Start + Supabase app (moon project `web`) |
| `.moon/`              | moon workspace and toolchain config                |
| `.prototools`         | pinned moon version (install with `proto install`) |
| `vite.config.ts`      | shared Vite+ config: lint, fmt, staged hooks       |
| `pnpm-workspace.yaml` | workspace packages and dependency catalog          |

## Setup

This example requires Supabase configuration. `apps/web/.env` contains the necessary environment variables, encrypted with dotenvx:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

You'll need to:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Set them with `dotenvx set KEY value` in `apps/web` (the private key goes in `apps/web/.env.keys`, which is not committed)

## Getting Started

From the repository root:

```sh
proto install   # installs moon
vp install
moon run web:dev
```

This starts the app in development mode at http://localhost:3000, rebuilding assets on file changes.

## Tasks

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `moon run web:dev`     | Start the dev server                      |
| `moon run web:build`   | Production build and `tsc --noEmit`       |
| `moon run web:preview` | Build, then preview the production build  |
| `moon run web:start`   | Build, then serve `dist/server/server.js` |
| `moon run web:check`   | Static checks (see below)                 |
| `moon run :check`      | Static checks for every project           |

Each moon task calls the package script or Vite Task of the same name in `apps/web`, so `vp -C apps/web run <name>` also works.

## Static Checks

`moon run web:check` runs the `check:all` Vite Task in `apps/web`, which runs, in order (each step is cached by Vite Task):

1. `vp check` — Oxfmt (format and import sorting), Oxlint (lint) and type check, using the root `vite.config.ts` settings
2. `fallow dead-code` — unused files/exports/dependencies; config in `apps/web/.fallowrc.json`

CI (`.github/workflows/check.yml`) runs `moon run :check` on pull requests and pushes to `main`. When no TypeScript/CSS or tooling config changed, the job skips the checks and exits successfully. A newer run for the same PR or branch cancels the one in progress.

## Supabase Integration

This example demonstrates:

- Authentication with Supabase Auth
- Database queries with Supabase client
- Real-time subscriptions
- Server-side data fetching
