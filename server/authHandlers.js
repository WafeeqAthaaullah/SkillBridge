// authHandlers.js - Handles API authentication logic (POST requests)

const myModule = require('./myModule'); // For setting CORS headers and redirects
const pool = require('./db');          // Database connection pool

// Handler for '/api/auth/student/login' POST request
async function handleStudentLogin(req, res, parsedBody) {
    const { email, password } = parsedBody;

    try {
        // Basic check: In a real app, you'd hash passwords (e.g., using bcrypt) and compare hashes.
        const [rows] = await pool.query('SELECT id FROM students WHERE email = ? AND password = ?', [email, password]);

        if (rows.length > 0) {
            // Success: Respond with success message and student ID
            myModule.setCorsHeaders(res);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Student login successful!', studentId: rows[0].id }));
        } else {
            // Failure
            myModule.setCorsHeaders(res);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid student email or password.' }));
        }
    } catch (error) {
        console.error('Student login API error:', error);
        myModule.setCorsHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error during student login.' }));
    }
}

// Handler for '/api/auth/student/register' POST request
async function handleStudentRegister(req, res, parsedBody) {
    const { name, email, password } = parsedBody;

    if (!name || !email || !password) {
        myModule.setCorsHeaders(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Name, email, and password are required for student registration.' }));
        return;
    }

    try {
        // Check if student already exists
        const [existing] = await pool.query('SELECT id FROM students WHERE email = ?', [email]);
        if (existing.length > 0) {
            myModule.setCorsHeaders(res);
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Student with this email already exists.' }));
            return;
        }

        // Insert new student
        // In a real app, hash the password (e.g., using bcrypt) before storing
        const [result] = await pool.query(
            'INSERT INTO students (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );

        myModule.setCorsHeaders(res);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Student registered successfully!', studentId: result.insertId }));
    } catch (error) {
        console.error('Student registration API error:', error);
        myModule.setCorsHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error during student registration.' }));
    }
}

// Handler for '/api/auth/company/login' POST request
async function handleCompanyLogin(req, res, parsedBody) {
    const { email, password } = parsedBody;

    try {
        const [rows] = await pool.query('SELECT company_id FROM company_users WHERE email = ? AND password = ?', [email, password]);

        if (rows.length > 0) {
            myModule.setCorsHeaders(res);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Company login successful!', companyId: rows[0].company_id }));
        } else {
            myModule.setCorsHeaders(res);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid company email or password.' }));
        }
    } catch (error) {
        console.error('Company login API error:', error);
        myModule.setCorsHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error during company login.' }));
    }
}

// Handler for '/api/auth/company/register' POST request
async function handleCompanyRegister(req, res, parsedBody) {
    const { companyName, email, password } = parsedBody; // Assuming companyName is provided in signup form

    if (!companyName || !email || !password) {
        myModule.setCorsHeaders(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Company name, email, and password are required for registration.' }));
        return;
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if company email already exists in company_users
        const [existingUser] = await connection.query('SELECT id FROM company_users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            myModule.setCorsHeaders(res);
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Company user with this email already exists.' }));
            return;
        }

        // 1. Insert into companies table
        const [companyResult] = await connection.query(
            'INSERT INTO companies (name, email) VALUES (?, ?)',
            [companyName, email] // Only name and email are mandatory for companies table based on your schema
        );
        const companyId = companyResult.insertId;

        // 2. Insert into company_users table using the new company_id
        const [userResult] = await connection.query(
            'INSERT INTO company_users (company_id, email, password) VALUES (?, ?, ?)',
            [companyId, email, password] // Hash password in a real app!
        );

        await connection.commit();
        myModule.setCorsHeaders(res);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Company registered successfully!', companyId: companyId, userId: userResult.insertId }));

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Company registration API error:', error);
        myModule.setCorsHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error during company registration.' }));
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


module.exports = {
    handleStudentLogin,
    handleStudentRegister,
    handleCompanyLogin,
    handleCompanyRegister
};