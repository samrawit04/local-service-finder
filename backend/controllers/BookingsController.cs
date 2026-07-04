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

    // Helper — fire and forget a notification
    private void Notify(Guid userId, string title, string message, string type)
    {
        _context.Notifications.Add(new Notification
        {
            UserId  = userId,
            Title   = title,
            Message = message,
            Type    = type
        });
    }

    // POST create booking (customer)
    [HttpPost]
    public async Task<IActionResult> Create(BookingDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var customerExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!customerExists) return Unauthorized("User account no longer exists. Please log out and log in again.");

        var service = await _context.Services
            .Include(s => s.Provider)
            .FirstOrDefaultAsync(s => s.Id == dto.ServiceId);
        if (service == null) return NotFound("Service not found.");

        var customer = await _context.Users.FindAsync(userId);

        var booking = new Booking
        {
            CustomerId = userId,
            ServiceId  = service.Id,
            ProviderId = service.ProviderId,
            Date       = dto.Date.ToUniversalTime(),
            Status     = "Pending"
        };

        _context.Bookings.Add(booking);

        // Notify provider of new booking
        Notify(
            service.Provider.UserId,
            "New Booking Request",
            $"{customer?.Name ?? "A customer"} has requested your service: {service.Title}.",
            "new_booking"
        );

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

    // PUT update booking status (provider accepts/rejects, customer completes)
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateBookingStatusDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var booking = await _context.Bookings
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (booking == null) return NotFound("Booking not found.");

        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.Id == booking.ProviderId);
        var customer = await _context.Users.FindAsync(booking.CustomerId);
        var serviceName = booking.Service?.Title ?? "service";

        if (provider != null && provider.UserId == userId)
        {
            // Provider updating
            var oldStatus = booking.Status;
            booking.Status = dto.Status;

            // Notify customer of status change
            if (dto.Status == "Accepted")
            {
                Notify(booking.CustomerId, "Booking Accepted ✓",
                    $"Your booking for \"{serviceName}\" has been accepted!", "booking_accepted");

                // Create chat conversation if it doesn't already exist
                var existingConv = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.BookingId == booking.Id);
                if (existingConv == null)
                {
                    _context.ChatConversations.Add(new backend.Models.ChatConversation
                    {
                        BookingId     = booking.Id,
                        ClientId      = booking.CustomerId,
                        ProviderUserId = provider.UserId
                    });
                }
            }
            else if (dto.Status == "Rejected")
                Notify(booking.CustomerId, "Booking Rejected",
                    $"Unfortunately, your booking for \"{serviceName}\" was declined.", "booking_rejected");
        }
        else if (booking.CustomerId == userId)
        {
            // Customer marking completed
            if (dto.Status == "Completed" && booking.Status == "Accepted")
            {
                booking.Status = dto.Status;

                // Notify provider the customer marked it complete
                if (provider != null)
                    Notify(provider.UserId, "Booking Marked Completed",
                        $"{customer?.Name ?? "The customer"} marked the booking for \"{serviceName}\" as completed. You may now receive a review!",
                        "booking_completed");
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