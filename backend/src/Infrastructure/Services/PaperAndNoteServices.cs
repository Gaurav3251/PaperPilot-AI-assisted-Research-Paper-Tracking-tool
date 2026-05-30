using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class PaperService : IPaperService
{
    private readonly AppDbContext _db;
    private readonly IMlService _ml;

    public PaperService(AppDbContext db, IMlService ml) { _db = db; _ml = ml; }

    public async Task<PagedResult<PaperDto>> GetAllAsync(Guid userId, PaperQueryParams query)
    {
        var q = _db.Papers
            .Where(p => p.UserId == userId)
            .Include(p => p.PaperTags).ThenInclude(pt => pt.Tag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var s = query.Q.Trim().ToLower();
            q = q.Where(p => p.Title.ToLower().Contains(s) || (p.Abstract ?? "").ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<PaperStatus>(query.Status, true, out var status))
            q = q.Where(p => p.Status == status);
        if (!string.IsNullOrWhiteSpace(query.Author))
        {
            var a = query.Author.Trim().ToLower();
            q = q.Where(p => (p.Authors ?? "").ToLower().Contains(a));
        }
        if (query.Year.HasValue) q = q.Where(p => p.Year == query.Year.Value);
        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            var t = query.Tag.Trim().ToLower();
            q = q.Where(p => p.PaperTags.Any(pt => pt.Tag.Name == t));
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(Map)
            .ToListAsync();
        return new PagedResult<PaperDto>(items, page, pageSize, total);
    }

    public async Task<PaperDto?> GetByIdAsync(Guid userId, Guid paperId) =>
        await _db.Papers
            .Where(p => p.UserId == userId && p.Id == paperId)
            .Include(p => p.PaperTags).ThenInclude(pt => pt.Tag)
            .Select(Map)
            .FirstOrDefaultAsync();

    public async Task<PaperDto> CreateAsync(Guid userId, CreatePaperDto dto)
    {
        var paper = new Paper
        {
            Id = Guid.NewGuid(), UserId = userId, Title = dto.Title, Abstract = dto.Abstract, Authors = dto.Authors,
            Year = dto.Year, Venue = dto.Venue, Doi = dto.Doi, PaperUrl = dto.PaperUrl, PdfUrl = dto.PdfUrl,
            Priority = dto.Priority, CategoryId = dto.CategoryId, Status = PaperStatus.ToRead, AiGenerated = false
        };

        _db.Papers.Add(paper);
        await AttachTagsAsync(userId, paper, dto.Tags);
        await _db.SaveChangesAsync();

        return await _db.Papers.Where(p => p.Id == paper.Id).Include(p => p.PaperTags).ThenInclude(pt => pt.Tag).Select(Map).FirstAsync();
    }

    public async Task<PaperDto?> UpdateAsync(Guid userId, Guid paperId, UpdatePaperDto dto)
    {
        var paper = await _db.Papers.Include(p => p.PaperTags).FirstOrDefaultAsync(p => p.Id == paperId && p.UserId == userId);
        if (paper is null) return null;

        paper.Title = dto.Title; paper.Abstract = dto.Abstract; paper.Authors = dto.Authors; paper.Year = dto.Year;
        paper.Venue = dto.Venue; paper.Doi = dto.Doi; paper.PaperUrl = dto.PaperUrl; paper.PdfUrl = dto.PdfUrl;
        paper.Priority = dto.Priority; paper.CategoryId = dto.CategoryId; paper.UpdatedAt = DateTime.UtcNow;
        if (Enum.TryParse<PaperStatus>(dto.Status, true, out var status)) paper.Status = status;

        _db.PaperTags.RemoveRange(paper.PaperTags);
        await AttachTagsAsync(userId, paper, dto.Tags);
        await _db.SaveChangesAsync();

        return await _db.Papers.Where(p => p.Id == paper.Id).Include(p => p.PaperTags).ThenInclude(pt => pt.Tag).Select(Map).FirstAsync();
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid paperId)
    {
        var paper = await _db.Papers.FirstOrDefaultAsync(p => p.Id == paperId && p.UserId == userId);
        if (paper is null) return false;
        _db.Papers.Remove(paper);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<string>> SuggestTagsAsync(Guid userId, string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Array.Empty<string>();
        return await _ml.SuggestTagsAsync(text);
    }

    public async Task<PaperDto?> UploadPdfAsync(Guid userId, Guid paperId, string fileUrl)
    {
        var paper = await _db.Papers.FirstOrDefaultAsync(p => p.Id == paperId && p.UserId == userId);
        if (paper is null) return null;
        paper.PdfUrl = fileUrl;
        paper.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await _db.Papers.Where(p => p.Id == paper.Id).Include(p => p.PaperTags).ThenInclude(pt => pt.Tag).Select(Map).FirstAsync();
    }

    private async Task AttachTagsAsync(Guid userId, Paper paper, List<string>? tags)
    {
        if (tags is null || tags.Count == 0) return;

        foreach (var raw in tags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim().ToLowerInvariant()).Distinct())
        {
            var existing = await _db.Tags.FirstOrDefaultAsync(t => t.UserId == userId && t.Name == raw);
            if (existing is null)
            {
                existing = new Tag { Id = Guid.NewGuid(), UserId = userId, Name = raw };
                _db.Tags.Add(existing);
            }
            paper.PaperTags.Add(new PaperTag { PaperId = paper.Id, Paper = paper, TagId = existing.Id, Tag = existing });
        }
    }

    private static readonly System.Linq.Expressions.Expression<Func<Paper, PaperDto>> Map = p => new PaperDto(
        p.Id,
        p.Title,
        p.Abstract,
        p.Authors,
        p.Year,
        p.Venue,
        p.Status.ToString(),
        p.Priority,
        p.AiGenerated,
        p.PaperTags.Select(pt => pt.Tag.Name).ToList()
    );
}

public class NoteService : INoteService
{
    private readonly AppDbContext _db;
    public NoteService(AppDbContext db) { _db = db; }

    public async Task<IReadOnlyList<NoteDto>> GetByPaperAsync(Guid userId, Guid paperId) =>
        await _db.Notes.Where(n => n.PaperId == paperId && n.Paper.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NoteDto(n.Id, n.PaperId, n.Content, n.CreatedAt)).ToListAsync();

    public async Task<NoteDto?> AddAsync(Guid userId, CreateNoteDto dto)
    {
        var exists = await _db.Papers.AnyAsync(p => p.Id == dto.PaperId && p.UserId == userId);
        if (!exists) return null;
        var note = new Note { Id = Guid.NewGuid(), PaperId = dto.PaperId, Content = dto.Content };
        _db.Notes.Add(note);
        await _db.SaveChangesAsync();
        return new NoteDto(note.Id, note.PaperId, note.Content, note.CreatedAt);
    }
}
