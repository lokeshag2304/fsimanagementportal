<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$products = \App\Models\Product::all();
$out = [];
foreach($products as $p) {
    global $out;
    $dec = \App\Services\CryptService::decryptData($p->name) ?? $p->name;
    $out[] = ['id' => $p->id, 'name' => $dec];
}
echo json_encode($out, JSON_PRETTY_PRINT);
