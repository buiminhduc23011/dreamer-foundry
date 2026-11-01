import { useEffect, useRef, useState } from 'react';
import { useLabStore } from '../store/labStore';

type Level = 'INFO' | 'DEBUG' | 'WARN' | 'ERR';
interface SerialLine { level: Level; text: string; at: Date }

/** Pool log firmware — đúng chất COM4 115200 baud của một lab có vấn đề. */
const SERIAL_POOL: [Level, string][] = [
  ['ERR', 'PROFINET_IO: IM 155-6 PN ST mất đồng bộ chu kỳ 1ms — đèn đỏ BF sáng rực'],
  ['WARN', 'ET200SP_SLOT3: Ngõ vào DI.4 quá áp 218V — nghi vấn thợ điện đấu nhầm 220VAC'],
  ['ERR', 'HARD_FAULT: Biến con trỏ NULL trỏ vào cõi vĩnh hằng'],
  ['INFO', 'FORK_EYE: Phát hiện "người" tại (12,4) — độ tin cậy 12% (đó là cái cột)'],
  ['DEBUG', 'DRONE_PID: I-term bão hòa, drone giật căng dây xích trên giàn test'],
  ['WARN', 'BMS: Cell 3 pin LiPo sưng phồng — khuyến nghị cầu nguyện'],
  ['INFO', 'CAN-FD: Mất gói tin khớp gối #7, retry lần thứ 19'],
  ['ERR', 'IMU: Gyro drift 40°/s — tin cảm biến hay tin số phận?'],
  ['ERR', 'JARVIS_LLM: CUDA out of memory (11.98/12.00 GB) khi dịch câu "Mấy giờ rồi?"'],
  ['DEBUG', 'BUCK_48V: Ripple 240mVpp — chấp nhận được, không ai chết cả'],
  ['WARN', 'OAK-1: NPU 82°C, giảm xung nhịp AI xuống mức "lười"'],
  ['INFO', 'WATCHDOG: Reset lần thứ 47 trong ngày — mọi thứ vẫn "ổn"'],
  ['ERR', 'MAVLINK: Mất trạm mặt đất — may mà drone đang bị xích vào bàn'],
  ['DEBUG', 'CNC_QUEUE: leg_v19_final_FINAL2.step chờ duyệt từ 3 tháng trước'],
  ['INFO', 'DUST_SENSOR: PM2.5 vượt ngưỡng — cảm biến xin nghỉ phép'],
  ['WARN', 'PROFISAFE: F-DQ 4x24VDC báo lỗi CRC — tự ngắt rơ-le an toàn vô thời hạn'],
  ['INFO', 'JARVIS_STT: Nhận diện tiếng ho của chủ lab -> thực thi lệnh bật bình nóng lạnh'],
  ['DEBUG', 'AI_4_20MA: Kênh #2 đọc được 38.4mA — cảm biến áp suất đang bốc khói?'],
  ['WARN', 'HOLO_PROJ: Nhiệt độ cụm laser chiếu bàn kính đạt 86°C — giảm độ sáng 50%'],
  ['ERR', 'STACK_OVERFLOW: Đệ quy hàm fixBug() gọi chính nó 8192 lần'],
  ['INFO', 'MODBUS_BRIDGE: Đọc thanh ghi 40001 timeout — thiết bị đang bận ngủ đông'],
  ['DEBUG', 'KLIPPER_3D: Bed mesh lệch 0.42mm — bù Z-offset bằng... tờ giấy A4 gấp đôi'],
];

const levelColor: Record<Level, string> = {
  INFO: 'text-holo/75',
  DEBUG: 'text-holo/45',
  WARN: 'text-amber-glow',
  ERR: 'text-danger',
};

const MAX_LINES = 60;

/** Serial monitor bottom-left — log firmware chảy mỗi 1.8s + sự kiện hub thật. */
export function SerialMonitor() {
  const [lines, setLines] = useState<SerialLine[]>([
    { level: 'INFO', text: 'COM4 opened @ 115200 baud — GhostLab telemetry uplink OK', at: new Date() },
    { level: 'WARN', text: 'DustAccumulationService detected — bụi sẽ tích đến vĩnh viễn', at: new Date() },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idx = useRef(Math.floor(Math.random() * SERIAL_POOL.length));
  const lastFeedId = useRef(0);
  const feed = useLabStore((s) => s.feed);

  // Firmware stream — một dòng mới mỗi 1.8s.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const [level, text] = SERIAL_POOL[idx.current];
      idx.current = (idx.current + 1) % SERIAL_POOL.length;
      setLines((ls) => [...ls.slice(-MAX_LINES + 1), { level, text, at: new Date() }]);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  // Hub events thật cũng đổ vào serial dưới dạng [HUB].
  useEffect(() => {
    if (feed.length === 0) return;
    const evt = feed[0];
    const key = new Date(evt.at).getTime() + evt.message.length;
    if (key === lastFeedId.current) return;
    lastFeedId.current = key;
    setLines((ls) => [...ls.slice(-MAX_LINES + 1), { level: 'DEBUG', text: `[HUB] ${evt.message}`, at: new Date() }]);
  }, [feed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines.length]);

  return (
    <aside className="hud-panel pointer-events-auto fixed bottom-3 left-3 z-40 flex w-[430px] max-w-[46vw] flex-col">
      <div className="flex items-center justify-between border-b border-holo/20 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <i className="dot dot-live" />
          <span className="hud-title holo-text text-[9px] font-bold">EMBEDDED DEBUG</span>
          <span className="font-mono text-[8px] text-holo/50">COM4 — 115200 baud</span>
        </div>
        <span className="font-mono text-[8px] text-holo/40">{lines.length} lines</span>
      </div>
      <div ref={scrollRef} className="h-[148px] overflow-y-auto px-3 py-1.5 font-mono text-[9px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className="log-line whitespace-nowrap">
            <span className="text-holo/30">[{l.at.toLocaleTimeString('vi-VN', { hour12: false })}]</span>{' '}
            <span className={levelColor[l.level]}>[{l.level}]</span>{' '}
            <span className="text-holo/70">{l.text}</span>
          </div>
        ))}
        <span className="serial-cursor text-holo">▊</span>
      </div>
    </aside>
  );
}
