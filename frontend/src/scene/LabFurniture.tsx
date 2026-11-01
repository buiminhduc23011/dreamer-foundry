import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ================================================================== */
/* 1. GHẾ XOAY KỸ THUẬT PHÒNG LAB (Ergonomic Technician Stool / Chair)  */
/* ================================================================== */

interface LabChairProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  hasBackrest?: boolean;
}

export function LabChair({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  hasBackrest = true,
}: LabChairProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Chân sao 5 cánh kim loại có 5 bánh xe nhỏ */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        const r = 0.28;
        return (
          <group key={i}>
            {/* Thanh chân chĩa ra */}
            <mesh
              position={[Math.cos(a) * (r * 0.5), 0.045, Math.sin(a) * (r * 0.5)]}
              rotation={[0, -a, 0]}
            >
              <boxGeometry args={[r, 0.024, 0.03]} />
              <meshStandardMaterial color="#1f2933" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Bánh xe xoay 360 */}
            <mesh position={[Math.cos(a) * r, 0.025, Math.sin(a) * r]}>
              <cylinderGeometry args={[0.022, 0.022, 0.02, 10]} />
              <meshStandardMaterial color="#0b0f14" roughness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* Trục nâng thủy lực xi lanh mạ chrome */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.022, 0.026, 0.44, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Ống bọc ngoài trục nâng */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.2, 16]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Vòng kim loại gác chân tròn (đặc trưng ghế bàn kỹ thuật cao) */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.012, 10, 28]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* 3 thanh giằng vòng gác chân vào trục chính */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.09, 0.2, Math.sin(a) * 0.09]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.18, 0.01, 0.012]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}

      {/* Tay gạt chỉnh độ cao ghế bên hông */}
      <mesh position={[0.12, 0.44, 0.08]} rotation={[0, 0.3, 0.2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.12, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Đệm ngồi tròn da vinyl chống tĩnh điện cao cấp */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.22, 0.21, 0.065, 28]} />
        <meshStandardMaterial color="#1e293b" metalness={0.15} roughness={0.7} />
      </mesh>

      {/* Tựa lưng cong công thái học (nếu có) */}
      {hasBackrest && (
        <group position={[0, 0.48, -0.19]}>
          {/* Khung thép chữ L đỡ lưng */}
          <mesh position={[0, 0.16, -0.04]}>
            <boxGeometry args={[0.036, 0.32, 0.02]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Tấm đệm tựa lưng lưới thoáng khí */}
          <mesh position={[0, 0.26, 0.01]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.32, 0.22, 0.035]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ================================================================== */
/* 2. DỤNG CỤ ĐỂ TRÊN BÀN LAB (Instruments: Power Supply, Scope, etc.)  */
/* ================================================================== */

/** Bộ nguồn DC đa năng 2 kênh hiển thị LED số đỏ/xanh */
function BenchPowerSupply({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vỏ máy kim loại sơn tĩnh điện xám đen */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.22, 0.15, 0.28]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Mặt hiển thị LED phía trước (+Z) */}
      <mesh position={[0, 0.08, 0.141]}>
        <planeGeometry args={[0.19, 0.12]} />
        <meshStandardMaterial color="#0b1118" roughness={0.4} />
      </mesh>
      {/* Màn LED điện áp: 05.00V (đỏ) */}
      <mesh position={[-0.045, 0.11, 0.142]}>
        <planeGeometry args={[0.07, 0.025]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Màn LED dòng điện: 02.40A (xanh lá) */}
      <mesh position={[0.045, 0.11, 0.142]}>
        <planeGeometry args={[0.07, 0.025]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      {/* 2 núm xoay chỉnh Voltage / Current */}
      {[-0.045, 0.045].map((x, i) => (
        <mesh key={i} position={[x, 0.065, 0.148]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* 3 cọc cắm ra: Đỏ (+), Đen (-), Xanh lá (GND) */}
      {[-0.05, 0, 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0.032, 0.148]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.015, 10]} />
          <meshStandardMaterial color={i === 0 ? '#dc2626' : i === 1 ? '#020617' : '#16a34a'} />
        </mesh>
      ))}
    </group>
  );
}

/** Máy hiện sóng kỹ thuật số Oscilloscope có sóng sine/xung sống động */
function Oscilloscope({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const waveMesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waveMesh.current) {
      const mat = waveMesh.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 8);
    }
  });

  return (
    <group position={position}>
      {/* Khung máy */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.34, 0.2, 0.22]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Quai xách trên nóc máy */}
      <mesh position={[0, 0.225, 0]}>
        <boxGeometry args={[0.2, 0.025, 0.03]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      {/* Màn hình hiển thị LCD dạ quang xanh lơ */}
      <mesh position={[-0.055, 0.11, 0.112]}>
        <planeGeometry args={[0.18, 0.13]} />
        <meshBasicMaterial color="#042f2e" />
      </mesh>
      {/* Đường sóng tín hiệu oscillogram */}
      <mesh ref={waveMesh} position={[-0.055, 0.11, 0.113]}>
        <planeGeometry args={[0.16, 0.08]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.9} />
      </mesh>
      {/* Cụm phím bấm & núm xoay bên phải màn hình */}
      <mesh position={[0.09, 0.13, 0.115]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.014, 14]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.09, 0.075, 0.115]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.012, 14]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 2 cổng cắm BNC Channel 1 & 2 */}
      {[-0.08, -0.03].map((x, i) => (
        <mesh key={i} position={[x, 0.026, 0.116]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.014, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Trạm hàn thiếc Hakko style + giá gác mỏ hàn + cuộn thiếc */
function SolderingStation({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Hộp điều khiển trạm hàn */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.13, 0.09, 0.15]} />
        <meshStandardMaterial color="#0f766e" roughness={0.5} />
      </mesh>
      {/* Màn hiển thị nhiệt độ: 380°C */}
      <mesh position={[0, 0.065, 0.076]}>
        <planeGeometry args={[0.06, 0.024]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Núm vặn chỉnh nhiệt độ */}
      <mesh position={[0, 0.032, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} />
      </mesh>

      {/* Ống lò xo kim loại cắm gác mỏ hàn */}
      <group position={[0.13, 0.01, 0.02]} rotation={[0, -0.2, -0.45]}>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.018, 0.024, 0.12, 12, 1, true]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Cán mỏ hàn cắm bên trong */}
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.01, 0.008, 0.14, 10]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
      </group>

      {/* Cuộn thiếc hàn trên trục đỡ */}
      <group position={[-0.12, 0.04, 0.01]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.032, 0.032, 0.036, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.008, 16]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Đèn kẹp bàn kỹ thuật khớp xoay chiếu rọi xuống mặt bàn (Task Lamp) */
function ArticulatedTaskLamp({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Kẹp C-clamp siết vào mép bàn */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.05, 0.07, 0.05]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Khớp xoay chân đế */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Cánh tay 1: vươn chéo lên */}
      <group position={[0, 0.08, 0]} rotation={[0.4, 0.3, 0]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.44, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Khớp gập lò xo ở giữa */}
        <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Cánh tay 2: vươn chéo xuống phía trước bàn */}
        <group position={[0, 0.44, 0]} rotation={[-1.1, 0, 0]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.36, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Chụp đèn hình nón rọi sáng */}
          <group position={[0, 0.36, 0]} rotation={[0.8, 0, 0]}>
            <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, 0.1, 16, 1, true]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
            {/* Đèn LED chiếu gom chùm ấm dịu rọi mặt bàn */}
            <pointLight position={[0, 0.02, 0]} color="#fff7ed" intensity={3.5} distance={2.4} decay={1.8} />
          </group>
        </group>
      </group>
    </group>
  );
}

/** Khay hộp nhựa phân loại linh kiện (Parts Bins) */
function ComponentBinsRow({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const colors = ['#dc2626', '#2563eb', '#ca8a04', '#16a34a'];
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <group key={i} position={[(i - 1.5) * 0.11, 0.03, 0]}>
          <mesh>
            <boxGeometry args={[0.09, 0.055, 0.14]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
          {/* Lòng khay lõm chứa ốc vít/linh kiện */}
          <mesh position={[0, 0.015, 0.01]}>
            <boxGeometry args={[0.075, 0.03, 0.11]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ================================================================== */
/* 3. BÀN THAO TÁC KỸ THUẬT R&D HOÀN CHỈNH (Complete Lab Workbench)     */
/* ================================================================== */

interface LabWorkbenchProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  esdColor?: '#1b455b' | '#1d4a36' | '#1e293b';
  hasChair?: boolean;
  chairOffset?: [number, number, number];
  chairRotation?: [number, number, number];
  children?: React.ReactNode;
}

export function LabWorkbench({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  esdColor = '#1b455b',
  hasChair = true,
  chairOffset = [0, 0, 0.95],
  chairRotation = [0, 0, 0],
  children,
}: LabWorkbenchProps) {
  // Kích thước bàn công nghiệp tiêu chuẩn
  const W = 2.4;  // Rộng 2.4m
  const D = 1.25; // Sâu 1.25m
  const H = 0.72; // Cao mặt bàn 0.72m
  const LEG_R = 0.032;

  return (
    <group position={position} rotation={rotation}>
      {/* 4 Chân bàn thép hộp sơn tĩnh điện xám đen */}
      {[
        [-W / 2 + 0.1, -D / 2 + 0.1],
        [W / 2 - 0.1, -D / 2 + 0.1],
        [-W / 2 + 0.1, D / 2 - 0.1],
        [W / 2 - 0.1, D / 2 - 0.1],
      ].map(([x, z], i) => (
        <group key={i} position={[x, H / 2, z]}>
          <mesh>
            <boxGeometry args={[LEG_R * 2, H, LEG_R * 2]} />
            <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Chân tăng chỉnh đệm cao su sát sàn */}
          <mesh position={[0, -H / 2 + 0.015, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.03, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Khung giằng thép chịu lực dưới mặt bàn */}
      <mesh position={[0, H - 0.03, 0]}>
        <boxGeometry args={[W - 0.16, 0.04, D - 0.16]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Thanh giằng ngang phía dưới chân bàn */}
      <mesh position={[0, 0.18, -D / 2 + 0.1]}>
        <boxGeometry args={[W - 0.16, 0.03, 0.03]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Mặt bàn gỗ công nghiệp lõi xanh chống ẩm */}
      <mesh position={[0, H, 0]}>
        <boxGeometry args={[W, 0.045, D]} />
        <meshStandardMaterial color="#2d3748" roughness={0.6} />
      </mesh>

      {/* Thảm cao su chống tĩnh điện ESD Mat trên mặt bàn */}
      <mesh position={[0, H + 0.024, 0.04]}>
        <boxGeometry args={[W - 0.1, 0.005, D - 0.12]} />
        <meshStandardMaterial color={esdColor} roughness={0.65} metalness={0.1} />
      </mesh>
      {/* Chốt tiếp địa bằng đồng vàng góc thảm ESD */}
      <mesh position={[W / 2 - 0.12, H + 0.028, D / 2 - 0.1]}>
        <cylinderGeometry args={[0.014, 0.014, 0.006, 12]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 2 Trụ nhôm định hình 4040 vươn lên đỡ kệ tầng trên */}
      {[-W / 2 + 0.22, W / 2 - 0.22].map((x, i) => (
        <mesh key={i} position={[x, H + 0.42, -D / 2 + 0.14]}>
          <boxGeometry args={[0.04, 0.8, 0.04]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Tầng kệ trên (Instrument Riser Shelf) */}
      <mesh position={[0, H + 0.58, -D / 2 + 0.2]}>
        <boxGeometry args={[W - 0.2, 0.028, 0.42]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* CÁC THIẾT BỊ ĐẶT TRÊN GIÁ TẦNG TRÊN */}
      {/* 1. Bộ nguồn DC */}
      <BenchPowerSupply position={[-0.68, H + 0.6, -D / 2 + 0.22]} />
      {/* 2. Máy hiện sóng Oscilloscope */}
      <Oscilloscope position={[-0.22, H + 0.6, -D / 2 + 0.22]} />
      {/* 3. Dãy khay ốc vít linh kiện */}
      <ComponentBinsRow position={[0.34, H + 0.6, -D / 2 + 0.22]} />
      {/* 4. Trạm hàn thiếc */}
      <SolderingStation position={[0.74, H + 0.6, -D / 2 + 0.22]} />

      {/* Đèn kẹp bàn kỹ thuật góc trái bàn */}
      <ArticulatedTaskLamp position={[-W / 2 + 0.14, H + 0.025, -D / 2 + 0.24]} />

      {/* Ổ cắm điện đa năng dưới gầm bàn có công tắc đỏ */}
      <group position={[W / 2 - 0.35, H - 0.08, D / 2 - 0.1]}>
        <mesh>
          <boxGeometry args={[0.26, 0.04, 0.06]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.1, 0, 0.031]}>
          <planeGeometry args={[0.02, 0.02]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Ghế kỹ thuật phòng lab đi kèm bàn */}
      {hasChair && (
        <LabChair
          position={chairOffset}
          rotation={chairRotation}
          scale={1.05}
          hasBackrest={true}
        />
      )}

      {/* Vị trí đặt mô hình R&D lên bàn (y = H + 0.03) */}
      <group position={[0, H + 0.03, 0.05]}>
        {children}
      </group>
    </group>
  );
}

/* ================================================================== */
/* 4. KHOANG BẢO DƯỠNG XE CÔNG NGHIỆP (Industrial Vehicle Test Bay)    */
/* ================================================================== */

interface VehicleBayProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  bayCode?: string;
  children?: React.ReactNode;
}

export function VehicleBay({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [3.0, 3.2],
  children,
}: VehicleBayProps) {
  const [W, D] = size;

  return (
    <group position={position} rotation={rotation}>
      {/* Tấm sàn thép gân chống trượt khoang bảo dưỡng */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[W, 0.03, D]} />
        <meshStandardMaterial color="#16202c" metalness={0.7} roughness={0.6} />
      </mesh>

      {/* Vạch kẻ sàn cảnh báo an toàn màu vàng/đen viền quanh khoang */}
      {/* Cạnh trước / sau */}
      {[-D / 2 + 0.06, D / 2 - 0.06].map((z, i) => (
        <mesh key={`fb-${i}`} position={[0, 0.032, z]}>
          <planeGeometry args={[W - 0.1, 0.1]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}
      {/* Cạnh trái / phải */}
      {[-W / 2 + 0.06, W / 2 - 0.06].map((x, i) => (
        <mesh key={`lr-${i}`} position={[x, 0.032, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[D - 0.1, 0.1]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Bàn chẩn đoán di động (Mobile Diagnostics Cart) kế bên khoang */}
      <group position={[W / 2 + 0.52, 0, 0.2]} rotation={[0, -0.3, 0]}>
        {/* Xe đẩy 3 tầng */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.55, 0.8, 0.45]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Laptop chẩn đoán mở nắp hiển thị dữ liệu CAN-FD */}
        <group position={[0, 0.84, 0]}>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.32, 0.018, 0.22]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.12, -0.1]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[0.32, 0.22, 0.015]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          {/* Màn hình laptop hiển thị telemetry terminal xanh */}
          <mesh position={[0, 0.12, -0.091]} rotation={[0.35, 0, 0]}>
            <planeGeometry args={[0.28, 0.18]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </group>
        {/* Ghế kỹ thuật ngồi chẩn đoán xe */}
        <LabChair position={[0, 0, 0.65]} rotation={[0, 0.4, 0]} hasBackrest={true} />
      </group>

      {/* Dây sạc / giao tiếp chẩn đoán nối từ cart ra sàn */}
      <mesh position={[W / 2 + 0.2, 0.02, 0.2]} rotation={[0, 0.8, 0]}>
        <boxGeometry args={[0.45, 0.012, 0.025]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Đặt mô hình xe vào giữa khoang */}
      <group position={[0, 0.03, 0]}>
        {children}
      </group>
    </group>
  );
}

/* ================================================================== */
/* 5. BÀN MÁY TÍNH KỸ SƯ / DEVELOPER WORKSTATION                      */
/* ================================================================== */

export function DeveloperStation({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Mặt bàn gỗ sồi công nghiệp & chân thép */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.0, 0.045, 0.95]} />
        <meshStandardMaterial color="#1e2530" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 2 Chân chữ U bằng thép sơn tĩnh điện */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 0.35, 0]}>
          <boxGeometry args={[0.06, 0.7, 0.75]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Tay đỡ màn hình đôi Dual-Monitor Mount */}
      <mesh position={[0, 0.85, -0.36]}>
        <cylinderGeometry args={[0.018, 0.018, 0.26, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* MÀN HÌNH 1 (BÊN TRÁI): IDE Code Editor */}
      <group position={[-0.38, 1.08, -0.28]} rotation={[0, 0.18, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.38, 0.025]} />
          <meshStandardMaterial color="#0b0f17" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Màn hình hiển thị dark code */}
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[0.59, 0.35]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* Dòng code phát sáng */}
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[0.54, 0.3]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* MÀN HÌNH 2 (BÊN PHẢI): RViz 3D SLAM Telemetry */}
      <group position={[0.38, 1.08, -0.28]} rotation={[0, -0.18, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.38, 0.025]} />
          <meshStandardMaterial color="#0b0f17" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Màn hình RViz bản đồ 3D */}
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[0.59, 0.35]} />
          <meshBasicMaterial color="#042f2e" />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[0.52, 0.28]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Bàn phím cơ có đèn led gầm xanh cyan */}
      <mesh position={[-0.05, 0.755, 0.14]}>
        <boxGeometry args={[0.38, 0.018, 0.14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[-0.05, 0.748, 0.14]}>
        <boxGeometry args={[0.4, 0.005, 0.16]} />
        <meshBasicMaterial color="#2ee6ff" transparent opacity={0.4} />
      </mesh>

      {/* Chuột công thái học */}
      <mesh position={[0.26, 0.755, 0.14]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.07, 0.025, 0.11]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* Cốc cà phê kỹ sư ghi logo DBI */}
      <mesh position={[0.55, 0.78, 0.05]}>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Đèn bàn kỹ sư */}
      <ArticulatedTaskLamp position={[-0.78, 0.745, -0.28]} />

      {/* Ghế công thái học Dev Chair kéo ra sau bàn */}
      <LabChair position={[0, 0, 0.75]} rotation={[0, 0.2, 0]} scale={1.12} hasBackrest={true} />
    </group>
  );
}

/* ================================================================== */
/* 6. KỆ THÉP ĐỰNG LINH KIỆN & PHỤ TÙNG (Component Storage Rack)      */
/* ================================================================== */

export function StorageRack({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const W = 1.6;
  const H = 2.4;
  const D = 0.55;
  const shelfY = [0.3, 0.85, 1.4, 1.95];

  return (
    <group position={position} rotation={rotation}>
      {/* 4 Cột sắt V lỗ góc */}
      {[
        [-W / 2 + 0.02, -D / 2 + 0.02],
        [W / 2 - 0.02, -D / 2 + 0.02],
        [-W / 2 + 0.02, D / 2 - 0.02],
        [W / 2 - 0.02, D / 2 - 0.02],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, H / 2, z]}>
          <boxGeometry args={[0.04, H, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* 4 Tầng mâm tole mạ kẽm chịu lực */}
      {shelfY.map((y, idx) => (
        <group key={idx}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[W, 0.03, D]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
          </mesh>

          {/* Các thùng nhựa & hộp linh kiện trên từng tầng */}
          {idx === 0 && (
            // Tầng 1: Thùng carton to để motor, pin LiPo
            <group position={[0, y + 0.18, 0]}>
              <mesh position={[-0.45, 0, 0]}>
                <boxGeometry args={[0.42, 0.32, 0.42]} />
                <meshStandardMaterial color="#a16207" roughness={0.8} />
              </mesh>
              <mesh position={[0.1, 0, 0]}>
                <boxGeometry args={[0.48, 0.28, 0.38]} />
                <meshStandardMaterial color="#854d0e" roughness={0.8} />
              </mesh>
            </group>
          )}

          {idx === 1 && (
            // Tầng 2: Hàng hộp nhựa phân loại phụ tùng xanh / cam
            <group position={[0, y + 0.14, 0]}>
              {[-0.55, -0.2, 0.15, 0.5].map((bx, bi) => (
                <mesh key={bi} position={[bx, 0, 0]}>
                  <boxGeometry args={[0.28, 0.22, 0.42]} />
                  <meshStandardMaterial color={bi % 2 === 0 ? '#0284c7' : '#ea580c'} roughness={0.6} />
                </mesh>
              ))}
            </group>
          )}

          {idx === 2 && (
            // Tầng 3: Các cuộn nhựa in 3D Filament (PLA, PETG, TPU)
            <group position={[0, y + 0.14, 0]}>
              {[-0.5, -0.28, -0.06, 0.16, 0.38, 0.6].map((sx, si) => (
                <mesh key={si} position={[sx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
                  <meshStandardMaterial
                    color={si === 0 ? '#06b6d4' : si === 1 ? '#f97316' : si === 2 ? '#e2e8f0' : '#10b981'}
                    roughness={0.5}
                  />
                </mesh>
              ))}
            </group>
          )}

          {idx === 3 && (
            // Tầng 4: Hộp mạch điện tử, kit phát triển ESP32, STM32
            <group position={[0, y + 0.12, 0]}>
              {[-0.4, 0.05, 0.45].map((hx, hi) => (
                <mesh key={hi} position={[hx, 0, 0]}>
                  <boxGeometry args={[0.3, 0.18, 0.32]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
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
/* 7. TRẠM MÁY IN 3D FDM (3D Printer Station)                          */
/* ================================================================== */

export function ThreeDPrinterStation({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const headRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (headRef.current) {
      // Đầu in chạy qua lại mô phỏng đang in linh kiện
      headRef.current.position.x = Math.sin(clock.elapsedTime * 4.2) * 0.12;
      headRef.current.position.z = Math.cos(clock.elapsedTime * 3.1) * 0.08;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Bàn đặt máy in */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Máy in 3D FDM */}
      <group position={[0, 0.9, 0]}>
        {/* Khung nhôm 2020 v-slot đen */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.48, 0.06, 0.48]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* 2 Cột Z nhôm đứng 2 bên */}
        {[-0.22, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {/* Thanh đà ngang trên nóc */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[0.48, 0.03, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Cuộn nhựa treo trên nóc */}
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.4} />
        </mesh>

        {/* Bàn nhiệt in 3D Heated Bed */}
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.32, 0.012, 0.32]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.4} />
        </mesh>

        {/* Đầu in 3D Extruder di chuyển linh hoạt */}
        <group position={[0, 0.22, 0]}>
          {/* Trục X ngang */}
          <mesh>
            <boxGeometry args={[0.44, 0.024, 0.03]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Cụm đầu in có quạt tản nhiệt */}
          <mesh ref={headRef} position={[0, 0, 0]}>
            <boxGeometry args={[0.065, 0.07, 0.065]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
        </group>

        {/* Màn hình điều khiển LCD hiển thị tiến độ */}
        <mesh position={[0.22, 0.08, 0.24]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.07, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.22, 0.085, 0.25]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.08, 0.05]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>

        {/* Các chi tiết in thử vứt cạnh máy in */}
        <mesh position={[-0.38, 0.03, 0.18]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.08]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/* ================================================================== */
/* 8. TỦ RACK MẠNG & SERVER 19-INCH 42U (Server Rack Cabinet)          */
/* ================================================================== */

export function ServerCabinet({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const ledRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ledRef.current) {
      const t = clock.elapsedTime;
      ledRef.current.children.forEach((child, i) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = Math.sin(t * (12 + i * 3)) > 0 ? 0.95 : 0.2;
        }
      });
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Vỏ tủ rack thép tấm đen mờ 42U */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.75, 2.3, 0.9]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Cửa kính hun khói nhìn xuyên thấu phía trước */}
      <mesh position={[0, 1.15, 0.455]}>
        <planeGeometry args={[0.65, 2.15]} />
        <meshStandardMaterial color="#020617" transparent opacity={0.65} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Các phiến server 1U / 2U bên trong tủ */}
      {[0.4, 0.65, 0.9, 1.15, 1.4, 1.65, 1.9].map((y, idx) => (
        <group key={idx} position={[0, y, 0.36]}>
          <mesh>
            <boxGeometry args={[0.62, 0.085, 0.12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Lỗ thông gió tản nhiệt */}
          <mesh position={[0, 0, 0.061]}>
            <planeGeometry args={[0.54, 0.06]} />
            <meshBasicMaterial color="#0b0f17" />
          </mesh>
        </group>
      ))}

      {/* Cụm đèn LED trạng thái mạng nhấp nháy liên tục */}
      <group ref={ledRef} position={[0.22, 1.4, 0.43]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, (i - 3) * 0.18, 0]}>
            <planeGeometry args={[0.014, 0.014]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#22c55e' : '#38bdf8'} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ================================================================== */
/* 9. BẢNG TRẮNG KỸ SƯ DI ĐỘNG (Mobile Engineering Whiteboard)        */
/* ================================================================== */

export function WhiteboardStand({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Khung chân chữ A bằng ống thép tròn có 4 bánh xe */}
      {[-0.85, 0.85].map((x, i) => (
        <group key={i} position={[x, 0.95, 0]}>
          <mesh>
            <cylinderGeometry args={[0.016, 0.016, 1.9, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Chân đế ngang có 2 bánh xe */}
          <mesh position={[0, -0.93, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.55, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Mặt bảng trắng từ tính lớn */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.75, 1.05, 0.025]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Khung viền nhôm quanh bảng */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.78, 1.08, 0.018]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Sơ đồ mạch & Ghi chú hài hước vẽ bằng bút lông bảng */}
      {/* 1. Sơ đồ khối mạng Swerve CAN-FD */}
      <mesh position={[-0.45, 1.45, 0.014]}>
        <planeGeometry args={[0.55, 0.28]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.6} />
      </mesh>
      {/* 2. Công thức PID Controller */}
      <mesh position={[-0.45, 1.15, 0.014]}>
        <planeGeometry args={[0.62, 0.16]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={0.55} />
      </mesh>
      {/* 3. Ghi chú TODO gạch xóa */}
      <mesh position={[0.42, 1.35, 0.014]}>
        <planeGeometry args={[0.65, 0.42]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.7} />
      </mesh>

      {/* Khay máng để bút lông & bông lau bảng */}
      <mesh position={[0, 0.72, 0.03]}>
        <boxGeometry args={[1.2, 0.02, 0.06]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* 10. GỜ BỌC CÁP ĐIỆN SÀN & AN TOÀN PHÒNG LAB (Safety & Cable Ramps) */
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
      {/* Cao su đen vát dốc 2 bên */}
      <mesh>
        <boxGeometry args={[width, 0.022, len]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      {/* Sọc phản quang vàng ở sống lưng gờ cáp */}
      <mesh position={[0, 0.012, 0]}>
        <planeGeometry args={[width * 0.45, len]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
    </group>
  );
}

/** Bình chữa cháy CO2 treo tường (Red Fire Extinguisher) */
export function FireExtinguisher({ position = [0, 0, 0], rotation = [0, 0, 0] }: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Thân bình chữa cháy màu đỏ tươi */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.52, 18]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Chóp tròn trên và dưới bình */}
      <mesh position={[0, 0.54, 0]}>
        <sphereGeometry args={[0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Cụm van bóp & đồng hồ áp suất */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Loa phun khí CO2 màu đen */}
      <mesh position={[0.08, 0.58, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.04, 0.015, 0.22, 12]} />
        <meshStandardMaterial color="#020617" roughness={0.7} />
      </mesh>
    </group>
  );
}
