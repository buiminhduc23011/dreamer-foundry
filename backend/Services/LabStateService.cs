using System.Text.Json;
using System.Text.Json.Serialization;
using GhostLab.Models;

namespace GhostLab.Services;

/// <summary>
/// Thread-safe in-memory lab state, persisted to lab-state.json so the dust
/// level canonically survives restarts. Seeded with the 6 ghost projects.
/// </summary>
public class LabStateService
{
    private readonly object _lock = new();
    private readonly string _statePath;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public List<DustyProject> Projects { get; private set; } = new();
    public List<GraveyardEntry> Graveyard { get; private set; } = new();
    public List<BadIdea> BadIdeas { get; private set; } = new();
    public List<RoastComment> Roasts { get; private set; } = new();
    public LabStats Stats { get; private set; } = new();
    public List<string> Excuses { get; } = new()
    {
        "TELEMETRY: Mạch chạy trên mô phỏng rất mượt, nhưng cắm điện thật thì aptomat nhảy cái tách.",
        "CẢNH BÁO: Đã mua thêm 3 bộ cảm biến mới trong khi 5 dự án cũ vẫn đang phủ bụi trên 60%.",
        "Phát hiện lỗi tâm linh: Hôm qua chạy ngon, sáng nay bật lên đứng im dù không ai sửa dòng code nào.",
        "Linh kiện đặt từ tháng 3 vẫn 'đang vận chuyển'. Kiến nghị cầu hương thêm cho lô hàng.",
        "Phân tích cho thấy 73% thời gian 'code dự án' thực chất là ngồi ngắm nó phủ bụi.",
        "Con ốc kẹt trên khung drone đã phát triển ý thức riêng và từ chối nhúc nhích. Đề xuất đàm phán.",
        "Nguồn 5V sụt còn 3.1V. Nguyên nhân: cắm chung ổ với ấm siêu tốc.",
        "Khói ma thuật (magic smoke) đã thoát ra khỏi MOSFET. Không thể nhồi lại. Tuyệt vọng.",
        "PID drone đã được tune 412 lần. Drone vẫn lắc theo nhạc Vinahey. Kết luận: drone có gu âm nhạc.",
        "Bản vẽ CAD khớp chân robot sửa lần thứ 20 đang chờ 'xem lại cho ngầu'. ETA: đời cháu.",
        "Dust sensor ghi nhận độ bụi vượt ngưỡng đo. Cảm biến đã từ chức.",
        "AGV vừa đâm vào chân bàn lần thứ 34. Bàn đã được đổi chỗ, AGV đổi theo. Như có mối thù.",
        "Quạt hút khói kêu to hơn cả tiếng hàn. Lá phổi an toàn, màng nhĩ thì không.",
        "AMR_SLAM: Xoay vòng trầm cảm 3 vòng rồi tự nhận ra bản đồ. Vẫn tuyên bố đang 'tái cân bằng hệ tọa độ'.",
        "Đề xuất đổi tên dự án thành 'bảo tàng' để việc trễ tiến độ trở thành tính năng."
    };

    public LabStateService(IWebHostEnvironment env)
    {
        _statePath = Path.Combine(env.ContentRootPath, "lab-state.json");
        Load();
    }

    private void Load()
    {
        lock (_lock)
        {
            try
            {
                if (File.Exists(_statePath))
                {
                    var snap = JsonSerializer.Deserialize<LabSnapshot>(File.ReadAllText(_statePath), JsonOpts);
                    if (snap is { Projects.Count: > 0 })
                    {
                        Projects = snap.Projects;
                        Graveyard = snap.Graveyard ?? SeedGraveyard();
                        BadIdeas = snap.BadIdeas ?? new();
                        Roasts = snap.Roasts ?? SeedRoasts();
                        Stats = snap.Stats ?? new LabStats();

                        // Roster luôn sync theo seed mới nhất — static content lấy từ seed,
                        // chỉ giữ lại bụi/hương/gõ/khói đã tích lũy theo id.
                        {
                            var fresh = SeedProjects();
                            foreach (var p in fresh)
                            {
                                var old = Projects.FirstOrDefault(o => o.Id == p.Id);
                                if (old is null) continue;
                                p.DustLevel = old.DustLevel;
                                p.IncenseCount = old.IncenseCount;
                                p.BonkCount = old.BonkCount;
                                p.Smoking = old.Smoking;
                            }
                            Projects = fresh;
                        }

                        // Bổ sung roast/mộ seed của project mới khi state cũ chưa có — check theo Id để deferred Where không nuốt mất entry thứ 2.
                        Roasts.AddRange(SeedRoasts().Where(r => GetProject(r.ProjectId) != null && Roasts.All(x => x.Id != r.Id)));
                        Graveyard.AddRange(SeedGraveyard().Where(g => Graveyard.All(x => x.Component != g.Component)));
                        Save();
                        return;
                    }
                }
            }
            catch { /* corrupted save: reseed, the lab has seen worse */ }

            Projects = SeedProjects();
            Graveyard = SeedGraveyard();
            BadIdeas = new();
            Roasts = SeedRoasts();
            Stats = new LabStats();
            Save();
        }
    }

    public void Save()
    {
        lock (_lock)
        {
            var snap = new LabSnapshot { Projects = Projects, Graveyard = Graveyard, BadIdeas = BadIdeas, Roasts = Roasts, Stats = Stats };
            File.WriteAllText(_statePath, JsonSerializer.Serialize(snap, JsonOpts));
        }
    }

    public DustyProject? GetProject(string id) =>
        Projects.FirstOrDefault(p => p.Id.Equals(id, StringComparison.OrdinalIgnoreCase));

    public T Mutate<T>(Func<T> action)
    {
        lock (_lock)
        {
            var result = action();
            Save();
            return result;
        }
    }

    public double AverageDust() =>
        Projects.Count == 0 ? 0 : Projects.Average(p => p.DustLevel);

    public string RandomExcuse() => Excuses[Random.Shared.Next(Excuses.Count)];

    private class LabSnapshot
    {
        public List<DustyProject> Projects { get; set; } = new();
        public List<GraveyardEntry>? Graveyard { get; set; }
        public List<BadIdea>? BadIdeas { get; set; }
        public List<RoastComment>? Roasts { get; set; }
        public LabStats? Stats { get; set; }
    }

    private static List<DustyProject> SeedProjects() => new()
    {
        new DustyProject
        {
            Id = "fork-eye",
            CodeName = "PRJ-FORK-EYE",
            Name = "Camera AI An Toàn Xe Nâng",
            Tagline = "Cứu các bác tài xe nâng khỏi những pha lùi xe đi vào lòng đất ở góc khuất xưởng. Hiện tại AI đang nhận diện nhầm cái cột nhà là người.",
            GhostStatus = "Đắp chiếu nhẹ — 65% Hoàn thành",
            DamageReport = "Cháy 1 cáp CSI, gãy 3 ngàm vỏ in 3D, kẹt 1 con ốc không vặn ra được.",
            TimeParadox = "Dự kiến: 2 tuần | Thực tế đã ngâm: 7 tháng",
            CompletionPercent = 65,
            DustLevel = 45,
            Smoking = false,
            Position = new[] { -6.2, 0.0, -2.0 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Mạch hạ áp Buck 48V xuống 12V/5V chống nhiễu công nghiệp (Đã hết bốc khói sau lần sửa thứ 4)." },
                    new() { Status = RoadmapStatus.Xong, Description = "Cụm OAK-1 W AI Camera + Raspberry Pi + Màn hình 5-inch câu dây chằng chịt trên bàn." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Vỏ bọc chuẩn IP65 chống bụi xưởng (Hiện tại đang chống bụi bằng... băng dính điện)." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Watchdog timer tự động giả vờ như không có chuyện gì xảy ra và reset khi treo." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Kích hoạt còi hú công suất lớn (Đang tạm tắt vì mỗi lần test làm kỹ sư giật mình rơi mỏ hàn)." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Pipeline AI nhận diện người & vật cản real-time ở góc khuất độ trễ thấp." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Dashboard thống kê số lần tài xế \"suýt mất thưởng Tết\" theo ca làm việc qua Wi-Fi." },
                }
            }
        },
        new DustyProject
        {
            Id = "smoke-trap",
            CodeName = "PRJ-SMOKE-TRAP",
            Name = "Trạm Hàn Thông Minh & Hút Khói Tự Động",
            Tagline = "Sinh ra để bảo vệ lá phổi kỹ sư khỏi nhựa thông, nhưng hiện tại nó là cái máy phát ra tiếng kêu to hơn máy cày.",
            GhostStatus = "Đang chế tạo dở dang — 50% Hoàn thành",
            DamageReport = "Chảy 1 ống hút nhựa PVC do để gần mỏ hàn 400 độ.",
            TimeParadox = "Dự kiến: 3 ngày | Đã ngâm: 4 tháng",
            CompletionPercent = 50,
            DustLevel = 60,
            Smoking = false,
            Position = new[] { -3.4, 0.0, -5.2 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Quạt lồng sóc 24V tháo từ nguồn máy chủ cũ (Hút cực mạnh, ồn khủng khiếp)." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Phễu hút in 3D bằng nhựa PLA (Đang bị cong vênh vì nắng chiếu qua cửa sổ)." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Đọc nhiệt độ cảm biến DS18B20 để tự động bật quạt khi mỏ hàn nóng lên." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Điều băm xung PWM tốc độ quạt (Hiện tại chỉnh tốc độ nào cũng kêu ù ù như phản lực cất cánh)." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.TrongMo, Description = "App OLED hiển thị lượng nhựa thông đã hít phải trong đời." },
                }
            }
        },
        new DustyProject
        {
            Id = "sky-ghost",
            CodeName = "PRJ-SKY-GHOST",
            Name = "Drone Tự Hành Nội Khu",
            Tagline = "Mộng mơ làm đội bay tuần tra nhà máy tự động như phim. Thực tế: Máy cắt cỏ bay không người lái kiêm máy chém rèm cửa.",
            GhostStatus = "Bay lên được nhưng hạ cánh bằng... nóc tủ — 30% Hoàn thành",
            DamageReport = "Gãy 14 cánh quạt, phồng 2 cục pin LiPo, xước 1 mảng tường vôi.",
            TimeParadox = "Dự kiến: 1 tháng | Thực tế đã ngâm: Hơn 1 năm",
            CompletionPercent = 30,
            DustLevel = 78,
            Smoking = true,
            Position = new[] { 0.0, 1.9, -6.2 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Khung Carbon 250mm + Động cơ Brushless + ESC 4-in-1." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Tự thiết kế mạch Flight Controller (Đang chống rung cho cảm biến IMU bằng... mút rửa bát)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Cụm Optical Flow + LiDAR mini để không tự sát vào tường." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Cân chỉnh bộ điều khiển PID (Hiện tại drone đang lắc theo nhịp nhạc Vinahey)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Giao thức MAVLink truyền thông số về trạm mặt đất." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.TrongMo, Description = "Bản đồ 3D điều khiển đường bay tự động kiểu chỉ đâu bay đó." },
                }
            }
        },
        new DustyProject
        {
            Id = "ghost-agv",
            CodeName = "PRJ-GHOST-AGV",
            Name = "Xe AGV Tự Hành Gầm Thấp",
            Tagline = "Mơ về một hệ thống AGV thông minh chạy theo băng từ hoặc QR code trong nhà xưởng. Thực tế: Nó cứ lao thẳng vào chân bàn.",
            GhostStatus = "Chạy thử nghiệm đâm tường — 40% Hoàn thành",
            DamageReport = "Cán đứt 1 cáp sạc laptop, mẻ cản va trước do va vào tủ sắt.",
            TimeParadox = "Dự kiến: 2 tháng | Đã ngâm: 9 tháng",
            CompletionPercent = 40,
            DustLevel = 82,
            Smoking = false,
            Position = new[] { 3.4, 0.0, -5.2 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Khung thép laser cut + 2 động cơ DC giảm tốc kèm Encoder." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Mạch điều khiển cầu H BTS7960 (Đang tỏa nhiệt khủng khiếp khi chở nặng 5kg)." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Thuật toán điều khiển động cơ vi sai (Differential Drive) tiến lùi cơ bản." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Đọc cảm biến dò line phản xạ hồng ngoại (Hơi ngu ngơ khi gặp ánh sáng mạnh)." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.TrongMo, Description = "Hệ thống Fleet Management System (FMS) điều phối xe trên nền Web React + SignalR." },
                }
            }
        },
        new DustyProject
        {
            Id = "iron-biped",
            CodeName = "PRJ-IRON-BIPED",
            Name = "Robot Hình Người Đôi Chân",
            Tagline = "Khởi đầu với giấc mơ chế tạo Optimus Prime. Hiện tại mới dừng ở mức chế tạo được... cái chặn giấy công nghệ cao hình cái đùi.",
            GhostStatus = "Siêu Dự Án Ma (Độ ảo tưởng: Vô cực) — 12% Hoàn thành",
            DamageReport = "Chưa nổ con IC nào vì... mới chỉ dám vẽ 3D trên máy tính.",
            TimeParadox = "Dự kiến: 1 năm | Thực tế: Dự kiến truyền lại cho đời cháu code nốt",
            CompletionPercent = 12,
            DustLevel = 96,
            Smoking = false,
            Position = new[] { 6.2, 0.0, -2.0 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Thiết kế CAD 3D khớp truyền động BLDC Quasi-Direct Drive (Đã sửa bản vẽ 19 lần)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Mạch phân phối nguồn dòng xả cao + BMS quản lý pin không nổ." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Gia công CNC nhôm 6061 nguyên khối cho khung xương." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Mạng giao tiếp CAN-FD điều khiển đồng bộ 12 bậc tự do (DoF) tần số 1kHz." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Thuật toán tự cân bằng động khi bị đá vào đít." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.TrongMo, Description = "Huấn luyện AI tập đi bằng Reinforcement Learning (Trên mô phỏng robot đang... trồng cây chuối)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Web UI Digital Twin 3D theo dõi góc khớp và nhiệt độ từng motor." },
                }
            }
        },
        new DustyProject
        {
            Id = "amr-slam",
            CodeName = "PRJ-AMR-SLAM",
            Name = "AMR Định Vị SLAM & Điều Hướng Laser",
            Tagline = "Đỉnh cao định vị LiDAR SLAM tự chủ không cần băng từ. Thực tế: Cứ bật lên là AMR xoay vòng tròn trầm cảm vì không nhận ra bản đồ.",
            GhostStatus = "Mất định vị trong không gian — 45% Hoàn thành",
            DamageReport = "Rơi vỡ 1 cảm biến LiDAR 2D do cẩu thả khi bê ra bãi test.",
            TimeParadox = "Dự kiến: 3 tháng | Đã ngâm: 6 tháng",
            CompletionPercent = 45,
            DustLevel = 70,
            Smoking = false,
            Position = new[] { 0.0, 0.0, 3.0 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Khung cơ khí 4 module Swerve Drive độc lập + SBC công nghiệp + Cảm biến LiDAR 2D." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Mạch phân phối nguồn 24V cho hệ thống điều khiển động cơ (Steer BLDC + Drive BLDC)." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Driver điều khiển Swerve Drive: độc lập góc lái + tốc độ lăn cho từng module bánh." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Giao tiếp ROS2 micro-ROS trên vi điều khiển trung tâm (Thường xuyên bị mất gói tin qua UART)." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Bản đồ Occupancy Grid Mapping bằng ROS2 Nav2 stack." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Tính năng tự động né vật cản động bằng thuật toán DWA (Dynamic Window Approach) không tông vào nhân viên xưởng." },
                }
            }
        }
    };

    private static List<GraveyardEntry> SeedGraveyard() => new()
    {
        new() { Id = "g1", Component = "STM32F407VET6", Epitaph = "Hưởng dương 0.2 giây", CauseOfDeath = "Cắm nhầm 24V vào chân 3.3V", DiedAt = DateTime.UtcNow.AddMonths(-7) },
        new() { Id = "g2", Component = "Cặp MOSFET IRF3205", Epitaph = "Ra đi để lại làn khói trắng thơm mùi tuyệt vọng", CauseOfDeath = "Quên gắn tản nhiệt + quá tải động cơ", DiedAt = DateTime.UtcNow.AddMonths(-6) },
        new() { Id = "g3", Component = "Cảm biến IMU MPU6050", Epitaph = "Sống lệch lạc, chết cũng lệch lạc (drift 40°/s)", CauseOfDeath = "Rơi từ độ cao 1.2m trong buổi test bay đầu tiên", DiedAt = DateTime.UtcNow.AddMonths(-5) },
        new() { Id = "g4", Component = "Arduino Nano Every", Epitaph = "Nạp code 3.000 lần không một lời than vãn", CauseOfDeath = "Mỏ hàn 450°C đặt nhầm lên chip", DiedAt = DateTime.UtcNow.AddMonths(-4) },
        new() { Id = "g5", Component = "ESC 4-in-1 35A", Epitaph = "Phát sáng rực rỡ như pháo hoa, đúng 1 lần", CauseOfDeath = "Hàn ngược cực tụ bù lúc 2 giờ sáng", DiedAt = DateTime.UtcNow.AddMonths(-3) },
        new() { Id = "g6", Component = "Raspberry Pi 4 - 4GB", Epitaph = "Chết đứng trong tư thế boot kernel panic", CauseOfDeath = "Chạy YOLOv8 + Chrome 40 tab cùng lúc", DiedAt = DateTime.UtcNow.AddMonths(-2) },
        new() { Id = "g7", Component = "Servo MG996R x6", Epitaph = "Kêu rít như đàn hồi ma rồi im lặng vĩnh viễn", CauseOfDeath = "Bị ép gập 180° bởi thuật toán chưa kiểm chứng", DiedAt = DateTime.UtcNow.AddMonths(-1) },
        new() { Id = "g8", Component = "Ống hút PVC Ø75", Epitaph = "Uốn cong như giấc mơ gập khúc của nó", CauseOfDeath = "Để cạnh mỏ hàn 400°C trong tầm 4 giây", DiedAt = DateTime.UtcNow.AddDays(-19) },
        new() { Id = "g9", Component = "Cầu H BTS7960 #2", Epitaph = "Tản nhiệt nóng đến mức nướng được bánh mì", CauseOfDeath = "Chở 5kg lên dốc 12° liên tục 3 phút", DiedAt = DateTime.UtcNow.AddDays(-6) },
        new() { Id = "g10", Component = "Cảm biến LiDAR 2D RPLIDAR", Epitaph = "Quét 360° được hết mọi thứ trừ tương lai của nó", CauseOfDeath = "Rơi khỏi tay khi bê AMR ra bãi test", DiedAt = DateTime.UtcNow.AddDays(-3) },
    };

    private static List<RoastComment> SeedRoasts() => new()
    {
        new() { Id = "r1", ProjectId = "fork-eye", Author = "Bác Tài Ca Đêm", Role = "Nạn Nhân Tiềm Năng", Text = "AI báo 'người' ở góc khuất. Tôi chạy qua xem — đó là cái cột. Cột đã đứng đó 12 năm, chưa từng đi lại.", At = DateTime.UtcNow.AddDays(-12) },
        new() { Id = "r2", ProjectId = "fork-eye", Author = "Kỹ Sư Bếp Núc", Role = "Thánh Xúi Dại Cấp 9", Text = "Băng dính điện chống bụi IP65 là một bước tiến lớn của ngành tiêu chuẩn quốc tế.", At = DateTime.UtcNow.AddDays(-9) },
        new() { Id = "r3", ProjectId = "smoke-trap", Author = "Anh Bán Quạt Cũ", Role = "Nhà Cung Cấp Tiếng Ồn", Text = "Con quạt này trước hút khói cho 12 con server chạy coin. Giờ hút khói hàn mà kêu như bị bóc lột.", At = DateTime.UtcNow.AddDays(-7) },
        new() { Id = "r4", ProjectId = "smoke-trap", Author = "Chuyên Gia Nhiệt Đới", Role = "Nhà Nghiên Cứu PLA Cong Vênh", Text = "In phễu PLA rồi phơi nắng là cách nhanh nhất để chuyển đổi vật liệu sang dạng nghệ thuật trừu tượng.", At = DateTime.UtcNow.AddDays(-4) },
        new() { Id = "r5", ProjectId = "sky-ghost", Author = "Chủ Rèm Cửa", Role = "Nạn Nhân Đã Xác Nhận", Text = "Nó chém rèm cửa phòng khách tôi thành 4 mảnh đều nhau. Ít ra độ chính xác cắt thì khỏi chê.", At = DateTime.UtcNow.AddDays(-15) },
        new() { Id = "r6", ProjectId = "sky-ghost", Author = "Thợ Tune PID Thất Nghiệp", Role = "Đồng Nghiệp Cũ", Text = "412 lần tune PID mà drone vẫn lắc theo nhạc sàn — vấn đề không nằm ở PID, nằm ở playlist.", At = DateTime.UtcNow.AddDays(-11) },
        new() { Id = "r7", ProjectId = "ghost-agv", Author = "Chân Bàn Số 3", Role = "Nạn Nhân Tái Phạm", Text = "Nó đâm tôi 34 lần. Tôi đổi chỗ, nó đổi quỹ đạo. Tôi bắt đầu tin là có mối thù cá nhân.", At = DateTime.UtcNow.AddDays(-8) },
        new() { Id = "r8", ProjectId = "ghost-agv", Author = "Kỹ Sư FMS", Role = "Người Viết Fleet Management Cho 1 Xe", Text = "Làm hệ thống điều phối đội xe cho đúng 1 con AGV là đỉnh cao của over-engineering. Tôi tự hào.", At = DateTime.UtcNow.AddDays(-3) },
        new() { Id = "r9", ProjectId = "iron-biped", Author = "Nhà Đầu Tư Thiên Thần", Role = "Đã Rút Vốn", Text = "Pitch deck nói 'Optimus Prime tại gia'. Deliverable sau 1 năm: 1 cái đùi và 19 file CAD tên giống hệt nhau.", At = DateTime.UtcNow.AddDays(-20) },
        new() { Id = "r10", ProjectId = "iron-biped", Author = "Robot Trong Mô Phỏng", Role = "Nhân Chứng Sống", Text = "Tôi xác nhận trong mô phỏng nó đi được 3 bước rồi trồng cây chuối. Thuật toán cân bằng hoạt động... ngược.", At = DateTime.UtcNow.AddDays(-2) },
        new() { Id = "r11", ProjectId = "amr-slam", Author = "Bản Đồ Occupancy Grid", Role = "Nạn Nhân Bị Quên", Text = "Nó vẽ tôi ra rồi quên luôn tôi là ai. Mối quan hệ một chiều kiểu mới của kỷ nguyên SLAM.", At = DateTime.UtcNow.AddDays(-5) },
        new() { Id = "r12", ProjectId = "amr-slam", Author = "Chân Tủ Sắt", Role = "Nạn Nhân Tái Phạm", Text = "AGV đâm tôi vì mù đường. AMR đâm tôi sau khi quét LiDAR kỹ càng. Công nghệ tiến bộ rõ rệt.", At = DateTime.UtcNow.AddDays(-1) },
    };
}
