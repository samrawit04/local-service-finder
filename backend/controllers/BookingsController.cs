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
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BookingsController(AppDbContext context)
    {
        _context = context;
    }

    // POST create booking (customer)
    [HttpPost]
    public async Task<IActionResult> Create(BookingDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var customerExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!customerExists) return Unauthorized("User account no longer exists. Please log out and log in again.");

        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == dto.ServiceId);
        if (service == null) return NotFound("Service not found.");

        var booking = new Booking
        {
            CustomerId = userId,
            ServiceId = service.Id,
            ProviderId = service.ProviderId,
            Date = dto.Date.ToUniversalTime(),
            Status = "Pending"
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();
        return Ok(booking);
    }

    // GET my bookings (works for both customer and provider)
    [HttpGet("my")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var asCustomer = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.Provider).ThenInclude(p => p.User)
            .Where(b => b.CustomerId == userId)
            .ToListAsync();

        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
        var asProvider = provider == null ? new List<Booking>() : await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .Where(b => b.ProviderId == provider.Id)
            .ToListAsync();

        return Ok(new { asCustomer, asProvider });
    }

    // PUT update booking status (provider accepts/rejects)
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateBookingStatusDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == id);
        if (booking == null) return NotFound("Booking not found.");

        // We need the provider's UserId to check if the current user is the provider.
        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.Id == booking.ProviderId);

        if (provider != null && provider.UserId == userId)
        {
            // Provider updating
            booking.Status = dto.Status;
        }
        else if (booking.CustomerId == userId)
        {
            // Customer updating
            if (dto.Status == "Completed" && booking.Status == "Accepted")
            {
                booking.Status = dto.Status;
            }
            else
            {
                return BadRequest($"Customers can only mark 'Accepted' bookings as completed. Current status is '{booking.Status}', attempted to set '{dto.Status}'.");
            }
        }
        else
        {
            return Forbid();
        }
        await _context.SaveChangesAsync();
        return Ok(booking);
    }
}