using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _context;

    public ChatHub(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Called by the client to join a specific conversation group.
    /// Only the two participants are allowed.
    /// </summary>
    public async Task JoinConversation(string conversationId)
    {
        var userId = Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (!Guid.TryParse(conversationId, out var convId))
            throw new HubException("Invalid conversation ID.");

        var conv = await _context.ChatConversations.FindAsync(convId);
        if (conv == null) throw new HubException("Conversation not found.");

        if (conv.ClientId != userId && conv.ProviderUserId != userId)
            throw new HubException("Access denied.");

        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
    }

    /// <summary>
    /// Called by the client to leave a conversation group.
    /// </summary>
    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);
    }

    /// <summary>
    /// Send a message to the conversation. Persists to DB and broadcasts to the group.
    /// </summary>
    public async Task SendMessage(string conversationId, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new HubException("Message cannot be empty.");

        var userId = Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (!Guid.TryParse(conversationId, out var convId))
            throw new HubException("Invalid conversation ID.");

        var conv = await _context.ChatConversations.FindAsync(convId);
        if (conv == null) throw new HubException("Conversation not found.");

        if (conv.ClientId != userId && conv.ProviderUserId != userId)
            throw new HubException("Access denied.");

        var sender = await _context.Users.FindAsync(userId);

        var message = new ChatMessage
        {
            ConversationId = convId,
            SenderId       = userId,
            Content        = content.Trim(),
            SentAt         = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        // Broadcast to all members of the conversation group
        await Clients.Group(conversationId).SendAsync("ReceiveMessage", new
        {
            message.Id,
            message.ConversationId,
            message.SenderId,
            SenderName = sender?.Name ?? "Unknown",
            message.Content,
            message.SentAt,
            message.IsRead
        });
    }

    /// <summary>
    /// Mark all messages in a conversation as read for the current user.
    /// </summary>
    public async Task MarkRead(string conversationId)
    {
        var userId = Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (!Guid.TryParse(conversationId, out var convId))
            throw new HubException("Invalid conversation ID.");

        var conv = await _context.ChatConversations.FindAsync(convId);
        if (conv == null || (conv.ClientId != userId && conv.ProviderUserId != userId))
            throw new HubException("Access denied.");

        var unread = await _context.ChatMessages
            .Where(m => m.ConversationId == convId && m.SenderId != userId && !m.IsRead)
            .ToListAsync();

        foreach (var m in unread) m.IsRead = true;
        await _context.SaveChangesAsync();

        // Notify the other participant that their messages were read
        await Clients.Group(conversationId).SendAsync("MessagesRead", new { conversationId, readById = userId });
    }
}
