using Microsoft.EntityFrameworkCore;
using EMR.Backend.Models;

namespace EMR.Backend
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Article> Articles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Article entity
            modelBuilder.Entity<Article>(entity =>
            {
                entity.ToTable("learning_hub_articles");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.Title)
                    .HasColumnName("title")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(e => e.Summary)
                    .HasColumnName("summary")
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(e => e.Content)
                    .HasColumnName("content")
                    .HasColumnType("LONGTEXT");

                entity.Property(e => e.Url)
                    .HasColumnName("url")
                    .HasMaxLength(500);

                entity.Property(e => e.Category)
                    .HasColumnName("category")
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Author)
                    .HasColumnName("author")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(e => e.TagsJson)
                    .HasColumnName("tags")
                    .HasColumnType("JSON");

                entity.Property(e => e.PublishedDate)
                    .HasColumnName("published_date");

                entity.Property(e => e.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(e => e.UpdatedAt)
                    .HasColumnName("updated_at");

                entity.Property(e => e.IsActive)
                    .HasColumnName("is_active")
                    .HasDefaultValue(true);

                entity.Property(e => e.ViewCount)
                    .HasColumnName("view_count")
                    .HasDefaultValue(0);

                // Indexes
                entity.HasIndex(e => e.Category)
                    .HasDatabaseName("idx_category");

                entity.HasIndex(e => e.PublishedDate)
                    .HasDatabaseName("idx_published_date");

                entity.HasIndex(e => e.IsActive)
                    .HasDatabaseName("idx_is_active");
            });
        }
    }
}
