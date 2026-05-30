using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json.Serialization;

namespace Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;
    public TokenService(IConfiguration config) => _config = config;

    public string CreateToken(Guid userId, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role)
        };
        var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddDays(7), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _users;
    private readonly ITokenService _tokens;

    public AuthService(UserManager<AppUser> users, ITokenService tokens)
    {
        _users = users;
        _tokens = tokens;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var role = string.Equals(request.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "User";
        if (!await _users.Users.AnyAsync() && role != "Admin")
        {
            role = "Admin";
        }
        var user = new AppUser { Id = Guid.NewGuid(), UserName = request.Email, Email = request.Email };
        var result = await _users.CreateAsync(user, request.Password);
        if (!result.Succeeded) throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));
        await _users.AddToRoleAsync(user, role);
        return new AuthResponse(_tokens.CreateToken(user.Id, user.Email!, role), user.Email!, request.FullName, role);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _users.FindByEmailAsync(request.Email) ?? throw new InvalidOperationException("Invalid credentials");
        if (!await _users.CheckPasswordAsync(user, request.Password)) throw new InvalidOperationException("Invalid credentials");
        var role = (await _users.GetRolesAsync(user)).FirstOrDefault() ?? "User";
        return new AuthResponse(_tokens.CreateToken(user.Id, user.Email!, role), user.Email!, user.UserName ?? user.Email!, role);
    }

    public async Task<string> GeneratePasswordResetTokenAsync(ForgotPasswordRequest request)
    {
        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return string.Empty;

        var user = await _users.FindByEmailAsync(email);
        if (user is null)
        {
            // Returning empty string keeps the endpoint simple for the caller,
            // but the UI can't know why it failed. Prefer explicit handling in the controller/UI.
            return string.Empty;
        }

        return await _users.GeneratePasswordResetTokenAsync(user);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _users.FindByEmailAsync(request.Email) ?? throw new InvalidOperationException("User not found");
        var result = await _users.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded) throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));
    }
}

public class MlService : IMlService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    public MlService(HttpClient http, IConfiguration config) { _http = http; _config = config; }

    public async Task<IReadOnlyList<string>> SuggestTagsAsync(string text)
    {
        var url = $"{_config["MlServiceUrl"]}/keyphrases";
        var res = await _http.PostAsJsonAsync(url, new { text });
        if (!res.IsSuccessStatusCode) return Array.Empty<string>();
        var body = await res.Content.ReadFromJsonAsync<KeyphraseResponse>();
        return body?.Tags ?? new List<string>();
    }

    private sealed class KeyphraseResponse
    {
        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = new();
    }
}
