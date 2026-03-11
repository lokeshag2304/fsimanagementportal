<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$clients = \Illuminate\Support\Facades\DB::table('superadmins')
    ->limit(5)
    ->get();

foreach ($clients as $c) {
    if ($c->id == 6) { // id 6 is probably the super admin
       echo "ID: {$c->id} | LoginType: {$c->login_type} (SuperAdmin?)\n";
       continue;
    }
    $decName = \App\Services\CryptService::decryptData($c->name) ?? $c->name;
    echo "ID: {$c->id} | Name: {$decName} | LoginType: {$c->login_type}\n";
}
