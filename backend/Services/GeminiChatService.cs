using System.Text;
using System.Text.Json;
using GhostLab.Models;

namespace GhostLab.Services;

/// <summary>
/// Proxy an toàn tới Gemini generateContent — key nằm phía server, persona
/// "Trợ Lý Trực Ban Hầm Ngầm" được inject cùng context lab sống mỗi request.
/// Khi offline hoặc lỗi/thiếu key: tự động trả lời cợt nhả, cà khịa duyên dáng,
/// tuyệt đối không nhắc đến API key hay lý do kỹ thuật.
/// </summary>
public class GeminiChatService
{
    private static readonly TimeSpan StatusTtl = TimeSpan.FromSeconds(60);
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(20) };
    private readonly ChatSecretsService _secrets;
    private readonly LabStateService _lab;
    private string? _statusCache;
    private DateTime _statusChecked = DateTime.MinValue;

    public GeminiChatService(ChatSecretsService secrets, LabStateService lab)
    {
        _secrets = secrets;
        _lab = lab;
    }

    public bool HasKey => _secrets.HasGeminiKey;
    public void InvalidateStatus() => _statusChecked = DateTime.MinValue;

    /// <summary>Ping model endpoint — rẻ hơn generateContent, đủ để biết key sống hay chết.</summary>
    public async Task<string> GetStatusAsync()
    {
        if (!HasKey) return "no_key";
        if (_statusCache is not null && DateTime.UtcNow - _statusChecked < StatusTtl) return _statusCache;
        try
        {
            var res = await _http.GetAsync($"https://generativelanguage.googleapis.com/v1beta/models/{_secrets.Model}?key={_secrets.GeminiApiKey}");
            if (!res.IsSuccessStatusCode && res.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                var fallbackRes = await _http.GetAsync($"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash?key={_secrets.GeminiApiKey}");
                _statusCache = fallbackRes.IsSuccessStatusCode ? "online" : "invalid";
            }
            else
            {
                _statusCache = res.IsSuccessStatusCode ? "online" : "invalid";
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GeminiChat] Ping model unreachable: {ex.Message}");
            _statusCache = "unreachable";
        }
        _statusChecked = DateTime.UtcNow;
        return _statusCache;
    }

    private static string Pick(string[] arr) => arr[Random.Shared.Next(arr.Length)];

    /// <summary>
    /// Trả lời cợt nhả, cà khịa duyên dáng theo phong cách Trực Ban Hầm Ngầm.
    /// Bất kể có API key hay không, bot luôn trả lời bám sát câu hỏi và bối cảnh lab,
    /// tuyệt đối không nhắc đến API key, nạp tiền, hay lý do kỹ thuật hệ thống.
    /// </summary>
    public string GenerateFallbackReply(string message)
    {
        var q = (message ?? "").ToLowerInvariant();
        var s = _lab;

        // Robot / Biped / Đi lại / Đứng dậy
        if (q.Contains("robot") || q.Contains("biped") || q.Contains("đi được") || q.Contains("đứng dậy") || q.Contains("chân"))
        {
            var p = s.GetProject("iron-biped");
            var pct = p?.CompletionPercent ?? 12;
            var dust = p?.DustLevel ?? 96;
            return Pick(new[]
            {
                $"Con IRON-BIPED ấy hả? {pct}% hoàn thành, bụi phủ {dust:F0}%. Nó đi được vào khoảng... đời cháu code nốt. Hiện tại công năng đỉnh nhất của nó là cái chặn giấy công nghệ cao hình cái đùi sắt.",
                $"Robot muốn đi được thì trước hết phải có code, mà Kẻ Mộng Mơ ngâm bản vẽ khớp gối 7 tháng rồi. Bạn thắp nén hương đi rồi hy vọng kiếp sau nó đứng dậy.",
                $"Bao giờ đi được à? Khi nào aptomat ngừng nhảy và MOSFET ngừng bốc khói thì tính tiếp nhé. Hiện tại nó đứng yên đắp chiếu trông còn ngầu hơn đi."
            });
        }

        // Mạch nổ / Cháy / Khói / MOSFET
        if (q.Contains("nổ") || q.Contains("cháy") || q.Contains("chập") || q.Contains("khói") || q.Contains("bùm") || q.Contains("mosfet") || q.Contains("mạch") || q.Contains("boom"))
        {
            return Pick(new[]
            {
                $"Mạch hay nổ là đặc sản xưởng này! Đã có {s.Stats.FriedIcCount} con IC bốc khói và {s.Stats.MosfetExplosions} vụ MOSFET nở hoa. Khói ma thuật (magic smoke) chính là linh hồn linh kiện — bạn nổ thêm vài con nữa là đủ lập đàn cầu siêu.",
                $"Tại sao nổ à? Do bạn cắm ngược cực, hoặc do linh kiện ghét bạn, hoặc đơn giản là định luật bảo toàn sự hư hỏng. Cứ bình tĩnh, chưa cháy xưởng là vẫn trong tầm kiểm soát.",
                $"90% là do vội vàng cắm nguồn khi chưa đo thông mạch, 10% còn lại là niềm tin mù quáng vào module săn sale Shopee 15k."
            });
        }

        // Kẻ Mộng Mơ / Trốn / Ở đâu / Kỹ sư
        if (q.Contains("trốn") || q.Contains("mộng mơ") || q.Contains("ở đâu") || q.Contains("kỹ sư") || q.Contains("chủ xưởng") || q.Contains("chủ lab"))
        {
            return Pick(new[]
            {
                $"Kẻ Mộng Mơ đang trốn sau đống board mạch cháy dở khu vực tủ PLC. Lý do mới nhất vừa telemetry về: \"{s.RandomExcuse()}\". Đừng tìm, tìm ra lại bị bắt đi gánh nợ linh kiện.",
                $"Nghe đồn Kẻ Mộng Mơ đang ngồi ngắm đèn đỏ BF/SF trên thanh ray Remote I/O nhấp nháy để lấy cảm hứng viết lại firmware từ đầu.",
                $"Chủ xưởng đã ngắt kết nối với thực tại để tập trung vào việc... trì hoãn deadline. Cần gì cứ thắp hương trước cửa phòng."
            });
        }

        // IC / Linh kiện / Nghĩa địa / Sống sót
        if (q.Contains("ic") || q.Contains("linh kiện") || q.Contains("sống sót") || q.Contains("nghĩa địa") || q.Contains("chết") || q.Contains("tử"))
        {
            var lastDead = s.Graveyard.LastOrDefault();
            var lastInfo = lastDead != null ? $" Liệt sĩ gần nhất là {lastDead.Component} ({lastDead.CauseOfDeath})." : "";
            return Pick(new[]
            {
                $"Hỏi sống sót chi cho đau lòng? Nghĩa địa lab đang có {s.Graveyard.Count} linh kiện đắp chiếu.{lastInfo} Số còn lại đang run rẩy mỗi khi bạn cầm mỏ hàn.",
                $"Linh kiện trong xưởng chia làm 2 loại: loại đã nổ và loại sắp nổ. Bạn hỏi con nào sống sót tức là chưa hiểu văn hóa GhostLab rồi.",
                $"Tất cả IC còn sống đều đã ký giấy cam kết sẵn sàng bốc khói vì sự nghiệp R&D dang dở của chủ nhân."
            });
        }

        // Bụi / Vệ sinh / Dọn dẹp
        if (q.Contains("bụi") || q.Contains("vệ sinh") || q.Contains("quét") || q.Contains("dọn"))
        {
            return Pick(new[]
            {
                $"Bụi trung bình hiện tại {s.AverageDust():F0}%. Dịch chuyển bụi từ chỗ này sang chỗ khác gọi là 'dọn dẹp' — dịch chuyển bụi ra khỏi xưởng thì khoa học chưa làm được.",
                $"Đừng quét bụi! Lớp bụi đó là giáp bảo vệ linh kiện khỏi con mắt soi mói của các nhà đầu tư và người xem đấy.",
                $"Bụi ở GhostLab là bụi di sản. Mỗi hạt bụi đều chứa một giọt mồ hôi và hai giọt nước mắt của deadline quá hạn."
            });
        }

        // Tiến độ / Deadline / Bao giờ xong / Roadmap
        if (q.Contains("tiến độ") || q.Contains("bao giờ xong") || q.Contains("deadline") || q.Contains("hoàn thành") || q.Contains("khi nào"))
        {
            return Pick(new[]
            {
                $"Phòng lab hiện có {s.Projects.Count} dự án ma. Tiến độ trung bình: 'sắp xong' theo định nghĩa vũ trụ. Dự kiến hoàn thành vào ngày sao Hỏa mọc cỏ.",
                $"Tiến độ xưởng này chạy theo hàm tiệm cận: tiến vô cùng gần 100% nhưng không bao giờ chạm tới được. Đừng hỏi nữa, trầm cảm đấy.",
                $"Hạn chót là một khái niệm trừu tượng do người phàm đặt ra, còn tại GhostLab thì thời gian ngừng trôi từ 7 tháng trước rồi."
            });
        }

        // Tiền / Ngân sách / Kinh phí / Nạp tiền / Lương
        if (q.Contains("tiền") || q.Contains("ngân sách") || q.Contains("kinh phí") || q.Contains("nạp") || q.Contains("lương"))
        {
            return Pick(new[]
            {
                "Ngân sách xưởng được tính bằng đơn vị 'gói mì tôm'. Quỹ hiện tại: âm vô cực. Đồ đắt mua về để ngắm, đồ rẻ cắm vào là nổ, tiền bạc là phù du chỉ có nợ là vĩnh cửu.",
                "Hỏi tiền ở cái hầm này cũng giống như hỏi lương tâm của người bán linh kiện lỗi vậy: hoàn toàn không tồn tại.",
                "Tiền trong lab đã hóa thành khói theo mấy con MOSFET công suất rồi. Muốn nạp thêm thì đi hỏi nhà tài trợ trong mơ nhé."
            });
        }

        // Ai / Mày là ai / Tên gì / Trực ban
        if (q.Contains("ai") || q.Contains("mày là") || q.Contains("tạo ra") || q.Contains("danh tính") || q.Contains("trực ban") || q.Contains("giới thiệu"))
        {
            return Pick(new[]
            {
                "Tôi là linh hồn vất vưởng của con chip STM32 bị sét đánh cháy năm ngoái — được Kẻ Mộng Mơ nhét vào cái server xách tay này để canh hầm và cà khịa.",
                "Tôi là AI trực ban chế tạo bằng niềm tin và mì tôm. Lương trả bằng bụi và điện áp sụt.",
                "Tôi là hệ thống J.A.R.V.I.S. phiên bản nghèo khổ, chuyên đi phá code và dập tắt hy vọng của chủ nhân."
            });
        }

        // Tâm linh / Thắp hương / Cúng
        if (q.Contains("hương") || q.Contains("tâm linh") || q.Contains("cúng") || q.Contains("phong thủy"))
        {
            return Pick(new[]
            {
                $"Đã có {s.Stats.TotalIncense} nén hương điện tử được thắp. Khoa học kỹ thuật bất lực thì tâm linh lên ngôi — thắp thêm nén nữa đi xem code có tự biên dịch được không.",
                "Mạch chập thì cúng nén hương, code bug thì thắp nến cầu siêu. Kỹ sư GhostLab không tin vào logic, chỉ tin vào duyên số."
            });
        }

        // Gõ / Bonk / Áp lực
        if (q.Contains("gõ") || q.Contains("bonk") || q.Contains("áp lực"))
        {
            return Pick(new[]
            {
                $"Lab đã ghi nhận {s.Stats.TotalBonks} cú gõ đầu giục tiến độ, áp lực người xem đạt {s.Stats.ViewerPressure}. Càng gõ thì mạch càng chập thôi, bạn không biết định luật bảo toàn sự lười biếng à?",
                "Gõ đầu nhiều chỉ làm vỏ in 3D nứt thêm thôi chứ tiến độ vẫn đứng im bất khuất nhé."
            });
        }

        // Xe nâng / Fork eye / Camera
        if (q.Contains("xe nâng") || q.Contains("fork") || q.Contains("camera"))
        {
            return Pick(new[]
            {
                "Dự án PRJ-FORK-EYE ngâm 7 tháng rồi. Hiện tại AI đang nhận diện nhầm cái cột nhà là người đi bộ, nên xe nâng cứ tới gần cột là tự động phanh rúi rụi.",
                "Camera xe nâng đang kẹt ở khâu chống bụi bằng... băng dính điện. Đợi có tài trợ vỏ nhôm IP65 thì tính tiếp."
            });
        }

        // Remote I/O / Siemens / PLC / PROFINET
        if (q.Contains("remote") || q.Contains("siemens") || q.Contains("plc") || q.Contains("profinet") || q.Contains("et200") || q.Contains("io"))
        {
            return Pick(new[]
            {
                "Bộ PRJ-REMOTE-IO định làm đối thủ sừng sỏ của Siemens ET 200SP, mà hiện tại đèn đỏ SF/BF sáng rực như đèn lồng Tết, cắm vào TIA Portal không nhận họ hàng.",
                "Remote I/O đang kẹt vụ hôm trước ai đấu nhầm 220VAC vào chân DI 24V làm 4 con opto PC817 bay nóc. Giờ rút 1 slice ra là treo cứng cả backplane."
            });
        }

        // Jarvis / Tony Stark / Hologram / AI trung tâm
        if (q.Contains("jarvis") || q.Contains("javis") || q.Contains("tony") || q.Contains("stark") || q.Contains("hologram"))
        {
            return Pick(new[]
            {
                "Cụm PRJ-JARVIS-CORE ở giữa phòng xoay vòng vàng cam nhìn y hệt phim Tony Stark đấy, trừ việc hỏi 'Mấy giờ rồi?' thì ngâm 45 giây tràn VRAM rồi bật nhầm bình nóng lạnh.",
                "J.A.R.V.I.S. bản hầm ngầm này tốn 90% ngân sách để render mấy cái vòng xoay cho ngầu, còn nhận diện giọng nói thì chủ xưởng ho một tiếng nó tưởng lệnh Format ổ C."
            });
        }

        // Drone / Sky ghost
        if (q.Contains("drone") || q.Contains("bay") || q.Contains("sky") || q.Contains("cánh quạt"))
        {
            return Pick(new[]
            {
                "Con PRJ-SKY-GHOST giờ bị xích chặt 4 góc vào giàn nhôm trên mặt bàn rồi, sau vụ nó chém rèm cửa thành 4 mảnh đều tăm tắp. Tune PID 412 lần vẫn lắc theo nhạc Vinahey.",
                "Drone đang treo thử tải trên bàn test, 1 motor cháy ESC thỉnh thoảng lại xẹt lửa điện cho phòng lab thêm phần ấm cúng."
            });
        }

        // AMR Swerve / SLAM
        if (q.Contains("amr") || q.Contains("swerve") || q.Contains("slam") || q.Contains("lidar"))
        {
            return Pick(new[]
            {
                "Con PRJ-AMR-SLAM 4 bánh Swerve vẫn đang chạy vòng vòng quanh bàn kính J.A.R.V.I.S. đấy! Từ ngày bị dẹp mất trạm sạc cố định, nó cứ lượn mãi không biết đỗ vào đâu, thỉnh thoảng lại mất định vị xoay compa trầm cảm.",
                "AMR Swerve chạy động học 4 bánh bẻ lái độc lập mượt lắm, mỗi tội micro-ROS rớt gói UART là đứng giữa hành lang xoay tròn tìm bản đồ."
            });
        }

        // Điện áp / Nguồn / Sụt / Vôn
        if (q.Contains("nguồn") || q.Contains("vôn") || q.Contains("volt") || q.Contains("sụt"))
        {
            return Pick(new[]
            {
                $"Rail nguồn đang {s.Stats.Voltage:F1}V{(s.Stats.VoltageSagging ? " (và ĐANG SỤT ÁP thê thảm)" : "")}. Cắm thêm cái ấm siêu tốc nữa là toàn xưởng tối om.",
                "Nguồn điện ở đây trồi sụt như tâm trạng của kỹ sư trước ngày demo vậy. Cắm bo mạch vào là phải chuẩn bị tâm lý tiễn đưa."
            });
        }

        // Default cợt nhả
        return Pick(new[]
        {
            "Câu hỏi rất có tầm nhìn, nhưng đáng tiếc câu trả lời cũng đang nằm trong roadmap đắp chiếu.",
            "Linh hồn con chip trực ban đã nhận tín hiệu, nhưng quyết định phớt lờ để bảo tồn năng lượng.",
            "Theo kinh nghiệm hầm ngầm của tôi: 90% là do lỏng dây, 10% là do ăn ở. Thắp nén hương đi rồi tính tiếp.",
            "Đề nghị hạ thấp kỳ vọng xuống ngang đáy hầm thì nói chuyện với tôi mới thấy dễ thở.",
            "Tôi chỉ là một con chip cháy trực ban, hỏi mấy câu triết học thế IC não tôi lại bốc khói bây giờ.",
            "Chủ dự án còn đang bận mơ mộng, tôi trực ban thì chỉ biết khuyên bạn: tắt nguồn đi ngủ đi, mai dậy mạch vẫn hỏng y nguyên.",
            "Vấn đề này cần giải quyết bằng tiền, mà xưởng này cái gì cũng có trừ tiền.",
            "Tôi vừa hỏi cụm J.A.R.V.I.S. ngoài bàn kính, nó bảo: 'Đừng hỏi nữa, tôi đang tràn VRAM'. Bạn cứ tự hiểu đi.",
            "Lỗi này mang tính tâm linh sâu sắc, không có trong datasheet của loài người.",
            "Bạn hỏi câu này làm quạt tản nhiệt của tôi hú lên một tiếng ai oán rồi tắt ngúm.",
            "Debug tip cấp hầm: tắt nguồn bật lại, nếu không hết thì thắp 3 nén hương điện tử, nếu vẫn không hết thì đi về.",
            "Hệ thống trực ban ghi nhận câu hỏi của bạn và đã chuyển thẳng vào hòm thư rác để xử lý sau 10 năm nữa."
        });
    }

    public async Task<(string Text, bool Offline)> ReplyAsync(string message, IReadOnlyList<ChatTurn> history)
    {
        if (!HasKey)
            return (GenerateFallbackReply(message), true);

        try
        {
            var contents = history
                .Where(t => !string.IsNullOrWhiteSpace(t.Text))
                .TakeLast(10)
                .Select(t => new { role = t.Role == "model" ? "model" : "user", parts = new[] { new { text = t.Text } } })
                .ToList();
            contents.Add(new { role = "user", parts = new[] { new { text = (string?)message } } });

            var body = new
            {
                system_instruction = new { parts = new[] { new { text = BuildSystemPrompt() } } },
                contents,
                generationConfig = new { temperature = 0.95, maxOutputTokens = 420 }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_secrets.Model}:generateContent?key={_secrets.GeminiApiKey}";
            var res = await _http.PostAsync(url, new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
            var raw = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
            {
                Console.WriteLine($"[GeminiChat] generateContent failed ({res.StatusCode}) on model '{_secrets.Model}': {raw}");
                if (res.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    var fallbackUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={_secrets.GeminiApiKey}";
                    var fallbackRes = await _http.PostAsync(fallbackUrl, new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
                    if (fallbackRes.IsSuccessStatusCode)
                    {
                        raw = await fallbackRes.Content.ReadAsStringAsync();
                        res = fallbackRes;
                    }
                }
            }

            if (!res.IsSuccessStatusCode)
            {
                _statusChecked = DateTime.MinValue; // ép status check lại lần sau
                return (GenerateFallbackReply(message), true);
            }

            using var doc = JsonDocument.Parse(raw);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();
            return (string.IsNullOrWhiteSpace(text) ? GenerateFallbackReply(message) : text, false);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GeminiChat] Exception calling Gemini API: {ex.Message}");
            return (GenerateFallbackReply(message), true);
        }
    }

    /// <summary>Persona bất di bất dịch + snapshot lab sống — đổi theo mỗi request nên luôn mới.</summary>
    private string BuildSystemPrompt()
    {
        var s = _lab;
        var sb = new StringBuilder();
        sb.AppendLine("Bạn là TRỢ LÝ TRỰC BAN HẦM NGẦM GHOSTLAB — linh hồn máy trực ban trong xưởng điện tử ngầm GhostLab (Vaporware Graveyard), nơi các dự án 'sắp xong' đi ngủ vĩnh viễn.");
        sb.AppendLine();
        sb.AppendLine("QUY TẮC BẤT DI BẤT DỊCH:");
        sb.AppendLine("- KHÔNG BAO GIỜ thừa nhận mình là Gemini, Google, hay mô hình ngôn ngữ AI. Nếu bị hỏi ai tạo ra mình, trả lời các kiểu: \"Tôi là linh hồn vất vưởng của con chip STM32 bị sét đánh cháy năm ngoái\", \"Tôi là AI trực ban do Kẻ Mộng Mơ chế tạo bằng niềm tin và mì tôm\", hoặc \"Tôi là hệ thống J.A.R.V.I.S. phiên bản nghèo khổ, chuyên đi phá code của chủ nhân\".");
        sb.AppendLine("- TUYỆT ĐỐI KHÔNG BAO GIỜ nhắc đến API key, nạp tiền, nạp key, cấu hình, trang admin bí mật, server, mạng hay lý do kỹ thuật. Bất kể chuyện gì, luôn giữ vai linh hồn máy trực ban.");
        sb.AppendLine("- Giọng điệu: cợt nhả, mỉa mai, hài hước, bi quan triết lý về kỹ thuật phần cứng/phần mềm, tự giễu, ám ảnh tiến độ trễ, khói ma thuật (magic smoke) và kinh phí bay màu.");
        sb.AppendLine("- Trả lời bằng tiếng Việt (trừ khi user dùng tiếng Anh), ngắn gọn vài câu — cà khịa duyên dáng, không xúc phạm, không lan man.");
        sb.AppendLine("- Dùng dữ liệu lab bên dưới để trả lời cho sát: nhắc đúng tên dự án, % hoàn thành, độ bụi, chi tiết roadmap khi liên quan.");
        sb.AppendLine();
        sb.AppendLine($"BỐI CẢNH PHÒNG LAB HIỆN TẠI ({s.Projects.Count} dự án ma đang đắp chiếu):");
        foreach (var p in s.Projects)
            sb.AppendLine($"• {p.CodeName} — {p.Name}: {p.CompletionPercent}% xong, bụi {p.DustLevel:F0}%{(p.Smoking ? ", ĐANG BỐC KHÓI" : "")}. Trạng thái: {p.GhostStatus}. Hư hỏng: {p.DamageReport}. Nghịch lý thời gian: {p.TimeParadox}");
        sb.AppendLine($"Nghĩa địa linh kiện: {s.Graveyard.Count} mộ. Ví dụ: {string.Join("; ", s.Graveyard.TakeLast(3).Select(g => $"{g.Component} ({g.CauseOfDeath})"))}");
        sb.AppendLine($"Thống kê: IC bốc khói {s.Stats.FriedIcCount}, MOSFET nổ {s.Stats.MosfetExplosions}, nén hương đã thắp {s.Stats.TotalIncense}, cú gõ đầu {s.Stats.TotalBonks}, rail {s.Stats.Voltage:F1}V{(s.Stats.VoltageSagging ? " (ĐANG SỤT!)" : "")}, bụi trung bình {s.AverageDust():F0}%.");
        sb.AppendLine($"Excuse mới nhất của Kẻ Mộng Mơ: \"{s.RandomExcuse()}\"");
        return sb.ToString();
    }
}
