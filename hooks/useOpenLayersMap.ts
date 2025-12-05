'use client';

import { useContext } from 'react';
import { MapContext } from '@/contexts/MapContext';
import type { Map } from 'ol';

/**
 * Hook to access OpenLayers map instance from MapContext
 * 
 * @returns OpenLayers map instance or null if not initialized
 * @throws Error if used outside MapProvider
 * 
 * @example
 * ```tsx
 * function MapControl() {
 *   const map = useOpenLayersMap();
 *   
 *   const handleZoomIn = () => {
 *     if (map) {
 *       const view = map.getView();
 *       const currentZoom = view.getZoom();
 *       if (currentZoom !== undefined) {
 *         view.setZoom(currentZoom + 1);
 *       }
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleZoomIn} disabled={!map}>
 *       Zoom In
 *     </button>
 *   );
 * }
 * ```
 */
export function useOpenLayersMap(): Map | null {
  const context = useContext(MapContext);

  if (context === undefined) {
    throw new Error('useOpenLayersMap must be used within a MapProvider');
  }

  return context.map;
}
