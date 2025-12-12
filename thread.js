// thread.js (FINAL CONSOLIDATED VERSION with Comment Inline Edit/Delete)

document.addEventListener("DOMContentLoaded", () => {
  // 1. Get the Thread ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const threadId = urlParams.get("id");

  // Get elements
  const titleElement = document.getElementById("thread-title");
  const postBodyElement = document.getElementById("post-body");
  const postMetaElement = document.getElementById("post-meta");
  const commentsContainer = document.getElementById("comments-container");
  const replyForm = document.getElementById("reply-form");
  const replyInput = document.getElementById("reply-content");
  
  // Comment Edit Elements (NEW)
  const commentEditContainer = document.getElementById("comment-edit-container");
  const commentEditForm = document.getElementById("comment-edit-form");
  const editingCommentIdInput = document.getElementById("editing-comment-id");
  const commentEditInput = document.getElementById("comment-edit-content");

  // Message Box Elements
  const messageBox = document.getElementById("message-box");
  const messageContent = document.getElementById("message-content");

  if (!threadId) {
    titleElement.textContent = "Error: No Thread ID Provided";
    return;
  }

  // Set initial loading state
  titleElement.textContent = "Loading Thread...";
  postBodyElement.innerHTML = "<p>Fetching data...</p>";
  
  // Stores the ID of the logged-in user, set after fetchThreadData
  let currentUserId = null; 

  // --- Utility Functions ---

  window.closeMessageBox = function () {
    if (messageBox) {
      messageBox.style.display = "none";
    }
  };
  
  window.cancelCommentEdit = function() {
      if (commentEditContainer) {
          commentEditContainer.style.display = 'none';
          editingCommentIdInput.value = '';
          commentEditForm.reset();
      }
  }

  function displayMessage(message, type) {
    if (messageBox && messageContent) {
      messageContent.textContent = message;
      messageBox.className = `message-box ${type}`; // 'success' or 'error'
      messageBox.style.display = "flex"; 
    }
  }

  // --- Event Listeners Setup ---
  if (replyForm) {
    replyForm.addEventListener("submit", handleReplySubmit);
  }
  if (commentEditForm) {
      commentEditForm.addEventListener("submit", handleCommentEditSubmit);
  }

  // --- Rendering & Logic Functions ---

  /**
   * Creates and returns the HTML structure for a single comment/reply.
   */
  function createCommentElement(commentData) {
    const commentDiv = document.createElement("div");
    commentDiv.className = "post-card comment-post";
    commentDiv.dataset.commentId = commentData.comment_id;

    const date = new Date(commentData.comment_date).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const rawContent = commentData.comment_body;
    const bodyContent = rawContent.replace(/\n/g, "<br>");
    
    // Check if the comment author ID matches the logged-in user ID
    const isAuthor = currentUserId && parseInt(commentData.user_id) === parseInt(currentUserId);

    // Build Action Buttons HTML
    let actionButtonsHTML = '';
    if (isAuthor) {
        // Store raw content in data attribute for easy retrieval in the editor
        const safeContent = rawContent.replace(/"/g, '&quot;'); 
        actionButtonsHTML = `
            <div class="comment-actions">
                <button class="action-button edit-comment-btn" data-comment-id="${commentData.comment_id}" data-comment-content="${safeContent}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-button delete-comment-btn" data-comment-id="${commentData.comment_id}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
    }

    commentDiv.innerHTML = `
        <div class="post-meta">
            <span class="post-author"><i class="fas fa-user-circle"></i> ${commentData.author}</span>
            <span class="post-date"><i class="far fa-clock"></i> ${date}</span>
        </div>
        ${actionButtonsHTML}
        <div class="post-body-content" id="comment-body-${commentData.comment_id}">${bodyContent}</div>
    `;
    
    // Attach event listeners to the new buttons
    if (isAuthor) {
        commentDiv.querySelector('.edit-comment-btn').addEventListener('click', handleEditCommentClick);
        commentDiv.querySelector('.delete-comment-btn').addEventListener('click', handleDeleteCommentClick);
    }

    return commentDiv;
  }

  /**
   * Renders the main thread and its comments.
   */
  function renderThread(thread, comments, fetched_current_user_id) {
    // 1. Set global current user ID
    currentUserId = fetched_current_user_id;
    
    // 2. Render Main Thread
    titleElement.textContent = thread.title;
    postBodyElement.innerHTML = thread.content.replace(/\n/g, "<br>"); 
    postMetaElement.textContent = `Posted by ${thread.author} on ${thread.created_at}`;
    
    // NOTE: Main thread edit/delete buttons are NOT rendered, as requested.

    // 3. Render Comments
    commentsContainer.innerHTML = "";
    if (comments.length === 0) {
      commentsContainer.innerHTML =
        '<p class="no-comments">Be the first to reply to this thread!</p>';
    } else {
      // Create element will use the now-set global currentUserId
      comments.forEach((comment) => {
        commentsContainer.appendChild(createCommentElement(comment));
      });
    }
  }

  // --- Comment Action Handlers (NEW) ---
  
  function handleEditCommentClick(event) {
      const button = event.currentTarget;
      const commentId = button.getAttribute('data-comment-id');
      const content = button.getAttribute('data-comment-content');

      // 1. Set the form values
      editingCommentIdInput.value = commentId;
      commentEditInput.value = content;
      
      // 2. Show the editing area (located above the comments)
      commentEditContainer.style.display = 'block';
      commentEditInput.focus();
  }

  async function handleCommentEditSubmit(event) {
    event.preventDefault();

    const submitButton = commentEditForm.querySelector(".post-button");
    const commentId = parseInt(editingCommentIdInput.value);
    const content = commentEditInput.value.trim();
    
    if (content.length < 5) {
        displayMessage("Comment must be at least 5 characters long.", "error");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    const postData = {
      comment_id: commentId,
      content: content,
    };
    
    try {
      const response = await fetch("update_comment.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success) {
        // Find the comment element and update its content
        const commentBodyElement = document.getElementById(`comment-body-${commentId}`);
        if (commentBodyElement) {
            const newContentHtml = data.new_content.replace(/\n/g, "<br>");
            commentBodyElement.innerHTML = newContentHtml;
            
            // Update the data attribute on the original edit button
            const commentElement = commentsContainer.querySelector(`[data-comment-id="${commentId}"]`);
            const editBtn = commentElement?.querySelector('.edit-comment-btn');
            if(editBtn) editBtn.setAttribute('data-comment-content', data.new_content);
        }
        
        displayMessage("Comment updated successfully!", "success");
        cancelCommentEdit(); // Hide and reset the form

      } else {
        displayMessage(
          `Failed to update comment: ${data.message || "Unknown server error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Comment update submission failed:", error);
      displayMessage(`A network error occurred: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Save Changes";
    }
  }

  async function handleDeleteCommentClick(event) {
      const commentId = event.currentTarget.getAttribute('data-comment-id');

      if (!confirm("Are you sure you want to delete this reply?")) {
          return;
      }
      
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "Deleting...";

      try {
          const response = await fetch("delete_comment.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ comment_id: parseInt(commentId) }),
          });

          const data = await response.json();
          
          if (data.success) {
              // Remove the entire comment element from the DOM
              const commentElement = button.closest('.comment-post');
              if (commentElement) commentElement.remove();
              
              displayMessage("Comment deleted successfully!", "success");
              cancelCommentEdit(); // Clear editor if the deleted comment was being edited

              // Check if the container is now empty
              if (commentsContainer.querySelector('.comment-post') === null) {
                 commentsContainer.innerHTML = '<p class="no-comments">Be the first to reply to this thread!</p>';
              }
          } else {
              displayMessage(
                  `Failed to delete comment: ${data.message || "Unknown server error"}`,
                  "error"
              );
              button.disabled = false;
              button.textContent = "Delete";
          }

      } catch (error) {
          console.error("Comment deletion failed:", error);
          displayMessage(`A network error occurred: ${error.message}`, "error");
      }
  }

  /**
   * Handles the form submission for a new thread reply.
   */
  async function handleReplySubmit(event) {
    event.preventDefault();

    const currentThreadId = urlParams.get("id");
    const submitButton = replyForm.querySelector(".post-button");
    const content = replyInput.value.trim();

    if (!currentThreadId || content.length < 5) {
      displayMessage("Reply must be at least 5 characters long.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Posting...";

    const postData = {
      thread_id: parseInt(currentThreadId),
      content: content, 
    };

    try {
      const response = await fetch("post_thread_reply.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success && data.comment_data) {
        displayMessage("Reply posted successfully!", "success");

        // comment_data must contain comment_id and user_id for createCommentElement to work
        const newCommentElement = createCommentElement(data.comment_data); 

        const noCommentsMessage = commentsContainer.querySelector(".no-comments");
        if (noCommentsMessage) noCommentsMessage.remove();

        commentsContainer.prepend(newCommentElement);
        replyForm.reset();
      } else {
        displayMessage(
          `Failed to post reply: ${data.message || "Unknown server error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Reply submission failed:", error);
      displayMessage(`A network error occurred: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Post Reply";
    }
  }

  /**
   * Fetches the main thread and comments from the backend.
   */
  function fetchThreadData(id) {
    fetch(`get_thread_details.php?id=${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          // Pass current_user_id from the PHP response to renderThread
          renderThread(data.data.thread, data.data.comments, data.data.current_user_id); 
        } else {
          titleElement.textContent = "Thread Not Found";
          postBodyElement.innerHTML = `<p>${
            data.message || "The thread could not be loaded."
          }</p>`;
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        titleElement.textContent = "Connection Error";
        postBodyElement.innerHTML = `<p class="error">Failed to load thread data: ${error.message}</p>`;
      });
  }

  // Initiate the data fetch
  fetchThreadData(threadId);
});