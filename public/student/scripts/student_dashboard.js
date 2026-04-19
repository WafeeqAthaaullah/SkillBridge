// project-root/public/scripts/student_dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // Retrieve studentId saved during successful login (from loginpage.js)
    const studentId = localStorage.getItem('studentId');

    if (!studentId) {
        console.error('Student ID not found in localStorage. Redirecting to login.');
        // Redirect to login page if no student ID is found
        window.location.href = '/login';
        return;
    }

    // Helper function to fetch data from your API
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
            // In a real application, you might display a user-friendly error message on the dashboard UI
            return null;
        }
    }

    // --- Fetch Student Profile Data ---
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const welcomeStudentName = document.getElementById('welcomeStudentName');

    const studentProfile = await fetchData(`/api/students/${studentId}`);
    if (studentProfile) {
        studentNameDisplay.textContent = studentProfile.name || 'Student Name';
        welcomeStudentName.textContent = studentProfile.name || 'Student';
    } else {
        // Fallback for UI if data fetch fails
        studentNameDisplay.textContent = 'Error Loading Name';
        welcomeStudentName.textContent = 'Error';
    }

    // --- Fetch Student's Applications ---
    const appliedInternshipsCount = document.getElementById('appliedInternshipsCount');
    const acceptedOffersCount = document.getElementById('acceptedOffersCount');
    const recentApplicationsTableBody = document.getElementById('recentApplicationsTableBody');

    // CORRECTED URL: Changed /api/student/applications/ to /api/students/
    const studentApplications = await fetchData(`/api/students/${studentId}/applications`);

    if (studentApplications) {
        const appliedCount = studentApplications.length;
        const acceptedCount = studentApplications.filter(app => app.status === 'Accepted').length;

        appliedInternshipsCount.textContent = appliedCount;
        acceptedOffersCount.textContent = acceptedCount;

        recentApplicationsTableBody.innerHTML = ''; // Clear existing dummy data

        if (studentApplications.length > 0) {
            // Sort by submitted_on date in descending order to show most recent first
            const sortedApplications = studentApplications.sort((a, b) => new Date(b.submitted_on) - new Date(a.submitted_on));
            const recentFive = sortedApplications.slice(0, 5); // Display only the top 5 recent applications

            recentFive.forEach(app => {
                // CORRECTED: Using app.submitted_on
                const formattedDate = app.submitted_on ? new Date(app.submitted_on).toLocaleDateString() : 'N/A';

                const row = `
                    <tr>
                        <td>${app.internship_title || 'N/A'}</td>
                        <td>${app.company_name || 'N/A'}</td>
                        <td>${formattedDate}</td>
                        <td><span class="status-badge status-${(app.status || '').toLowerCase().replace(/\s/g, '-')}">${app.status || 'N/A'}</span></td>
                        <td><a href="internship_detail.html?id=${app.internship_id}" class="btn-small btn-outline">View Details</a></td>
                    </tr>
                `;
                recentApplicationsTableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            recentApplicationsTableBody.innerHTML = '<tr><td colspan="5" class="no-data">No recent applications found.</td></tr>';
        }
    } else {
        // Fallback for UI if data fetch fails
        appliedInternshipsCount.textContent = 'N/A';
        acceptedOffersCount.textContent = 'N/A';
        recentApplicationsTableBody.innerHTML = '<tr><td colspan="5" class="no-data">Error loading applications.</td></tr>';
    }

    // --- Fetch All Active Internships (for Available and Recommended) ---
    const availableInternshipsCount = document.getElementById('availableInternshipsCount');
    const recommendedInternshipsContainer = document.getElementById('recommendedInternshipsContainer');

    const allInternships = await fetchData('/api/internships'); // This endpoint should return ALL internships
    if (allInternships) {
        // Assuming your backend /api/internships returns a 'status' property
        const activeInternships = allInternships.filter(internship => internship.status === 'Active');
        availableInternshipsCount.textContent = activeInternships.length;

        // Populate Recommended Internships (for now, simply show the first 3 active ones)
        recommendedInternshipsContainer.innerHTML = ''; // Clear existing dummy data

        if (activeInternships.length > 0) {
            const recommendedThree = activeInternships.slice(0, 3); // Take the first 3 active internships

            recommendedThree.forEach(internship => {
                // Ensure company_name and required_skills are coming from API as expected
                // If required_skills is a comma-separated string, split it
                const skillsHtml = (internship.required_skills || '').split(',').map(skill => `<span>${skill.trim()}</span>`).join('');

                const card = `
                    <div class="internship-card">
                        <h4>${internship.title || 'N/A'}</h4>
                        <p class="company-name">${internship.company_name || 'N/A'}</p>
                        <p class="location"><i class="fas fa-map-marker-alt"></i> ${internship.location || 'N/A'}</p>
                        <p class="stipend"><i class="fas fa-dollar-sign"></i> ${internship.stipend ? `$${internship.stipend}/month` : 'Unpaid'}</p>
                        <p class="duration"><i class="fas fa-clock"></i> ${internship.duration || 'N/A'}</p>
                        <div class="skills">
                            ${skillsHtml}
                        </div>
                        <a href="internship_detail.html?id=${internship.id}" class="btn-primary-small">View Details</a>
                    </div>
                `;
                recommendedInternshipsContainer.insertAdjacentHTML('beforeend', card);
            });
        } else {
            recommendedInternshipsContainer.innerHTML = '<p class="no-data">No recommendations yet. Update your profile or browse internships!</p>';
        }
    } else {
        // Fallback for UI if data fetch fails
        availableInternshipsCount.textContent = 'N/A';
        recommendedInternshipsContainer.innerHTML = '<p class="no-data">Error loading internships.</p>';
    }
});