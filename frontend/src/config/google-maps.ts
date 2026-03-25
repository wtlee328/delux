
// Centralized Google Maps configuration to prevent "Loader must not be called again with different options" error.
// Every component using useJsApiLoader must use these exact settings.
export type GoogleMapsLibrary = "places" | "drawing" | "geometry" | "visualization" | "marker";

export const GOOGLE_MAPS_LIBRARIES: GoogleMapsLibrary[] = ['places', 'marker', 'geometry'];

export const GOOGLE_MAPS_LOADER_CONFIG = {
  id: 'google-map-script',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: GOOGLE_MAPS_LIBRARIES,
  language: 'zh-TW',
  version: 'weekly'
};
