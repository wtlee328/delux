import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

interface Product {
  id: string;
  title: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface MapViewProps {
  products: Product[];
  highlightedProductId?: string | null;
  timelineProducts?: Array<{ dayNumber: number; products: Product[] }>;
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
  timelineProducts = [],
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<any>(null);

  const onLoad = useCallback((map: any) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Auto-fit bounds when timeline products change
  React.useEffect(() => {
    if (map && timelineProducts.length > 0 && (window as any).google) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      let hasLocations = false;

      timelineProducts.forEach(day => {
        day.products.forEach(product => {
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

  if (!isLoaded) {
    return <div style={styles.loading}>載入地圖中...</div>;
  }

  // Get all products with locations from timeline
  const timelineLocations = timelineProducts.flatMap(day =>
    day.products
      .filter(p => p.location)
      .map(p => ({ ...p, dayNumber: day.dayNumber }))
  );

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
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
                ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
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
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
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
        const dayLocations = day.products
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
