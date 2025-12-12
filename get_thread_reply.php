<?php
// post_thread_reply.php - Handles the submission of a new comment/reply.
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Use the existing PDO configuration
require 'db_config.php';

// --- 1. Basic Setup & Input Validation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests are allowed.']);
    exit();
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Check if all required data is present
if (empty($data['thread_id']) || empty($data['content'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing thread ID or reply content.']);
    exit();
}

$thread_id = (int)$data['thread_id'];
$content = trim($data['content']);

// Basic content length validation
if (strlen($content) < 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Reply must be at least 5 characters long.']);
    exit();
}

// --- 2. AUTHENTICATION ---
session_start(); 

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to post a reply.']);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

try {
    // --- 3. Prepare and Execute SQL Statement ---
    $sql = "INSERT INTO thread_comments (thread_id, user_id, body) VALUES (?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$thread_id, $user_id, $content]);

    if ($success) {
        $new_comment_id = $pdo->lastInsertId(); // Get the ID of the new comment

        // Fetch username for an immediate display update in the frontend
        $sql_user = "SELECT username FROM user_table WHERE user_id = ?";
        $stmt_user = $pdo->prepare($sql_user);
        $stmt_user->execute([$user_id]);
        $user = $stmt_user->fetch();

        http_response_code(201); // Created
        echo json_encode([
            'success' => true,
            'message' => 'Reply posted successfully!',
            'comment_data' => [
                'comment_id' => $new_comment_id, // ADDED: New comment ID
                'user_id' => $user_id,          // ADDED: User ID
                'comment_body' => $content, 
                'author' => $user['username'] ?? 'User ID ' . $user_id,
                'comment_date' => date('Y-m-d H:i:s')
            ]
        ]);
    } else {
        throw new PDOException("Insertion failed.");
    }

} catch (PDOException $e) {
    error_log("Database Error in post_thread_reply.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while posting your reply.']);
}
?>