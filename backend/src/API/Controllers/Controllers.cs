using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request) => Ok(await _auth.RegisterAsync(request));

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request) => Ok(await _auth.LoginAsync(request));

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var token = await _auth.GeneratePasswordResetTokenAsync(request);
        if (string.IsNullOrEmpty(token))
        {
            // Helps debugging during development: indicates the user/email wasn't found.
            // (In production, you may want to avoid revealing account existence.)
            return BadRequest(new { error = "Could not generate reset token (user not found)." });
        }

        return Ok(new { token });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        await _auth.ResetPasswordAsync(request);
        return Ok(new { message = "Password updated" });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        email = User.FindFirstValue(ClaimTypes.Email),
        role = User.FindFirstValue(ClaimTypes.Role) ?? "User"
    });
}

[Authorize]
[ApiController]
[Route("api/papers")]
public class PapersController : ControllerBase
{
    private readonly IPaperService _papers;
    public PapersController(IPaperService papers) => _papers = papers;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaperQueryParams query) => Ok(await _papers.GetAllAsync(UserId, query));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var paper = await _papers.GetByIdAsync(UserId, id);
        return paper is null ? NotFound() : Ok(paper);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePaperDto dto) => Ok(await _papers.CreateAsync(UserId, dto));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePaperDto dto)
    {
        var updated = await _papers.UpdateAsync(UserId, id, dto);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _papers.DeleteAsync(UserId, id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("suggest-tags")]
    public async Task<IActionResult> SuggestTags(SuggestTagsRequest req) =>
        Ok(new SuggestTagsResponse(await _papers.SuggestTagsAsync(UserId, req.Text)));

    [HttpPost("{id:guid}/upload")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Upload(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "Missing file" });
        var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploads);
        var ext = Path.GetExtension(file.FileName);
        var safeName = $"{Guid.NewGuid():N}{ext}";
        var path = Path.Combine(uploads, safeName);
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        var fileUrl = $"/uploads/{safeName}";
        var updated = await _papers.UploadPdfAsync(UserId, id, fileUrl);
        return updated is null ? NotFound() : Ok(updated);
    }
}

[Authorize]
[ApiController]
[Route("api/notes")]
public class NotesController : ControllerBase
{
    private readonly INoteService _notes;
    public NotesController(INoteService notes) => _notes = notes;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("paper/{paperId:guid}")]
    public async Task<IActionResult> GetByPaper(Guid paperId) => Ok(await _notes.GetByPaperAsync(UserId, paperId));

    [HttpPost]
    public async Task<IActionResult> Add(CreateNoteDto dto)
    {
        var note = await _notes.AddAsync(UserId, dto);
        return note is null ? NotFound() : Ok(note);
    }
}

[Authorize]
[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Categories.Where(c => c.UserId == UserId).OrderBy(c => c.Name).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Category category)
    {
        var item = new Category { Id = Guid.NewGuid(), Name = category.Name.Trim(), UserId = UserId };
        _db.Categories.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (item is null) return NotFound();
        _db.Categories.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/collections")]
public class CollectionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public CollectionsController(AppDbContext db) => _db = db;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Collections.Where(c => c.UserId == UserId).OrderBy(c => c.Name).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Collection collection)
    {
        var item = new Collection { Id = Guid.NewGuid(), Name = collection.Name.Trim(), UserId = UserId };
        _db.Collections.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("{collectionId:guid}/papers/{paperId:guid}")]
    public async Task<IActionResult> AddPaper(Guid collectionId, Guid paperId)
    {
        var ownsCollection = await _db.Collections.AnyAsync(c => c.Id == collectionId && c.UserId == UserId);
        var ownsPaper = await _db.Papers.AnyAsync(p => p.Id == paperId && p.UserId == UserId);
        if (!ownsCollection || !ownsPaper) return NotFound();
        var exists = await _db.PaperCollections.AnyAsync(pc => pc.CollectionId == collectionId && pc.PaperId == paperId);
        if (!exists) _db.PaperCollections.Add(new PaperCollection { CollectionId = collectionId, PaperId = paperId });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (item is null) return NotFound();
        _db.Collections.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/tags")]
public class TagsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TagsController(AppDbContext db) => _db = db;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Tags.Where(t => t.UserId == UserId).OrderBy(t => t.Name).ToListAsync());
}
