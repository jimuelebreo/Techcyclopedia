<?php
// upload.php - CORRECTED for Web Form submission
session_start(); // Recommended: Start session for future auth checks
require 'db_config.php'; 

// Set the response type to JSON for the JavaScript AJAX call
header('Content-Type: application/json');

// Helper function to handle errors and exit
function handle_error($message, $code = 500) {
    http_response_code($code);
    die(json_encode(["error" => $message]));
}

// --- 1. File and Data Validation (Using correct keys from admin_upload.html) ---
// File is called 'component-image' in the HTML
if (
    !isset($_FILES['component-image']) || // Corrected file key
    $_FILES['component-image']['error'] !== UPLOAD_ERR_OK ||
    !isset($_POST['component-name']) ||    // Corrected POST key
    !isset($_POST['category'])
) {
    handle_error("Required data missing (file, component name, or category).", 400);
}

// Extract data from the POST request (Using correct keys from admin_upload.html)
$component_name = $_POST['component-name'];
$description = $_POST['description'] ?? 'No description provided.'; // Corrected POST key
$category = $_POST['category'];

// Extract file information (using correct key)
$file_key = 'component-image';
$file_temp_path = $_FILES[$file_key]['tmp_name'];
$file_original_name = basename($_FILES[$file_key]['name']);
$file_extension = pathinfo($file_original_name, PATHINFO_EXTENSION);

// --- 2. File Storage ---
$upload_dir = 'uploads/components/'; 
$unique_filename = uniqid('comp_', true) . '.' . $file_extension;
$target_path = $upload_dir . $unique_filename;

// Ensure uploads directory exists and is writable
if (!is_dir($upload_dir)) {
    // Attempt to create the directory recursively
    if (!mkdir($upload_dir, 0777, true)) {
        handle_error("Failed to create the upload directory: {$upload_dir}", 500);
    }
}

if (!move_uploaded_file($file_temp_path, $target_path)) {
    handle_error("Failed to save the component file.", 500);
}

// --- 3. Database Insertion (Corrected field names to match your 'components' table) ---

// Create a brief description (Your table has a 'brief' field, required by fetch_user_data.php)
$brief = substr($description, 0, 150) . (strlen($description) > 150 ? '...' : '');

try {
    // NOTE: This assumes you will add an 'image_url' field to your table.
    // The field names 'name', 'category', 'brief', 'description', 'upload_date' are taken from your table structure.
    $sql = "INSERT INTO components 
            (name, category, brief, description, upload_date, image_url) 
            VALUES (:name, :category, :brief, :desc, NOW(), :img_path)"; // Added NOW() for upload_date
    
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':name' => $component_name,
        ':category' => $category,
        ':brief' => $brief, // Insert the generated brief
        ':desc' => $description,
        ':img_path' => $target_path // Assuming you create this 'image_url' field
    ]);

    http_response_code(201);
    echo json_encode([
        "message" => "Component **'{$component_name}'** uploaded successfully!",
        "file_path" => $target_path
    ]);

} catch (PDOException $e) {
    // If the database insert fails, delete the file to clean up
    if (file_exists($target_path)) {
        unlink($target_path);
    }
    handle_error("Database error: " . $e->getMessage(), 500);
}
?>