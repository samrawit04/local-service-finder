namespace backend.DTOs;

public class BookingDto
{
    public Guid ServiceId { get; set; }
    public DateTime Date { get; set; }
}

public class UpdateBookingStatusDto
{
    public string Status { get; set; } = string.Empty; // Accepted or Rejected
}