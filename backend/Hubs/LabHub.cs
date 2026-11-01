using Microsoft.AspNetCore.SignalR;

namespace DustyStarkLab.Hubs;

/// <summary>
/// Real-time lab telemetry channel. All mutation endpoints and the dust service
/// broadcast through this hub so every visitor watches the same haunted lab.
/// </summary>
public class LabHub : Hub
{
    public const string ProjectUpdated = "projectUpdated";
    public const string StatsUpdated = "statsUpdated";
    public const string LabEventFeed = "labEvent";

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync(LabEventFeed, new Models.LabEvent
        {
            Type = "system",
            Message = "J.A.R.V.I.S. Ngáo: kết nối thành công. Cảnh báo — nguồn 5V đang chạy bằng niềm tin."
        });
        await base.OnConnectedAsync();
    }
}
