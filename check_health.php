<?php
$conn = new mysqli("127.0.0.1", "root", "", "fsi_subscription_portal");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Checking superadmins table...\n";
$result = $conn->query("CHECK TABLE superadmins");
if ($result) {
    while($row = $result->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "Check failed: " . $conn->error;
}
$conn->close();
?>
