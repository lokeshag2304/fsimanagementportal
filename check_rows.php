<?php
$conn = new mysqli("127.0.0.1", "root", "", "fsi_subscription_portal");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$result = $conn->query("SELECT id, email FROM superadmins LIMIT 10");
if ($result) {
    while($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id'] . " | Email: " . $row['email'] . "\n";
    }
} else {
    echo "Query failed: " . $conn->error;
}
$conn->close();
?>
