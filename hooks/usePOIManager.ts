'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useOpenLayersMap } from './useOpenLayersMap';
import type { POI, POIGeoJSON, POICategory } from '@/types/poi';
import { getCategoryColor } from '@/constants/poi-categories';
import { latLngToOL } from '@/lib/utils/coordinates';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon, Fill, Stroke, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';
import type { Map } from 'ol';

const STORAGE_KEY = 'nextjs-leaflet-pois';

/**
 * Hook for managing POIs (Points of Interest)
 * 
 * Features:
 * - CRUD operations for POIs
 * - LocalStorage persistence
 * - GeoJSON import/export
 * - Map marker rendering with category colors using OpenLayers
 * - Proper cleanup on unmount
 * 
 * @returns Object with POI management functions and state
 */
export function usePOIManager() {
  const map = useOpenLayersMap();
  const [pois, setPOIs] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const popupElementRef = useRef<HTMLDivElement | null>(null);

  /**
   * Load POIs from localStorage
   */
  const loadPOIs = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as POI[];
        setPOIs(parsed);
      }
    } catch (error) {
      console.error('Failed to load POIs from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save POIs to localStorage
   */
  const savePOIs = useCallback((poisToSave: POI[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(poisToSave));
    } catch (error) {
      console.error('Failed to save POIs to localStorage:', error);
    }
  }, []);

  /**
   * Generate unique POI ID
   */
  const generateId = useCallback(() => {
    return `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Create OpenLayers feature for POI
   */
  const createFeature = useCallback((poi: POI): Feature => {
    const color = getCategoryColor(poi.category);
    const coordinate = latLngToOL([poi.lat, poi.lng]);
    
    const feature = new Feature({
      geometry: new Point(coordinate),
    });

    // Store POI data in feature properties
    feature.setProperties({
      poiId: poi.id,
      title: poi.title,
      description: poi.description,
      category: poi.category,
      lat: poi.lat,
      lng: poi.lng,
      createdAt: poi.createdAt,
      updatedAt: poi.updatedAt,
    });

    // Create custom marker style with category color
    const markerStyle = new Style({
      image: new Icon({
        src: `data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(-45 16 16)">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="3"/>
            </g>
            <text x="16" y="20" font-size="14" text-anchor="middle" fill="white">📍</text>
          </svg>
        `)}`,
        scale: 1,
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
      }),
      text: new Text({
        text: poi.title,
        offsetY: -35,
        font: '12px sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
      }),
    });

    feature.setStyle(markerStyle);
    feature.setId(poi.id);

    return feature;
  }, []);

  /**
   * Initialize vector layer for POIs
   */
  const initializeVectorLayer = useCallback((mapInstance: Map) => {
    if (!vectorLayerRef.current) {
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        zIndex: 1000, // Ensure POIs render on top
      });

      vectorSourceRef.current = vectorSource;
      vectorLayerRef.current = vectorLayer;
      mapInstance.addLayer(vectorLayer);
    }

    // Initialize popup overlay
    if (!popupOverlayRef.current) {
      // Create popup container
      const popupContainer = document.createElement('div');
      popupContainer.style.cssText = `
        position: relative;
      `;

      // Create popup element with explicit styles
      const popupElement = document.createElement('div');
      popupElement.style.cssText = `
        position: absolute;
        background-color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px;
        padding-right: 32px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        min-width: 200px;
        max-width: 280px;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1001;
        pointer-events: auto;
      `;
      
      // Check for dark mode
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        popupElement.style.backgroundColor = 'rgb(31, 41, 55)';
        popupElement.style.borderColor = 'rgb(55, 65, 81)';
        popupElement.style.color = 'rgb(243, 244, 246)';
      }

      popupElement.innerHTML = `
        <div id="popup-content" style="position: relative; z-index: 1;"></div>
        <button id="popup-closer" style="
          position: absolute;
          top: 8px;
          right: 8px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 20px;
          color: #9ca3af;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          z-index: 2;
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
        z-index: 1002;
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
        z-index: 1001;
      `;
      popupElement.appendChild(arrowBorder);
      
      popupContainer.appendChild(popupElement);
      popupElementRef.current = popupElement;

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

      popupOverlayRef.current = overlay;
      mapInstance.addOverlay(overlay);

      // Add close button handler
      const closer = popupElement.querySelector('#popup-closer');
      if (closer) {
        closer.addEventListener('click', () => {
          overlay.setPosition(undefined);
        });
      }

      // Listen for theme changes to update popup colors
      const observer = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains('dark');
        popupElement.style.backgroundColor = isDark ? 'rgb(31, 41, 55)' : 'white';
        popupElement.style.borderColor = isDark ? 'rgb(55, 65, 81)' : '#e5e7eb';
        popupElement.style.color = isDark ? 'rgb(243, 244, 246)' : 'inherit';
        
        // Update arrow colors
        const arrow = popupElement.querySelector('div:nth-child(3)') as HTMLElement;
        const arrowBorder = popupElement.querySelector('div:nth-child(4)') as HTMLElement;
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

      // Add click handler to map for POI features
      mapInstance.on('click', (evt) => {
        const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (feature) => {
          // Check if this is a POI feature
          if (feature.get('poiId')) {
            return feature;
          }
          return null;
        });

        if (feature) {
          const poiId = feature.get('poiId');
          const title = feature.get('title');
          const description = feature.get('description');
          const lat = feature.get('lat');
          const lng = feature.get('lng');
          const coordinate = (feature.getGeometry() as Point).getCoordinates();

          // Update popup content
          const content = popupElement.querySelector('#popup-content');
          const isDark = document.documentElement.classList.contains('dark');
          if (content) {
            content.innerHTML = `
              <div style="min-width: 150px;">
                <div style="font-weight: 600; margin-bottom: 6px; color: ${isDark ? '#f3f4f6' : '#1f2937'}; font-size: 14px;">${title}</div>
                ${description ? `<div style="font-size: 13px; color: ${isDark ? '#d1d5db' : '#6b7280'}; margin-bottom: 6px; line-height: 1.4;">${description}</div>` : ''}
                <div style="font-size: 11px; color: ${isDark ? '#9ca3af' : '#9ca3af'}; font-family: monospace;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
              </div>
            `;
          }

          // Show popup at feature location
          overlay.setPosition(coordinate);
        } else {
          // Close popup if clicking elsewhere
          overlay.setPosition(undefined);
        }
      });

      // Change cursor on hover
      mapInstance.on('pointermove', (evt) => {
        const pixel = mapInstance.getEventPixel(evt.originalEvent);
        const hit = mapInstance.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) => layer === vectorLayerRef.current,
        });
        mapInstance.getTargetElement().style.cursor = hit ? 'pointer' : '';
      });
    }
  }, []);

  /**
   * Render all POI markers on map
   */
  const renderMarkers = useCallback(() => {
    if (!map || !vectorSourceRef.current) return;

    // Clear existing features
    vectorSourceRef.current.clear();

    // Create new features for all POIs
    const features = pois.map((poi) => createFeature(poi));
    vectorSourceRef.current.addFeatures(features);
  }, [map, pois, createFeature]);

  /**
   * Add new POI
   */
  const addPOI = useCallback((
    title: string,
    lat: number,
    lng: number,
    category: POICategory,
    description?: string
  ): POI => {
    const now = Date.now();
    const newPOI: POI = {
      id: generateId(),
      title,
      description,
      lat,
      lng,
      category,
      createdAt: now,
      updatedAt: now,
    };

    setPOIs((prev) => {
      const updated = [...prev, newPOI];
      savePOIs(updated);
      return updated;
    });

    return newPOI;
  }, [generateId, savePOIs]);

  /**
   * Update existing POI
   */
  const updatePOI = useCallback((
    id: string,
    updates: Partial<Omit<POI, 'id' | 'createdAt'>>
  ) => {
    setPOIs((prev) => {
      const updated = prev.map((poi) =>
        poi.id === id
          ? { ...poi, ...updates, updatedAt: Date.now() }
          : poi
      );
      savePOIs(updated);
      return updated;
    });
  }, [savePOIs]);

  /**
   * Delete POI
   */
  const deletePOI = useCallback((id: string) => {
    setPOIs((prev) => {
      const updated = prev.filter((poi) => poi.id !== id);
      savePOIs(updated);
      return updated;
    });
  }, [savePOIs]);

  /**
   * Clear all POIs
   */
  const clearAllPOIs = useCallback(() => {
    setPOIs([]);
    savePOIs([]);
  }, [savePOIs]);

  /**
   * Get POIs by category
   */
  const getPOIsByCategory = useCallback((category: POICategory): POI[] => {
    return pois.filter((poi) => poi.category === category);
  }, [pois]);

  /**
   * Export POIs as GeoJSON
   */
  const exportGeoJSON = useCallback((): POIGeoJSON => {
    return {
      type: 'FeatureCollection',
      features: pois.map((poi) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [poi.lng, poi.lat],
        },
        properties: {
          id: poi.id,
          title: poi.title,
          description: poi.description,
          category: poi.category,
          createdAt: poi.createdAt,
          updatedAt: poi.updatedAt,
        },
      })),
    };
  }, [pois]);

  /**
   * Import POIs from GeoJSON
   */
  const importGeoJSON = useCallback((geojson: POIGeoJSON) => {
    try {
      const importedPOIs: POI[] = geojson.features.map((feature) => ({
        id: feature.properties.id || generateId(),
        title: feature.properties.title,
        description: feature.properties.description,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        category: feature.properties.category,
        createdAt: feature.properties.createdAt || Date.now(),
        updatedAt: feature.properties.updatedAt || Date.now(),
      }));

      setPOIs((prev) => {
        const updated = [...prev, ...importedPOIs];
        savePOIs(updated);
        return updated;
      });

      return importedPOIs.length;
    } catch (error) {
      console.error('Failed to import GeoJSON:', error);
      throw new Error('Invalid GeoJSON format');
    }
  }, [generateId, savePOIs]);

  /**
   * Fly to POI location
   */
  const flyToPOI = useCallback((poi: POI) => {
    if (!map || !popupOverlayRef.current || !popupElementRef.current) return;
    
    const view = map.getView();
    const coordinate = latLngToOL([poi.lat, poi.lng]);
    
    view.animate({
      center: coordinate,
      zoom: 16,
      duration: 1500,
    });

    // Show popup after animation
    setTimeout(() => {
      if (popupOverlayRef.current && popupElementRef.current) {
        const content = popupElementRef.current.querySelector('#popup-content');
        const isDark = document.documentElement.classList.contains('dark');
        if (content) {
          content.innerHTML = `
            <div style="min-width: 150px;">
              <div style="font-weight: 600; margin-bottom: 6px; color: ${isDark ? '#f3f4f6' : '#1f2937'}; font-size: 14px;">${poi.title}</div>
              ${poi.description ? `<div style="font-size: 13px; color: ${isDark ? '#d1d5db' : '#6b7280'}; margin-bottom: 6px; line-height: 1.4;">${poi.description}</div>` : ''}
              <div style="font-size: 11px; color: ${isDark ? '#9ca3af' : '#9ca3af'}; font-family: monospace;">${poi.lat.toFixed(6)}, ${poi.lng.toFixed(6)}</div>
            </div>
          `;
        }
        popupOverlayRef.current.setPosition(coordinate);
      }
    }, 1500);
  }, [map]);

  // Load POIs on mount
  useEffect(() => {
    loadPOIs();
  }, [loadPOIs]);

  // Initialize vector layer when map is ready
  useEffect(() => {
    if (map && !isLoading) {
      initializeVectorLayer(map);
    }
  }, [map, isLoading, initializeVectorLayer]);

  // Render markers when POIs or map changes
  useEffect(() => {
    if (!isLoading && vectorSourceRef.current) {
      renderMarkers();
    }
  }, [pois, isLoading, renderMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vectorLayerRef.current && map) {
        map.removeLayer(vectorLayerRef.current);
      }
      if (vectorSourceRef.current) {
        vectorSourceRef.current.clear();
      }
      if (popupOverlayRef.current && map) {
        map.removeOverlay(popupOverlayRef.current);
      }
      if (popupElementRef.current) {
        popupElementRef.current.remove();
      }
      vectorLayerRef.current = null;
      vectorSourceRef.current = null;
      popupOverlayRef.current = null;
      popupElementRef.current = null;
    };
  }, [map]);

  return {
    pois,
    isLoading,
    addPOI,
    updatePOI,
    deletePOI,
    clearAllPOIs,
    getPOIsByCategory,
    exportGeoJSON,
    importGeoJSON,
    flyToPOI,
    poiCount: pois.length,
  };
}
