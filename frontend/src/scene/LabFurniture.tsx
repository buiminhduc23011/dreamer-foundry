import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getEsdMatTexture,
  getIdeMonitorTexture,
  getOscilloscopeScreenTexture,
  getPegboardTexture,
  getPowerSupplyFaceTexture,
  getPrinterScreenTexture,
  getScadaMonitorTexture,
  getWhiteboardTexture,
} from './labTextures';

/* ================================================================== */
/* 1. GHẾ XOAY KỸ THUẬT & GHẾ CÔNG THÁI HỌC DEV (Lab & Dev Chairs)     */
/* ================================================================== */

interface LabChairProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  hasBackrest?: boolean;
  executive?: boolean;
}

export function LabChair({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  hasBackrest = true,
  executive = false,
}: LabChairProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Chụp trung tâm chân sao 5 cánh đúc hợp kim */}
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.048, 0.058, 0.05, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Chân sao 5 cánh vát cạnh + càng bánh xe kép xoay 360 */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        const r = executive ? 0.32 : 0.28;
        return (
          <group key={i}>
            <mesh
              position={[Math.cos(a) * (r * 0.5), 0.052, Math.sin(a) * (r * 0.5)]}
              rotation={[0, -a, -0.06]}
            >
              <boxGeometry args={[r, 0.024, 0.034]} />
              <meshStandardMaterial color="#273444" metalness={0.82} roughness={0.28} />
            </mesh>
            {/* Càng giữ bánh xe + bánh xe kép PU */}
            <group position={[Math.cos(a) * r, 0.024, Math.sin(a) * r]}>
              <mesh position={[0, 0.014, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 0.02, 10]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, a]}>
                <cylinderGeometry args={[0.024, 0.024, 0.026, 14]} />
                <meshStandardMaterial color="#090d12" roughness={0.65} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Ben hơi thủy lực mạ chrome + ống bọc chống bụi */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.022, 0.025, 0.42, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.14} />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <cylinderGeometry args={[0.034, 0.038, 0.19, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.55} />
      </mesh>

      {/* Vòng gác chân mạ chrome (cho ghế kỹ thuật lab) */}
      {!executive && (
        <>
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.185, 0.011, 10, 32]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
          </mesh>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.09, 0.2, Math.sin(a) * 0.09]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.18, 0.009, 0.012]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
              </mesh>
            );
          })}
        </>
      )}

      {/* Bệ cơ cấu ngả lưng + cần gạt nâng hạ dưới mâm ghế */}
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.18, 0.045, 0.18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.14, 0.435, 0.04]} rotation={[0, 0.2, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.14, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 0.435, 0.05]}>
        <boxGeometry args={[0.035, 0.012, 0.025]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>

      {/* Đệm ngồi đúc công thái học */}
      {executive ? (
        <group position={[0, 0.485, 0.01]}>
          <mesh>
            <boxGeometry args={[0.48, 0.068, 0.46]} />
            <meshStandardMaterial color="#182230" roughness={0.68} />
          </mesh>
          {/* Mép vát đùi phía trước */}
          <mesh position={[0, -0.004, 0.23]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.032, 0.032, 0.48, 14]} />
            <meshStandardMaterial color="#182230" roughness={0.68} />
          </mesh>
          {/* 2 Tay vịn chữ T 3D Armrests */}
          {[-0.265, 0.265].map((ax, i) => (
            <group key={i} position={[ax, 0.11, -0.02]}>
              <mesh position={[0, -0.04, 0]}>
                <boxGeometry args={[0.028, 0.18, 0.045]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.055, 0.02]}>
                <boxGeometry args={[0.075, 0.024, 0.24]} />
                <meshStandardMaterial color="#0f172a" roughness={0.45} />
              </mesh>
            </group>
          ))}
        </group>
      ) : (
        <group position={[0, 0.485, 0]}>
          <mesh>
            <cylinderGeometry args={[0.215, 0.205, 0.068, 32]} />
            <meshStandardMaterial color="#1a2433" roughness={0.62} />
          </mesh>
          <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.208, 0.012, 10, 32]} />
            <meshStandardMaterial color="#253346" roughness={0.55} />
          </mesh>
        </group>
      )}

      {/* Tựa lưng công thái học + đệm thắt lưng Lumbar + tựa đầu (Executive) */}
      {hasBackrest && (
        <group position={[0, 0.48, executive ? -0.22 : -0.19]}>
          {/* Cột sống thép đỡ lưng */}
          <mesh position={[0, executive ? 0.24 : 0.16, -0.035]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[0.048, executive ? 0.48 : 0.32, 0.024]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Khung lưng lưới */}
          <mesh position={[0, executive ? 0.34 : 0.25, 0.005]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[executive ? 0.44 : 0.34, executive ? 0.48 : 0.24, 0.032]} />
            <meshStandardMaterial color="#0f172a" roughness={0.78} />
          </mesh>
          {/* Đệm đỡ cột sống thắt lưng Lumbar bar */}
          <mesh position={[0, 0.19, 0.022]}>
            <boxGeometry args={[executive ? 0.38 : 0.28, 0.06, 0.024]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          {/* Tựa đầu Headrest cho ghế Dev */}
          {executive && (
            <group position={[0, 0.65, -0.02]}>
              <mesh position={[0, -0.04, -0.01]}>
                <boxGeometry args={[0.04, 0.09, 0.02]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh rotation={[0.12, 0, 0]}>
                <boxGeometry args={[0.26, 0.12, 0.045]} />
                <meshStandardMaterial color="#16202e" roughness={0.65} />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
}

/* ================================================================== */
/* 2. THIẾT BỊ ĐO LƯỜNG CHI TIẾT TRÊN BÀN LAB (Detailed Bench Gear)    */
/* ================================================================== */

/** Bộ nguồn DC đa năng 2 kênh hiển thị LED 7 đoạn sắc nét + núm vặn + dây chuối */
function BenchPowerSupply({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const faceTex = useMemo(() => getPowerSupplyFaceTexture(), []);
  return (
    <group position={position}>
      {/* Vỏ thép sơn tĩnh điện + khe tản nhiệt hai bên */}
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[0.25, 0.16, 0.29]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.42} />
      </mesh>
      {/* Viền bezel nhựa đen phía trước */}
      <mesh position={[0, 0.085, 0.146]}>
        <boxGeometry args={[0.254, 0.164, 0.01]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* Mặt hiển thị 7-segment CanvasTexture phát sáng */}
      <mesh position={[0, 0.092, 0.152]}>
        <planeGeometry args={[0.236, 0.132]} />
        <meshBasicMaterial map={faceTex} />
      </mesh>

      {/* 4 Núm xoay Coarse / Fine cho 2 kênh */}
      {[-0.085, -0.032, 0.035, 0.088].map((x, i) => (
        <group key={i} position={[x, 0.042, 0.156]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.014, 0.016, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.006, 0.009]}>
            <boxGeometry args={[0.002, 0.008, 0.003]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}

      {/* Cọc đấu nguồn chuối (Binding Posts: Đỏ/Đen/Xanh lá x2) */}
      {[-0.085, -0.055, -0.025, 0.035, 0.065, 0.095].map((x, i) => {
        const col = i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#090d14' : '#22c55e';
        return (
          <mesh key={i} position={[x, 0.018, 0.158]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0065, 0.0065, 0.018, 12]} />
            <meshStandardMaterial color={col} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Máy hiện sóng kỹ thuật số 4 kênh Rigol/Keysight style với sóng thực trên màn hình */
function Oscilloscope({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const screenTex = useMemo(() => getOscilloscopeScreenTexture(), []);
  return (
    <group position={position}>
      {/* Thân máy vát cạnh công nghiệp */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.36, 0.21, 0.18]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.25} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.11, 0.091]}>
        <boxGeometry args={[0.352, 0.202, 0.008]} />
        <meshStandardMaterial color="#1e293b" roughness={0.55} />
      </mesh>
      {/* Chân chống nghiêng dưới đáy + quai xách trên đỉnh */}
      <mesh position={[0, 0.222, -0.01]}>
        <boxGeometry args={[0.22, 0.018, 0.035]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Màn hình LCD TFT hiển thị lưới sóng graticule sắc nét */}
      <mesh position={[-0.052, 0.118, 0.096]}>
        <planeGeometry args={[0.215, 0.145]} />
        <meshBasicMaterial map={screenTex} />
      </mesh>

      {/* Ma trận núm xoay Vertical / Horizontal / Trigger bên phải màn hình */}
      {[
        [0.088, 0.165],
        [0.132, 0.165],
        [0.088, 0.12],
        [0.132, 0.12],
        [0.088, 0.075],
        [0.132, 0.075],
      ].map(([kx, ky], i) => (
        <mesh key={i} position={[kx, ky, 0.102]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.011, 0.012, 0.014, 14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* 4 Cổng đo BNC mạ bạc CH1..CH4 kèm vòng màu nhận diện */}
      {[-0.12, -0.07, -0.02, 0.03].map((bx, idx) => {
        const ringCol = idx === 0 ? '#eab308' : idx === 1 ? '#06b6d4' : idx === 2 ? '#ec4899' : '#3b82f6';
        return (
          <group key={idx} position={[bx, 0.026, 0.098]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.005, 12]} />
              <meshBasicMaterial color={ringCol} />
            </mesh>
            <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.016, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Trạm hàn thiếc Hakko FX-888D xanh-vàng + cốc bùi nhùi đồng + giá mỏ hàn + cuộn chì */
function SolderingStation({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Thân máy Hakko xanh lam + mặt nạ vàng đặc trưng */}
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.115, 0.105, 0.145]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.055, 0.074]}>
        <boxGeometry args={[0.105, 0.095, 0.006]} />
        <meshStandardMaterial color="#eab308" roughness={0.45} />
      </mesh>
      {/* Màn hình LED đỏ nhiệt độ 380°C */}
      <mesh position={[0, 0.078, 0.078]}>
        <planeGeometry args={[0.058, 0.024]} />
        <meshBasicMaterial color="#090d14" />
      </mesh>
      <mesh position={[0, 0.078, 0.079]}>
        <planeGeometry args={[0.044, 0.014]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Núm chỉnh nhiệt */}
      <mesh position={[0, 0.036, 0.082]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.012, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* Đế gác mỏ hàn kim loại đúc + cốc bùi nhùi đồng vàng */}
      <group position={[0.125, 0, 0.02]}>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.085, 0.035, 0.13]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Bùi nhùi đồng chùi mũi hàn */}
        <mesh position={[0, 0.038, 0.032]}>
          <cylinderGeometry args={[0.026, 0.022, 0.018, 14]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.45} />
        </mesh>
        {/* Ống gác mỏ hàn nghiêng + tay hàn cắm sẵn */}
        <group position={[0, 0.05, -0.02]} rotation={[-0.55, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.016, 0.02, 0.09, 14, 1, true]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.009, 0.007, 0.13, 12]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Giá đỡ cuộn thiếc hàn hợp kim Sn63/Pb37 */}
      <group position={[-0.11, 0.042, 0.01]}>
        <mesh position={[0, -0.034, 0]}>
          <boxGeometry args={[0.075, 0.012, 0.09]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.032, 0.032, 0.038, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.22} />
        </mesh>
        {[-0.02, 0.02].map((fx, i) => (
          <mesh key={i} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.038, 0.004, 20]} />
            <meshStandardMaterial color="#16a34a" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Đồng hồ vạn năng Fluke 87V đặt nghiêng trên mặt bàn ESD */
function FlukeMultimeter({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Vỏ cao su chống sốc màu vàng đặc trưng của Fluke */}
      <mesh position={[0, 0.022, 0]}>
        <boxGeometry args={[0.095, 0.038, 0.185]} />
        <meshStandardMaterial color="#eab308" roughness={0.55} />
      </mesh>
      {/* Mặt thân xám đen bên trong */}
      <mesh position={[0, 0.042, 0]}>
        <boxGeometry args={[0.082, 0.004, 0.168]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      {/* Màn hình tinh thể lỏng xám xanh */}
      <mesh position={[0, 0.045, -0.045]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.066, 0.042]} />
        <meshBasicMaterial color="#9ca38f" />
      </mesh>
      {/* Núm xoay chọn thang đo */}
      <mesh position={[0, 0.048, 0.012]}>
        <cylinderGeometry args={[0.022, 0.024, 0.01, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      {/* 4 Lỗ cắm que đo Đỏ / Đen */}
      {[-0.026, -0.009, 0.009, 0.026].map((jx, i) => (
        <mesh key={i} position={[jx, 0.045, 0.062]}>
          <cylinderGeometry args={[0.005, 0.005, 0.006, 10]} />
          <meshStandardMaterial color={i === 2 ? '#090d14' : '#dc2626'} />
        </mesh>
      ))}
    </group>
  );
}

/** Dụng cụ cơ khí & điện tử treo trên bảng lỗ Pegboard sau bàn lab */
function PegboardTools({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const pegTex = useMemo(() => getPegboardTexture(), []);
  return (
    <group position={position}>
      {/* Tấm thép đục lỗ Pegboard */}
      <mesh>
        <boxGeometry args={[1.88, 0.46, 0.014]} />
        <meshStandardMaterial map={pegTex} metalness={0.55} roughness={0.48} />
      </mesh>

      {/* Bộ 4 cờ-lê vòng miệng mạ chrome treo từ lớn đến nhỏ */}
      {[-0.74, -0.66, -0.59, -0.53].map((wx, i) => {
        const len = 0.21 - i * 0.025;
        return (
          <group key={`wrench-${i}`} position={[wx, 0.04, 0.016]}>
            <mesh>
              <boxGeometry args={[0.016 - i * 0.0015, len, 0.005]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
            </mesh>
            <mesh position={[0, len / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.015 - i * 0.0015, 0.004, 8, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        );
      })}

      {/* 3 Tua-vít cán đỏ/vàng cách điện */}
      {[-0.36, -0.29, -0.22].map((sx, i) => (
        <group key={`sd-${i}`} position={[sx, 0.05, 0.018]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.012, 0.01, 0.09, 10]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#dc2626' : '#eab308'} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.12, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Kìm cắt chân linh kiện & Kìm nhọn cán bọc cao su */}
      {[0.32, 0.44].map((px, i) => (
        <group key={`plier-${i}`} position={[px, 0.04, 0.018]}>
          <mesh position={[-0.014, -0.03, 0]} rotation={[0, 0, 0.14]}>
            <cylinderGeometry args={[0.006, 0.005, 0.11, 8]} />
            <meshStandardMaterial color={i === 0 ? '#0284c7' : '#ef4444'} roughness={0.5} />
          </mesh>
          <mesh position={[0.014, -0.03, 0]} rotation={[0, 0, -0.14]}>
            <cylinderGeometry args={[0.006, 0.005, 0.11, 8]} />
            <meshStandardMaterial color={i === 0 ? '#0284c7' : '#ef4444'} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.026, 0.045, 0.008]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Cuộn băng dính điện đen & băng dính chịu nhiệt Kapton vàng hổ phách */}
      <mesh position={[0.64, 0.05, 0.025]}>
        <torusGeometry args={[0.038, 0.012, 12, 24]} />
        <meshStandardMaterial color="#090d14" roughness={0.7} />
      </mesh>
      <mesh position={[0.76, 0.05, 0.025]}>
        <torusGeometry args={[0.036, 0.01, 12, 24]} />
        <meshStandardMaterial color="#d97706" metalness={0.3} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** Đèn kẹp bàn kỹ thuật khớp lò xo rọi xuống mặt bàn (Task Lamp) */
function ArticulatedTaskLamp({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.05, 0.07, 0.05]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>
      <group position={[0, 0.08, 0]} rotation={[0.38, 0.32, 0]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.44, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.032, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <group position={[0, 0.44, 0]} rotation={[-1.08, 0, 0]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.36, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
          </mesh>
          <group position={[0, 0.36, 0]} rotation={[0.82, 0, 0]}>
            <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.085, 0.11, 18, 1, true]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <pointLight position={[0, 0.0, 0]} color="#fff7ed" intensity={3.2} distance={2.8} decay={1.8} />
          </group>
        </group>
      </group>
    </group>
  );
}

/** Khay hộp nhựa phân loại linh kiện (Parts Bins) có chứa linh kiện bên trong */
function ComponentBinsRow({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const colors = ['#dc2626', '#2563eb', '#ca8a04', '#16a34a'];
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <group key={i} position={[(i - 1.5) * 0.105, 0.032, 0]}>
          <mesh>
            <boxGeometry args={[0.092, 0.06, 0.145]} />
            <meshStandardMaterial color={c} roughness={0.52} />
          </mesh>
          <mesh position={[0, 0.018, 0.012]}>
            <boxGeometry args={[0.076, 0.03, 0.11]} />
            <meshStandardMaterial color="#0f172a" roughness={0.75} />
          </mesh>
          {/* Nhãn trắng dán trước hộp */}
          <mesh position={[0, -0.006, 0.074]}>
            <planeGeometry args={[0.055, 0.02]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ================================================================== */
/* 3. BÀN THAO TÁC KỸ THUẬT R&D HOÀN CHỈNH (Ultra-Detailed Workbench)   */
/* ================================================================== */

interface LabWorkbenchProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  esdColor?: string;
  hasChair?: boolean;
  chairOffset?: [number, number, number];
  chairRotation?: [number, number, number];
  children?: React.ReactNode;
}

export function LabWorkbench({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  esdColor = '#164e63',
  hasChair = true,
  chairOffset = [-0.25, 0, 0.98],
  chairRotation = [0, 0.22, 0],
  children,
}: LabWorkbenchProps) {
  const W = 2.5;  // Rộng 2.5m
  const D = 1.28; // Sâu 1.28m
  const H = 0.72; // Cao mặt bàn chuẩn vật lý 0.72m từ mặt sàn y=0
  const esdTex = useMemo(() => getEsdMatTexture(esdColor), [esdColor]);

  return (
    <group position={position} rotation={rotation}>
      {/* 4 Chân thép hộp công nghiệp dày 55x55mm chạm đất 100% (y=0 -> y=0.72) */}
      {[
        [-W / 2 + 0.09, -D / 2 + 0.09],
        [W / 2 - 0.09, -D / 2 + 0.09],
        [-W / 2 + 0.09, D / 2 - 0.09],
        [W / 2 - 0.09, D / 2 - 0.09],
      ].map(([x, z], i) => (
        <group key={i} position={[x, H / 2, z]}>
          <mesh>
            <boxGeometry args={[0.058, H, 0.058]} />
            <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.38} />
          </mesh>
          {/* Đế cao su chống rung sát sàn y=0 */}
          <mesh position={[0, -H / 2 + 0.015, 0]}>
            <cylinderGeometry args={[0.045, 0.05, 0.03, 16]} />
            <meshStandardMaterial color="#090d14" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Khung dầm thép chịu tải dưới mặt bàn + thanh gác chân ngang */}
      <mesh position={[0, H - 0.035, 0]}>
        <boxGeometry args={[W - 0.14, 0.048, D - 0.14]} />
        <meshStandardMaterial color="#111827" metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[-0.35, 0.16, 0.05]}>
        <boxGeometry args={[W * 0.58, 0.034, 0.034]} />
        <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.4} />
      </mesh>
      {[-D / 2 + 0.09, D / 2 - 0.09].map((z, idx) => (
        <mesh key={`side-brace-${idx}`} position={[0, 0.16, z]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.034, 0.034, 0.034]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}

      {/* HỘC TỦ SẮT 3 NGĂN KÉO (Under-Bench Drawer Cabinet) bên phải gầm bàn */}
      <group position={[W / 2 - 0.42, 0.41, 0.02]}>
        <mesh>
          <boxGeometry args={[0.56, 0.54, D - 0.24]} />
          <meshStandardMaterial color="#182230" metalness={0.65} roughness={0.45} />
        </mesh>
        {[0.16, 0.0, -0.16].map((dy, di) => (
          <group key={di} position={[0, dy, (D - 0.24) / 2 + 0.008]}>
            <mesh>
              <boxGeometry args={[0.52, 0.145, 0.014]} />
              <meshStandardMaterial color="#253346" metalness={0.6} roughness={0.42} />
            </mesh>
            {/* Tay nắm nhôm anod ngang */}
            <mesh position={[0, 0.02, 0.015]}>
              <boxGeometry args={[0.24, 0.016, 0.018]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Nhãn tên ngăn kéo (M3 Screws / Sensors / Probes) */}
            <mesh position={[-0.17, 0.045, 0.009]}>
              <planeGeometry args={[0.09, 0.022]} />
              <meshBasicMaterial color="#e2e8f0" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Mặt bàn gỗ công nghiệp dày 45mm bo viền kim loại */}
      <mesh position={[0, H, 0]}>
        <boxGeometry args={[W, 0.048, D]} />
        <meshStandardMaterial color="#3b2f26" roughness={0.58} metalness={0.08} />
      </mesh>
      <mesh position={[0, H, D / 2 + 0.002]}>
        <boxGeometry args={[W, 0.048, 0.006]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Thảm cao su chống tĩnh điện ESD có in vạch chia thước & logo ESD */}
      <mesh position={[0, H + 0.026, 0.04]}>
        <boxGeometry args={[W - 0.1, 0.005, D - 0.12]} />
        <meshStandardMaterial map={esdTex} roughness={0.68} metalness={0.08} />
      </mesh>
      {/* Nút cúc bấm dây đeo cổ tay tiếp địa màu vàng */}
      <mesh position={[W / 2 - 0.12, H + 0.03, D / 2 - 0.1]}>
        <cylinderGeometry args={[0.014, 0.014, 0.006, 12]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 2 Cột khung thép sau bàn + Tấm lỗ treo dụng cụ Pegboard + Kệ máy đo tầng trên */}
      {[-W / 2 + 0.2, W / 2 - 0.2].map((x, i) => (
        <mesh key={i} position={[x, H + 0.45, -D / 2 + 0.12]}>
          <boxGeometry args={[0.045, 0.88, 0.045]} />
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.3} />
        </mesh>
      ))}
      <PegboardTools position={[0, H + 0.31, -D / 2 + 0.12]} />

      {/* Máng đèn tuýp LED công nghiệp gắn dưới đáy kệ tầng trên rọi sáng mặt bàn */}
      <mesh position={[0, H + 0.62, -D / 2 + 0.28]}>
        <boxGeometry args={[1.65, 0.018, 0.045]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <pointLight position={[0, H + 0.56, -0.15]} color="#e0f2fe" intensity={2.2} distance={2.9} decay={2} />

      {/* Kệ để thiết bị đo lường tầng trên (Instrument Riser Shelf) */}
      <mesh position={[0, H + 0.64, -D / 2 + 0.22]}>
        <boxGeometry args={[W - 0.16, 0.03, 0.42]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.4} />
      </mesh>

      {/* DÀN MÁY ĐO ĐẠC TRÊN KỆ TẦNG TRÊN */}
      <BenchPowerSupply position={[-0.78, H + 0.655, -D / 2 + 0.24]} />
      <Oscilloscope position={[-0.26, H + 0.655, -D / 2 + 0.24]} />
      <ComponentBinsRow position={[0.32, H + 0.655, -D / 2 + 0.24]} />
      <SolderingStation position={[0.82, H + 0.655, -D / 2 + 0.24]} />

      {/* Đèn bàn kỹ thuật góc trái bàn */}
      <ArticulatedTaskLamp position={[-W / 2 + 0.12, H + 0.025, -D / 2 + 0.26]} />

      {/* ĐỒ ĐẠC ĐẶT QUANH MÉP BÀN (chừa trống vùng giữa cho mô hình chính) */}
      {/* Trái: Đồng hồ vạn năng Fluke 87V + Bo mạch PCB xanh lá + Breadboard trắng */}
      <FlukeMultimeter position={[-W / 2 + 0.24, H + 0.028, 0.26]} rotation={[0, 0.28, 0]} />
      <group position={[-W / 2 + 0.26, H + 0.032, -0.05]} rotation={[0, -0.18, 0]}>
        <mesh>
          <boxGeometry args={[0.14, 0.004, 0.1]} />
          <meshStandardMaterial color="#15803d" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[0.04, 0.01, 0.025]} />
          <meshStandardMaterial color="#090d14" roughness={0.4} />
        </mesh>
      </group>

      {/* Phải: Ổ cắm kéo dài công nghiệp 6 lỗ + Cốc sứ cà phê */}
      <group position={[W / 2 - 0.18, H + 0.042, -0.12]} rotation={[0, -0.08, 0]}>
        <mesh>
          <boxGeometry args={[0.075, 0.032, 0.32]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.018, 0.12]}>
          <boxGeometry args={[0.022, 0.006, 0.032]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Cục nguồn Adapter đen cắm trên ổ */}
        <mesh position={[0, 0.04, -0.05]}>
          <boxGeometry args={[0.048, 0.055, 0.068]} />
          <meshStandardMaterial color="#090d14" roughness={0.5} />
        </mesh>
      </group>
      <group position={[W / 2 - 0.22, H + 0.07, 0.34]}>
        <mesh>
          <cylinderGeometry args={[0.038, 0.034, 0.085, 18]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.033, 16]} />
          <meshBasicMaterial color="#29180d" />
        </mesh>
      </group>

      {/* Ghế xoay kỹ thuật đặt trước bàn (chân ghế chạm sàn y=0) */}
      {hasChair && (
        <LabChair
          position={chairOffset}
          rotation={chairRotation}
          scale={1.04}
          hasBackrest={true}
        />
      )}

      {/* Nhóm con (nếu truyền trực tiếp vào LabWorkbench) */}
      {children && <group position={[0, H + 0.03, 0.05]}>{children}</group>}
    </group>
  );
}

/* ================================================================== */
/* 4. KHOANG BẢO DƯỠNG XE NÂNG AI (Industrial Vehicle Test Bay)       */
/* ================================================================== */

interface VehicleBayProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  children?: React.ReactNode;
}

export function VehicleBay({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [2.6, 2.8],
  children,
}: VehicleBayProps) {
  const [W, D] = size;
  const ideTex = useMemo(() => getIdeMonitorTexture(), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Sàn thép nhám chống trượt đặt sát nền bê tông */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[W, 0.03, D]} />
        <meshStandardMaterial color="#16202c" metalness={0.72} roughness={0.55} />
      </mesh>

      {/* Viền vạch vàng an toàn công nghiệp 4 cạnh khoang */}
      {[-D / 2 + 0.055, D / 2 - 0.055].map((z, i) => (
        <mesh key={`fb-${i}`} position={[0, 0.032, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W - 0.08, 0.09]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}
      {[-W / 2 + 0.055, W / 2 - 0.055].map((x, i) => (
        <mesh key={`lr-${i}`} position={[x, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.09, D - 0.08]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Con chèn bánh xe cao su vàng (Wheel Chocks) + kích thủy lực đỏ */}
      <mesh position={[-W / 2 + 0.35, 0.075, -0.55]}>
        <cylinderGeometry args={[0.05, 0.065, 0.14, 12]} />
        <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Xe đẩy kỹ thuật 3 tầng + Laptop quân đội Toughbook debug CAN-FD */}
      <group position={[W / 2 + 0.52, 0, 0.22]} rotation={[0, -0.32, 0]}>
        {/* 4 Trụ xe đẩy + 3 tầng khay thép sơn đỏ/đen */}
        {[
          [-0.26, -0.2],
          [0.26, -0.2],
          [-0.26, 0.2],
          [0.26, 0.2],
        ].map(([cx, cz], i) => (
          <mesh key={i} position={[cx, 0.42, cz]}>
            <boxGeometry args={[0.03, 0.8, 0.03]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {[0.12, 0.46, 0.8].map((ty, ti) => (
          <mesh key={ti} position={[0, ty, 0]}>
            <boxGeometry args={[0.58, 0.045, 0.44]} />
            <meshStandardMaterial color="#b91c1c" metalness={0.5} roughness={0.45} />
          </mesh>
        ))}

        {/* Laptop chẩn đoán mở nắp hiển thị code IDE thật */}
        <group position={[0, 0.83, 0.02]}>
          <mesh position={[0, 0.012, 0]}>
            <boxGeometry args={[0.34, 0.022, 0.24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
          </mesh>
          <group position={[0, 0.12, -0.11]} rotation={[0.28, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.34, 0.22, 0.014]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.009]}>
              <planeGeometry args={[0.31, 0.19]} />
              <meshBasicMaterial map={ideTex} />
            </mesh>
          </group>
        </group>

        {/* Ghế kỹ thuật ngồi cạnh xe đẩy */}
        <LabChair position={[0.05, 0, 0.68]} rotation={[0, 0.35, 0]} hasBackrest={true} />
      </group>

      {children && <group position={[0, 0.03, 0]}>{children}</group>}
    </group>
  );
}

/* ================================================================== */
/* 5. BÀN MÁY TÍNH KỸ SƯ LẬP TRÌNH + CASE PC KÍNH (Developer Station)  */
/* ================================================================== */

export function DeveloperStation({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ideTex = useMemo(() => getIdeMonitorTexture(), []);
  const scadaTex = useMemo(() => getScadaMonitorTexture(), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Mặt bàn gỗ óc chó sẫm dày 45mm + khung chân thép hộp chữ U */}
      <mesh position={[0, 0.73, 0]}>
        <boxGeometry args={[2.15, 0.045, 0.96]} />
        <meshStandardMaterial color="#261f1d" roughness={0.52} metalness={0.1} />
      </mesh>
      {[-0.95, 0.95].map((x, i) => (
        <group key={i} position={[x, 0.36, 0]}>
          <mesh position={[0, 0, -0.38]}>
            <boxGeometry args={[0.055, 0.72, 0.055]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.38]}>
            <boxGeometry args={[0.055, 0.72, 0.055]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.34, 0]}>
            <boxGeometry args={[0.055, 0.04, 0.82]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.68, -0.34]}>
        <boxGeometry args={[1.9, 0.05, 0.08]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* CASE WORKSTATION PC FULL-TOWER KÍNH CƯỜNG LỰC BÊN PHẢI BÀN */}
      <group position={[0.78, 0.99, -0.14]} rotation={[0, -0.12, 0]}>
        {/* Khung vỏ thép đen nhám */}
        <mesh>
          <boxGeometry args={[0.23, 0.47, 0.46]} />
          <meshStandardMaterial color="#0b0f17" metalness={0.75} roughness={0.32} />
        </mesh>
        {/* Linh kiện bên trong phát sáng qua hông trái (-X): Mainboard + AIO ring + GPU RTX */}
        <mesh position={[-0.116, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.38, 0.39]} />
          <meshBasicMaterial color="#09131f" />
        </mesh>
        {/* Card đồ họa RTX dày 3 slot có thanh LED xanh cyan */}
        <mesh position={[-0.08, -0.04, 0.02]}>
          <boxGeometry args={[0.06, 0.055, 0.29]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.117, -0.025, 0.02]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.24, 0.014]} />
          <meshBasicMaterial color="#2ee6ff" />
        </mesh>
        {/* Block tản nhiệt nước AIO tròn phát sáng cam/vàng */}
        <mesh position={[-0.117, 0.09, -0.04]} rotation={[0, -Math.PI / 2, 0]}>
          <ringGeometry args={[0.028, 0.038, 24]} />
          <meshBasicMaterial color="#ffb02e" side={THREE.DoubleSide} />
        </mesh>
        {/* 2 Quạt LED RGB mặt lưới trước (+Z) */}
        {[0.09, -0.06].map((fy, fi) => (
          <mesh key={fi} position={[0, fy, 0.232]}>
            <ringGeometry args={[0.048, 0.062, 24]} />
            <meshBasicMaterial color="#2ee6ff" />
          </mesh>
        ))}
      </group>

      {/* Tay nâng màn hình đôi thuỷ lực Gas-Spring Dual Arm */}
      <mesh position={[-0.12, 0.9, -0.38]}>
        <cylinderGeometry args={[0.02, 0.022, 0.34, 14]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
      </mesh>
      {[-0.3, 0.24].map((ax, i) => (
        <mesh key={i} position={[ax, 1.04, -0.34]} rotation={[0, i === 0 ? 0.35 : -0.35, 0]}>
          <boxGeometry args={[0.38, 0.03, 0.03]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* MÀN HÌNH 1 (TRÁI): VS Code + Embedded Firmware Terminal */}
      <group position={[-0.48, 1.09, -0.24]} rotation={[0, 0.2, 0]}>
        <mesh>
          <boxGeometry args={[0.66, 0.4, 0.024]} />
          <meshStandardMaterial color="#0b0f17" metalness={0.7} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.005, 0.013]}>
          <planeGeometry args={[0.635, 0.37]} />
          <meshBasicMaterial map={ideTex} />
        </mesh>
      </group>

      {/* MÀN HÌNH 2 (PHẢI): TIA Portal / PROFINET & Neural Telemetry */}
      <group position={[0.2, 1.09, -0.24]} rotation={[0, -0.18, 0]}>
        <mesh>
          <boxGeometry args={[0.66, 0.4, 0.024]} />
          <meshStandardMaterial color="#0b0f17" metalness={0.7} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.005, 0.013]}>
          <planeGeometry args={[0.635, 0.37]} />
          <meshBasicMaterial map={scadaTex} />
        </mesh>
      </group>

      {/* Thảm lót chuột XXL khâu viền đen */}
      <mesh position={[-0.14, 0.755, 0.16]}>
        <boxGeometry args={[0.92, 0.004, 0.42]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} />
      </mesh>

      {/* Bàn phím cơ Custom 75% nhôm nguyên khối + hàng keycap nổi + nút ESC đỏ */}
      <group position={[-0.24, 0.768, 0.18]}>
        <mesh>
          <boxGeometry args={[0.34, 0.02, 0.135]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.013, 0]}>
          <boxGeometry args={[0.315, 0.008, 0.11]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        <mesh position={[-0.145, 0.015, -0.042]}>
          <boxGeometry args={[0.02, 0.01, 0.02]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0.135, 0.015, 0.01]}>
          <boxGeometry args={[0.036, 0.01, 0.02]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.009, 0]}>
          <boxGeometry args={[0.35, 0.003, 0.145]} />
          <meshBasicMaterial color="#2ee6ff" transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Chuột không dây công thái học */}
      <mesh position={[0.12, 0.768, 0.19]} rotation={[0, -0.08, 0]}>
        <boxGeometry args={[0.068, 0.032, 0.118]} />
        <meshStandardMaterial color="#1e293b" roughness={0.38} />
      </mesh>

      {/* Saleae Logic Analyzer + Bo mạch STM32 Nucleo đang cắm dây nháy đèn */}
      <group position={[-0.76, 0.762, 0.16]} rotation={[0, 0.25, 0]}>
        <mesh>
          <boxGeometry args={[0.065, 0.018, 0.065]} />
          <meshStandardMaterial color="#dc2626" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0.12, -0.004, 0.02]}>
          <boxGeometry args={[0.09, 0.005, 0.07]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
        <mesh position={[0.12, 0.004, 0.02]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      {/* Đèn kẹp bàn + Cốc cà phê */}
      <ArticulatedTaskLamp position={[-0.96, 0.755, -0.32]} />
      <mesh position={[0.42, 0.795, 0.22]}>
        <cylinderGeometry args={[0.04, 0.035, 0.085, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.28} />
      </mesh>

      {/* Ghế công thái học lưng cao có tựa đầu & tay vịn */}
      <LabChair position={[-0.12, 0, 0.82]} rotation={[0, 0.22, 0]} executive={true} hasBackrest={true} />
    </group>
  );
}

/* ================================================================== */
/* 6. TRẠM MÁY IN 3D COREXY CHI TIẾT CAO (CoreXY 3D Printer Station)   */
/* ================================================================== */

export function ThreeDPrinterStation({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const gantryYRef = useRef<THREE.Group>(null);
  const toolheadXRef = useRef<THREE.Group>(null);
  const spoolRef = useRef<THREE.Group>(null);
  const lcdTex = useMemo(() => getPrinterScreenTexture(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Gantry chạy dọc Y (trục Z trong Three) và Toolhead quét ngang X theo quỹ đạo in thực tế
    if (gantryYRef.current) {
      gantryYRef.current.position.z = Math.cos(t * 2.7) * 0.075;
    }
    if (toolheadXRef.current) {
      toolheadXRef.current.position.x = Math.sin(t * 3.9) * 0.085;
    }
    if (spoolRef.current) {
      spoolRef.current.rotation.x = t * 0.35;
    }
  });

  // Kích thước lồng máy in CoreXY Voron 2.4 / Bambu style
  const PW = 0.54;
  const PH = 0.62;
  const PD = 0.54;

  return (
    <group position={position} rotation={rotation}>
      {/* BÀN KỸ THUẬT CHỊU LỰC ĐẶT MÁY IN 3D (chân chạm đất y=0, mặt bàn y=0.76) */}
      <group>
        {[
          [-0.66, -0.36],
          [0.66, -0.36],
          [-0.66, 0.36],
          [0.66, 0.36],
        ].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.38, lz]}>
            <boxGeometry args={[0.05, 0.76, 0.05]} />
            <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.35} />
          </mesh>
        ))}
        {/* Mặt bàn dày chống rung */}
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[1.46, 0.045, 0.84]} />
          <meshStandardMaterial color="#252f3d" roughness={0.55} metalness={0.2} />
        </mesh>
        {/* Kệ tầng dưới chứa hộp chống ẩm Filament Dry-Box & thùng nhựa in */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[1.34, 0.03, 0.72]} />
          <meshStandardMaterial color="#182230" metalness={0.65} roughness={0.45} />
        </mesh>

        {/* Hộp sấy nhựa trong suốt (Filament Dry-Box) ở kệ dưới */}
        <group position={[-0.32, 0.32, 0.04]}>
          <mesh>
            <boxGeometry args={[0.42, 0.25, 0.32]} />
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.32} roughness={0.15} metalness={0.2} />
          </mesh>
          {[-0.1, 0.1].map((sx, si) => (
            <mesh key={si} position={[sx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.095, 0.095, 0.065, 20]} />
              <meshStandardMaterial color={si === 0 ? '#f97316' : '#a855f7'} roughness={0.4} />
            </mesh>
          ))}
        </group>
        {/* Chồng hộp giấy đựng cuộn nhựa PLA+ / PETG-CF */}
        {[0.25, 0.34, 0.43].map((by, bi) => (
          <mesh key={bi} position={[0.3, by, 0]} rotation={[0, bi * 0.06, 0]}>
            <boxGeometry args={[0.24, 0.075, 0.24]} />
            <meshStandardMaterial color={bi === 1 ? '#1e3a5f' : '#78350f'} roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* CỤM MÁY IN 3D COREXY LỒNG KÍNH VORON / BAMBU X1 STYLE     */}
      {/* ========================================================= */}
      <group position={[-0.12, 0.785, 0]}>
        {/* Đế máy (Electronics Skirt Base) + khe thông gió */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[PW + 0.02, 0.09, PD + 0.02]} />
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.38} />
        </mesh>
        {/* 4 Chân cao su giảm chấn màu đỏ Voron */}
        {[
          [-PW / 2 + 0.04, -PD / 2 + 0.04],
          [PW / 2 - 0.04, -PD / 2 + 0.04],
          [-PW / 2 + 0.04, PD / 2 - 0.04],
          [PW / 2 - 0.04, PD / 2 - 0.04],
        ].map(([fx, fz], i) => (
          <mesh key={`foot-${i}`} position={[fx, 0.01, fz]}>
            <cylinderGeometry args={[0.024, 0.026, 0.02, 14]} />
            <meshStandardMaterial color="#dc2626" roughness={0.7} />
          </mesh>
        ))}

        {/* 4 Cột nhôm định hình 2020 đứng + 8 Thanh ngang nóc/đáy + Khớp góc CNC đỏ */}
        {[
          [-PW / 2, -PD / 2],
          [PW / 2, -PD / 2],
          [-PW / 2, PD / 2],
          [PW / 2, PD / 2],
        ].map(([cx, cz], i) => (
          <group key={`col-${i}`}>
            <mesh position={[cx, PH / 2 + 0.06, cz]}>
              <boxGeometry args={[0.024, PH, 0.024]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.28} />
            </mesh>
            {/* Khớp góc CNC nhôm anod đỏ */}
            <mesh position={[cx, PH + 0.06, cz]}>
              <boxGeometry args={[0.03, 0.03, 0.03]} />
              <meshStandardMaterial color="#dc2626" metalness={0.75} roughness={0.3} />
            </mesh>
            {/* Trục trượt tròn & Vít me nâng bàn Z-axis ở 4 góc */}
            <mesh position={[cx * 0.84, 0.34, cz * 0.84]}>
              <cylinderGeometry args={[0.005, 0.005, 0.48, 10]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
            </mesh>
          </group>
        ))}

        {/* Khung giằng nhôm trên đỉnh máy */}
        {[-PD / 2, PD / 2].map((z, i) => (
          <mesh key={`top-x-${i}`} position={[0, PH + 0.06, z]}>
            <boxGeometry args={[PW, 0.024, 0.024]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.28} />
          </mesh>
        ))}
        {[-PW / 2, PW / 2].map((x, i) => (
          <mesh key={`top-z-${i}`} position={[x, PH + 0.06, 0]}>
            <boxGeometry args={[0.024, 0.024, PD]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.28} />
          </mesh>
        ))}

        {/* Vách kính polycarbonate hun khói 2 bên hông & mặt lưng + 2 Cánh cửa kính trước có tay nắm */}
        {[-PW / 2 - 0.004, PW / 2 + 0.004].map((x, i) => (
          <mesh key={`panel-lr-${i}`} position={[x, 0.37, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[PD - 0.03, PH - 0.08]} />
            <meshStandardMaterial color="#0b1520" transparent opacity={0.28} metalness={0.85} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {/* Cửa kính đôi phía trước (+Z) */}
        {[-0.128, 0.128].map((dx, i) => (
          <group key={`door-${i}`} position={[dx, 0.37, PD / 2 + 0.008]}>
            <mesh>
              <planeGeometry args={[0.245, PH - 0.09]} />
              <meshStandardMaterial color="#0e1b2a" transparent opacity={0.22} metalness={0.9} roughness={0.08} />
            </mesh>
            {/* Tay nắm cửa dọc màu đỏ ở giữa */}
            <mesh position={[i === 0 ? 0.105 : -0.105, 0, 0.012]}>
              <boxGeometry args={[0.014, 0.09, 0.018]} />
              <meshStandardMaterial color="#dc2626" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Thanh LED trắng chiếu sáng buồng in bên trong nóc máy */}
        <mesh position={[0, PH + 0.035, 0.14]}>
          <boxGeometry args={[0.42, 0.01, 0.018]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        <pointLight position={[0, 0.48, 0]} color="#e0f2fe" intensity={2.4} distance={1.4} decay={2} />

        {/* BÀN NHIỆT NHÔM ĐÚC MIC6 + TẤM THÉP TỪ PEI VÀNG NHÁM + CHI TIẾT ĐANG IN */}
        <group position={[0, 0.21, 0]}>
          {/* Đế nhôm dày 8mm */}
          <mesh>
            <boxGeometry args={[0.37, 0.012, 0.37]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.25} />
          </mesh>
          {/* Tấm thép lò xo phủ PEI vàng nhám đặc trưng */}
          <mesh position={[0, 0.008, 0]}>
            <boxGeometry args={[0.36, 0.003, 0.36]} />
            <meshStandardMaterial color="#d97706" metalness={0.45} roughness={0.38} />
          </mesh>
          {/* 4 Lò xo & núm vặn cân bàn bên dưới */}
          {[
            [-0.14, -0.14],
            [0.14, -0.14],
            [-0.14, 0.14],
            [0.14, 0.14],
          ].map(([bx, bz], bi) => (
            <mesh key={bi} position={[bx, -0.022, bz]}>
              <cylinderGeometry args={[0.018, 0.018, 0.025, 12]} />
              <meshStandardMaterial color="#dc2626" roughness={0.5} />
            </mesh>
          ))}

          {/* VẬT THỂ ĐANG ĐƯỢC IN DỞ TRÊN BÀN NHIỆT (Khớp gá servo robot màu xanh cyan) */}
          <group position={[0, 0.01, 0]}>
            <mesh position={[0, 0.022, 0]}>
              <boxGeometry args={[0.11, 0.044, 0.08]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.38} />
            </mesh>
            <mesh position={[0, 0.048, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.026, 20]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.38} />
            </mesh>
            <mesh position={[0, 0.052, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.03, 16]} />
              <meshStandardMaterial color="#0b1520" roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* HỆ CƠ KHÍ COREXY TRÊN CAO: 2 Motor NEMA 17 A/B + Ray trượt tuyến tính MGN12 + Dây đai GT2 */}
        {[-0.21, 0.21].map((mx, mi) => (
          <group key={`nema-${mi}`} position={[mx, 0.5, -0.21]}>
            <mesh>
              <boxGeometry args={[0.042, 0.044, 0.042]} />
              <meshStandardMaterial color="#090d14" metalness={0.5} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.032, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.022, 12]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
        {/* 2 Thanh ray trượt thép không gỉ MGN12 hai bên Y-axis */}
        {[-0.24, 0.24].map((rx, ri) => (
          <mesh key={`yrail-${ri}`} position={[rx, 0.51, 0]}>
            <boxGeometry args={[0.012, 0.01, 0.46]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}

        {/* CẦU NGANG X-GANTRY & CỤM ĐẦU PHUN STEALTHBURNER CHẠY ĐỘNG */}
        <group ref={gantryYRef} position={[0, 0.51, 0]}>
          {/* Thanh dầm sợi carbon X-axis + ray MGN12 */}
          <mesh>
            <boxGeometry args={[0.48, 0.02, 0.022]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.013]}>
            <boxGeometry args={[0.46, 0.009, 0.006]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Cụm đầu in Stealthburner đỏ-đen + Quạt 5015 + Đầu đồng Nozzle + Ống dẫn PTFE */}
          <group ref={toolheadXRef} position={[0, -0.04, 0.015]}>
            {/* Áo gió tản nhiệt vát góc Stealthburner */}
            <mesh position={[0, 0.01, 0.012]}>
              <boxGeometry args={[0.068, 0.088, 0.062]} />
              <meshStandardMaterial color="#dc2626" roughness={0.35} />
            </mesh>
            {/* Quạt thổi tản nhiệt cổ hotend mặt trước */}
            <mesh position={[0, 0.015, 0.044]}>
              <cylinderGeometry args={[0.02, 0.02, 0.006, 16]} />
              <meshStandardMaterial color="#090d14" roughness={0.5} />
            </mesh>
            {/* Đèn LED logo trạng thái đầu phun phát sáng xanh cyan */}
            <mesh position={[0, -0.018, 0.044]}>
              <circleGeometry args={[0.007, 6]} />
              <meshBasicMaterial color="#2ee6ff" />
            </mesh>
            {/* Khối gia nhiệt đồng + đầu vòi phun Nozzle đồng vàng hướng xuống chi tiết in */}
            <mesh position={[0, -0.046, 0]}>
              <boxGeometry args={[0.022, 0.016, 0.022]} />
              <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.006, 0.014, 12]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Xích luồn dây điện Drag-chain + Ống nhựa trắng PTFE vòng lên nóc */}
            <mesh position={[0.02, 0.095, -0.02]} rotation={[0.25, 0, -0.2]}>
              <cylinderGeometry args={[0.004, 0.004, 0.14, 8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* Giá đỡ cuộn nhựa bên hông phải + Cuộn nhựa PLA Cyan đang quay nhả sợi */}
        <group position={[PW / 2 + 0.045, 0.46, -0.05]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.09, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
          </mesh>
          <group ref={spoolRef} position={[0.025, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.088, 0.088, 0.052, 24]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.38} />
            </mesh>
            {[-0.028, 0.028].map((fx, fi) => (
              <mesh key={fi} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.102, 0.102, 0.005, 24]} />
                <meshStandardMaterial color="#0f172a" roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Màn hình cảm ứng 5-inch KlipperScreen phía trước đế máy + Nút dừng khẩn cấp E-Stop */}
        <group position={[0.06, 0.052, PD / 2 + 0.032]} rotation={[-0.38, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.145, 0.092, 0.018]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.132, 0.08]} />
            <meshBasicMaterial map={lcdTex} />
          </mesh>
        </group>
        <mesh position={[-0.14, 0.05, PD / 2 + 0.022]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.018, 14]} />
          <meshStandardMaterial color="#dc2626" roughness={0.35} />
        </mesh>
      </group>

      {/* DỤNG CỤ HẬU XỬ LÝ IN 3D BÀY BÊN PHẢI MẶT BÀN */}
      {/* Bình xịt cồn vệ sinh bàn in IPA + Dao sủi thép + Kìm cắt + 2 khối XYZ Calibration Cube */}
      <group position={[0.42, 0.785, 0.08]}>
        {/* Bình xịt cồn trắng xanh */}
        <mesh position={[0, 0.08, -0.14]}>
          <cylinderGeometry args={[0.036, 0.04, 0.16, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.175, -0.13]}>
          <boxGeometry args={[0.026, 0.038, 0.065]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        {/* Dao sủi cậy mẫu in (Bed Scraper) */}
        <group position={[-0.04, 0.008, 0.06]} rotation={[0, 0.42, 0]}>
          <mesh>
            <boxGeometry args={[0.055, 0.002, 0.08]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.006, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.09, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
        </group>
        {/* Mẫu in thử Calibration Cubes */}
        <mesh position={[0.09, 0.018, 0.04]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.034, 0.034, 0.034]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} />
        </mesh>
        <mesh position={[0.14, 0.015, 0.11]} rotation={[0, -0.5, 0]}>
          <boxGeometry args={[0.028, 0.028, 0.028]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ================================================================== */
/* 7. KỆ THÉP ĐỰNG LINH KIỆN & PHỤ TÙNG (Component Storage Rack)      */
/* ================================================================== */

export function StorageRack({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const W = 1.65;
  const H = 2.42;
  const D = 0.56;
  const shelfY = [0.22, 0.82, 1.42, 2.02];

  return (
    <group position={position} rotation={rotation}>
      {[
        [-W / 2 + 0.02, -D / 2 + 0.02],
        [W / 2 - 0.02, -D / 2 + 0.02],
        [-W / 2 + 0.02, D / 2 - 0.02],
        [W / 2 - 0.02, D / 2 - 0.02],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, H / 2, z]}>
          <boxGeometry args={[0.042, H, 0.042]} />
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.32} />
        </mesh>
      ))}

      {shelfY.map((y, idx) => (
        <group key={idx}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[W, 0.032, D]} />
            <meshStandardMaterial color="#475569" metalness={0.72} roughness={0.38} />
          </mesh>

          {idx === 0 && (
            <group position={[0, y + 0.19, 0]}>
              <mesh position={[-0.45, 0, 0]}>
                <boxGeometry args={[0.44, 0.34, 0.44]} />
                <meshStandardMaterial color="#92400e" roughness={0.82} />
              </mesh>
              <mesh position={[-0.45, 0.04, 0.222]}>
                <planeGeometry args={[0.16, 0.09]} />
                <meshBasicMaterial color="#f8fafc" />
              </mesh>
              <mesh position={[0.16, -0.02, 0]}>
                <boxGeometry args={[0.52, 0.3, 0.4]} />
                <meshStandardMaterial color="#78350f" roughness={0.82} />
              </mesh>
              {/* Thanh nhôm định hình 80/20 dự phòng dựng góc kệ */}
              <mesh position={[0.62, 0.05, 0]} rotation={[0, 0, 0.15]}>
                <boxGeometry args={[0.06, 0.48, 0.06]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.22} />
              </mesh>
            </group>
          )}

          {idx === 1 && (
            <group position={[0, y + 0.14, 0]}>
              {[-0.56, -0.19, 0.18, 0.55].map((bx, bi) => (
                <group key={bi} position={[bx, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[0.3, 0.23, 0.44]} />
                    <meshStandardMaterial color={bi % 2 === 0 ? '#0284c7' : '#ea580c'} roughness={0.55} />
                  </mesh>
                  <mesh position={[0, 0.02, 0.222]}>
                    <planeGeometry args={[0.14, 0.055]} />
                    <meshBasicMaterial color="#f8fafc" />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {idx === 2 && (
            <group position={[0, y + 0.13, 0]}>
              {[-0.54, -0.32, -0.1, 0.12, 0.34, 0.56].map((sx, si) => (
                <mesh key={si} position={[sx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.105, 0.105, 0.065, 22]} />
                  <meshStandardMaterial
                    color={si === 0 ? '#06b6d4' : si === 1 ? '#f97316' : si === 2 ? '#e2e8f0' : si === 3 ? '#10b981' : '#eab308'}
                    roughness={0.45}
                  />
                </mesh>
              ))}
            </group>
          )}

          {idx === 3 && (
            <group position={[0, y + 0.12, 0]}>
              {[-0.45, 0.0, 0.45].map((hx, hi) => (
                <mesh key={hi} position={[hx, 0, 0]}>
                  <boxGeometry args={[0.34, 0.2, 0.36]} />
                  <meshStandardMaterial color={hi === 1 ? '#005f6b' : '#1e293b'} roughness={0.55} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/* ================================================================== */
/* 8. TỦ RACK MẠNG & SERVER 19-INCH 42U (Server Rack Cabinet)          */
/* ================================================================== */

export function ServerCabinet({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ledRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ledRef.current) {
      const t = clock.elapsedTime;
      ledRef.current.children.forEach((child, i) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = Math.sin(t * (11 + i * 3.1)) > -0.1 ? 0.95 : 0.15;
        }
      });
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.78, 2.3, 0.92]} />
        <meshStandardMaterial color="#0f172a" metalness={0.72} roughness={0.38} />
      </mesh>
      <mesh position={[0, 1.15, 0.464]}>
        <planeGeometry args={[0.66, 2.14]} />
        <meshStandardMaterial color="#020617" transparent opacity={0.58} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Switch PROFINET Managed + Server GPU Nodes + UPS đáy tủ */}
      {[0.32, 0.58, 0.84, 1.1, 1.36, 1.62, 1.88].map((y, idx) => (
        <group key={idx} position={[0, y, 0.37]}>
          <mesh>
            <boxGeometry args={[0.63, idx === 0 ? 0.16 : 0.095, 0.14]} />
            <meshStandardMaterial color={idx === 5 ? '#005f6b' : '#1e293b'} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.072]}>
            <planeGeometry args={[0.55, 0.06]} />
            <meshBasicMaterial color="#090d14" />
          </mesh>
        </group>
      ))}

      <group ref={ledRef} position={[0.23, 1.25, 0.448]}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <mesh key={i} position={[-(i % 2) * 0.04, (i - 3.5) * 0.18, 0]}>
            <planeGeometry args={[0.015, 0.015]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#38bdf8' : '#ffb02e'} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ================================================================== */
/* 9. BẢNG TRẮNG KỸ SƯ VẼ SƠ ĐỒ MẠCH THẬT (Engineering Whiteboard)     */
/* ================================================================== */

export function WhiteboardStand({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const boardTex = useMemo(() => getWhiteboardTexture(), []);
  return (
    <group position={position} rotation={rotation}>
      {[-0.92, 0.92].map((x, i) => (
        <group key={i} position={[x, 0.96, 0]}>
          <mesh>
            <cylinderGeometry args={[0.018, 0.018, 1.92, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.94, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.58, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[1.82, 1.06, 0.022]} />
        <meshStandardMaterial color="#64748b" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.32, 0.013]}>
        <planeGeometry args={[1.76, 1.0]} />
        <meshStandardMaterial map={boardTex} roughness={0.24} metalness={0.05} />
      </mesh>

      {/* Máng để bút lông 3 màu Đỏ/Xanh/Đen + Khăn xóa bảng nam châm */}
      <mesh position={[0, 0.78, 0.036]}>
        <boxGeometry args={[1.35, 0.018, 0.065]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.28} />
      </mesh>
      {[-0.28, -0.14, 0.02].map((mx, mi) => (
        <mesh key={mi} position={[mx, 0.798, 0.04]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.11, 10]} />
          <meshStandardMaterial color={mi === 0 ? '#dc2626' : mi === 1 ? '#0284c7' : '#0f172a'} />
        </mesh>
      ))}
      <mesh position={[0.28, 0.805, 0.04]}>
        <boxGeometry args={[0.12, 0.032, 0.05]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* 10. GỜ CÁP ĐIỆN SÀN & BÌNH CHỮA CHÁY (Cable Ramps & Safety Gear)    */
/* ================================================================== */

export function FloorCableRamp({
  from = [0, 0, 0],
  to = [0, 0, 1],
  width = 0.16,
}: {
  from: [number, number, number];
  to: [number, number, number];
  width?: number;
}) {
  const p1 = new THREE.Vector3(...from);
  const p2 = new THREE.Vector3(...to);
  const len = p1.distanceTo(p2);
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

  return (
    <group position={[mid.x, 0.012, mid.z]} rotation={[0, angle, 0]}>
      <mesh>
        <boxGeometry args={[width, 0.022, len]} />
        <meshStandardMaterial color="#111827" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.46, len]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
    </group>
  );
}

export function FireExtinguisher({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.52, 18]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <sphereGeometry args={[0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 0.58, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.04, 0.015, 0.22, 12]} />
        <meshStandardMaterial color="#020617" roughness={0.7} />
      </mesh>
    </group>
  );
}
