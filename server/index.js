// z// index.js - Main Pure Node.js HTTP Server Entry Point (Simplest Version)

require('dotenv').config(); // Load environment variables
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Import our modules
const studentApiHandlers = require('./apiHandlers/studentApiHandlers');
const internshipApiHandlers = require('./apiHandlers/internshipApiHandlers');
const applicationApiHandlers = require('./apiHandlers/applicationApiHandlers');
const myModule = require('./myModule'); // For serving static files, CORS, and sendResponse utility
const authApiHandlers = require('./authHandlers'); // For API authentication (login/register POSTs)
const pageHandlers = require('./pageHandlers');    // For serving HTML pages (GET requests for views)
const apiHandlers = require('./apiHandlers');      // For all other /api/* endpoints (general purpose)

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, '../public');

// Helper to parse request body (for POST/PUT requests)
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            try {
                if (body) {
                    // Check Content-Type to parse correctly
                    const contentType = req.headers['content-type'];
                    if (contentType && contentType.includes('application/json')) {
                        resolve(JSON.parse(body));
                    } else if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
                        // Very basic URL-encoded parsing (you might need a library for robust parsing)
                        const params = new URLSearchParams(body);
                        const obj = {};
                        for (const [key, value] of params.entries()) {
                            obj[key] = value;
                        }
                        resolve(obj);
                    } else {
                        // Fallback for other content types, treat as raw text or empty
                        resolve(body);
                    }
                } else {
                    resolve({}); // No body or empty body
                }
            } catch (error) {
                console.error('Error parsing request body:', error);
                reject(error); // Reject if parsing fails
            }
        });
        req.on('error', err => {
            reject(err);
        });
    });
}

// Create the HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true); // `true` to parse query strings
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    console.log(`Incoming Request: Method=${method}, Pathname=${pathname}`);
    // Set common CORS headers for all responses (always allow http://localhost:8080)
    myModule.setCorsHeaders(res);

    // Handle OPTIONS method for CORS preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(204); // No Content
        res.end();
        return;
    }

    // --- CRITICAL FIX START ---
    let parsedBody = {};
    const contentType = req.headers['content-type'] || '';

    // Only call getRequestBody if it's a POST/PUT/DELETE AND NOT multipart/form-data
    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && !contentType.includes('multipart/form-data')) {
        try {
            console.log(`Server: Processing body with getRequestBody for content-type: ${contentType}`);
            parsedBody = await getRequestBody(req);
        } catch (error) {
            console.error("Server: Error parsing request body (non-multipart):", error);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid request body (e.g., malformed JSON or URL-encoded data)');
            return;
        }
    }
    // --- CRITICAL FIX END ---

    // --- Route Handling ---

    // 1. API Routes (prefixed with /api)
    if (pathname.startsWith('/api/')) {
        const apiPath = pathname.substring(4); // e.g., /api/internships/1 becomes /internships/1

        console.log(`Debug: apiPath derived as: '${apiPath}'`);

        if (apiPath === '' && method === 'GET') {
            return apiHandlers.handleApiRoot(req, res);
        }

        // --- AUTHENTICATION API ENDPOINTS ---
        else if (apiPath === '/auth/company/register' && method === 'POST') {
            console.log('DEBUG: Matched /api/auth/company/register POST.');
            return apiHandlers.handleCompanySignup(req, res, parsedBody); // Use apiHandlers.handleCompanySignup
        } else if (apiPath === '/auth/company/login' && method === 'POST') {
            console.log('DEBUG: Matched /api/auth/company/login POST.');
            return authApiHandlers.handleCompanyLogin(req, res, parsedBody);
        } else if (apiPath === '/auth/student/login' && method === 'POST') {
            console.log('DEBUG: Matched /api/auth/student/login POST.');
            return authApiHandlers.handleStudentLogin(req, res, parsedBody);
        } else if (apiPath === '/auth/student/register' && method === 'POST') {
            console.log('DEBUG: Matched /api/auth/student/register POST.');
            return authApiHandlers.handleStudentRegister(req, res, parsedBody);
        }
        // END of authentication routes

        // --- STUDENT/INTERNSHIP/APPLICATION/COMPANY API ENDPOINTS ---

        // GET /api/students/:id (for fetching student profile)
        else if (apiPath.match(/^\/students\/\d+$/) && method === 'GET') {
            const studentId = parseInt(apiPath.split('/')[2]);
            if (!isNaN(studentId)) {
                console.log(`DEBUG: Matched /api/students/:id GET for studentId: ${studentId}`);
                return studentApiHandlers.handleGetStudentProfile(req, res, studentId);
            }
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid student ID format.' });
        }
        // PUT /api/students/:id
        else if (apiPath.match(/^\/students\/\d+$/) && method === 'PUT') {
            const id = apiPath.split('/')[2];
            return apiHandlers.handlePutStudent(req, res, id, parsedBody);
        }
        // GET /api/internships (for fetching all internships)
        else if (apiPath === '/internships' && method === 'GET') {
            console.log('DEBUG: Matched /api/internships GET (all).');
            return internshipApiHandlers.handleGetAllInternships(req, res);
        }
        // GET /api/internships/:id (for fetching a single internship by ID)
        else if (apiPath.match(/^\/internships\/\d+$/) && method === 'GET') {
            const internshipId = parseInt(apiPath.split('/')[2]);
            if (!isNaN(internshipId)) {
                console.log(`DEBUG: Matched /api/internships/:id GET for internshipId: ${internshipId}`);
                return internshipApiHandlers.handleGetInternshipById(req, res, internshipId);
            }
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid internship ID format.' });
        }
        // POST /api/internships
        else if (apiPath === '/internships' && method === 'POST') {
            return apiHandlers.handlePostInternship(req, res, parsedBody);
        }
        // PUT /api/internships/:id
        else if (apiPath.match(/^\/internships\/\d+$/) && method === 'PUT') {
            const id = apiPath.split('/')[2];
            return apiHandlers.handlePutInternship(req, res, id, parsedBody);
        }
        // DELETE /api/internships/:id
        else if (apiPath.match(/^\/internships\/\d+$/) && method === 'DELETE') {
            const id = apiPath.split('/')[2];
            return apiHandlers.handleDeleteInternship(req, res, id);
        }
        // GET /api/students/:id/applications (for fetching student's applications)
        else if (apiPath.match(/^\/students\/\d+\/applications$/) && method === 'GET') {
            const parts = apiPath.split('/');
            const studentId = parseInt(parts[2]);
            if (!isNaN(studentId)) {
                console.log(`DEBUG: Matched GET /api/students/:id/applications for studentId: ${studentId}`);
                return applicationApiHandlers.handleGetApplicationsByStudentId(req, res, studentId);
            }
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid student ID provided for applications.' });
        }
        // GET /api/applications (for all applications, with optional filters via query params)
        else if (apiPath === '/applications' && method === 'GET') {
            return apiHandlers.handleGetApplications(req, res, parsedUrl.query);
        }
        // POST /api/applications (multipart form data)
        else if (apiPath === '/applications' && method === 'POST') {
            console.log('Server: Routing to handlePostApplication (multipart expected).');
            return apiHandlers.handlePostApplication(req, res);
        }
        // GET /api/applications/:id
        else if (apiPath.match(/^\/applications\/\d+$/) && method === 'GET') {
            const id = apiPath.split('/')[2];
            return apiHandlers.handleGetApplicationById(req, res, id);
        }
        // PUT /api/applications/:id/status
        else if (apiPath.match(/^\/applications\/\d+\/status$/) && method === 'PUT') {
            const id = apiPath.split('/')[2];
            return apiHandlers.handlePutApplicationStatus(req, res, id, parsedBody);
        }
        // GET /api/companies (for all companies)
        else if (apiPath === '/companies' && method === 'GET') {
            return apiHandlers.handleGetCompanies(req, res);
        }
        // NEW: GET /api/company/profile/:id (for fetching a single company profile by ID from path)
        else if (apiPath.match(/^\/company\/profile\/\d+$/) && method === 'GET') {
            const companyId = parseInt(apiPath.split('/')[3]); // '/company/profile/ID' -> ['', 'company', 'profile', 'ID']
            if (!isNaN(companyId)) {
                console.log(`DEBUG: Matched GET /api/company/profile/:id for companyId: ${companyId}`);
                return apiHandlers.handleGetCompanyProfile(req, res, companyId); // Using the consolidated handler
            }
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid company ID format.' });
        }
        // NEW: PUT /api/company/profile/:id (for updating a company profile by ID from path)
        else if (apiPath.match(/^\/company\/profile\/\d+$/) && method === 'PUT') {
            const companyId = parseInt(apiPath.split('/')[3]); // '/company/profile/ID' -> ['', 'company', 'profile', 'ID']
            if (!isNaN(companyId)) {
                console.log(`DEBUG: Matched PUT /api/company/profile/:id for companyId: ${companyId}`);
                return apiHandlers.handlePutCompanyProfile(req, res, companyId, parsedBody); // Using the consolidated handler
            }
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid company ID format.' });
        }
        // GET /api/company/internships?companyId=... (company specific internships)
        else if (apiPath === '/company/internships' && method === 'GET') {
            // companyId is now read directly by handleGetCompanyInternships from parsedUrl.query
            console.log(`DEBUG: Matched GET /api/company/internships (query params handled inside handler).`);
            return apiHandlers.handleGetCompanyInternships(req, res);
        }
        // GET /api/company/applications?companyId=... (company specific applications)
        else if (apiPath === '/company/applications' && method === 'GET') {
            // companyId is now read directly by handleGetCompanyApplications from parsedUrl.query
            console.log(`DEBUG: Matched GET /api/company/applications (query params handled inside handler).`);
            return apiHandlers.handleGetCompanyApplications(req, res);
        }
        // --- END COMPANY DASHBOARD API ENDPOINTS ---
        // If no API handler matches
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('API Endpoint Not Found');
            return;
        }
    }

    // 2. Page Navigation Routes (handled by pageHandlers - primarily GET requests)
    else if (pathname === '/' && method === 'GET') {
        return pageHandlers.handleRoot(req, res);
    } else if (pathname === '/login' && method === 'GET') {
        return pageHandlers.handleLoginGet(req, res);
    } else if (pathname === '/home' && method === 'GET') {
        return pageHandlers.handleHomeGet(req, res);
    } else if (pathname === '/myprofile' && method === 'GET') {
        return pageHandlers.handleMyProfileGet(req, res);
    } else if (pathname === '/logout' && method === 'GET') {
        return pageHandlers.handleLogoutGet(req, res);
    }
    // Student specific pages
    else if (pathname === '/student/dashboard' && method === 'GET') {
        return pageHandlers.handleStudentDashboardGet(req, res);
    } else if (pathname === '/student/internships' && method === 'GET') {
        return pageHandlers.handleStudentInternshipsGet(req, res);
    } else if (pathname === '/student/internships/detail' && method === 'GET') {
        return pageHandlers.handleStudentInternshipDetailGet(req, res);
    } else if (pathname === '/student/internships/apply' && method === 'GET') {
        return pageHandlers.handleInternshipApplyGet(req, res);
    } else if (pathname === '/student/applications' && method === 'GET') {
        return pageHandlers.handleStudentApplicationsGet(req, res);
    } else if (pathname === '/student/logout' && method === 'GET') {
        return pageHandlers.handleStudentLogoutPageGet(req, res);
    }
    // Company specific pages
    else if (pathname === '/company/login' && method === 'GET') {
        return pageHandlers.handleCompanyLoginGet(req, res);
    } else if (pathname === '/company/signup' && method === 'GET') {
        return pageHandlers.handleCompanySignupGet(req, res);
    } else if (pathname === '/company/dashboard' && method === 'GET') {
        return pageHandlers.handleCompanyDashboardGet(req, res);
    } else if (pathname === '/company/profile' && method === 'GET') {
        return pageHandlers.handleCompanyProfileGet(req, res);
    } else if (pathname === '/company/manage-internships' && method === 'GET') {
        return pageHandlers.handleManageInternshipsGet(req, res);
    } else if (pathname === '/company/post-internship' && method === 'GET') {
        return pageHandlers.handlePostInternshipGet(req, res);
    } else if (pathname === '/company/view-applications' && method === 'GET') {
        return pageHandlers.handleViewApplicationsGet(req, res);
    }

    // 3. Serve Static Files (from the 'public' directory - fallback)
    else {
        const filePath = path.join(PUBLIC_DIR, pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                // If file not found, try appending .html for common cases
                const htmlFilePath = path.join(PUBLIC_DIR, pathname + '.html');
                fs.readFile(htmlFilePath, (htmlErr, htmlData) => {
                    if (htmlErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                        return;
                    }
                    myModule.setCorsHeaders(res);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(htmlData);
                });
                return;
            }

            // Determine content type based on file extension
            const extname = path.extname(filePath);
            let contentType = 'application/octet-stream';
            switch (extname) {
                case '.html':
                    contentType = 'text/html';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.js':
                    contentType = 'application/javascript';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.jpg':
                    contentType = 'image/jpeg';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                case '.svg':
                    contentType = 'image/svg+xml';
                    break;
                case '.pdf':
                    contentType = 'application/pdf';
                    break;
                // Add more types as needed
            }

            myModule.setCorsHeaders(res); // Ensure CORS for static files
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving static files from ${PUBLIC_DIR}`);
});