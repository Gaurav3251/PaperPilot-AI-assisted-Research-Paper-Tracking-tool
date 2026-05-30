using Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Paper> Papers => Set<Paper>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<PaperTag> PaperTags => Set<PaperTag>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<PaperCollection> PaperCollections => Set<PaperCollection>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.HasPostgresExtension("pgcrypto");
        builder.Entity<Paper>(e =>
        {
            e.HasIndex(p => p.Title);
            e.HasIndex(p => p.Status);
            e.HasIndex(p => p.UserId);
            e.HasIndex(p => p.Year);
            e.HasIndex(p => p.CategoryId);
        });
        builder.Entity<PaperTag>().HasKey(pt => new { pt.PaperId, pt.TagId });
        builder.Entity<PaperCollection>().HasKey(pc => new { pc.PaperId, pc.CollectionId });
    }
}
