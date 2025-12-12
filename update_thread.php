<?php
// update_thread.php - Handles updating the main thread post.
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'db_config.php';

// --- 1. Setup & Input Validation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests are allowed.']);
    exit();
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (empty($data['thread_id']) || empty($data['title']) || empty($data['content'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing thread ID, title, or content.']);
    exit();
}

$thread_id = (int)$data['thread_id'];
$title = trim($data['title']);
$content = trim($data['content']);

if (strlen($title) < 5 || strlen($content) < 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Title must be at least 5 characters and content at least 10 characters.']);
    exit();
}

// --- 2. AUTHENTICATION & AUTHORIZATION ---
session_start();

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to update a thread.']);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

try {
    // Check if the current user is the author of the thread
    $check_sql = "SELECT user_id FROM forum_threads WHERE thread_id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$thread_id]);
    $thread_author = $check_stmt->fetchColumn();

    if (!$thread_author || $thread_author != $user_id) {
        http_response_code(403); 
        echo json_encode(['success' => false, 'message' => 'You do not have permission to edit this thread.']);
        exit();
    }

    // --- 3. Execute SQL UPDATE Statement ---
    $sql = "UPDATE forum_threads SET title = ?, content = ? WHERE thread_id = ? AND user_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$title, $content, $thread_id, $user_id]);

    if ($success && $stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Thread updated successfully!',
            'new_title' => $title,
            'new_content' => $content
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Thread not found or no changes made.']);
    }

} catch (PDOException $e) {
    error_log("Database Error in update_thread.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while updating the thread.']);
}
?>