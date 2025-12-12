<?php
// Start the session at the very beginning
session_start();

include 'db_connect.php'; // Provides $conn object

// Set headers for JSON response
header("Content-Type: application/json; charset=UTF-8");

// 1. **CRITICAL CHANGE: Check for authenticated user ID**
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["error" => "User not authenticated."]);
    exit();
}
// Get the user ID from the session
$user_id = $_SESSION['user_id']; 

// 2. Get JSON data from the request body
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->component_id) || !is_numeric($data->component_id)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid component ID."]);
    exit();
}

$component_id = $data->component_id;

// 3. Check if the bookmark already exists
$check_sql = "SELECT 1 FROM bookmarks WHERE user_id = ? AND component_id = ?";
$stmt_check = $conn->prepare($check_sql);
$stmt_check->bind_param("ii", $user_id, $component_id);
$stmt_check->execute();
$result_check = $stmt_check->get_result();
$is_currently_bookmarked = ($result_check->num_rows > 0);
$stmt_check->close();

$new_status = false; // Default new status

if ($is_currently_bookmarked) {
    // 4A. Bookmark exists, so DELETE it (Un-bookmark)
    $delete_sql = "DELETE FROM bookmarks WHERE user_id = ? AND component_id = ?";
    $stmt_delete = $conn->prepare($delete_sql);
    $stmt_delete->bind_param("ii", $user_id, $component_id);
    $stmt_delete->execute();
    $stmt_delete->close();
    
    $new_status = false;
    
    http_response_code(200);
    echo json_encode(["message" => "Un-bookmarked successfully.", "is_bookmarked" => $new_status]);
    
} else {
    // 4B. Bookmark does not exist, so INSERT it (Bookmark)
    $insert_sql = "INSERT INTO bookmarks (user_id, component_id) VALUES (?, ?)";
    $stmt_insert = $conn->prepare($insert_sql);
    $stmt_insert->bind_param("ii", $user_id, $component_id);
    $stmt_insert->execute();
    $stmt_insert->close();
    
    $new_status = true;
    
    http_response_code(201);
    echo json_encode(["message" => "Bookmarked successfully.", "is_bookmarked" => $new_status]);
}

$conn->close();
?>