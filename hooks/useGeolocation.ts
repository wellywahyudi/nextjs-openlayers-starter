'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useOpenLayersMap } from './useOpenLayersMap';
import { latLngToOL } from '@/lib/utils/coordinates';
import { MAP_ANIMATION_DURATION } from '@/constants/map-config';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

/**
 * Custom hook for geolocation functionality with OpenLayers
 * 
 * Provides a reusable way to locate user's position on the map
 * and add a marker at their location.
 * 
 * Features:
 * - Proper layer cleanup
 * - Tracks location markers for cleanup
 * - OpenLayers-based implementation
 * 
 * @returns Object with locate function and loading state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { locateUser, isLocating } = useGeolocation();
 *   
 *   return (
 *     <button onClick={locateUser} disabled={isLocating}>
 *       {isLocating ? 'Locating...' : 'Find Me'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useGeolocation() {
  const map = useOpenLayersMap();
  const [isLocating, setIsLocating] = useState(false);
  
  // Store references for cleanup
  const locationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // Cleanup function for location markers
  const clearLocationMarkers = useCallback(() => {
    if (locationLayerRef.current && map) {
      map.removeLayer(locationLayerRef.current);
      locationLayerRef.current = null;
    }
  }, [map]);

  const locateUser = useCallback(() => {
    if (!map) {
      console.warn('Map instance not available');
      return;
    }

    // Clear any existing markers first
    clearLocationMarkers();

    setIsLocating(true);

    // Use browser Geolocation API
    if (!navigator.geolocation) {
      setIsLocating(false);
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        
        const { latitude, longitude, accuracy } = position.coords;
        // Use latLngToOL utility for coordinate conversion
        const coords = latLngToOL([latitude, longitude]);

        // Create vector source for location markers
        const vectorSource = new VectorSource();

        // Add accuracy circle
        const circleFeature = new Feature({
          geometry: new Point(coords),
        });
        
        circleFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: accuracy / 2,
              fill: new Fill({
                color: 'rgba(59, 130, 246, 0.2)',
              }),
              stroke: new Stroke({
                color: '#3b82f6',
                width: 2,
              }),
            }),
          })
        );
        vectorSource.addFeature(circleFeature);

        // Add location marker
        const markerFeature = new Feature({
          geometry: new Point(coords),
        });
        
        markerFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 8,
              fill: new Fill({
                color: '#3b82f6',
              }),
              stroke: new Stroke({
                color: 'white',
                width: 3,
              }),
            }),
          })
        );
        vectorSource.addFeature(markerFeature);

        // Create vector layer
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          zIndex: 1000,
        });
        
        locationLayerRef.current = vectorLayer;
        map.addLayer(vectorLayer);

        // Animate view to location using view.animate()
        const view = map.getView();
        view.animate({
          center: coords,
          zoom: Math.max(view.getZoom() || 10, 16),
          duration: MAP_ANIMATION_DURATION,
        });
      },
      (error) => {
        setIsLocating(false);
        console.error('Location error:', error.message);
        toast.error('Unable to find your location. Please check your browser permissions.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [map, clearLocationMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLocationMarkers();
    };
  }, [clearLocationMarkers]);

  return {
    locateUser,
    isLocating,
    isAvailable: !!map,
    clearLocationMarkers,
  };
}
