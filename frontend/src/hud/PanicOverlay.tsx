import { useMemo } from 'react';
import { useLabStore } from '../store/labStore';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROWS = 28;

const BORING_HEADERS = ['TASK_ID', 'MODULE', 'STATUS', 'OWNER', 'SPRINT', 'EST_H', 'ACT_H', 'NOTE'];
const BORING_FILL = [
  ['PLC-1042', 'Conveyor_Interlock', 'REVIEW', 'D.Bui', 'S14', '6', '11', 're-tune VFD'],
  ['PLC-1057', 'Andon_Signal_Tower', 'DONE', 'D.Bui', 'S13', '4', '4', 'OK'],
  ['SCM-2201', 'Vendor_BOM_sync', 'BLOCKED', 'Purchasing', 'S14', '2', '9', 'waiting quote'],
  ['QMS-0876', 'Calibration_Log', 'WIP', 'QA', 'S14', '8', '5', 'ISO audit prep'],
  ['PLC-1103', 'E_Stop_Chain_Test', 'WIP', 'D.Bui', 'S15', '3', '7', 'cat-3 wiring'],
];

/** Fake ultra-boring corporate screen for when the boss / spouse approaches. */
export function PanicOverlay() {
  const panic = useLabStore((s) => s.panicMode);
  const togglePanic = useLabStore((s) => s.togglePanic);

  const rows = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, r) =>
        BORING_FILL[r % BORING_FILL.length].map((c, i) => (i === 5 || i === 6 ? String((+c + r * 3) % 14) : c))
      ),
    []
  );

  if (!panic) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f141a] font-mono text-[11px] text-[#c8d4dc]">
      {/* fake title bar */}
      <div className="flex items-center justify-between border-b border-[#2a3540] bg-[#161d26] px-3 py-1.5">
        <span className="text-[#8fa3b5]">PLC_Inventory_Tracker_v14_FINAL(2).xlsx — Cognition Industrial Suite</span>
        <span className="text-[#5a6a78]">— □ ✕</span>
      </div>
      {/* fake toolbar */}
      <div className="flex gap-4 border-b border-[#2a3540] bg-[#131a22] px-3 py-1 text-[#7d93a5]">
        <span>File</span><span>Home</span><span>Insert</span><span>Data</span><span>Review</span><span className="ml-auto text-[#4a5a68]">🔍 Search (Alt+Q)</span>
      </div>
      {/* spreadsheet */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="panic-cell w-8 bg-[#1a2430] text-[#5a7080]" />
            {COLS.map((c) => (
              <th key={c} className="panic-cell bg-[#1a2430] text-center font-normal text-[#7d93a5]">{c}</th>
            ))}
          </tr>
          <tr>
            <td className="panic-cell bg-[#1a2430] text-center text-[#5a7080]">1</td>
            {BORING_HEADERS.map((h) => (
              <td key={h} className="panic-cell bg-[#e8f0e8] font-bold !text-[#1a2733]">{h}</td>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[#f4f7f9]">
          {rows.map((cells, r) => (
            <tr key={r}>
              <td className="panic-cell bg-[#1a2430] text-center text-[#5a7080]">{r + 2}</td>
              {cells.map((c, i) => (
                <td key={i} className="panic-cell">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* escape hatch */}
      <button
        onClick={togglePanic}
        className="fixed bottom-4 right-4 border border-[#3a4a58] bg-[#1a2430] px-3 py-1.5 font-mono text-[10px] text-[#7d93a5] hover:text-white"
      >
        ← nguy hiểm đã qua, quay lại hầm
      </button>
    </div>
  );
}
