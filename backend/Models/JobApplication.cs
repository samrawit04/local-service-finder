namespace backend.Models;

public class JobApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobPostId { get; set; }
    public JobPost JobPost { get; set; } = null!;
    public Guid ProviderId { get; set; }
    public ServiceProvider Provider { get; set; } = null!;
    public string CoverNote { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";  // Pending | Accepted | Rejected
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
}
