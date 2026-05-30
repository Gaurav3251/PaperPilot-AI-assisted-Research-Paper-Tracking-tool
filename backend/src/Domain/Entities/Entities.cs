using Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Domain.Entities;

public class AppUser : IdentityUser<Guid>
{
    public ICollection<Paper> Papers { get; set; } = new List<Paper>();
}

public class AppRole : IdentityRole<Guid> { }

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public ICollection<Paper> Papers { get; set; } = new List<Paper>();
}

public class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public ICollection<PaperTag> PaperTags { get; set; } = new List<PaperTag>();
}

public class Collection
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public ICollection<PaperCollection> PaperCollections { get; set; } = new List<PaperCollection>();
}

public class Paper
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Abstract { get; set; }
    public string? Authors { get; set; }
    public int? Year { get; set; }
    public string? Venue { get; set; }
    public string? Doi { get; set; }
    public string? PaperUrl { get; set; }
    public string? PdfUrl { get; set; }
    public PaperStatus Status { get; set; } = PaperStatus.ToRead;
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool AiGenerated { get; set; }
    public Guid UserId { get; set; }
    public Guid? CategoryId { get; set; }
    public AppUser User { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<Note> Notes { get; set; } = new List<Note>();
    public ICollection<PaperTag> PaperTags { get; set; } = new List<PaperTag>();
    public ICollection<PaperCollection> PaperCollections { get; set; } = new List<PaperCollection>();
}

public class Note
{
    public Guid Id { get; set; }
    public Guid PaperId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Paper Paper { get; set; } = null!;
}

public class PaperTag
{
    public Guid PaperId { get; set; }
    public Guid TagId { get; set; }
    public Paper Paper { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}

public class PaperCollection
{
    public Guid PaperId { get; set; }
    public Guid CollectionId { get; set; }
    public Paper Paper { get; set; } = null!;
    public Collection Collection { get; set; } = null!;
}
