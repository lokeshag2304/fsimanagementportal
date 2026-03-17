<?php
$conn = new mysqli("127.0.0.1", "root", "", "fsi_subscription_portal");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$email = 'cGZZZVpFWHFQWHVORXVhQU9rMDJpdDNwTTBxTXFjZGVUejVuUDd2OUUxDdz0=';
$sql = "SELECT id, name FROM superadmins WHERE email = '$email'";
$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "Found User: " . $row['name'] . " (ID: " . $row['id'] . ")";
} else {
    echo "User not found or query failed: " . $conn->error;
}
$conn->close();
?>
