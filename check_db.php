<?php
$output = "";
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=fsi_subscription_portal', 'root', '');
    $tables = ['user_management', 'emails', 'subscriptions', 's_s_l_s', 'domains', 'hostings'];
    foreach ($tables as $table) {
        $output .= "--- Table: $table ---\n";
        try {
            $stmt = $pdo->query("DESCRIBE `$table` ");
            if (!$stmt) {
                $output .= "Table not found or error.\n";
                continue;
            }
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $output .= "{$row['Field']} | {$row['Type']}\n";
            }
        } catch (Exception $e) {
            $output .= "Error: " . $e->getMessage() . "\n";
        }
        $output .= "\n";
    }
} catch (Exception $e) {
    $output .= "Connection Error: " . $e->getMessage() . "\n";
}
file_put_contents('db_schema.txt', $output);
echo "Output written to db_schema.txt\n";
