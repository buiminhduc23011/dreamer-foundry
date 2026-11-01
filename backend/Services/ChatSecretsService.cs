using System.Text.Json;

namespace GhostLab.Services;

/// <summary>
/// Kho secrets cho module chat + trang admin bí mật, lưu ở chat-secrets.json
/// (gitignored). Env fallback: GHOSTLAB_ADMIN_KEY, GHOSTLAB_GEMINI_KEY, GHOSTLAB_GEMINI_MODEL.
/// Key lưu 1 lần trên server, dùng chung cho tất cả người dùng vào web.
/// </summary>
public class ChatSecretsService
{
    private readonly object _lock = new();
    private readonly string _path;
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = true };

    public string AdminKey { get; private set; } = "";
    public string GeminiApiKey { get; private set; } = "";
    public string Model { get; private set; } = "gemini-2.0-flash";

    public ChatSecretsService(IWebHostEnvironment env, IConfiguration cfg)
    {
        _path = Path.Combine(env.ContentRootPath, "chat-secrets.json");
        lock (_lock)
        {
            try
            {
                if (File.Exists(_path))
                {
                    var s = JsonSerializer.Deserialize<SecretsFile>(File.ReadAllText(_path));
                    if (s is not null)
                    {
                        AdminKey = s.AdminKey ?? "";
                        GeminiApiKey = s.GeminiApiKey ?? "";
                        if (!string.IsNullOrWhiteSpace(s.Model))
                        {
                            // Tự động sửa model cũ hỏng (gemini-3.5-flash-lite không tồn tại trên Google)
                            Model = s.Model == "gemini-3.5-flash-lite" ? "gemini-2.0-flash" : s.Model;
                        }
                    }
                }
            }
            catch { /* file hỏng thì coi như chưa cấu hình — lab đã từng thấy tệ hơn */ }
        }

        // Env/config thắng file — tiện cho deploy systemd Environment=
        AdminKey = cfg["GHOSTLAB_ADMIN_KEY"] ?? AdminKey;
        GeminiApiKey = cfg["GHOSTLAB_GEMINI_KEY"] ?? cfg["GEMINI_API_KEY"] ?? GeminiApiKey;
        var envModel = cfg["GHOSTLAB_GEMINI_MODEL"];
        if (!string.IsNullOrWhiteSpace(envModel))
        {
            Model = envModel == "gemini-3.5-flash-lite" ? "gemini-2.0-flash" : envModel;
        }
    }

    public bool HasAdminKey => AdminKey.Length > 0;
    public bool HasGeminiKey => !string.IsNullOrWhiteSpace(GeminiApiKey);
    public bool CheckAdmin(string? key) => HasAdminKey && key == AdminKey;

    /// <summary>Bootstrap: chỉ set được khi chưa có mã — lần đầu ai vào trang bí mật tự chọn mã.</summary>
    public bool InitAdminKey(string key)
    {
        lock (_lock)
        {
            if (HasAdminKey) return false;
            AdminKey = key;
            Save();
            return true;
        }
    }

    public void SaveGemini(string apiKey, string? model)
    {
        lock (_lock)
        {
            GeminiApiKey = apiKey.Trim();
            if (!string.IsNullOrWhiteSpace(model))
            {
                Model = model == "gemini-3.5-flash-lite" ? "gemini-2.0-flash" : model.Trim();
            }
            Save();
        }
    }

    public void SetGeminiKeyDirect(string apiKey, string? model)
    {
        lock (_lock)
        {
            GeminiApiKey = apiKey.Trim();
            if (!string.IsNullOrWhiteSpace(model))
            {
                Model = model == "gemini-3.5-flash-lite" ? "gemini-2.0-flash" : model.Trim();
            }
            Save();
        }
    }

    private void Save()
    {
        var s = new SecretsFile { AdminKey = AdminKey, GeminiApiKey = GeminiApiKey, Model = Model };
        File.WriteAllText(_path, JsonSerializer.Serialize(s, JsonOpts));
        Console.WriteLine($"[ChatSecrets] Saved secrets to {_path} (HasKey: {HasGeminiKey}, Model: {Model})");
    }

    private class SecretsFile
    {
        public string? AdminKey { get; set; }
        public string? GeminiApiKey { get; set; }
        public string? Model { get; set; }
    }
}
