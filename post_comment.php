<?php
// submit_comment.php
include 'db_connect.php'; // Provides the $conn object

// Set headers for JSON response and allow cross-origin requests
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// 1. Read JSON data from the request body
$data = json_decode(file_get_contents("php://input"));

// 2. Validate input data (Now includes user_id)
if (empty($data->component_id) || !is_numeric($data->component_id) || 
    empty($data->user_id) || !is_numeric($data->user_id) || // <--- ADDED VALIDATION
    empty($data->rating) || !is_numeric($data->rating) || 
    empty($data->comment_text)) {
    
    http_response_code(400);
    echo json_encode(["error" => "Incomplete or invalid data provided."]);
    exit();
}

$component_id = $data->component_id;
$user_id = $data->user_id; // <--- NEW VARIABLE
$rating = $data->rating;
$comment_text = $data->comment_text;

// The JS sends a placeholder username, we will use it
$username = isset($data->username) ? $data->username : 'Anonymous User'; 

// 3. Prepare the SQL statement for insertion (Now includes user_id and post_date)
$sql = "INSERT INTO comments (component_id, user_id, username, rating, comment_text, post_date) 
        VALUES (?, ?, ?, ?, ?, NOW())"; // <--- CORRECTED SQL QUERY

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["error" => "SQL preparation failed: " . $conn->error]);
    exit();
}

// 'iisss' means: Integer, Integer, String, Integer, String
$stmt->bind_param("iisss", $component_id, $user_id, $username, $rating, $comment_text); // <--- CORRECTED BIND PARAMETERS

// 4. Execute the statement
if ($stmt->execute()) {
    http_response_code(201); // 201 Created
    echo json_encode(["message" => "Comment posted successfully!"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to post comment to database: " . $stmt->error]);
}

// 5. Clean up
$stmt->close();
$conn->close();
?>