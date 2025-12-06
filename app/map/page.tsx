import type { Metadata } from "next";
import { MapProvider } from "@/contexts/MapContext";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { MapLoadingSpinner } from "@/components/map/MapLoadingSpinner";
import { MapMain } from "@/components/map/MapMain";

export const metadata: Metadata = {
  title: "Interactive Map",
  description:
    "Interactive OpenLayers map with country search, GeoJSON visualization, custom markers, POI management, measurement tools, and responsive design. Features include distance and area measurement, right-click context menu, geolocation, and theme-aware tile switching.",
  alternates: {
    canonical: "https://nextjs-openlayers-starter.vercel.app/map",
  },
  openGraph: {
    title: "Interactive Map - Next.js OpenLayers Starter",
    description:
      "Explore the interactive map with country search, GeoJSON visualization, custom markers, and measurement tools powered by OpenLayers 10.",
    url: "https://nextjs-openlayers-starter.vercel.app/map",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Map page component (Server Component)
 *
 * Following Next.js 16 best practices:
 * - Server Component by default for better performance and SEO
 * - Child components (MapMain, MapProvider, etc.) are Client Components
 *
 * Features:
 * - Full-screen map layout with OpenLayers integration
 * - Error boundary for graceful error handling
 * - Loading spinner during initialization
 * - Map controls (zoom, reset, fullscreen)
 * - Tile provider switcher with theme-aware auto-switching
 * - Responsive design
 *
 * This page demonstrates the OpenLayersMap component with tile layer switching,
 * interactive controls, and theme integration.
 */
export default function MapPage() {
  return (
    <div className="relative w-full h-screen">
      <MapErrorBoundary>
        <MapProvider>
          <MapMain />
          <MapLoadingSpinner />
        </MapProvider>
      </MapErrorBoundary>
    </div>
  );
}
