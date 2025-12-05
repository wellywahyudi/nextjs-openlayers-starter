/**
 * Map utility functions for bounds calculation and map operations
 * 
 * NOTE: This module is SSR-safe. Functions that need map library use async imports.
 * TODO: Update for OpenLayers in Phase 2
 */

/**
 * Raw bounds data that can be used without Leaflet
 */
export interface RawBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Calculates raw bounding box from an array of coordinates (SSR-safe)
 * @param coordinates - Array of [latitude, longitude] tuples
 * @returns Raw bounds object or null if array is empty
 */
export function calculateRawBounds(
  coordinates: [number, number][]
): RawBounds | null {
  if (coordinates.length === 0) {
    return null;
  }
  
  if (coordinates.length === 1) {
    const [lat, lng] = coordinates[0];
    const offset = 0.001;
    return {
      minLat: lat - offset,
      maxLat: lat + offset,
      minLng: lng - offset,
      maxLng: lng + offset,
    };
  }
  
  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];
  
  for (const [lat, lng] of coordinates) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Calculates bounding box from an array of coordinates (async, client-only)
 * @param coordinates - Array of [latitude, longitude] tuples
 * @returns Promise of bounds object or null if array is empty
 * TODO: Update for OpenLayers in Phase 2
 */
export async function calculateBounds(
  coordinates: [number, number][]
): Promise<RawBounds | null> {
  return calculateRawBounds(coordinates);
}

/**
 * Expands bounds by a percentage
 * @param bounds - Original bounds
 * @param percentage - Percentage to expand (e.g., 0.1 for 10%)
 * @returns Expanded bounds
 * TODO: Update for OpenLayers in Phase 2
 */
export function expandBounds(
  bounds: RawBounds,
  percentage: number = 0.1
): RawBounds {
  const latDiff = (bounds.maxLat - bounds.minLat) * percentage;
  const lngDiff = (bounds.maxLng - bounds.minLng) * percentage;
  
  return {
    minLat: bounds.minLat - latDiff,
    maxLat: bounds.maxLat + latDiff,
    minLng: bounds.minLng - lngDiff,
    maxLng: bounds.maxLng + lngDiff,
  };
}

/**
 * Checks if a coordinate is within bounds
 * @param coord - [latitude, longitude] tuple
 * @param bounds - Bounds object
 * @returns True if coordinate is within bounds
 */
export function isCoordinateInBounds(
  coord: [number, number],
  bounds: RawBounds
): boolean {
  const [lat, lng] = coord;
  return lat >= bounds.minLat && lat <= bounds.maxLat && 
         lng >= bounds.minLng && lng <= bounds.maxLng;
}

/**
 * Gets the center point of bounds
 * @param bounds - Bounds object
 * @returns Center coordinate as [latitude, longitude]
 */
export function getBoundsCenter(bounds: RawBounds): [number, number] {
  const lat = (bounds.minLat + bounds.maxLat) / 2;
  const lng = (bounds.minLng + bounds.maxLng) / 2;
  return [lat, lng];
}

/**
 * Calculates the approximate area of bounds in square meters
 * @param bounds - Bounds object
 * @returns Area in square meters (approximate)
 * TODO: Implement proper Haversine calculation in Phase 2
 */
export function calculateBoundsArea(bounds: RawBounds): number {
  // Simple approximation - will be improved with proper geodesic calculation
  const latDiff = bounds.maxLat - bounds.minLat;
  const lngDiff = bounds.maxLng - bounds.minLng;
  
  // Rough approximation: 111km per degree
  const latMeters = latDiff * 111000;
  const lngMeters = lngDiff * 111000 * Math.cos((bounds.minLat + bounds.maxLat) / 2 * Math.PI / 180);
  
  return latMeters * lngMeters;
}

/**
 * Safe map access helpers
 * TODO: Update for OpenLayers in Phase 2
 */
