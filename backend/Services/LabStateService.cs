using System.Text.Json;
using System.Text.Json.Serialization;
using GhostLab.Models;

namespace GhostLab.Services;

/// <summary>
/// Thread-safe in-memory lab state, persisted to lab-state.json so the dust
/// level canonically survives restarts. Seeded with the 5 ghost projects.
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
        "CẢNH BÁO: Đã mua thêm 3 bộ module I/O mới trong khi 5 dự án cũ vẫn đang phủ bụi trên 60%.",
        "Phát hiện lỗi tâm linh: Hôm qua chạy ngon, sáng nay bật lên đứng im dù không ai sửa dòng code nào.",
        "Linh kiện đặt từ tháng 3 vẫn 'đang vận chuyển'. Kiến nghị cầu hương thêm cho lô hàng.",
        "Phân tích cho thấy 73% thời gian 'code dự án' thực chất là ngồi ngắm nó phủ bụi.",
        "Con ốc kẹt trên khung drone đã phát triển ý thức riêng và từ chối nhúc nhích. Đề xuất đàm phán.",
        "Nguồn 5V sụt còn 3.1V. Nguyên nhân: cắm chung ổ với ấm siêu tốc.",
        "Khói ma thuật (magic smoke) đã thoát ra khỏi MOSFET. Không thể nhồi lại. Tuyệt vọng.",
        "PID drone đã được tune 412 lần. Drone vẫn lắc theo nhạc Vinahey. Kết luận: drone có gu âm nhạc.",
        "Bản vẽ CAD khớp chân robot sửa lần thứ 20 đang chờ 'xem lại cho ngầu'. ETA: đời cháu.",
        "Dust sensor ghi nhận độ bụi vượt ngưỡng đo. Cảm biến đã từ chức.",
        "REMOTE_IO: Đèn đỏ SF/BF trên cụm PROFINET nhấp nháy đúng nhịp nhạc đám cưới, TIA Portal từ chối nhận họ hàng.",
        "REMOTE_IO: Ai đó vừa đấu nhầm 220VAC vào chân DI 24VDC — 4 con opto PC817 đã thăng thiên trong ánh hào quang.",
        "JARVIS_CORE: Hỏi 'Mấy giờ rồi?' mất 45 giây suy nghĩ, tràn 12GB VRAM rồi bật nhầm bình nóng lạnh tầng trên.",
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

                        // Dọn roast mồ côi của các dự án cũ đã xóa, đồng thời bổ sung roast/mộ seed cho dự án mới.
                        Roasts.RemoveAll(r => GetProject(r.ProjectId) == null);
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
            Position = new[] { -6.0, 0.0, -1.8 },
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
            Id = "remote-io",
            CodeName = "PRJ-REMOTE-IO",
            Name = "Trạm Remote I/O Phân Tán Chuẩn Công Nghiệp",
            Tagline = "Tham vọng tự chế bộ Distributed Remote I/O gắn thanh ray DIN cạnh tranh trực tiếp với Siemens SIMATIC ET 200SP giá bằng 1/5. Thực tế: Đèn đỏ BF/SF nhấp nháy như vũ trường, biến tần vừa chạy là rơ-le gõ nhịp cha-cha-cha.",
            GhostStatus = "Đèn đỏ SF/BF sáng vĩnh cửu — 55% Hoàn thành",
            DamageReport = "Nổ 4 opto cách ly PC817 do đấu nhầm 220VAC vào chân DI 24VDC, cháy 1 chip PHY Ethernet, gãy 2 lẫy gài thanh DIN 35mm.",
            TimeParadox = "Dự kiến: 3 tuần | Thực tế đã ngâm: 8 tháng (vẫn đang tải file GSDML)",
            CompletionPercent = 55,
            DustLevel = 58,
            Smoking = false,
            Position = new[] { -3.2, 0.0, -5.4 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Cụm Interface Module Dual-RJ45 + Backplane tốc độ cao + Vỏ gài ray DIN 35mm kiểu Siemens ET 200SP." },
                    new() { Status = RoadmapStatus.Xong, Description = "Các slice module DI 16x24VDC, DQ 16x24VDC/0.5A, AI 4-20mA kèm cầu đấu Push-in không cần tua-vít." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Module an toàn vàng PROFIsafe F-DI/F-DQ (Hiện tại chức năng an toàn duy nhất là... tự đứt cầu chì)." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Stack Modbus TCP & quét backplane nội bộ chu kỳ 1ms qua SPI DMA." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Stack PROFINET RT & xuất file cấu hình GSDML cho TIA Portal (Cắm vào PLC Siemens vẫn báo 'Not Reachable')." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Màn hình HMI Web/WinCC chẩn đoán đứt dây, quá dòng từng kênh LED ma trận." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Tính năng Hot-Swap rút nóng module không làm PLC dừng chạy (Hiện rút ra là treo cả tủ điện)." },
                }
            }
        },
        new DustyProject
        {
            Id = "jarvis-core",
            CodeName = "PRJ-JARVIS-CORE",
            Name = "Trợ Lý AI Phòng Lab & Bàn Hologram Trung Tâm",
            Tagline = "Mơ làm siêu trí tuệ nhân tạo J.A.R.V.I.S. kèm bàn kính Hologram xoay 3D giữa phòng như Tony Stark. Thực tế: Hỏi 'Mấy giờ rồi?' thì mất 45 giây suy nghĩ, sập VRAM rồi bật nhầm bình nóng lạnh.",
            GhostStatus = "Ảo giác ngôn ngữ cấp Vũ Trụ — 28% Hoàn thành",
            DamageReport = "Tràn VRAM sập nguồn 19 lần, nứt 1 mặt kính cường lực cảm ứng do máy chiếu quá nhiệt, nhận nhầm tiếng ho thành lệnh 'Xóa sạch Database'.",
            TimeParadox = "Dự kiến: 1 tháng | Thực tế đã ngâm: 11 tháng (90% thời gian để render vòng tròn vàng cho giống phim)",
            CompletionPercent = 28,
            DustLevel = 64,
            Smoking = false,
            Position = new[] { 0.0, 0.0, -0.8 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Bàn kính cường lực cảm ứng đa điểm tích hợp trên bệ lõi nguồn Arc Reactor trung tâm hầm." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Mảng 8 micro định hướng beamforming (Hiện chỉ nghe rõ tiếng quạt tản nhiệt của chính nó)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Cụm máy chiếu Laser Volumetric tạo ảnh nổi 3D giữa không trung không cần kính VR." },
                },
                Firmware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Mạch điều khiển vòng LED ma trận & cảm biến tiệm cận vẫy tay kiểu Stark Industries." },
                    new() { Status = RoadmapStatus.DangNgap, Description = "Bridge điều khiển toàn bộ đèn xưởng, máy in 3D và nguồn bàn lab bằng giọng nói." },
                },
                Software = new()
                {
                    new() { Status = RoadmapStatus.DangNgap, Description = "Local LLM + Whisper STT + giọng nói lịch lãm kiểu quản gia Anh quốc (Đang bị nói lắp khi GPU quá 90°C)." },
                    new() { Status = RoadmapStatus.TrongMo, Description = "Tự động thiết kế mạch PCB, tự đặt linh kiện và tự viết báo cáo xin lỗi sếp khi trễ deadline." },
                }
            }
        },
        new DustyProject
        {
            Id = "sky-ghost",
            CodeName = "PRJ-SKY-GHOST",
            Name = "Drone Tự Hành Nội Khu",
            Tagline = "Mộng mơ làm đội bay tuần tra nhà máy tự động như phim. Thực tế: Máy cắt cỏ bay không người lái kiêm máy chém rèm cửa, hiện đang bị xích chặt vào khung test trên bàn.",
            GhostStatus = "Bay lên được nhưng hạ cánh bằng... nóc tủ — 30% Hoàn thành",
            DamageReport = "Gãy 14 cánh quạt, phồng 2 cục pin LiPo, xước 1 mảng tường vôi.",
            TimeParadox = "Dự kiến: 1 tháng | Thực tế đã ngâm: Hơn 1 năm",
            CompletionPercent = 30,
            DustLevel = 78,
            Smoking = true,
            Position = new[] { 3.2, 0.0, -5.4 },
            Roadmap = new Roadmap
            {
                Hardware = new()
                {
                    new() { Status = RoadmapStatus.Xong, Description = "Khung Carbon 250mm + Động cơ Brushless + ESC 4-in-1 neo trên giàn giáo nhôm 80/20 mặt bàn." },
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
            Position = new[] { 6.0, 0.0, -1.8 },
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
        new() { Id = "g7", Component = "Servo MG996R x6", Epitaph = "Kêu rít như đàn nhị ma rồi im lặng vĩnh viễn", CauseOfDeath = "Bị ép gập 180° bởi thuật toán chưa kiểm chứng", DiedAt = DateTime.UtcNow.AddMonths(-1) },
        new() { Id = "g11", Component = "4x Opto PC817 (Module DI 24V)", Epitaph = "Cách ly quang học thành công... bằng cách tự nổ tung", CauseOfDeath = "Thợ điện đấu nhầm dây lửa 220VAC vào ngõ vào 24VDC", DiedAt = DateTime.UtcNow.AddDays(-12) },
        new() { Id = "g12", Component = "Chip PHY LAN8720A PROFINET", Epitaph = "Nhấp nháy đèn vàng lần cuối rồi tắt lịm", CauseOfDeath = "Xung sét cảm ứng từ biến tần 15kW đặt sát bên cạnh", DiedAt = DateTime.UtcNow.AddDays(-7) },
        new() { Id = "g13", Component = "Nguồn RTX 3060 Nuôi J.A.R.V.I.S.", Epitaph = "Cống hiến hết mình để render 1 câu chào buổi sáng", CauseOfDeath = "Sụt áp toàn hầm khi vừa chạy LLM vừa đun mì tôm", DiedAt = DateTime.UtcNow.AddDays(-2) },
    };

    private static List<RoastComment> SeedRoasts() => new()
    {
        new() { Id = "r1", ProjectId = "fork-eye", Author = "Bác Tài Ca Đêm", Role = "Nạn Nhân Tiềm Năng", Text = "AI báo 'người' ở góc khuất. Tôi chạy qua xem — đó là cái cột. Cột đã đứng đó 12 năm, chưa từng đi lại.", At = DateTime.UtcNow.AddDays(-12) },
        new() { Id = "r2", ProjectId = "fork-eye", Author = "Kỹ Sư Bếp Núc", Role = "Thánh Xúi Dại Cấp 9", Text = "Băng dính điện chống bụi IP65 là một bước tiến lớn của ngành tiêu chuẩn quốc tế.", At = DateTime.UtcNow.AddDays(-9) },
        new() { Id = "r5", ProjectId = "sky-ghost", Author = "Chủ Rèm Cửa", Role = "Nạn Nhân Đã Xác Nhận", Text = "Nó chém rèm cửa phòng khách tôi thành 4 mảnh đều nhau. Ít ra độ chính xác cắt thì khỏi chê.", At = DateTime.UtcNow.AddDays(-15) },
        new() { Id = "r6", ProjectId = "sky-ghost", Author = "Thợ Tune PID Thất Nghiệp", Role = "Đồng Nghiệp Cũ", Text = "412 lần tune PID mà drone vẫn lắc theo nhạc sàn — vấn đề không nằm ở PID, nằm ở playlist.", At = DateTime.UtcNow.AddDays(-11) },
        new() { Id = "r9", ProjectId = "iron-biped", Author = "Nhà Đầu Tư Thiên Thần", Role = "Đã Rút Vốn", Text = "Pitch deck nói 'Optimus Prime tại gia'. Deliverable sau 1 năm: 1 cái đùi và 19 file CAD tên giống hệt nhau.", At = DateTime.UtcNow.AddDays(-20) },
        new() { Id = "r10", ProjectId = "iron-biped", Author = "Robot Trong Mô Phỏng", Role = "Nhân Chứng Sống", Text = "Tôi xác nhận trong mô phỏng nó đi được 3 bước rồi trồng cây chuối. Thuật toán cân bằng hoạt động... ngược.", At = DateTime.UtcNow.AddDays(-2) },
        new() { Id = "r13", ProjectId = "remote-io", Author = "Kỹ Sư Tủ Điện PLC", Role = "Nạn Nhân TIA Portal", Text = "Quảng cáo 'chuẩn Siemens ET 200SP nội địa', cắm cáp xanh PROFINET vào thì đèn đỏ BF chớp như đèn còi cảnh sát.", At = DateTime.UtcNow.AddDays(-6) },
        new() { Id = "r14", ProjectId = "remote-io", Author = "Thợ Đấu Tủ Ca 3", Role = "Người Thử Độ Bền Opto", Text = "Cầu đấu Push-in kẹt cứng đến mức rút sợi dây 0.75mm² ra thì bay luôn cả vỏ nhựa lẫn thanh ray DIN.", At = DateTime.UtcNow.AddDays(-3) },
        new() { Id = "r15", ProjectId = "jarvis-core", Author = "Tony Stark Hàng Shopee", Role = "Chủ Nhân Bị Phản Bội", Text = "Tôi hô 'J.A.R.V.I.S., bật đèn bàn hàn!' — nó im lặng 30 giây suy ngẫm triết học rồi tắt luôn aptomat tổng.", At = DateTime.UtcNow.AddDays(-4) },
        new() { Id = "r16", ProjectId = "jarvis-core", Author = "Quạt Tản Nhiệt GPU", Role = "Lao Động Khổ Sai", Text = "Vòng cầu vàng xoay đẹp đấy, chỉ tốn nhẹ 350W điện để trả lời câu 'Hôm nay thứ mấy' sai mất 2 ngày.", At = DateTime.UtcNow.AddDays(-1) },
    };
}
