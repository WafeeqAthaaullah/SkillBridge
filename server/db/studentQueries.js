// project-root/server/db/studentQueries.js
const db = require('../db'); // Adjust path to your db.js as needed

const studentQueries = {
    getStudentById: async (studentId) => {
        const query = `
            SELECT
                id,
                name,
                email,
                phone,
                major,
                university,
                gpa,
                skills,
                resume_url,        -- Ensure these match your DB
                cover_letter_url,  -- Ensure these match your DB
                profile_picture_url -- Ensure these match your DB
            FROM
                students
            WHERE id = ?`;
        try {
            const [rows] = await db.query(query, [studentId]);
            const student = rows[0];

            if (student && typeof student.skills === 'string') {
                student.skills = student.skills.split(',').map(s => s.trim());
            }
            return student;
        } catch (err) {
            console.error("Error in getStudentById query:", err);
            throw err;
        }
    },

    updateStudentProfile: async (studentId, studentData) => {
        const {
            name,
            email,
            phone,
            major,
            university,
            gpa,
            skills,
            resume_url,        // Ensure these match your DB
            cover_letter_url,  // Ensure these match your DB
            profile_picture_url // Ensure these match your DB
        } = studentData;

        const skillsString = Array.isArray(skills) ? skills.join(',') : (skills || '');

        const query = `
            UPDATE students SET
                name = ?,
                email = ?,
                phone = ?,
                major = ?,
                university = ?,
                gpa = ?,
                skills = ?,
                resume_url = ?,        -- Ensure these match your DB
                cover_letter_url = ?,  -- Ensure these match your DB
                profile_picture_url = ?, -- Ensure these match your DB
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        `;
        const values = [
            name,
            email,
            phone,
            major,
            university,
            gpa,
            skillsString,
            resume_url,
            cover_letter_url,
            profile_picture_url,
            studentId
        ];

        try {
            const [result] = await db.query(query, values);
            return result;
        } catch (err) {
            console.error("Error in updateStudentProfile query:", err);
            throw err;
        }
    }
};

module.exports = studentQueries;