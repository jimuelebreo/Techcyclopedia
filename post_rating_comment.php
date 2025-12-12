<?php
// post_rating_comment.php - Handles the submission of a new rating and comment

header('Content-Type: application/json');
require 'db_config.php'; 

// IMPORTANT: This part needs a real user session check. 
// For a fully working app, you must replace this placeholder with actual login/session logic.
$user_id = 1; // Placeholder: Assume user with ID 1 is logged in for testing.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit();
}

// 1. Get and decode JSON input
$data = json_decode(file_get_contents('php://input'), true);

// 2. Validate input fields
if (!isset($data['component_id'], $data['rating'], $data['comment']) || 
    !is_numeric($data['component_id']) || 
    !is_numeric($data['rating']) || 
    empty($data['comment'])
) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'error' => 'Invalid or missing data fields.']);
    exit();
}

$component_id = (int)$data['component_id'];
$rating = (int)$data['rating'];
$comment = $data['comment'];

// 3. Insert into database using Prepared Statements (Security)
try {
    $sql = "INSERT INTO component_ratings_table 
            (component_id, user_id, rating_value, comment_text) 
            VALUES (?, ?, ?, ?)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$component_id, $user_id, $rating, $comment]);
    
    // Success response
    echo json_encode(['success' => true, 'message' => 'Post successfully recorded.']);

} catch (PDOException $e) {
    // Database error handling
    http_response_code(500);
    error_log("Post Submission Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error during submission.']);
}
?>