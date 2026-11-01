import { useEffect, useRef, useState } from 'react';
import { MdGraphicEq, MdMusicNote, MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import { labAudio, type AudioSnapshot, type MusicStation } from '../audio/labAudio';

const STATIONS: { id: MusicStation; short: string; label: string; desc: string }[] = [
  { id: 'synthwave', short: 'SYNTH', label: 'CYBER BUNKER', desc: 'Dark Synthwave · 92 BPM' },
  { id: 'lofi', short: 'LO-FI', label: '2AM LO-FI DEBUG', desc: 'Rhodes & Chill Beats · 76 BPM' },
  { id: 'ambient', short: 'AMBIENT', label: 'DARK REACTOR', desc: 'Sci-Fi Drone không lời' },
  { id: 'off', short: 'SFX ONLY', label: 'CHỈ TIẾNG MÁY 3D', desc: 'Tắt nhạc, giữ tiếng Drone & AMR' },
];

export function AudioDeck() {
  const [snap, setSnap] = useState<AudioSnapshot>(() => labAudio.getSnapshot());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => labAudio.subscribe(setSnap), []);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onDocDown);
    return () => window.removeEventListener('pointerdown', onDocDown);
  }, [open]);

  const active = snap.unlocked && !snap.muted;
  const curStation = STATIONS.find((s) => s.id === snap.station) ?? STATIONS[0];

  return (
    <div ref={wrapRef} className="relative flex items-stretch">
      <div className="hud-panel flex items-center divide-x divide-holo/20 font-mono text-[10px]">
        {/* Nút bật/tắt tiếng nhanh */}
        <button
          onClick={() => labAudio.toggleMute()}
          className={`flex items-center gap-1.5 px-2.5 py-2 transition-colors ${
            snap.muted
              ? 'text-holo/45 hover:text-holo/80'
              : active
                ? 'text-emerald-300 hover:bg-holo/10'
                : 'text-amber-glow animate-pulse hover:bg-holo/10'
          }`}
          title={snap.muted ? 'Bật lại âm thanh phòng lab' : 'Tắt tiếng nhanh'}
        >
          {snap.muted ? (
            <MdVolumeOff className="text-[14px]" />
          ) : (
            <MdVolumeUp className="text-[14px]" />
          )}
          {/* Equalizer mini sống động khi đang phát */}
          <span className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-[2px] rounded-full transition-all ${
                  active ? 'bg-holo' : 'bg-holo/30'
                }`}
                style={{
                  height: active ? undefined : '3px',
                  animation: active ? `eqBounce ${0.55 + i * 0.14}s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
                }}
              />
            ))}
          </span>
        </button>

        {/* Nút mở bảng chọn nhạc & mixer 3D */}
        <button
          onClick={() => {
            labAudio.ensureStarted();
            setOpen((v) => !v);
          }}
          className={`px-2.5 py-2 transition-colors hover:bg-holo/10 ${
            open ? 'bg-holo/15 text-holo' : 'text-holo/85'
          }`}
          title="Chỉnh nhạc nền & âm lượng động cơ 3D (Drone / AMR)"
        >
          {!snap.unlocked && !snap.muted ? 'BẬT ÂM' : curStation.short} ▾
        </button>
      </div>

      {open && (
        <div className="hud-panel absolute right-0 top-full z-50 mt-2 w-72 p-3 font-mono text-[10px] shadow-2xl">
          <div className="mb-2 flex items-center justify-between border-b border-holo/20 pb-1.5">
            <span className="hud-title flex items-center gap-1.5 text-[11px] font-bold text-holo">
              <MdGraphicEq className="text-[14px]" /> LAB AUDIO MIXER
            </span>
            <span className={active ? 'text-[9px] text-emerald-300' : 'text-[9px] text-holo/50'}>
              {snap.muted ? 'ĐANG TẮT TIẾNG' : '3D HRTF • ON'}
            </span>
          </div>

          {/* Chọn đài nhạc nền */}
          <div className="mb-2.5 space-y-1">
            <div className="text-[9px] tracking-wider text-holo/60">KÊNH NHẠC PHÒNG LAB</div>
            {STATIONS.map((st) => {
              const sel = snap.station === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => labAudio.setStation(st.id)}
                  className={`flex w-full items-center justify-between border px-2.5 py-1.5 text-left transition-colors ${
                    sel
                      ? 'border-holo bg-holo/15 text-holo'
                      : 'border-holo/20 bg-void/50 text-holo/75 hover:border-holo/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1 font-bold">
                      <MdMusicNote className="text-[11px]" /> {st.label}
                    </div>
                    <div className="text-[8px] text-holo/55">{st.desc}</div>
                  </div>
                  {sel && <span className="text-[9px] text-emerald-300">●</span>}
                </button>
              );
            })}
          </div>

          {/* Thanh trượt âm lượng Nhạc nền */}
          <div className="mb-2.5">
            <div className="mb-1 flex justify-between text-[9px]">
              <span className="text-holo/75">NHẠC NỀN (BGM)</span>
              <span className="text-holo">{Math.round(snap.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(snap.bgmVolume * 100)}
              onChange={(e) => labAudio.setBgmVolume(Number(e.target.value) / 100)}
              className="h-1.5 w-full cursor-pointer accent-[#2ee6ff]"
            />
          </div>

          {/* Thanh trượt âm lượng Máy móc 3D */}
          <div className="mb-2">
            <div className="mb-1 flex justify-between text-[9px]">
              <span className="text-holo/75">ĐỘNG CƠ 3D (DRONE · AMR · LAB)</span>
              <span className="text-amber-glow">{Math.round(snap.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(snap.sfxVolume * 100)}
              onChange={(e) => labAudio.setSfxVolume(Number(e.target.value) / 100)}
              className="h-1.5 w-full cursor-pointer accent-[#ffb02e]"
            />
          </div>

          <div className="border-t border-holo/15 pt-1.5 text-[8px] leading-relaxed text-holo/55">
            Âm thanh 3D tự động định hướng trái/phải &amp; to nhỏ theo khoảng cách tới Drone, AMR đang chạy, quạt hút khói và AGV.
          </div>
        </div>
      )}
    </div>
  );
}

