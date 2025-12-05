/**
 * Default map configuration constants
 * 
 * This module defines the default settings for the OpenLayers map,
 * including initial view, zoom constraints, and animation settings.
 */

import type { MapConfig } from '@/types/map';

/**
 * Default map configuration
 * 
 * Defines the initial state of the map when it loads.
 * 
 * Configuration details:
 * - Center: Indonesia coordinates [-2.911154, 120.074263] in [lat, lng] format
 * - Default zoom: 5 (country-level view)
 * - Min zoom: 3 (world view)
 * - Max zoom: 18 (street-level view)
 * - Custom controls: Zoom and attribution controls are custom-built
 * 
 * To customize the default view, edit the defaultCenter and defaultZoom values.
 * 
 * @example
 * ```typescript
 * // Change default center to London
 * export const DEFAULT_MAP_CONFIG: MapConfig = {
 *   defaultCenter: [51.505, -0.09],
 *   defaultZoom: 13,
 *   // ... other settings
 * };
 * ```
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  defaultCenter: [-2.911154, 120.074263],
  defaultZoom: 5,
  minZoom: 3,
  maxZoom: 18,
  zoomControl: false, // Using custom controls in dock
  attributionControl: true,
};

/**
 * Map animation duration in milliseconds
 * 
 * Used for smooth transitions when:
 * - Flying to a location
 * - Zooming in/out
 * - Resetting view
 * - Fitting bounds to features
 * 
 * Default: 500ms provides a smooth but quick transition.
 * Increase for slower, more dramatic animations.
 * Decrease for snappier, instant-feeling transitions.
 */
export const MAP_ANIMATION_DURATION = 500;

/**
 * Default map container height
 * 
 * Sets the height of the map container to fill the viewport.
 * Can be overridden with custom className prop on OpenLayersMap.
 */
export const DEFAULT_MAP_HEIGHT = '100vh';
