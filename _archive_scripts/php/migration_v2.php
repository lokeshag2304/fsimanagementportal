<?php
$conn = new mysqli('localhost', 'root', '', 'fsi_subscription_portal');
$queries = [
    "ALTER TABLE emails ADD COLUMN IF NOT EXISTS domain_id INT AFTER product_id",
    "ALTER TABLE emails ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1 AFTER vendor_id",
    "ALTER TABLE emails ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) AFTER quantity",
    "ALTER TABLE emails ADD COLUMN IF NOT EXISTS start_date DATE AFTER bill_type",
    "ALTER TABLE hostings ADD COLUMN IF NOT EXISTS domain_id INT AFTER product_id",
    "ALTER TABLE hostings ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) AFTER amount",
    "ALTER TABLE hostings ADD COLUMN IF NOT EXISTS start_date DATE AFTER bill_type",
];
foreach ($queries as $q) {
    if ($conn->query($q)) echo "SUCCESS: $q\n";
    else echo "FAIL: " . $conn->error . "\n";
}
