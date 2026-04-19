// public/scripts/signupscript.js

document.addEventListener('DOMContentLoaded', function() {
    const companySignupForm = document.getElementById('companySignupForm');
    const companyNameInput = document.getElementById('companyName');
    const companyEmailInput = document.getElementById('companyEmail');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const companyIndustryInput = document.getElementById('companyIndustry');
    const companyWebsiteInput = document.getElementById('companyWebsite');

    companySignupForm.addEventListener('submit', async function(event) { // Make the event listener async
        event.preventDefault(); // Prevent default form submission

        const companyName = companyNameInput.value.trim();
        const email = companyEmailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const industry = companyIndustryInput.value.trim();
        const website = companyWebsiteInput.value.trim();

        // --- Client-side validation ---
        if (!companyName || !email || !password || !confirmPassword) {
            alert('Please fill in all required fields (Company Name, Email, Password, Confirm Password).');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Password and Confirm Password do not match.');
            return;
        }

        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(email)) {
            alert('Please enter a valid company email address.');
            return;
        }

        if (website && !/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/.test(website)) {
            alert('Please enter a valid website URL (e.g., https://www.yourcompany.com).');
            return;
        }

        // --- Send data to Backend API ---
        const companyData = {
            name: companyName,
            email: email,
            password: password,
            industry: industry || null, // Send null if empty
            website: website || null    // Send null if empty
        };

        try {
            const response = await fetch('http://localhost:8080/api/auth/company/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(companyData)
            });

            const result = await response.json(); // Parse the JSON response from the backend

            if (response.ok) { // Check if the HTTP status code is in the 200s
                alert(result.message || 'Company registered successfully!');
                companySignupForm.reset();
                window.location.href = 'login.html'; // Redirect to company login page
            } else {
                // Handle errors returned from the server (e.g., 409 Conflict, 400 Bad Request)
                alert(`Registration failed: ${result.message || 'Unknown error'}`);
                console.error('Company signup error:', result);
            }
        } catch (error) {
            console.error('Network error during company signup:', error);
            alert('An error occurred during registration. Please check your internet connection or try again later.');
        }
    });
});