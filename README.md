# SkillBridge - Internship Platform

SkillBridge is a full-stack **Node.js** web application designed to connect students with internship opportunities. It features dual portals for candidates to manage applications and for employers to post and track opportunities.

## Features

  - **Student Portal**: Create profiles, browse listings, and track application status.
  - **Employer Portal**: Post new internships, manage company profiles, and review student applications.
  - **Custom HTTP Server**: Built using pure Node.js for efficient request handling.
  - **Database Management**: Integrated MySQL storage for persistent data.

## Tech Stack

  - **Backend**: Node.js
  - **Database**: MySQL
  - **Frontend**: HTML5, CSS3, Vanilla JavaScript
  - **Utilities**:
      - `dotenv`: Environment variable management.
      - `formidable`: Multipart form data and file upload parsing.
      - `mysql2`: Promise-based MySQL client.
      - `nodemon`: Development tool for automatic server restarts.



## Getting Started

### Prerequisites

  - Node.js (v10 or higher recommended)
  - MySQL Server

### Installation

1.  **Navigate to the server directory**:
    
    ``` bash
    cd project-root/server
    
    ```

2.  **Install dependencies**:
    
    ``` bash
    npm install
    
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the `server` directory and add your MySQL credentials:
    
    ``` text
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    PORT=8080
    
    ```

4.  **Initialize the Database**:
    Ensure MySQL is running, then execute the setup script:
    
    ``` bash
    node setup_database.js
    
    ```

### Running the App

  - **Production Mode**:
    ``` bash
    npm start
    
    ```
  - **Development Mode** (with auto-reload):
    ``` bash
    npm run dev
    
    ```
    Visit <http://localhost:8080> to view the platform.

## License

This project is licensed under the **MIT License**.
