const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/courses - Get all courses for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.session.userId;
        const courses = await Course.findByUserIdWithTopicCount(userId);
        
        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: error.message
        });
    }
});

// GET /api/courses/:id - Get a specific course
router.get('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const course = await Course.findByIdAndUserId(req.params.id, userId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.json({
            success: true,
            data: course.toJSON()
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course',
            error: error.message
        });
    }
});

// GET /api/courses/:id/details - Get course details with topics
router.get('/:id/details', async (req, res) => {
    try {
        const userId = req.session.userId;
        const courseDetails = await Course.findByIdWithTopics(req.params.id, userId);
        
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.json({
            success: true,
            data: courseDetails
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course details',
            error: error.message
        });
    }
});

// POST /api/courses - Create a new course
router.post('/', async (req, res) => {
    try {
        const { title, description, color } = req.body;
        const userId = req.session.userId;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Course title is required'
            });
        }

        // Check if course with same title already exists for this user
        const existingCourse = await Course.findByTitleAndUserId(title, userId);
        if (existingCourse) {
            return res.status(409).json({
                success: false,
                message: `Course "${title}" already exists`
            });
        }

        const courseData = {
            user_id: userId,
            title,
            description: description || '',
            color: color || '#3b82f6'
        };

        const course = await Course.create(courseData);
        
        res.status(201).json({
            success: true,
            data: course.toJSON(),
            message: 'Course created successfully'
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message
        });
    }
});

// PUT /api/courses/:id - Update a course
router.put('/:id', async (req, res) => {
    try {
        const { title, description, color } = req.body;
        const userId = req.session.userId;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Course title is required'
            });
        }

        const course = await Course.findByIdAndUserId(req.params.id, userId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if another course with same title already exists for this user
        const existingCourse = await Course.findByTitleAndUserId(title, userId, req.params.id);
        if (existingCourse) {
            return res.status(409).json({
                success: false,
                message: `Course "${title}" already exists`
            });
        }

        const updatedCourse = await course.update({
            title,
            description: description || '',
            color: color
        });
        
        res.json({
            success: true,
            data: updatedCourse.toJSON(),
            message: 'Course updated successfully'
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message
        });
    }
});

// DELETE /api/courses/:id - Delete a course
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const course = await Course.findByIdAndUserId(req.params.id, userId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const deleted = await course.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Course deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete course'
            });
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message
        });
    }
});

// PUT /api/courses/:id/color - Update course color (only if course has schedules)
router.put('/:id/color', async (req, res) => {
    try {
        const { color } = req.body;
        const userId = req.session.userId;
        
        if (!color) {
            return res.status(400).json({
                success: false,
                message: 'Color is required'
            });
        }

        const course = await Course.findByIdAndUserId(req.params.id, userId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if course has schedules
        const hasSchedules = await course.hasSchedules();
        if (!hasSchedules) {
            return res.status(400).json({
                success: false,
                message: 'Color can only be set for courses with schedules'
            });
        }

        const updatedCourse = await course.update({
            title: course.title,
            description: course.description,
            color: color
        });
        
        res.json({
            success: true,
            data: updatedCourse.toJSON(),
            message: 'Course color updated successfully'
        });
    } catch (error) {
        console.error('Error updating course color:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course color',
            error: error.message
        });
    }
});

module.exports = router; 