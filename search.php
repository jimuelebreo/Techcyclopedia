<?php
// Include the database connection script (assuming it exists and works)
include 'db_connect.php';

// Set up the response structure
header('Content-Type: application/json');
$response = ["error" => "", "results" => []];

// Check for the search query
if (!isset($_GET['query']) || empty(trim($_GET['query']))) {
    $response["error"] = "Search query is required.";
    echo json_encode($response);
    // You might choose to return all components here instead of an error, 
    // but for a focused search function, let's keep it this way.
    exit();
}

// Sanitize the input
$search_query = "%" . trim($_GET['query']) . "%"; // Add wildcards for LIKE search

// SQL query to search for component name or description (or category)
// Using prepared statements prevents SQL injection
$sql = "SELECT id, name, category, brief, icon_class 
        FROM components 
        WHERE name LIKE ? OR brief LIKE ? OR category LIKE ? 
        ORDER BY name ASC";

$stmt = $conn->prepare($sql);
// Bind the search term three times for the three LIKE clauses
$stmt->bind_param("sss", $search_query, $search_query, $search_query); 
$stmt->execute();
$result = $stmt->get_result();

$components = array();

// Loop through results and add them to the components array
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $components[] = $row;
    }
}

$response["results"] = $components;

// Return the data as a JSON response
echo json_encode($response);

// Close the database connection and statement
$stmt->close();
$conn->close();
?>