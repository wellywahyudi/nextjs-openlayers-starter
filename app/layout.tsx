import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper } from "@/components/providers/ThemeProviderWrapper";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nextjs-openlayers-starter.vercel.app"),
  title: {
    default:
      "Next.js OpenLayers Starter - Production-Ready Map Application Template",
    template: "%s | Next.js OpenLayers Starter",
  },
  description:
    "Production-ready Next.js 16 starter template with vanilla OpenLayers integration. Build modern, interactive map applications with GeoJSON support, custom markers, measurement tools, and responsive design. Perfect for GIS apps, dashboards, and spatial data visualization.",
  keywords: [
    "Next.js",
    "OpenLayers",
    "React",
    "TypeScript",
    "mapping",
    "GIS",
    "geospatial",
    "map application",
    "starter template",
    "OpenLayers 10",
    "Next.js 16",
    "React 19",
    "web mapping",
    "interactive maps",
    "GeoJSON",
    "vector tiles",
    "spatial data",
    "map visualization",
    "Tailwind CSS",
    "shadcn/ui",
    "Google Maps UI",
  ],
  authors: [{ name: "Welly Wahyudi", url: "https://github.com/wellywahyudi" }],
  creator: "Welly Wahyudi",
  publisher: "Welly Wahyudi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nextjs-openlayers-starter.vercel.app",
    title:
      "Next.js OpenLayers Starter - Production-Ready Map Application Template",
    description:
      "Production-ready Next.js 16 starter template with vanilla OpenLayers integration. Build modern, interactive map applications with GeoJSON support, custom markers, and measurement tools.",
    siteName: "Next.js OpenLayers Starter",
    images: [
      {
        url: "/screenshot.png",
        width: 1200,
        height: 630,
        alt: "Next.js OpenLayers Starter - Interactive Map Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Next.js OpenLayers Starter - Production-Ready Map Application Template",
    description:
      "Production-ready Next.js 16 starter template with vanilla OpenLayers integration. Build modern, interactive map applications.",
    images: ["/screenshot.png"],
    creator: "@wellywahyudi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="canonical"
          href="https://nextjs-openlayers-starter.vercel.app"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProviderWrapper>
          {children}
          <Toaster />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
