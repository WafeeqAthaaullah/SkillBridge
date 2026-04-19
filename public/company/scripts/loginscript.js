document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Hide error messages by default
    emailError.style.display = 'none';
    passwordError.style.display = 'none';

    // Real-time validation (optional, but good for user experience)
    emailInput.addEventListener('input', function() {
        if (emailInput.validity.valid) {
            emailError.style.display = 'none';
        } else {
            emailError.style.display = 'block';
            if (emailInput.value.trim() === '') {
                emailError.textContent = 'Email is required.';
            } else {
                emailError.textContent = 'Please enter a valid email address.';
            }
        }
    });

    passwordInput.addEventListener('input', function() {
        if (passwordInput.validity.valid) {
            passwordError.style.display = 'none';
        } else {
            passwordError.style.display = 'block';
            if (passwordInput.value.trim() === '') {
                passwordError.textContent = 'Password is required.';
            } else {
                passwordError.textContent = 'Password must be at least 8 characters long and contain at least one letter and one number.';
            }
        }
    });


    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Reset error messages
        emailError.style.display = 'none';
        passwordError.style.display = 'none';

        let isValid = true;

        // Perform validation checks manually
        if (!emailInput.validity.valid) {
            emailError.style.display = 'block';
            if (emailInput.value.trim() === '') {
                emailError.textContent = 'Email is required.';
            } else {
                emailError.textContent = 'Please enter a valid email address.';
            }
            isValid = false;
        }

        if (!passwordInput.validity.valid) {
            passwordError.style.display = 'block';
            if (passwordInput.value.trim() === '') {
                passwordError.textContent = 'Password is required.';
            } else {
                passwordError.textContent = 'Password must be at least 8 characters long and contain at least one letter and one number.';
            }
            isValid = false;
        }

        if (isValid) {
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            try {
                const response = await fetch('http://localhost:8080/api/auth/company/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                // Check if HTTP status is 2xx AND if companyId is present in the response data
                if (response.ok && data.companyId) { // Changed from data.token to data.companyId
                    alert(data.message + ' Redirecting to dashboard.');

                    // Store companyId, NOT companyToken
                    localStorage.setItem('companyId', data.companyId); // <--- Store companyId

                    // Redirect to the company dashboard after successful login
                    setTimeout(() => {
                        window.location.href = 'company_dashboard.html';
                    }, 500); // Short delay for message to show
                } else {
                    // This block will now correctly handle cases where:
                    // 1. response.ok is false (e.g., 401 Unauthorized, 404 Not Found)
                    // 2. response.ok is true, but data.companyId is missing/falsy (this implies backend didn't send it)
                    alert(`Login failed: ${data.message || 'Please try again.'}`);
                    console.error('Login error:', data.message);
                }
            } catch (error) {
                console.error('Network error or server unreachable:', error);
                alert('An error occurred during login. Please check your network connection and try again.');
            }
        }
    });
});