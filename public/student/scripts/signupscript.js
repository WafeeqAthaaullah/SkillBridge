// public/student/scripts/signupscript.js (or company/scripts/signupscript.js)

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('.signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const backendBaseUrl = 'http://localhost:8080'; // Your server is on 8080 according to index.js

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!name || !email || !password) {
            alert('Please fill in all fields.');
            return;
        }

        let apiUrl = '';
        let redirectUrl = '';

        const currentPath = window.location.pathname;

        if (currentPath.includes('/student/signup.html')) {
            apiUrl = `${backendBaseUrl}/api/auth/student/register`; // <-- CHANGED THIS LINE
            redirectUrl = '/student/loginpage.html';
        } else if (currentPath.includes('/company/signup.html')) {
            apiUrl = `${backendBaseUrl}/api/auth/company/register`; // <-- AND THIS LINE
            redirectUrl = '/company/login.html';
        } else {
            console.error('Unknown signup page. Cannot determine API endpoint.');
            alert('An internal error occurred. Please try again later.');
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Registration successful!');
                window.location.href = redirectUrl;
            } else {
                alert(data.message || 'Registration failed. Please try again.');
                console.error('Registration error:', data.message);
            }
        } catch (error) {
            console.error('Network error during registration:', error);
            alert('An error occurred during registration. Please check your network connection and try again.');
        }
    });
});