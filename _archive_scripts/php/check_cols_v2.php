<?php
$conn = new mysqli('localhost', 'root', '', 'fsi_subscription_portal');
$res = $conn->query("DESCRIBE emails");
while($row = $res->fetch_assoc()) echo "EMAIL: " . $row['Field'] . "\n";
$res = $conn->query("DESCRIBE hostings");
while($row = $res->fetch_assoc()) echo "HOSTING: " . $row['Field'] . "\n";
