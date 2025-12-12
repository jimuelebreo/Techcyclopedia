<?php
// authenticate.php - REVISED to handle AJAX/JSON and return JSON responses
session_start();
require 'db_config.php';

// Set header for JSON response
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

// --- 1. Read JSON input from the request body (Instead of $_POST) ---
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Error: Please enter both username and password.']);
    exit();
}

try {
    // 2. Find User by Username
    $stmt = $pdo->prepare("SELECT user_id, username, password_hash FROM user_table WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    // 3. Verify Password
    if ($user && password_verify($password, $user['password_hash'])) {
        // Login Success - Set Session Variables
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        
        // **SUCCESS RESPONSE: Return JSON**
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Login successful.']);
        exit();
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        exit();
    }

} catch (PDOException $e) {
    // Return a generic database error message
    error_log("Database Error in authenticate.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A database error occurred during login. Please try again.']);
    exit();
}
?>