namespace backend.Models;

public class ChatConversation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Linked to either a Booking or a JobApplication (one will be null)
    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public Guid? JobApplicationId { get; set; }
    public JobApplication? JobApplication { get; set; }

    // The two participants
    public Guid ClientId { get; set; }          // User (customer)
    public User Client { get; set; } = null!;

    public Guid ProviderUserId { get; set; }    // User (the provider's user account)
    public User ProviderUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<ChatMessage> Messages { get; set; } = new();
}
