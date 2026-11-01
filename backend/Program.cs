using System.Text.Json.Serialization;
using GhostLab.Hubs;
using GhostLab.Models;
using GhostLab.Services;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddCors(o => o.AddPolicy("frontend", p =>
    p.SetIsOriginAllowed(origin => Uri.TryCreate(origin, UriKind.Absolute, out var u)
        && (u.Host == "localhost" || u.Host == "127.0.0.1"))
     .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddSingleton<LabStateService>();
builder.Services.AddSingleton<ChatSecretsService>();
builder.Services.AddSingleton<GeminiChatService>();
// Singleton + hosted wrapper để endpoint hazard gọi được TriggerBrownout.
builder.Services.AddSingleton<DustAccumulationService>();
builder.Services.AddHostedService(p => p.GetRequiredService<DustAccumulationService>());
builder.Services.AddSignalR().AddJsonProtocol(o =>
    o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.UseCors("frontend");

var staticFileProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
staticFileProvider.Mappings[".glb"] = "model/gltf-binary";
staticFileProvider.Mappings[".gltf"] = "model/gltf+json";

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileProvider
});

app.MapHub<LabHub>("/hubs/lab");

var api = app.MapGroup("/api");

api.MapGet("/projects", (LabStateService s) => Results.Ok(s.Projects));

api.MapGet("/stats", (LabStateService s) => Results.Ok(new
{
    s.Stats.FriedIcCount,
    s.Stats.ViewerPressure,
    s.Stats.Voltage,
    s.Stats.VoltageSagging,
    s.Stats.TotalIncense,
    s.Stats.TotalBonks,
    s.Stats.MosfetExplosions,
    AverageDust = Math.Round(s.AverageDust(), 1)
}));

api.MapPost("/projects/{id}/incense", async (string id, LabStateService s, IHubContext<LabHub> hub) =>
{
    var project = s.Mutate(() =>
    {
        var p = s.GetProject(id);
        if (p is null) return null;
        p.IncenseCount++;
        s.Stats.TotalIncense++;
        // Incense does not clean dust. It cleanses the soul. Allegedly.
        return p;
    });
    if (project is null) return Results.NotFound();

    await hub.Clients.All.SendAsync(LabHub.ProjectUpdated, s.Projects);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "incense", ProjectId = id,
        Message = $"🕯️ Một nén hương điện tử vừa được thắp cho {project.CodeName}. Tổng: {project.IncenseCount} nén. Mạch vẫn chưa chạy nhưng linh thiêng hơn hẳn."
    });
    return Results.Ok(project);
});

api.MapPost("/projects/{id}/bonk", async (string id, LabStateService s, IHubContext<LabHub> hub) =>
{
    var project = s.Mutate(() =>
    {
        var p = s.GetProject(id);
        if (p is null) return null;
        p.BonkCount++;
        s.Stats.TotalBonks++;
        s.Stats.ViewerPressure++;
        return p;
    });
    if (project is null) return Results.NotFound();

    await hub.Clients.All.SendAsync(LabHub.ProjectUpdated, s.Projects);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "bonk", ProjectId = id,
        Message = $"🔨 Cộp! {project.CodeName} vừa ăn một gõ đầu giục tiến độ. Áp lực người xem: {s.Stats.ViewerPressure}."
    });
    return Results.Ok(project);
});

api.MapPost("/projects/{id}/clean-dust", async (string id, LabStateService s, IHubContext<LabHub> hub) =>
{
    var project = s.Mutate(() =>
    {
        var p = s.GetProject(id);
        if (p is null) return null;
        p.DustLevel = Math.Max(0, p.DustLevel - 25);
        return p;
    });
    if (project is null) return Results.NotFound();

    await hub.Clients.All.SendAsync(LabHub.ProjectUpdated, s.Projects);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "clean-dust", ProjectId = id,
        Message = $"💨 Khí nén xịt vào {project.CodeName}. Bụi bay tứ tung — độ phủ bụi còn {project.DustLevel:F0}%. (DustAccumulationService đang lấp lại ngay khi bạn đọc dòng này.)"
    });
    return Results.Ok(project);
});

api.MapPost("/projects/{id}/boom", async (string id, LabStateService s, IHubContext<LabHub> hub) =>
{
    var project = s.Mutate(() =>
    {
        var p = s.GetProject(id);
        if (p is null) return null;
        p.Smoking = true;
        s.Stats.MosfetExplosions++;
        s.Stats.FriedIcCount++;
        return p;
    });
    if (project is null) return Results.NotFound();

    await hub.Clients.All.SendAsync(LabHub.ProjectUpdated, s.Projects);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "boom", ProjectId = id,
        Message = $"💥 BÙM! Một con MOSFET trên {project.CodeName} vừa thả khói ma thuật. IC hy sinh tổng cộng: {s.Stats.FriedIcCount}."
    });
    return Results.Ok(project);
});

// Xịt khí nén toàn lab — reset bụi mọi pedestal về 0%.
api.MapPost("/clean-all", async (LabStateService s, IHubContext<LabHub> hub) =>
{
    s.Mutate(() =>
    {
        foreach (var p in s.Projects) p.DustLevel = 0;
        return 0;
    });

    await hub.Clients.All.SendAsync(LabHub.ProjectUpdated, s.Projects);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "clean-all",
        Message = "💨 XỊT KHÍ NÉN TOÀN LAB: bụi thổi bay khắp hầm — độ phủ bụi về 0%. Hưởng thụ nhanh đi, bụi đang quay lại."
    });
    return Results.Ok(new { dust = 0 });
});

// Test quá tải nguồn — kéo rail xuống ~3.2V trong 2 giây.
api.MapPost("/hazard/brownout", async (DustAccumulationService dust, LabStateService s, IHubContext<LabHub> hub) =>
{
    dust.TriggerBrownout(3.2, 2.0);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "power",
        Message = "⚡ BROWNOUT TEST: rail sụt còn 3.2V trong 2 giây. Đèn chuyển vàng amber, kỹ sư chuyển màu xanh."
    });
    return Results.Ok(new { voltage = 3.2 });
});

api.MapGet("/excuses/random", (LabStateService s) =>
    Results.Ok(new { excuse = s.RandomExcuse(), at = DateTime.UtcNow }));

api.MapGet("/graveyard", (LabStateService s) => Results.Ok(s.Graveyard));

api.MapGet("/bad-ideas", (LabStateService s) =>
    Results.Ok(s.BadIdeas.OrderByDescending(b => b.SubmittedAt)));

api.MapPost("/bad-ideas", async (BadIdeaRequest req, LabStateService s, IHubContext<LabHub> hub) =>
{
    if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 200)
        return Results.BadRequest(new { error = "Ý tưởng tồi vẫn cần tiêu đề (tối đa 200 ký tự)." });

    var idea = s.Mutate(() =>
    {
        var i = new BadIdea
        {
            Id = Guid.NewGuid().ToString("N")[..8],
            Title = req.Title.Trim(),
            SubmittedBy = string.IsNullOrWhiteSpace(req.SubmittedBy) ? "Anonymous Enabler" : Clamp(req.SubmittedBy.Trim(), 40),
            CursedLevel = Math.Clamp(req.CursedLevel ?? 50, 0, 100),
            SubmittedAt = DateTime.UtcNow
        };
        s.BadIdeas.Add(i);
        return i;
    });

    await hub.Clients.All.SendAsync(LabHub.BadIdeasUpdated, s.BadIdeas.OrderByDescending(b => b.SubmittedAt).ToList());
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "bad-idea",
        Message = $"💡 {idea.SubmittedBy} vừa xúi dại kỹ sư ý tưởng mới: \"{idea.Title}\". Độ nguy hiểm: {idea.CursedLevel}%."
    });
    return Results.Ok(idea);
});

// Upvote một ý tưởng xúi dại — đấu trường dân chủ của những quyết định tồi.
api.MapPost("/bad-ideas/{id}/upvote", async (string id, LabStateService s, IHubContext<LabHub> hub) =>
{
    var idea = s.Mutate(() =>
    {
        var i = s.BadIdeas.FirstOrDefault(b => b.Id == id);
        if (i is not null) i.Upvotes++;
        return i;
    });
    if (idea is null) return Results.NotFound();

    await hub.Clients.All.SendAsync(LabHub.BadIdeasUpdated, s.BadIdeas.OrderByDescending(b => b.SubmittedAt).ToList());
    return Results.Ok(idea);
});

// Góc cà khịa — roast log theo từng dự án.
api.MapGet("/projects/{id}/roasts", (string id, LabStateService s) =>
    Results.Ok(s.Roasts.Where(r => r.ProjectId.Equals(id, StringComparison.OrdinalIgnoreCase)).OrderByDescending(r => r.At)));

api.MapPost("/projects/{id}/roasts", async (string id, RoastRequest req, LabStateService s, IHubContext<LabHub> hub) =>
{
    if (s.GetProject(id) is null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(req.Text) || req.Text.Length > 300)
        return Results.BadRequest(new { error = "Cà khịa cũng cần nội dung (tối đa 300 ký tự)." });

    var roast = s.Mutate(() =>
    {
        var r = new RoastComment
        {
            Id = Guid.NewGuid().ToString("N")[..8],
            ProjectId = s.GetProject(id)!.Id,
            Author = string.IsNullOrWhiteSpace(req.Author) ? "Kỹ Sư Ẩn Danh" : Clamp(req.Author.Trim(), 40),
            Role = string.IsNullOrWhiteSpace(req.Role) ? "Người Qua Đường" : Clamp(req.Role.Trim(), 40),
            Text = req.Text.Trim(),
            At = DateTime.UtcNow
        };
        s.Roasts.Add(r);
        return r;
    });

    await hub.Clients.All.SendAsync(LabHub.RoastAdded, roast);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "roast", ProjectId = id,
        Message = $"💬 {roast.Author} ({roast.Role}) vừa cà khịa {s.GetProject(id)!.CodeName}: \"{roast.Text[..Math.Min(60, roast.Text.Length)]}…\""
    });
    return Results.Ok(roast);
});

// ---- Trợ lý trực ban — proxy Gemini với persona GhostLab, key giữ phía server ----
api.MapPost("/chat", async (ChatRequest req, GeminiChatService chat) =>
{
    var msg = (req.Message ?? "").Trim();
    if (msg.Length == 0) return Results.BadRequest(new { error = "Tin nhắn trống — giống phần lớn roadmap trong xưởng này." });
    if (msg.Length > 1000) msg = msg[..1000];
    var r = await chat.ReplyAsync(msg, req.History ?? new());
    return Results.Ok(new { reply = r.Text, offline = r.Offline });
});

api.MapGet("/chat/config", async (ChatSecretsService sec, GeminiChatService chat) =>
{
    var status = await chat.GetStatusAsync();
    return Results.Ok(new
    {
        hasKey = sec.HasGeminiKey,
        model = sec.Model,
        status
    });
});

api.MapPost("/chat/config", async (GeminiKeyRequest req, ChatSecretsService sec, GeminiChatService chat) =>
{
    var key = (req.ApiKey ?? "").Trim();
    var model = string.IsNullOrWhiteSpace(req.Model) ? "gemini-2.0-flash" : req.Model.Trim();
    sec.SetGeminiKeyDirect(key, model);
    chat.InvalidateStatus();
    var status = await chat.GetStatusAsync();
    return Results.Ok(new
    {
        hasKey = sec.HasGeminiKey,
        model = sec.Model,
        status
    });
});

// ---- Admin bí mật — chỉ đường link huyền thoại mới dẫn tới ----
static bool IsAdmin(HttpRequest r, ChatSecretsService sec) => sec.CheckAdmin(r.Headers["X-Admin-Key"].FirstOrDefault());

api.MapGet("/admin/status", async (HttpRequest http, ChatSecretsService sec, GeminiChatService chat) =>
{
    if (!sec.HasAdminKey) return Results.Ok(new { adminSet = false, keyConfigured = false, model = sec.Model, geminiStatus = "locked" });
    if (!IsAdmin(http, sec)) return Results.Unauthorized();
    var st = await chat.GetStatusAsync();
    return Results.Ok(new { adminSet = true, keyConfigured = chat.HasKey, model = sec.Model, geminiStatus = st });
});

api.MapPost("/admin/init", (AdminInitRequest req, ChatSecretsService sec) =>
{
    var k = (req.AdminKey ?? "").Trim();
    if (sec.HasAdminKey) return Results.Conflict(new { error = "Đã có mã chỉ huy rồi." });
    if (k.Length < 4 || k.Length > 64) return Results.BadRequest(new { error = "Mã chỉ huy 4-64 ký tự, đừng để '1234'." });
    sec.InitAdminKey(k);
    return Results.Ok(new { adminSet = true });
});

api.MapPost("/admin/gemini-key", async (GeminiKeyRequest req, HttpRequest http, ChatSecretsService sec, GeminiChatService chat) =>
{
    if (!IsAdmin(http, sec)) return Results.Unauthorized();
    var model = (req.Model ?? "").Trim();
    sec.SaveGemini((req.ApiKey ?? "").Trim(), model.Length > 0 ? model : null);
    chat.InvalidateStatus();
    var st = await chat.GetStatusAsync();
    return Results.Ok(new { keyConfigured = chat.HasKey, model = sec.Model, geminiStatus = st });
});

// Kích hoả hoạn giả lập — bùm toàn bộ IC một lúc cho vui cửa vui nhà.
api.MapPost("/hazard/boom-all", async (LabStateService s, IHubContext<LabHub> hub) =>
{
    var total = s.Mutate(() =>
    {
        foreach (var p in s.Projects) p.Smoking = true;
        s.Stats.MosfetExplosions += s.Projects.Count;
        s.Stats.FriedIcCount += s.Projects.Count;
        return s.Projects.Count;
    });

    await hub.Clients.All.SendAsync(LabHub.ProjectUpdated, s.Projects);
    await hub.Clients.All.SendAsync(LabHub.StatsUpdated, s.Stats);
    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "boom-all",
        Message = $"💥 KÍCH HOẢ HOẠN GIẢ LẬP: {total} dự án đồng loạt thả khói ma thuật. Nghĩa địa linh kiện sắp phải mở rộng đất."
    });
    return Results.Ok(new { smoking = total });
});

// SPA fallback — everything non-API serves the haunted lab
app.MapFallbackToFile("index.html");

app.Run();

// Cắt chuỗi an toàn — [..n] ném exception nếu chuỗi ngắn hơn n.
static string Clamp(string s, int max) => s.Length <= max ? s : s[..max];
