/**
 * Simulates navigating to the full post content.
 * @param {string} title The title of the post clicked.
 */
function viewRecentPost(title) {
  alert(`Navigating to Recent Post: "${title}"`);
}

/**
 * Simulates navigating to the bookmarked component documentation.
 * @param {string} title The title of the bookmarked item.
 */
function viewBookmark(title) {
  alert(`Loading Bookmarked Component: "${title}" Documentation.`);
}


document.addEventListener("DOMContentLoaded", () => {
  // Get all necessary elements
  const usernameElement = document.getElementById("dashboard-username");
  const memberSinceElement = document.getElementById("dashboard-member-since");
  const threadCountElement = document.getElementById("dashboard-thread-count");
  const logoutButton = document.getElementById("logoutButton");
  const loginButton = document.getElementById("loginButton");
  const editButton = document.querySelector(".edit-button");
  const adminUploadButton = document.getElementById("adminUploadButton");
  
  // Containers for activity
  const recentActivityContainer = document.getElementById("main-activity-list");
  const bookmarksListContainer = document.getElementById("bookmarked-components-list");

  // --- Event Handlers ---
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
  
  // --- Core Functions ---

  /**
   * Fetches the main user data, activity, and bookmarks.
   */
  function fetchUserData() {
    // Fetch data from the PHP endpoint (assuming 'fetch_user_data.php' exists)
    fetch("fetch_user_data.php")
      .then((response) => {
        if (!response.ok) {
          // If the server returned an error, throw it to catch block
          return response.json().then(err => { throw new Error(err.message || "Failed to load user data."); });
        }
        return response.json();
      })
      .then((data) => {
        // *** DIAGNOSTIC STEP: Check your console to see the data structure ***
        console.log("Received User Data:", data); 

        if (data.success && data.data) {
          // Render all sections of the dashboard
          renderUserData(data.data.user);
          renderRecentActivity(data.data.activity);
          
          // Call the rendering function
          renderBookmarks(data.data.bookmarks); 
        } else {
          updateErrorState(data.message || "User not logged in or session expired.");
        }
      })
      .catch((error) => {
        console.error("Fetch user data error:", error);
        updateErrorState(`Error: ${error.message}`);
      });
  }
  
  /**
   * Renders the user's primary profile details.
   */
  function renderUserData(user) {
    if (usernameElement) usernameElement.textContent = user.username;
    if (memberSinceElement) memberSinceElement.textContent = `Member since: ${user.member_since}`;
    if (threadCountElement) threadCountElement.textContent = user.thread_count || '0'; 
    
    // Show/Hide admin button based on role
    if (adminUploadButton) {
        // Assuming user.is_admin is a boolean or can be evaluated as one
        adminUploadButton.style.display = user.is_admin ? 'inline-block' : 'none';
    }
  }

  /**
   * Renders the list of bookmarked components.
   * *** FIX APPLIED: Added checks for required bookmark properties (name, id) ***
   */
  function renderBookmarks(bookmarks) {
    if (!bookmarksListContainer) {
        console.error("Bookmark list container element not found (ID: bookmarked-components-list).");
        return;
    }
      
    bookmarksListContainer.innerHTML = ""; // Clear existing content

    // Check if bookmarks is an array with items
    if (Array.isArray(bookmarks) && bookmarks.length > 0) {
      bookmarks.forEach((bookmark) => {
        
        // CRITICAL CHECK: Ensure minimum required data is present
        if (!bookmark || !bookmark.name || !bookmark.id) {
            console.warn("Skipping malformed bookmark entry:", bookmark);
            return; // Skip this entry if required fields are missing
        }
          
        const item = document.createElement("div");
        item.className = "activity-item";

        // Display component category/type (uses fallback 'Component' if missing)
        const categorySpan = document.createElement("span");
        categorySpan.className = "activity-type";
        categorySpan.textContent = `[${bookmark.category || 'Component'}]`; 

        // Link to the component detail page
        const link = document.createElement("a");
        link.href = `component.html?id=${bookmark.id}`;
        link.textContent = bookmark.name;
        link.title = bookmark.brief || bookmark.name; // Use brief as a tooltip

        item.appendChild(categorySpan);
        item.appendChild(link);
        bookmarksListContainer.appendChild(item);
      });
    } else {
      // If no bookmarks, show the fallback message
      bookmarksListContainer.innerHTML =
        '<div style="padding: 10px; color:#d1c5bb;">You have not bookmarked any components yet.</div>';
    }
  }
  
  /**
   * Renders the user's recent activity (e.g., last few posts).
   */
  function renderRecentActivity(activity) {
    // Placeholder for rendering main activity list
    if (recentActivityContainer) {
        recentActivityContainer.innerHTML = '';
        if (Array.isArray(activity) && activity.length > 0) {
            // Logic to iterate and display activity items
        } else {
            // Re-render the thread count which was in the HTML originally
            recentActivityContainer.innerHTML = `
                <div class="activity-item">
                  <span class="activity-type">Total Threads:</span>
                  <span id="dashboard-thread-count">${threadCountElement.textContent}</span>
                </div>
                <div class="activity-item">
                  <span class="activity-type">Settings:</span>
                  <a href="#">Privacy and Security</a>
                </div>
            `;
        }
    }
  }
  
  /**
   * Displays an error or "not logged in" state.
   */
  function updateErrorState(message) {
    if (usernameElement) usernameElement.textContent = "Guest/Error";
    if (memberSinceElement) memberSinceElement.textContent = message;
    if (threadCountElement) threadCountElement.textContent = "---";
    if (editButton) editButton.style.display = "none";
    if (adminUploadButton) adminUploadButton.style.display = "none";
    
    // Control Log In/Log Out button visibility
    if (logoutButton) logoutButton.style.display = "none";
    if (loginButton) loginButton.style.display = "block"; 
    
    // Clear activity lists and show fallback
    const fallbackMessage = '<div style="padding: 10px; color:#d1c5bb;">Please log in to view activity.</div>';
    if(recentActivityContainer) recentActivityContainer.innerHTML = fallbackMessage;
    if(bookmarksListContainer) bookmarksListContainer.innerHTML = fallbackMessage;
  }


  /**
   * Handles the asynchronous request to log the user out.
   */
  async function handleLogout() {
      if (!confirm("Are you sure you want to log out?")) {
          return;
      }

      logoutButton.disabled = true;
      logoutButton.textContent = 'Logging Out...';

      try {
          const response = await fetch('logout.php', {
              method: 'POST', 
          });

          // Check for JSON header before parsing
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Server did not return a valid JSON response for logout.");
          }
          
          const data = await response.json();

          if (data.success) {
              alert(data.message);
              window.location.href = 'index.html'; 
          } else {
              alert(`Logout failed: ${data.message}`);
          }

      } catch (error) {
          console.error('Logout error:', error);
          alert('A network or server error occurred during logout. Please try refreshing.');
      } finally {
          logoutButton.disabled = false;
          logoutButton.textContent = 'Log Out';
      }
  }

  // --- Login Button Handler (Attached to loginButton) ---
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      // Send user to the main page for login (assuming index.html has the form)
      window.location.href = "login.html";
    });
  }

  /**
   * Updates the dashboard to an "empty" state for logged out users.
   */
  function updateNotLoggedInState() {
    // 1. Update Profile Card (show a prompt)
    if (usernameElement) {
      usernameElement.textContent = "Guest User";
      usernameElement.style.color = "#7d6b5c";
    }
    if (memberSinceElement) {
      memberSinceElement.innerHTML =
        'Please <a href="index.html" style="color:#d1c5bb; font-weight:bold;">log in</a> to view your dashboard.';
      memberSinceElement.style.color = "#fff";
    }

    // 2. Clear/Disable Interactive Elements
    if (threadCountElement) {
      threadCountElement.textContent = "---";
    }

    // CRITICAL: Switch button visibility
    if (logoutButton) {
      logoutButton.style.display = "none"; // HIDE LOG OUT
    }
    if (loginButton) {
      loginButton.style.display = "inline-block"; // SHOW LOG IN
    }
    if (editButton) {
      editButton.style.display = "none"; // Hide Edit button
    }
    
    // HIDE ADMIN BUTTON
    if (adminUploadButton) {
        adminUploadButton.style.display = 'none';
    }

    // 3. Clear activity section content (optional cleanup)
    const activityList = document.querySelector(".activity-list");
    if (activityList) {
      activityList.innerHTML =
        '<div style="padding: 10px; color:#d1c5bb;">Log in to see your recent activity.</div>';
    }
    
    // Clear bookmarks list
    const listContainer = document.getElementById("bookmarked-components-list");
    if (listContainer) {
        listContainer.innerHTML = '<div style="padding: 10px; color:#d1c5bb;">Log in to see your bookmarked components.</div>';
    }
  }

  // --- Initial Call ---
  fetchUserData();
});