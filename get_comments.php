<?php
include 'db_connect.php';

$sql = "SELECT id, name, category, brief, icon_class FROM components ORDER BY upload_date DESC";
$result = $conn->query($sql);

$components = array();

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $components[] = $row;
    }
}

echo json_encode($components);

$conn->close();
?>