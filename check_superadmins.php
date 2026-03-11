<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = \Illuminate\Support\Facades\Schema::getColumnListing('superadmins');
echo "Columns: " . implode(', ', $columns) . "\n";

$badRecords = \Illuminate\Support\Facades\DB::table('superadmins')
    ->where('email', 'LIKE', '%import.local%')
    ->get();

echo "Bad Records Count: " . $badRecords->count() . "\n";
foreach ($badRecords as $r) {
    $decName = \App\Services\CryptService::decryptData($r->name) ?? $r->name;
    echo "ID: {$r->id} | Name: {$decName} | LoginType: {$r->login_type}\n";
}
