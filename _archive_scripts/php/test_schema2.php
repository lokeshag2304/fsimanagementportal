<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$cols = \Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM domains');
$out = [];
foreach($cols as $c) {
    global $out;
    $out[$c->Field] = $c->Null;
}
echo json_encode($out, JSON_PRETTY_PRINT);
