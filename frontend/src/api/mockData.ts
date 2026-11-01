import type { BadIdea, DustyProject, GraveyardEntry, LabStats, RoastComment } from '../types';

/**
 * Offline seed — mirrors the .NET backend seed exactly so mock mode
 * is canonically identical to the real lab. Used when the API is unreachable.
 */
export const mockProjects: DustyProject[] = [
  {
    id: 'fork-eye',
    codeName: 'PRJ-FORK-EYE',
    name: 'Camera AI An Toàn Xe Nâng',
    tagline:
      'Cứu các bác tài xe nâng khỏi những pha lùi xe đi vào lòng đất ở góc khuất xưởng. Hiện tại AI đang nhận diện nhầm cái cột nhà là người.',
    ghostStatus: 'Đắp chiếu nhẹ — 65% Hoàn thành',
    damageReport: 'Cháy 1 cáp CSI, gãy 3 ngàm vỏ in 3D, kẹt 1 con ốc không vặn ra được.',
    timeParadox: 'Dự kiến: 2 tuần | Thực tế đã ngâm: 7 tháng',
    completionPercent: 65,
    dustLevel: 45,
    smoking: false,
    position: [-6.0, 0, -1.8],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Mạch hạ áp Buck 48V xuống 12V/5V chống nhiễu công nghiệp (Đã hết bốc khói sau lần sửa thứ 4).' },
        { status: 'Xong', description: 'Cụm OAK-1 W AI Camera + Raspberry Pi + Màn hình 5-inch câu dây chằng chịt trên bàn.' },
        { status: 'DangNgap', description: 'Vỏ bọc chuẩn IP65 chống bụi xưởng (Hiện tại đang chống bụi bằng... băng dính điện).' },
      ],
      firmware: [
        { status: 'Xong', description: 'Watchdog timer tự động giả vờ như không có chuyện gì xảy ra và reset khi treo.' },
        { status: 'DangNgap', description: 'Kích hoạt còi hú công suất lớn (Đang tạm tắt vì mỗi lần test làm kỹ sư giật mình rơi mỏ hàn).' },
      ],
      software: [
        { status: 'Xong', description: 'Pipeline AI nhận diện người & vật cản real-time ở góc khuất độ trễ thấp.' },
        { status: 'TrongMo', description: 'Dashboard thống kê số lần tài xế "suýt mất thưởng Tết" theo ca làm việc qua Wi-Fi.' },
      ],
    },
  },
  {
    id: 'remote-io',
    codeName: 'PRJ-REMOTE-IO',
    name: 'Trạm Remote I/O Phân Tán Chuẩn Công Nghiệp',
    tagline:
      'Tham vọng tự chế bộ Distributed Remote I/O gắn thanh ray DIN cạnh tranh trực tiếp với Siemens SIMATIC ET 200SP giá bằng 1/5. Thực tế: Đèn đỏ BF/SF nhấp nháy như vũ trường, biến tần vừa chạy là rơ-le gõ nhịp cha-cha-cha.',
    ghostStatus: 'Đèn đỏ SF/BF sáng vĩnh cửu — 55% Hoàn thành',
    damageReport: 'Nổ 4 opto cách ly PC817 do đấu nhầm 220VAC vào chân DI 24VDC, cháy 1 chip PHY Ethernet, gãy 2 lẫy gài thanh DIN 35mm.',
    timeParadox: 'Dự kiến: 3 tuần | Thực tế đã ngâm: 8 tháng (vẫn đang tải file GSDML)',
    completionPercent: 55,
    dustLevel: 58,
    smoking: false,
    position: [-3.2, 0, -5.4],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Cụm Interface Module Dual-RJ45 + Backplane tốc độ cao + Vỏ gài ray DIN 35mm kiểu Siemens ET 200SP.' },
        { status: 'Xong', description: 'Các slice module DI 16x24VDC, DQ 16x24VDC/0.5A, AI 4-20mA kèm cầu đấu Push-in không cần tua-vít.' },
        { status: 'DangNgap', description: 'Module an toàn vàng PROFIsafe F-DI/F-DQ (Hiện tại chức năng an toàn duy nhất là... tự đứt cầu chì).' },
      ],
      firmware: [
        { status: 'Xong', description: 'Stack Modbus TCP & quét backplane nội bộ chu kỳ 1ms qua SPI DMA.' },
        { status: 'DangNgap', description: 'Stack PROFINET RT & xuất file cấu hình GSDML cho TIA Portal (Cắm vào PLC Siemens vẫn báo "Not Reachable").' },
      ],
      software: [
        { status: 'DangNgap', description: 'Màn hình HMI Web/WinCC chẩn đoán đứt dây, quá dòng từng kênh LED ma trận.' },
        { status: 'TrongMo', description: 'Tính năng Hot-Swap rút nóng module không làm PLC dừng chạy (Hiện rút ra là treo cả tủ điện).' },
      ],
    },
  },
  {
    id: 'jarvis-core',
    codeName: 'PRJ-JARVIS-CORE',
    name: 'Trợ Lý AI Phòng Lab & Bàn Hologram Trung Tâm',
    tagline:
      'Mơ làm siêu trí tuệ nhân tạo J.A.R.V.I.S. kèm bàn kính Hologram xoay 3D giữa phòng như Tony Stark. Thực tế: Hỏi "Mấy giờ rồi?" thì mất 45 giây suy nghĩ, sập VRAM rồi bật nhầm bình nóng lạnh.',
    ghostStatus: 'Ảo giác ngôn ngữ cấp Vũ Trụ — 28% Hoàn thành',
    damageReport: 'Tràn VRAM sập nguồn 19 lần, nứt 1 mặt kính cường lực cảm ứng do máy chiếu quá nhiệt, nhận nhầm tiếng ho thành lệnh "Xóa sạch Database".',
    timeParadox: 'Dự kiến: 1 tháng | Thực tế đã ngâm: 11 tháng (90% thời gian để render vòng tròn vàng cho giống phim)',
    completionPercent: 28,
    dustLevel: 64,
    smoking: false,
    position: [0, 0, -0.8],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Bàn kính cường lực cảm ứng đa điểm tích hợp trên bệ lõi nguồn Arc Reactor trung tâm hầm.' },
        { status: 'DangNgap', description: 'Mảng 8 micro định hướng beamforming (Hiện chỉ nghe rõ tiếng quạt tản nhiệt của chính nó).' },
        { status: 'TrongMo', description: 'Cụm máy chiếu Laser Volumetric tạo ảnh nổi 3D giữa không trung không cần kính VR.' },
      ],
      firmware: [
        { status: 'Xong', description: 'Mạch điều khiển vòng LED ma trận & cảm biến tiệm cận vẫy tay kiểu Stark Industries.' },
        { status: 'DangNgap', description: 'Bridge điều khiển toàn bộ đèn xưởng, máy in 3D và nguồn bàn lab bằng giọng nói.' },
      ],
      software: [
        { status: 'DangNgap', description: 'Local LLM + Whisper STT + giọng nói lịch lãm kiểu quản gia Anh quốc (Đang bị nói lắp khi GPU quá 90°C).' },
        { status: 'TrongMo', description: 'Tự động thiết kế mạch PCB, tự đặt linh kiện và tự viết báo cáo xin lỗi sếp khi trễ deadline.' },
      ],
    },
  },
  {
    id: 'sky-ghost',
    codeName: 'PRJ-SKY-GHOST',
    name: 'Drone Tự Hành Nội Khu',
    tagline:
      'Mộng mơ làm đội bay tuần tra nhà máy tự động như phim. Thực tế: Máy cắt cỏ bay không người lái kiêm máy chém rèm cửa, hiện đang bị xích chặt vào khung test trên bàn.',
    ghostStatus: 'Bay lên được nhưng hạ cánh bằng... nóc tủ — 30% Hoàn thành',
    damageReport: 'Gãy 14 cánh quạt, phồng 2 cục pin LiPo, xước 1 mảng tường vôi.',
    timeParadox: 'Dự kiến: 1 tháng | Thực tế đã ngâm: Hơn 1 năm',
    completionPercent: 30,
    dustLevel: 78,
    smoking: true,
    position: [3.2, 0, -5.4],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Khung Carbon 250mm + Động cơ Brushless + ESC 4-in-1 neo trên giàn giáo nhôm 80/20 mặt bàn.' },
        { status: 'DangNgap', description: 'Tự thiết kế mạch Flight Controller (Đang chống rung cho cảm biến IMU bằng... mút rửa bát).' },
        { status: 'TrongMo', description: 'Cụm Optical Flow + LiDAR mini để không tự sát vào tường.' },
      ],
      firmware: [
        { status: 'DangNgap', description: 'Cân chỉnh bộ điều khiển PID (Hiện tại drone đang lắc theo nhịp nhạc Vinahey).' },
        { status: 'TrongMo', description: 'Giao thức MAVLink truyền thông số về trạm mặt đất.' },
      ],
      software: [
        { status: 'TrongMo', description: 'Bản đồ 3D điều khiển đường bay tự động kiểu chỉ đâu bay đó.' },
      ],
    },
  },
  {
    id: 'iron-biped',
    codeName: 'PRJ-IRON-BIPED',
    name: 'Robot Hình Người Đôi Chân',
    tagline:
      'Khởi đầu với giấc mơ chế tạo Optimus Prime. Hiện tại mới dừng ở mức chế tạo được... cái chặn giấy công nghệ cao hình cái đùi.',
    ghostStatus: 'Siêu Dự Án Ma (Độ ảo tưởng: Vô cực) — 12% Hoàn thành',
    damageReport: 'Chưa nổ con IC nào vì... mới chỉ dám vẽ 3D trên máy tính.',
    timeParadox: 'Dự kiến: 1 năm | Thực tế: Dự kiến truyền lại cho đời cháu code nốt',
    completionPercent: 12,
    dustLevel: 96,
    smoking: false,
    position: [6.0, 0, -1.8],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'DangNgap', description: 'Thiết kế CAD 3D khớp truyền động BLDC Quasi-Direct Drive (Đã sửa bản vẽ 19 lần).' },
        { status: 'TrongMo', description: 'Mạch phân phối nguồn dòng xả cao + BMS quản lý pin không nổ.' },
        { status: 'TrongMo', description: 'Gia công CNC nhôm 6061 nguyên khối cho khung xương.' },
      ],
      firmware: [
        { status: 'DangNgap', description: 'Mạng giao tiếp CAN-FD điều khiển đồng bộ 12 bậc tự do (DoF) tần số 1kHz.' },
        { status: 'TrongMo', description: 'Thuật toán tự cân bằng động khi bị đá vào đít.' },
      ],
      software: [
        { status: 'TrongMo', description: 'Huấn luyện AI tập đi bằng Reinforcement Learning (Trên mô phỏng robot đang... trồng cây chuối).' },
        { status: 'TrongMo', description: 'Web UI Digital Twin 3D theo dõi góc khớp và nhiệt độ từng motor.' },
      ],
    },
  },
];

export const mockStats: LabStats = {
  friedIcCount: 27,
  viewerPressure: 3,
  voltage: 5.0,
  voltageSagging: false,
  totalIncense: 0,
  totalBonks: 0,
  mosfetExplosions: 0,
  averageDust: 73,
};

export const mockExcuses: string[] = [
  'TELEMETRY: Mạch chạy trên mô phỏng rất mượt, nhưng cắm điện thật thì aptomat nhảy cái tách.',
  'CẢNH BÁO: Đã mua thêm 3 bộ module I/O mới trong khi 5 dự án cũ vẫn đang phủ bụi trên 60%.',
  'Phát hiện lỗi tâm linh: Hôm qua chạy ngon, sáng nay bật lên đứng im dù không ai sửa dòng code nào.',
  'Linh kiện đặt từ tháng 3 vẫn "đang vận chuyển". Kiến nghị cầu hương thêm cho lô hàng.',
  'Phân tích cho thấy 73% thời gian "code dự án" thực chất là ngồi ngắm nó phủ bụi.',
  'Con ốc kẹt trên khung drone đã phát triển ý thức riêng và từ chối nhúc nhích. Đề xuất đàm phán.',
  'Nguồn 5V sụt còn 3.1V. Nguyên nhân: cắm chung ổ với ấm siêu tốc.',
  'Khói ma thuật (magic smoke) đã thoát ra khỏi MOSFET. Không thể nhồi lại. Tuyệt vọng.',
  'PID drone đã được tune 412 lần. Drone vẫn lắc theo nhạc Vinahey. Kết luận: drone có gu âm nhạc.',
  'Bản vẽ CAD khớp chân robot sửa lần thứ 20 đang chờ "xem lại cho ngầu". ETA: đời cháu.',
  'Dust sensor ghi nhận độ bụi vượt ngưỡng đo. Cảm biến đã từ chức.',
  'REMOTE_IO: Đèn đỏ SF/BF trên cụm PROFINET nhấp nháy đúng nhịp nhạc đám cưới, TIA Portal từ chối nhận họ hàng.',
  'REMOTE_IO: Ai đó vừa đấu nhầm 220VAC vào chân DI 24VDC — 4 con opto PC817 đã thăng thiên trong ánh hào quang.',
  'JARVIS_CORE: Hỏi "Mấy giờ rồi?" mất 45 giây suy nghĩ, tràn 12GB VRAM rồi bật nhầm bình nóng lạnh tầng trên.',
  'Đề xuất đổi tên dự án thành "bảo tàng" để việc trễ tiến độ trở thành tính năng.',
];

export const mockGraveyard: GraveyardEntry[] = [
  { id: 'g1', component: 'STM32F407VET6', epitaph: 'Hưởng dương 0.2 giây', causeOfDeath: 'Cắm nhầm 24V vào chân 3.3V', diedAt: new Date().toISOString() },
  { id: 'g2', component: 'Cặp MOSFET IRF3205', epitaph: 'Ra đi để lại làn khói trắng thơm mùi tuyệt vọng', causeOfDeath: 'Quên gắn tản nhiệt + quá tải động cơ', diedAt: new Date().toISOString() },
  { id: 'g3', component: 'Cảm biến IMU MPU6050', epitaph: 'Sống lệch lạc, chết cũng lệch lạc (drift 40°/s)', causeOfDeath: 'Rơi từ độ cao 1.2m trong buổi test bay đầu tiên', diedAt: new Date().toISOString() },
  { id: 'g4', component: 'Arduino Nano Every', epitaph: 'Nạp code 3.000 lần không một lời than vãn', causeOfDeath: 'Mỏ hàn 450°C đặt nhầm lên chip', diedAt: new Date().toISOString() },
  { id: 'g5', component: 'ESC 4-in-1 35A', epitaph: 'Phát sáng rực rỡ như pháo hoa, đúng 1 lần', causeOfDeath: 'Hàn ngược cực tụ bù lúc 2 giờ sáng', diedAt: new Date().toISOString() },
  { id: 'g6', component: 'Raspberry Pi 4 - 4GB', epitaph: 'Chết đứng trong tư thế boot kernel panic', causeOfDeath: 'Chạy YOLOv8 + Chrome 40 tab cùng lúc', diedAt: new Date().toISOString() },
  { id: 'g7', component: 'Servo MG996R x6', epitaph: 'Kêu rít như đàn nhị ma rồi im lặng vĩnh viễn', causeOfDeath: 'Bị ép gập 180° bởi thuật toán chưa kiểm chứng', diedAt: new Date().toISOString() },
  { id: 'g11', component: '4x Opto PC817 (Module DI 24V)', epitaph: 'Cách ly quang học thành công... bằng cách tự nổ tung', causeOfDeath: 'Thợ điện đấu nhầm dây lửa 220VAC vào ngõ vào 24VDC', diedAt: new Date().toISOString() },
  { id: 'g12', component: 'Chip PHY LAN8720A PROFINET', epitaph: 'Nhấp nháy đèn vàng lần cuối rồi tắt lịm', causeOfDeath: 'Xung sét cảm ứng từ biến tần 15kW đặt sát bên cạnh', diedAt: new Date().toISOString() },
  { id: 'g13', component: 'Nguồn RTX 3060 Nuôi J.A.R.V.I.S.', epitaph: 'Cống hiến hết mình để render 1 câu chào buổi sáng', causeOfDeath: 'Sụt áp toàn hầm khi vừa chạy LLM vừa đun mì tôm', diedAt: new Date().toISOString() },
];

export const mockBadIdeas: BadIdea[] = [
  {
    id: 'b1',
    title: 'Robot tự động đi mua trà sữa, tích hợp blockchain để chứng minh trà sữa thật',
    submittedBy: 'Thánh Xúi Dại #1',
    cursedLevel: 94,
    upvotes: 13,
    submittedAt: new Date().toISOString(),
  },
];

export const mockRoasts: RoastComment[] = [
  { id: 'r1', projectId: 'fork-eye', author: 'Bác Tài Ca Đêm', role: 'Nạn Nhân Tiềm Năng', text: "AI báo 'người' ở góc khuất. Tôi chạy qua xem — đó là cái cột. Cột đã đứng đó 12 năm, chưa từng đi lại.", at: new Date().toISOString() },
  { id: 'r2', projectId: 'fork-eye', author: 'Kỹ Sư Bếp Núc', role: 'Thánh Xúi Dại Cấp 9', text: 'Băng dính điện chống bụi IP65 là một bước tiến lớn của ngành tiêu chuẩn quốc tế.', at: new Date().toISOString() },
  { id: 'r5', projectId: 'sky-ghost', author: 'Chủ Rèm Cửa', role: 'Nạn Nhân Đã Xác Nhận', text: 'Nó chém rèm cửa phòng khách tôi thành 4 mảnh đều nhau. Ít ra độ chính xác cắt thì khỏi chê.', at: new Date().toISOString() },
  { id: 'r6', projectId: 'sky-ghost', author: 'Thợ Tune PID Thất Nghiệp', role: 'Đồng Nghiệp Cũ', text: '412 lần tune PID mà drone vẫn lắc theo nhạc sàn — vấn đề không nằm ở PID, nằm ở playlist.', at: new Date().toISOString() },
  { id: 'r9', projectId: 'iron-biped', author: 'Nhà Đầu Tư Thiên Thần', role: 'Đã Rút Vốn', text: "Pitch deck nói 'Optimus Prime tại gia'. Deliverable sau 1 năm: 1 cái đùi và 19 file CAD tên giống hệt nhau.", at: new Date().toISOString() },
  { id: 'r10', projectId: 'iron-biped', author: 'Robot Trong Mô Phỏng', role: 'Nhân Chứng Sống', text: 'Tôi xác nhận trong mô phỏng nó đi được 3 bước rồi trồng cây chuối. Thuật toán cân bằng hoạt động... ngược.', at: new Date().toISOString() },
  { id: 'r13', projectId: 'remote-io', author: 'Kỹ Sư Tủ Điện PLC', role: 'Nạn Nhân TIA Portal', text: "Quảng cáo 'chuẩn Siemens ET 200SP nội địa', cắm cáp xanh PROFINET vào thì đèn đỏ BF chớp như đèn còi cảnh sát.", at: new Date().toISOString() },
  { id: 'r14', projectId: 'remote-io', author: 'Thợ Đấu Tủ Ca 3', role: 'Người Thử Độ Bền Opto', text: 'Cầu đấu Push-in kẹt cứng đến mức rút sợi dây 0.75mm² ra thì bay luôn cả vỏ nhựa lẫn thanh ray DIN.', at: new Date().toISOString() },
  { id: 'r15', projectId: 'jarvis-core', author: 'Tony Stark Hàng Shopee', role: 'Chủ Nhân Bị Phản Bội', text: "Tôi hô 'J.A.R.V.I.S., bật đèn bàn hàn!' — nó im lặng 30 giây suy ngẫm triết học rồi tắt luôn aptomat tổng.", at: new Date().toISOString() },
  { id: 'r16', projectId: 'jarvis-core', author: 'Quạt Tản Nhiệt GPU', role: 'Lao Động Khổ Sai', text: "Vòng cầu vàng xoay đẹp đấy, chỉ tốn nhẹ 350W điện để trả lời câu 'Hôm nay thứ mấy' sai mất 2 ngày.", at: new Date().toISOString() },
];
