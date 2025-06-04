const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/topics - Get all topics or topics by course (enhanced with course title)
router.get('/', async (req, res) => {
    try {
        const { courseId } = req.query;
        const userId = req.session.userId;
        
        let topics;
        
        if (courseId) {
            // Get topics for a specific course
            topics = await Topic.findByCourseId(courseId, userId);
        } else {
            // Get all topics for the user with course title information
            topics = await Topic.findByUserIdWithCourseTitle(userId);
        }
        
        res.json({
            success: true,
            data: topics
        });
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch topics',
            error: error.message
        });
    }
});

// GET /api/topics/:id - Get a specific topic
router.get('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const topic = await Topic.findByIdAndUserId(req.params.id, userId);
        
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        res.json({
            success: true,
            data: topic.toJSON()
        });
    } catch (error) {
        console.error('Error fetching topic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch topic',
            error: error.message
        });
    }
});

// GET /api/topics/:id/flashcards-count - Get flashcard count for a specific topic
router.get('/:id/flashcards-count', async (req, res) => {
    try {
        const userId = req.session.userId;
        const topicId = req.params.id;
        
        // First verify the topic belongs to the user
        const topic = await Topic.findByIdAndUserId(topicId, userId);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        // Get the flashcard count
        const stats = await topic.getStats();
        
        res.json({
            success: true,
            data: {
                count: stats.flashcard_count
            }
        });
    } catch (error) {
        console.error('Error fetching flashcard count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flashcard count',
            error: error.message
        });
    }
});

// POST /api/topics - Create a new topic (support both courseId and course_id parameters)
router.post('/', async (req, res) => {
    try {
        const { courseId, course_id, title, description } = req.body;
        const userId = req.session.userId;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Topic title is required'
            });
        }

        // Support both courseId (frontend) and course_id (backend) parameter names
        const finalCourseId = courseId || course_id || null;

        const topicData = {
            user_id: userId,
            course_id: finalCourseId,
            title,
            description: description || ''
        };

        const topic = await Topic.create(topicData);
        
        res.status(201).json({
            success: true,
            data: topic.toJSON(),
            message: 'Topic created successfully'
        });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create topic',
            error: error.message
        });
    }
});

// PUT /api/topics/:id - Update a topic (support both courseId and course_id parameters)
router.put('/:id', async (req, res) => {
    try {
        const { title, description, courseId, course_id } = req.body;
        const userId = req.session.userId;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Topic title is required'
            });
        }

        const topic = await Topic.findByIdAndUserId(req.params.id, userId);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }

        // Support both courseId (frontend) and course_id (backend) parameter names
        const finalCourseId = courseId !== undefined ? courseId : (course_id !== undefined ? course_id : null);

        const updatedTopic = await topic.update({
            title,
            description: description || '',
            course_id: finalCourseId
        });
        
        res.json({
            success: true,
            data: updatedTopic.toJSON(),
            message: 'Topic updated successfully'
        });
    } catch (error) {
        console.error('Error updating topic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update topic',
            error: error.message
        });
    }
});

// DELETE /api/topics/:id - Delete a topic
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const topic = await Topic.findByIdAndUserId(req.params.id, userId);
        
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }

        const deleted = await topic.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Topic deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete topic'
            });
        }
    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete topic',
            error: error.message
        });
    }
});

module.exports = router; 