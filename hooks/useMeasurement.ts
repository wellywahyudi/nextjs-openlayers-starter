'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useOpenLayersMap } from './useOpenLayersMap';
import { calculateDistance as calculateDistanceUtil } from '@/lib/utils/coordinates';
import { olToLatLng } from '@/lib/utils/coordinates';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString, Polygon } from 'ol/geom';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { getLength, getArea } from 'ol/sphere';
import type { MapBrowserEvent } from 'ol';
import type { Coordinate } from 'ol/coordinate';

export type MeasurementMode = 'distance' | 'area' | null;

interface MeasurementPoint {
  coordinate: Coordinate; // OpenLayers coordinate [x, y]
  feature?: Feature<Point>;
}

/**
 * Hook for map measurement functionality using OpenLayers
 * Supports distance and area measurements
 * 
 * Features:
 * - Proper event handler cleanup (stores reference to specific handler)
 * - Memory leak prevention with refs cleanup
 * - Uses OpenLayers Draw interaction for measurements
 * - Uses ol/sphere getLength and getArea for calculations
 * - Uses shared utility for distance calculation (no duplication)
 * 
 * @returns Object with measurement functions and state
 */
export function useMeasurement() {
  const map = useOpenLayersMap();
  const [mode, setMode] = useState<MeasurementMode>(null);
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [area, setArea] = useState<number>(0);
  
  // Refs for OpenLayers objects
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const lineFeatureRef = useRef<Feature<LineString> | null>(null);
  const polygonFeatureRef = useRef<Feature<Polygon> | null>(null);
  
  // Store click handler reference for proper cleanup
  const clickHandlerRef = useRef<((e: MapBrowserEvent<PointerEvent>) => void) | null>(null);

  /**
   * Calculate distance between two LatLng points using shared utility
   */
  const calculatePointDistance = useCallback((coord1: Coordinate, coord2: Coordinate): number => {
    const latLng1 = olToLatLng(coord1 as [number, number]);
    const latLng2 = olToLatLng(coord2 as [number, number]);
    return calculateDistanceUtil(latLng1, latLng2);
  }, []);

  /**
   * Calculate total distance for all points
   */
  const calculateTotalDistance = useCallback((pts: MeasurementPoint[]): number => {
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      total += calculatePointDistance(pts[i].coordinate, pts[i + 1].coordinate);
    }
    return total;
  }, [calculatePointDistance]);

  /**
   * Calculate area using OpenLayers sphere utilities
   */
  const calculatePolygonArea = useCallback((pts: MeasurementPoint[]): number => {
    if (pts.length < 3) return 0;

    // Create a polygon geometry from the points
    const coordinates = pts.map(p => p.coordinate);
    const polygon = new Polygon([coordinates]);
    
    // Use OpenLayers getArea function which handles spherical calculations
    return getArea(polygon, { projection: 'EPSG:3857' });
  }, []);

  /**
   * Initialize vector layer for measurements
   */
  const initializeVectorLayer = useCallback(() => {
    if (!map || vectorLayerRef.current) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(59, 130, 246, 0.2)',
        }),
        stroke: new Stroke({
          color: '#3b82f6',
          width: 3,
          lineDash: [10, 10],
        }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#3b82f6',
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2,
          }),
        }),
      }),
    });

    map.addLayer(vectorLayer);
    vectorLayerRef.current = vectorLayer;
    vectorSourceRef.current = vectorSource;
  }, [map]);

  /**
   * Clear measurement - removes only OUR click handler, not all handlers
   * NOTE: Defined before startMeasurement to avoid reference issues
   */
  const clearMeasurement = useCallback(() => {
    if (!map) return;

    // Remove click handler
    if (clickHandlerRef.current) {
      // @ts-ignore - OpenLayers event types are complex
      map.un('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }

    // Clear vector source
    if (vectorSourceRef.current) {
      vectorSourceRef.current.clear();
    }

    // Reset feature refs
    lineFeatureRef.current = null;
    polygonFeatureRef.current = null;

    // Reset cursor
    const viewport = map.getViewport();
    if (viewport) {
      viewport.style.cursor = '';
    }

    setPoints([]);
    setDistance(0);
    setArea(0);
    setMode(null);
  }, [map]);

  /**
   * Start measurement mode
   */
  const startMeasurement = useCallback(async (measurementMode: MeasurementMode) => {
    if (!map || !measurementMode) return;

    // Clear previous measurement first
    clearMeasurement();

    // Initialize vector layer if needed
    initializeVectorLayer();

    setMode(measurementMode);

    // Create click handler and store reference for proper cleanup
    const handleMapClick = (e: MapBrowserEvent<PointerEvent>) => {
      const coordinate = e.coordinate;

      const newPoint: MeasurementPoint = {
        coordinate,
      };

      // Add marker feature
      const pointFeature = new Feature({
        geometry: new Point(coordinate),
      });

      if (vectorSourceRef.current) {
        vectorSourceRef.current.addFeature(pointFeature);
      }

      newPoint.feature = pointFeature;

      setPoints((prev) => {
        const updated = [...prev, newPoint];

        // Update distance
        if (measurementMode === 'distance' && updated.length > 1) {
          const dist = calculateTotalDistance(updated);
          setDistance(dist);

          // Draw/update polyline
          const coordinates = updated.map((p) => p.coordinate);
          if (lineFeatureRef.current) {
            lineFeatureRef.current.getGeometry()?.setCoordinates(coordinates);
          } else {
            const lineFeature = new Feature({
              geometry: new LineString(coordinates),
            });
            if (vectorSourceRef.current) {
              vectorSourceRef.current.addFeature(lineFeature);
            }
            lineFeatureRef.current = lineFeature;
          }
        }

        // Update area
        if (measurementMode === 'area' && updated.length > 2) {
          const calculatedArea = calculatePolygonArea(updated);
          setArea(calculatedArea);

          // Draw/update polygon
          const coordinates = updated.map((p) => p.coordinate);
          if (polygonFeatureRef.current) {
            polygonFeatureRef.current.getGeometry()?.setCoordinates([coordinates]);
          } else {
            const polygonFeature = new Feature({
              geometry: new Polygon([coordinates]),
            });
            if (vectorSourceRef.current) {
              vectorSourceRef.current.addFeature(polygonFeature);
            }
            polygonFeatureRef.current = polygonFeature;
          }
        }

        return updated;
      });
    };

    // Store handler reference for cleanup
    clickHandlerRef.current = handleMapClick;
    // @ts-ignore - OpenLayers event types are complex
    map.on('click', handleMapClick);
    
    // Set crosshair cursor
    const viewport = map.getViewport();
    if (viewport) {
      viewport.style.cursor = 'crosshair';
    }
  }, [map, calculateTotalDistance, calculatePolygonArea, clearMeasurement, initializeVectorLayer]);

  /**
   * Undo last point
   */
  const undoLastPoint = useCallback(() => {
    if (points.length === 0) return;

    setPoints((prev) => {
      const updated = [...prev];
      const removed = updated.pop();

      // Remove marker feature
      if (removed?.feature && vectorSourceRef.current) {
        vectorSourceRef.current.removeFeature(removed.feature);
      }

      // Update measurements
      if (mode === 'distance' && updated.length > 1) {
        const dist = calculateTotalDistance(updated);
        setDistance(dist);

        // Update polyline
        if (lineFeatureRef.current) {
          const coordinates = updated.map((p) => p.coordinate);
          lineFeatureRef.current.getGeometry()?.setCoordinates(coordinates);
        }
      } else if (mode === 'distance' && updated.length <= 1) {
        setDistance(0);
        if (lineFeatureRef.current && vectorSourceRef.current) {
          vectorSourceRef.current.removeFeature(lineFeatureRef.current);
          lineFeatureRef.current = null;
        }
      }

      if (mode === 'area' && updated.length > 2) {
        const calculatedArea = calculatePolygonArea(updated);
        setArea(calculatedArea);

        // Update polygon
        if (polygonFeatureRef.current) {
          const coordinates = updated.map((p) => p.coordinate);
          polygonFeatureRef.current.getGeometry()?.setCoordinates([coordinates]);
        }
      } else if (mode === 'area' && updated.length <= 2) {
        setArea(0);
        if (polygonFeatureRef.current && vectorSourceRef.current) {
          vectorSourceRef.current.removeFeature(polygonFeatureRef.current);
          polygonFeatureRef.current = null;
        }
      }

      return updated;
    });
  }, [points, mode, calculateTotalDistance, calculatePolygonArea]);

  /**
   * Finish measurement (close polygon for area)
   */
  const finishMeasurement = useCallback(() => {
    if (!map) return;

    // Remove ONLY our click handler
    if (clickHandlerRef.current) {
      // @ts-ignore - OpenLayers event types are complex
      map.un('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }
    
    // Reset cursor
    const viewport = map.getViewport();
    if (viewport) {
      viewport.style.cursor = '';
    }
    
    setMode(null);
  }, [map]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (map && clickHandlerRef.current) {
        // @ts-ignore - OpenLayers event types are complex
        map.un('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
      
      // Clean up vector layer
      if (vectorLayerRef.current && map) {
        map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }
      
      vectorSourceRef.current = null;
    };
  }, [map]);

  return {
    mode,
    points,
    distance,
    area,
    startMeasurement,
    clearMeasurement,
    undoLastPoint,
    finishMeasurement,
    isActive: mode !== null,
    pointCount: points.length,
  };
}
