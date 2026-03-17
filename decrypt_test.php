<?php
require_once 'c:/xampp/htdocs/SubscriptionBackup/app/Services/CryptService.php';

use App\Services\CryptService;

$encrypted = 'cFgvMCszaDBIVnNncWFtM0lUV0oyd2s3NWFVcVlsc05pNXhQWjFxKy9zdz0=';
$decrypted = CryptService::decryptData($encrypted);
echo "Decrypted: " . $decrypted;
?>
