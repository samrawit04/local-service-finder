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
public class JobPostsController : ControllerBase
{
    private readonly AppDbContext _context;

    public JobPostsController(AppDbContext context)
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

    // ── GET all open jobs (filter by category) ──
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? search)
    {
        var query = _context.JobPosts
            .Include(j => j.Customer)
            .Include(j => j.Applications)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(j => j.Category.Contains(category));

        if (!string.IsNullOrEmpty(search))
            query = query.Where(j =>
                j.Title.Contains(search) ||
                j.Description.Contains(search) ||
                j.Category.Contains(search));

        var jobs = await query
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new
            {
                j.Id,
                j.Title,
                j.Description,
                j.Category,
                j.Budget,
                j.Location,
                j.Status,
                j.CreatedAt,
                CustomerName = j.Customer.Name,
                ApplicationCount = j.Applications.Count
            })
            .ToListAsync();

        return Ok(jobs);
    }

    // ── GET single job with full applications ──
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var job = await _context.JobPosts
            .Include(j => j.Customer)
            .Include(j => j.Applications)
                .ThenInclude(a => a.Provider)
                    .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null) return NotFound();

        return Ok(new
        {
            job.Id,
            job.Title,
            job.Description,
            job.Category,
            job.Budget,
            job.Location,
            job.Status,
            job.CreatedAt,
            CustomerId = job.CustomerId,
            CustomerName = job.Customer.Name,
            Applications = job.Applications.Select(a => new
            {
                a.Id,
                a.CoverNote,
                a.CvUrl,
                a.Status,
                a.AppliedAt,
                ProviderId = a.ProviderId,
                ProviderName = a.Provider.User.Name,
                ProviderPhone = a.Provider.Phone,
                ProviderLocation = a.Provider.Location,
                ProviderBio = a.Provider.Bio
            })
        });
    }

    // ── POST create a job (customer only) ──
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(JobPostDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _context.Users.FindAsync(userId);

        if (user == null || user.Role != "Customer")
            return BadRequest("Only customers can post jobs.");

        var job = new JobPost
        {
            CustomerId = userId,
            Title = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            Budget = dto.Budget,
            Location = dto.Location
        };

        _context.JobPosts.Add(job);
        await _context.SaveChangesAsync();
        return Ok(job);
    }

    // ── DELETE own job ──
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var job = await _context.JobPosts.FindAsync(id);

        if (job == null) return NotFound();
        if (job.CustomerId != userId) return Forbid();

        _context.JobPosts.Remove(job);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // ── POST apply to a job (provider only) ──
    [Authorize]
    [HttpPost("{id}/apply")]
    public async Task<IActionResult> Apply(Guid id, JobApplicationDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
        if (provider == null) return BadRequest("You must create a provider profile first.");

        var job = await _context.JobPosts.FindAsync(id);
        if (job == null) return NotFound();
        if (job.Status != "Open") return BadRequest("This job is no longer accepting applications.");

        // Prevent duplicate application
        var existing = await _context.JobApplications
            .FirstOrDefaultAsync(a => a.JobPostId == id && a.ProviderId == provider.Id);
        if (existing != null) return BadRequest("You have already applied to this job.");

        var providerUser = await _context.Users.FindAsync(provider.UserId);
        var application = new JobApplication
        {
            JobPostId  = id,
            ProviderId = provider.Id,
            CoverNote  = dto.CoverNote,
            CvUrl      = dto.CvUrl ?? string.Empty
        };

        _context.JobApplications.Add(application);

        // Notify the job owner
        Notify(
            job.CustomerId,
            "New Job Application",
            $"{providerUser?.Name ?? "A provider"} applied to your job: \"{job.Title}\".",
            "new_application"
        );

        await _context.SaveChangesAsync();
        return Ok(application);
    }

    // ── PUT accept an application ──
    [Authorize]
    [HttpPut("{id}/applications/{appId}/accept")]
    public async Task<IActionResult> Accept(Guid id, Guid appId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var job = await _context.JobPosts
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null) return NotFound();
        if (job.CustomerId != userId) return Forbid();

        var app = job.Applications.FirstOrDefault(a => a.Id == appId);
        if (app == null) return NotFound();

        // Accept this one, reject all others
        foreach (var a in job.Applications)
            a.Status = a.Id == appId ? "Accepted" : "Rejected";

        job.Status = "Closed";

        // Notify the accepted provider
        var acceptedApp = job.Applications.First(a => a.Id == appId);
        var acceptedProvider = await _context.ServiceProviders.FindAsync(acceptedApp.ProviderId);
        if (acceptedProvider != null)
        {
            Notify(acceptedProvider.UserId, "Application Accepted ✓",
                $"Congratulations! Your application to \"{job.Title}\" has been accepted.",
                "application_accepted");

            // Create a chat conversation between the customer and the accepted provider
            var existingConv = await _context.ChatConversations
                .FirstOrDefaultAsync(c => c.JobApplicationId == appId);
            if (existingConv == null)
            {
                _context.ChatConversations.Add(new backend.Models.ChatConversation
                {
                    JobApplicationId = appId,
                    ClientId         = job.CustomerId,
                    ProviderUserId   = acceptedProvider.UserId
                });
            }
        }

        // Notify rejected providers
        foreach (var a in job.Applications.Where(a => a.Id != appId))
        {
            var rejectedProvider = await _context.ServiceProviders.FindAsync(a.ProviderId);
            if (rejectedProvider != null)
                Notify(rejectedProvider.UserId, "Application Update",
                    $"Another applicant was selected for \"{job.Title}\".",
                    "application_rejected");
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    // ── PUT reject a specific application ──
    [Authorize]
    [HttpPut("{id}/applications/{appId}/reject")]
    public async Task<IActionResult> Reject(Guid id, Guid appId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var job = await _context.JobPosts
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null) return NotFound();
        if (job.CustomerId != userId) return Forbid();

        var app = job.Applications.FirstOrDefault(a => a.Id == appId);
        if (app == null) return NotFound();

        app.Status = "Rejected";

        // Notify the provider
        var rejectedProvider = await _context.ServiceProviders.FindAsync(app.ProviderId);
        if (rejectedProvider != null)
            Notify(rejectedProvider.UserId, "Application Not Selected",
                $"Your application to \"{job.Title}\" was not selected this time.",
                "application_rejected");

        await _context.SaveChangesAsync();
        return Ok();
    }

    // ── PUT complete an application ──
    [Authorize]
    [HttpPut("{id}/applications/{appId}/complete")]
    public async Task<IActionResult> Complete(Guid id, Guid appId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var job = await _context.JobPosts
            .Include(j => j.Applications)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null) return NotFound();
        if (job.CustomerId != userId) return Forbid();

        var app = job.Applications.FirstOrDefault(a => a.Id == appId);
        if (app == null) return NotFound();

        if (app.Status != "Accepted") return BadRequest("Only accepted applications can be marked as completed.");

        app.Status = "Completed";

        // Notify the provider
        var completedProvider = await _context.ServiceProviders.FindAsync(app.ProviderId);
        var customer = await _context.Users.FindAsync(job.CustomerId);
        if (completedProvider != null)
            Notify(completedProvider.UserId, "Job Marked as Completed",
                $"{customer?.Name ?? "The customer"} has marked your work on \"{job.Title}\" as completed. You may receive a review!",
                "job_completed");

        await _context.SaveChangesAsync();
        return Ok();
    }

    // ── GET my posted jobs (customer) ──
    [Authorize]
    [HttpGet("my-posts")]
    public async Task<IActionResult> MyPosts()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var jobs = await _context.JobPosts
            .Where(j => j.CustomerId == userId)
            .Include(j => j.Applications)
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new
            {
                j.Id,
                j.Title,
                j.Category,
                j.Budget,
                j.Location,
                j.Status,
                j.CreatedAt,
                ApplicationCount = j.Applications.Count
            })
            .ToListAsync();

        return Ok(jobs);
    }

    // ── GET my applications (provider) ──
    [Authorize]
    [HttpGet("my-applications")]
    public async Task<IActionResult> MyApplications()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
        if (provider == null) return Ok(new List<object>());

        var apps = await _context.JobApplications
            .Where(a => a.ProviderId == provider.Id)
            .Include(a => a.JobPost)
                .ThenInclude(j => j.Customer)
            .OrderByDescending(a => a.AppliedAt)
            .Select(a => new
            {
                a.Id,
                a.CoverNote,
                a.CvUrl,
                a.Status,
                a.AppliedAt,
                Job = new
                {
                    a.JobPost.Id,
                    a.JobPost.Title,
                    a.JobPost.Category,
                    a.JobPost.Budget,
                    a.JobPost.Location,
                    a.JobPost.Status,
                    CustomerName = a.JobPost.Customer.Name
                }
            })
            .ToListAsync();

        return Ok(apps);
    }
}
