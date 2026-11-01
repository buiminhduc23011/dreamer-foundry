import { useEffect, useRef, useState } from 'react';
import { useLabStore } from '../store/labStore';

type Level = 'INFO' | 'DEBUG' | 'WARN' | 'ERR';
interface SerialLine { level: Level; text: string; at: Date }

/** Pool log firmware — đúng chất COM4 115200 baud của một lab có vấn đề. */
const SERIAL_POOL: [Level, string][] = [
  ['INFO', 'AGV_NAV: Mất vạch từ, đang xoay vòng tròn tìm đường'],
  ['WARN', 'FUME_EXTRACTOR: Quạt quá nhiệt 71°C, chuẩn bị bốc mùi khét'],
  ['ERR', 'HARD_FAULT: Biến con trỏ NULL trỏ vào cõi vĩnh hằng'],
  ['INFO', 'FORK_EYE: Phát hiện "người" tại (12,4) — độ tin cậy 12% (đó là cái cột)'],
  ['DEBUG', 'DRONE_PID: I-term bão hòa, drone đang drift sang phải 0.4m/s'],
  ['WARN', 'BMS: Cell 3 pin LiPo sưng phồng — khuyến nghị cầu nguyện'],
  ['INFO', 'CAN-FD: Mất gói tin khớp gối #7, retry lần thứ 19'],
  ['ERR', 'IMU: Gyro drift 40°/s — tin cảm biến hay tin số phận?'],
  ['INFO', 'FMS: AGV-01 xin cấp đường — từ chối (đang bận đâm tủ)'],
  ['DEBUG', 'BUCK_48V: Ripple 240mVpp — chấp nhận được, không ai chết cả'],
  ['WARN', 'OAK-1: NPU 82°C, giảm xung nhịp AI xuống mức "lười"'],
  ['INFO', 'WATCHDOG: Reset lần thứ 47 trong ngày — mọi thứ vẫn "ổn"'],
  ['ERR', 'MAVLINK: Mất trạm mặt đất — drone đang tự quyết định số phận'],
  ['DEBUG', 'CNC_QUEUE: leg_v19_final_FINAL2.step chờ duyệt từ 3 tháng trước'],
  ['INFO', 'DUST_SENSOR: PM2.5 vượt ngưỡng — cảm biến xin nghỉ phép'],
  ['WARN', 'OPTICAL_FLOW: Mặt đất quá tối để nhìn — giống tương lai dự án'],
  ['INFO', 'ENCODER_L: 1024 xung/vòng, đếm được 12 — encoder đang nói dối'],
  ['DEBUG', 'DS18B20: Mỏ hàn 380°C — quạt tự bật, lá phổi tạm an toàn'],
  ['WARN', 'BTS7960: Tản nhiệt 94°C — có thể nướng bánh mì trực tiếp'],
  ['ERR', 'STACK_OVERFLOW: Đệ quy hàm fixBug() gọi chính nó 8192 lần'],
  ['ERR', 'SLAM: Mất định vị — AMR xoay vòng trầm cảm lần thứ 8 trong giờ'],
  ['WARN', 'LIDAR: Frame mất 340ms — cảm biến đang ngắm cảnh hay đã chết?'],
  ['INFO', 'NAV2: Occupancy grid 512x512 rebuild xong — AMR vẫn không biết mình ở đâu'],
  ['DEBUG', 'SWERVE: Pod #2 góc lái lệch 12° — xe đang đi ngang kiểu cua'],
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
