document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary elements
    const form = document.getElementById('new-post-form');
    const threadsContainer = document.getElementById('threads-container');
    const messageBox = document.getElementById('message-box');
    const messageContent = document.getElementById('message-content');

    if (form) {
        form.addEventListener('submit', handleThreadSubmit);
    }
    
    // Function to close the custom message box (must be available globally)
    window.closeMessageBox = function() {
        if (messageBox) {
            messageBox.style.display = 'none';
        }
    };

    /**
     * Handles the form submission via AJAX (Fetch API) to post a new thread.
     * @param {Event} event The submit event object.
     */
    function handleThreadSubmit(event) {
        event.preventDefault(); // Prevent default browser form submission
        
        // Hide message box before starting new submission
        closeMessageBox();

        const titleInput = form.querySelector('[name="post-title"]').value;
        const contentInput = form.querySelector('[name="post-body"]').value;
        const postButton = form.querySelector('.post-button');

        // Data payload (keys must match what post_forum_thread.php expects)
        const postData = {
            'post-title': titleInput,
            'post-body': contentInput
        };
        
        // Disable button during submission
        postButton.disabled = true;
        postButton.textContent = 'Posting...';

        fetch('post_forum_thread.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
        .then(response => {
            // Check for HTTP errors (400, 500, etc.)
            if (!response.ok) {
                // Throw an error to be caught by the .catch block
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayMessage(`Success: Thread "${data.title}" (ID: ${data.thread_id}) posted!`, 'success');
                form.reset(); // Clear the form on success
                // Refresh the list of threads
                loadThreads(); 
            } else {
                // Fallback for logical errors returning a 200 status but success: false
                displayMessage(`Server Error: ${data.message}`, 'error');
            }
        })
        .catch(error => {
            // This block handles network errors and thrown errors
            console.error('Submission failed:', error);
            displayMessage(`Submission Failed: ${error.message}`, 'error');
        })
        .finally(() => {
            // Re-enable button after request finishes (success or failure)
            postButton.disabled = false;
            postButton.textContent = 'Post';
        });
    }

    /**
     * Creates the HTML structure for a single forum thread item.
     * @param {Object} thread The thread data object from the server.
     * @returns {HTMLElement} The created thread item anchor element.
     */
    function createThreadItem(thread) {
        const item = document.createElement('a');
        item.href = `thread.html?id=${thread.thread_id}`; // Change 'thread.html' to your actual thread page
        item.className = 'post-item';

        // Format the date
        const date = new Date(thread.created_at);
        const dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <p class="post-title">${thread.title}</p>
            <div class="post-meta">
                <span class="post-author">By: **${thread.username}**</span>
                <span class="post-replies"><i class="fas fa-comment"></i> ${thread.reply_count} Replies</span>
                <span class="post-date"><i class="fas fa-clock"></i> ${dateString} at ${timeString}</span>
            </div>
        `;
        return item;
    }

    /**
     * Fetches and displays all recent forum threads.
     */
    async function loadThreads() {
        if (!threadsContainer) return;

        threadsContainer.innerHTML = '<p class="loading-message">Loading recent posts...</p>';
        
        try {
            const response = await fetch('get_forum_posts.php');
            const data = await response.json();

            if (data.success) {
                threadsContainer.innerHTML = ''; // Clear the loading message
                if (data.threads.length > 0) {
                    data.threads.forEach(thread => {
                        threadsContainer.appendChild(createThreadItem(thread));
                    });
                } else {
                    threadsContainer.innerHTML = '<p class="no-posts-message">No posts found. Be the first to start a discussion!</p>';
                }
            } else {
                console.error('Failed to load threads:', data.error);
                threadsContainer.innerHTML = `<p class="error-message">Error loading posts: ${data.error || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Network Error:', error);
            threadsContainer.innerHTML = '<p class="error-message">Network error: Could not connect to the server to load posts.</p>';
        }
    }
    
    /**
     * Displays a message using the custom message box.
     * @param {string} message The text to display.
     * @param {string} type 'success' or 'error' (used for potential styling in CSS).
     */
    function displayMessage(message, type) {
        if (messageBox && messageContent) {
            messageContent.textContent = message;
            // Optionally add a class for styling (assuming you have styles in forum.css)
            messageBox.className = `message-box ${type}`; 
            messageBox.style.display = 'flex'; // Show the box
        }
    }

    // Load the threads when the page first loads
    loadThreads();
});