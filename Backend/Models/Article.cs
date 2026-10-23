using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EMR.Backend.Models
{
    [Table("learning_hub_articles")]
    public class Article
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("title")]
        [MaxLength(255)]
        public string Title { get; set; }

        [Required]
        [Column("summary")]
        [MaxLength(500)]
        public string Summary { get; set; }

        [Column("content", TypeName = "LONGTEXT")]
        public string Content { get; set; }

        [Column("url")]
        [MaxLength(500)]
        public string? Url { get; set; }

        [Required]
        [Column("category")]
        [MaxLength(100)]
        public string Category { get; set; }

        [Column("author")]
        [MaxLength(255)]
        public string Author { get; set; }

        [Column("tags", TypeName = "JSON")]
        public string? TagsJson { get; set; }

        [NotMapped]
        public List<string> Tags
        {
            get => string.IsNullOrEmpty(TagsJson) 
                ? new List<string>() 
                : System.Text.Json.JsonSerializer.Deserialize<List<string>>(TagsJson) ?? new List<string>();
            set => TagsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [Column("published_date")]
        public DateTime PublishedDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("view_count")]
        public int ViewCount { get; set; } = 0;
    }
}
