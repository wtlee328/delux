import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Product, TimelineDay } from '../../types/itinerary';

interface MapViewProps {
  products: Product[];
  highlightedProductId?: string | null;
  timelineProducts?: TimelineDay[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 25.0330,
  lng: 121.5654, // Taipei, Taiwan
};

// Colors for different days
const dayColors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
];

type Library = "places" | "drawing" | "geometry" | "visualization" | "marker";
const libraries: Library[] = ['places', 'marker'];

const MapView: React.FC<MapViewProps> = ({
  products,
  highlightedProductId,
  timelineProducts = [],
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'zh-TW',
    version: 'weekly'
  });

  const [map, setMap] = useState<any>(null);
  const [autoFit, setAutoFit] = useState(true);

  const fitBounds = useCallback(() => {
    if (map && timelineProducts.length > 0 && (window as any).google) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      let hasLocations = false;

      timelineProducts.forEach(day => {
        day.items.forEach(product => {
          if (product.location) {
            bounds.extend(product.location);
            hasLocations = true;
          }
        });
      });

      if (hasLocations) {
        map.fitBounds(bounds);
      }
    }
  }, [map, timelineProducts]);

  // Auto-fit bounds when timeline products change
  React.useEffect(() => {
    if (autoFit) {
      fitBounds();
    }
  }, [timelineProducts, autoFit, fitBounds]);

  const onLoad = useCallback((map: any) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return <div style={styles.loading}>載入地圖中...</div>;
  }

  // Get all products with locations from timeline
  const timelineLocations = timelineProducts.flatMap(day =>
    day.items
      .filter(p => p.location)
      .map(p => ({ ...p, dayNumber: day.dayNumber }))
  );

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onDragStart={() => setAutoFit(false)}
        onZoomChanged={() => {
          // Note: Zoom can change during fitBounds, so we only disable autoFit if map is ready and user likely triggered it
          // But a simple approach is better for now
        }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Markers for products in resource library */}
        {products
          .filter(p => p.location)
          .map(product => (
            <Marker
              key={`library-${product.id}`}
              position={product.location!}
              title={product.title}
              icon={{
                url: highlightedProductId === product.id
                  ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
            />
          ))}

        {/* Markers for products in timeline */}
        {timelineLocations.map((item) => (
          <Marker
            key={`timeline-${item.id}`}
            position={item.location!}
            title={item.title}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
            label={{
              text: `${item.dayNumber}`,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        ))}

        {/* Polylines for each day's route */}
        {timelineProducts.map((day, index) => {
          const dayLocations = day.items
            .filter(p => p.location)
            .map(p => p.location!);

          if (dayLocations.length < 2) return null;

          return (
            <Polyline
              key={`route-day-${day.dayNumber}`}
              path={dayLocations}
              options={{
                strokeColor: dayColors[index % dayColors.length],
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }}
            />
          );
        })}
      </GoogleMap>

      {/* Map Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button 
          onClick={() => {
            setAutoFit(true);
            fitBounds();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg font-bold text-sm transition-all ${
            autoFit ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {autoFit ? 'sync' : 'sync_disabled'}
          </span>
          {autoFit ? '自動縮放中' : '重設地圖視角'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
};

export default MapView;
