<?php
include 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
print_r(Schema::getColumnListing('user_management'));
print_r(Schema::getColumnListing('superadmins'));
