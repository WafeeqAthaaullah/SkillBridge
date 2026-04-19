// project-root/server/apiHandlers/studentApiHandlers.js
const myModule = require('../myModule'); // For sendResponse utility
const studentQueries = require('../db/studentQueries'); // For database queries

const studentApiHandlers = {
    handleGetStudentProfile: async (req, res, studentId) => {
        try {
            const student = await studentQueries.getStudentById(studentId);
            if (student) {
                myModule.sendResponse(res, 200, 'OK', student);
            } else {
                myModule.sendResponse(res, 404, 'Not Found', { message: 'Student not found.' });
            }
        } catch (error) {
            console.error('Error fetching student profile:', error);
            myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to fetch student profile.' });
        }
    }
    // You can add other student API handlers here (e.g., update profile)
};

module.exports = studentApiHandlers;