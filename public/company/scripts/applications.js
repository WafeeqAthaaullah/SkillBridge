// public/scripts/applications.js

document.addEventListener('DOMContentLoaded', async function() {
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const internshipSelect = document.getElementById('internshipSelect');
    const applicationStatusFilter = document.getElementById('applicationStatusFilter');
    const studentNameFilter = document.getElementById('studentNameFilter'); // <--- NEW: Reference the student name filter input
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const applicationsTableBody = document.getElementById('applicationsTableBody');
    const currentInternshipTitle = document.getElementById('currentInternshipTitle');

    const applicationDetailSection = document.getElementById('applicationDetailSection');
    const saveStatusBtn = document.getElementById('saveStatusBtn');
    const updateStatusSelect = document.getElementById('updateStatusSelect');
    const detailCurrentStatus = document.getElementById('detailCurrentStatus');

    // Detail elements for population
    const detailAppId = document.getElementById('detailAppId');
    const detailInternshipTitle = document.getElementById('detailInternshipTitle');
    const detailStudentName = document.getElementById('detailStudentName');
    const detailStudentEmail = document.getElementById('detailStudentEmail');
    const detailStudentPhone = document.getElementById('detailStudentPhone');
    const detailStudentGPA = document.getElementById('detailStudentGPA');
    const detailStudentSkills = document.getElementById('detailStudentSkills');
    const detailSubmittedOn = document.getElementById('detailSubmittedOn');
    const detailResumeLink = document.getElementById('detailResumeLink');
    const detailCoverLetterLink = document.getElementById('detailCoverLetterLink');


    let companyId = null;
    let internships = []; // To store internships fetched for the dropdown
    // applications array is no longer needed for client-side filtering after fetching
    // as filtering will now be done on the server.

    // --- Initialization: Get Company Info and Load Data ---
    async function initializePage() {
        const storedCompanyId = localStorage.getItem('companyId');
        const storedCompanyName = localStorage.getItem('companyName');

        if (!storedCompanyId) {
            alert('You are not logged in as a company. Redirecting to login page.');
            window.location.href = 'company_login.html';
            return;
        }

        companyId = storedCompanyId;
        companyNameDisplay.textContent = storedCompanyName || 'Company Name';

        await populateInternshipFilter(); // Call this to populate dropdown
        await fetchAndRenderApplications(); // Initial load of applications
        applicationDetailSection.style.display = 'none';
    }

    // --- Fetch and Populate Internship Filter Dropdown ---
    async function populateInternshipFilter() {
        try {
            // MODIFIED: Change to use query parameter for companyId
            const response = await fetch(`http://localhost:8080/api/company/internships?companyId=${companyId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch company internships for filter.');
            }
            const data = await response.json();
            internships = data.internships || [];

            internshipSelect.innerHTML = '<option value="">-- All Internships --</option>';
            internships.forEach(internship => {
                const option = document.createElement('option');
                option.value = internship.id;
                option.textContent = internship.title;
                internshipSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating internship filter:', error);
            alert('Could not load internships for filtering: ' + error.message);
        }
    }

    // --- Fetch and Render Applications ---
    // MODIFIED: Added studentNameFilter parameter
    async function fetchAndRenderApplications(internshipId = null, statusFilter = null, studentName = null) {
        applicationsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Loading applications...</td></tr>';
        currentInternshipTitle.textContent = 'All Internships'; // Reset title initially

        const params = new URLSearchParams();
        if (companyId) { // Ensure companyId is always present
            params.append('companyId', companyId);
        }

        if (internshipId) {
            params.append('internshipId', internshipId);
            const selectedInternship = internships.find(i => i.id == internshipId);
            if (selectedInternship) {
                currentInternshipTitle.textContent = selectedInternship.title;
            }
        } else {
            currentInternshipTitle.textContent = 'All Internships';
        }

        if (statusFilter) {
            params.append('status', statusFilter);
        }

        if (studentName) { // <--- NEW: Add studentName to URL parameters
            params.append('studentName', studentName.trim());
        }

        const url = `http://localhost:8080/api/company/applications?${params.toString()}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch applications.');
            }
            const applications = await response.json(); // Now, `applications` holds the already filtered data from server

            applicationsTableBody.innerHTML = ''; // Clear existing
            if (applications.length === 0) {
                applicationsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No applications found matching your criteria.</td></tr>';
                return;
            }

            applications.forEach(app => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${app.application_id}</td>
                    <td>${app.student_name || 'N/A'}</td>
                    <td>${app.internship_title || 'N/A'}</td>
                    <td>${new Date(app.submitted_on).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${app.status.toLowerCase().replace(/\s/g, '-') || 'pending'}">${app.status || 'Pending'}</span></td>
                    <td>
                        <button class="btn-sm btn-view-details" data-app-id="${app.application_id}"><i class="fas fa-eye"></i> View</button>
                    </td>
                `;
                applicationsTableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Error fetching applications:', error);
            applicationsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading applications: ' + error.message + '</td></tr>';
        }
        applicationDetailSection.style.display = 'none'; // Always hide the detail section after fetching/rendering new applications
    }

    // --- Filter Event Listeners ---
    applyFiltersBtn.addEventListener('click', function() {
        const selectedInternshipId = internshipSelect.value;
        const selectedStatus = applicationStatusFilter.value;
        const studentName = studentNameFilter.value; // <--- NEW: Get student name filter value
        // MODIFIED: Pass studentName to fetchAndRenderApplications
        fetchAndRenderApplications(selectedInternshipId, selectedStatus, studentName);
    });

    resetFiltersBtn.addEventListener('click', function() {
        internshipSelect.value = '';
        applicationStatusFilter.value = '';
        studentNameFilter.value = ''; // <--- NEW: Clear student name filter input
        fetchAndRenderApplications(); // Fetch all applications again
    });

    // --- Application Details Section Logic ---
    applicationsTableBody.addEventListener('click', async function(event) {
        const viewButton = event.target.closest('.btn-view-details');
        if (viewButton) {
            const appId = viewButton.getAttribute('data-app-id');
            await showApplicationDetails(appId);
        }
    });

    async function showApplicationDetails(appId) {
        try {
            // Fetch application details
            const appResponse = await fetch(`http://localhost:8080/api/applications/${appId}`);
            if (!appResponse.ok) {
                const errorData = await appResponse.json();
                throw new Error(errorData.message || 'Failed to fetch application details.');
            }
            const application = await appResponse.json();

            // Fetch student details
            const studentResponse = await fetch(`http://localhost:8080/api/students/${application.student_id}`);
            if (!studentResponse.ok) {
                const errorData = await studentResponse.json();
                throw new Error(errorData.message || 'Failed to fetch student details.');
            }
            const student = await studentResponse.json();

            // Populate detail section with data
            detailAppId.textContent = application.id; // Changed to application.id as per backend application detail fetch
            detailInternshipTitle.textContent = application.internship_title || 'N/A';
            detailStudentName.textContent = student.name || 'N/A';
            detailStudentEmail.textContent = student.email || 'N/A';
            detailStudentPhone.textContent = student.phone || 'N/A';
            detailStudentGPA.textContent = student.gpa || 'N/A';
            detailStudentSkills.textContent = student.skills || 'N/A';
            detailSubmittedOn.textContent = new Date(application.submitted_on).toLocaleDateString();

            const resumeLink = detailResumeLink;
            if (student.resume_url) {
                resumeLink.href = `http://localhost:8080${student.resume_url}`; // Ensure base URL for static files
                resumeLink.style.display = 'inline';
            } else {
                resumeLink.style.display = 'none'; // Hide if no resume
            }

            const coverLetterLink = detailCoverLetterLink;
            if (student.cover_letter_url) {
                coverLetterLink.href = `http://localhost:8080${student.cover_letter_url}`; // Ensure base URL for static files
                coverLetterLink.style.display = 'inline';
            } else {
                coverLetterLink.style.display = 'none'; // Hide if no cover letter
            }

            detailCurrentStatus.textContent = application.status;
            detailCurrentStatus.className = `status-badge status-${application.status.toLowerCase().replace(/\s/g, '-')}`;
            updateStatusSelect.value = application.status; // Set dropdown to current status

            saveStatusBtn.setAttribute('data-app-id', appId); // Store current application ID

            // Show the detail section
            applicationDetailSection.style.display = 'block';

            // Optional: Scroll to the detail section for better UX
            applicationDetailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Error showing application details:', error);
            alert('Could not load application details: ' + error.message);
        }
    }

    // --- Save Status Button Handler ---
    saveStatusBtn.addEventListener('click', async function() {
        const appId = saveStatusBtn.getAttribute('data-app-id');
        const newStatus = updateStatusSelect.value;

        if (!appId || !newStatus) {
            alert('Error: Application ID or new status missing.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || 'Application status updated successfully!');
                // Re-fetch and render applications with current filters to update the table
                const selectedInternshipId = internshipSelect.value;
                const selectedStatus = applicationStatusFilter.value;
                const studentName = studentNameFilter.value;
                await fetchAndRenderApplications(selectedInternshipId, selectedStatus, studentName); // <--- MODIFIED: Pass all current filters
                applicationDetailSection.style.display = 'none'; // Hide the detail section after saving
            } else {
                alert(`Error updating status: ${result.message || 'Something went wrong.'}`);
                console.error('API Error:', result.message);
            }
        } catch (error) {
            console.error('Network or unexpected error updating status:', error);
            alert('An error occurred while updating status. Please try again.');
        }
    });

    // Initial page load
    initializePage();
});