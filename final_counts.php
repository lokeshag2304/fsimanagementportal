<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$clientsCount = \Illuminate\Support\Facades\DB::table('superadmins')
    ->where('login_type', 3)
    ->count();

$adminsCount = \Illuminate\Support\Facades\DB::table('superadmins')
    ->where('login_type', 1)
    ->count();

echo "Total Clients (LoginType 3): {$clientsCount}\n";
echo "Total Admins (LoginType 1): {$adminsCount}\n";
