"use client";

import { useEffect, useRef, useContext } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { MapContext } from "@/contexts/MapContext";
import { latLngToOL } from "@/lib/utils/coordinates";
import { DEFAULT_MAP_CONFIG } from "@/constants/map-config";
import "ol/ol.css";

/**
 * OpenLayersMap component props
 */
export interface OpenLayersMapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * OpenLayersMap component
 *
 * Core map component that initializes and manages an OpenLayers map instance.
 *
 * Features:
 * - Initializes OpenLayers Map and View
 * - Converts center coordinates from [lat, lng] to OpenLayers format
 * - Applies zoom configuration (min, max, default)
 * - Registers map instance with MapContext
 * - Handles resize events
 * - Implements proper cleanup on unmount
 *
 * @example
 * ```tsx
 * <OpenLayersMap center={[51.505, -0.09]} zoom={13}>
 *   <OpenLayersTileLayer provider={tileProvider} />
 * </OpenLayersMap>
 * ```
 */
export function OpenLayersMap({
  center = DEFAULT_MAP_CONFIG.defaultCenter,
  zoom = DEFAULT_MAP_CONFIG.defaultZoom,
  minZoom = DEFAULT_MAP_CONFIG.minZoom,
  maxZoom = DEFAULT_MAP_CONFIG.maxZoom,
  className = "",
  children,
}: OpenLayersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("OpenLayersMap must be used within a MapProvider");
  }

  const { setMap, setMapError, startInitializing } = context;

  useEffect(() => {
    // Don't initialize if container ref is not ready
    if (!mapRef.current) {
      return;
    }

    // Don't re-initialize if map already exists
    if (mapInstanceRef.current) {
      return;
    }

    try {
      // Signal that initialization is starting
      startInitializing();

      // Convert center coordinates from [lat, lng] to OpenLayers format
      const olCenter = latLngToOL(center);

      // Create OpenLayers View with zoom configuration
      const view = new View({
        center: olCenter,
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
      });

      // Create OpenLayers Map instance
      const map = new Map({
        target: mapRef.current,
        view: view,
        controls: [], // We'll add custom controls separately
      });

      // Store map instance in ref
      mapInstanceRef.current = map;

      // Register map with MapContext
      setMap(map);

      // Handle resize events - call map.updateSize() when container resizes
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.updateSize();
        }
      });

      if (mapRef.current) {
        resizeObserver.observe(mapRef.current);
      }

      // Store resize observer for cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any)._resizeObserver = resizeObserver;
    } catch (error) {
      console.error("Failed to initialize OpenLayers map:", error);
      setMapError(error instanceof Error ? error : new Error(String(error)));
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;

        // Clean up resize observer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resizeObserver = (map as any)._resizeObserver;
        if (resizeObserver) {
          resizeObserver.disconnect();
        }

        // Detach map from DOM
        map.setTarget(undefined);

        // Dispose of map resources
        map.dispose();

        // Clear refs
        mapInstanceRef.current = null;

        // Unregister from context
        setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only initialize once

  // Update view when center or zoom props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const olCenter = latLngToOL(center);

      view.setCenter(olCenter);
      view.setZoom(zoom);
    }
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ position: "relative" }}
    >
      {children}
    </div>
  );
}
