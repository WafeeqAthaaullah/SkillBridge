// project-root/server/apiHandlers.js

const url = require('url');
const path = require('path');
const myModule = require('./myModule'); // For setting CORS headers
const pool = require('./db.js');           // Database connection pool (used for other handlers)
const fileUploads = require('./utils/fileUploads'); // For handling file uploads
const studentQueries = require('./db/studentQueries.js'); // For student-specific queries
const applicationQueries = require('./db/applicationQueries.js'); // For application queries

// --- INSECURE PASSWORD HANDLING FUNCTIONS (INLINED) ---
// WARNING: These functions handle passwords in plain text.
// This is HIGHLY INSECURE and NOT RECOMMENDED for production.
// For real applications, use a strong hashing library like bcrypt.

async function hashPassword(password) {
    console.warn("Security Warning: Passwords are NOT being hashed. Using plain text for authentication.");
    return password;
}

async function comparePassword(password, storedPassword) {
    console.warn("Security Warning: Passwords are NOT being compared securely. Using plain text comparison.");
    return password === storedPassword;
}
// --- END OF INSECURE PASSWORD HANDLING FUNCTIONS ---

// Handler for the root API endpoint
function handleApiRoot(req, res) {
    myModule.sendResponse(res, 200, 'OK', { message: 'Welcome to the Internship Platform Backend API (Pure Node.js Version)!' });
}

// --- INTERNSHIPS API Handlers ---
async function handleGetInternships(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM internships');
        myModule.sendResponse(res, 200, 'OK', rows);
    } catch (error) {
        console.error('Error fetching internships:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve internships.' });
    }
}

async function handlePostInternship(req, res, parsedBody) {
    try {
        const { company_id, title, description, location, stipend, duration, start_date, required_skills } = parsedBody;

        let company_name = 'Unknown Company';
        if (company_id) {
            const [companyRows] = await pool.query('SELECT name FROM companies WHERE id = ?', [company_id]);
            if (companyRows.length > 0) {
                company_name = companyRows[0].name;
            }
        }

        if (!company_id || !title || !description || !location || !stipend || !duration) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Missing required internship fields (company_id, title, description, location, stipend, duration)' });
        }

        const postedDate = new Date().toISOString().slice(0, 10);
        const status = "Active";

        const [result] = await pool.query(
            'INSERT INTO internships (company_id, company_name, title, description, location, stipend, duration, start_date, required_skills, status, posted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [company_id, company_name, title, description, location, stipend, duration, start_date || null, required_skills, status, postedDate]
        );

        const newInternship = { id: result.insertId, posted_date: postedDate, status, ...parsedBody, company_name };
        myModule.sendResponse(res, 201, 'Created', { message: 'Internship added successfully!', internship: newInternship });

    } catch (error) {
        console.error('Error adding internship:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to add internship.' });
    }
}

async function handleGetInternshipById(req, res, id) {
    try {
        const internshipId = parseInt(id);
        const [rows] = await pool.query('SELECT id, title, company_id, company_name, location, duration, stipend, description, required_skills, status, posted_date, start_date FROM internships WHERE id = ?', [internshipId]);
        if (rows.length > 0) {
            myModule.sendResponse(res, 200, 'OK', rows[0]);
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Internship not found' });
        }
    } catch (error) {
        console.error('Error fetching internship by ID:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve internship.' });
    }
}

async function handlePutInternship(req, res, id, parsedBody) {
    try {
        const internshipId = parseInt(id);
        const { title, description, location, stipend, duration, start_date, required_skills, status, company_id } = parsedBody;

        if (!company_id) {
            return myModule.sendResponse(res, 401, 'Unauthorized', { message: 'Company ID is required for authorization.' });
        }

        const [result] = await pool.query(
            'UPDATE internships SET title=?, description=?, location=?, stipend=?, duration=?, start_date=?, required_skills=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?',
            [title, description, location, stipend, duration, start_date || null, required_skills, status || 'Active', internshipId, company_id]
        );

        if (result.affectedRows > 0) {
            const [rows] = await pool.query('SELECT * FROM internships WHERE id = ?', [internshipId]);
            myModule.sendResponse(res, 200, 'OK', { message: 'Internship updated successfully!', internship: rows[0] });
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Internship not found or no changes, or unauthorized access.' });
        }
    } catch (error) {
        console.error('Error updating internship:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to update internship.' });
    }
}

async function handleDeleteInternship(req, res, id) {
    try {
        const internshipId = parseInt(id);
        // In a real application, you might also want to check company_id here
        // to ensure only the owning company can delete.
        await pool.query('DELETE FROM applications WHERE internship_id = ?', [internshipId]);
        const [result] = await pool.query('DELETE FROM internships WHERE id = ?', [internshipId]);

        if (result.affectedRows > 0) {
            myModule.sendResponse(res, 200, 'OK', { message: 'Internship and associated applications deleted successfully!' });
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Internship not found' });
        }
    } catch (error) {
        console.error('Error deleting internship:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to delete internship.' });
    }
}

// --- STUDENTS API Handlers ---
async function handleGetStudents(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM students');
        myModule.sendResponse(res, 200, 'OK', rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve students.' });
    }
}

async function handleGetStudentById(req, res, id) {
    try {
        const studentId = parseInt(id);
        const student = await studentQueries.getStudentById(studentId);
        if (student) {
            myModule.sendResponse(res, 200, 'OK', student);
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Student not found' });
        }
    } catch (error) {
        console.error('Error fetching student by ID:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve student.' });
    }
}

async function handlePutStudent(req, res, id, parsedBody) {
    try {
        const studentId = parseInt(id);
        const {
            name,
            email,
            phone,
            major,
            university,
            gpa,
            skills,
            resume_url,
            cover_letter_url,
            profile_picture_url
        } = parsedBody;

        const updatedStudentData = {
            name, email, phone, major, university, gpa, skills,
            resume_url, cover_letter_url, profile_picture_url
        };

        const [existingRows] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);

        if (existingRows.length > 0) {
            const result = await studentQueries.updateStudentProfile(studentId, updatedStudentData);

            if (result.affectedRows > 0) {
                const updatedStudent = await studentQueries.getStudentById(studentId);
                myModule.sendResponse(res, 200, 'OK', { message: 'Student profile updated successfully!', student: updatedStudent });
            } else {
                const currentStudent = await studentQueries.getStudentById(studentId);
                myModule.sendResponse(res, 200, 'OK', { message: 'Student profile updated (no changes detected).', student: currentStudent });
            }
        } else {
            console.warn('Attempted to create a new student via PUT /api/students/:id. This is unusual. Consider implementing POST for creation.');
            const [result] = await pool.query(
                'INSERT INTO students (id, name, email, phone, major, university, gpa, skills, resume_url, cover_letter_url, profile_picture_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [studentId, name, email, phone, major, university, gpa, skills, resume_url, cover_letter_url, profile_picture_url]
            );
            const newStudent = { id: result.insertId, ...updatedStudentData };
            myModule.sendResponse(res, 201, 'Created', { message: 'Student profile created successfully!', student: newStudent });
        }
    } catch (error) {
        console.error('Error updating/creating student profile:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            myModule.sendResponse(res, 409, 'Conflict', { message: 'Email already registered for another student.' });
        } else {
            myModule.sendResponse(res, 500, 'Internal Server Error', { message: `Failed to update/create student profile. Error: ${error.message}` });
        }
    }
}

// --- APPLICATIONS API Handlers ---
async function handleGetApplications(req, res, queryParams) {
    try {
        const studentId = queryParams.get('studentId');
        const internshipId = queryParams.get('internshipId');

        if (studentId) {
            const applications = await applicationQueries.getApplicationsByStudentId(parseInt(studentId));
            myModule.sendResponse(res, 200, 'OK', applications);
        } else if (internshipId) {
            const applications = await applicationQueries.getApplicationsByInternshipId(parseInt(internshipId));
            myModule.sendResponse(res, 200, 'OK', applications);
        } else {
            const applications = await applicationQueries.getAllApplications();
            myModule.sendResponse(res, 200, 'OK', applications);
        }
    } catch (error) {
        console.error('Error fetching applications:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve applications.' });
    }
}

async function handlePostApplication(req, res) {
    try {
        const { fields, files } = await fileUploads.parseMultipartFormData(req);
        console.log('DEBUG (handlePostApplication): Raw fields from fileUploads.js:', fields);
        console.log('DEBUG (handlePostApplication): Raw files from fileUploads.js:', files);
        console.log('DEBUG (handlePostApplication): student_name:', fields.student_name);
        console.log('DEBUG (handlePostApplication): student_email:', fields.student_email);
        console.log('DEBUG (handlePostApplication): student_phone:', fields.student_phone);
        console.log('DEBUG (handlePostApplication): student_gpa:', fields.student_gpa);
        console.log('DEBUG (handlePostApplication): student_skills:', fields.student_skills);
        // Extract data from 'fields' (text inputs)
        const student_id = fields.student_id;
        const internship_id = fields.internship_id;
        const application_date = fields.application_date;
        const status = fields.status;
        const student_name = fields.student_name;
        const student_email = fields.student_email;
        const student_phone = fields.student_phone;
        const student_gpa = fields.student_gpa;
        const student_skills = fields.student_skills;

        let resume_url = null;
        let cover_letter_url = null;

        // Determine resume URL
        if (files.resume_file) {
            resume_url = `/uploads/${path.basename(files.resume_file.filepath)}`;
        } else if (fields.resume_url_existing) {
            resume_url = fields.resume_url_existing;
        }

        // Determine cover letter URL
        if (files.cover_letter_file) {
            cover_letter_url = `/uploads/${path.basename(files.cover_letter_file.filepath)}`;
        } else if (fields.cover_letter_url_existing) {
            cover_letter_url = fields.cover_letter_url_existing;
        }

        // Basic validation (add more robust validation as needed)
        if (!student_id || !internship_id || !resume_url) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Missing required application data: student_id, internship_id, or resume.' });
        }

        const newApplicationId = await applicationQueries.addApplication({
            student_id: parseInt(student_id),
            internship_id: parseInt(internship_id),
            resume_url,
            cover_letter_url,
            submitted_on: application_date,
            status,
            student_name,
            student_email,
            student_phone,
            student_gpa: parseFloat(student_gpa),
            student_skills
        });

        if (newApplicationId) {
            myModule.sendResponse(res, 201, 'Created', { message: 'Application submitted successfully', id: newApplicationId, success: true });
        } else {
            myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to create application in database.' });
        }

    } catch (error) {
        console.error('Error submitting application:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Error submitting application: ' + error.message });
    }
}

async function handleGetApplicationById(req, res, id) {
    try {
        const applicationId = parseInt(id);
        const application = await applicationQueries.getApplicationById(applicationId);
        if (application) {
            myModule.sendResponse(res, 200, 'OK', application);
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Application not found' });
        }
    } catch (error) {
        console.error('Error fetching application by ID:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve application.' });
    }
}

async function handlePutApplicationStatus(req, res, id, parsedBody) {
    try {
        const applicationId = parseInt(id);
        const { status } = parsedBody;

        if (!status) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Status field is required for updating application status.' });
        }

        const result = await applicationQueries.updateApplicationStatus(applicationId, status);

        if (result.affectedRows > 0) {
            const updatedApplication = await applicationQueries.getApplicationById(applicationId);
            myModule.sendResponse(res, 200, 'OK', { message: 'Application status updated successfully!', application: updatedApplication });
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Application not found or no changes.' });
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: `Failed to update application status. Error: ${error.message}` });
    }
}

// --- COMPANIES API Handlers ---
async function handleGetCompanies(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM companies');
        myModule.sendResponse(res, 200, 'OK', rows);
    } catch (error) {
        console.error('Error fetching companies:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to retrieve companies.' });
    }
}

// Handle Company Signup
async function handleCompanySignup(req, res, parsedBody) {
    try {
        const { name, email, password, industry, website } = parsedBody;

        // 1. Basic server-side validation
        if (!name || !email || !password) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Company name, email, and password are required.' });
        }

        // 2. Check if a user with this email already exists in company_users
        // This is crucial to prevent duplicate registrations for the login credential
        const [existingUser] = await pool.query('SELECT id FROM company_users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return myModule.sendResponse(res, 409, 'Conflict', { message: 'An account with this email already exists for a company user.' });
        }

        // 3. Hash the password BEFORE storing it! (CRITICAL SECURITY STEP)
        // For demonstration, we're using the insecure hashPassword, but in production:
        // const bcrypt = require('bcrypt');
        // const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPassword = await hashPassword(password); // Your insecure placeholder for now

        // Start a transaction if you want both inserts to succeed or fail together.
        // For simplicity now, we'll do them sequentially, but transaction is better.

        // First: Insert into the 'companies' table for the company profile
        const [companyResult] = await pool.query(
    'INSERT INTO companies (name, email, industry, website, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, industry || null, website || null, new Date(), new Date()] // Now 6 values for 6 placeholders
);

const newCompanyId = companyResult.insertId; // Get the ID of the newly created company

        // Second: Insert into the 'company_users' table for the login credentials
        const [userResult] = await pool.query(
            'INSERT INTO company_users (company_id, email, password, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [newCompanyId, email, hashedPassword]
        );

        const newCompanyUserId = userResult.insertId;

        // Respond with success
        myModule.sendResponse(res, 201, 'Created', {
            message: 'Company and user account registered successfully!',
            companyId: newCompanyId,
            companyUserId: newCompanyUserId,
            companyName: name, // Provide the company name back for convenience
            companyEmail: email
        });

    } catch (error) {
        console.error('Error during company signup:', error);
        // If the first insert succeeds but the second fails, you might want to
        // implement a rollback or cleanup for the company entry. For now, a general error.
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to register company due to a server error.' });
    }
}


// Consolidated handleGetCompanyProfile: Fetches a company profile by ID from the path parameter
async function handleGetCompanyProfile(req, res, companyId) {
    try {
        const id = parseInt(companyId);
        if (isNaN(id)) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid Company ID format.' });
        }

        const [rows] = await pool.query('SELECT id, name, email, logo_url, description, industry, website FROM companies WHERE id = ?', [id]);

        if (rows.length === 0) {
            return myModule.sendResponse(res, 404, 'Not Found', { message: 'Company profile not found.' });
        }
        myModule.sendResponse(res, 200, 'OK', rows[0]);
    } catch (error) {
        console.error('Error fetching company profile:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Internal server error while fetching company profile.' });
    }
}

// Consolidated handlePutCompanyProfile: Updates a company profile by ID from the path parameter
async function handlePutCompanyProfile(req, res, companyId, parsedBody) {
    try {
        const id = parseInt(companyId);
        if (isNaN(id)) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Invalid Company ID format.' });
        }

        const { name, email, description, industry, website, logo_url } = parsedBody;

        if (!name && !email && !description && !industry && !website && !logo_url) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'No fields provided for update.' });
        }

        const [result] = await pool.query(
            'UPDATE companies SET name=?, email=?, description=?, industry=?, website=?, logo_url=?, updated_at=CURRENT_TIMESTAMP WHERE id = ?',
            [name, email, description, industry, website, logo_url, id]
        );

        if (result.affectedRows > 0) {
            const [updatedRows] = await pool.query('SELECT id, name, email, logo_url, description, industry, website FROM companies WHERE id = ?', [id]);
            myModule.sendResponse(res, 200, 'OK', { message: 'Company profile updated successfully!', company: updatedRows[0] });
        } else {
            myModule.sendResponse(res, 404, 'Not Found', { message: 'Company not found or no changes were made.' });
        }
    } catch (error) {
        console.error('Error updating company profile:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            myModule.sendResponse(res, 409, 'Conflict', { message: 'Email already registered for another company.' });
        } else {
            myModule.sendResponse(res, 500, 'Internal Server Error', { message: `Failed to update company profile. Error: ${error.message}` });
        }
    }
}


async function handleGetCompanyInternships(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const companyId = parsedUrl.query.companyId;

        if (!companyId) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Company ID is required to fetch internships.' });
        }

        console.log(`[handleGetCompanyInternships] Attempting to fetch internships for companyId: ${companyId}`);
        const query = "SELECT id, title, location, duration, stipend, description, required_skills, status, posted_date, start_date FROM internships WHERE company_id = ?";
        console.log(`[handleGetCompanyInternships] Executing query: ${query} with companyId: ${companyId}`);

        const [rows] = await pool.query(query, [companyId]);

        console.log(`[handleGetCompanyInternships] Query successful. Found ${rows.length} internships.`);
        console.log('[handleGetCompanyInternships] Internships data:', rows);

        myModule.sendResponse(res, 200, 'OK', { internships: rows });
        console.log('[handleGetCompanyInternships] Response sent successfully.');

    } catch (error) {
        console.error('[handleGetCompanyInternships] Error fetching company internships:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Failed to fetch internships.' });
    }
}

async function handleGetCompanyApplications(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const companyId = parsedUrl.query.companyId;
        const internshipId = parsedUrl.query.internshipId;
        const status = parsedUrl.query.status;
        const studentName = parsedUrl.query.studentName;

        if (!companyId) {
            return myModule.sendResponse(res, 400, 'Bad Request', { message: 'Company ID is required to fetch applications.' });
        }

        let query = `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.internship_id,
                a.submitted_on,
                a.status,
                s.name AS student_name,
                s.email AS student_email,
                i.title AS internship_title
            FROM applications a
            JOIN internships i ON a.internship_id = i.id
            JOIN students s ON a.student_id = s.id
            WHERE i.company_id = ?
        `;
        const queryParams = [companyId];

        if (internshipId) {
            query += ` AND a.internship_id = ?`;
            queryParams.push(internshipId);
        }
        if (status) {
            query += ` AND a.status = ?`;
            queryParams.push(status);
        }
        if (studentName) {
            query += ` AND s.name LIKE ?`;
            queryParams.push(`%${studentName}%`);
        }

        query += ` ORDER BY a.submitted_on DESC`;

        console.log('[handleGetCompanyApplications] Executing query:', query, queryParams);

        const [rows] = await pool.query(query, queryParams);
        myModule.sendResponse(res, 200, 'OK', rows);
    } catch (error) {
        console.error('Error fetching company applications:', error);
        myModule.sendResponse(res, 500, 'Internal Server Error', { message: 'Internal server error while fetching company applications.' });
    }
};

module.exports = {
    handleApiRoot,
    // Internships
    handleGetInternships,
    handlePostInternship,
    handleGetInternshipById,
    handlePutInternship,
    handleDeleteInternship,
    // Students
    handleGetStudents,
    handleGetStudentById,
    handlePutStudent,
    // Applications
    handleGetApplications,
    handlePostApplication,
    handleGetApplicationById,
    handlePutApplicationStatus,
    // Companies
    handleGetCompanies,
    handleCompanySignup, // New: Company registration
    handleGetCompanyProfile, // Consolidated: Fetches company profile by ID (from path param)
    handlePutCompanyProfile, // Consolidated: Updates company profile by ID (from path param)
    handleGetCompanyInternships,
    handleGetCompanyApplications
};