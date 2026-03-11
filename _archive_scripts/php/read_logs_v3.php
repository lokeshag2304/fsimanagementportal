<?php
$logPath = 'C:/xampp/htdocs/SubscriptionBackup/storage/logs/laravel.log';
if (file_exists($logPath)) {
    $content = file_get_contents($logPath);
    $last_part = substr($content, -5000);
    echo $last_part;
} else {
    echo "Log file not found at " . $logPath;
}
