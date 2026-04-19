// project-root/server/setup_database.js

require('dotenv').config(); // Load environment variables from .env file
const mysql = require('mysql2/promise'); // Import the promise-based version of mysql2

async function setupDatabase() {
    let connection; // This variable will hold our MySQL connection

    try {
        // --- STEP 1: Connect to MySQL server (without specifying a database) ---
        // This initial connection is used to CREATE the database itself.
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root', // Your MySQL root/admin password
            // port: process.env.DB_PORT || 3306, // Uncomment if you use a non-default port
        });
        console.log('Step 1: Connected to MySQL server.');

        // --- STEP 2: Create the Database ---
        const databaseName = 'internship_platform';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
        console.log(`Step 2: Database '${databaseName}' created or already exists.`);

        // Close the initial connection. It's good practice to reconnect
        // to the specific database for subsequent operations.
        await connection.end();
        console.log('Closed initial MySQL connection.');

        // --- STEP 3: Reconnect to the newly created/existing database ---
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: databaseName, // IMPORTANT: Now connect to the specific database
            // port: process.env.DB_PORT || 3306,
        });
        console.log(`Step 3: Reconnected to '${databaseName}' database.`);

        // --- STEP 4: Create all Tables ---
        // Tables are ordered to respect foreign key dependencies
        const tableQueries = [
            `
            CREATE TABLE IF NOT EXISTS \`companies\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`phone\` varchar(50) DEFAULT NULL,
                \`address\` varchar(255) DEFAULT NULL,
                \`website\` varchar(255) DEFAULT NULL,
                \`industry\` varchar(100) DEFAULT NULL,
                \`description\` text,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`email\` (\`email\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `,
            `
            CREATE TABLE IF NOT EXISTS \`students\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`phone\` varchar(50) DEFAULT NULL,
                \`major\` varchar(100) DEFAULT NULL,
                \`university\` varchar(255) DEFAULT NULL,
                \`gpa\` decimal(3,2) DEFAULT NULL,
                \`skills\` text,
                \`resume_url\` varchar(255) DEFAULT NULL,
                \`cover_letter_url\` varchar(255) DEFAULT NULL,
                \`profile_picture_url\` varchar(255) DEFAULT NULL,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`email\` (\`email\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `,
            `
            CREATE TABLE IF NOT EXISTS \`company_users\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`company_id\` int NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`email\` (\`email\`),
                KEY \`company_id\` (\`company_id\`),
                CONSTRAINT \`company_users_ibfk_1\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `,
            `
            CREATE TABLE IF NOT EXISTS \`internships\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`company_id\` int NOT NULL,
                \`company_name\` varchar(255) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NOT NULL,
                \`location\` varchar(255) DEFAULT NULL,
                \`stipend\` decimal(10,2) DEFAULT NULL,
                \`duration\` varchar(100) DEFAULT NULL,
                \`start_date\` date DEFAULT NULL,
                \`required_skills\` text,
                \`status\` varchar(50) DEFAULT 'Active',
                \`posted_date\` date DEFAULT NULL,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`company_id\` (\`company_id\`),
                CONSTRAINT \`internships_ibfk_1\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `,
            `
            CREATE TABLE IF NOT EXISTS \`applications\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`internship_id\` int NOT NULL,
                \`student_id\` int NOT NULL,
                \`submitted_on\` date NOT NULL,
                \`status\` varchar(50) DEFAULT 'Pending',
                \`resume_path\` varchar(255) DEFAULT NULL,
                \`cover_letter_path\` varchar(255) DEFAULT NULL,
                \`student_name\` varchar(255) DEFAULT NULL,
                \`student_email\` varchar(255) DEFAULT NULL,
                \`student_phone\` varchar(50) DEFAULT NULL,
                \`student_gpa\` decimal(3,2) DEFAULT NULL,
                \`student_skills\` text,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`internship_id\` (\`internship_id\`,\`student_id\`),
                KEY \`student_id\` (\`student_id\`),
                CONSTRAINT \`applications_ibfk_1\` FOREIGN KEY (\`internship_id\`) REFERENCES \`internships\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT \`applications_ibfk_2\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            `
        ];

        console.log('\nStep 4: Creating tables...');
        for (const query of tableQueries) {
            await connection.execute(query);
            console.log(`  Executed table query: ${query.substring(0, 50).replace(/\n/g, '')}...`);
        }
        console.log('All tables created or already exist.');

        // --- STEP 5: Insert Sample Data ---
        console.log('\nStep 5: Inserting sample data...');

        // Sample Data Definitions
        const companies = [
            { name: 'Global Solutions Ltd.', email: 'contact@globalsolutions.com', phone: '123-456-7890', address: '123 Tech Park, London, UK', website: 'globalsolutions.com', industry: 'IT Services', description: 'Leading provider of IT solutions.' },
            { name: 'Tech Innovators Inc.', email: 'info@techinnovators.com', phone: '098-765-4321', address: '456 Innovation Drive, Berlin, Germany', website: 'techinnovators.com', industry: 'Software Development', description: 'Pioneering new software technologies.' },
            { name: 'Creative Minds Studio', email: 'hello@creativeminds.com', phone: '555-111-2222', address: '789 Art Lane, Paris, France', website: 'creativeminds.com', industry: 'Digital Marketing', description: 'Crafting compelling digital experiences.' }
        ];

        const students = [
            { name: 'Alice Smith', email: 'alice.s@example.com', password: 'password123', phone: '111-222-3333', major: 'Computer Science', university: 'Tech University', gpa: 3.8, skills: 'JavaScript, React, Node.js, Databases' },
            { name: 'Bob Johnson', email: 'bob.j@example.com', password: 'securepass', phone: '444-555-6666', major: 'Data Science', university: 'Stats College', gpa: 3.5, skills: 'Python, R, Machine Learning, SQL' },
            { name: 'Carol White', email: 'carol.w@example.com', password: 'mysecret', phone: '777-888-9999', major: 'Graphic Design', university: 'Art Institute', gpa: 3.9, skills: 'Adobe Photoshop, Illustrator, UI/UX Design' }
        ];

        // --- Insert Companies ---
        console.log('--- Inserting Companies ---');
        for (const company of companies) {
            const [result] = await connection.execute(
                `INSERT INTO companies (name, email, phone, address, website, industry, description, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [company.name, company.email, company.phone, company.address, company.website, company.industry, company.description]
            );
            company.id = result.insertId; // Store inserted ID for FKs
            console.log(`  Inserted company: ${company.name} (ID: ${company.id})`);
        }

        // --- Insert Students ---
        console.log('--- Inserting Students ---');
        for (const student of students) {
            const [result] = await connection.execute(
                `INSERT INTO students (name, email, password, phone, major, university, gpa, skills, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [student.name, student.email, student.password, student.phone, student.major, student.university, student.gpa, student.skills] // Using plain password
            );
            student.id = result.insertId; // Store inserted ID for FKs
            console.log(`  Inserted student: ${student.name} (ID: ${student.id})`);
        }

        // --- Insert Company Users (depends on Companies) ---
        console.log('--- Inserting Company Users ---');
        const companyUsers = [
            { company_id: companies[0].id, email: 'admin@globalsolutions.com', password: 'adminpassword' },
            { company_id: companies[1].id, email: 'admin@techinnovators.com', password: 'adminpassword' },
            { company_id: companies[2].id, email: 'admin@creativeminds.com', password: 'adminpassword' }
        ];

        for (const user of companyUsers) {
            const [result] = await connection.execute(
                `INSERT INTO company_users (company_id, email, password, created_at, updated_at)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [user.company_id, user.email, user.password] // Using plain password
            );
            user.id = result.insertId;
            console.log(`  Inserted company user: ${user.email} (ID: ${user.id})`);
        }

        // --- Insert Internships (depends on Companies) ---
        console.log('--- Inserting Internships ---');
        const internships = [
            {
                company_id: companies[0].id, company_name: companies[0].name, title: 'Marketing Intern',
                description: 'Assist with digital marketing campaigns, social media management, and content creation.',
                location: 'London, UK', stipend: 2000.00, duration: '4 months', start_date: '2025-08-01',
                required_skills: 'Marketing, Social Media, Content Creation, SEO', status: 'Active', posted_date: '2025-06-01'
            },
            {
                company_id: companies[1].id, company_name: companies[1].name, title: 'Data Science Intern',
                description: 'Work on data analysis projects, machine learning model development, and data visualization.',
                location: 'Remote', stipend: 2500.00, duration: '6 months', start_date: '2025-09-01',
                required_skills: 'Python, R, SQL, Machine Learning, Data Visualization', status: 'Active', posted_date: '2025-06-05'
            },
            {
                company_id: companies[2].id, company_name: companies[2].name, title: 'Graphic Design Intern',
                description: 'Design visual content for web and print, including logos, banners, and marketing materials.',
                location: 'Paris, France', stipend: 1800.00, duration: '3 months', start_date: '2025-07-15',
                required_skills: 'Adobe Photoshop, Illustrator, UI/UX Design, Typography', status: 'Active', posted_date: '2025-06-10'
            },
            {
                company_id: companies[0].id, company_name: companies[0].name, title: 'Software Development Intern',
                description: 'Develop and maintain web applications using modern JavaScript frameworks.',
                location: 'New York, USA', stipend: 2200.00, duration: '5 months', start_date: '2025-09-01',
                required_skills: 'JavaScript, Node.js, React, MongoDB', status: 'Active', posted_date: '2025-06-15'
            }
        ];

        for (const internship of internships) {
            const [result] = await connection.execute(
                `INSERT INTO internships (company_id, company_name, title, description, location, stipend, duration, start_date, required_skills, status, posted_date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    internship.company_id, internship.company_name, internship.title, internship.description,
                    internship.location, internship.stipend, internship.duration, internship.start_date,
                    internship.required_skills, internship.status, internship.posted_date
                ]
            );
            internship.id = result.insertId; // Store inserted ID for FKs
            console.log(`  Inserted internship: ${internship.title} (ID: ${internship.id})`);
        }

        // --- Insert Applications (depends on Internships and Students) ---
        console.log('--- Inserting Applications ---');
        const applications = [
            {
                internship_id: internships[0].id, student_id: students[0].id, submitted_on: '2025-06-05', status: 'Pending',
                student_name: students[0].name, student_email: students[0].email, student_phone: students[0].phone,
                student_gpa: students[0].gpa, student_skills: students[0].skills
            },
            {
                internship_id: internships[1].id, student_id: students[1].id, submitted_on: '2025-06-06', status: 'Pending',
                student_name: students[1].name, student_email: students[1].email, student_phone: students[1].phone,
                student_gpa: students[1].gpa, student_skills: students[1].skills
            },
            {
                internship_id: internships[2].id, student_id: students[2].id, submitted_on: '2025-06-12', status: 'Pending',
                student_name: students[2].name, student_email: students[2].email, student_phone: students[2].phone,
                student_gpa: students[2].gpa, student_skills: students[2].skills
            },
            // Alice also applies to Data Science
            {
                internship_id: internships[1].id, student_id: students[0].id, submitted_on: '2025-06-07', status: 'Pending',
                student_name: students[0].name, student_email: students[0].email, student_phone: students[0].phone,
                student_gpa: students[0].gpa, student_skills: students[0].skills
            }
        ];

        for (const app of applications) {
            const [result] = await connection.execute(
                `INSERT INTO applications (internship_id, student_id, submitted_on, status, resume_path, cover_letter_path,
                                        student_name, student_email, student_phone, student_gpa, student_skills,
                                        created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [
                    app.internship_id, app.student_id, app.submitted_on, app.status,
                    app.resume_path || null, app.cover_letter_path || null, // Handle optional paths
                    app.student_name, app.student_email, app.student_phone, app.student_gpa, app.student_skills
                ]
            );
            console.log(`  Inserted application for Internship ID ${app.internship_id} by Student ID ${app.student_id} (ID: ${result.insertId})`);
        }

        console.log('\nDatabase setup and seeding complete!');

    } catch (error) {
        console.error('An error occurred during database setup:', error);
        // In a real application, you might want more sophisticated error handling
        // like rolling back transactions if multiple inserts fail.
    } finally {
        // --- Close the final connection ---
        if (connection) {
            await connection.end();
            console.log('Final MySQL connection closed.');
        }
    }
}

// Call the main function to start the setup process
setupDatabase();