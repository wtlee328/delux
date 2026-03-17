import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';

interface LocationFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  titleError?: string;
  
  address: string;
  onAddressChange: (value: string) => void;
  addressError?: string;
  
  latitude?: number;
  longitude?: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

type Library = "places" | "drawing" | "geometry" | "visualization";
const libraries: Library[] = ['places'];

const defaultCenter = {
  lat: 25.0330, // Taipei 101
  lng: 121.5654
};

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const LocationFields: React.FC<LocationFieldsProps> = ({
  title,
  onTitleChange,
  titleError,
  address,
  onAddressChange,
  addressError,
  latitude,
  longitude,
  onCoordinatesChange
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'zh-TW'
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showMap, setShowMap] = useState(false);
  const titleAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Custom hook ref to hold the map instance for geocoding
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleTitlePlaceChanged = () => {
    if (titleAutocompleteRef.current !== null) {
      const place = titleAutocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        if (place.name) {
          onTitleChange(place.name); // Usually the product title will be the name of the place
        }
        
        if (place.formatted_address) {
          onAddressChange(place.formatted_address);
        }
        
        onCoordinatesChange(lat, lng);
        setMapCenter({ lat, lng });
      }
    }
  };

  const handleAddressPlaceChanged = () => {
    if (addressAutocompleteRef.current !== null) {
      const place = addressAutocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        if (place.formatted_address) {
          onAddressChange(place.formatted_address);
        } else if (place.name) {
          onAddressChange(place.name);
        }
        
        onCoordinatesChange(lat, lng);
        setMapCenter({ lat, lng });
      }
    }
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onCoordinatesChange(lat, lng);
      setMapCenter({ lat, lng });

      // Reverse geocoding to get address
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results.length > 0) {
          onAddressChange(response.results[0].formatted_address);
        }
      } catch (error) {
        console.error('Geocoder failed due to: ', error);
      }
    }
  };

  if (loadError) {
    return <div>地圖載入失敗，請確認 API 金鑰是否正確。</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="產品標題" className="font-bold text-slate-700">
          產品標題 <span className="text-red-500">*</span>
        </label>
        {isLoaded ? (
          <Autocomplete
            onLoad={(autocomplete) => { titleAutocompleteRef.current = autocomplete; }}
            onPlaceChanged={handleTitlePlaceChanged}
          >
            <input
              id="產品標題"
              type="text"
              name="產品標題"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="請輸入產品標題 (例如：台北 101 觀景台)"
            />
          </Autocomplete>
        ) : (
          <input
            id="產品標題"
            type="text"
            name="產品標題"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="請輸入產品標題"
          />
        )}
        {titleError && (
          <span className="text-red-500 text-sm">{titleError}</span>
        )}
        <small className="text-slate-500 text-sm">
          輸入景點名稱可自動帶入地址。
        </small>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="地址" className="font-bold text-slate-700">
          地址 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {isLoaded ? (
            <div className="flex-1">
              <Autocomplete
                onLoad={(autocomplete) => { addressAutocompleteRef.current = autocomplete; }}
                onPlaceChanged={handleAddressPlaceChanged}
              >
                <input
                  id="地址"
                  type="text"
                  name="地址"
                  value={address}
                  onChange={(e) => onAddressChange(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="請輸入地址"
                />
              </Autocomplete>
            </div>
          ) : (
            <input
              id="地址"
              type="text"
              name="地址"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              className="w-full p-3 flex-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="請輸入地址"
            />
          )}
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap border border-slate-300"
          >
            <span className="material-symbols-outlined text-sm">map</span>
            {showMap ? '隱藏地圖' : '在地圖上選擇'}
          </button>
        </div>
        {addressError && (
          <span className="text-red-500 text-sm">{addressError}</span>
        )}
      </div>

      {showMap && isLoaded && (
        <div className="w-full border border-slate-300 rounded-lg overflow-hidden relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: false
            }}
          >
            {latitude && longitude && (
              <Marker position={{ lat: latitude, lng: longitude }} />
            )}
          </GoogleMap>
          <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-sm border border-slate-200 text-xs text-slate-700 pointer-events-none">
            💡 點擊地圖任意位置可直接設定地標並帶入地址
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFields;
