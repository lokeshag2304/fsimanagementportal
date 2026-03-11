const fs = require('fs');
const path = 'C:\\xampp\\htdocs\\SubscriptionBackup\\app\\Http\\Controllers\\SSLController.php';

let content = fs.readFileSync(path, 'utf8');

// Use a simpler approach
const newMap = `
            ->map(function ($sub) {
                return [
                    'id'             => $sub->id,
                    'domain_name'    => $sub->product->name ?? 'N/A',
                    'client'         => $sub->client->name ?? 'N/A',
                    'product'        => $sub->product->name ?? 'N/A',
                    'vendor'         => $sub->vendor->name ?? 'N/A',
                    'amount'         => $sub->amount,
                    'renewal_date'   => $sub->renewal_date   ?? null,
                    'deletion_date'  => $sub->deletion_date  ?? null,
                    'days_to_delete' => $sub->days_to_delete ?? 0,
                    'status'         => $sub->status,
                    'remarks'        => $sub->remarks,
                    'last_updated'   => $sub->updated_at,
                ];
            });
`;

content = content.replace(/->map\(function \(\$sub\) \{[\s\S]+?\}\);/m, newMap.trim() + ';');

fs.writeFileSync(path, content);
console.log('SSL Controller simplified.');
