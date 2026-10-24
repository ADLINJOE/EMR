

-- Drop table if exists (for clean installation)
DROP TABLE IF EXISTS learning_hub_articles;

-- Create Articles table
CREATE TABLE learning_hub_articles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    content LONGTEXT,
    url VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    author VARCHAR(255) NOT NULL,
    tags JSON,
    published_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    INDEX idx_category (category),
    INDEX idx_published_date (published_date),
    INDEX idx_is_active (is_active),
    FULLTEXT idx_fulltext_search (title, summary, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample articles
INSERT INTO learning_hub_articles (id, title, summary, content, category, author, tags, published_date) VALUES
(UUID(), 'Understanding Blood Pressure', 'Learn about blood pressure basics and how to maintain healthy levels', 
'<h2>What is Blood Pressure?</h2><p>Blood pressure is the force of blood pushing against the walls of your arteries...</p>', 
'Blood Pressure', 'Dr. Smith', '["health", "blood pressure", "cardiovascular"]', NOW()),

(UUID(), 'Managing Diabetes Through Diet', 'Dietary tips and strategies for effective diabetes management', 
'<h2>Diet and Diabetes</h2><p>Managing diabetes requires careful attention to your diet...</p>', 
'Diabetes', 'Dr. Johnson', '["diabetes", "diet", "nutrition"]', NOW()),

(UUID(), 'Exercise for Heart Health', 'Best exercises to improve cardiovascular health', 
'<h2>Exercise and Your Heart</h2><p>Regular physical activity is one of the best things you can do for your heart...</p>', 
'Exercise', 'Dr. Williams', '["exercise", "heart health", "fitness"]', NOW()),

(UUID(), 'Healthy Lifestyle Choices', 'Making sustainable lifestyle changes for better health', 
'<h2>Building Healthy Habits</h2><p>A healthy lifestyle is built on consistent daily choices...</p>', 
'Lifestyle', 'Dr. Brown', '["lifestyle", "wellness", "habits"]', NOW()),

(UUID(), 'Balanced Diet Fundamentals', 'Understanding the basics of a balanced and nutritious diet', 
'<h2>What is a Balanced Diet?</h2><p>A balanced diet provides your body with all the nutrients it needs...</p>', 
'Diet', 'Dr. Davis', '["diet", "nutrition", "health"]', NOW());

-- Create stored procedures for article management

DELIMITER $$

-- Procedure to get articles by category with pagination
CREATE PROCEDURE GetArticlesByCategory(
    IN p_category VARCHAR(100),
    IN p_page INT,
    IN p_page_size INT
)
BEGIN
    DECLARE offset_val INT;
    SET offset_val = (p_page - 1) * p_page_size;
    
    IF p_category IS NULL OR p_category = '' THEN
        SELECT * FROM learning_hub_articles 
        WHERE is_active = TRUE
        ORDER BY published_date DESC
        LIMIT p_page_size OFFSET offset_val;
    ELSE
        SELECT * FROM learning_hub_articles 
        WHERE category = p_category AND is_active = TRUE
        ORDER BY published_date DESC
        LIMIT p_page_size OFFSET offset_val;
    END IF;
END$$

-- Procedure to search articles
CREATE PROCEDURE SearchArticles(
    IN p_search_term VARCHAR(255)
)
BEGIN
    SELECT * FROM learning_hub_articles 
    WHERE is_active = TRUE
    AND (MATCH(title, summary, content) AGAINST(p_search_term IN NATURAL LANGUAGE MODE)
         OR title LIKE CONCAT('%', p_search_term, '%')
         OR summary LIKE CONCAT('%', p_search_term, '%'))
    ORDER BY published_date DESC;
END$$

-- Procedure to increment view count
CREATE PROCEDURE IncrementArticleViewCount(
    IN p_article_id CHAR(36)
)
BEGIN
    UPDATE learning_hub_articles 
    SET view_count = view_count + 1 
    WHERE id = p_article_id;
END$$

-- Procedure to get popular articles
CREATE PROCEDURE GetPopularArticles(
    IN p_limit INT
)
BEGIN
    SELECT * FROM learning_hub_articles 
    WHERE is_active = TRUE
    ORDER BY view_count DESC
    LIMIT p_limit;
END$$

DELIMITER ;

-- Create view for article statistics
CREATE OR REPLACE VIEW article_statistics AS
SELECT 
    category,
    COUNT(*) as total_articles,
    AVG(view_count) as avg_views,
    MAX(published_date) as latest_article_date
FROM learning_hub_articles
WHERE is_active = TRUE
GROUP BY category;

-- Grant permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON emr_db.learning_hub_articles TO 'emr_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE emr_db.GetArticlesByCategory TO 'emr_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE emr_db.SearchArticles TO 'emr_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE emr_db.IncrementArticleViewCount TO 'emr_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE emr_db.GetPopularArticles TO 'emr_user'@'localhost';
