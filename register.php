<?php
// register.php - Handles user registration from signup.html
session_start();
require 'db_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die("Invalid request method.");
}

// 1. Validate Input
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

if (empty($username) || empty($password) || empty($confirm_password)) {
    die("Error: Please fill in all required fields.");
}

if ($password !== $confirm_password) {
    die("Error: Passwords do not match.");
}

// 2. Hash Password for Security
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // 3. Check if User Exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_table WHERE username = :username");
    $stmt->execute([':username' => $username]);
    if ($stmt->fetchColumn() > 0) {
        die("Error: Username is already taken.");
    }

    // 4. Insert New User
    $sql = "INSERT INTO user_table (username, password_hash) VALUES (:username, :password_hash)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':username' => $username,
        ':password_hash' => $password_hash
    ]);

    // 5. Registration Success - Redirect
    header('Location: login.html?success=registered');
    exit();

} catch (PDOException $e) {
    die("An error occurred during registration. Please try again.");
}
?>