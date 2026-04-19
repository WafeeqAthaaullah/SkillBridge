// project-root/server/apiHandlers/applicationApiHandlers.js
const myModule = require('../myModule');
const applicationQueries = require('../db/applicationQueries'); // <-- The problematic line

// --- ADD THESE DEBUG LOGS ---
console.log('DEBUG (applicationApiHandlers.js): applicationQueries received:', applicationQueries);
console.log('DEBUG (applicationApiHandlers.js): Type of getApplicationsByStudentId from import:', typeof applicationQueries.getApplicationsByStudentId);
// --- END DEBUG LOGS ---

const applicationApiHandlers = {
    handleGetApplicationsByStudentId: async (req, res, studentId) => {
        try {
            // Ensure myModule.sendResponse is present before use
            if (typeof myModule.sendResponse !== 'function') {
                console.error('CRITICAL ERROR: myModule.sendResponse is not a function in applicationApiHandlers.js');
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error: Server misconfiguration.');
                return;
            }

            const applications = await applicationQueries.getApplicationsByStudentId(studentId);
            myModule.sendResponse(res, 200, 'OK', applications);
        } catch (error) {
            console.error('Error fetching student applications (in applicationApiHandlers.js):', error); // Added context
            // Ensure myModule.sendResponse is present before use
            if (typeof myModule.sendResponse === 'function') {
                myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to fetch applications.' });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error: Error handler failed.');
            }
        }
    }
    // You can add other application API handlers here (e.g., submit application, update status)
};

module.exports = applicationApiHandlers;