// public/scripts/manage_internships.js

document.addEventListener('DOMContentLoaded', function() {
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const internshipListGrid = document.querySelector('.internship-list-grid');
    const noInternshipsMessage = document.getElementById('noInternshipsMessage');

    // Retrieve companyId and companyName directly from localStorage
    const companyId = localStorage.getItem('companyId');
    const companyName = localStorage.getItem('companyName'); // Assuming you store companyName as well

    // Check if companyId is available
    if (!companyId) {
        console.error('Company ID not found in localStorage. Redirecting to login.');
        alert('You must be logged in as a company to view this page.');
        window.location.href = 'company_login.html'; // Or your main login page
        return; // Stop execution
    }

    // Update company name display
    companyNameDisplay.textContent = companyName || 'Company Name'; // Use companyName from localStorage

    // Function to fetch internships from the backend
    async function fetchInternships() {
        try {
            // Use the companyId obtained from localStorage
            const response = await fetch(`/api/company/internships?companyId=${companyId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch internships.');
            }
            const data = await response.json();
            return data.internships; // Assuming your API returns { internships: [...] }
        } catch (error) {
            console.error('Error fetching company internships:', error);
            alert('Could not load internships: ' + error.message);
            return []; // Return empty array on error
        }
    }

    // ... (rest of your manage_internships.js file remains the same) ...

    // Function to delete an internship via the backend API
    async function deleteInternship(internshipId) {
        try {
            const response = await fetch(`/api/internships/${internshipId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete internship.');
            }

            const result = await response.json();
            alert(result.message || 'Internship deleted successfully!');
            renderInternships(); // After successful deletion, re-render the list

        } catch (error) {
            console.error('Error deleting internship:', error);
            alert('Could not delete internship: ' + error.message);
        }
    }

    // Function to render / re-render the list of internships
    async function renderInternships() {
        internshipListGrid.innerHTML = ''; // Clear existing list items
        const companyInternships = await fetchInternships(); // Fetch data from backend

        if (companyInternships.length === 0) {
            noInternshipsMessage.style.display = 'block'; // Show "no internships" message
            return;
        } else {
            noInternshipsMessage.style.display = 'none'; // Hide message if there are internships
        }

        companyInternships.forEach(internship => {
            const internshipCard = document.createElement('div');
            internshipCard.className = 'internship-card';
            internshipCard.setAttribute('data-id', internship.id); // Store the internship ID for actions

            internshipCard.innerHTML = `
                <h3>${internship.title || 'N/A'}</h3>
                <p><strong>Location:</strong> ${internship.location || 'N/A'}</p>
                <p><strong>Duration:</strong> ${internship.duration || 'N/A'}</p>
                <p><strong>Stipend:</strong> $${internship.stipend || 'N/A'}</p>
                <p class="description"><strong>Description:</strong> ${internship.description || 'N/A'}</p>
                <p class="requirements"><strong>Requirements:</strong> ${internship.required_skills || 'N/A'}</p>
                <div class="actions">
                    <button class="btn-edit" data-id="${internship.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-delete" data-id="${internship.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            `;
            internshipListGrid.appendChild(internshipCard);
        });
    }

    internshipListGrid.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-edit') || event.target.closest('.btn-edit')) {
            const editButton = event.target.classList.contains('btn-edit') ? event.target : event.target.closest('.btn-edit');
            const internshipId = editButton.getAttribute('data-id');
            window.location.href = `post_internship.html?id=${internshipId}`;
        } else if (event.target.classList.contains('btn-delete') || event.target.closest('.btn-delete')) {
            const deleteButton = event.target.classList.contains('btn-delete') ? event.target : event.target.closest('.btn-delete');
            const internshipId = deleteButton.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this internship? This action cannot be undone.')) {
                deleteInternship(internshipId);
            }
        }
    });

    renderInternships();
});