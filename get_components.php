<?php
// Include the database connection script
include 'db_connect.php';

// Check for a category filter parameter
$category_filter = null;
if (isset($_GET['category']) && !empty($_GET['category'])) {
    // Sanitize the input - though prepared statements handle escaping, 
    // we take the value into a variable
    $category_filter = $_GET['category'];
}

// Base SQL query to select the necessary fields
// UPDATED: Added 'image_url' to the SELECT list
$sql = "SELECT id, name, category, brief, icon_class, image_url FROM components";

// Conditional logic for adding the WHERE clause
if ($category_filter) {
    // Add the WHERE clause and use a placeholder (?) for the category
    $sql .= " WHERE category = ?";
}

// Order the results
$sql .= " ORDER BY upload_date DESC";

$components = array();

// Prepare the statement to safely handle the category parameter
$stmt = $conn->prepare($sql);

if ($category_filter) {
    // Bind the category parameter if it exists
    // The 's' indicates the parameter is a string
    $stmt->bind_param("s", $category_filter);
}

// Execute the statement
if ($stmt->execute()) {
    $result = $stmt->get_result();

    // Loop through results and add them to the components array
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $components[] = $row;
        }
    }
    $stmt->close();
} else {
    // Handle query execution error
    http_response_code(500);
    echo json_encode(["error" => "Database query failed: " . $conn->error]);
    exit();
}

// Return the data as a JSON response
echo json_encode($components);

// Close the database connection (handled by the script exiting, but good practice)
$conn->close();
?>