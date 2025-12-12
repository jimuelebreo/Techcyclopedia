<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
// Set headers for JSON response
header('Content-Type: application/json');

// --- 1. Database Connection (Using PDO for consistency) ---
require 'db_config.php'; // Provides the $pdo object

// --- 2. Check for POST Request and Get Input Data ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Only POST requests are allowed."]);
    exit();
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

$title_key = 'post-title';
$content_key = 'post-body';

// Check if both title and content are present
if (empty($data[$title_key]) || empty($data[$content_key])) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Missing post title or content."]);
    exit();
}

$title = trim($data[$title_key]);
$content = trim($data[$content_key]);

// Basic content validation
if (strlen($title) < 5 || strlen($content) < 10) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Title must be at least 5 characters and content at least 10 characters."]);
    exit();
}

// --- 3. User Authentication (REMOVED HARDCODED USER ID) ---
session_start();

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to post a thread.']);
    exit();
}

$user_id = (int)$_SESSION['user_id'];

try {
    // --- 4. Prepare and Execute SQL Statement ---
    // SQL must now include the `user_id` column
    $sql = "INSERT INTO forum_threads (user_id, title, content) VALUES (?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    
    // Execute: [user_id (int), title (string), content (string)]
    $success = $stmt->execute([$user_id, $title, $content]);

    if ($success) {
        // Success response
        $new_thread_id = $pdo->lastInsertId();
        http_response_code(201); // Created
        echo json_encode([
            "success" => true,
            "message" => "Thread posted successfully!",
            "thread_id" => $new_thread_id,
            "title" => $title
        ]);
    } else {
        throw new PDOException("Insertion failed.");
    }

} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Database Error in post_forum_thread.php: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(["success" => false, "message" => "A database error occurred. Please try again later."]);
}
?>