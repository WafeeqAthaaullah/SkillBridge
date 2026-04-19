// myModule.js - Helper functions for serving specific HTML pages/redirects for raw Node.js HTTP server

const fs = require('fs');
const path = require('path');

// Helper to set common CORS headers for API responses
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080'); // Replace with your frontend origin in production
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Removed Access-Control-Allow-Credentials as cookies are no longer managed server-side
}

// --- ADD THIS sendResponse FUNCTION ---
function sendResponse(res, statusCode, statusMessage, data = {}) {
    setCorsHeaders(res); // Ensure CORS headers are always set
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
// --- END ADDITION ---


// Generic helper to serve an HTML file
function serveHtmlPage(res, pagePath, statusCode = 200) {
    // pagePath is now relative to the 'public' directory
    const filePath = path.join(__dirname, '../public', pagePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error serving HTML page ${filePath}:`, err);
            // Attempt to log more detail if file not found specifically
            if (err.code === 'ENOENT') {
                console.error(`File not found: ${filePath}`);
            }
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }
        setCorsHeaders(res);
        res.writeHead(statusCode, { 'Content-Type': 'text/html' });
        res.end(data);
    });
}

// --- Specific functions for Student Pages ---
function navigateToHome(res) {
    serveHtmlPage(res, 'homepage.html');
}

function login(res) {
    serveHtmlPage(res, 'student/loginpage.html');
}

function signup(res) {
    serveHtmlPage(res, 'student/signup.html');
}

function navigateToUserProfile(res) {
    serveHtmlPage(res, 'student/student_profile.html');
}

function studentDashboard(res) {
    serveHtmlPage(res, 'student/student_dashboard.html');
}

function studentInternships(res) {
    serveHtmlPage(res, 'student/internships.html');
}

function studentInternshipDetail(res) {
    serveHtmlPage(res, 'student/internship_detail.html');
}

function internshipApply(res) {
    serveHtmlPage(res, 'student/internship_apply.html');
}

function studentApplications(res) {
    serveHtmlPage(res, 'student/student_applications.html');
}

function studentLogoutPage(res) { // If logout.html has content to show before redirect
    serveHtmlPage(res, 'student/logout.html');
}


// --- Specific functions for Company Pages ---
function companyLogin(res) {
    serveHtmlPage(res, 'company/login.html');
}

function companySignup(res) {
    serveHtmlPage(res, 'company/signup.html');
}

function companyDashboard(res) {
    serveHtmlPage(res, 'company/company_dashboard.html');
}

function companyProfile(res) {
    serveHtmlPage(res, 'company/company_profile.html');
}

function manageInternships(res) {
    serveHtmlPage(res, 'company/manage_internships.html');
}

function postInternship(res) {
    serveHtmlPage(res, 'company/post_internship.html');
}

function viewApplications(res) {
    serveHtmlPage(res, 'company/view_applications.html');
}


// --- Generic Redirect/Logout ---
function logout(res) {
    // For pure Node.js, we send a redirect header
    setCorsHeaders(res);
    res.writeHead(302, { 'Location': '/login' }); // Redirect to student login
    res.end();
}

module.exports = {
    setCorsHeaders, // Export for use in API handlers
    serveHtmlPage,
    navigateToHome,
    login,
    signup,
    navigateToUserProfile,
    studentDashboard,
    studentInternships,
    studentInternshipDetail,
    internshipApply,
    studentApplications,
    studentLogoutPage,

    companyLogin,
    companySignup,
    companyDashboard,
    companyProfile,
    manageInternships,
    postInternship,
    viewApplications,

    logout,
    sendResponse // <--- ALSO EXPORT IT HERE!
};