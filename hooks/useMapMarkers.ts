'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useOpenLayersMap } from './useOpenLayersMap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import Overlay from 'ol/Overlay';
import { latLngToOL } from '@/lib/utils/coordinates';
import type { Map as OLMap } from 'ol';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Hook for managing user-added markers on the map
 * 
 * Features:
 * - Add/remove markers programmatically using OpenLayers Features
 * - Proper cleanup on unmount
 * - Unique ID generation for each marker
 * - Optional popup labels using OpenLayers Overlay
 * - Uses VectorSource and VectorLayer for marker rendering
 * 
 * @returns Object with marker management functions and state
 * 
 * @example
 * ```tsx
 * function MapComponent() {
 *   const { markers, addMarker, removeMarker, clearMarkers } = useMapMarkers();
 *   
 *   const handleMapClick = (lat: number, lng: number) => {
 *     addMarker(lat, lng, 'My Location');
 *   };
 *   
 *   return (
 *     <div>
 *       <p>Markers: {markers.length}</p>
 *       <button onClick={clearMarkers}>Clear All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMapMarkers() {
  const map = useOpenLayersMap();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const overlaysRef = useRef<Map<string, Overlay>>(new Map<string, Overlay>());
  const popupElementsRef = useRef<Map<string, HTMLDivElement>>(new Map<string, HTMLDivElement>());

  /**
   * Generate unique marker ID
   */
  const generateId = useCallback(() => {
    return `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Initialize vector layer for markers
   */
  const initializeVectorLayer = useCallback((mapInstance: OLMap) => {
    if (!vectorLayerRef.current) {
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        zIndex: 999, // Render below POIs but above base layers
      });

      vectorSourceRef.current = vectorSource;
      vectorLayerRef.current = vectorLayer;
      mapInstance.addLayer(vectorLayer);
    }
  }, []);

  /**
   * Create OpenLayers feature for marker
   */
  const createMarkerFeature = useCallback((id: string, lat: number, lng: number): Feature => {
    const coordinate = latLngToOL([lat, lng]);
    
    const feature = new Feature({
      geometry: new Point(coordinate),
    });

    // Store marker data in feature properties
    feature.setProperties({
      markerId: id,
      lat,
      lng,
    });

    // Create custom marker style (red pin)
    const markerStyle = new Style({
      image: new Icon({
        src: `data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(-45 12 12)">
              <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="3"/>
            </g>
            <circle cx="12" cy="12" r="4" fill="white"/>
          </svg>
        `)}`,
        scale: 1,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
      }),
    });

    feature.setStyle(markerStyle);
    feature.setId(id);

    return feature;
  }, []);

  /**
   * Create popup overlay for marker
   */
  const createPopupOverlay = useCallback((
    mapInstance: OLMap,
    id: string,
    coordinate: [number, number],
    label: string
  ): Overlay => {
    // Create popup container
    const popupContainer = document.createElement('div');
    popupContainer.style.cssText = `
      position: relative;
    `;

    // Create popup element
    const popupElement = document.createElement('div');
    popupElement.style.cssText = `
      position: absolute;
      background-color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 12px 32px 12px 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      min-width: 150px;
      max-width: 250px;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      pointer-events: auto;
      font-size: 13px;
      color: #1f2937;
    `;

    // Check for dark mode
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      popupElement.style.backgroundColor = 'rgb(31, 41, 55)';
      popupElement.style.borderColor = 'rgb(55, 65, 81)';
      popupElement.style.color = 'rgb(243, 244, 246)';
    }

    popupElement.innerHTML = `
      <div id="popup-content-${id}">${label}</div>
      <button id="popup-closer-${id}" style="
        position: absolute;
        top: 6px;
        right: 6px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 18px;
        color: #9ca3af;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      " aria-label="Close popup">×</button>
    `;

    // Add arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid ${isDark ? 'rgb(31, 41, 55)' : 'white'};
    `;
    popupElement.appendChild(arrow);

    // Add arrow border
    const arrowBorder = document.createElement('div');
    arrowBorder.style.cssText = `
      position: absolute;
      bottom: -11px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 11px solid transparent;
      border-right: 11px solid transparent;
      border-top: 11px solid ${isDark ? 'rgb(55, 65, 81)' : '#e5e7eb'};
    `;
    popupElement.appendChild(arrowBorder);

    popupContainer.appendChild(popupElement);
    popupElementsRef.current.set(id, popupElement);

    // Create overlay
    const overlay = new Overlay({
      element: popupContainer,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10],
    });

    overlay.setPosition(coordinate);
    mapInstance.addOverlay(overlay);

    // Add close button handler
    const closer = popupElement.querySelector(`#popup-closer-${id}`);
    if (closer) {
      closer.addEventListener('click', () => {
        overlay.setPosition(undefined);
      });
    }

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      popupElement.style.backgroundColor = isDark ? 'rgb(31, 41, 55)' : 'white';
      popupElement.style.borderColor = isDark ? 'rgb(55, 65, 81)' : '#e5e7eb';
      popupElement.style.color = isDark ? 'rgb(243, 244, 246)' : '#1f2937';
      
      const arrow = popupElement.querySelector('div:nth-child(2)') as HTMLElement;
      const arrowBorder = popupElement.querySelector('div:nth-child(3)') as HTMLElement;
      if (arrow) {
        arrow.style.borderTopColor = isDark ? 'rgb(31, 41, 55)' : 'white';
      }
      if (arrowBorder) {
        arrowBorder.style.borderTopColor = isDark ? 'rgb(55, 65, 81)' : '#e5e7eb';
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return overlay;
  }, []);

  /**
   * Add a marker at the specified location
   */
  const addMarker = useCallback(async (lat: number, lng: number, label?: string) => {
    if (!map || !vectorSourceRef.current) return null;

    const id = generateId();
    const coordinate = latLngToOL([lat, lng]);

    // Create and add feature
    const feature = createMarkerFeature(id, lat, lng);
    vectorSourceRef.current.addFeature(feature);

    // Create popup if label provided
    if (label) {
      const overlay = createPopupOverlay(map, id, coordinate, label);
      overlaysRef.current.set(id, overlay);
    }

    // Update state
    const newMarker: MapMarker = { id, lat, lng, label };
    setMarkers(prev => [...prev, newMarker]);

    return id;
  }, [map, generateId, createMarkerFeature, createPopupOverlay]);

  /**
   * Remove a marker by ID
   */
  const removeMarker = useCallback((id: string) => {
    if (!vectorSourceRef.current || !map) return;

    // Remove feature
    const feature = vectorSourceRef.current.getFeatureById(id);
    if (feature) {
      vectorSourceRef.current.removeFeature(feature);
    }

    // Remove overlay if exists
    const overlay = overlaysRef.current.get(id);
    if (overlay) {
      map.removeOverlay(overlay);
      overlaysRef.current.delete(id);
    }

    // Remove popup element
    const popupElement = popupElementsRef.current.get(id);
    if (popupElement) {
      popupElement.remove();
      popupElementsRef.current.delete(id);
    }

    // Update state
    setMarkers(prev => prev.filter(m => m.id !== id));
  }, [map]);

  /**
   * Remove all markers
   */
  const clearMarkers = useCallback(() => {
    if (!vectorSourceRef.current || !map) return;

    // Clear all features
    vectorSourceRef.current.clear();

    // Remove all overlays
    overlaysRef.current.forEach((overlay: Overlay) => {
      map.removeOverlay(overlay);
    });
    overlaysRef.current.clear();

    // Remove all popup elements
    popupElementsRef.current.forEach((element: HTMLDivElement) => {
      element.remove();
    });
    popupElementsRef.current.clear();

    // Clear state
    setMarkers([]);
  }, [map]);

  /**
   * Get marker by ID
   */
  const getMarker = useCallback((id: string): MapMarker | undefined => {
    return markers.find(m => m.id === id);
  }, [markers]);

  // Initialize vector layer when map is ready
  useEffect(() => {
    if (map) {
      initializeVectorLayer(map);
    }
  }, [map, initializeVectorLayer]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture current refs for cleanup
    const currentOverlays = overlaysRef.current;
    const currentPopupElements = popupElementsRef.current;
    
    return () => {
      if (vectorLayerRef.current && map) {
        map.removeLayer(vectorLayerRef.current);
      }
      if (vectorSourceRef.current) {
        vectorSourceRef.current.clear();
      }
      currentOverlays.forEach((overlay: Overlay) => {
        if (map) {
          map.removeOverlay(overlay);
        }
      });
      currentOverlays.clear();
      currentPopupElements.forEach((element: HTMLDivElement) => {
        element.remove();
      });
      currentPopupElements.clear();
      vectorLayerRef.current = null;
      vectorSourceRef.current = null;
    };
  }, [map]);

  return {
    markers,
    addMarker,
    removeMarker,
    clearMarkers,
    getMarker,
    markerCount: markers.length,
  };
}
