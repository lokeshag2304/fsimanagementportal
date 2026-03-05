@echo off
echo Running FK fix migration...
cd /d "C:\xampp\htdocs\SubscriptionBackup"
php artisan migrate --path="database/migrations/2026_02_26_200000_fix_client_id_fk_to_superadmins.php" --force
echo Done.
pause
