/**
 * Coordinate utility functions for map operations
 */

import { fromLonLat, toLonLat } from 'ol/proj';

/**
 * Converts [lat, lng] coordinate to OpenLayers coordinate [x, y] in EPSG:3857
 * 
 * OpenLayers uses [longitude, latitude] order with explicit projections,
 * while our external API uses [latitude, longitude] order.
 * This function handles the conversion from our API format to OpenLayers format.
 * 
 * @param coord - [latitude, longitude] tuple in EPSG:4326 (WGS84)
 * @returns [x, y] coordinate in EPSG:3857 (Web Mercator)
 * @throws {Error} If coordinate is invalid
 * 
 * @example
 * const olCoord = latLngToOL([51.505, -0.09]);
 * // Returns approximately [-10018.75, 6711665.88]
 * 
 */
export function latLngToOL(coord: [number, number]): [number, number] {
  const [lat, lng] = coord;
  
  // Validate coordinate before conversion
  if (!isValidCoordinate(coord)) {
    throw new Error(
      `Invalid coordinate: [${lat}, ${lng}]. ` +
      `Latitude must be between -90 and 90, longitude must be between -180 and 180.`
    );
  }
  
  // fromLonLat expects [longitude, latitude] and returns [x, y]
  return fromLonLat([lng, lat]) as [number, number];
}

/**
 * Converts OpenLayers coordinate [x, y] in EPSG:3857 to [lat, lng]
 * 
 * This function handles the conversion from OpenLayers format back to our API format.
 * 
 * @param coord - [x, y] coordinate in EPSG:3857 (Web Mercator)
 * @returns [latitude, longitude] tuple in EPSG:4326 (WGS84)
 * 
 * @example
 * const latLng = olToLatLng([-10018.75, 6711665.88]);
 * // Returns approximately [51.505, -0.09]
 * 
 */
export function olToLatLng(coord: [number, number]): [number, number] {
  // toLonLat returns [longitude, latitude]
  const [lng, lat] = toLonLat(coord) as [number, number];
  
  // Return in our API format: [latitude, longitude]
  return [lat, lng];
}

/**
 * Validates if a coordinate pair is within valid latitude/longitude bounds
 * 
 * @param coord - [latitude, longitude] tuple
 * @returns True if coordinate is valid
 * 
 */
export function isValidCoordinate(coord: [number, number]): boolean {
  const [lat, lng] = coord;
  
  // Check for valid types
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  
  // Check for NaN or Infinity
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Formats a coordinate pair to a human-readable string
 * @param coord - [latitude, longitude] tuple
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted string like "51.505000°N, 0.090000°W"
 */
export function formatCoordinate(
  coord: [number, number],
  precision: number = 6
): string {
  const [lat, lng] = coord;
  
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  const latAbs = Math.abs(lat).toFixed(precision);
  const lngAbs = Math.abs(lng).toFixed(precision);
  
  return `${latAbs}°${latDir}, ${lngAbs}°${lngDir}`;
}

/**
 * Parses a formatted coordinate string back to a coordinate tuple
 * @param formatted - String like "51.505000°N, 0.090000°W"
 * @returns [latitude, longitude] tuple or null if invalid
 */
export function parseCoordinate(formatted: string): [number, number] | null {
  const regex = /^([\d.]+)°([NS]),\s*([\d.]+)°([EW])$/;
  const match = formatted.match(regex);
  
  if (!match) return null;
  
  const [, latStr, latDir, lngStr, lngDir] = match;
  
  let lat = parseFloat(latStr);
  let lng = parseFloat(lngStr);
  
  if (latDir === 'S') lat = -lat;
  if (lngDir === 'W') lng = -lng;
  
  if (!isValidCoordinate([lat, lng])) return null;
  
  return [lat, lng];
}

/**
 * Formats coordinates in decimal degrees format
 * @param coord - [latitude, longitude] tuple
 * @param precision - Number of decimal places (default: 6)
 * @returns String like "51.505000, -0.090000"
 */
export function formatDecimalDegrees(
  coord: [number, number],
  precision: number = 6
): string {
  const [lat, lng] = coord;
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Converts decimal degrees to degrees, minutes, seconds format
 * @param decimal - Decimal degree value
 * @returns Object with degrees, minutes, seconds
 */
export function decimalToDMS(decimal: number): {
  degrees: number;
  minutes: number;
  seconds: number;
} {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;
  
  return { degrees, minutes, seconds };
}

/**
 * Formats a coordinate in DMS (Degrees, Minutes, Seconds) format
 * @param coord - [latitude, longitude] tuple
 * @returns String like "51°30'18"N, 0°5'24"W"
 */
export function formatDMS(coord: [number, number]): string {
  const [lat, lng] = coord;
  
  const latDMS = decimalToDMS(lat);
  const lngDMS = decimalToDMS(lng);
  
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${latDMS.degrees}°${latDMS.minutes}'${latDMS.seconds.toFixed(2)}"${latDir}, ${lngDMS.degrees}°${lngDMS.minutes}'${lngDMS.seconds.toFixed(2)}"${lngDir}`;
}

/**
 * Normalizes longitude to [-180, 180] range
 */
export function normalizeLongitude(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

/**
 * Clamps latitude to [-90, 90] range
 */
export function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Normalizes a coordinate to valid ranges
 */
export function normalizeCoordinate(coord: [number, number]): [number, number] {
  const [lat, lng] = coord;
  return [clampLatitude(lat), normalizeLongitude(lng)];
}

/**
 * Calculates the distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}
