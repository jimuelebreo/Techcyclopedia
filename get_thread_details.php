<?php
// =================================================================
// get_thread_details.php - Fetches a single forum thread and its comments
// =================================================================

header('Content-Type: application/json');
require 'db_config.php'; // Assumes this provides the $pdo object

// 1. Get and Validate Thread ID
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing or invalid thread ID.']);
    exit();
}

$thread_id = (int)$_GET['id'];

try {
    // Start session and get current user ID for authorization
    session_start();
    $current_user_id = isset($_SESSION['user_id']) && is_numeric($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;

    // --- A. Fetch Main Thread Details ---
    $thread_sql = "SELECT 
                        t.thread_id, 
                        t.title, 
                        t.content, 
                        t.created_at,
                        t.user_id,          -- NEW: Thread Author ID
                        u.username AS author
                    FROM 
                        forum_threads t
                    JOIN 
                        user_table u ON t.user_id = u.user_id
                    WHERE 
                        t.thread_id = ?
                    LIMIT 1";

    $thread_stmt = $pdo->prepare($thread_sql);
    $thread_stmt->execute([$thread_id]);
    $thread = $thread_stmt->fetch();

    if (!$thread) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Thread not found.']);
        exit();
    }

    // --- B. Fetch Comments/Replies for this Thread ---
    $comments_sql = "SELECT 
                      c.comment_id, 
                      c.body AS comment_body, 
                      c.created_at AS comment_date,
                      c.user_id,             -- NEW: Comment Author ID
                      u.username AS author
                  FROM 
                      thread_comments c
                  JOIN 
                      user_table u ON c.user_id = u.user_id
                  WHERE 
                      c.thread_id = ?
                  ORDER BY 
                      c.created_at DESC";

    $comments_stmt = $pdo->prepare($comments_sql);
    $comments_stmt->execute([$thread_id]);
    $comments = $comments_stmt->fetchAll();

    // --- C. Success Response ---
    echo json_encode([
        'success' => true,
        'data' => [
            'thread' => $thread,
            'comments' => $comments,
            'current_user_id' => $current_user_id // IMPORTANT: Pass to JS
        ]
    ]);
} catch (PDOException $e) {
    error_log("Database Error in get_thread_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while fetching thread details.']);
}
?>