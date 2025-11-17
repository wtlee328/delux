# Google Maps API Setup

## Overview
The itinerary planner uses Google Maps API to display product locations and visualize travel routes.

## Setup Instructions

1. **Get a Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API (optional, for future enhancements)
   - Create credentials (API Key)
   - Restrict the API key to your domain for security

2. **Configure the API Key**
   - Copy `frontend/.env.example` to `frontend/.env`
   - Add your API key:
     ```
     VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     ```

3. **Restart the Development Server**
   - Stop the frontend dev server if running
   - Run `npm run dev` again to load the new environment variable

## Features Implemented

- **Product Location Pins**: Shows all products from the resource library on the map
- **Hover Highlighting**: Hovering over a product card highlights its pin on the map
- **Timeline Markers**: Products added to the timeline appear with day numbers
- **Route Visualization**: Polylines connect products for each day, color-coded by day
- **Auto-fit Bounds**: Map automatically adjusts to show all timeline locations

## Notes

- If no API key is configured, the map will show a loading message
- Product locations are currently mock data - you'll need to add actual coordinates to products in the database
- The map uses default center coordinates for Taipei, Taiwan (25.0330, 121.5654)
