# GHOSTLAB // DUSTY STARK LAB

> Hầm ngầm Tony Stark phiên bản đắp chiếu & đợi linh kiện.
> A full-stack interactive 3D memorial to three ghost projects that will
> absolutely, definitely, 100% be finished "next month".

An atmospheric Three.js bunker (arc reactor, floating dust, cobwebs, smoking
ICs, holograms running on an unstable 5V rail) wired to a .NET 8 + SignalR
backend that broadcasts every incense offering, bonk, and MOSFET explosion
to all connected visitors in real time.

```
backend/   .NET 8 Minimal API + SignalR LabHub + DustAccumulationService
frontend/  React 18 + TypeScript + Vite + @react-three/fiber + drei + Tailwind
```

---

## Quick Start

### 1. Backend — .NET 8

```bash
cd backend
dotnet run
```

Starts on `http://localhost:5000`. No external packages or database needed —
state persists to `backend/lab-state.json` (delete it to reseed).

### 2. Frontend — Node 20+

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`.

### Mock mode (frontend-only)

Run `npm run dev` **without** the backend — the UI detects the API is offline
within ~3s and falls into a fully interactive local simulation (`MÔ PHỎNG NỘI
BỘ` badge in the top bar). Dust still accumulates. Nowhere is safe.

---

## The 3 Ghost Projects

| Pedestal | Code Name | Completion | Dust |
|---|---|---|---|
| Left wing — Forklift AI Safety Vision | `STARK-FORK-EYE` | 65% | 45% → ∞ |
| Center ceiling — Autonomous Micro-Drone | `STARK-SKY-GHOST` | 30% | 78% → ∞ |
| Right bay — Bipedal Humanoid Robot | `STARK-MARK-0.1-BIPED` | 12% | 96% → ∞ |

Each has a 3-layer roadmap (`🔧 Hardware` / `💾 Firmware` / `🖥️ Software`)
with canon statuses `[XONG]`, `[ĐANG NGÁP]`, `[TRONG MƠ]`.

## API

| Endpoint | Description |
|---|---|
| `GET /api/projects` | 3 projects + 3D coords + dust levels + roadmaps |
| `GET /api/stats` | fried ICs, viewer pressure, rail voltage, avg dust |
| `POST /api/projects/{id}/incense` | 🕯️ thắp hương điện tử (broadcast) |
| `POST /api/projects/{id}/bonk` | 🔨 gõ mỏ hàn giục tiến độ (+viewer pressure) |
| `POST /api/projects/{id}/clean-dust` | 💨 -25% dust (it grows back — see below) |
| `POST /api/projects/{id}/boom` | 💥 simulated MOSFET explosion (+fried IC) |
| `GET /api/excuses/random` | J.A.R.V.I.S. Ngáo excuse generator |
| `GET /api/graveyard` | fallen silicon memorial |
| `GET/POST /api/bad-ideas` | visitor-submitted distractions |
| `WS /hubs/lab` | SignalR: `projectUpdated`, `statsUpdated`, `labEvent` |

`DustAccumulationService` (BackgroundService) ticks every 4s: dust creeps up
on every project, and the budget 5V rail randomly sags to ~3.1V — dimming
every hologram and strobe-dimming the entire HUD until the kettle is unplugged.

## Controls

- **Click a pedestal / dock button** — camera flies in, J.A.R.V.I.S. drawer opens
- **Click empty floor** — return to the wide shot
- **💨 / 🕯️ / 🔨 / 💥 buttons** — real SignalR-backed actions with 3D FX
- **🪦 NGHĨA ĐỊA** — memorial for components that released their magic smoke
- **💡 XÚI DẠI** — submit terrible ideas to further derail the engineer
- **🚨 SẾP/VỢ ĐANG TỚI** — instant boring-corporate-Excel camouflage

## Config

Frontend API base defaults to `http://localhost:5000`; override with
`VITE_API_URL` env var. Backend dev port in `backend/appsettings.Development.json`.

## Deploy to home-server

```bat
deploy
```

One command: build → publish self-contained linux-x64 → scp → systemd
`ghostlab` on `/opt/ghostlab:5293` → health check. Chi tiết: `deploy/README.md`.
Live at https://ghostlab.dbivn.com/ (Cloudflare tunnel `dbi-react-app-tunnel`).
