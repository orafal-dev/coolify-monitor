# Coolify Monitor

Desktop app for monitoring Coolify deployment health, built with Tauri 2, Next.js, React 19, Tailwind CSS v4, coss ui, Hugeicons, and next-themes.

## Features

- Connect to **Coolify Cloud** or a **self-hosted** instance
- Monitor **multiple Coolify instances** with an instance switcher
- First-run **setup splash** when no instances are configured
- Store API token and optional base URL locally (Tauri store on desktop, localStorage in browser dev)
- Monitor applications, databases, services, servers, and active deployments
- Auto-refresh with configurable polling interval
- Dark mode via next-themes
- Native-feeling desktop shell with smooth view transitions

## Stack

- [Tauri 2](https://v2.tauri.app/)
- [Next.js 16](https://nextjs.org/) (static export for Tauri)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [coss ui](https://coss.com/ui/docs)
- [Hugeicons](https://hugeicons.com/)
- [TanStack Query](https://tanstack.com/query)

## Coolify API

Authentication uses bearer tokens from Coolify **Keys & Tokens**:

- Cloud default: `https://app.coolify.io/api/v1`
- Self-hosted: `https://your-coolify-domain/api/v1`

Docs: https://coolify.io/docs/api-reference/authorization

## Development

```bash
bun install
bun run dev          # Next.js only (browser)
bun run tauri:dev    # Desktop app with hot reload
```

## Build

```bash
bun run build        # Static Next.js export to /out
bun run tauri:build  # Native desktop bundle
```

## Project structure

```text
src/
  app/                 Next.js app shell
  components/
    dashboard/         Status views and tables
    layout/            Sidebar + app shell
    settings/          Connection setup
  hooks/               App + Coolify query hooks
  lib/coolify/         API client, types, status helpers
  lib/storage/         Local connection persistence
src-tauri/             Rust/Tauri backend + plugins
```
