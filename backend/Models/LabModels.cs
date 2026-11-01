namespace DustyStarkLab.Models;

/// <summary>Roadmap task status. XONG = done, DANG NGAP = dozing off, TRONG MO = in dreams only.</summary>
public enum RoadmapStatus
{
    Xong,
    DangNgap,
    TrongMo
}

public class RoadmapItem
{
    public RoadmapStatus Status { get; set; }
    public string Description { get; set; } = "";
}

public class Roadmap
{
    public List<RoadmapItem> Hardware { get; set; } = new();
    public List<RoadmapItem> Firmware { get; set; } = new();
    public List<RoadmapItem> Software { get; set; } = new();
}

public class DustyProject
{
    public string Id { get; set; } = "";
    public string CodeName { get; set; } = "";
    public string Name { get; set; } = "";
    public string Tagline { get; set; } = "";
    public string GhostStatus { get; set; } = "";
    public string DamageReport { get; set; } = "";
    public string TimeParadox { get; set; } = "";
    public int CompletionPercent { get; set; }
    /// <summary>0-100. Accumulates over time. At 96%+ it is legally a spider colony.</summary>
    public double DustLevel { get; set; }
    public bool Smoking { get; set; }
    /// <summary>3D anchor position in the bunker scene.</summary>
    public double[] Position { get; set; } = Array.Empty<double>();
    public int IncenseCount { get; set; }
    public int BonkCount { get; set; }
    public Roadmap Roadmap { get; set; } = new();
}

public class GraveyardEntry
{
    public string Id { get; set; } = "";
    public string Component { get; set; } = "";
    public string Epitaph { get; set; } = "";
    public string CauseOfDeath { get; set; } = "";
    public DateTime DiedAt { get; set; }
}

public class BadIdea
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string SubmittedBy { get; set; } = "Anonymous Enabler";
    public int CursedLevel { get; set; } = 50;
    public DateTime SubmittedAt { get; set; }
}

public class LabStats
{
    public int FriedIcCount { get; set; } = 27;
    /// <summary>Áp lực từ người xem — rises with every bonk.</summary>
    public int ViewerPressure { get; set; } = 3;
    /// <summary>Arc reactor rail voltage. Nominally 5.0V, drops to 3.1V when the reactor sags.</summary>
    public double Voltage { get; set; } = 5.0;
    public bool VoltageSagging { get; set; }
    public int TotalIncense { get; set; }
    public int TotalBonks { get; set; }
    public int MosfetExplosions { get; set; }
}

public class LabEvent
{
    public string Type { get; set; } = "";
    public string? ProjectId { get; set; }
    public string Message { get; set; } = "";
    public DateTime At { get; set; } = DateTime.UtcNow;
}

public record BadIdeaRequest(string Title, string? SubmittedBy, int? CursedLevel);
