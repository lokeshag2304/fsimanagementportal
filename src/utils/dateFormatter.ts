/**
 * Formats a date string to DD-MM-YYYY HH:MM:SS
 * If the input is already in a custom format or invalid, it returns the input or "--"
 */
export const formatLastUpdated = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === "--") return "--";

    // Check if it's already in DD-MM-YYYY HH:MM:SS format to avoid double formatting
    const dmyRegex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/;
    if (dmyRegex.test(dateString)) return dateString;

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const pad = (n: number) => n.toString().padStart(2, '0');

        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        return dateString;
    }
};
