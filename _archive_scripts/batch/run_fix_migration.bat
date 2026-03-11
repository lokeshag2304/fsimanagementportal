@echo off
cd /d "C:\xampp\htdocs\SubscriptionBackup"
php artisan migrate --force > C:\xampp\htdocs\fsimanagementportal\migration_output.txt 2>&1
echo Done.
