using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EMR.Backend.Controllers
{
    [ApiController]
    [Route("api/learninghub")]
    public class ArticleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ArticleController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/learninghub/articles
        [HttpGet("articles")]
        public async Task<IActionResult> GetArticles([FromQuery] string? category = null)
        {
            try
            {
                var query = _context.Articles.AsQueryable();

                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(a => a.Category == category);
                }

                var articles = await query
                    .OrderByDescending(a => a.PublishedDate)
                    .ToListAsync();

                return Ok(new { data = articles, success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, success = false });
            }
        }

        // GET: api/learninghub/articles/{id}
        [HttpGet("articles/{id}")]
        public async Task<IActionResult> GetArticleById(Guid id)
        {
            try
            {
                var article = await _context.Articles.FindAsync(id);

                if (article == null)
                {
                    return NotFound(new { message = "Article not found", success = false });
                }

                return Ok(new { data = article, success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, success = false });
            }
        }

        // POST: api/learninghub/articles
        [HttpPost("articles")]
        public async Task<IActionResult> CreateArticle([FromBody] Article article)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid article data", success = false });
                }

                article.Id = Guid.NewGuid();
                article.PublishedDate = DateTime.UtcNow;
                article.CreatedAt = DateTime.UtcNow;
                article.UpdatedAt = DateTime.UtcNow;

                _context.Articles.Add(article);
                await _context.SaveChangesAsync();

                return Ok(new { data = article, success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, success = false });
            }
        }

        // PUT: api/learninghub/articles/{id}
        [HttpPut("articles/{id}")]
        public async Task<IActionResult> UpdateArticle(Guid id, [FromBody] Article article)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { message = "Invalid article data", success = false });
                }

                var existingArticle = await _context.Articles.FindAsync(id);
                if (existingArticle == null)
                {
                    return NotFound(new { message = "Article not found", success = false });
                }

                // Update properties
                existingArticle.Title = article.Title;
                existingArticle.Summary = article.Summary;
                existingArticle.Content = article.Content;
                existingArticle.Category = article.Category;
                existingArticle.Author = article.Author;
                existingArticle.Tags = article.Tags;
                existingArticle.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { data = existingArticle, success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, success = false });
            }
        }

        // DELETE: api/learninghub/articles/{id}
        [HttpDelete("articles/{id}")]
        public async Task<IActionResult> DeleteArticle(Guid id)
        {
            try
            {
                var article = await _context.Articles.FindAsync(id);
                if (article == null)
                {
                    return NotFound(new { message = "Article not found", success = false });
                }

                _context.Articles.Remove(article);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Article deleted successfully", success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, success = false });
            }
        }
    }
}
