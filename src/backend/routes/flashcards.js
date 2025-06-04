const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/flashcards - Get all flashcards or flashcards by topic
router.get('/', async (req, res) => {
    try {
        const { topicId } = req.query;
        const userId = req.session.userId;
        let flashcards;
        
        if (topicId) {
            flashcards = await Flashcard.findByTopicId(topicId, userId);
        } else {
            flashcards = await Flashcard.findByUserId(userId);
        }
        
        res.json({
            success: true,
            data: flashcards.map(flashcard => flashcard.toJSON())
        });
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flashcards',
            error: error.message
        });
    }
});

// GET /api/flashcards/:id - Get a specific flashcard
router.get('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const flashcard = await Flashcard.findByIdAndUserId(req.params.id, userId);
        
        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }
        
        res.json({
            success: true,
            data: flashcard.toJSON()
        });
    } catch (error) {
        console.error('Error fetching flashcard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flashcard',
            error: error.message
        });
    }
});

// POST /api/flashcards - Create a new flashcard
router.post('/', async (req, res) => {
    try {
        const { topic_id, question, answer } = req.body;
        const userId = req.session.userId;
        
        if (!topic_id || !question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Topic ID, question, and answer are required'
            });
        }

        const flashcardData = {
            user_id: userId,
            topic_id,
            question,
            answer
        };

        const flashcard = await Flashcard.create(flashcardData);
        
        res.status(201).json({
            success: true,
            data: flashcard.toJSON(),
            message: 'Flashcard created successfully'
        });
    } catch (error) {
        console.error('Error creating flashcard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create flashcard',
            error: error.message
        });
    }
});

// PUT /api/flashcards/:id - Update a flashcard
router.put('/:id', async (req, res) => {
    try {
        const { question, answer, topic_id } = req.body;
        const userId = req.session.userId;
        
        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Question and answer are required'
            });
        }

        const flashcard = await Flashcard.findByIdAndUserId(req.params.id, userId);
        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        const updatedFlashcard = await flashcard.update({
            question,
            answer,
            topic_id: topic_id || flashcard.topic_id
        });
        
        res.json({
            success: true,
            data: updatedFlashcard.toJSON(),
            message: 'Flashcard updated successfully'
        });
    } catch (error) {
        console.error('Error updating flashcard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flashcard',
            error: error.message
        });
    }
});

// POST /api/flashcards/:id/review - Mark flashcard as reviewed
router.post('/:id/review', async (req, res) => {
    try {
        const userId = req.session.userId;
        const flashcard = await Flashcard.findByIdAndUserId(req.params.id, userId);
        
        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        const updatedFlashcard = await flashcard.markReviewed();
        
        res.json({
            success: true,
            data: updatedFlashcard.toJSON(),
            message: 'Flashcard review updated successfully'
        });
    } catch (error) {
        console.error('Error updating flashcard review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flashcard review',
            error: error.message
        });
    }
});

// GET /api/flashcards/study/:topicId - Get flashcards for study mode
router.get('/study/:topicId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const flashcards = await Flashcard.findForStudy(req.params.topicId, userId);
        
        res.json({
            success: true,
            data: flashcards
        });
    } catch (error) {
        console.error('Error fetching study flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch study flashcards',
            error: error.message
        });
    }
});

// DELETE /api/flashcards/:id - Delete a flashcard
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const flashcard = await Flashcard.findByIdAndUserId(req.params.id, userId);
        
        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        const deleted = await flashcard.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Flashcard deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete flashcard'
            });
        }
    } catch (error) {
        console.error('Error deleting flashcard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete flashcard',
            error: error.message
        });
    }
});

module.exports = router; 