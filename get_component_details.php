<?php
include 'db_connect.php';

// Check if component_id is set
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid component ID."]);
    exit();
}

$component_id = $_GET['id'];

// 1. Fetch Component Details
// UPDATED: Added image_url to the selection list
$sql_component = "SELECT id, name, category, description, upload_date, download_link, image_url FROM components WHERE id = ?";
$stmt_component = $conn->prepare($sql_component);
$stmt_component->bind_param("i", $component_id);
$stmt_component->execute();
$result_component = $stmt_component->get_result();
$component = $result_component->fetch_assoc();
$stmt_component->close();

if (!$component) {
    http_response_code(404);
    echo json_encode(["error" => "Component not found."]);
    exit();
}

// 2. Fetch Comments for the Component
$sql_comments = "SELECT username, rating, comment_text, post_date FROM comments WHERE component_id = ? ORDER BY post_date DESC";
$stmt_comments = $conn->prepare($sql_comments);
$stmt_comments->bind_param("i", $component_id);
$stmt_comments->execute();
$result_comments = $stmt_comments->get_result();

$comments = array();
while ($row = $result_comments->fetch_assoc()) {
    // Format date for display
    $row['post_date'] = date('Y-m-d', strtotime($row['post_date']));
    $comments[] = $row;
}
$stmt_comments->close();

// Combine data into a single response
$response = [
    "details" => $component,
    "comments" => $comments
];

echo json_encode($response);

$conn->close();
