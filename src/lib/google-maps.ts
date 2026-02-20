// Shared Google Maps configuration
// Keep libraries as a constant to prevent re-renders

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// IMPORTANT: This must be a static array to prevent LoadScript from reloading
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];
