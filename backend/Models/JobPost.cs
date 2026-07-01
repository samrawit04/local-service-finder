namespace backend.Models;

public class JobPost
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Budget { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";   // Open | Closed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<JobApplication> Applications { get; set; } = new();
}
