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
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicesController(AppDbContext context)
    {
        _context = context;
    }

    // GET all services, optional filter by category
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        var query = _context.Services
            .Include(s => s.Provider)
            .ThenInclude(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(s => s.Category.Contains(category));

        var services = await query.ToListAsync();
        return Ok(services);
    }

    // GET single service
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Provider)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service == null) return NotFound();
        return Ok(service);
    }

    // POST create a service (provider only)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(ServiceDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
        if (provider == null) return BadRequest("You must create a provider profile first.");

        var service = new Service
        {
            ProviderId = provider.Id,
            Title = dto.Title,
            Category = dto.Category,
            Description = dto.Description
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();
        return Ok(service);
    }

    // PUT update own service
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, ServiceDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services.Include(s => s.Provider).FirstOrDefaultAsync(s => s.Id == id);

        if (service == null) return NotFound();
        if (service.Provider.UserId != userId) return Forbid();

        service.Title = dto.Title;
        service.Category = dto.Category;
        service.Description = dto.Description;

        await _context.SaveChangesAsync();
        return Ok(service);
    }

    // DELETE own service
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var service = await _context.Services.Include(s => s.Provider).FirstOrDefaultAsync(s => s.Id == id);

        if (service == null) return NotFound();
        if (service.Provider.UserId != userId) return Forbid();

        _context.Services.Remove(service);
        await _context.SaveChangesAsync();
        return Ok();
    }
}