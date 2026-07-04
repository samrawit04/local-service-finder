using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;

    public ChatController(AppDbContext context)
    {
        _context = context;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── GET /api/chat/conversations ──────────────────────────────────
    // Returns all conversations the current user participates in,
    // with the last message and unread count.
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var uid = CurrentUserId;

        var conversations = await _context.ChatConversations
            .Where(c => c.ClientId == uid || c.ProviderUserId == uid)
            .Include(c => c.Client)
            .Include(c => c.ProviderUser)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
            .Include(c => c.Booking)
                .ThenInclude(b => b!.Service)
            .Include(c => c.JobApplication)
                .ThenInclude(a => a!.JobPost)
            .OrderByDescending(c => c.Messages.Max(m => (DateTime?)m.SentAt) ?? c.CreatedAt)
            .ToListAsync();

        var result = conversations.Select(c =>
        {
            var lastMsg = c.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();
            var unread  = c.Messages.Count(m => m.SenderId != uid && !m.IsRead);
            var otherUser = c.ClientId == uid ? c.ProviderUser : c.Client;
            var subject = c.BookingId.HasValue
                ? c.Booking?.Service?.Title ?? "Booking"
                : c.JobApplication?.JobPost?.Title ?? "Job";

            return new
            {
                c.Id,
                c.CreatedAt,
                c.BookingId,
                c.JobApplicationId,
                Subject = subject,
                OtherUser = new { otherUser.Id, otherUser.Name },
                LastMessage = lastMsg == null ? null : new
                {
                    lastMsg.Content,
                    lastMsg.SentAt,
                    lastMsg.SenderId
                },
                UnreadCount = unread
            };
        });

        return Ok(result);
    }

    // ── GET /api/chat/conversations/{id}/messages ─────────────────────
    [HttpGet("conversations/{id}/messages")]
    public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var uid  = CurrentUserId;
        var conv = await _context.ChatConversations.FindAsync(id);

        if (conv == null) return NotFound();
        if (conv.ClientId != uid && conv.ProviderUserId != uid) return Forbid();

        var messages = await _context.ChatMessages
            .Where(m => m.ConversationId == id)
            .Include(m => m.Sender)
            .OrderBy(m => m.SentAt)
            .Skip(skip)
            .Take(take)
            .Select(m => new
            {
                m.Id,
                m.ConversationId,
                m.SenderId,
                SenderName = m.Sender.Name,
                m.Content,
                m.SentAt,
                m.IsRead
            })
            .ToListAsync();

        return Ok(messages);
    }

    // ── GET /api/chat/unread-count ────────────────────────────────────
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var uid = CurrentUserId;

        var count = await _context.ChatMessages
            .Where(m =>
                m.SenderId != uid &&
                !m.IsRead &&
                (m.Conversation.ClientId == uid || m.Conversation.ProviderUserId == uid))
            .CountAsync();

        return Ok(new { count });
    }
}
