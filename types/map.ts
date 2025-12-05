/**
 * Map-related TypeScript type definitions for OpenLayers integration
 * 
 * This module defines all types used throughout the map application,
 * including configuration, tile providers, context values, and coordinates.
 */

import type { Map } from "ol";

/**
 * Map configuration options
 * 
 * Defines the initial state and constraints for the OpenLayers map.
 * 
 * @property defaultCenter - Initial map center in [lat, lng] format
 * @property defaultZoom - Initial zoom level
 * @property minZoom - Minimum allowed zoom level (typically 3 for world view)
 * @property maxZoom - Maximum allowed zoom level (typically 18 for street level)
 * @property zoomControl - Whether to show zoom controls (deprecated, use custom controls)
 * @property attributionControl - Whether to show attribution (deprecated, use custom controls)
 */
export interface MapConfig {
  defaultCenter: [number, number];
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomControl: boolean;
  attributionControl: boolean;
}

/**
 * Tile provider configuration
 * 
 * Defines a map tile source (e.g., OpenStreetMap, Satellite imagery).
 * 
 * @property id - Unique identifier for the provider
 * @property name - Display name for the provider
 * @property url - Tile URL template with {z}/{x}/{y} placeholders
 * @property attribution - Copyright/attribution text
 * @property maxZoom - Maximum zoom level supported by this provider
 * @property category - Provider category for UI grouping
 * 
 * @example
 * ```typescript
 * const osmProvider: TileProvider = {
 *   id: 'osm',
 *   name: 'OpenStreetMap',
 *   url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
 *   attribution: '© OpenStreetMap contributors',
 *   maxZoom: 19,
 *   category: 'standard'
 * };
 * ```
 */
export interface TileProvider {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  category: 'standard' | 'satellite' | 'dark' | 'custom';
}

/**
 * Map context value type
 * 
 * Defines the shape of the MapContext value that is shared across
 * all components that need access to the map instance.
 * 
 * @property map - OpenLayers Map instance or null if not initialized
 * @property setMap - Function to register/update the map instance
 * @property isReady - True when map is initialized and ready to use
 * @property error - Error object if map initialization failed
 * @property isInitializing - True during map initialization
 * @property setMapError - Function to set error state
 * @property startInitializing - Function to signal initialization start
 * 
 * @example
 * ```typescript
 * const { map, isReady } = useContext(MapContext);
 * 
 * if (!isReady) {
 *   return <div>Loading map...</div>;
 * }
 * ```
 */
export interface MapContextValue {
  map: Map | null;
  setMap: (map: Map | null) => void;
  isReady: boolean;
  error: Error | null;
  isInitializing: boolean;
  setMapError: (error: Error | null) => void;
  startInitializing: () => void;
}

/**
 * Coordinate tuple type
 * 
 * Represents a geographic coordinate in [latitude, longitude] format.
 * This is the external API format used throughout the application.
 * 
 * Note: OpenLayers internally uses [longitude, latitude] with projections.
 * Use latLngToOL() and olToLatLng() utilities for conversion.
 * 
 * @example
 * ```typescript
 * const london: Coordinate = [51.505, -0.09];
 * const olCoord = latLngToOL(london);
 * ```
 */
export type Coordinate = [number, number];

/**
 * Bounds type
 * 
 * Represents a geographic bounding box using cardinal directions.
 * 
 * @property north - Northern latitude boundary
 * @property south - Southern latitude boundary
 * @property east - Eastern longitude boundary
 * @property west - Western longitude boundary
 * 
 * @example
 * ```typescript
 * const ukBounds: Bounds = {
 *   north: 60.86,
 *   south: 49.96,
 *   east: 1.77,
 *   west: -8.65
 * };
 * ```
 */
export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
