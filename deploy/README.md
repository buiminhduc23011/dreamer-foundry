# Deploy — Dusty Stark Lab → home-server

## Nhanh nhất (Windows)

```bat
deploy
```

hoặc từ PowerShell:

```powershell
.\deploy\deploy-home-server.ps1
```

Script tự làm hết:
1. `npm run build` frontend → `dist/`
2. `dotnet publish` self-contained **linux-x64** + copy `dist/` vào `wwwroot/`
3. Đóng gói `tar.gz` → `scp` lên `/tmp` của home-server
4. Remote: extract → `rsync` vào `/opt/ghostlab` (giữ lại `lab-state.json`) → cài/restart `ghostlab.service` → health-check `/api/stats` trên `:5293`

## Tùy chọn

```powershell
.\deploy\deploy-home-server.ps1 -SkipBuild        # skip build+publish (da co publish/linux-x64)
.\deploy\deploy-home-server.ps1 -Port 5294        # doi port
.\deploy\deploy-home-server.ps1 -HostName <alias> # server khac
```

## Hạ tầng trên home-server

| Thứ | Giá trị |
|---|---|
| Service | `ghostlab.service` (`systemctl status ghostlab`) |
| App dir | `/opt/ghostlab` |
| Port | `5293` |
| State file | `/opt/ghostlab/lab-state.json` (không bị ghi đè khi deploy) |
| Public | `ghostlab.dbivn.com` → Cloudflare tunnel `dbi-react-app-tunnel` → `localhost:5293` |
| Tunnel config | `~/.cloudflared/config.yml` (service `dbi-tunnel`) |

## Yêu cầu phía local

- SSH alias `home-server` trong `~/.ssh/config` + key `id_sti_gateway`
- `ssh`/`scp` trên PATH hoặc ở `C:\Program Files\Git\usr\bin` / OpenSSH
- `dotnet` SDK 8+, `node`/`npm`, `tar` (có sẵn trên Windows 10/11)

## Khi deploy xong không thấy thay đổi trên web

- `ssh home-server 'journalctl -u ghostlab -n 50 --no-pager'` — xem log service
- `ssh home-server 'curl -s http://127.0.0.1:5293/api/stats'` — check API
- Hard-refresh trình duyệt (Ctrl+F5) — `index.html` cache phía Cloudflare
