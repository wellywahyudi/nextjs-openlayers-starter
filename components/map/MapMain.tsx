"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { OpenLayersMap } from "@/components/map/OpenLayersMap";
import { OpenLayersTileLayer } from "@/components/map/OpenLayersTileLayer";
import { OpenLayersGeoJSON } from "@/components/map/OpenLayersGeoJSON";
import { MapControls } from "@/components/map/MapControls";
import { MapTileSwitcher } from "@/components/map/MapTileSwitcher";
import { MapSearchBar } from "@/components/map/MapSearchBar";
import { MapDetailsPanel } from "@/components/map/MapDetailsPanel";
import { MapPOIPanel } from "@/components/map/MapPOIPanel";
import { useMapTileProvider } from "@/hooks/useMapTileProvider";
import { usePOIManager } from "@/hooks/usePOIManager";
import type { POICategory } from "@/types/poi";

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
 * - Country search with GeoJSON rendering
 * - Country details panel
 * - POI management with CRUD operations
 */
export function MapMain() {
  const { tileProvider, currentProviderId, setProviderId } =
    useMapTileProvider();

  const [selectedCountry, setSelectedCountry] =
    useState<GeoJSON.Feature | null>(null);

  // POI Panel state
  const [isPOIPanelOpen, setIsPOIPanelOpen] = useState(false);
  const [poiFilterCategory, setPOIFilterCategory] =
    useState<POICategory | null>(null);
  const [poiInitialCoords, setPOIInitialCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [poiPanelMode, setPOIPanelMode] = useState<"list" | "add">("list");
  const [isSelectingPOILocation, setIsSelectingPOILocation] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // POI Manager hook
  const {
    pois,
    addPOI,
    updatePOI,
    deletePOI,
    clearAllPOIs,
    exportGeoJSON,
    importGeoJSON,
    flyToPOI,
  } = usePOIManager();

  // Handle country selection from search
  const handleCountrySelect = useCallback(async (countryId: string) => {
    try {
      const response = await fetch(`/api/countries/${countryId}`);
      const data = await response.json();
      setSelectedCountry(data);
    } catch (error) {
      console.error("Failed to fetch country:", error);
    }
  }, []);

  // Handle clearing selection
  const handleClearSelection = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  // POI Panel handlers
  const handleOpenPOIPanel = useCallback((category?: POICategory) => {
    setPOIFilterCategory(category || null);
    setPOIInitialCoords(null);
    setPOIPanelMode("list");
    setIsPOIPanelOpen(true);
  }, []);

  const handleClosePOIPanel = useCallback(() => {
    setIsPOIPanelOpen(false);
    setIsSelectingPOILocation(false);
    setPOIPanelMode("list");
    // Reset coordinates and category after a brief delay to allow panel to close smoothly
    setTimeout(() => {
      setPOIFilterCategory(null);
      setPOIInitialCoords(null);
    }, 100);
  }, []);

  // Handle POI location selection request
  const handleRequestPOILocation = useCallback(() => {
    setIsSelectingPOILocation((prev) => !prev);
  }, []);

  // Handle clear POI coordinates
  const handleClearPOICoordinates = useCallback(() => {
    setPOIInitialCoords(null);
    setCursorCoords(null);
    setIsSelectingPOILocation(false);
  }, []);

  // Handle POI panel mode change
  const handlePOIModeChange = useCallback((mode: "list" | "add" | "edit") => {
    setPOIPanelMode(mode as "list" | "add");
  }, []);

  const handlePOIExport = useCallback(() => {
    const geojson = exportGeoJSON();
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-places-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Places exported successfully!");
  }, [exportGeoJSON]);

  const handlePOIImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const geojson = JSON.parse(text);
        const count = importGeoJSON(geojson);
        toast.success(
          `Successfully imported ${count} place${count !== 1 ? "s" : ""}!`
        );
      } catch (error) {
        console.error("Failed to import POIs:", error);
        toast.error("Failed to import file. Please check the format.");
      }
    },
    [importGeoJSON]
  );

  return (
    <>
      <OpenLayersMap className="w-full h-full">
        <OpenLayersTileLayer provider={tileProvider} />
        <OpenLayersGeoJSON data={selectedCountry} fitBounds={true} />
      </OpenLayersMap>
      <MapSearchBar
        onCountrySelect={handleCountrySelect}
        selectedCountry={selectedCountry}
        onClearSelection={handleClearSelection}
        onPOIClick={() => handleOpenPOIPanel()}
        isPOIPanelOpen={isPOIPanelOpen}
        onClosePOIPanel={handleClosePOIPanel}
      />
      <MapDetailsPanel
        country={selectedCountry}
        onClose={handleClearSelection}
      />
      <MapPOIPanel
        isOpen={isPOIPanelOpen}
        onClose={handleClosePOIPanel}
        pois={pois}
        filterCategory={poiFilterCategory}
        onAddPOI={addPOI}
        onUpdatePOI={updatePOI}
        onDeletePOI={deletePOI}
        onClearAll={clearAllPOIs}
        onExport={handlePOIExport}
        onImport={handlePOIImport}
        onFlyTo={flyToPOI}
        onRequestLocation={handleRequestPOILocation}
        onClearCoordinates={handleClearPOICoordinates}
        onModeChange={handlePOIModeChange}
        isSelectingLocation={isSelectingPOILocation}
        initialLat={poiInitialCoords?.lat}
        initialLng={poiInitialCoords?.lng}
        cursorLat={cursorCoords?.lat}
        cursorLng={cursorCoords?.lng}
        mode={poiPanelMode}
      />
      <MapControls />
      <MapTileSwitcher
        selectedProviderId={currentProviderId}
        onProviderChange={setProviderId}
      />
    </>
  );
}
