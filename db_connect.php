<?php
// CRITICAL: Disable error display to prevent HTML warnings from breaking JSON response
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL); // Still log errors for debugging

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database credentials for XAMPP default settings
$servername = "localhost";
$username = "root";
$password = ""; // Default XAMPP password is empty

// --- CHANGE THIS LINE ---
$dbname = "component_management_db"; 
// ------------------------

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // Return an error message as JSON
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}
?>