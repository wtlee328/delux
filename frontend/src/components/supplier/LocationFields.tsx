import React, { useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

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
  
  // Title Autocomplete
  const {
    ready: titleReady,
    value: titleValue,
    suggestions: { status: titleStatus, data: titleData },
    setValue: setTitleValue,
    clearSuggestions: clearTitleSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { language: 'zh-TW' },
    debounce: 300,
    defaultValue: title
  });

  // Address Autocomplete
  const {
    ready: addressReady,
    value: addressValue,
    suggestions: { status: addressStatus, data: addressData },
    setValue: setAddressValue,
    clearSuggestions: clearAddressSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { language: 'zh-TW' },
    debounce: 300,
    defaultValue: address
  });

  // Keep internal values in sync with props when they change externally (e.g. from map click or initial load)
  useEffect(() => {
    setTitleValue(title, false);
  }, [title, setTitleValue]);

  useEffect(() => {
    setAddressValue(address, false);
  }, [address, setAddressValue]);

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handleTitleSelect = async (suggestion: any) => {
    const titleText = suggestion.structured_formatting.main_text;
    setTitleValue(titleText, false);
    onTitleChange(titleText);
    clearTitleSuggestions();

    try {
      const results = await getGeocode({ address: suggestion.description });
      const { lat, lng } = await getLatLng(results[0]);
      onCoordinatesChange(lat, lng);
      setMapCenter({ lat, lng });
      if (results[0].formatted_address) {
        onAddressChange(results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const handleAddressSelect = async (suggestion: any) => {
    setAddressValue(suggestion.description, false);
    onAddressChange(suggestion.description);
    clearAddressSuggestions();

    try {
      const results = await getGeocode({ address: suggestion.description });
      const { lat, lng } = await getLatLng(results[0]);
      onCoordinatesChange(lat, lng);
      setMapCenter({ lat, lng });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onCoordinatesChange(lat, lng);
      setMapCenter({ lat, lng });

      try {
        const results = await getGeocode({ location: { lat, lng } });
        if (results && results.length > 0) {
          onAddressChange(results[0].formatted_address);
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
          disabled={!titleReady && isLoaded}
          className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="請輸入產品標題 (例如：台北 101 觀景台)"
        />
        {titleStatus === "OK" && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg top-full max-h-60 overflow-auto">
            {titleData.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleTitleSelect(suggestion)}
                className="p-3 hover:bg-slate-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
              >
                <span className="font-bold">{suggestion.structured_formatting.main_text}</span>
                <small className="block text-slate-500">{suggestion.structured_formatting.secondary_text}</small>
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
              disabled={!addressReady && isLoaded}
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="請輸入地址"
            />
            {addressStatus === "OK" && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg top-full max-h-60 overflow-auto">
                {addressData.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => handleAddressSelect(suggestion)}
                    className="p-3 hover:bg-slate-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
                  >
                    {suggestion.description}
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

      {showMap && isLoaded && (
        <div className="w-full border border-slate-300 rounded-lg overflow-hidden relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
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
