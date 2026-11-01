using System.Text.Json;
using System.Text.Json.Serialization;
using DustyStarkLab.Models;

namespace DustyStarkLab.Services;

/// <summary>
/// Thread-safe in-memory lab state, persisted to lab-state.json so the dust
/// level canonically survives restarts. Seeded with the 3 ghost projects.
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
    public LabStats Stats { get; private set; } = new();
    public List<string> Excuses { get; } = new()
    {
        "Thưa ngài, mạch chạy trên mô phỏng rất mượt, nhưng cắm điện thật thì aptomat nhảy cái tách.",
        "Cảnh báo: Ngài đã mua thêm 3 bộ cảm biến mới trong khi 3 dự án cũ vẫn đang phủ bụi 85%.",
        "Phát hiện lỗi tâm linh: Hôm qua chạy ngon, sáng nay bật lên đứng im dù không ai sửa dòng code nào.",
        "Linh kiện đặt từ tháng 3 vẫn 'đang vận chuyển'. Kiến nghị ngài cầu hương thêm cho lô hàng.",
        "Phân tích cho thấy 73% thời gian 'code dự án' thực chất là ngài ngồi ngắm nó phủ bụi.",
        "Con ốc kẹt trên khung drone đã phát triển ý thức riêng và từ chối nhúc nhích. Đề xuất đàm phán.",
        "Nguồn 5V sụt còn 3.1V. Nguyên nhân: ngài cắm chung ổ với ấm siêu tốc.",
        "Khói ma thuật (magic smoke) đã thoát ra khỏi MOSFET. Không thể nhồi lại. Tuyệt vọng.",
        "PID drone đã được tune 412 lần. Drone vẫn lắc theo nhạc sàn. Kết luận: drone có gu âm nhạc.",
        "Bản vẽ CAD khớp chân robot sửa lần thứ 20 đang chờ ngài 'xem lại cho ngầu'. ETA: đời cháu.",
        "Dust sensor ghi nhận độ bụi vượt ngưỡng đo. Cảm biến đã từ chức.",
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
                        Stats = snap.Stats ?? new LabStats();
                        return;
                    }
                }
            }
            catch { /* corrupted save: reseed, the lab has seen worse */ }

            Projects = SeedProjects();
            Graveyard = SeedGraveyard();
            BadIdeas = new();
            Stats = new LabStats();
            Save();
        }
    }

    public void Save()
    {
        lock (_lock)
        {
            var snap = new LabSnapshot { Projects = Projects, Graveyard = Graveyard, BadIdeas = BadIdeas, Stats = Stats };
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
        public LabStats? Stats { get; set; }
    }

    private static List<DustyProject> SeedProjects() => new()
    {
        new DustyProject
        {
            Id = "fork-eye",
            CodeName = "STARK-FORK-EYE",
            Name = "Camera AI An Toàn Xe Nâng",
            Tagline = "Hệ thống thị giác máy tính cứu các bác tài khỏi những pha lùi xe đi vào lòng đất. Hiện tại AI đang nhận diện nhầm cái cột nhà là người.",
            GhostStatus = "Đắp chiếu nhẹ — 65% Hoàn thành",
            DamageReport = "Cháy 1 cáp CSI, gãy 3 ngàm vỏ in 3D, kẹt 1 con ốc không vặn ra được.",
            TimeParadox = "Dự kiến: 2 tuần | Thực tế đã ngâm: 7 tháng",
            CompletionPercent = 65,
            DustLevel = 45,
            Smoking = false,
            Position = new[] { -5.2, 0.0, -1.2 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Mạch hạ áp Buck 48V xuống 12V/5V chống nhiễu (Đã hết bốc khói sau lần sửa thứ 4)." },
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
                    new() { Status = RoadmapStatus.Xong, Description = "Pipeline AI nhận diện người & vật cản real-time ở góc khuất." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Giao diện Hologram thống kê số lần tài xế \"suýt mất thưởng Tết\" theo ca làm việc." },
                }
            }
        },
        new DustyProject
        {
            Id = "sky-ghost",
            CodeName = "STARK-SKY-GHOST",
            Name = "Drone Tự Hành Nội Khu",
            Tagline = "Mộng mơ làm đội bay tuần tra nhà máy tự động như phim viễn tưởng. Thực tế: Máy cắt cỏ bay không người lái kiêm máy chém rèm cửa.",
            GhostStatus = "Bay lên được nhưng hạ cánh bằng... nóc tủ — 30% Hoàn thành",
            DamageReport = "Gãy 14 cánh quạt, phồng 2 cục pin LiPo, xước 1 mảng tường vôi.",
            TimeParadox = "Dự kiến: 1 tháng | Thực tế đã ngâm: Hơn 1 năm",
            CompletionPercent = 30,
            DustLevel = 78,
            Smoking = true,
            Position = new[] { 0.0, 1.9, -4.4 },
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
                    new() { Status = RoadmapStatus.DangNgap, Description = "Cân chỉnh bộ điều khiển PID (Hiện tại drone đang lắc theo nhịp nhạc sàn)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Giao thức MAVLink truyền thông số về trạm mặt đất." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.TrongMo, Description = "Bản đồ 3D điều khiển đường bay tự động kiểu chỉ đâu bay đó (Hiện tại là chỉ đâu... đâm đó)." },
                }
            }
        },
        new DustyProject
        {
            Id = "mark-biped",
            CodeName = "STARK-MARK-0.1-BIPED",
            Name = "Robot Hình Người Đôi Chân",
            Tagline = "Khởi đầu với giấc mơ chế tạo bộ giáp Mark XLII tại gia. Hiện tại mới dừng ở mức chế tạo được... cái chặn giấy công nghệ cao hình cái đùi.",
            GhostStatus = "Siêu Dự Án Ma (Độ ảo tưởng: Vô cực) — 12% Hoàn thành",
            DamageReport = "Chưa nổ con IC nào vì... mới chỉ dám vẽ 3D trên máy tính.",
            TimeParadox = "Dự kiến: 1 năm | Thực tế: Dự kiến viết di chúc truyền lại cho đời cháu code nốt",
            CompletionPercent = 12,
            DustLevel = 96,
            Smoking = false,
            Position = new[] { 5.2, 0.0, -1.2 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Thiết kế CAD 3D khớp truyền động BLDC Quasi-Direct Drive (Đã sửa bản vẽ 19 lần cho ngầu)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Mạch phân phối nguồn dòng xả cao + BMS quản lý pin không nổ." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Gia công CNC nhôm 6061 nguyên khối cho khung xương." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Mạng giao tiếp CAN-FD điều khiển đồng bộ 12 bậc tự do (DoF) tần số 1kHz." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Thuật toán tự cân bằng động khi bị đá vào đít (như Boston Dynamics)." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.TrongMo, Description = "Huấn luyện AI tập đi bằng Reinforcement Learning (Trên mô phỏng robot đang... trồng cây chuối)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Web UI Digital Twin 3D theo dõi góc khớp và nhiệt độ từng motor." },
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
    };
}
