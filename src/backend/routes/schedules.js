const express = require('express');
const router = express.Router();
const CourseSchedule = require('../models/CourseSchedule');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/schedules - Get all schedules for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.session.userId;
        const schedules = await CourseSchedule.findByUserId(userId);
        
        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch schedules',
            error: error.message
        });
    }
});

// GET /api/schedules/course/:courseId - Get schedules for a specific course
router.get('/course/:courseId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const courseId = req.params.courseId;
        const schedules = await CourseSchedule.findByCourseIdAndUserId(courseId, userId);
        
        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error('Error fetching course schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course schedules',
            error: error.message
        });
    }
});

// POST /api/schedules - Create a new schedule
router.post('/', async (req, res) => {
    try {
        const { course_id, day_of_week, start_time, end_time } = req.body;
        const userId = req.session.userId;
        
        if (!course_id || day_of_week === undefined || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Course ID, day of week, start time, and end time are required'
            });
        }

        // Validate day_of_week is between 0-6
        if (day_of_week < 0 || day_of_week > 6) {
            return res.status(400).json({
                success: false,
                message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
            });
        }

        // Validate time format (basic check)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
            return res.status(400).json({
                success: false,
                message: 'Time must be in HH:MM format'
            });
        }

        // Check if start time is before end time
        if (start_time >= end_time) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be before end time'
            });
        }

        const scheduleData = {
            course_id,
            user_id: userId,
            day_of_week,
            start_time,
            end_time
        };

        const schedule = await CourseSchedule.create(scheduleData);
        
        res.status(201).json({
            success: true,
            data: schedule.toJSON(),
            message: 'Schedule created successfully'
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create schedule',
            error: error.message
        });
    }
});

// PUT /api/schedules/:id - Update a schedule
router.put('/:id', async (req, res) => {
    try {
        const { day_of_week, start_time, end_time } = req.body;
        const userId = req.session.userId;
        const scheduleId = req.params.id;
        
        if (day_of_week === undefined || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Day of week, start time, and end time are required'
            });
        }

        // Validate day_of_week is between 0-6
        if (day_of_week < 0 || day_of_week > 6) {
            return res.status(400).json({
                success: false,
                message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
            });
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
            return res.status(400).json({
                success: false,
                message: 'Time must be in HH:MM format'
            });
        }

        // Check if start time is before end time
        if (start_time >= end_time) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be before end time'
            });
        }

        // Find the schedule first
        const schedules = await CourseSchedule.findByUserId(userId);
        const schedule = schedules.find(s => s.id == scheduleId);
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Create a schedule instance to update
        const scheduleInstance = new CourseSchedule(schedule);
        const updatedSchedule = await scheduleInstance.update({
            day_of_week,
            start_time,
            end_time
        });
        
        res.json({
            success: true,
            data: updatedSchedule.toJSON(),
            message: 'Schedule updated successfully'
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update schedule',
            error: error.message
        });
    }
});

// DELETE /api/schedules/:id - Delete a schedule
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        const scheduleId = req.params.id;
        
        // Find the schedule first
        const schedules = await CourseSchedule.findByUserId(userId);
        const schedule = schedules.find(s => s.id == scheduleId);
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Create a schedule instance to delete
        const scheduleInstance = new CourseSchedule(schedule);
        const deleted = await scheduleInstance.delete();
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Schedule deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete schedule'
            });
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete schedule',
            error: error.message
        });
    }
});

// DELETE /api/schedules/course/:courseId - Delete all schedules for a course
router.delete('/course/:courseId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const courseId = req.params.courseId;
        
        const deleted = await CourseSchedule.deleteByCourseId(courseId, userId);
        
        res.json({
            success: true,
            message: deleted ? 'Course schedules deleted successfully' : 'No schedules found for this course'
        });
    } catch (error) {
        console.error('Error deleting course schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course schedules',
            error: error.message
        });
    }
});

module.exports = router; 