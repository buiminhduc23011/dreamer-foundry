import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function makeTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

/** Thảm cao su chống tĩnh điện ESD có lưới định vị 5cm, thước đo mm mép trước & logo ESD vàng */
export function getEsdMatTexture(baseHex: string): THREE.CanvasTexture {
  return makeTex(`esd-${baseHex}`, 1024, 512, (ctx, w, h) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, w, h);

    // Viền bo đen ngoài cùng của thảm cao su
    ctx.strokeStyle = '#090e14';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);

    // Đường kẻ chỉ mảnh bên trong
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Lưới chấm cắt 5cm kiểu cutting/ESD mat kỹ thuật
    ctx.strokeStyle = 'rgba(255,255,255,0.065)';
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = 32; x < w - 32; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 28);
      ctx.lineTo(x, h - 46);
      ctx.stroke();
    }
    for (let y = 32; y < h - 46; y += step) {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(w - 28, y);
      ctx.stroke();
    }

    // Thước chia vạch cm dọc mép trước thảm (+Z = bottom của canvas)
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 11px monospace';
    for (let x = 48, cm = 0; x < w - 60; x += 32, cm += 5) {
      const tickH = cm % 10 === 0 ? 12 : 6;
      ctx.fillRect(x, h - 26 - tickH, 1.5, tickH);
      if (cm % 10 === 0) {
        ctx.fillText(`${cm}`, x - 6, h - 12);
      }
    }

    // Nhãn cảnh báo ESD PROTECTED AREA góc phải dưới
    ctx.fillStyle = '#eab308';
    ctx.fillRect(w - 208, h - 68, 172, 34);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('⚡ ESD SAFE MAT', w - 196, h - 51);
    ctx.font = '9px monospace';
    ctx.fillText('10^6 - 10^9 OHM // GND', w - 196, h - 39);
  });
}

/** Tấm thép đục lỗ treo dụng cụ (Perforated Pegboard) */
export function getPegboardTexture(): THREE.CanvasTexture {
  return makeTex('pegboard', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1b2532';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    for (let y = 18; y < h - 14; y += 16) {
      for (let x = 18; x < w - 14; x += 16) {
        ctx.fillStyle = '#070b10';
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148,163,184,0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  });
}

/** Màn hình máy hiện sóng Rigol / Keysight DSOX 4 kênh */
export function getOscilloscopeScreenTexture(): THREE.CanvasTexture {
  return makeTex('scope-screen', 512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#041218';
    ctx.fillRect(0, 0, w, h);

    // Thanh top bar thông số trigger
    ctx.fillStyle = '#0d222e';
    ctx.fillRect(0, 0, w, 28);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText("T'D", 10, 19);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('H 200us/div   2.00GSa/s   f = 24.982kHz', 52, 19);
    ctx.fillStyle = '#facc15';
    ctx.fillText('TRIG: CH1 3.30V', w - 135, 19);

    // Lưới graticule máy hiện sóng
    const gx = 12, gy = 34, gw = w - 92, gh = h - 74;
    ctx.strokeStyle = 'rgba(56,189,248,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);
    for (let i = 1; i < 10; i++) {
      const x = gx + (gw / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + gh);
      ctx.stroke();
    }
    for (let j = 1; j < 8; j++) {
      const y = gy + (gh / 8) * j;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + gw, y);
      ctx.stroke();
    }

    // CH1 (Vàng): Xung vuông PWM bị vọt lố ringing do nhiễu cảm kháng
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let px = 0; px < gw; px++) {
      const phase = (px / 84) % 1;
      const high = phase < 0.5 ? 1 : -1;
      const edgeDist = Math.min(phase, Math.abs(phase - 0.5)) * 84;
      const ring = Math.exp(-edgeDist * 0.18) * Math.sin(edgeDist * 1.4) * 18 * high;
      const y = gy + gh * 0.34 - high * 32 - ring;
      if (px === 0) ctx.moveTo(gx + px, y);
      else ctx.lineTo(gx + px, y);
    }
    ctx.stroke();

    // CH2 (Xanh Cyan): Sóng sin phản hồi dòng điện BLDC / PROFINET differential
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let px = 0; px < gw; px++) {
      const y = gy + gh * 0.72 + Math.sin(px * 0.075) * 26 + Math.sin(px * 0.43) * 4;
      if (px === 0) ctx.moveTo(gx + px, y);
      else ctx.lineTo(gx + px, y);
    }
    ctx.stroke();

    // Sidebar menu bên phải
    ctx.fillStyle = '#0c1c26';
    ctx.fillRect(w - 74, gy, 66, gh);
    ['CH1 5V', 'CH2 2V', 'MATH', 'FFT ON', 'CURSORS'].forEach((lbl, idx) => {
      ctx.fillStyle = idx === 0 ? '#eab308' : idx === 1 ? '#06b6d4' : '#334155';
      ctx.fillRect(w - 70, gy + 6 + idx * 46, 58, 36);
      ctx.fillStyle = idx < 2 ? '#020617' : '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(lbl, w - 66, gy + 28 + idx * 46);
    });

    // Thanh đo lường dưới đáy
    ctx.fillStyle = '#091720';
    ctx.fillRect(0, h - 34, w, 34);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('CH1 Vpp=26.4V  Overshoot=38%', 12, h - 13);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('CH2 Irms=1.84A  Jitter=4.2us', 248, h - 13);
  });
}

/** Mặt trước bộ nguồn DC 2 kênh hiển thị LED 7 thanh */
export function getPowerSupplyFaceTexture(): THREE.CanvasTexture {
  return makeTex('psu-face', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#141d26';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('DC REGULATED POWER SUPPLY // DUAL 30V 5A', 18, 28);

    // 2 Ô màn hình LED đen bóng cho CH1 (24V) & CH2 (5V)
    const drawChannel = (ox: number, title: string, volts: string, amps: string) => {
      ctx.fillStyle = '#05080c';
      ctx.fillRect(ox, 42, 214, 112);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, 42, 214, 112);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(title, ox + 10, 58);

      // LED đỏ Voltage
      ctx.fillStyle = '#ff3b3b';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(volts, ox + 14, 98);
      ctx.font = 'bold 16px monospace';
      ctx.fillText('V', ox + 175, 96);

      // LED xanh lá Current
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(amps, ox + 14, 140);
      ctx.font = 'bold 16px monospace';
      ctx.fillText('A', ox + 175, 138);

      // Đèn báo CV xanh
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ox + 196, 54, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawChannel(20, 'CH1 MASTER (PLC)', '24.02', '01.48');
    drawChannel(274, 'CH2 LOGIC RAIL', '05.01', '02.86');

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText('COARSE    FINE                COARSE    FINE', 34, 184);
  });
}

/** Màn hình cảm ứng máy in 3D KlipperScreen */
export function getPrinterScreenTexture(): THREE.CanvasTexture {
  return makeTex('printer-lcd', 384, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0b1320';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('VORON-GHOST // PRINTING...', 14, 22);

    // Vòng tiến độ 68%
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(82, 122, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(82, 122, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.68);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('68%', 58, 130);

    // Thông số nhiệt độ
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#f97316';
    ctx.fillText('🔥 NOZZLE: 220 / 220°C', 156, 86);
    ctx.fillStyle = '#eab308';
    ctx.fillText('♨  BED:     65 /  65°C', 156, 118);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🌀 FAN:    100%  Z=14.2', 156, 150);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText('biped_knee_v19_FINAL.gcode', 156, 182);

    // Nút điều khiển dưới đáy
    ['PAUSE', 'TUNE', 'E-STOP'].forEach((b, i) => {
      ctx.fillStyle = i === 2 ? '#dc2626' : '#1e293b';
      ctx.fillRect(16 + i * 120, 204, 108, 38);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(b, 42 + i * 120, 228);
    });
  });
}

/** Màn hình 1 của kỹ sư: VS Code + Terminal lỗi đỏ */
export function getIdeMonitorTexture(): THREE.CanvasTexture {
  return makeTex('ide-monitor', 768, 448, (ctx, w, h) => {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // Sidebar cây thư mục
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, 156, h);
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('EXPLORER', 14, 24);
    const files = [
      '▼ ghostlab-fw',
      '  ▸ drivers/',
      '  • profinet_io.c',
      '  • jarvis_core.py',
      '  • drone_pid.cpp',
      '  • biped_canfd.c',
      '  • GSDML-V2.4.xml',
    ];
    files.forEach((f, i) => {
      if (i === 2) {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 38 + i * 24, 156, 22);
      }
      ctx.fillStyle = i === 2 ? '#38bdf8' : '#cbd5e1';
      ctx.font = '12px monospace';
      ctx.fillText(f, 10, 54 + i * 24);
    });

    // Khu vực code syntax highlight
    const codeLines: [string, string][] = [
      ['#include "simatic_et200_bus.h"', '#c084fc'],
      ['#define PROFINET_CYCLE_US   1000', '#fb923c'],
      ['', '#fff'],
      ['void RemoteIO_CyclicScan(IoRack_t *rack) {', '#60a5fa'],
      ['  if (rack->vbus_mv < 18500) {', '#f8fafc'],
      ['    SetLed(LED_SF_RED, BLINK_DISCO); // cứu!', '#6b7280'],
      ['    TriggerFault(ERR_OPTO_SMOKED);', '#f87171'],
      ['  }', '#f8fafc'],
      ['  for (int slot = 1; slot <= 8; slot++) {', '#c084fc'],
      ['    uint16_t raw = SpiBackplane_Xfer(slot);', '#34d399'],
      ['    // TODO: tại sao bật biến tần là nhảy bit??', '#6b7280'],
      ['    rack->di_state[slot] = DebouncePray(raw);', '#facc15'],
      ['  }', '#f8fafc'],
      ['}', '#60a5fa'],
    ];
    codeLines.forEach(([txt, col], idx) => {
      ctx.fillStyle = '#475569';
      ctx.font = '13px monospace';
      ctx.fillText(String(idx + 41), 168, 42 + idx * 20);
      ctx.fillStyle = col;
      ctx.fillText(txt, 204, 42 + idx * 20);
    });

    // Integrated Terminal bên dưới
    ctx.fillStyle = '#090d13';
    ctx.fillRect(156, h - 122, w - 156, 122);
    ctx.strokeStyle = '#30363d';
    ctx.strokeRect(156, h - 122, w - 156, 122);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('ducne@ghostlab:~/fw$ make flash-et200sp', 170, h - 96);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('[INFO] Connecting PROFINET interface X1 P1R (192.168.0.12)...', 170, h - 74);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('[ERR!] Station "et200sp-ghost" SF/BF FAULT — 4x PC817 open circuit!', 170, h - 52);
    ctx.fillStyle = '#facc15';
    ctx.fillText('[WARN] J.A.R.V.I.S. daemon eating 99.8% GPU VRAM (94°C)', 170, h - 30);
  });
}

/** Màn hình 2 của kỹ sư: TIA Portal / SCADA Topology & Telemetry */
export function getScadaMonitorTexture(): THREE.CanvasTexture {
  return makeTex('scada-monitor', 768, 448, (ctx, w, h) => {
    ctx.fillStyle = '#07131a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#005f6b';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('TIA DIAGNOSTICS // PROFINET IO & NEURAL TELEMETRY', 16, 22);

    // Sơ đồ mạng PLC -> Switch -> ET 200SP -> HMI
    const nodes = [
      { x: 60, y: 80, name: 'PLC S7-1515', ip: '192.168.0.1', ok: true },
      { x: 280, y: 80, name: 'ET 200SP RACK', ip: '192.168.0.12', ok: false },
      { x: 510, y: 80, name: 'JARVIS NODE', ip: '192.168.0.99', ok: true },
    ];
    // Cáp xanh lá PROFINET nối các trạm
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(190, 125);
    ctx.lineTo(280, 125);
    ctx.lineTo(510, 125);
    ctx.stroke();

    nodes.forEach((n) => {
      ctx.fillStyle = '#11222d';
      ctx.fillRect(n.x, n.y, 175, 92);
      ctx.strokeStyle = n.ok ? '#009999' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(n.x, n.y, 175, 92);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(n.name, n.x + 12, n.y + 28);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(n.ip, n.x + 12, n.y + 50);
      ctx.fillStyle = n.ok ? '#22c55e' : '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(n.ok ? '● RUN / OK' : '▲ SF / BF FAULT', n.x + 12, n.y + 74);
    });

    // Biểu đồ tải dưới
    ctx.fillStyle = '#0c1c26';
    ctx.fillRect(36, 208, w - 72, 204);
    ctx.strokeStyle = '#1e3a4c';
    ctx.strokeRect(36, 208, w - 72, 204);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('REALTIME BUS LOAD / GPU THERMAL PROFILE', 52, 232);

    ctx.strokeStyle = '#ffb02e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 56; x < w - 56; x += 12) {
      const y = 340 - Math.sin(x * 0.03) * 42 - ((x * 17) % 35);
      if (x === 56) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

/** Mặt nhận diện module Siemens SIMATIC ET 200SP IM 155-6 PN ST */
export function getSiemensFaceplateTexture(): THREE.CanvasTexture {
  return makeTex('siemens-im155', 256, 512, (ctx, w, h) => {
    // Tông xám than công nghiệp đặc trưng của dòng SIMATIC S7-1500 / ET 200SP
    ctx.fillStyle = '#2d3741';
    ctx.fillRect(0, 0, w, h);

    // Dải xanh Petrol thương hiệu Siemens
    ctx.fillStyle = '#009999';
    ctx.fillRect(0, 56, w, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('SIEMENS', 18, 81);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('SIMATIC', 18, 116);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ET 200SP', 18, 138);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('IM 155-6 PN ST', 18, 168);

    // Các nhãn đèn chẩn đoán RN / ER / MT / PWR
    const leds: [string, string][] = [
      ['RN', '#22c55e'],
      ['ER', '#ef4444'],
      ['MT', '#f59e0b'],
      ['PWR', '#22c55e'],
    ];
    leds.forEach(([lbl, col], i) => {
      const y = 205 + i * 28;
      ctx.fillStyle = col;
      ctx.fillRect(22, y - 10, 14, 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(lbl, 46, y + 2);
    });

    // Mã QR Matrix trắng góc dưới + mã sản phẩm 6ES7
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(18, 340, 74, 74);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if ((r * 5 + c * 3) % 2 === 0) {
          ctx.fillRect(24 + c * 9, 346 + r * 9, 7, 7);
        }
      }
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('X1 P1R / P2R', 110, 366);
    ctx.fillText('DC 24V', 110, 388);
    ctx.fillText('6ES7155-6AU01', 18, 444);
  });
}

/** Màn hình HMI Siemens Comfort Panel 7" cạnh thanh ray Remote I/O */
export function getHmiScreenTexture(): THREE.CanvasTexture {
  return makeTex('siemens-hmi', 512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#18222c';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#009999';
    ctx.fillRect(0, 0, w, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('SIMATIC HMI // REMOTE-IO STATION #01', 14, 24);

    // Banner cảnh báo đỏ nhấp nháy
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(14, 48, w - 28, 42);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 48, w - 28, 42);
    ctx.fillStyle = '#fecaca';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('⚠ ALARM 0x80A2: PROFINET IO-Device SF/BF Fault (Slot 3 Opto Blown)', 24, 74);

    // Trạng thái 8 Slice Module
    for (let i = 0; i < 8; i++) {
      const x = 18 + i * 60;
      const isSafety = i >= 6;
      const isFault = i === 2 || i === 4;
      ctx.fillStyle = isSafety ? '#ca8a04' : '#283542';
      ctx.fillRect(x, 108, 52, 146);
      ctx.strokeStyle = isFault ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 108, 52, 146);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`S${i + 1}`, x + 16, 128);
      for (let ch = 0; ch < 6; ch++) {
        ctx.fillStyle = isFault && ch === 2 ? '#ef4444' : (i + ch) % 2 === 0 ? '#22c55e' : '#334155';
        ctx.fillRect(x + 10, 140 + ch * 16, 32, 10);
      }
    }

    // Softkeys F1..F6
    ['F1 ACK', 'F2 DIAG', 'F3 FORCE', 'F4 TREND', 'F5 GSDML', 'F6 PRAY'].forEach((k, idx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14 + idx * 81, h - 42, 75, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(k, 22 + idx * 81, h - 22);
    });
  });
}

/** Bảng trắng kỹ sư (Whiteboard) vẽ tay sơ đồ mạch, PID & TODO phòng lab */
export function getWhiteboardTexture(): THREE.CanvasTexture {
  return makeTex('whiteboard-notes', 1024, 576, (ctx, w, h) => {
    ctx.fillStyle = '#f4f7fa';
    ctx.fillRect(0, 0, w, h);

    // Vệt xóa bảng mờ cho giống thật
    ctx.fillStyle = 'rgba(148,163,184,0.12)';
    ctx.fillRect(80, 110, 320, 90);
    ctx.fillRect(560, 260, 360, 120);

    // 1. Góc trái trên: Sơ đồ cách ly Remote I/O Siemens
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(36, 36, 430, 235);
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PRJ-REMOTE-IO // PROFINET BUS', 54, 70);
    ctx.font = '17px monospace';
    ctx.fillText('[24VDC] ──[R 2.2k]──►| PC817 |──► MCU GPIO', 54, 118);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('⚡ CẤM ĐẤU 220VAC VÀO ĐÂY!! (Nổ 4 con rồi!)', 54, 162);
    ctx.fillStyle = '#0f172a';
    ctx.fillText('• IM 155-6 PN: Đèn đỏ BF nháy 2Hz', 54, 204);
    ctx.fillText('• Nhiễu biến tần -> thêm tụ dập + cầu nguyện', 54, 238);

    // 2. Góc trái dưới: Đường đặc tính PID Drone
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(54, 490);
    ctx.lineTo(440, 490);
    ctx.moveTo(54, 320);
    ctx.lineTo(54, 520);
    ctx.stroke();

    ctx.strokeStyle = '#dc2626';
    ctx.beginPath();
    for (let x = 0; x < 370; x += 6) {
      const y = 420 - Math.sin(x * 0.09) * 65 * Math.exp(-x * 0.002);
      if (x === 0) ctx.moveTo(56 + x, y);
      else ctx.lineTo(56 + x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SKY-GHOST PID LẦN #412 (Vẫn lắc!)', 54, 316);

    // 3. Góc phải trên: Kiến trúc J.A.R.V.I.S. Core
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('J.A.R.V.I.S. HOLOGRAM CORE v0.28', 520, 68);
    ctx.fillStyle = '#1e293b';
    ctx.font = '18px monospace';
    ctx.fillText('Mic Array ─► Whisper ─► Local LLM (12GB)', 520, 112);
    ctx.fillText('                          │', 520, 140);
    ctx.fillStyle = '#dc2626';
    ctx.fillText('            Tràn VRAM ◄───┴──► Bật nhầm nóng lạnh', 520, 170);

    // 4. Góc phải dưới: Checklist nội quy hầm lab
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SPRINT BACKLOG (Q4/2026 -> Q4/2035):', 520, 260);
    ctx.font = '19px monospace';
    ctx.fillText('☑ Hàn mạch nguồn Buck 48V->5V', 520, 304);
    ctx.fillText('☑ Làm nổ MOSFET lần thứ 30', 520, 342);
    ctx.fillText('☐ Fix đèn SF/BF bộ Remote I/O', 520, 380);
    ctx.fillText('☐ Dạy IRON-BIPED đứng bằng 2 chân', 520, 418);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('⚠ AI ĐUN MÌ TÔM NHỚ RÚT NGUỒN SERVER!', 520, 482);
  });
}

/** Bảng HUD Hologram lơ lửng quanh quả cầu J.A.R.V.I.S. của Tony Stark */
export function getJarvisHudTexture(variant: 0 | 1 | 2): THREE.CanvasTexture {
  return makeTex(`jarvis-hud-${variant}`, 512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    // Khung sci-fi vát góc vàng hổ phách Stark Industries
    ctx.fillStyle = 'rgba(20, 12, 4, 0.42)';
    ctx.fillRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = variant === 1 ? '#2ee6ff' : '#ffb02e';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = variant === 1 ? '#2ee6ff' : '#ffcf6b';
    ctx.font = 'bold 18px monospace';

    if (variant === 0) {
      ctx.fillText('J.A.R.V.I.S. // NEURAL MATRIX v4.2', 26, 44);
      ctx.font = '14px monospace';
      ctx.fillText('VOICE ENGINE : BRITISH BUTLER (LAG 45s)', 26, 82);
      ctx.fillText('VRAM ALLOC   : 11.98 / 12.00 GB [CRITICAL]', 26, 110);
      ctx.fillText('ARC RAIL     : 5.00V // RIPPLE 180mV', 26, 138);
      // Sóng âm giọng nói của J.A.R.V.I.S.
      for (let i = 0; i < 28; i++) {
        const bh = 12 + ((i * 19) % 52);
        ctx.fillRect(28 + i * 16, 222 - bh, 10, bh);
      }
    } else if (variant === 1) {
      ctx.fillText('STARK HOLO-TABLE // LAB TELEMETRY', 26, 44);
      // Vòng radar mục tiêu
      ctx.beginPath();
      ctx.arc(105, 148, 64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(105, 148, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '14px monospace';
      ctx.fillText('• FORK-EYE   : ONLINE', 200, 106);
      ctx.fillText('• REMOTE-IO  : BF FAULT', 200, 136);
      ctx.fillText('• SKY-GHOST  : TETHERED', 200, 166);
      ctx.fillText('• IRON-BIPED : SLEEPING', 200, 196);
    } else {
      ctx.fillText('SUBROUTINE // DIAGNOSTIC STREAM', 26, 44);
      ctx.font = '13px monospace';
      ctx.fillText('0x00F4: TENSOR_CORE_THROTTLE (94°C)', 26, 84);
      ctx.fillText('0x01A8: INTENT="COUGH" -> WATER_HEATER_ON', 26, 114);
      ctx.fillText('0x02C1: HOLOGRAM_SPIN_FPS = 60.0 (90% BUDGET)', 26, 144);
      ctx.fillStyle = '#ff4d5e';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('>> SIR, APTOMAT TỔNG SẮP NHẢY <<', 26, 198);
    }
  });
}
