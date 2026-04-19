// project-root/server/apiHandlers/internshipApiHandlers.js
const myModule = require('../myModule'); // For sendResponse utility
const internshipQueries = require('../db/internshipQueries'); // For database queries

const internshipApiHandlers = {
    handleGetAllInternships: async (req, res) => {
        try {
            const internships = await internshipQueries.getAllInternships();
            myModule.sendResponse(res, 200, 'OK', internships);
        } catch (error) {
            console.error('Error fetching all internships:', error);
            myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to fetch internships.' });
        }
    },
    handleGetInternshipById: async (req, res, internshipId) => { // Added 'async' and '=>' for consistency
        try {
            const internship = await internshipQueries.getInternshipById(internshipId);
            if (internship) {
                // CORRECTED: Use myModule.sendResponse
                myModule.sendResponse(res, 200, 'application/json', internship);
            } else {
                // CORRECTED: Use myModule.sendResponse
                myModule.sendResponse(res, 404, 'application/json', { message: 'Internship not found.' });
            }
        } catch (error) {
            console.error(`Error fetching internship by ID ${internshipId}:`, error);
            // CORRECTED: Use myModule.sendResponse
            myModule.sendResponse(res, 500, 'application/json', { message: 'Internal server error.' });
        }
    }
};

module.exports = internshipApiHandlers;