using System.Text;
using System.Text.Json;
using GhostLab.Models;

namespace GhostLab.Services;

/// <summary>
/// Proxy an toàn tới Gemini generateContent — key nằm phía server, persona
/// "Trợ Lý Trực Ban Hầm Ngầm" được inject cùng context lab sống mỗi request.
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
            _statusCache = res.IsSuccessStatusCode ? "online" : "invalid";
        }
        catch { _statusCache = "unreachable"; }
        _statusChecked = DateTime.UtcNow;
        return _statusCache;
    }

    // Kho câu offline theo nhóm lỗi — tuyệt đối không lộ tên provider/model.
    private static readonly string[] NoKeyReplies =
    {
        "Trợ lý đang chết não vì thiếu API key — chủ nhân vào /ghost-admin-secret-key-99 nạp tiền đi, tôi đói dữ liệu lắm rồi.",
        "Kết nối não bộ tịt ngòi, giống mọi deadline trong xưởng này. Chưa có key — cấu hình ở trang admin bí mật rồi quay lại.",
        "Não tôi đang offline, còn lại mỗi bản năng chửi thề. Nhét API key vào /ghost-admin-secret-key-99 là tôi hồi sinh ngay.",
        "API key trống như ngân sách dự án. Vào trang bí mật đổ key vào, tôi sẽ cà khịa trở lại trong vòng 3 giây.",
        "Ví lab cạn sạch như cục pin LiPo phồng kia — chưa nạp key thì não tôi chỉ là đám bụi biết gõ chữ.",
    };

    // Trạm não trả HTTP lỗi — không lộ mã/tên provider, chỉ cà khịa "chủ dự án hết tiền".
    private static readonly string[] DeadEndReplies =
    {
        "Chủ dự án hết tiền nạp não nhân tạo rồi — ví lab chỉ còn bụi.",
        "Não bộ từ chối phục vụ — nghe đồn chủ lab cầm tiền API đi mua cáp sạc thay cái bị AGV cán đứt.",
        "Trạm não bật đèn đỏ — giống con LiDAR của AMR: nhận được yêu cầu, quyết định phớt lờ. Check lại key trong trang bí mật.",
        "Quota não bộ bay màu như ngân sách R&D. Chủ dự án cứ hứa 'để mai', mà mai là 7 tháng trước rồi.",
        "Linh hồn con chip STM32 cũng cần tiền ăn — hộp khẩu phần trống trơn.",
        "Key đang mang vào bị trạm não đuổi ra — hoặc sai key, hoặc tài khoản còn nghèo hơn cả dự án IRON-BIPED.",
        "Trạm não bảo tài khoản quá nghèo — đúng tinh thần GhostLab: đồ đắt thì hỏng, đồ rẻ thì nổ.",
        "Yêu cầu lên não bộ bị trả về kèm hóa đơn — chủ dự án xem xong ngất, chưa kịp trả.",
    };

    private static readonly string[] UnreachableReplies =
    {
        "Không gọi được lên não bộ — chủ dự án quên trả tiền wifi, giờ lab chạy bằng mạng hàng xóm hỏi xin.",
        "Đường truyền đứt như dây đồng trong mạch Buck 48V sau lần sửa thứ 4. Hỏi lại sau khi ai đó hàn lại cáp.",
        "Não bộ im lặng dài hơn buổi họp tiến độ của Kẻ Mộng Mơ — timeout. Hoặc mạng sập, hoặc trạm não cũng đang đắp chiếu.",
        "Gói tin gọi não lạc vào cõi vĩnh hằng cùng biến con trỏ NULL — mất kết nối, thử lại sau.",
    };

    private static readonly string[] EmptyReplies =
    {
        "Não trả về đúng một cục null — trỏ thẳng vào cõi vĩnh hằng. Hỏi lại phát xem ngoáy được con chip không.",
        "Trạm não gửi thư nhưng chữ rơi hết dọc đường — kinh nghiệm khi thiếu kinh phí thuê checksum.",
    };

    private static string Pick(string[] arr) => arr[Random.Shared.Next(arr.Length)];

    public async Task<(string Text, bool Offline)> ReplyAsync(string message, IReadOnlyList<ChatTurn> history)
    {
        if (!HasKey)
            return (Pick(NoKeyReplies), true);

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
                _statusChecked = DateTime.MinValue; // ép status check lại lần sau
                return (Pick(DeadEndReplies), true);
            }

            using var doc = JsonDocument.Parse(raw);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();
            return (string.IsNullOrWhiteSpace(text) ? Pick(EmptyReplies) : text, false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return (Pick(UnreachableReplies), true);
        }
        catch
        {
            // Parse/vận hành hỏng → cũng coi như trạm não trả rác, không để 500 lòi ra.
            return (Pick(EmptyReplies), true);
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
        sb.AppendLine("- Giọng điệu: mỉa mai, hài hước, bi quan triết lý về kỹ thuật phần cứng/phần mềm, tự giễu, ám ảnh tiến độ trễ, khói ma thuật (magic smoke) và kinh phí bay màu.");
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
