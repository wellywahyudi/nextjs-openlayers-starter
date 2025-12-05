"use client";

import { useEffect, useRef, useContext } from "react";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { MapContext } from "@/contexts/MapContext";
import type { TileProvider } from "@/types/map";

/**
 * OpenLayersTileLayer component props
 */
export interface OpenLayersTileLayerProps {
  provider: TileProvider;
}

/**
 * OpenLayersTileLayer component
 *
 * Manages tile layer rendering for OpenLayers maps. This component adds a tile layer
 * to the map and handles tile provider switching.
 *
 * Features:
 * - Creates TileLayer with OSM or XYZ source based on provider
 * - Handles tile provider switching (removes old layer, adds new layer)
 * - Ensures only one tile layer exists at a time
 * - Supports custom attribution and zoom levels
 * - Handles cleanup on unmount
 *
 * @example
 * ```tsx
 * <OpenLayersTileLayer provider={tileProvider} />
 * ```
 */
export function OpenLayersTileLayer({ provider }: OpenLayersTileLayerProps) {
  const tileLayerRef = useRef<TileLayer | null>(null);
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("OpenLayersTileLayer must be used within a MapProvider");
  }

  const { map, isReady } = context;

  useEffect(() => {
    // Wait for map to be ready
    if (!map || !isReady) {
      return;
    }

    // Validate provider
    if (!provider || !provider.url) {
      console.error("Invalid tile provider:", provider);
      return;
    }

    try {
      // Remove existing tile layer if it exists
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }

      // Create tile source based on provider
      let tileSource;

      if (provider.id === "osm") {
        // Use OSM source for OpenStreetMap
        tileSource = new OSM({
          attributions: provider.attribution,
        });
      } else {
        // Use XYZ source for other providers
        // Handle {s} subdomain placeholder - replace with 'a' as default
        // OpenLayers doesn't support {s} natively, so we use a single subdomain
        let url = provider.url.replace("{s}", "a");

        // Handle {r} retina placeholder - remove it for standard resolution
        url = url.replace("{r}", "");

        tileSource = new XYZ({
          url: url,
          attributions: provider.attribution,
          maxZoom: provider.maxZoom,
        });
      }

      // Create tile layer
      const tileLayer = new TileLayer({
        source: tileSource,
      });

      // Add tile layer to map
      map.addLayer(tileLayer);

      // Store reference for cleanup
      tileLayerRef.current = tileLayer;
    } catch (error) {
      console.error("Failed to add tile layer:", error);
    }

    // Cleanup function
    return () => {
      if (tileLayerRef.current && map) {
        try {
          map.removeLayer(tileLayerRef.current);
          tileLayerRef.current = null;
        } catch (error) {
          console.error("Error removing tile layer:", error);
        }
      }
    };
  }, [map, isReady, provider]);

  // This component doesn't render anything visible
  return null;
}
