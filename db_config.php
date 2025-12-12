<?php
// =================================================================
// db_config.php - Database Connection Setup
// =================================================================

// 1. Connection Parameters (Default XAMPP Settings)
$host = 'localhost';
$db   = 'component_management_db'; // Must match the name you created
$user = 'root'; 
$pass = '';     // Default XAMPP MySQL password is empty
$charset = 'utf8mb4';

// 2. Data Source Name (DSN)
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// 3. Connection Options
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// 4. Establish the Connection
try {
     // $pdo is the global connection object
     // The parameters are: DSN, Username, Password, Options
     $pdo = new PDO($dsn, $user, $pass, $options);
     
} catch (\PDOException $e) {
     // If connection fails, output error and stop script execution.
     // The 'die' here prevents the Fatal Error in register.php/authenticate.php
     // by ensuring $pdo is only used if connection succeeded.
     error_log("Database Connection Error: " . $e->getMessage());
     die("A critical database connection error has occurred. Please check logs.");
}
?>