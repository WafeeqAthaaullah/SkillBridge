// public/scripts/company_profile.js

document.addEventListener('DOMContentLoaded', async function() {
    // Get elements
    const companyProfileForm = document.getElementById('companyProfileForm');
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');
    const profilePhoneInput = document.getElementById('profilePhone');
    const profileAddressInput = document.getElementById('profileAddress');
    const profileWebsiteInput = document.getElementById('profileWebsite');
    const profileIndustryInput = document.getElementById('profileIndustry');
    const profileDescriptionTextarea = document.getElementById('profileDescription');
    const profileLogoInput = document.getElementById('profileLogo');
    const logoPreview = document.getElementById('logoPreview');
    const resetProfileBtn = document.getElementById('resetProfileBtn');
    const companyNameDisplay = document.getElementById('companyNameDisplay'); // Added for header display

    // --- Retrieve Company ID from localStorage ---
    const companyId = localStorage.getItem('companyId');

    if (!companyId) {
        alert('You are not logged in as a company. Redirecting to login page.');
        window.location.href = 'company_login.html'; // Adjust as needed
        return; // Stop execution if not logged in
    }

    let currentCompanyProfile = {}; // Will store the profile fetched from the server

    // Function to fetch company profile from API and populate form fields
    async function fetchAndPopulateForm() {
        try {
            const response = await fetch(`http://localhost:8080/api/company/profile/${companyId}`); // Assuming an API endpoint like /api/company/profile/:id
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch company profile.');
            }
            currentCompanyProfile = await response.json(); // Store fetched profile

            // Populate the form fields
            profileNameInput.value = currentCompanyProfile.name || '';
            profileEmailInput.value = currentCompanyProfile.email || '';
            profilePhoneInput.value = currentCompanyProfile.phone || '';
            profileAddressInput.value = currentCompanyProfile.address || '';
            profileWebsiteInput.value = currentCompanyProfile.website || '';
            profileIndustryInput.value = currentCompanyProfile.industry || '';
            profileDescriptionTextarea.value = currentCompanyProfile.description || '';

            // Update logo preview if logo_url exists
            if (currentCompanyProfile.logo_url) { // Assuming your DB column is logo_url
                logoPreview.src = currentCompanyProfile.logo_url;
            } else {
                logoPreview.src = 'https://via.placeholder.com/150x80/EEEEEE/888888?text=No+Logo';
            }

            // Update company name in the header
            companyNameDisplay.textContent = currentCompanyProfile.name || 'Company Name';

        } catch (error) {
            console.error('Error fetching company profile:', error);
            alert('Could not load company profile: ' + error.message);
            // Optionally redirect or show a more prominent error message
        }
    }

    // --- Event Listeners ---

    // Handle form submission for saving changes
    companyProfileForm.addEventListener('submit', async function(event) { // Made async
        event.preventDefault(); // Prevent default form submission

        const updatedProfileData = {
            name: profileNameInput.value.trim(),
            email: profileEmailInput.value.trim(),
            phone: profilePhoneInput.value.trim(),
            address: profileAddressInput.value.trim(),
            website: profileWebsiteInput.value.trim(),
            industry: profileIndustryInput.value.trim(),
            description: profileDescriptionTextarea.value.trim(),
            // Logo URL is handled separately or assumed to be static for now,
            // or your API will handle base64 if sent as part of this payload.
            // For file uploads, a dedicated endpoint is usually better.
            // If you're sending the current preview src, ensure your backend can handle it.
            // For now, let's omit logoUrl from the main update payload unless your API specifically expects a full URL.
            // If you want to update the logo, you'll need a separate upload mechanism.
            // logo_url: logoPreview.src // Use this if your backend expects a URL here.
        };

        // Basic validation
        if (!updatedProfileData.name || !updatedProfileData.email) {
            alert('Company Name and Email are required.');
            return;
        }

        // Email validation
        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(updatedProfileData.email)) {
            alert('Please enter a valid company email address.');
            return;
        }

        // Website URL validation (if provided)
        if (updatedProfileData.website && !/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(updatedProfileData.website)) {
            alert('Please enter a valid website URL (e.g., https://www.yourcompany.com).');
            return;
        }

        try {
            // Make an HTTP PUT request to update the profile
            const response = await fetch(`http://localhost:8080/api/company/profile/${companyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProfileData)
            });

            const result = await response.json(); // Parse the JSON response

            if (response.ok) {
                alert(result.message || 'Company profile updated successfully!');
                // Re-fetch and populate the form to show the latest data from the server
                await fetchAndPopulateForm();
                // Update the company name in localStorage if it changed
                if (updatedProfileData.name) {
                    localStorage.setItem('companyName', updatedProfileData.name);
                }
            } else {
                // Handle API errors
                alert(`Error updating profile: ${result.message || 'Something went wrong.'}`);
                console.error('API Error:', result.message);
            }
        } catch (error) {
            console.error('Network or unexpected error saving profile:', error);
            alert('An error occurred while saving your profile. Please try again.');
        }
    });

    // Handle reset button
    // This will re-fetch the data from the server to reset, not from DataStore
    resetProfileBtn.addEventListener('click', async function() { // Made async
        await fetchAndPopulateForm(); // Re-populate form with data from the server
        alert('Form fields reset to last saved data from server.');
    });

    // Initial load: Fetch profile data and populate the form when the page loads
    fetchAndPopulateForm();
});