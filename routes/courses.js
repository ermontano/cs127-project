const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// GET /api/courses - Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.findAll();
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
        const id = req.params.id;
        
        // Validate ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID provided'
            });
        }
        
        const course = await Course.findById(numericId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        res.json({
            success: true,
            data: course
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

// POST /api/courses - Create a new course
router.post('/', async (req, res) => {
    try {
        console.log('📝 Creating course with body:', req.body);
        const { title, description } = req.body;
        
        console.log('📝 Extracted title:', title);
        console.log('📝 Extracted description:', description);
        
        if (!title) {
            console.log('❌ No title provided');
            return res.status(400).json({
                success: false,
                message: 'Course title is required'
            });
        }

        console.log('📝 Creating Course instance...');
        const course = new Course(title, description);
        console.log('📝 Course instance created, calling save...');
        const savedCourse = await course.save();
        console.log('✅ Course saved successfully:', savedCourse);
        
        res.status(201).json({
            success: true,
            data: savedCourse,
            message: 'Course created successfully'
        });
    } catch (error) {
        console.error('❌ Error creating course:', error);
        console.error('❌ Error stack:', error.stack);
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
        const { title, description } = req.body;
        const id = req.params.id;
        
        // Validate ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID provided'
            });
        }
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Course title is required'
            });
        }

        const existingCourse = await Course.findById(numericId);
        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Create a course instance and update it
        const course = Object.assign(new Course(), existingCourse);
        course.title = title;
        course.description = description;
        
        const updatedCourse = await course.update();
        
        res.json({
            success: true,
            data: updatedCourse,
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
        const id = req.params.id;
        
        // Validate ID
        const numericId = parseInt(id);
        if (isNaN(numericId) || numericId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID provided'
            });
        }
        
        const deletedCourse = await Course.delete(numericId);
        
        if (!deletedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: deletedCourse,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message
        });
    }
});

module.exports = router; 