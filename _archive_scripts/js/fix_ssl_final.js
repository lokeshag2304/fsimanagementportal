const fs = require('fs');
const path = 'C:\\xampp\\htdocs\\SubscriptionBackup\\app\\Http\\Controllers\\SSLController.php';

let content = fs.readFileSync(path, 'utf8');

const regex = /public function index\(\)[\s\S]+?return response\(\)->json\(\[\s*'status' => true,\s*'data'\s+=> \$records,\s*\]\);\s*\}/m;

const newIndex = `public function index()
    {
        $records = Subscription::with(['product', 'vendor', 'client'])
            ->whereIn('product_id', $this->productIds)
            ->latest()
            ->get()
            ->map(function ($sub) {
                // Safely convert everything to valid UTF-8
                $domainName = mb_convert_encoding($sub->product->name ?? 'N/A', 'UTF-8', 'UTF-8');
                $clientName = mb_convert_encoding($sub->client->name ?? 'N/A', 'UTF-8', 'UTF-8');
                $vendorName = mb_convert_encoding($sub->vendor->name ?? 'N/A', 'UTF-8', 'UTF-8');
                $remarks = mb_convert_encoding($sub->remarks ?? '', 'UTF-8', 'UTF-8');

                return [
                    'id'             => $sub->id,
                    'domain_name'    => $domainName,
                    'client'         => $clientName,
                    'product'        => $domainName,
                    'vendor'         => $vendorName,
                    'amount'         => $sub->amount,
                    'renewal_date'   => $sub->renewal_date   ?? null,
                    'deletion_date'  => $sub->deletion_date  ?? null,
                    'days_to_delete' => $sub->days_to_delete ?? 0,
                    'status'         => $sub->status,
                    'remarks'        => $remarks,
                    'last_updated'   => $sub->updated_at,
                ];
            });

        return response()->json([
            'status' => true,
            'data'   => $records,
        ]);
    }`;

content = content.replace(regex, newIndex);

fs.writeFileSync(path, content);
console.log('SSL Controller fixed with clean map and whereIn filter.');
