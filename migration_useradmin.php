<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=fsi_subscription_portal', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Add columns to user_management
    $pdo->exec("ALTER TABLE user_management ADD COLUMN IF NOT EXISTS grace_period INT(11) DEFAULT 0 AFTER remarks");
    $pdo->exec("ALTER TABLE user_management ADD COLUMN IF NOT EXISTS due_date DATETIME AFTER grace_period");
    
    echo "Columns added successfully to user_management.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
