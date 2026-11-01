using DustyStarkLab.Hubs;
using DustyStarkLab.Models;
using Microsoft.AspNetCore.SignalR;

namespace DustyStarkLab.Services;

/// <summary>
/// The cruel physics of an abandoned lab: dust accumulates forever,
/// and the budget 5V rail randomly sags to 3.1V, dimming every hologram.
/// </summary>
public class DustAccumulationService : BackgroundService
{
    private readonly LabStateService _state;
    private readonly IHubContext<LabHub> _hub;
    private readonly ILogger<DustAccumulationService> _log;
    private bool _sagging;
    private int _sagTicksRemaining;

    public DustAccumulationService(LabStateService state, IHubContext<LabHub> hub, ILogger<DustAccumulationService> log)
    {
        _state = state;
        _hub = hub;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(4));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                var evt = _state.Mutate(() =>
                {
                    foreach (var p in _state.Projects)
                        p.DustLevel = Math.Min(100, p.DustLevel + 0.3 + Random.Shared.NextDouble() * 0.4);

                    LabEvent? evt = null;
                    if (_sagging)
                    {
                        if (--_sagTicksRemaining <= 0)
                        {
                            _sagging = false;
                            _state.Stats.Voltage = 5.0;
                            _state.Stats.VoltageSagging = false;
                            evt = new LabEvent { Type = "power", Message = "J.A.R.V.I.S.: nguồn hồi phục 5.0V. Ai đó đã rút ấm siêu tốc." };
                        }
                    }
                    else if (Random.Shared.NextDouble() < 0.06)
                    {
                        _sagging = true;
                        _sagTicksRemaining = 1 + Random.Shared.Next(3);
                        _state.Stats.Voltage = 3.1 + Random.Shared.NextDouble() * 0.4;
                        _state.Stats.VoltageSagging = true;
                        evt = new LabEvent { Type = "power", Message = $"⚡ SỤT NGUỒN: rail 5V còn {_state.Stats.Voltage:F1}V. Hologram chớp tắt như đuốc sắp tàn." };
                    }
                    return evt;
                });

                await _hub.Clients.All.SendAsync(LabHub.StatsUpdated, _state.Stats, stoppingToken);
                await _hub.Clients.All.SendAsync(LabHub.ProjectUpdated, _state.Projects, stoppingToken);
                if (evt is not null)
                    await _hub.Clients.All.SendAsync(LabHub.LabEventFeed, evt, stoppingToken);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Dust tick failed — the dust wins this round.");
            }
        }
    }
}
