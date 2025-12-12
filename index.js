/**
 * Handles the click event for the diagram icons.
 * This redirects to the content page, potentially filtered by topic.
 * @param {string} topic The name of the tech topic clicked.
 */
function handleIconClick(topic) {
  // Pass the topic as a query parameter for potential future filtering
  window.location.href = `contentpage.html?topic=${encodeURIComponent(topic)}`;
}

// --- NEW SEARCH FUNCTIONALITY ---
const API_URL = 'http://localhost/techcyclopedia'; // Adjust path if needed

document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners for search
    const searchInput = document.getElementById('search-input');
    const searchButton = document.querySelector('.search-button:first-of-type'); // The magnifying glass
    const clearButton = document.querySelector('.search-button:last-of-type'); // The 'X' button
    
    // 1. Initial State: Clear input on load for better user experience
    searchInput.value = '';
    
    // 2. Search Button Click
    searchButton.addEventListener('click', performSearch);

    // 3. Enter Key Press
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // 4. Clear Button Click
    clearButton.addEventListener('click', clearSearch);
    
    // 5. Input change for real-time (or near real-time) search/clear
    searchInput.addEventListener('input', () => {
        // You could trigger a search here, or just wait for the enter/button press.
        // For simplicity, we'll keep the search explicit (button/enter).
    });
});

/**
 * Executes the search against the backend API.
 */
function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    const resultsContainer = document.getElementById('search-results-container');

    if (query.length === 0) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('has-results'); // Optionally remove a class
        return;
    }

    // Set a loading message while fetching
    resultsContainer.innerHTML = '<p class="no-results-message">Searching...</p>';

    fetch(`${API_URL}/search.php?query=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                 resultsContainer.innerHTML = `<p class="no-results-message">Error: ${data.error}</p>`;
            } else {
                renderSearchResults(data.results);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            resultsContainer.innerHTML = `<p class="no-results-message">Search failed: ${error.message}</p>`;
        });
}

/**
 * Clears the search input and the results container.
 */
function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-results-container').innerHTML = '';
}

/**
 * Renders the search results into the container.
 * @param {Array<Object>} components - Array of component objects from the search.
 */
function renderSearchResults(components) {
    const resultsContainer = document.getElementById('search-results-container');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (components.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results-message">No components matched your search query. Try different keywords!</p>';
        return;
    }

    // Create and append a card for each component
    components.forEach(component => {
        const card = document.createElement('a');
        card.href = `component.html?id=${component.id}`; // Link to the component details page
        card.className = 'component-card';

        // Use the icon_class from the database for the visual
        const iconHtml = component.icon_class 
            ? `<i class="${component.icon_class} card-icon"></i>` 
            : `<i class="fas fa-box card-icon"></i>`; // Fallback icon

        card.innerHTML = `
            ${iconHtml}
            <p class="card-name">${component.name}</p>
            <p class="card-category">${component.category}</p>
            <p class="card-brief">${component.brief}</p>
        `;

        resultsContainer.appendChild(card);
    });
}