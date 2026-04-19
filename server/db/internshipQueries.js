// project-root/server/db/internshipQueries.js
const db = require('../db'); // Adjust path to your db.js as needed

const internshipQueries = {
    getAllInternships: async () => {
        const query = 'SELECT i.*, c.name AS companyName FROM internships i JOIN companies c ON i.company_id = c.id';
        try {
            // Assuming db.query returns an array where the first element is rows
            // If your db.query directly returns { rows: [...] }, then use: const { rows } = await db.query(query);
            const [rows] = await db.query(query); 

            const internships = rows.map(internship => {
                // Safely handle required_skills, ensuring it's an array
                if (internship.required_skills && typeof internship.required_skills === 'string') {
                    internship.requiredSkills = internship.required_skills.split(',').map(s => s.trim());
                    // Optionally delete the snake_case property if frontend only uses camelCase
                    delete internship.required_skills;
                } else if (!internship.required_skills) {
                    internship.requiredSkills = []; // Ensure it's an empty array if null/undefined
                }
                return internship;
            });
            return internships;
        } catch (err) {
            console.error("Error in getAllInternships query:", err);
            throw err;
        }
    },
    getInternshipById: async (id) => {
        // CORRECTED: Changed placeholder from $1 to ? for MySQL compatibility
        const query = 'SELECT i.*, c.name AS companyName FROM internships i JOIN companies c ON i.company_id = c.id WHERE i.id = ?';
        try {
            // Assuming db.query returns an array where the first element is rows
            // If your db.query directly returns { rows: [...] }, then use: const { rows } = await db.query(query, [id]);
            const [rows] = await db.query(query, [id]);
            const internship = rows[0]; // Assuming ID is unique, return the first row

            if (internship) {
                // Safely handle required_skills for a single internship
                if (internship.required_skills && typeof internship.required_skills === 'string') {
                    internship.requiredSkills = internship.required_skills.split(',').map(s => s.trim());
                    delete internship.required_skills;
                } else if (!internship.required_skills) {
                    internship.requiredSkills = [];
                }
            }
            return internship; // Will be undefined if no internship found
        } catch (err) {
            console.error(`Error in getInternshipById for ID ${id}:`, err);
            throw err; // Re-throw the error so the calling handler can catch it
        }
    },
    createInternship: async (internshipData) => {
        const { company_id, title, description, requirements, location, duration, application_deadline, start_date, end_date, stipend, status } = internshipData;
        // CORRECTED: Changed placeholders from $n to ? for MySQL compatibility
        const query = `
            INSERT INTO internships (company_id, title, description, requirements, location, duration, application_deadline, start_date, end_date, stipend, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *;
        `;
        const values = [company_id, title, description, requirements, location, duration, application_deadline, start_date, end_date, stipend, status];
        try {
            const [rows] = await db.query(query, values);
            return rows[0];
        } catch (err) {
            console.error('Error creating internship:', err);
            throw err;
        }
    },
    updateInternship: async (id, internshipData) => {
        const { title, description, requirements, location, duration, application_deadline, start_date, end_date, stipend, status } = internshipData;
        // CORRECTED: Changed placeholders from $n to ? for MySQL compatibility
        const query = `
            UPDATE internships
            SET title = ?, description = ?, requirements = ?, location = ?, duration = ?, 
                application_deadline = ?, start_date = ?, end_date = ?, stipend = ?, status = ?
            WHERE id = ?
            RETURNING *;
        `;
        // Ensure values are in the correct order corresponding to the '?' placeholders
        const values = [title, description, requirements, location, duration, application_deadline, start_date, end_date, stipend, status, id];
        try {
            const [rows] = await db.query(query, values);
            return rows[0];
        } catch (err) {
            console.error(`Error updating internship with ID ${id}:`, err);
            throw err;
        }
    },
    deleteInternship: async (id) => {
        // CORRECTED: Changed placeholder from $1 to ? for MySQL compatibility
        const query = 'DELETE FROM internships WHERE id = ? RETURNING *;';
        try {
            const [rows] = await db.query(query, [id]);
            return rows[0]; // Returns the deleted internship data
        } catch (err) {
            console.error(`Error deleting internship with ID ${id}:`, err);
            throw err;
        }
    }
};

module.exports = internshipQueries;