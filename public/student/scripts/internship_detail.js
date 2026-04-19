// project-root/public/scripts/internship_detail.js

document.addEventListener('DOMContentLoaded', async function() {
    // Get elements
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const internshipDetailContainer = document.getElementById('internshipDetailContainer');
    const applyNowBtn = document.getElementById('applyNowBtn');

    // Retrieve studentId from localStorage, similar to other student pages
    const studentId = localStorage.getItem('studentId'); 

    // Helper function to fetch data from your API (copied from student_dashboard.js / internships.js)
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // If response is not ok (e.g., 404, 500), try to read error message from body
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            // In a real application, you might display a user-friendly error message on the UI
            return null; 
        }
    }

    // --- Fetch Student Profile Data for Header ---
    async function fetchStudentProfileForHeader() {
        if (studentId) {
            const studentProfile = await fetchData(`/api/students/${studentId}`);
            if (studentProfile) {
                studentNameDisplay.textContent = studentProfile.name || 'Student';
            } else {
                console.error('Failed to load student profile data for header.');
                studentNameDisplay.textContent = 'Student (Error)';
            }
        } else {
            studentNameDisplay.textContent = 'Student (Not Logged In)';
            // Consider redirecting or showing a message if user must be logged in to view details
        }
    }
    
    // Call this immediately to update the header
    fetchStudentProfileForHeader();

    // --- Get Internship ID from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const internshipId = parseInt(urlParams.get('id'));

    if (isNaN(internshipId)) {
        internshipDetailContainer.innerHTML = '<p class="error-message">Error: Internship ID not found in URL.</p>';
        applyNowBtn.style.display = 'none';
        return;
    }

    // --- Fetch Internship Data from API ---
    const internship = await fetchData(`/api/internships/${internshipId}`);

    // --- Render Internship Details ---
    function renderInternshipDetails(internshipData) {
        if (!internshipData) {
            internshipDetailContainer.innerHTML = '<p class="error-message">Internship not found or failed to load.</p>';
            applyNowBtn.style.display = 'none';
            return;
        }

        internshipDetailContainer.innerHTML = `
            <h2 class="internship-title">${internshipData.title}</h2>
            <h3 class="company-name"><i class="fas fa-building"></i> ${internshipData.companyName}</h3>

            <div class="detail-grid">
                <p class="detail-item"><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${internshipData.location}</p>
                <p class="detail-item"><i class="fas fa-money-bill-wave"></i> <strong>Stipend:</strong> $${internshipData.stipend || 'N/A'}/month</p>
                <p class="detail-item"><i class="fas fa-clock"></i> <strong>Duration:</strong> ${internshipData.duration}</p>
                <p class="detail-item"><i class="fas fa-calendar-alt"></i> <strong>Start Date:</strong> ${internshipData.start_date || 'N/A'}</p>
                <p class="detail-item"><i class="fas fa-calendar-check"></i> <strong>Posted On:</strong> ${internshipData.posted_date || 'N/A'}</p>
            </div>

            <h4 class="detail-section-subtitle">Internship Description</h4>
            <div class="internship-description">
                <p>${internshipData.description}</p>
            </div>

            <h4 class="detail-section-subtitle">Required Skills</h4>
            <div class="skills-list">
                ${Array.isArray(internshipData.requiredSkills) ? internshipData.requiredSkills.map(skill => `<span class="skill-badge">${skill}</span>`).join('') : '<p>No specific skills listed.</p>'}
            </div>
        `;
        applyNowBtn.style.display = 'inline-flex'; // Show the apply button
    }

    // --- Handle Apply Now Button Click ---
    applyNowBtn.addEventListener('click', function() {
        if (internshipId) {
            // Pass internshipId to the application page
            window.location.href = `internship_apply.html?internshipId=${internshipId}`;
        } else {
            alert("Could not find internship ID to proceed with application.");
        }
    });

    // Initial render of internship details after fetching
    renderInternshipDetails(internship);
});