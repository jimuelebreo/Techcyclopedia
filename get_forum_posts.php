<?php
// get_forum_posts.php - Fetches all forum threads along with the username
header('Content-Type: application/json');
require 'db_config.php'; // This file provides the $pdo connection object

try {
    // Select threads, joining with the user_table to get the username
    $sql = "SELECT 
                t.thread_id, 
                t.title, 
                t.created_at,
                u.username,
                (SELECT COUNT(*) FROM thread_comments c WHERE c.thread_id = t.thread_id) AS reply_count
            FROM 
                forum_threads t
            JOIN 
                user_table u ON t.user_id = u.user_id  -- <<< CORRECTION HERE
            ORDER BY 
                t.created_at DESC";
                
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $threads = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'threads' => $threads]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>