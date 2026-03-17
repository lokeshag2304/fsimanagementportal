<?php
$conn = new mysqli("127.0.0.1", "root", "", "fsi_subscription_portal");
if ($conn->connect_error) { die("Connection failed: " . $conn->connect_error); }

$tables = ['subscriptions', 'products', 'superadmins', 'vendors', 'remark_histories'];
foreach ($tables as $table) {
    if ($res = $conn->query("SELECT COUNT(*) as cnt FROM $table")) {
        $row = $res->fetch_assoc();
        echo "Table $table: " . $row['cnt'] . "\n";
    }
}
$conn->close();
?>
