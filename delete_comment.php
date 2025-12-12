<?php
// delete_comment.php - Handles deleting a thread comment.
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

if (empty($data['comment_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing comment ID.']);
    exit();
}

$comment_id = (int)$data['comment_id'];

// --- 2. AUTHENTICATION & AUTHORIZATION ---
session_start();

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete a comment.']);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

try {
    // --- 3. Delete Comment ---
    // Delete only if the user_id matches the author
    $sql = "DELETE FROM thread_comments WHERE comment_id = ? AND user_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$comment_id, $user_id]);

    if ($success && $stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Comment deleted successfully!'
        ]);
    } elseif ($stmt->rowCount() === 0) {
        http_response_code(403); 
        echo json_encode(['success' => false, 'message' => 'Comment not found or you do not have permission to delete it.']);
    } else {
        throw new PDOException("Deletion failed.");
    }

} catch (PDOException $e) {
    error_log("Database Error in delete_comment.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while deleting the comment.']);
}
?>