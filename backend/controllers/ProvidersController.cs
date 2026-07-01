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
public class ProvidersController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProvidersController(AppDbContext context)
    {
        _context = context;
    }

    // GET all providers, optional filter by location
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var query = _context.ServiceProviders
            .Include(p => p.User)
            .Include(p => p.Services)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(p => 
                (p.Location != null && p.Location.ToLower().Contains(s)) || 
                (p.User.Name != null && p.User.Name.ToLower().Contains(s)) || 
                p.Services.Any(srv => 
                    (srv.Category != null && srv.Category.ToLower().Contains(s)) || 
                    (srv.Title != null && srv.Title.ToLower().Contains(s)) || 
                    (srv.Description != null && srv.Description.ToLower().Contains(s))
                )
            );
        }

        var providers = await query.ToListAsync();
        return Ok(providers);
    }

    // GET single provider by id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var provider = await _context.ServiceProviders
            .Include(p => p.User)
            .Include(p => p.Services)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (provider == null) return NotFound();
        return Ok(provider);
    }

    // GET own provider profile
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var provider = await _context.ServiceProviders
            .Include(p => p.Services)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (provider == null) return NotFound();
        return Ok(provider);
    }

    // POST create provider profile (requires login)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(ProviderDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var existing = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existing != null) return BadRequest("Provider profile already exists.");

        var provider = new backend.Models.ServiceProvider
        {
            UserId = userId,
            Bio = dto.Bio,
            Location = dto.Location,
            Phone = dto.Phone,
            ProfileImage = dto.ProfileImage
        };

        _context.ServiceProviders.Add(provider);
        await _context.SaveChangesAsync();
        return Ok(provider);
    }

    // PUT update own provider profile
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, ProviderDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var provider = await _context.ServiceProviders.FirstOrDefaultAsync(p => p.Id == id);

        if (provider == null) return NotFound();
        if (provider.UserId != userId) return Forbid();

        provider.Bio = dto.Bio;
        provider.Location = dto.Location;
        provider.Phone = dto.Phone;
        provider.ProfileImage = dto.ProfileImage;

        await _context.SaveChangesAsync();
        return Ok(provider);
    }
}