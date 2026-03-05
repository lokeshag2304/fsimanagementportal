@echo off
cd /d "C:\xampp\htdocs\SubscriptionBackup"
php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); foreach(\Illuminate\Support\Facades\DB::select('DESC s_s_l_s') as \$c) echo \$c->Field . PHP_EOL;" > C:\xampp\htdocs\fsimanagementportal\ssl_columns.txt
php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); foreach(\Illuminate\Support\Facades\DB::select('DESC counters') as \$c) echo \$c->Field . PHP_EOL;" > C:\xampp\htdocs\fsimanagementportal\counters_columns.txt
