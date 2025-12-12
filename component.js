/**
 * REVISED to fetch and submit data via PHP endpoints, and include bookmark logic.
 */
const API_URL = 'http://localhost/techcyclopedia'; // Adjust path if needed

let currentRating = 0; // State variable for the user's current rating
let currentComponentId = null; // Store component ID once loaded
// Assume a logged-in user for functionality testing (replace with actual user session logic later)
const CURRENT_USER_ID = 1; 

// --- 1. CORE COMPONENT LOADING ---

/**
 * Fetches and displays component data based on the URL parameter.
 */
function loadComponentDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const componentId = urlParams.get('id');

    if (!componentId) {
        document.getElementById('component-name').textContent = "Error: Component ID Missing";
        return;
    }

    currentComponentId = componentId; // Set the global ID
    
    // Call new function to check bookmark status
    loadBookmarkStatus(componentId); 

    fetch(`${API_URL}/get_component_details.php?id=${componentId}`)
        .then(response => {
            if (response.status === 404) {
                throw new Error('Component not found');
            }
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Failed to load component details'); });
            }
            return response.json();
        })
        .then(data => {
            // 1. Update component details
            const component = data.details;
            document.getElementById('component-name').textContent = component.name; // Line 69
            document.getElementById('component-category').textContent = `Category: ${component.category}`;
            document.getElementById('component-date').textContent = new Date(component.upload_date).toLocaleDateString();
            document.getElementById('component-description-text').textContent = component.description;
            
            // --- NEW: Image Display Logic ---
            const imageElement = document.getElementById('component-image');
            if (component.image_url) { // Use image_url from your database
                // Construct the full image URL using the base API_URL
                imageElement.src = `${API_URL}/${component.image_url}`; 
                imageElement.style.display = 'block'; // Make it visible
            } else {
                imageElement.style.display = 'none'; // Keep it hidden if no image path
            }
            // --------------------------------

            const downloadLink = document.getElementById('component-image-link');
            downloadLink.href = component.download_link || '#';
            downloadLink.textContent = component.download_link ? `View/Download File (${component.name})` : 'File Link Unavailable';

            // 2. Render comments
            renderComments(data.comments);
        })
        .catch((error) => {
            console.error('Error fetching details:', error);
            document.getElementById('component-name').textContent = `Error: ${error.message}`;
        });
}

// --- 2. BOOKMARK LOGIC ---

/**
 * Updates the bookmark icon's appearance.
 * @param {boolean} isBookmarked - True if the component is bookmarked by the user.
 */
function updateBookmarkIcon(isBookmarked) {
    const icon = document.getElementById('bookmark-icon');
    if (!icon) return;

    if (isBookmarked) {
        // Filled star (bookmarked)
        icon.classList.add('fas', 'bookmarked');
        icon.classList.remove('far');
        icon.title = 'Remove bookmark';
    } else {
        // Empty star (not bookmarked)
        icon.classList.add('far');
        icon.classList.remove('fas', 'bookmarked');
        icon.title = 'Save this component';
    }
}

/**
 * Checks the current user's bookmark status for the component on page load.
 * @param {string} componentId - The ID of the component.
 */
function loadBookmarkStatus(componentId) {
    // Note: We need a secure way to get the user ID. Using a fixed ID for development.
    if (!CURRENT_USER_ID) return; 

    fetch(`${API_URL}/get_bookmark_status.php?user_id=${CURRENT_USER_ID}&component_id=${componentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load bookmark status');
            }
            return response.json();
        })
        .then(data => {
            // data.is_bookmarked will be true or false
            updateBookmarkIcon(data.is_bookmarked); 
        })
        .catch(error => {
            console.error('Error loading bookmark status:', error);
            // Default to not bookmarked on error
            updateBookmarkIcon(false); 
        });
}

/**
 * Toggles the bookmark status when the icon is clicked.
 */
function toggleBookmark() {
    if (!currentComponentId || !CURRENT_USER_ID) {
        alert("Cannot toggle bookmark. Component ID or User ID is missing.");
        return;
    }

    const icon = document.getElementById('bookmark-icon');
    const action = icon.classList.contains('fas') ? 'remove' : 'add';

    const postData = {
        user_id: CURRENT_USER_ID,
        component_id: currentComponentId,
        action: action
    };

    fetch(`${API_URL}/toggle_bookmark.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || `Server error during bookmark ${action}.`); });
        }
        return response.json();
    })
    .then(data => {
        // Success: Update the icon based on the returned status
        updateBookmarkIcon(data.is_bookmarked); 
        console.log(`Bookmark ${action} successful. New status: ${data.is_bookmarked}`);
    })
    .catch((error) => {
        console.error('Bookmark toggle error:', error);
        alert(`An error occurred while trying to ${action} the bookmark: ` + error.message);
    });
}

// --- 3. COMMENT/RATING LOGIC (EXISTING) ---

function renderComments(comments) {
    const commentsContainer = document.getElementById('recent-posts');
    commentsContainer.innerHTML = ''; 

    if (comments.length === 0) {
        commentsContainer.innerHTML = '<p style="color: #d1c5bb;">No community posts yet. Be the first!</p>';
        return;
    }

    comments.forEach(comment => {
        const date = new Date(comment.post_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const starHTML = Array.from({ length: 5 }, (_, i) => {
            const starClass = i < comment.rating ? 'fas active' : 'far inactive';
            return `<i class="fa-star ${starClass}"></i>`;
        }).join('');

        const postItem = document.createElement('div');
        postItem.className = 'post-item';
        postItem.innerHTML = `
            <div class="post-header">
                <span class="post-user">${comment.username}</span>
                <span class="post-date">${date}</span>
            </div>
            <div class="post-rating">${starHTML}</div>
            <div class="post-comment">${comment.comment_text}</div>
        `;
        commentsContainer.appendChild(postItem);
    });
}

function updateStarVisuals(rating) {
    const stars = document.querySelectorAll('#rating-stars-container .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('fas', 'filled');
            star.classList.remove('far');
        } else {
            star.classList.add('far');
            star.classList.remove('fas', 'filled');
        }
    });
}

function checkPostButtonState(rating, commentText) {
    const button = document.getElementById('post-comment-btn');
    if (rating > 0 && commentText.length >= 6) {
        button.disabled = false;
    } else {
        button.disabled = true;
    }
}

function initRatingStars() {
    const starsContainer = document.getElementById('rating-stars-container');
    const commentInput = document.getElementById('comment-input');
    const postButton = document.getElementById('post-comment-btn');

    // Star Click Listener
    starsContainer.addEventListener('click', (event) => {
        const star = event.target.closest('.star');
        if (star) {
            const rating = parseInt(star.dataset.rating);
            currentRating = rating;
            updateStarVisuals(rating);
            checkPostButtonState(currentRating, commentInput.value.trim());
        }
    });

    // Comment Input Listener
    commentInput.addEventListener('input', () => {
        checkPostButtonState(currentRating, commentInput.value.trim());
    });
    
    // Post Button Listener
    postButton.addEventListener('click', postComment);

    // Bookmark Icon Listener (NEW)
    document.getElementById('bookmark-icon').addEventListener('click', toggleBookmark);
}

function postComment() {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();

    // Basic validation
    if (currentRating > 0 && commentText.length >= 6) {
        document.getElementById('post-comment-btn').disabled = true; // Disable to prevent double-submit
        
        const postData = {
            component_id: currentComponentId,
            user_id: CURRENT_USER_ID, // Use the assumed User ID
            username: 'admin', // Placeholder - replace with actual logged-in username
            rating: currentRating,
            comment_text: commentText
        };

        fetch(`${API_URL}/post_comment.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
        .then(response => {
            document.getElementById('post-comment-btn').disabled = false; // Re-enable button
            if (!response.ok) {
                 // Check for 5xx/4xx errors and parse the error message
                return response.json().then(err => { throw new Error(err.error || 'Server error during submission.'); });
            }
            return response.json();
        })
        .then(data => {
            alert('Comment posted successfully!');
                
            // Clear and reload the form state
            commentInput.value = '';
            currentRating = 0;
            updateStarVisuals(0);
            checkPostButtonState(0, '');
            loadComponentDetails(); // Reload to fetch the new comment from DB
        })
        .catch((error) => {
            console.error('Submission error:', error);
            alert('An error occurred: ' + error.message);
            checkPostButtonState(currentRating, commentInput.value.trim()); // Ensure button state is correctly updated
        });

    } else {
        alert('Please provide a rating (1-5 stars) and a comment (minimum 6 characters) before posting.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadComponentDetails();
    initRatingStars();
});