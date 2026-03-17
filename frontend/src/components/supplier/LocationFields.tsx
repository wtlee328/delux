import React, { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader, GoogleMap } from '@react-google-maps/api';

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

type Library = "places" | "drawing" | "geometry" | "visualization" | "marker";
const libraries: Library[] = ['places', 'marker'];

const defaultCenter = {
  lat: 25.0330, // Taipei 101
  lng: 121.5654
};

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const LocationFieldsContent: React.FC<LocationFieldsProps & { isLoaded: boolean }> = ({
  title,
  onTitleChange,
  titleError,
  address,
  onAddressChange,
  addressError,
  latitude,
  longitude,
  onCoordinatesChange,
  isLoaded
}) => {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showMap, setShowMap] = useState(false);
  
  // Title Autocomplete
  const [titleValue, setTitleValue] = useState(title);
  const [titleSuggestions, setTitleSuggestions] = useState<any[]>([]);

  // Address Autocomplete
  const [addressValue, setAddressValue] = useState(address);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  const skipTitleFetch = React.useRef(false);
  const skipAddressFetch = React.useRef(false);

  // Keep internal values in sync with props when they change externally
  useEffect(() => {
    if (title !== titleValue) {
      skipTitleFetch.current = true;
      setTitleValue(title);
    }
  }, [title]);

  useEffect(() => {
    if (address !== addressValue) {
      skipAddressFetch.current = true;
      setAddressValue(address);
    }
  }, [address]);

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const fetchSuggestions = useCallback(async (
    input: string, 
    setSuggestions: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (!input.trim() || !window.google) {
      setSuggestions([]);
      return;
    }
    try {
      const placesLib = await google.maps.importLibrary("places") as any;
      if (!placesLib.AutocompleteSuggestion) return;
      
      const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        language: 'zh-TW',
      });
      setSuggestions(suggestions || []);
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    }
  }, []);

  // Debounce for Title Autocomplete
  useEffect(() => {
    if (skipTitleFetch.current) {
      skipTitleFetch.current = false;
      return;
    }

    if (titleValue.trim()) {
      const timeoutId = setTimeout(() => fetchSuggestions(titleValue, setTitleSuggestions), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setTitleSuggestions([]);
    }
  }, [titleValue, fetchSuggestions]);

  // Debounce for Address Autocomplete
  useEffect(() => {
    if (skipAddressFetch.current) {
      skipAddressFetch.current = false;
      return;
    }

    if (addressValue.trim()) {
      const timeoutId = setTimeout(() => fetchSuggestions(addressValue, setAddressSuggestions), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAddressSuggestions([]);
    }
  }, [addressValue, fetchSuggestions]);

  const handleTitleSelect = async (suggestion: any) => {
    const placePrediction = suggestion.placePrediction;
    const titleText = placePrediction.text.text;
    skipTitleFetch.current = true;
    setTitleValue(titleText);
    onTitleChange(titleText);
    setTitleSuggestions([]);

    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      
      const lat = place.location?.lat();
      const lng = place.location?.lng();
      
      if (lat && lng) {
        onCoordinatesChange(lat, lng);
        setMapCenter({ lat, lng });
      }
      if (place.formattedAddress) {
        skipAddressFetch.current = true;
        onAddressChange(place.formattedAddress);
      }
    } catch (error) {
      console.error("Error fetching place: ", error);
    }
  };

  const handleAddressSelect = async (suggestion: any) => {
    const placePrediction = suggestion.placePrediction;
    const addressText = placePrediction.text.text;
    skipAddressFetch.current = true;
    setAddressValue(addressText);
    onAddressChange(addressText);
    setAddressSuggestions([]);

    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['location'] });
      
      const lat = place.location?.lat();
      const lng = place.location?.lng();
      
      if (lat && lng) {
        onCoordinatesChange(lat, lng);
        setMapCenter({ lat, lng });
      }
    } catch (error) {
      console.error("Error fetching place: ", error);
    }
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onCoordinatesChange(lat, lng);
      setMapCenter({ lat, lng });

      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results.length > 0) {
          const addressText = response.results[0].formatted_address;
          skipAddressFetch.current = true;
          setAddressValue(addressText);
          onAddressChange(addressText);
        }
      } catch (error) {
        console.error('Geocoder failed due to: ', error);
      }
    }
  };

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    let marker: any = null;
    
    const updateMarker = async () => {
      if (!mapInstance || !latitude || !longitude || !window.google) return;
      
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as any;
      
      marker = new AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: latitude, lng: longitude },
      });
    };

    updateMarker();

    return () => {
      if (marker) {
        marker.map = null;
      }
    };
  }, [mapInstance, latitude, longitude]);

  return (
    <div className="flex flex-col gap-6">
      {/* Product Title Field */}
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="產品標題" className="font-bold text-slate-700">
          產品標題 <span className="text-red-500">*</span>
        </label>
        <input
          id="產品標題"
          type="text"
          value={titleValue}
          onChange={(e) => {
            setTitleValue(e.target.value);
            onTitleChange(e.target.value);
          }}
          disabled={!isLoaded}
          className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="請輸入產品標題 (例如：台北 101 觀景台)"
        />
        {titleSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg top-full max-h-60 overflow-auto">
            {titleSuggestions.map((suggestion) => (
              <li
                key={suggestion.placePrediction.placeId}
                onClick={() => handleTitleSelect(suggestion)}
                className="p-3 hover:bg-slate-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
              >
                <span className="font-bold">{suggestion.placePrediction.text.text}</span>
              </li>
            ))}
          </ul>
        )}
        {titleError && (
          <span className="text-red-500 text-sm">{titleError}</span>
        )}
        <small className="text-slate-500 text-sm">輸入景點名稱可自動帶入地址。</small>
      </div>

      {/* Address Field */}
      <div className="flex flex-col gap-2 relative">
        <label htmlFor="地址" className="font-bold text-slate-700">
          地址 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              id="地址"
              type="text"
              value={addressValue}
              onChange={(e) => {
                setAddressValue(e.target.value);
                onAddressChange(e.target.value);
              }}
              disabled={!isLoaded}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="請輸入地址"
            />
            {addressSuggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg top-full max-h-60 overflow-auto">
                {addressSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.placePrediction.placeId}
                    onClick={() => handleAddressSelect(suggestion)}
                    className="p-3 hover:bg-slate-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
                  >
                    {suggestion.placePrediction.text.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap border border-slate-300 h-[50px]"
          >
            <span className="material-symbols-outlined text-sm">map</span>
            {showMap ? '隱藏地圖' : '在地圖上選擇'}
          </button>
        </div>
        {addressError && (
          <span className="text-red-500 text-sm">{addressError}</span>
        )}
      </div>

      {showMap && (
        <div className="w-full border border-slate-300 rounded-lg overflow-hidden relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onClick={handleMapClick}
            onLoad={(map) => setMapInstance(map)}
            onUnmount={() => setMapInstance(null)}
            options={{
              mapId: "DEMO_MAP_ID", // Required for Advanced Markers
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: false
            }}
          >
          </GoogleMap>
          <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-sm border border-slate-200 text-xs text-slate-700 pointer-events-none">
            💡 點擊地圖任意位置可直接設定地標並帶入地址
          </div>
        </div>
      )}
    </div>
  );
};

const LocationFields: React.FC<LocationFieldsProps> = (props) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'zh-TW',
    version: 'weekly'
  });

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        地圖載入失敗，請確認 API 金鑰是否正確或已開啟相關權限。
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-lg"></div>
        <div className="h-20 bg-slate-100 rounded-lg"></div>
      </div>
    );
  }

  return <LocationFieldsContent {...props} isLoaded={isLoaded} />;
};

export default LocationFields;

