"use client";

import { useEffect, useRef, useContext, useMemo } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Stroke, Fill } from "ol/style";
import { MapContext } from "@/contexts/MapContext";
import type { Feature } from "geojson";

/**
 * GeoJSON style configuration
 */
interface GeoJSONStyle {
  fillColor?: string;
  fillOpacity?: number;
  color?: string;
  weight?: number;
}

/**
 * OpenLayersGeoJSON component props
 */
export interface OpenLayersGeoJSONProps {
  data: Feature | null;
  style?: GeoJSONStyle;
  fitBounds?: boolean;
}

// Default style values
const DEFAULT_STYLE: Required<GeoJSONStyle> = {
  fillColor: "#3b82f6",
  fillOpacity: 0.2,
  color: "#2563eb",
  weight: 2,
};

/**
 * OpenLayersGeoJSON component
 *
 * Renders GeoJSON features on an OpenLayers map with customizable styling.
 *
 * Features:
 * - Parses GeoJSON using ol/format/GeoJSON
 * - Sets featureProjection to EPSG:3857 (Web Mercator)
 * - Creates VectorSource and VectorLayer for rendering
 * - Applies custom styling using ol/style (Stroke, Fill)
 * - Implements fit bounds using view.fit()
 * - Handles cleanup on unmount
 * - Memoized style to prevent unnecessary re-renders
 *
 * @example
 * ```tsx
 * <OpenLayersGeoJSON
 *   data={geoJsonFeature}
 *   style={{ color: "#2563eb", fillColor: "#3b82f6" }}
 *   fitBounds={true}
 * />
 * ```
 */
export function OpenLayersGeoJSON({
  data,
  style,
  fitBounds = true,
}: OpenLayersGeoJSONProps) {
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("OpenLayersGeoJSON must be used within a MapProvider");
  }

  const { map, isReady } = context;

  // Memoize style to prevent unnecessary effect triggers
  const memoizedStyle = useMemo(
    () => ({
      fillColor: style?.fillColor ?? DEFAULT_STYLE.fillColor,
      fillOpacity: style?.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
      color: style?.color ?? DEFAULT_STYLE.color,
      weight: style?.weight ?? DEFAULT_STYLE.weight,
    }),
    [style?.fillColor, style?.fillOpacity, style?.color, style?.weight]
  );

  useEffect(() => {
    // Wait for map to be ready
    if (!map || !isReady) {
      return;
    }

    // If no data, just clean up existing layer
    if (!data) {
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }
      return;
    }

    try {
      // Remove existing layer if it exists
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }

      // Create GeoJSON format parser
      const geoJSONFormat = new GeoJSON({
        // Set featureProjection to EPSG:3857 (Web Mercator)
        // This ensures features are projected correctly for the map
        featureProjection: "EPSG:3857",
      });

      // Parse GeoJSON data into OpenLayers features
      const features = geoJSONFormat.readFeatures(data);

      // Create vector source with parsed features
      const vectorSource = new VectorSource({
        features: features,
      });

      // Convert hex color to RGBA for fill
      const hexToRgba = (hex: string, opacity: number): string => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      // Create style using ol/style
      const featureStyle = new Style({
        stroke: new Stroke({
          color: memoizedStyle.color,
          width: memoizedStyle.weight,
        }),
        fill: new Fill({
          color: hexToRgba(memoizedStyle.fillColor, memoizedStyle.fillOpacity),
        }),
      });

      // Create vector layer with source and style
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: featureStyle,
      });

      // Add layer to map
      map.addLayer(vectorLayer);

      // Store reference for cleanup
      vectorLayerRef.current = vectorLayer;

      // Fit map view to feature bounds if requested
      if (fitBounds && features.length > 0) {
        const extent = vectorSource.getExtent();
        const view = map.getView();

        // Animate to fit the extent with padding
        view.fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1500,
          maxZoom: 10,
        });
      }
    } catch (error) {
      console.error("Failed to render GeoJSON:", error);
    }

    // Cleanup function
    return () => {
      if (vectorLayerRef.current && map) {
        try {
          map.removeLayer(vectorLayerRef.current);
          vectorLayerRef.current = null;
        } catch (error) {
          console.error("Error removing GeoJSON layer:", error);
        }
      }
    };
  }, [map, isReady, data, memoizedStyle, fitBounds]);

  // This component doesn't render anything visible
  return null;
}
