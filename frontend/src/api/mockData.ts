import type { BadIdea, DustyProject, GraveyardEntry, LabStats } from '../types';

/**
 * Offline seed — mirrors the .NET backend seed exactly so mock mode
 * is canonically identical to the real lab. Used when the API is unreachable.
 */
export const mockProjects: DustyProject[] = [
  {
    id: 'fork-eye',
    codeName: 'STARK-FORK-EYE',
    name: 'Camera AI An Toàn Xe Nâng',
    tagline:
      'Hệ thống thị giác máy tính cứu các bác tài khỏi những pha lùi xe đi vào lòng đất. Hiện tại AI đang nhận diện nhầm cái cột nhà là người.',
    ghostStatus: 'Đắp chiếu nhẹ — 65% Hoàn thành',
    damageReport: 'Cháy 1 cáp CSI, gãy 3 ngàm vỏ in 3D, kẹt 1 con ốc không vặn ra được.',
    timeParadox: 'Dự kiến: 2 tuần | Thực tế đã ngâm: 7 tháng',
    completionPercent: 65,
    dustLevel: 45,
    smoking: false,
    position: [-5.2, 0, -1.2],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Mạch hạ áp Buck 48V xuống 12V/5V chống nhiễu (Đã hết bốc khói sau lần sửa thứ 4).' },
        { status: 'Xong', description: 'Cụm OAK-1 W AI Camera + Raspberry Pi + Màn hình 5-inch câu dây chằng chịt trên bàn.' },
        { status: 'DangNgap', description: 'Vỏ bọc chuẩn IP65 chống bụi xưởng (Hiện tại đang chống bụi bằng... băng dính điện).' },
      ],
      firmware: [
        { status: 'Xong', description: 'Watchdog timer tự động giả vờ như không có chuyện gì xảy ra và reset khi treo.' },
        { status: 'DangNgap', description: 'Kích hoạt còi hú công suất lớn (Đang tạm tắt vì mỗi lần test làm kỹ sư giật mình rơi mỏ hàn).' },
      ],
      software: [
        { status: 'Xong', description: 'Pipeline AI nhận diện người & vật cản real-time ở góc khuất.' },
        { status: 'TrongMo', description: 'Giao diện Hologram thống kê số lần tài xế "suýt mất thưởng Tết" theo ca làm việc.' },
      ],
    },
  },
  {
    id: 'sky-ghost',
    codeName: 'STARK-SKY-GHOST',
    name: 'Drone Tự Hành Nội Khu',
    tagline:
      'Mộng mơ làm đội bay tuần tra nhà máy tự động như phim viễn tưởng. Thực tế: Máy cắt cỏ bay không người lái kiêm máy chém rèm cửa.',
    ghostStatus: 'Bay lên được nhưng hạ cánh bằng... nóc tủ — 30% Hoàn thành',
    damageReport: 'Gãy 14 cánh quạt, phồng 2 cục pin LiPo, xước 1 mảng tường vôi.',
    timeParadox: 'Dự kiến: 1 tháng | Thực tế đã ngâm: Hơn 1 năm',
    completionPercent: 30,
    dustLevel: 78,
    smoking: true,
    position: [0, 1.9, -4.4],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Khung Carbon 250mm + Động cơ Brushless + ESC 4-in-1.' },
        { status: 'DangNgap', description: 'Tự thiết kế mạch Flight Controller (Đang chống rung cho cảm biến IMU bằng... mút rửa bát).' },
        { status: 'TrongMo', description: 'Cụm Optical Flow + LiDAR mini để không tự sát vào tường.' },
      ],
      firmware: [
        { status: 'DangNgap', description: 'Cân chỉnh bộ điều khiển PID (Hiện tại drone đang lắc theo nhịp nhạc sàn).' },
        { status: 'TrongMo', description: 'Giao thức MAVLink truyền thông số về trạm mặt đất.' },
      ],
      software: [
        { status: 'TrongMo', description: 'Bản đồ 3D điều khiển đường bay tự động kiểu chỉ đâu bay đó (Hiện tại là chỉ đâu... đâm đó).' },
      ],
    },
  },
  {
    id: 'mark-biped',
    codeName: 'STARK-MARK-0.1-BIPED',
    name: 'Robot Hình Người Đôi Chân',
    tagline:
      'Khởi đầu với giấc mơ chế tạo bộ giáp Mark XLII tại gia. Hiện tại mới dừng ở mức chế tạo được... cái chặn giấy công nghệ cao hình cái đùi.',
    ghostStatus: 'Siêu Dự Án Ma (Độ ảo tưởng: Vô cực) — 12% Hoàn thành',
    damageReport: 'Chưa nổ con IC nào vì... mới chỉ dám vẽ 3D trên máy tính.',
    timeParadox: 'Dự kiến: 1 năm | Thực tế: Dự kiến viết di chúc truyền lại cho đời cháu code nốt',
    completionPercent: 12,
    dustLevel: 96,
    smoking: false,
    position: [5.2, 0, -1.2],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'DangNgap', description: 'Thiết kế CAD 3D khớp truyền động BLDC Quasi-Direct Drive (Đã sửa bản vẽ 19 lần cho ngầu).' },
        { status: 'TrongMo', description: 'Mạch phân phối nguồn dòng xả cao + BMS quản lý pin không nổ.' },
        { status: 'TrongMo', description: 'Gia công CNC nhôm 6061 nguyên khối cho khung xương.' },
      ],
      firmware: [
        { status: 'DangNgap', description: 'Mạng giao tiếp CAN-FD điều khiển đồng bộ 12 bậc tự do (DoF) tần số 1kHz.' },
        { status: 'TrongMo', description: 'Thuật toán tự cân bằng động khi bị đá vào đít (như Boston Dynamics).' },
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
  'Thưa ngài, mạch chạy trên mô phỏng rất mượt, nhưng cắm điện thật thì aptomat nhảy cái tách.',
  'Cảnh báo: Ngài đã mua thêm 3 bộ cảm biến mới trong khi 3 dự án cũ vẫn đang phủ bụi 85%.',
  'Phát hiện lỗi tâm linh: Hôm qua chạy ngon, sáng nay bật lên đứng im dù không ai sửa dòng code nào.',
  'Linh kiện đặt từ tháng 3 vẫn "đang vận chuyển". Kiến nghị ngài cầu hương thêm cho lô hàng.',
  'Phân tích cho thấy 73% thời gian "code dự án" thực chất là ngài ngồi ngắm nó phủ bụi.',
  'Con ốc kẹt trên khung drone đã phát triển ý thức riêng và từ chối nhúc nhích. Đề xuất đàm phán.',
  'Nguồn 5V sụt còn 3.1V. Nguyên nhân: ngài cắm chung ổ với ấm siêu tốc.',
  'Khói ma thuật (magic smoke) đã thoát ra khỏi MOSFET. Không thể nhồi lại. Tuyệt vọng.',
  'PID drone đã được tune 412 lần. Drone vẫn lắc theo nhạc sàn. Kết luận: drone có gu âm nhạc.',
  'Bản vẽ CAD khớp chân robot sửa lần thứ 20 đang chờ ngài "xem lại cho ngầu". ETA: đời cháu.',
  'Dust sensor ghi nhận độ bụi vượt ngưỡng đo. Cảm biến đã từ chức.',
  'Đề xuất đổi tên dự án thành "bảo tàng" để việc trễ tiến độ trở thành tính năng.',
];

export const mockGraveyard: GraveyardEntry[] = [
  { id: 'g1', component: 'STM32F407VET6', epitaph: 'Hưởng dương 0.2 giây', causeOfDeath: 'Cắm nhầm 24V vào chân 3.3V', diedAt: new Date().toISOString() },
  { id: 'g2', component: 'Cặp MOSFET IRF3205', epitaph: 'Ra đi để lại làn khói trắng thơm mùi tuyệt vọng', causeOfDeath: 'Quên gắn tản nhiệt + quá tải động cơ', diedAt: new Date().toISOString() },
  { id: 'g3', component: 'Cảm biến IMU MPU6050', epitaph: 'Sống lệch lạc, chết cũng lệch lạc (drift 40°/s)', causeOfDeath: 'Rơi từ độ cao 1.2m trong buổi test bay đầu tiên', diedAt: new Date().toISOString() },
  { id: 'g4', component: 'Arduino Nano Every', epitaph: 'Nạp code 3.000 lần không một lời than vãn', causeOfDeath: 'Mỏ hàn 450°C đặt nhầm lên chip', diedAt: new Date().toISOString() },
  { id: 'g5', component: 'ESC 4-in-1 35A', epitaph: 'Phát sáng rực rỡ như pháo hoa, đúng 1 lần', causeOfDeath: 'Hàn ngược cực tụ bù lúc 2 giờ sáng', diedAt: new Date().toISOString() },
  { id: 'g6', component: 'Raspberry Pi 4 - 4GB', epitaph: 'Chết đứng trong tư thế boot kernel panic', causeOfDeath: 'Chạy YOLOv8 + Chrome 40 tab cùng lúc', diedAt: new Date().toISOString() },
  { id: 'g7', component: 'Servo MG996R x6', epitaph: 'Kêu rít như đàn hồi ma rồi im lặng vĩnh viễn', causeOfDeath: 'Bị ép gập 180° bởi thuật toán chưa kiểm chứng', diedAt: new Date().toISOString() },
];

export const mockBadIdeas: BadIdea[] = [
  {
    id: 'b1',
    title: 'Robot tự động đi mua trà sữa, tích hợp blockchain để chứng minh trà sữa thật',
    submittedBy: 'Thánh Xúi Dại #1',
    cursedLevel: 94,
    submittedAt: new Date().toISOString(),
  },
];
