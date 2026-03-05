export const normalizeId = (value: any) => {
    if (!value) return null;
    if (typeof value === "object") {
        return value.value ?? value.id ?? null;
    }
    return value;
};

export const normalizeEntityPayload = (row: any) => ({
    product_id: normalizeId(row.product_id || row.product),
    client_id: normalizeId(row.client_id || row.client),
    vendor_id: normalizeId(row.vendor_id || row.vendor),
    domain_id: normalizeId(row.domain_id || row.domain),
    name: row.name || row.domain_name || null,

    amount: row.amount ?? row.counter_count ?? 0,
    renewal_date: row.renewal_date || row.valid_till || row.expiry_date,
    expiry_date: row.expiry_date || row.renewal_date || row.valid_till,
    valid_till: row.valid_till || row.renewal_date || row.expiry_date,
    deletion_date: row.deletion_date,
    status: row.status,
    remarks: row.remarks,
    domain_protected: row.domain_protected
});
