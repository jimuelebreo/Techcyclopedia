<?php
// update_comment.php - Handles updating a thread comment.
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'db_config.php'; // Assumes this provides the $pdo object

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests are allowed.']);
    exit();
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (empty($data['comment_id']) || empty($data['content'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing comment ID or content.']);
    exit();
}

$comment_id = (int)$data['comment_id'];
$content = trim($data['content']);

if (strlen($content) < 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Reply must be at least 5 characters long.']);
    exit();
}

// --- 2. AUTHENTICATION & AUTHORIZATION ---
session_start();

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to edit a comment.']);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

try {
    // --- 3. Update Comment ---
    // Update only if the user_id matches the author
    $sql = "UPDATE thread_comments SET body = ?, updated_at = NOW() WHERE comment_id = ? AND user_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$content, $comment_id, $user_id]);

    if ($success && $stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Comment updated successfully!',
            'new_content' => $content // Return the cleaned content for display update
        ]);
    } elseif ($stmt->rowCount() === 0) {
        http_response_code(403); 
        echo json_encode(['success' => false, 'message' => 'Comment not found or you do not have permission to edit it.']);
    } else {
        // This is highly unlikely for UPDATE, but included for completeness
        throw new PDOException("Update failed.");
    }

} catch (PDOException $e) {
    // TEMPORARY DEBUGGING CHANGE: Expose the specific PDO error
    error_log("Database Error in update_comment.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        // THIS MESSAGE WILL CONTAIN THE SPECIFIC SQL ERROR
        'message' => 'Database Error (Please report this): ' . $e->getMessage() 
    ]);
}
?>