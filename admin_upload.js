// script.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Stop the default form submission (page reload)

        messageDiv.classList.add('hidden'); // Hide previous message
        messageDiv.textContent = '';

        // Create a FormData object to easily send the form data, including the file
        const formData = new FormData(this);

        try {
            // Using the Fetch API to send the request to upload.php
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData // FormData automatically sets the correct Content-Type (multipart/form-data)
            });

            const result = await response.json();

            // Display feedback based on the server's response
            messageDiv.classList.remove('hidden');
            
            if (response.ok) { // Check if HTTP status code is 200-299
                messageDiv.classList.remove('error');
                messageDiv.classList.add('success');
                messageDiv.textContent = 'SUCCESS: ' + result.message;
                form.reset(); // Clear the form on success
            } else {
                // Handle non-200 responses (e.g., 400 Bad Request, 500 Server Error)
                messageDiv.classList.remove('success');
                messageDiv.classList.add('error');
                messageDiv.textContent = 'ERROR: ' + (result.error || 'Unknown upload failure.');
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            messageDiv.classList.remove('hidden', 'success');
            messageDiv.classList.add('error');
            messageDiv.textContent = 'NETWORK ERROR: Could not connect to the server.';
        }
    });
});