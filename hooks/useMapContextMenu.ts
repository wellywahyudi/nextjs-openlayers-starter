'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useOpenLayersMap } from './useOpenLayersMap';
import { olToLatLng } from '@/lib/utils/coordinates';
import type { MapBrowserEvent } from 'ol';

export interface ContextMenuPosition {
  x: number;
  y: number;
  latlng: {
    lat: number;
    lng: number;
  };
}

export interface UseMapContextMenuReturn {
  isOpen: boolean;
  position: ContextMenuPosition | null;
  close: () => void;
}

/**
 * Hook for managing map context menu (right-click menu)
 * 
 * Features:
 * - Proper event handler cleanup (stores reference to specific handler)
 * - Prevents default browser context menu on map
 * - Tracks click position in both screen and map coordinates
 * - Closes on map click, scroll, or escape key
 * 
 * @returns Object with context menu state and controls
 */
export function useMapContextMenu(): UseMapContextMenuReturn {
  const map = useOpenLayersMap();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  
  // Store handler references for proper cleanup
  const contextMenuHandlerRef = useRef<((e: MapBrowserEvent<PointerEvent>) => boolean) | null>(null);
  const clickHandlerRef = useRef<((e: MapBrowserEvent<PointerEvent>) => boolean) | null>(null);
  const moveStartHandlerRef = useRef<(() => void) | null>(null);

  /**
   * Close the context menu
   */
  const close = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
  }, []);

  /**
   * Handle escape key to close menu
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, close]);

  /**
   * Setup context menu event handlers
   */
  useEffect(() => {
    if (!map) return;

    // Context menu handler (right-click)
    const handleContextMenu = (e: MapBrowserEvent<PointerEvent>) => {
      // Prevent default browser context menu
      e.originalEvent.preventDefault();
      
      // Get pixel position relative to the map container
      const pixel = e.pixel;
      
      // Get map coordinate and convert to [lat, lng]
      const coordinate = e.coordinate;
      const [lat, lng] = olToLatLng(coordinate as [number, number]);
      
      setPosition({
        x: pixel[0],
        y: pixel[1],
        latlng: {
          lat,
          lng,
        },
      });
      setIsOpen(true);
      
      return false; // Prevent event propagation
    };

    // Click handler to close menu
    const handleClick = () => {
      if (isOpen) {
        close();
      }
      return true; // Allow event propagation
    };

    // Move/drag handler to close menu
    const handleMoveStart = () => {
      if (isOpen) {
        close();
      }
    };

    // Store references
    contextMenuHandlerRef.current = handleContextMenu;
    clickHandlerRef.current = handleClick;
    moveStartHandlerRef.current = handleMoveStart;

    // Attach handlers
    // @ts-ignore - OpenLayers event types are complex
    map.on('contextmenu', handleContextMenu);
    // @ts-ignore - OpenLayers event types are complex
    map.on('click', handleClick);
    map.on('movestart', handleMoveStart);

    // Cleanup
    return () => {
      if (contextMenuHandlerRef.current) {
        // @ts-ignore - OpenLayers event types are complex
        map.un('contextmenu', contextMenuHandlerRef.current);
        contextMenuHandlerRef.current = null;
      }
      if (clickHandlerRef.current) {
        // @ts-ignore - OpenLayers event types are complex
        map.un('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
      if (moveStartHandlerRef.current) {
        map.un('movestart', moveStartHandlerRef.current);
        moveStartHandlerRef.current = null;
      }
    };
  }, [map, isOpen, close]);

  return {
    isOpen,
    position,
    close,
  };
}
