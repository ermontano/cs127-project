-- Migration script to add color column to existing courses table
-- Run this if you already have a courses table and want to add the color column

-- Add color column to courses table with default value
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3b82f6' NOT NULL; -- RGB hex color

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name = 'color';

-- Optional: Update existing courses with different colors (you can customize this)
-- This will give existing courses varied RGB colors based on their ID
UPDATE courses 
SET color = CASE 
    WHEN id % 8 = 1 THEN '#3b82f6' -- blue
    WHEN id % 8 = 2 THEN '#10b981' -- green
    WHEN id % 8 = 3 THEN '#8b5cf6' -- purple
    WHEN id % 8 = 4 THEN '#f59e0b' -- orange
    WHEN id % 8 = 5 THEN '#ef4444' -- red
    WHEN id % 8 = 6 THEN '#ec4899' -- pink
    WHEN id % 8 = 7 THEN '#6366f1' -- indigo
    ELSE '#14b8a6' -- teal
END
WHERE color = '#3b82f6' OR color = 'blue'; -- Update courses with default color or old string colors

-- Show updated courses
SELECT id, title, color FROM courses ORDER BY id; 