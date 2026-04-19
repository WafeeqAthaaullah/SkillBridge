// db.js - MySQL Database Connection Pool
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root', // Your MySQL password here
    database: process.env.DB_NAME || 'internship_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release();
    })
    .catch(err => {
        console.error('Failed to connect to MySQL database:', err.message);
        console.error('Please ensure MySQL server is running and .env credentials are correct.');
        process.exit(1); // Exit the process if database connection fails
    });

module.exports = pool;