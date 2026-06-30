using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    // POST leave a review (customer, after a booking)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(ReviewDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == dto.BookingId);
        if (booking == null) return NotFound("Booking not found.");
        if (booking.CustomerId != userId) return Forbid();
        if (booking.Status != "Accepted") return BadRequest("You can only review completed bookings.");

        var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.BookingId == dto.BookingId);
        if (alreadyReviewed) return BadRequest("You already reviewed this booking.");

        var review = new Review
        {
            CustomerId = userId,
            ProviderId = booking.ProviderId,
            BookingId = booking.Id,
            Rating = dto.Rating,
            Comment = dto.Comment
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return Ok(review);
    }

    // GET reviews for a provider
    [HttpGet("{providerId}")]
    public async Task<IActionResult> GetByProvider(Guid providerId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.Customer)
            .Where(r => r.ProviderId == providerId)
            .ToListAsync();

        return Ok(reviews);
    }
}