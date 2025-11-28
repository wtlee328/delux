export interface Product {
    id: string;
    title: string;
    destination: string;
    category: string;
    coverImageUrl: string;
    netPrice: number;
    supplierName: string;
    productType: 'landmark' | 'accommodation' | 'food' | 'transportation';
    notes?: string;
    location?: {
        lat: number;
        lng: number;
    };
    timelineId?: string;
    startTime?: string; // Format: "HH:mm"
    duration?: number; // Duration in minutes (or hours depending on usage, backend says decimal hours)
    description?: string;
    hasShopping?: boolean;
    hasTicket?: boolean;
    ticketPrice?: number;
}

export interface TimelineDay {
    dayNumber: number;
    items: Product[];
    date?: string; // Format: "MM/DD"
    dayOfWeek?: string; // e.g., "Mon", "Tue"
}
