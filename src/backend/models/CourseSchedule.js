const { pool } = require('../config/database');

/**
 * CourseSchedule model for managing course schedules
 */
class CourseSchedule {
    constructor(data) {
        this.id = data.id;
        this.course_id = data.course_id;
        this.user_id = data.user_id;
        this.day_of_week = data.day_of_week;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new course schedule
     */
    static async create(scheduleData) {
        const { course_id, user_id, day_of_week, start_time, end_time } = scheduleData;
        
        try {
            const result = await pool.query(
                `INSERT INTO course_schedules (course_id, user_id, day_of_week, start_time, end_time, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
                 RETURNING *`,
                [course_id, user_id, day_of_week, start_time, end_time]
            );
            
            return new CourseSchedule(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find schedules by course ID and user ID
     */
    static async findByCourseIdAndUserId(courseId, userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM course_schedules WHERE course_id = $1 AND user_id = $2 ORDER BY day_of_week, start_time',
                [courseId, userId]
            );
            
            return result.rows.map(row => new CourseSchedule(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find all schedules for a user
     */
    static async findByUserId(userId) {
        try {
            const result = await pool.query(`
                SELECT cs.*, c.title as course_title, c.description as course_description
                FROM course_schedules cs
                JOIN courses c ON cs.course_id = c.id
                WHERE cs.user_id = $1
                ORDER BY cs.day_of_week, cs.start_time
            `, [userId]);
            
            return result.rows.map(row => ({
                ...new CourseSchedule(row).toJSON(),
                course_title: row.course_title,
                course_description: row.course_description
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete schedules by course ID
     */
    static async deleteByCourseId(courseId, userId) {
        try {
            const result = await pool.query(
                'DELETE FROM course_schedules WHERE course_id = $1 AND user_id = $2 RETURNING *',
                [courseId, userId]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete schedule by ID
     */
    async delete() {
        try {
            const result = await pool.query(
                'DELETE FROM course_schedules WHERE id = $1 AND user_id = $2 RETURNING *',
                [this.id, this.user_id]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update schedule
     */
    async update(updateData) {
        const { day_of_week, start_time, end_time } = updateData;
        
        try {
            const result = await pool.query(
                `UPDATE course_schedules 
                 SET day_of_week = $1, start_time = $2, end_time = $3, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $4 AND user_id = $5 
                 RETURNING *`,
                [day_of_week, start_time, end_time, this.id, this.user_id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Schedule not found or unauthorized');
            }
            
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            course_id: this.course_id,
            user_id: this.user_id,
            day_of_week: this.day_of_week,
            start_time: this.start_time,
            end_time: this.end_time,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = CourseSchedule; 