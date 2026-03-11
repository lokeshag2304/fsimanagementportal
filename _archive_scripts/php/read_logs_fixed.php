<?php
$logPath = 'C:/xampp/htdocs/SubscriptionBackup/storage/logs/laravel.log';
if (file_exists($logPath)) {
    $lines = file($logPath);
    $lastLines = array_slice($lines, -100);
    echo implode("", $lastLines);
} else {
    echo "Log file not found at " . $logPath;
}
