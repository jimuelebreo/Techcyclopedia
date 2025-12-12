<?php
include 'db_connect.php'; // Provides $conn object

// 1. Check for required GET parameters
if (!isset($_GET['component_id']) || !is_numeric($_GET['component_id']) || 
    !isset($_GET['user_id']) || !is_numeric($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid parameters."]);
    exit();
}

$component_id = $_GET['component_id'];
$user_id = $_GET['user_id'];

// 2. Query the database
$sql = "SELECT 1 FROM bookmarks WHERE user_id = ? AND component_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $user_id, $component_id);
$stmt->execute();
$result = $stmt->get_result();

// 3. Determine and return the status
$is_bookmarked = ($result->num_rows > 0);

http_response_code(200);
echo json_encode(["is_bookmarked" => $is_bookmarked]);

$stmt->close();
$conn->close();
?>