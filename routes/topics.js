const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');

// GET /api/topics - Get all topics or topics by course
router.get('/', async (req, res) => {
    try {
        const { courseId } = req.query;
        let topics;
        
        if (courseId) {
            topics = await Topic.findByCourseId(courseId);
        } else {
            topics = await Topic.findAll();
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
        const topic = await Topic.findById(req.params.id);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        res.json({
            success: true,
            data: topic
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
        const { courseId, title, description } = req.body;
        
        if (!courseId || !title) {
            return res.status(400).json({
                success: false,
                message: 'Course ID and topic title are required'
            });
        }

        const topic = new Topic(courseId, title, description);
        const savedTopic = await topic.save();
        
        res.status(201).json({
            success: true,
            data: savedTopic,
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
        const { title, description } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Topic title is required'
            });
        }

        const existingTopic = await Topic.findById(req.params.id);
        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }

        // Create a topic instance and update it
        const topic = Object.assign(new Topic(), existingTopic);
        topic.title = title;
        topic.description = description;
        
        const updatedTopic = await topic.update();
        
        res.json({
            success: true,
            data: updatedTopic,
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
        const deletedTopic = await Topic.delete(req.params.id);
        
        if (!deletedTopic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }

        res.json({
            success: true,
            data: deletedTopic,
            message: 'Topic deleted successfully'
        });
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