using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<backend.Models.User> Users { get; set; }
    public DbSet<backend.Models.ServiceProvider> ServiceProviders { get; set; }
    public DbSet<backend.Models.Service> Services { get; set; }
    public DbSet<backend.Models.Booking> Bookings { get; set; }
    public DbSet<backend.Models.Review> Reviews { get; set; }
    public DbSet<backend.Models.JobPost> JobPosts { get; set; }
    public DbSet<backend.Models.JobApplication> JobApplications { get; set; }
}