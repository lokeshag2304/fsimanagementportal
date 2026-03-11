<?php

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/secure/dashboard/counting");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
$headers = array();
$headers[] = "Content-Type: application/json";
// Add dummy token if needed, or maybe it returns 401. Let's just create a basic Laravel command or shell.
$result = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
}
curl_close($ch);
echo $result;
