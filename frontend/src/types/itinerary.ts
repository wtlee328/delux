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
    // Structured meals (aligned with supplier trip model)
    breakfastId?: string | null;
    breakfastCustom?: string | null;  // e.g. "酒店享用", "自理", "機上"
    breakfastTitle?: string | null;
    lunchId?: string | null;
    lunchCustom?: string | null;
    lunchTitle?: string | null;
    dinnerId?: string | null;
    dinnerCustom?: string | null;
    dinnerTitle?: string | null;
    // Structured hotel
    hotelId?: string | null;
    hotelCustom?: string | null;  // e.g. "五星或同級", "四星或同級", "三星或同級"
    hotelTitle?: string | null;
    // Notes
    notes?: string | null;
}

