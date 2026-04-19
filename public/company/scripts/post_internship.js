// public/scripts/post_internship.js

document.addEventListener('DOMContentLoaded', async function() {
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const postInternshipForm = document.getElementById('postInternshipForm');
    const internshipTitleInput = document.getElementById('internshipTitle');
    const internshipLocationInput = document.getElementById('internshipLocation');
    const internshipDurationInput = document.getElementById('internshipDuration');
    const internshipStipendInput = document.getElementById('internshipStipend');
    const internshipDescriptionInput = document.getElementById('internshipDescription');
    const internshipRequirementsInput = document.getElementById('internshipRequirements');
    const internshipStartDateInput = document.getElementById('internshipStartDate'); // Keep this line for the new date field
    const submitButton = postInternshipForm.querySelector('button[type="submit"]');
    const formTitle = document.querySelector('.dashboard-header-title');
    const sectionTitle = document.querySelector('.dashboard-section-title');

    // --- CRUCIAL FIX: Declare these variables at the top of the scope ---
    let editingInternshipId = null; // Variable to store the ID if we are editing
    const urlParams = new URLSearchParams(window.location.search);
    const internshipToEditId = urlParams.get('id'); // This variable must be declared here
    // --- END CRUCIAL FIX ---


    // --- Retrieve Company ID and Name from localStorage ---
    const companyId = localStorage.getItem('companyId');
    const companyName = localStorage.getItem('companyName');

    if (!companyId) {
        alert('You are not logged in as a company. Redirecting to login page.');
        window.location.href = 'company/login.html'; // Adjust if your login path is different
        return;
    }

    companyNameDisplay.textContent = companyName || 'Company';

    // --- Check for Internship ID in URL for Edit Mode (Now safely after declaration) ---
    if (internshipToEditId) {
        editingInternshipId = internshipToEditId;
        formTitle.textContent = 'Edit Internship'; // Change header title
        sectionTitle.textContent = 'Edit Your Opportunity'; // Change section title
        submitButton.innerHTML = '<i class="fas fa-save"></i> Update Internship'; // Change button text
        await loadInternshipForEdit(editingInternshipId); // This call is now safe
    } else {
        // We are in 'Post New Internship' mode
        formTitle.textContent = 'Post New Internship';
        sectionTitle.textContent = 'Share Your Opportunity';
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Post Internship';
    }


    // --- Function to Load Internship Data for Editing ---
    async function loadInternshipForEdit(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/internships/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch internship details.');
            }
            const internship = await response.json();

            // Populate the form fields
            internshipTitleInput.value = internship.title || '';
            internshipLocationInput.value = internship.location || '';
            internshipDurationInput.value = internship.duration || '';
            internshipStipendInput.value = internship.stipend || '';
            internshipDescriptionInput.value = internship.description || '';
            internshipRequirementsInput.value = internship.required_skills || '';
            // Ensure start_date is handled
            internshipStartDateInput.value = internship.start_date ? internship.start_date.split('T')[0] : '';

        } catch (error) {
            console.error('Error loading internship for edit:', error);
            alert('Could not load internship details for editing: ' + error.message);
            window.location.href = 'manage_internships.html';
        }
    }


    // --- Handle Form Submission (Post or Update) ---
    postInternshipForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const internshipData = {
            title: internshipTitleInput.value.trim(),
            company_id: companyId,
            location: internshipLocationInput.value.trim(),
            duration: internshipDurationInput.value.trim(),
            stipend: internshipStipendInput.value.trim(),
            description: internshipDescriptionInput.value.trim(),
            required_skills: internshipRequirementsInput.value.trim(),
            start_date: internshipStartDateInput.value // Include start_date
        };

        // Basic client-side validation - updated
        if (!internshipData.title || !internshipData.location || !internshipData.duration || !internshipData.stipend || !internshipData.description || !internshipData.start_date) {
            alert('Please fill in all required fields (Title, Location, Duration, Stipend, Description, Start Date).');
            return;
        }

        try {
            let response;
            let url;
            let method;

            if (editingInternshipId) { // This now correctly uses the scoped variable
                // UPDATE existing internship
                url = `http://localhost:8080/api/internships/${editingInternshipId}`;
                method = 'PUT';
            } else {
                // POST new internship
                url = 'http://localhost:8080/api/internships';
                method = 'POST';
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(internshipData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || (editingInternshipId ? 'Internship updated successfully!' : 'Internship posted successfully!'));
                postInternshipForm.reset();
                // Redirect to manage internships or dashboard
                window.location.href = 'manage_internships.html';
            } else {
                alert(`Error: ${result.message || 'Something went wrong.'}`);
                console.error('API Error:', result.message);
            }

        } catch (error) {
            console.error('Network or unexpected error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    // --- Logout functionality is now handled elsewhere (e.g., dashboard header) ---
});