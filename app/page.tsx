import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/landing/Hero";
import { NavigationButtons } from "@/components/landing/NavigationButtons";
import { TechStack } from "@/components/landing/TechStack";

export const metadata: Metadata = {
  title: "Home - Next.js + OpenLayers",
  description:
    "Production-ready Next.js 16 starter template with vanilla OpenLayers integration. Build modern, interactive map applications with GeoJSON support, custom markers, POI management, measurement tools, and responsive design. Perfect for GIS applications, spatial data visualization, and location-based services.",
  alternates: {
    canonical: "https://nextjs-openlayers-starter.vercel.app",
  },
  openGraph: {
    title:
      "Next.js OpenLayers Starter - Production-Ready Map Application Template",
    description:
      "Build modern, interactive map applications with Next.js 16 and OpenLayers 10. Features include GeoJSON rendering, custom markers, measurement tools, and responsive design.",
    url: "https://nextjs-openlayers-starter.vercel.app",
    type: "website",
  },
};

/**
 * Landing page component (Server Component)
 *
 * Following Next.js 16 best practices:
 * - Server Component by default for better performance
 * - Only child components that need interactivity are Client Components
 * - Image optimization with Next.js Image component
 * - Optimized for dark background with light text
 * - Semantic HTML with proper heading hierarchy
 * - Accessible navigation and content structure
 */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background image */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/vimal-s-GBg3jyGS-Ug-unsplash.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={85}
        />
        {/* Darker overlay for better text readability on dark background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Unsplash attribution */}
      <aside
        className="absolute bottom-4 left-4 z-10 text-xs text-white/90"
        aria-label="Photo attribution"
      >
        <div className="flex items-center gap-1 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
          <span>Photo by</span>
          <a
            href="https://unsplash.com/@vimal_s?utm_source=nextjs-openlayers&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
            aria-label="Vimal S on Unsplash"
          >
            Vimal S
          </a>
          <span>on</span>
          <a
            href="https://unsplash.com?utm_source=nextjs-openlayers&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
            aria-label="Unsplash"
          >
            Unsplash
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex flex-col items-center justify-center min-h-screen">
        {/* Hero section */}
        <section className="w-full" aria-labelledby="hero-heading">
          <Hero />
        </section>

        {/* Navigation buttons */}
        <section className="w-full py-8" aria-label="Quick navigation">
          <NavigationButtons />
        </section>

        {/* Tech stack */}
        <section className="w-full py-8" aria-labelledby="tech-stack-heading">
          <TechStack />
        </section>
      </main>
    </div>
  );
}
