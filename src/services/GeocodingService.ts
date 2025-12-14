
import { SearchLocation } from '@/types/room';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  type: 'city' | 'landmark' | 'area';
}

// Common landmarks in Kota for quick lookup
const KNOWN_LANDMARKS: Record<string, { lat: number; lon: number; name: string }> = {
  'allen': { lat: 25.1800, lon: 75.8580, name: 'Allen Career Institute' },
  'allen samarth': { lat: 25.1785, lon: 75.8565, name: 'Allen Samarth' },
  'allen kota': { lat: 25.1800, lon: 75.8580, name: 'Allen Career Institute Kota' },
  'resonance': { lat: 25.1750, lon: 75.8640, name: 'Resonance' },
  'motion': { lat: 25.1820, lon: 75.8520, name: 'Motion Education' },
  'vibrant': { lat: 25.1790, lon: 75.8600, name: 'Vibrant Academy' },
  'kota junction': { lat: 25.1797, lon: 75.8462, name: 'Kota Junction Railway Station' },
  'kota railway station': { lat: 25.1797, lon: 75.8462, name: 'Kota Railway Station' },
};

// Known cities with their coordinates
const KNOWN_CITIES: Record<string, { lat: number; lon: number; radius: number }> = {
  'kota': { lat: 25.2138, lon: 75.8648, radius: 15 },
  'jaipur': { lat: 26.9124, lon: 75.7873, radius: 20 },
  'delhi': { lat: 28.6139, lon: 77.2090, radius: 25 },
  'mumbai': { lat: 19.0760, lon: 72.8777, radius: 30 },
  'bangalore': { lat: 12.9716, lon: 77.5946, radius: 25 },
  'bengaluru': { lat: 12.9716, lon: 77.5946, radius: 25 },
};

// Known areas in Kota
const KNOWN_AREAS: Record<string, { lat: number; lon: number }> = {
  'mahaveer nagar': { lat: 25.1845, lon: 75.8520 },
  'mahavir nagar': { lat: 25.1845, lon: 75.8520 },
  'mahaveer nagar first': { lat: 25.1850, lon: 75.8515 },
  'mahaveer nagar 1': { lat: 25.1850, lon: 75.8515 },
  'mahaveer nagar 1st': { lat: 25.1850, lon: 75.8515 },
  'mahaveer nagar second': { lat: 25.1840, lon: 75.8525 },
  'mahaveer nagar 2': { lat: 25.1840, lon: 75.8525 },
  'mahaveer nagar 2nd': { lat: 25.1840, lon: 75.8525 },
  'talwandi': { lat: 25.1700, lon: 75.8550 },
  'dadabari': { lat: 25.1750, lon: 75.8450 },
  'rajeev gandhi nagar': { lat: 25.1650, lon: 75.8700 },
  'indraprastha': { lat: 25.1900, lon: 75.8600 },
  'vigyan nagar': { lat: 25.1550, lon: 75.8650 },
  'borkhera': { lat: 25.2000, lon: 75.8400 },
  'kunhari': { lat: 25.2100, lon: 75.8700 },
};

// Normalize search query for matching
const normalizeQuery = (query: string): string => {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/1st/g, 'first')
    .replace(/2nd/g, 'second')
    .replace(/3rd/g, 'third')
    .replace(/\bnear\b/g, '')
    .replace(/\bclose to\b/g, '')
    .replace(/\bnearby\b/g, '')
    .trim();
};

// Check if query contains "near" pattern
const extractNearPattern = (query: string): { landmark: string; city?: string } | null => {
  const nearPatterns = [
    /near\s+(.+)/i,
    /close to\s+(.+)/i,
    /nearby\s+(.+)/i,
    /(.+?)\s+near\s+(.+)/i,
  ];

  for (const pattern of nearPatterns) {
    const match = query.match(pattern);
    if (match) {
      if (match[2]) {
        return { city: match[1].trim(), landmark: match[2].trim() };
      }
      return { landmark: match[1].trim() };
    }
  }
  return null;
};

// Geocode using Nominatim (OpenStreetMap)
const geocodeWithNominatim = async (query: string): Promise<GeocodingResult | null> => {
  try {
    const encodedQuery = encodeURIComponent(query + ', India');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=in`,
      {
        headers: {
          'User-Agent': 'Livenzo Room Finder App',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        type: result.type === 'city' || result.type === 'town' ? 'city' : 'area',
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const geocodeSearch = async (query: string): Promise<SearchLocation | null> => {
  if (!query || query.trim().length < 2) {
    return null;
  }

  const normalizedQuery = normalizeQuery(query);

  // Check for "near" patterns first (e.g., "near Allen Samarth")
  const nearPattern = extractNearPattern(query);
  if (nearPattern) {
    const landmarkNorm = normalizeQuery(nearPattern.landmark);
    
    // Check known landmarks
    for (const [key, value] of Object.entries(KNOWN_LANDMARKS)) {
      if (landmarkNorm.includes(key) || key.includes(landmarkNorm)) {
        return {
          latitude: value.lat,
          longitude: value.lon,
          label: value.name,
          radius: 3, // 3km radius for landmarks
        };
      }
    }

    // Try geocoding the landmark
    const geoResult = await geocodeWithNominatim(nearPattern.landmark + ', Kota, Rajasthan');
    if (geoResult) {
      return {
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        label: nearPattern.landmark,
        radius: 3,
      };
    }
  }

  // Check if it's a known city
  for (const [city, coords] of Object.entries(KNOWN_CITIES)) {
    if (normalizedQuery === city || normalizedQuery.startsWith(city + ' ')) {
      return {
        latitude: coords.lat,
        longitude: coords.lon,
        label: city.charAt(0).toUpperCase() + city.slice(1),
        radius: coords.radius, // City-wide search
      };
    }
  }

  // Check known landmarks
  for (const [key, value] of Object.entries(KNOWN_LANDMARKS)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return {
        latitude: value.lat,
        longitude: value.lon,
        label: value.name,
        radius: 3,
      };
    }
  }

  // Check known areas
  for (const [key, value] of Object.entries(KNOWN_AREAS)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return {
        latitude: value.lat,
        longitude: value.lon,
        label: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        radius: 2, // 2km for areas
      };
    }
  }

  // Fallback to Nominatim geocoding
  const geoResult = await geocodeWithNominatim(query);
  if (geoResult) {
    return {
      latitude: geoResult.latitude,
      longitude: geoResult.longitude,
      label: query,
      radius: geoResult.type === 'city' ? 15 : 3,
    };
  }

  return null;
};

// Get user's current location
export const getCurrentPosition = (): Promise<SearchLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Your Location',
          radius: 5,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
};
