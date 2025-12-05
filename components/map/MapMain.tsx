"use client";

import { OpenLayersMap } from "@/components/map/OpenLayersMap";
import { OpenLayersTileLayer } from "@/components/map/OpenLayersTileLayer";
import { MapControls } from "@/components/map/MapControls";
import { MapTileSwitcher } from "@/components/map/MapTileSwitcher";
import { useMapTileProvider } from "@/hooks/useMapTileProvider";

/**
 * MapMain - Main map component with tile provider management
 *
 * This is a Client Component that manages the tile provider state
 * and renders the map with controls and tile switcher.
 *
 * Features:
 * - Theme-aware tile provider switching
 * - Manual tile provider selection
 * - Map controls (zoom, reset, fullscreen)
 * - Tile switcher UI
 */
export function MapMain() {
  const { tileProvider, currentProviderId, setProviderId } =
    useMapTileProvider();

  return (
    <>
      <OpenLayersMap className="w-full h-full">
        <OpenLayersTileLayer provider={tileProvider} />
      </OpenLayersMap>
      <MapControls />
      <MapTileSwitcher
        selectedProviderId={currentProviderId}
        onProviderChange={setProviderId}
      />
    </>
  );
}
