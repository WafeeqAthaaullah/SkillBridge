document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const applicationsContainer = document.getElementById('applicationsContainer');
    const noApplicationsMessage = document.getElementById('noApplicationsMessage');

    // Helper function to get student ID (e.g., from localStorage after login)
    function getStudentId() {
        // This should be consistent with how you get the studentId in internship_apply.js
        return localStorage.getItem('studentId'); // Example: '1'
    }

    // --- API Fetch Helper (reused from internship_apply.js) ---
    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Unknown error'}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            throw error; // Re-throw to be caught by the calling function
        }
    }

    // --- Function to Render Applications ---
    function renderApplications(applications) {
        applicationsContainer.innerHTML = ''; // Clear existing content

        if (!applications || applications.length === 0) {
            noApplicationsMessage.style.display = 'block';
            return;
        } else {
            noApplicationsMessage.style.display = 'none';
        }

        applications.forEach(app => {
            const card = document.createElement('div');
            card.classList.add('application-card');

            // Determine status class for styling
            let statusClass = '';
            switch (app.status) {
                case 'Pending':
                    statusClass = 'status-pending';
                    break;
                case 'Reviewed':
                    statusClass = 'status-reviewed';
                    break;
                case 'Interview Scheduled':
                    statusClass = 'status-interview-scheduled';
                    break;
                case 'Accepted':
                    statusClass = 'status-accepted';
                    break;
                case 'Rejected':
                    statusClass = 'status-rejected';
                    break;
                default:
                    statusClass = ''; // No specific style
            }

            // Ensure dates are formatted nicely
            const applicationDate = app.submitted_on ? new Date(app.submitted_on).toLocaleDateString() : 'N/A';

            card.innerHTML = `
                <div class="application-info">
                    <h4>${app.internship_title || 'N/A'}</h4>
                    <p><i class="fas fa-building"></i> ${app.company_name || 'N/A'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${app.internship_location || 'N/A'}</p>
                    <p><i class="fas fa-calendar-alt"></i> Applied on: ${applicationDate}</p>
                </div>
                <span class="application-status-badge ${statusClass}">${app.status || 'N/A'}</span>
                <div class="application-actions">
                    <a href="internship_detail.html?id=${app.internship_id}" class="btn-secondary"><i class="fas fa-eye"></i> View Internship</a>
                </div>
            `;
            applicationsContainer.appendChild(card);
        });
    }

    // --- Fetch and Render Student's Applications ---
    async function loadApplicationsPage() {
        const studentId = getStudentId();

        if (!studentId) {
            alert('Student not logged in or ID not found. Please log in.');
            window.location.href = 'login.html'; // Redirect to login
            return;
        }

        try {
            // Fetch Student Profile for header display
            const studentProfile = await fetchData(`/api/students/${studentId}`);
            studentNameDisplay.textContent = studentProfile.name || 'Student';

            // Fetch Student's Applications
            // This assumes you will create an API endpoint like /api/students/:studentId/applications
            const studentApplications = await fetchData(`/api/students/${studentId}/applications`);
            
            renderApplications(studentApplications);

        } catch (error) {
            console.error('Failed to load student applications:', error);
            alert('Failed to load your applications. Please try again later.');
            noApplicationsMessage.style.display = 'block'; // Show "no applications" or an error message
        }
    }

    // Initialize the page on load
    loadApplicationsPage();
});