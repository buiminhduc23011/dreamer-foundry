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
    position: [-6.2, 0, -2.0],
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
    id: 'smoke-trap',
    codeName: 'PRJ-SMOKE-TRAP',
    name: 'Trạm Hàn Thông Minh & Hút Khói Tự Động',
    tagline:
      'Sinh ra để bảo vệ lá phổi kỹ sư khỏi nhựa thông, nhưng hiện tại nó là cái máy phát ra tiếng kêu to hơn máy cày.',
    ghostStatus: 'Đang chế tạo dở dang — 50% Hoàn thành',
    damageReport: 'Chảy 1 ống hút nhựa PVC do để gần mỏ hàn 400 độ.',
    timeParadox: 'Dự kiến: 3 ngày | Đã ngâm: 4 tháng',
    completionPercent: 50,
    dustLevel: 60,
    smoking: false,
    position: [-3.4, 0, -5.2],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Quạt lồng sóc 24V tháo từ nguồn máy chủ cũ (Hút cực mạnh, ồn khủng khiếp).' },
        { status: 'DangNgap', description: 'Phễu hút in 3D bằng nhựa PLA (Đang bị cong vênh vì nắng chiếu qua cửa sổ).' },
      ],
      firmware: [
        { status: 'Xong', description: 'Đọc nhiệt độ cảm biến DS18B20 để tự động bật quạt khi mỏ hàn nóng lên.' },
        { status: 'DangNgap', description: 'Điều băm xung PWM tốc độ quạt (Hiện tại chỉnh tốc độ nào cũng kêu ù ù như phản lực cất cánh).' },
      ],
      software: [
        { status: 'TrongMo', description: 'App OLED hiển thị lượng nhựa thông đã hít phải trong đời.' },
      ],
    },
  },
  {
    id: 'sky-ghost',
    codeName: 'PRJ-SKY-GHOST',
    name: 'Drone Tự Hành Nội Khu',
    tagline:
      'Mộng mơ làm đội bay tuần tra nhà máy tự động như phim. Thực tế: Máy cắt cỏ bay không người lái kiêm máy chém rèm cửa.',
    ghostStatus: 'Bay lên được nhưng hạ cánh bằng... nóc tủ — 30% Hoàn thành',
    damageReport: 'Gãy 14 cánh quạt, phồng 2 cục pin LiPo, xước 1 mảng tường vôi.',
    timeParadox: 'Dự kiến: 1 tháng | Thực tế đã ngâm: Hơn 1 năm',
    completionPercent: 30,
    dustLevel: 78,
    smoking: true,
    position: [0, 1.9, -6.2],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Khung Carbon 250mm + Động cơ Brushless + ESC 4-in-1.' },
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
    id: 'ghost-agv',
    codeName: 'PRJ-GHOST-AGV',
    name: 'Xe AGV Tự Hành Gầm Thấp',
    tagline:
      'Mơ về một hệ thống AGV thông minh chạy theo băng từ hoặc QR code trong nhà xưởng. Thực tế: Nó cứ lao thẳng vào chân bàn.',
    ghostStatus: 'Chạy thử nghiệm đâm tường — 40% Hoàn thành',
    damageReport: 'Cán đứt 1 cáp sạc laptop, mẻ cản va trước do va vào tủ sắt.',
    timeParadox: 'Dự kiến: 2 tháng | Đã ngâm: 9 tháng',
    completionPercent: 40,
    dustLevel: 82,
    smoking: false,
    position: [3.4, 0, -5.2],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Khung thép laser cut + 2 động cơ DC giảm tốc kèm Encoder.' },
        { status: 'DangNgap', description: 'Mạch điều khiển cầu H BTS7960 (Đang tỏa nhiệt khủng khiếp khi chở nặng 5kg).' },
      ],
      firmware: [
        { status: 'Xong', description: 'Thuật toán điều khiển động cơ vi sai (Differential Drive) tiến lùi cơ bản.' },
        { status: 'DangNgap', description: 'Đọc cảm biến dò line phản xạ hồng ngoại (Hơi ngu ngơ khi gặp ánh sáng mạnh).' },
      ],
      software: [
        { status: 'TrongMo', description: 'Hệ thống Fleet Management System (FMS) điều phối xe trên nền Web React + SignalR.' },
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
    position: [6.2, 0, -2.0],
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
  {
    id: 'amr-slam',
    codeName: 'PRJ-AMR-SLAM',
    name: 'AMR Định Vị SLAM & Điều Hướng Laser',
    tagline:
      'Đỉnh cao định vị LiDAR SLAM tự chủ không cần băng từ. Thực tế: Cứ bật lên là AMR xoay vòng tròn trầm cảm vì không nhận ra bản đồ.',
    ghostStatus: 'Mất định vị trong không gian — 45% Hoàn thành',
    damageReport: 'Rơi vỡ 1 cảm biến LiDAR 2D do cẩu thả khi bê ra bãi test.',
    timeParadox: 'Dự kiến: 3 tháng | Đã ngâm: 6 tháng',
    completionPercent: 45,
    dustLevel: 70,
    smoking: false,
    position: [0, 0, 3.0],
    incenseCount: 0,
    bonkCount: 0,
    roadmap: {
      hardware: [
        { status: 'Xong', description: 'Khung cơ khí 4 module Swerve Drive độc lập + SBC công nghiệp + Cảm biến LiDAR 2D.' },
        { status: 'DangNgap', description: 'Mạch phân phối nguồn 24V cho hệ thống điều khiển động cơ (Steer BLDC + Drive BLDC).' },
      ],
      firmware: [
        { status: 'Xong', description: 'Driver điều khiển Swerve Drive: độc lập góc lái + tốc độ lăn cho từng module bánh.' },
        { status: 'DangNgap', description: 'Giao tiếp ROS2 micro-ROS trên vi điều khiển trung tâm (Thường xuyên bị mất gói tin qua UART).' },
      ],
      software: [
        { status: 'Xong', description: 'Bản đồ Occupancy Grid Mapping bằng ROS2 Nav2 stack.' },
        { status: 'TrongMo', description: 'Tính năng tự động né vật cản động bằng thuật toán DWA (Dynamic Window Approach) không tông vào nhân viên xưởng.' },
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
  'CẢNH BÁO: Đã mua thêm 3 bộ cảm biến mới trong khi 5 dự án cũ vẫn đang phủ bụi trên 60%.',
  'Phát hiện lỗi tâm linh: Hôm qua chạy ngon, sáng nay bật lên đứng im dù không ai sửa dòng code nào.',
  'Linh kiện đặt từ tháng 3 vẫn "đang vận chuyển". Kiến nghị cầu hương thêm cho lô hàng.',
  'Phân tích cho thấy 73% thời gian "code dự án" thực chất là ngồi ngắm nó phủ bụi.',
  'Con ốc kẹt trên khung drone đã phát triển ý thức riêng và từ chối nhúc nhích. Đề xuất đàm phán.',
  'Nguồn 5V sụt còn 3.1V. Nguyên nhân: cắm chung ổ với ấm siêu tốc.',
  'Khói ma thuật (magic smoke) đã thoát ra khỏi MOSFET. Không thể nhồi lại. Tuyệt vọng.',
  'PID drone đã được tune 412 lần. Drone vẫn lắc theo nhạc Vinahey. Kết luận: drone có gu âm nhạc.',
  'Bản vẽ CAD khớp chân robot sửa lần thứ 20 đang chờ "xem lại cho ngầu". ETA: đời cháu.',
  'Dust sensor ghi nhận độ bụi vượt ngưỡng đo. Cảm biến đã từ chức.',
  'AGV vừa đâm vào chân bàn lần thứ 34. Bàn đã được đổi chỗ, AGV đổi theo. Như có mối thù.',
  'Quạt hút khói kêu to hơn cả tiếng hàn. Lá phổi an toàn, màng nhĩ thì không.',
  'AMR_SLAM: Xoay vòng trầm cảm 3 vòng rồi tự nhận ra bản đồ. Vẫn tuyên bố đang "tái cân bằng hệ tọa độ".',
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
  { id: 'g8', component: 'Ống hút PVC Ø75', epitaph: 'Uốn cong như giấc mơ gập khúc của nó', causeOfDeath: 'Để cạnh mỏ hàn 400°C trong tầm 4 giây', diedAt: new Date().toISOString() },
  { id: 'g9', component: 'Cầu H BTS7960 #2', epitaph: 'Tản nhiệt nóng đến mức nướng được bánh mì', causeOfDeath: 'Chở 5kg lên dốc 12° liên tục 3 phút', diedAt: new Date().toISOString() },
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
  { id: 'r3', projectId: 'smoke-trap', author: 'Anh Bán Quạt Cũ', role: 'Nhà Cung Cấp Tiếng Ồn', text: 'Con quạt này trước hút khói cho 12 con server chạy coin. Giờ hút khói hàn mà kêu như bị bóc lột.', at: new Date().toISOString() },
  { id: 'r4', projectId: 'smoke-trap', author: 'Chuyên Gia Nhiệt Đới', role: 'Nhà Nghiên Cứu PLA Cong Vênh', text: 'In phễu PLA rồi phơi nắng là cách nhanh nhất để chuyển đổi vật liệu sang dạng nghệ thuật trừu tượng.', at: new Date().toISOString() },
  { id: 'r5', projectId: 'sky-ghost', author: 'Chủ Rèm Cửa', role: 'Nạn Nhân Đã Xác Nhận', text: 'Nó chém rèm cửa phòng khách tôi thành 4 mảnh đều nhau. Ít ra độ chính xác cắt thì khỏi chê.', at: new Date().toISOString() },
  { id: 'r6', projectId: 'sky-ghost', author: 'Thợ Tune PID Thất Nghiệp', role: 'Đồng Nghiệp Cũ', text: '412 lần tune PID mà drone vẫn lắc theo nhạc sàn — vấn đề không nằm ở PID, nằm ở playlist.', at: new Date().toISOString() },
  { id: 'r7', projectId: 'ghost-agv', author: 'Chân Bàn Số 3', role: 'Nạn Nhân Tái Phạm', text: 'Nó đâm tôi 34 lần. Tôi đổi chỗ, nó đổi quỹ đạo. Tôi bắt đầu tin là có mối thù cá nhân.', at: new Date().toISOString() },
  { id: 'r8', projectId: 'ghost-agv', author: 'Kỹ Sư FMS', role: 'Người Viết Fleet Management Cho 1 Xe', text: 'Làm hệ thống điều phối đội xe cho đúng 1 con AGV là đỉnh cao của over-engineering. Tôi tự hào.', at: new Date().toISOString() },
  { id: 'r9', projectId: 'iron-biped', author: 'Nhà Đầu Tư Thiên Thần', role: 'Đã Rút Vốn', text: "Pitch deck nói 'Optimus Prime tại gia'. Deliverable sau 1 năm: 1 cái đùi và 19 file CAD tên giống hệt nhau.", at: new Date().toISOString() },
  { id: 'r10', projectId: 'iron-biped', author: 'Robot Trong Mô Phỏng', role: 'Nhân Chứng Sống', text: 'Tôi xác nhận trong mô phỏng nó đi được 3 bước rồi trồng cây chuối. Thuật toán cân bằng hoạt động... ngược.', at: new Date().toISOString() },
  { id: 'r11', projectId: 'amr-slam', author: 'Bản Đồ Occupancy Grid', role: 'Nạn Nhân Bị Quên', text: 'Nó vẽ tôi ra rồi quên luôn tôi là ai. Mối quan hệ một chiều kiểu mới của kỷ nguyên SLAM.', at: new Date().toISOString() },
  { id: 'r12', projectId: 'amr-slam', author: 'Chân Tủ Sắt', role: 'Nạn Nhân Tái Phạm', text: 'AGV đâm tôi vì mù đường. AMR đâm tôi sau khi quét LiDAR kỹ càng. Công nghệ tiến bộ rõ rệt.', at: new Date().toISOString() },
];
