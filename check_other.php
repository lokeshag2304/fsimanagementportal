<?php
$conn = new mysqli("127.0.0.1", "root", "", "fsi_subscription_portal");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$result = $conn->query("SELECT COUNT(*) as count FROM setting");
if ($result) {
    $row = $result->fetch_assoc();
    echo "Setting Count: " . $row['count'];
} else {
    echo "Query failed: " . $conn->error;
}
$conn->close();
?>
