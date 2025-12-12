<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

// --- 1. START SESSION & AUTHENTICATION CHECK ---
session_start();

// Check if user_id is set in the session. If not, the user is not logged in.
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["success" => false, "message" => "Unauthorized access. Please log in."]);
    exit();
}

// --- 2. Define the User ID to fetch (Using Session ID) ---
$user_id = $_SESSION['user_id']; // CRITICAL CHANGE: Use session ID

// --- 3. Database Connection ---
function db_connect() {
    $servername = "localhost";
    $username = "root"; 
    $password = "";     
    $dbname = "component_management_db"; 

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
        exit();
    }
    return $conn;
}

$conn = db_connect();

// --- 4. Fetch User Profile Data ---
$sql_user = "SELECT username, DATE_FORMAT(created_at, '%Y-%m-%d') as member_since_date, is_admin FROM user_table WHERE user_id = ?"; // ADDED is_admin
$user_data = [];

if ($stmt_user = $conn->prepare($sql_user)) {
    $stmt_user->bind_param("i", $user_id); 
    $stmt_user->execute();
    $result_user = $stmt_user->get_result();

    if ($user = $result_user->fetch_assoc()) {
        $user_data = [
            "username" => htmlspecialchars($user['username']),
            "member_since" => $user['member_since_date'],
            "is_admin" => (int)$user['is_admin'] // CRITICAL: Add admin status
        ];
    } else {
        $conn->close();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }
    $stmt_user->close();
} else {
    $conn->close();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error preparing user query: " . $conn->error]);
    exit();
}

// --- 5. Fetch User Activity Data (Thread Count) ---
$sql_count = "SELECT COUNT(*) as thread_count FROM forum_threads WHERE user_id = ?"; 
$thread_count = 0;

if ($stmt_count = $conn->prepare($sql_count)) {
    $stmt_count->bind_param("i", $user_id);
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $count_row = $result_count->fetch_assoc();
    $thread_count = $count_row['thread_count'];
    $stmt_count->close();
}

// --- 6. Fetch Bookmarked Components ---
$sql_bookmarks = "SELECT 
                    c.id, 
                    c.name, 
                    c.category, 
                    c.brief 
                  FROM bookmarks b
                  JOIN components c ON b.component_id = c.id
                  WHERE b.user_id = ?
                  ORDER BY c.name ASC"; // Order by component name

$bookmarks = array();
if ($stmt_bookmarks = $conn->prepare($sql_bookmarks)) {
    $stmt_bookmarks->bind_param("i", $user_id);
    $stmt_bookmarks->execute();
    $result_bookmarks = $stmt_bookmarks->get_result();

    while ($row = $result_bookmarks->fetch_assoc()) {
        $bookmarks[] = $row;
    }
    $stmt_bookmarks->close();
} else {
    // Handle error but don't stop execution
    error_log("Error preparing bookmark query: " . $conn->error);
}

// --- 7. Final JSON Response (FIXED structure) ---
// Combine user data and thread count into a 'user' object for clarity
$user_profile = array_merge($user_data, [
    "thread_count" => $thread_count,
]);

// Construct the final response structure that the JavaScript expects:
$response = [
    "success" => true,
    "data" => [
        "user" => $user_profile,
        "activity" => [], // Keeping this key consistent, even if empty
        "bookmarks" => $bookmarks // CRITICAL: This is now nested under 'data'
    ]
];

$conn->close();
echo json_encode($response);

// Ensure the structure looks like this:
/*
{
    "success": true,
    "data": {
        "user": {
            "username": "...",
            "member_since": "...",
            "is_admin": 0,
            "thread_count": 5
        },
        "activity": [],
        "bookmarks": [
            { "id": 1, "name": "...", "category": "..." },
            // ...
        ]
    }
}
*/