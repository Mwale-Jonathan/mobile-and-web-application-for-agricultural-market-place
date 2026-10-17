import { CURRENCY } from "@/constants";

export function formatPrice(price: number): string {
    return `${CURRENCY}${price.toLocaleString()}`;
}

export function formatQuantity(quantity: number, unit: string): string {
    if (quantity <= 0) return "Out of stock";
    if (quantity === 1) return `1 ${unit}`;
    return `${quantity.toLocaleString()} ${unit}s`;
}

export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    if (km < 10) return `${km.toFixed(1)}km`;
    return `${Math.round(km)}km`;
}

export function formatPhone(phone: string): string {
    return phone.replace(/(\+260)(\d{2})(\d{3})(\d{4})/, "$1 $2 $3 $4");
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZM", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function getAvailabilityLabel(status: string): string {
    switch (status) {
        case "available":
            return "Available";
        case "limited":
            return "Limited Stock";
        case "sold_out":
            return "Sold Out";
        case "hidden":
            return "Hidden";
        default:
            return status;
    }
}

export function getWhatsAppUrl(phone: string, message?: string): string {
    const cleaned = phone.replace(/[^0-9]/g, "");
    const msg = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${cleaned}${msg}`;
}

export function getCallUrl(phone: string): string {
    return `tel:${phone}`;
}

export function getSmsUrl(phone: string): string {
    return `sms:${phone}`;
}
