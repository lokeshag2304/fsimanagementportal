<?php
$conn = new mysqli('localhost', 'root', '', 'fsi_subscription_portal');
if ($conn->connect_error) die('FAIL');
$tables = ['emails', 'hostings', 's_s_l_s'];
foreach ($tables as $t) {
    echo "$t: ";
    $res = $conn->query("DESCRIBE $t");
    $cols = [];
    while($row = $res->fetch_assoc()) $cols[] = $row['Field'];
    echo implode(', ', $cols) . "\n";
}
