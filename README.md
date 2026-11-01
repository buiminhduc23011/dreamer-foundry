# GHOSTLAB // VAPORWARE GRAVEYARD v3.0

> Bảo tàng ngầm của những dự án "sắp xong" — nơi bụi tích lũy nhanh hơn tiến độ.
> A full-stack interactive 3D memorial to six ghost projects that will
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

## The 6 Ghost Projects

| Pedestal | Code Name | Completion | Dust |
|---|---|---|---|
| Left wing — Forklift AI Safety Vision | `PRJ-FORK-EYE` | 65% | 45% → ∞ |
| Left inner bay — Smart Fume Extractor | `PRJ-SMOKE-TRAP` | 50% | 60% → ∞ |
| Center ceiling — Autonomous Micro-Drone | `PRJ-SKY-GHOST` | 30% | 78% → ∞ |
| Right inner bay — Low-Profile AGV | `PRJ-GHOST-AGV` | 40% | 82% → ∞ |
| Right wing — Bipedal Humanoid Robot | `PRJ-IRON-BIPED` | 12% | 96% → ∞ |
| Free-roaming the floor — Swerve AMR w/ LiDAR SLAM | `PRJ-AMR-SLAM` | 45% | 70% → ∞ |

Each has a 3-layer roadmap (`🔧 Hardware` / `💾 Firmware` / `🖥️ Software`)
with canon statuses `[XONG]`, `[ĐANG NGÁP]`, `[TRONG MƠ]`, a damage report,
and a time paradox log.

The `PRJ-AMR-SLAM` does not sit on a pedestal — it patrols the bunker floor on
4 independent swerve-drive pods, occasionally loses localization, spins in
place ("xoay vòng trầm cảm"), flashes its beacon red, and logs the incident to
COM4 before resuming patrol like nothing happened.

## Cinematic Lab Tour

Để yên 6 giây — camera tự trôi qua 5 workbench + con AMR đang lang thang + lõi Arc Reactor như phim
tài liệu phần cứng (glide `Vector3.lerp` + slow-orbit easing), đổi station mỗi
12 giây. Mỗi điểm dừng mở **Holographic Spec Card** với telemetry live
(`V_BUS`, `MCU TEMP`, `PWM DUTY`, `DUST LEVEL`). Chạm chuột là quyền điều
khiển về tay bạn ngay lập tức.

## API

| Endpoint | Description |
|---|---|
| `GET /api/projects` | 6 projects + 3D coords + dust levels + roadmaps |
| `GET /api/stats` | fried ICs, viewer pressure, rail voltage, avg dust |
| `POST /api/projects/{id}/incense` | 🕯️ thắp hương điện tử (broadcast) |
| `POST /api/projects/{id}/bonk` | 🔨 gõ đầu giục tiến độ (+viewer pressure) |
| `POST /api/projects/{id}/clean-dust` | 💨 -25% dust (it grows back — see below) |
| `POST /api/projects/{id}/boom` | 💥 simulated MOSFET explosion (+fried IC) |
| `POST /api/clean-all` | 💨 xịt khí nén toàn lab — bụi mọi pedestal về 0% |
| `POST /api/hazard/brownout` | ⚡ test quá tải — rail sụt 3.2V trong 2 giây |
| `GET /api/excuses/random` | GhostLab Telemetry excuse generator |
| `GET /api/graveyard` | fallen silicon memorial |
| `GET/POST /api/bad-ideas` | visitor-submitted distractions |
| `POST /api/bad-ideas/{id}/upvote` | ▲ upvote ý tưởng tồi |
| `GET/POST /api/projects/{id}/roasts` | 💬 góc cà khịa theo dự án |
| `POST /api/chat` | 🤖 proxy Gemini + persona GhostLab (key giữ phía server) |
| `GET /api/admin/status` | trạng thái kết nối Gemini (yêu cầu `X-Admin-Key`) |
| `POST /api/admin/init` | khởi tạo mã chỉ huy lần đầu |
| `POST /api/admin/gemini-key` | lưu/xoá Gemini key + model (không cần redeploy) |
| `POST /api/hazard/boom-all` | 💥 hoả hoạn giả lập — bùm toàn bộ IC một lúc |
| `WS /hubs/lab` | SignalR: `projectUpdated`, `statsUpdated`, `labEvent`, `roastAdded`, `badIdeasUpdated` |

`DustAccumulationService` (BackgroundService) ticks every 4s: dust creeps up
on every project, and the budget 5V rail randomly sags to ~3.1V — dimming
every hologram and strobe-dimming the entire HUD until the kettle is unplugged.

## Controls

- **Click a pedestal / dock button** — camera glides in, inspection drawer opens
- **Click empty floor** — glide back to the wide shot
- **Idle 6s** — 🎥 cinematic lab tour patrols all 6 stations + reactor core
- **⚡ QUÁ TẢI** — brownout test: amber strobes, rail drops to 3.2V for 2s
- **💨 XỊT BỤI** — compressed air purge, every pedestal erupts dust at once
- **🕯️ / 🔨 / 💥 buttons** — real SignalR-backed actions with 3D FX
- **🪦 NGHĨA ĐỊA** — memorial for components that released their magic smoke
- **💡 XÚI DẠI** — submit + upvote terrible ideas to derail the engineer
- **💬 CÀ KHỊA** — community roasts with self-appointed role tags per project
- **🚨 SẾP/VỢ TỚI** — instant boring-corporate-Excel camouflage
- **COM4 115200** — bottom-left serial monitor streams firmware logs every 1.8s
- **🤖 TRỢ LÝ TRỰC BAN** — floating chat góc phải dưới: trợ lý ảo đắp chiếu biết hết
  tiến độ, nghĩa địa và excuse của lab; proxy `/api/chat` → Gemini, không lộ key

## Secret Admin — Central Command

Trang cấu hình ẩn, không link từ đâu cả: mở `/ghost-admin-secret-key-99` hoặc
bấm **Ctrl+Shift+G ×3**. Lần đầu vào sẽ tự tạo **mã chỉ huy** (admin key) —
sau đó mọi API admin đều yêu cầu header `X-Admin-Key`.

- Đổi/lưu **Gemini API key** + model ngay trong UI — backend ghi vào
  `backend/chat-secrets.json` (gitignored; env override: `GHOSTLAB_ADMIN_KEY`,
  `GHOSTLAB_GEMINI_KEY`, `GHOSTLAB_GEMINI_MODEL`). Key không bao giờ rời server.
- Chỉ báo kết nối: `ONLINE — Đang hút máu CPU` / `INVALID — Chưa nạp tiền / Sai key`.
- Hazard vui: **reset toàn bộ độ bụi về 0%** hoặc **kích hoả hoạn giả lập**
  bùm toàn bộ IC — broadcast SignalR, cả lab rung và thả khói tím cùng lúc.

Trợ lý chat nhét sẵn system prompt ép persona: mỉa mai, tự giễu, ám ảnh khói ma
thuật và kinh phí bay màu — và tuyệt đối không thừa nhận mình là AI.

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
