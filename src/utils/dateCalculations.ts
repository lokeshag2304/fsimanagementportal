export const calculateDaysToDelete = (renewalDateStr?: string | null, deletionDateStr?: string | null): { days: number | string, error: string | null } => {
    if (!deletionDateStr) {
        return { days: "", error: null };
    }

    const deletionDate = new Date(deletionDateStr);

    if (isNaN(deletionDate.getTime())) {
        return { days: "", error: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deletionDate.setHours(0, 0, 0, 0);

    const diffTime = deletionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: "", error: "Deletion date cannot be in the past." };
    }

    return { days: diffDays, error: null };
};

export const calculateDaysLeft = (renewalDateStr?: string | null): { days: number | string, error: string | null } => {
    if (!renewalDateStr) {
        return { days: "", error: null };
    }

    const renewalDate = new Date(renewalDateStr);

    if (isNaN(renewalDate.getTime())) {
        return { days: "", error: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);

    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { days: diffDays, error: null };
};

export const getDaysToColor = (days: number | string | null | undefined): string => {
    if (days === null || days === undefined || days === "") return "text-gray-300";
    const numDays = Number(days);
    if (isNaN(numDays)) return "text-gray-300";

    if (numDays < 10) return "text-red-500 font-medium";
    if (numDays <= 20) return "text-yellow-500 font-medium";
    return "text-green-500 font-medium";
};

export const handleDateChangeLogic = (
    field: string,
    value: any,
    currentRenewal: string | null | undefined,
    currentDeletion: string | null | undefined,
    toast: any
): { days_to_delete?: number | string | null, days_left?: number | string | null } | null => {
    if (field !== "renewal_date" && field !== "deletion_date" && field !== "expiry_date") {
        return null;
    }

    const newDeletion = field === "deletion_date" ? value : currentDeletion;
    const newRenewal = (field === "renewal_date" || field === "expiry_date") ? value : currentRenewal;

    if (field === "deletion_date") {
        if (!newDeletion) {
            return { days_to_delete: "" };
        }

        const { days, error } = calculateDaysToDelete(null, newDeletion);
        if (error && value) {
            if (toast) {
                toast({ title: "Validation Error", description: error, variant: "destructive" });
            }
        }
        return { days_to_delete: days };
    }

    if (field === "renewal_date" || field === "expiry_date") {
        if (!newRenewal) {
            return { days_left: "" };
        }

        const { days, error } = calculateDaysLeft(newRenewal);
        return { days_left: days };
    }

    return null;
};
