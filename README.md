# Coolify Monitor

Desktop app for monitoring Coolify deployment health, built with Tauri 2, Next.js, React 19, Tailwind CSS v4, coss ui, Hugeicons, and next-themes.

## Features

- Connect to **Coolify Cloud** or a **self-hosted** instance
- Monitor **multiple Coolify instances** with an instance switcher
- First-run **setup splash** when no instances are configured
- Store API token and optional base URL locally (Tauri store on desktop, localStorage in browser dev)
- Monitor applications, databases, services, servers, and active deployments
- Auto-refresh with configurable polling interval
- Desktop auto-updates via Tauri updater + GitHub Releases
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

For signed updater artifacts locally, export your Tauri signing key first:

```bash
export TAURI_SIGNING_PRIVATE_KEY="$HOME/.tauri/coolify-monitor.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""  # if your key has a password
bun run tauri:build
```

Generate a new signing keypair with:

```bash
bun run tauri signer generate --write-keys ~/.tauri/coolify-monitor.key --ci
```

Keep the private key secret. The public key is configured in `src-tauri/tauri.conf.json`.

## Auto-updates

The desktop app checks [GitHub Releases](https://github.com/orafal-dev/coolify-monitor/releases) on startup and from **Settings → App updates**.

Releases are built by `.github/workflows/release.yml` when you push a version tag:

```bash
# Bump version in package.json and src-tauri/tauri.conf.json first
git tag v0.1.0
git push origin v0.1.0
```

### Required GitHub secrets

| Secret | Purpose |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of your `.key` file (updater signatures) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Optional private key password |
| `APPLE_CERTIFICATE` | Base64 `.p12` for macOS code signing |
| `APPLE_CERTIFICATE_PASSWORD` | Certificate password |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Apple ID email for notarization |
| `APPLE_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

The workflow creates a draft GitHub release with installers, `.sig` files, and `latest.json` for the Tauri updater.

## Project structure

```text
src/
  app/                 Next.js app shell
  components/
    dashboard/         Status views and tables
    layout/            Sidebar + app shell
    settings/          Connection + app update settings
  hooks/               App + Coolify query hooks
  lib/coolify/         API client, types, status helpers
  lib/storage/         Local connection persistence
  lib/updater/         Tauri updater runtime helpers
src-tauri/             Rust/Tauri backend + plugins
```
