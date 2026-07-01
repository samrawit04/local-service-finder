using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email already exists.");

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        if (user.Role == "Provider")
        {
            var provider = new backend.Models.ServiceProvider
            {
                UserId = user.Id,
                Bio = "",
                Location = "",
                Phone = "",
                ProfileImage = ""
            };
            _context.ServiceProviders.Add(provider);
            await _context.SaveChangesAsync();
        }

        var token = _tokenService.CreateToken(user);
        return Ok(new { token, user.Id, user.Name, user.Email, user.Role });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            return Unauthorized("Invalid email or password.");

        var token = _tokenService.CreateToken(user);
        return Ok(new { token, user.Id, user.Name, user.Email, user.Role });
    }
}