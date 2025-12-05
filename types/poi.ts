/**
 * POI (Point of Interest) type definitions
 * 
 * This module defines types for user-created points of interest on the map,
 * including categories, configurations, and GeoJSON export format.
 */

/**
 * POI category type
 * 
 * Defines the available categories for classifying points of interest.
 * Each category has associated styling (color, icon) defined in poi-categories.ts.
 * 
 * Categories:
 * - food-drink: Restaurants, cafes, bars
 * - shopping: Stores, malls, markets
 * - transport: Stations, airports, parking
 * - lodging: Hotels, hostels, accommodations
 * - health: Hospitals, clinics, pharmacies
 * - entertainment: Theaters, museums, venues
 * - nature: Parks, trails, viewpoints
 * - services: Banks, post offices, utilities
 * - education: Schools, libraries, universities
 * - religion: Churches, temples, mosques
 * - business: Offices, coworking spaces
 * - tourism: Attractions, landmarks, info centers
 * - emergency: Police, fire stations, hospitals
 * - utilities: Water, power, infrastructure
 */
export type POICategory =
  | 'food-drink'
  | 'shopping'
  | 'transport'
  | 'lodging'
  | 'health'
  | 'entertainment'
  | 'nature'
  | 'services'
  | 'education'
  | 'religion'
  | 'business'
  | 'tourism'
  | 'emergency'
  | 'utilities';

/**
 * POI category configuration
 * 
 * Defines the display properties for a POI category.
 * 
 * @property id - Category identifier
 * @property name - Display name for the category
 * @property color - Primary color (hex) for markers and UI
 * @property bgColor - Background color (hex) for category badges
 * @property icon - Emoji or icon character for visual identification
 * 
 * @example
 * ```typescript
 * const foodCategory: POICategoryConfig = {
 *   id: 'food-drink',
 *   name: 'Food & Drink',
 *   color: '#ef4444',
 *   bgColor: '#fee2e2',
 *   icon: '🍽️'
 * };
 * ```
 */
export interface POICategoryConfig {
  id: POICategory;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * Point of Interest (POI) data structure
 * 
 * Represents a user-created location marker with metadata.
 * POIs are persisted to localStorage and can be exported as GeoJSON.
 * 
 * @property id - Unique identifier (generated on creation)
 * @property title - Display name for the POI
 * @property description - Optional detailed description
 * @property lat - Latitude coordinate
 * @property lng - Longitude coordinate
 * @property category - Category classification
 * @property createdAt - Unix timestamp of creation
 * @property updatedAt - Unix timestamp of last update
 * 
 * @example
 * ```typescript
 * const poi: POI = {
 *   id: 'poi-1234567890-abc123',
 *   title: 'Favorite Coffee Shop',
 *   description: 'Great espresso and wifi',
 *   lat: 51.505,
 *   lng: -0.09,
 *   category: 'food-drink',
 *   createdAt: 1640000000000,
 *   updatedAt: 1640000000000
 * };
 * ```
 */
export interface POI {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  category: POICategory;
  createdAt: number;
  updatedAt: number;
}

/**
 * POI GeoJSON export format
 * 
 * Standard GeoJSON FeatureCollection format for POI export/import.
 * Compatible with GIS tools and mapping libraries.
 * 
 * Note: GeoJSON uses [longitude, latitude] coordinate order,
 * which differs from our internal [latitude, longitude] format.
 * 
 * @example
 * ```typescript
 * const geojson: POIGeoJSON = {
 *   type: 'FeatureCollection',
 *   features: [{
 *     type: 'Feature',
 *     geometry: {
 *       type: 'Point',
 *       coordinates: [-0.09, 51.505] // [lng, lat]
 *     },
 *     properties: {
 *       id: 'poi-123',
 *       title: 'My Place',
 *       category: 'food-drink',
 *       createdAt: 1640000000000,
 *       updatedAt: 1640000000000
 *     }
 *   }]
 * };
 * ```
 */
export interface POIGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat] - GeoJSON standard
    };
    properties: {
      id: string;
      title: string;
      description?: string;
      category: POICategory;
      createdAt: number;
      updatedAt: number;
    };
  }>;
}
