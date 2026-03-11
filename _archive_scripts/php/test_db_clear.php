<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$latest = \App\Models\ImportHistory::orderBy('created_at', 'desc')->first();
if ($latest) {
    echo "ID: " . $latest->id . "\n";
    echo "File: " . ($latest->duplicate_file ?? 'NULL') . "\n";
}
