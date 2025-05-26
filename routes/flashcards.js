const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');

// GET /api/flashcards - Get all flashcards or flashcards by topic
router.get('/', async (req, res) => {
    try {
        const { topicId } = req.query;
        let flashcards;
        
        if (topicId) {
            flashcards = await Flashcard.findByTopicId(topicId);
        } else {
            flashcards = await Flashcard.findAll();
        }
        
        res.json({
            success: true,
            data: flashcards
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
        const flashcard = await Flashcard.findById(req.params.id);
        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }
        res.json({
            success: true,
            data: flashcard
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
        const { topicId, question, answer } = req.body;
        
        if (!topicId || !question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Topic ID, question, and answer are required'
            });
        }

        const flashcard = new Flashcard(topicId, question, answer, req.session.userId);
        const savedFlashcard = await flashcard.save();
        
        res.status(201).json({
            success: true,
            data: savedFlashcard,
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
        const { question, answer } = req.body;
        
        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Question and answer are required'
            });
        }

        const existingFlashcard = await Flashcard.findById(req.params.id);
        if (!existingFlashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        // Create a flashcard instance and update it
        const flashcard = Object.assign(new Flashcard(), existingFlashcard);
        flashcard.question = question;
        flashcard.answer = answer;
        
        const updatedFlashcard = await flashcard.update();
        
        res.json({
            success: true,
            data: updatedFlashcard,
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
        const existingFlashcard = await Flashcard.findById(req.params.id);
        if (!existingFlashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        // Create a flashcard instance and update review
        const flashcard = Object.assign(new Flashcard(), existingFlashcard);
        const updatedFlashcard = await flashcard.updateReview();
        
        res.json({
            success: true,
            data: updatedFlashcard,
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

// DELETE /api/flashcards/:id - Delete a flashcard
router.delete('/:id', async (req, res) => {
    try {
        const deletedFlashcard = await Flashcard.delete(req.params.id);
        
        if (!deletedFlashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        res.json({
            success: true,
            data: deletedFlashcard,
            message: 'Flashcard deleted successfully'
        });
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