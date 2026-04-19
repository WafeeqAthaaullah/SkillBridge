// project-root/server/db/applicationQueries.js
const pool = require('../db.js'); // Corrected to use 'pool' as the variable name for consistency

const applicationQueries = {
    getAllApplications: async () => {
        const query = `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.internship_id,
                a.submitted_on,
                a.status,
                s.name AS student_name,
                s.email AS student_email,
                i.title AS internship_title,
                i.company_id,
                i.company_name
            FROM applications a
            JOIN students s ON a.student_id = s.id
            JOIN internships i ON a.internship_id = i.id
            ORDER BY a.submitted_on DESC;
        `;
        try {
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('Error in getAllApplications (in applicationQueries.js):', error);
            throw error;
        }
    },

    getApplicationsByStudentId: async (studentId) => {
        const query = `
            SELECT
                a.id AS application_id,
                a.internship_id,
                a.student_id,
                a.submitted_on,
                a.status,
                i.title AS internship_title,
                i.location AS internship_location,
                c.name AS company_name
            FROM
                applications a
            JOIN
                internships i ON a.internship_id = i.id
            JOIN
                companies c ON i.company_id = c.id
            WHERE
                a.student_id = ?
            ORDER BY a.submitted_on DESC;
        `;
        try {
            const [rows] = await pool.query(query, [studentId]);
            return rows;
        } catch (error) {
            console.error("Error fetching applications by student ID (in applicationQueries.js):", error);
            throw error;
        }
    },

    getApplicationsByInternshipId: async (internshipId) => {
        const query = `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.internship_id,
                a.submitted_on,
                a.status,
                s.name AS student_name,
                s.email AS student_email,
                i.title AS internship_title,
                i.company_id,
                i.company_name
            FROM applications a
            JOIN students s ON a.student_id = s.id
            JOIN internships i ON a.internship_id = i.id
            WHERE a.internship_id = ?
            ORDER BY a.submitted_on DESC;
        `;
        try {
            const [rows] = await pool.query(query, [internshipId]);
            return rows;
        } catch (error) {
            console.error('Error in getApplicationsByInternshipId:', error);
            throw error;
        }
    },

    // *** ADDED THIS MISSING FUNCTION ***
    getApplicationById: async (applicationId) => {
        const query = `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.internship_id,
                a.submitted_on,
                a.status,
                a.resume_path,        -- Assuming these are in applications table for direct access
                a.cover_letter_path,  -- Assuming these are in applications table for direct access
                s.name AS student_name,
                s.email AS student_email,
                s.phone,
                s.major,
                s.university,
                s.gpa,
                s.skills,
                s.resume_url AS student_resume_url, -- Alias if there's also a student's general resume
                s.cover_letter_url AS student_cover_letter_url, -- Alias
                s.profile_picture_url,
                i.title AS internship_title,
                i.company_id,
                i.company_name
            FROM applications a
            JOIN students s ON a.student_id = s.id
            JOIN internships i ON a.internship_id = i.id
            WHERE a.id = ?;
        `;
        try {
            const [rows] = await pool.query(query, [applicationId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error in getApplicationById (in applicationQueries.js):', error);
            throw error;
        }
    },

    addApplication: async (applicationData) => {
        // Destructure ALL the fields you want to insert
        const {
            student_id,
            internship_id,
            resume_url,        // Note: your DB column is likely 'resume_path'
            cover_letter_url,  // Note: your DB column is likely 'cover_letter_path'
            submitted_on,
            status,
            student_name,      // <--- ADDED
            student_email,     // <--- ADDED
            student_phone,     // <--- ADDED
            student_gpa,       // <--- ADDED
            student_skills     // <--- ADDED
        } = applicationData;

        const query = `
            INSERT INTO applications (
                student_id,
                internship_id,
                resume_path,           -- Ensure your DB column name matches 'resume_path'
                cover_letter_path,     -- Ensure your DB column name matches 'cover_letter_path'
                submitted_on,
                status,
                student_name,          -- <--- ADDED COLUMN
                student_email,         -- <--- ADDED COLUMN
                student_phone,         -- <--- ADDED COLUMN
                student_gpa,           -- <--- ADDED COLUMN
                student_skills         -- <--- ADDED COLUMN
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); -- <--- ADDED PLACEHOLDERS
        `;
        const values = [
            student_id,
            internship_id,
            resume_url,
            cover_letter_url,
            submitted_on,
            status,
            student_name,      // <--- ADDED VALUE
            student_email,     // <--- ADDED VALUE
            student_phone,     // <--- ADDED VALUE
            student_gpa,       // <--- ADDED VALUE
            student_skills     // <--- ADDED VALUE
        ];

        try {
            console.log('DEBUG (addApplication): Executing INSERT query for application with values:', values); // Add this log
            const [result] = await pool.query(query, values);
            console.log('DEBUG (addApplication): Application inserted. Insert ID:', result.insertId); // Add this log
            return applicationQueries.getApplicationById(result.insertId);
        } catch (err) {
            console.error('Error creating application (in applicationQueries.js):', err);
            throw err;
        }
    },

    updateApplicationStatus: async (applicationId, status) => {
        const query = `
            UPDATE applications
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        `;
        try {
            const [result] = await pool.query(query, [status, applicationId]);
            return result; // Contains affectedRows
        } catch (error) {
            console.error('Error updating application status (in applicationQueries.js):', error);
            throw error;
        }
    }
};

module.exports = applicationQueries;