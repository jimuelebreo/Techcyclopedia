// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');

    if (!loginForm) {
        console.error("Login form not found.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        // STOP THE BROWSER from submitting the form and redirecting
        event.preventDefault(); 

        // Get form data
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        // Disable button while submitting
        loginButton.disabled = true;
        loginButton.textContent = 'Logging In...';

        try {
            const response = await fetch('authenticate.php', {
                method: 'POST',
                headers: {
                    // Tell PHP that we are sending JSON data
                    'Content-Type': 'application/json',
                },
                // Send the data as JSON
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
            });

            // Read the JSON response from the PHP file
            const data = await response.json();

            if (data.success) {
                // SUCCESS: Show alert and redirect to the desired page
                alert('Login successful! Welcome.');
                window.location.href = 'index.html'; 
            } else {
                // FAILURE: Show the error message from the PHP script as a pop-up
                alert(`Login Failed: ${data.message}`);
                // The user remains on the login page
            }

        } catch (error) {
            console.error('Login error:', error);
            // Catches network issues or if PHP returns non-JSON data
            alert('An unexpected network error occurred. Please try again.');
        } finally {
            // Re-enable the button
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });
});