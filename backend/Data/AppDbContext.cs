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
    public DbSet<backend.Models.Notification> Notifications { get; set; }
    public DbSet<backend.Models.ChatConversation> ChatConversations { get; set; }
    public DbSet<backend.Models.ChatMessage> ChatMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ChatConversation has TWO User FKs — specify them explicitly
        modelBuilder.Entity<backend.Models.ChatConversation>()
            .HasOne(c => c.Client)
            .WithMany()
            .HasForeignKey(c => c.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<backend.Models.ChatConversation>()
            .HasOne(c => c.ProviderUser)
            .WithMany()
            .HasForeignKey(c => c.ProviderUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ChatMessage → Sender
        modelBuilder.Entity<backend.Models.ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}