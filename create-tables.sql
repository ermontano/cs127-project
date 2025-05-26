-- Flashcards Database Setup Script
-- Based on scripts/setup-database.js
-- Run this in your Google Cloud SQL PostgreSQL database

-- Drop existing tables first (to ensure clean setup)
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Create courses table with SERIAL PRIMARY KEY
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create topics table with SERIAL PRIMARY KEY and nullable course_id
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create flashcards table with SERIAL PRIMARY KEY
CREATE TABLE flashcards (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reviewed TIMESTAMP,
    review_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_topics_course_id ON topics(course_id);
CREATE INDEX idx_flashcards_topic_id ON flashcards(topic_id);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'topics', 'flashcards')
ORDER BY table_name; 