document.addEventListener('DOMContentLoaded', async function() {
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const welcomeCompanyName = document.getElementById('welcomeCompanyName');
    const totalInternshipsElement = document.getElementById('totalInternships');
    const totalApplicationsElement = document.getElementById('totalApplications');
    const pendingApplicationsElement = document.getElementById('pendingApplications');
    const reviewedApplicationsElement = document.getElementById('reviewedApplications');
    const recentApplicationsList = document.getElementById('recentApplicationsList');
    const noRecentApps = document.getElementById('noRecentApps');
    const logoutButton = document.getElementById('logoutButton');
    const companyLogoDisplay = document.getElementById('companyLogoDisplay');

    // --- Logout Functionality ---
    logoutButton.addEventListener('click', async function(event) {
        event.preventDefault();
        try {
            // Send logout request to backend (this will clear the server-side session cookie)
            const response = await fetch('http://localhost:8080/api/auth/company/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                // Clear companyId from localStorage
                localStorage.removeItem('companyId');
                localStorage.removeItem('companyProfile'); // Clear cached profile

                window.location.href = 'company/login.html'; // Redirect to login page
            } else {
                alert(`Logout failed: ${data.message || 'Please try again.'}`);
                console.error('Logout error:', data.message);
            }
        } catch (error) {
            console.error('Network error during logout:', error);
            alert('An error occurred during logout. Please try again.');
        }
    });


    // Function to fetch and display dashboard data
    async function loadDashboardData() {
        const companyId = localStorage.getItem('companyId'); // Get companyId from localStorage

        if (!companyId) {
            alert('You are not logged in. Redirecting to login page.');
            window.location.href = 'company/login.html';
            return;
        }

        try {
            // 1. Fetch Company Profile
            // Pass companyId as a query parameter
            const profileResponse = await fetch(`http://localhost:8080/api/company/profile?companyId=${companyId}`);
            const companyProfile = await profileResponse.json();

            if (profileResponse.ok) {
                companyNameDisplay.textContent = companyProfile.name || 'Company';
                welcomeCompanyName.textContent = companyProfile.name || 'Company';
                if (companyProfile.logoUrl) {
                    companyLogoDisplay.src = companyProfile.logoUrl;
                    companyLogoDisplay.alt = companyProfile.name + ' Logo';
                }
            } else {
                console.error('Failed to fetch company profile:', companyProfile.message);
                companyNameDisplay.textContent = 'Error';
                welcomeCompanyName.textContent = 'Error';
                alert(`Failed to load company profile: ${companyProfile.message || 'Please log in again.'}`);
                return;
            }

            // 2. Fetch Internships for this company
            // Pass companyId as a query parameter
            const internshipsResponse = await fetch(`http://localhost:8080/api/company/internships?companyId=${companyId}`);
            const allInternships = await internshipsResponse.json();

            if (!internshipsResponse.ok) {
                console.error('Failed to fetch internships:', allInternships.message);
                alert(`Failed to load internships: ${allInternships.message}`);
                return;
            }

            // 3. Fetch Applications for this company's internships
            // Pass companyId as a query parameter
            const applicationsResponse = await fetch(`http://localhost:8080/api/company/applications?companyId=${companyId}`);
            const allApplications = await applicationsResponse.json();

            if (!applicationsResponse.ok) {
                console.error('Failed to fetch applications:', allApplications.message);
                alert(`Failed to load applications: ${allApplications.message}`);
                return;
            }

            // --- Update Dashboard Stats ---
            totalInternshipsElement.textContent = allInternships.internships ? allInternships.internships.length : 0;
            totalApplicationsElement.textContent = allApplications.length;

            const pendingApps = allApplications.filter(app => app.status === 'Pending').length;
            pendingApplicationsElement.textContent = pendingApps;

            const reviewedApps = allApplications.filter(app =>
                app.status === 'Reviewed' ||
                app.status === 'Interview Scheduled' ||
                app.status === 'Accepted' ||
                app.status === 'Rejected'
            ).length;
            reviewedApplicationsElement.textContent = reviewedApps;

            // --- Display Recent Applications ---
            recentApplicationsList.innerHTML = ''; // Clear existing list
            const sortedApplications = [...allApplications].sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn));
            const recentApps = sortedApplications.slice(0, 5); // Show top 5 recent

            if (recentApps.length > 0) {
    noRecentApps.style.display = 'none';
    recentApps.forEach(app => {
        const listItem = document.createElement('li');
        listItem.classList.add('activity-item');
        // Corrected property names for student name, internship title, and submitted date
        // Also, corrected the status display within the span
        const statusClass = (app.status || '').toLowerCase().replace(' ', '-');
        const formattedDate = app.submitted_on ? new Date(app.submitted_on).toLocaleDateString() : 'N/A';

        listItem.innerHTML = `
            <div class="details">
                <div class="title">${app.student_name || 'N/A'} applied for ${app.internship_title || 'Unknown Internship'}</div>
                <div class="info">Submitted on: ${formattedDate}</div>
            </div>
            <div class="status ${statusClass}">${app.status || 'N/A'}</div>
        `;
        recentApplicationsList.appendChild(listItem);
    });
}

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            alert('Failed to load dashboard data. Please try refreshing or logging in again.');
        }
    }

    // Load dashboard data when the page loads
    loadDashboardData();
});