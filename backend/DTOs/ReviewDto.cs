namespace backend.DTOs;

public class ReviewDto
{
    public Guid BookingId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}