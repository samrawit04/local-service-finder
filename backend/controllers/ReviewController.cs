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

        if (dto.BookingId.HasValue)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == dto.BookingId.Value);
            if (booking == null) return NotFound("Booking not found.");
            if (booking.CustomerId != userId) return Forbid();
            if (booking.Status != "Completed") return BadRequest("You can only review completed bookings.");

            var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.BookingId == dto.BookingId.Value);
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
        else if (dto.JobPostId.HasValue)
        {
            var jobPost = await _context.JobPosts.Include(j => j.Applications).FirstOrDefaultAsync(j => j.Id == dto.JobPostId.Value);
            if (jobPost == null) return NotFound("Job Post not found.");
            if (jobPost.CustomerId != userId) return Forbid();

            var completedApp = jobPost.Applications.FirstOrDefault(a => a.Status == "Completed");
            if (completedApp == null) return BadRequest("This job has no completed application to review.");

            var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.JobPostId == dto.JobPostId.Value);
            if (alreadyReviewed) return BadRequest("You already reviewed this job.");

            var review = new Review
            {
                CustomerId = userId,
                ProviderId = completedApp.ProviderId,
                JobPostId = jobPost.Id,
                Rating = dto.Rating,
                Comment = dto.Comment
            };
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return Ok(review);
        }

        return BadRequest("Must provide BookingId or JobPostId.");
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