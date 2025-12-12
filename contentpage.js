/**
 * REVISED to fetch component data from PHP endpoint.
 */
const API_URL = "http://localhost/techcyclopedia"; // Adjust path if needed

function renderComponentGrid(componentData, categoryTitle) {
  const gridContainer = document.getElementById("component-grid-container");
  if (!gridContainer) return;

  const titleElement = document.createElement("a");
  titleElement.className = "page-title";
  titleElement.href = "index.html";

  titleElement.textContent = categoryTitle
    ? `COMPONENTS: ${categoryTitle.toUpperCase()}`
    : "TECHCYCLOPEDIA";

  // Check if the title is already present to prevent duplicates on re-render
  let existingTitle = document.querySelector(".page-title");
  if (existingTitle) {
    existingTitle.textContent = titleElement.textContent;
    // Ensure the href is also updated if it's an existing element (optional but safe)
    existingTitle.href = "index.html";
  } else {
    // Insert the title before the grid container
    gridContainer.parentNode.insertBefore(titleElement, gridContainer);
  }

  if (componentData.length === 0) {
    gridContainer.innerHTML =
      '<p style="color: #d1c5bb;">No components found for this category.</p>';
    return;
  }
  
  // Clear the grid container before adding new cards (important for re-renders)
  gridContainer.innerHTML = '';

  // Create and append a card for each component
  componentData.forEach((component) => {
    const card = document.createElement("a");
    card.className = "component-card";
    // Link to the detail page, passing the component ID
    card.href = `component.html?id=${component.id}`;

    // UPDATED: Check for image_url. Use <img> if available, otherwise use <i> icon.
    const mediaHtml = component.image_url
      ? `<img src="${component.image_url}" alt="${component.name}" class="component-image">`
      : `<i class="${component.icon_class}"></i>`;

    card.innerHTML = `
            <div class="image-placeholder">
                ${mediaHtml}
            </div>
            <div class="component-info">
                <div class="component-name">${component.name}</div>
                <div class="component-brief">${component.brief}</div>
            </div>
        `;
    gridContainer.appendChild(card);
  });
}

function fetchComponents() {
  // ... (rest of the fetchComponents function remains the same)
  // NEW: Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("topic"); // 'topic' is the key used in handleIconClick()

  let apiUrl = `${API_URL}/get_components.php`;

  // NEW: If a category is found, append it to the API URL
  if (category) {
    // We use 'category' as the parameter name in the PHP file
    apiUrl += `?category=${encodeURIComponent(category)}`;
  }

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // UPDATED: Pass the category to the rendering function for the title
      renderComponentGrid(data, category);
    })
    .catch((error) => {
      console.error("Error fetching components:", error);
      document.getElementById(
        "component-grid-container"
      ).innerHTML = `<p style="color: #ff5555;">Could not load components. Check XAMPP server status and API path.</p>`;
    });
}

// Custom Message Box (for header stubs)
window.closeMessageBox = function () {
  const box = document.getElementById("message-box");
  if (box) box.style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("component-grid-container")) {
    fetchComponents();
  }
});