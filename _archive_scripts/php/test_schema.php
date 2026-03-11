<?php
require 'C:/xampp/htdocs/SubscriptionBackup/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/SubscriptionBackup/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = \Illuminate\Support\Facades\Schema::getColumnListing('domains');
echo json_encode($columns, JSON_PRETTY_PRINT);
