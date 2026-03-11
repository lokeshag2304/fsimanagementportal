<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = \Illuminate\Support\Facades\Schema::getColumnListing('import_histories');
echo "Columns: " . implode(', ', $columns) . "\n";
echo "Count: " . \App\Models\ImportHistory::count() . "\n";
$latest = \App\Models\ImportHistory::orderBy('created_at', 'desc')->first();
if ($latest) {
    echo "Latest ID: {$latest->id}\n";
    echo "Duplicates: {$latest->duplicates_count}\n";
    echo "File: " . ($latest->duplicate_file ?: 'NULL') . "\n";
} else {
    echo "No records found.\n";
}
