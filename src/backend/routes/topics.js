const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/topics - Get all topics or topics by course
router.get('/', async (req, res) => {
    try {
        const { courseId } = req.query;
        const userId = req.session.userId;
        
        let topics;
        
        if (courseId) {
            // Get topics for a specific course
            topics = await Topic.findByCourseId(courseId, userId);
        } else {
            // Get all topics for the user
            topics = await Topic.findByUserId(userId);
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

// POST /api/topics - Create a new topic
router.post('/', async (req, res) => {
    try {
        const { course_id, title, description } = req.body;
        const userId = req.session.userId;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Topic title is required'
            });
        }

        const topicData = {
            user_id: userId,
            course_id: course_id || null, // Allow null for standalone topics
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

// PUT /api/topics/:id - Update a topic
router.put('/:id', async (req, res) => {
    try {
        const { title, description, course_id } = req.body;
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

        const updatedTopic = await topic.update({
            title,
            description: description || '',
            course_id: course_id || null
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