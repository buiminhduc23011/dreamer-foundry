using Microsoft.AspNetCore.SignalR;

namespace GhostLab.Hubs;

/// <summary>
/// Real-time lab telemetry channel. All mutation endpoints and the dust service
/// broadcast through this hub so every visitor watches the same haunted lab.
/// </summary>
public class LabHub : Hub
{
    public const string ProjectUpdated = "projectUpdated";
    public const string StatsUpdated = "statsUpdated";
    public const string LabEventFeed = "labEvent";
    public const string RoastAdded = "roastAdded";
    public const string BadIdeasUpdated = "badIdeasUpdated";

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync(LabEventFeed, new Models.LabEvent
        {
            Type = "system",
            Message = "GHOSTLAB TELEMETRY // AI LOG: kết nối thành công. Cảnh báo — nguồn 5V đang chạy bằng niềm tin."
        });
        await base.OnConnectedAsync();
    }
}
