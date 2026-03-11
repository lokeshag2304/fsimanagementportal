<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$item = \App\Models\ImportHistory::find(14);
if ($item) {
    echo "ID: " . $item->id . "\n";
    echo "File: " . ($item->duplicate_file ?? 'NULL') . "\n";
    echo "Dups: " . $item->duplicates_count . "\n";
}
