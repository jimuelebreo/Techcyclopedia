<?php
// logout.php - Destroys the user session and returns a JSON status.

// Set headers to prevent caching
header("Cache-Control: no-cache, must-revalidate");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
header('Content-Type: application/json'); // <-- NEW: Set JSON header

// Start the session (crucial for accessing session variables)
session_start();

// Unset all session variables
$_SESSION = array();

// Destroy the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();

// *** CRITICAL CHANGE: Return a JSON success object ***
echo json_encode(['success' => true, 'message' => 'Logged out successfully.']); 
exit();
?>