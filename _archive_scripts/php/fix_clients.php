<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$affected = \Illuminate\Support\Facades\DB::table('superadmins')
    ->where('email', 'LIKE', '%import.local%')
    ->where('login_type', 1)
    ->update(['login_type' => 3]);

echo "Updated {$affected} records from LoginType 1 to 3.\n";
