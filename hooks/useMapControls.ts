'use client';

import { useCallback } from 'react';
import { useOpenLayersMap } from './useOpenLayersMap';
import { DEFAULT_MAP_CONFIG, MAP_ANIMATION_DURATION } from '@/constants/map-config';
import { latLngToOL } from '@/lib/utils/coordinates';

/**
 * Hook for controlling map zoom, view, and fullscreen
 * 
 * Provides methods to:
 * - Zoom in/out
 * - Reset view to default
 * - Toggle fullscreen
 * - Fly to specific coordinates
 * 
 * @returns Map control functions and map instance
 * 
 * @example
 * ```tsx
 * function MapControlButtons() {
 *   const { zoomIn, zoomOut, resetView, toggleFullscreen } = useMapControls();
 *   
 *   return (
 *     <div>
 *       <button onClick={zoomIn}>Zoom In</button>
 *       <button onClick={zoomOut}>Zoom Out</button>
 *       <button onClick={resetView}>Reset</button>
 *       <button onClick={toggleFullscreen}>Fullscreen</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMapControls() {
    const map = useOpenLayersMap();

    /**
     * Zoom in by one level
     */
    const zoomIn = useCallback(() => {
        if (map) {
            const view = map.getView();
            const currentZoom = view.getZoom();
            if (currentZoom !== undefined) {
                view.animate({
                    zoom: currentZoom + 1,
                    duration: MAP_ANIMATION_DURATION,
                });
            }
        }
    }, [map]);

    /**
     * Zoom out by one level
     */
    const zoomOut = useCallback(() => {
        if (map) {
            const view = map.getView();
            const currentZoom = view.getZoom();
            if (currentZoom !== undefined) {
                view.animate({
                    zoom: currentZoom - 1,
                    duration: MAP_ANIMATION_DURATION,
                });
            }
        }
    }, [map]);

    /**
     * Toggle fullscreen mode
     * Uses browser Fullscreen API
     */
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    /**
     * Reset view to default center and zoom
     * Uses smooth animation
     */
    const resetView = useCallback(() => {
        if (map) {
            const view = map.getView();
            const defaultCenter = latLngToOL(DEFAULT_MAP_CONFIG.defaultCenter);
            
            view.animate({
                center: defaultCenter,
                zoom: DEFAULT_MAP_CONFIG.defaultZoom,
                duration: MAP_ANIMATION_DURATION,
            });
        }
    }, [map]);

    /**
     * Fly to specific coordinates with optional zoom
     * 
     * @param center - [lat, lng] coordinates
     * @param zoom - Optional zoom level
     */
    const flyTo = useCallback((center: [number, number], zoom?: number) => {
        if (map) {
            const view = map.getView();
            const olCenter = latLngToOL(center);
            
            view.animate({
                center: olCenter,
                zoom: zoom ?? view.getZoom(),
                duration: MAP_ANIMATION_DURATION,
            });
        }
    }, [map]);

    return {
        zoomIn,
        zoomOut,
        toggleFullscreen,
        resetView,
        flyTo,
        map,
    };
}
