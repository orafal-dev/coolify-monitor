# Coolify Monitor — Feature Roadmap

Coolify Monitor is a read-only health dashboard for Coolify instances. The biggest opportunity is turning it from "a list of statuses" into something you'd keep open in the background or reach for when something breaks.

---

## Quick wins (data or UI already partly there)

### 1. Projects view / group by project

Projects are already fetched in `fetchOverview` but never shown. A Projects sidebar item, or grouping apps/databases/services under project + environment, would make large instances much easier to scan.

### 2. "Problems" filter on every table

Add a toggle: **All** / **Issues only** (error, unhealthy, unreachable, deploying). One click to see what needs attention across apps, DBs, servers, and deployments.

### 3. Search + sort on resource tables

`ResourceTable` is flat with no filtering. Search by name, sort by status or last updated — small change, big usability gain as resource counts grow.

### 4. Clickable links everywhere

`openExternalUrl` exists but is barely used. Make FQDNs, git repos, deployment URLs, and "Open in Coolify" actions first-class in tables and the overview cards.

### 5. Command palette (⌘K)

A `Command` UI component is already shipped but no palette is wired up. Jump to views, switch instances, search resources, trigger refresh — very "desktop app" feel.

### 6. Last refreshed + stale data hint

Show "Updated 12s ago" in the header next to Refresh, and a subtle warning when polling failed but cached data is shown.

---

## What would make this a true "monitor"

### 7. Desktop notifications on status change

Compare each poll to the previous snapshot; notify when:

- an app goes unhealthy
- a deployment fails
- a server becomes unreachable

Tauri has notification support — this is the killer feature for a background monitor.

### 8. Menu bar / system tray icon

Green / amber / red dot summarizing the active instance (or all instances). Click to show/hide the window. Lets users run it always-on without cluttering the dock.

### 9. Multi-instance aggregate dashboard

When you have Cloud + self-hosted (or multiple teams), a top-level "All instances" view: total healthy vs failing, worst offenders, which instance has issues.

### 10. Watchlist / pinned resources

Star critical apps (prod API, payment service). Pin them on Overview regardless of which sidebar view you're in.

### 11. Local status history

Store lightweight snapshots in Tauri store. Show a sparkline or "was healthy for 3 days, failed 2m ago". Great for spotting flapping services without leaving the app.

---

## Operational features (Coolify API supports these)

### 12. Quick actions on resources

Context menu or row actions via API:

- **Applications:** start / stop / restart / deploy
- **Databases:** restart
- **Deployments:** view details

Start with restart + deploy — high value, confirm-before-action for safety.

### 13. Inline logs viewer

`GET /applications/{uuid}/logs` — a drawer or panel with tail-style logs. Huge for debugging without opening Coolify in the browser.

### 14. Deployment detail + history

`GET /deployments/{uuid}` and `GET /deployments/applications/{uuid}` — show build status, duration, failure reason, link to logs.

### 15. Application detail drawer

On row click: git branch/repo, FQDN, environment, recent deployments, status timeline, action buttons. Turns tables into a lightweight ops console.

---

## Desktop-native polish

### 16. Launch at login

"Open at login" in Settings — standard for monitoring tools.

### 17. Global hotkey

e.g. ⌘⇧C to summon the window from anywhere.

### 18. Dock / taskbar badge

Show count of unhealthy resources (macOS dock badge, Windows overlay).

### 19. Offline / connection recovery UX

When the instance is unreachable, show retry countdown, last good snapshot, and which endpoints failed (partially handled today with `Promise.allSettled`).

---

## Power-user / later

### 20. Alert rules per resource

"Notify me if `api-prod` is unhealthy for > 2 minutes" or "any deployment fails on instance X".

### 21. Webhook / Slack / Discord / email alerts

For teams — push the same status-change events externally.

### 22. HTTP health checks beyond Coolify status

Optional: ping app FQDNs directly (200 OK, latency). Coolify status and real HTTP health can diverge.

### 23. Export / share status report

Markdown or JSON snapshot: "3 apps unhealthy on prod instance" — useful for incident threads.

### 24. Instance comparison view

Side-by-side health of Cloud vs self-hosted, or staging vs prod.

---

## Suggested phases

| Phase | Features |
| --- | --- |
| **Now** | Projects view, problems filter, search/sort, clickable links |
| **Next** | Notifications + tray icon + watchlist |
| **Then** | App detail drawer, logs, restart/deploy actions |
| **Later** | History, alert rules, external integrations |

---

## Current gap

The app is **purely observational** today. The Coolify API already exposes start/stop/restart/deploy/logs — leaning into that (with confirmations) would differentiate Coolify Monitor from just opening the Coolify web UI, while notifications + tray would make the **desktop** angle genuinely valuable.

**Recommended first picks:**

- **Projects + Problems filter** — fast, uses existing data
- **Status-change notifications** — defines the product as a monitor
