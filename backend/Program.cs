using System.Text.Json.Serialization;
using DustyStarkLab.Hubs;
using DustyStarkLab.Models;
using DustyStarkLab.Services;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddCors(o => o.AddPolicy("frontend", p =>
    p.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
     .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddSingleton<LabStateService>();
builder.Services.AddHostedService<DustAccumulationService>();
builder.Services.AddSignalR().AddJsonProtocol(o =>
    o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();
app.UseCors("frontend");

app.UseDefaultFiles();
app.UseStaticFiles();

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
        Message = $"🔨 Cộp! {project.CodeName} vừa ăn một gõ mỏ hàn giục tiến độ. Áp lực người xem: {s.Stats.ViewerPressure}."
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
            SubmittedBy = string.IsNullOrWhiteSpace(req.SubmittedBy) ? "Anonymous Enabler" : req.SubmittedBy.Trim()[..40],
            CursedLevel = Math.Clamp(req.CursedLevel ?? 50, 0, 100),
            SubmittedAt = DateTime.UtcNow
        };
        s.BadIdeas.Add(i);
        return i;
    });

    await hub.Clients.All.SendAsync(LabHub.LabEventFeed, new LabEvent
    {
        Type = "bad-idea",
        Message = $"💡 {idea.SubmittedBy} vừa xúi dại kỹ sư ý tưởng mới: \"{idea.Title}\". Độ nguy hiểm: {idea.CursedLevel}%."
    });
    return Results.Ok(idea);
});

// SPA fallback — everything non-API serves the haunted lab
app.MapFallbackToFile("index.html");

app.Run();
