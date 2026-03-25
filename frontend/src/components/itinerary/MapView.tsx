import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Product, TimelineDay } from '../../types/itinerary';
import { GOOGLE_MAPS_LOADER_CONFIG } from '../../config/google-maps';

interface MapViewProps {
  products: Product[];
  highlightedProductId?: string | null;
  timelineData?: TimelineDay[];
  focusedDayNumber?: number | null;
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

const MapView: React.FC<MapViewProps> = ({
  products,
  highlightedProductId,
  timelineData = [],
  focusedDayNumber = null,
}) => {
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_LOADER_CONFIG);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autoFit, setAutoFit] = useState(true);

  // Determine which days to display
  const targetDays = focusedDayNumber 
    ? timelineData.filter(d => d.dayNumber === focusedDayNumber)
    : timelineData;

  const fitBounds = useCallback(() => {
    if (map && targetDays.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasLocations = false;

      targetDays.forEach(day => {
        // If we have a calculated route, use the decoded path to bound the map
        if (day.routeInfo?.polyline && window.google?.maps?.geometry) {
          const path = window.google.maps.geometry.encoding.decodePath(day.routeInfo.polyline);
          path.forEach(p => bounds.extend(p));
          hasLocations = true;
        } else {
          // Otherwise bound to individual item locations
          day.items.forEach(product => {
            const loc = product.location || products.find(p => p.id === product.id)?.location;
            if (loc && loc.lat && loc.lng) {
              bounds.extend(loc);
              hasLocations = true;
            }
          });
        }
      });

      if (hasLocations) {
        map.fitBounds(bounds);
        // If only one location, fitBounds might zoom too much
        if (targetDays.flatMap(d => d.items).filter(i => i.location || products.find(p => p.id === i.id)?.location).length === 1) {
          map.setZoom(15);
        }
      }
    }
  }, [map, targetDays, products]);

  // Auto-fit bounds when target days or autoFit setting changes
  React.useEffect(() => {
    if (autoFit) {
      fitBounds();
    }
  }, [targetDays, autoFit, fitBounds]);

  // Force autoFit and fitBounds when focusing a specific day
  React.useEffect(() => {
    if (focusedDayNumber !== null) {
      setAutoFit(true);
      fitBounds();
    }
  }, [focusedDayNumber, fitBounds]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return <div style={styles.loading}>載入地圖中...</div>;
  }

  // Get markers with sequence numbers for the timeline
  const timelineMarkers = targetDays.flatMap(day => {
    // Find absolute day index in the full timeline for color consistency
    const dayIndex = timelineData.findIndex(d => d.dayNumber === day.dayNumber);
    const safeDayIndex = dayIndex >= 0 ? dayIndex : day.dayNumber - 1;
    const color = dayColors[safeDayIndex % dayColors.length];

    // Enrich items with location from products library if missing
    const enrichedItems = day.items.map(item => {
      if (!item.location || !item.location.lat || !item.location.lng) {
        const productData = products.find(p => p.id === item.id);
        return { ...item, location: productData?.location || item.location };
      }
      return item;
    });

    return enrichedItems
      .filter(p => p.location && p.location.lat && p.location.lng)
      .map((p, idx) => ({ 
        ...p, 
        dayNumber: day.dayNumber, 
        sequence: idx + 1,
        color
      }));
  });

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onDragStart={() => setAutoFit(false)}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Markers for products in resource library - Only show if NO day is focused or if it's the highlighted one */}
        {!focusedDayNumber && products
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
                scaledSize: new window.google.maps.Size(32, 32),
              }}
            />
          ))}

        {/* Highlighted library product should ALWAYS show even if a day is focused */}
        {focusedDayNumber && highlightedProductId && products.find(p => p.id === highlightedProductId)?.location && (
           <Marker
              key={`highlight-${highlightedProductId}`}
              position={products.find(p => p.id === highlightedProductId)!.location!}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              zIndex={1000}
           />
        )}

        {/* Markers for products in timeline with sequence labeling */}
        {timelineMarkers.map((item) => (
          <Marker
            key={`timeline-${item.timelineId || item.id}-${item.dayNumber}-${item.sequence}`}
            position={item.location!}
            title={`${item.sequence}. ${item.title}`}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: item.color,
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 14,
              labelOrigin: new window.google.maps.Point(0, 0)
            }}
            label={{
              text: `${item.sequence}`,
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
            zIndex={(item.dayNumber * 100) + item.sequence + 500} // Ensure day-based stacking order
          />
        ))}

        {/* Polylines for each day's route */}
        {targetDays.map((day) => {
          const dayIndex = timelineData.findIndex(d => d.dayNumber === day.dayNumber);
          const safeDayIndex = dayIndex >= 0 ? dayIndex : day.dayNumber - 1;
          const color = dayColors[safeDayIndex % dayColors.length];
          const dayLocations = day.items
            .map(item => item.location || products.find(p => p.id === item.id)?.location)
            .filter(loc => loc && loc.lat && loc.lng)
            .map(loc => loc!);

          if (day.routeInfo?.polyline && window.google?.maps?.geometry) {
            return (
              <Polyline
                key={`route-day-${day.dayNumber}`}
                path={window.google.maps.geometry.encoding.decodePath(day.routeInfo.polyline)}
                options={{
                  strokeColor: color,
                  strokeOpacity: 0.9,
                  strokeWeight: 6,
                }}
              />
            );
          }

          if (dayLocations.length < 2) return null;

          return (
            <Polyline
              key={`route-day-${day.dayNumber}`}
              path={dayLocations}
              options={{
                strokeColor: color,
                strokeOpacity: 0.5,
                strokeWeight: 3,
                geodesic: true,
                icons: [{
                  icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                  offset: '100%',
                  repeat: '100px'
                }]
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
