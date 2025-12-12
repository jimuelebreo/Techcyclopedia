<?php
// delete_thread.php - Handles deleting the main thread post and its comments.
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

if (empty($data['thread_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing thread ID.']);
    exit();
}

$thread_id = (int)$data['thread_id'];

// --- 2. AUTHENTICATION & AUTHORIZATION ---
session_start();

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete a thread.']);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

try {
    $pdo->beginTransaction();

    // Check if the current user is the author of the thread
    $check_sql = "SELECT user_id FROM forum_threads WHERE thread_id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$thread_id]);
    $thread_author = $check_stmt->fetchColumn();

    if (!$thread_author) {
        $pdo->commit(); 
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Thread not found.']);
        exit();
    }

    if ($thread_author != $user_id) {
        $pdo->rollBack();
        http_response_code(403); 
        echo json_encode(['success' => false, 'message' => 'You do not have permission to delete this thread.']);
        exit();
    }

    // --- 3. Delete Comments First (or relies on CASCADE if defined in schema) ---
    // Explicitly delete comments for robustness
    $delete_comments_sql = "DELETE FROM thread_comments WHERE thread_id = ?";
    $stmt_comments = $pdo->prepare($delete_comments_sql);
    $stmt_comments->execute([$thread_id]);

    // --- 4. Delete Main Thread Post ---
    $delete_thread_sql = "DELETE FROM forum_threads WHERE thread_id = ? AND user_id = ?";
    $stmt_thread = $pdo->prepare($delete_thread_sql);
    $success = $stmt_thread->execute([$thread_id, $user_id]);

    if ($success && $stmt_thread->rowCount() > 0) {
        $pdo->commit();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Thread and all replies deleted successfully!'
        ]);
    } else {
        $pdo->rollBack();
        throw new PDOException("Thread deletion failed.");
    }

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Database Error in delete_thread.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while deleting the thread.']);
}
?>