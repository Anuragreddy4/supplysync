# SupplySync AI - Integration Handbook & Handoff Manual
**Prepared by**: Person 5 (Integration, Maps, Infra & Demo Lead)

This document contains a complete inventory of the monorepo configuration, Supabase cloud database setup, Google Maps components, utility hooks, and documentation folders built for **SupplySync AI**. It is designed to be fully copy-pasteable so that another AI agent (e.g., Team Lead's AI) can easily ingest and reproduce these files in a single run.

---

## 1. Prerequisites & API Credentials

### Prerequisites
- **Node.js**: v18.0.0 or higher.
- **pnpm**: v11.9.0 or higher. Enable workspace configuration.

> **No Docker needed.** The database is a shared cloud Supabase instance. All services run as plain Node processes via `pnpm dev`.

### Required API Keys
Configure these inside `.env` at the monorepo root:
1. **Google Maps API Key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`): Used by the `<LocationPicker />` autocomplete, map display, and reverse geocoder. Must have the following APIs enabled in Google Cloud Console:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
2. **Firebase Client SDK & Admin SDK Credentials**: Required by `api-client.ts` and Express authentication middleware to verify ID tokens.
3. **Google Gemini API Key** (`GEMINI_API_KEY`): Required by the AI Agents service (`services/ai-agents`) to run forecasting, pricing, trust, and matchmaking prompts.

---

## 2. Root Monorepo Configurations

### [package.json](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/package.json)
```json
{
  "name": "supplysync-ai",
  "version": "1.0.0",
  "private": true,
  "description": "SupplySync AI - Hyperlocal B2B Supply Chain Platform",
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "dev:agents": "pnpm --filter ai-agents dev",
    "dev": "pnpm --filter \"*\" --parallel dev",
    "build": "pnpm --filter \"*\" build",
    "db:migrate": "pnpm --filter api prisma migrate dev"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### [pnpm-workspace.yaml](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/pnpm-workspace.yaml)
```yaml
packages:
  - "apps/*"
  - "services/*"
allowBuilds:
  esbuild: true
  protobufjs: true
```

### [.env.example](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/.env.example)
```ini
# ==============================================================================
# SupplySync AI - Consolidated Environment Variables
# ==============================================================================

# Firebase Authentication Configuration (Frontend + Backend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_client_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Database (Supabase — shared cloud instance, no local Docker needed)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Google Gemini AI Integration
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps Integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Service URLs & Ports (Local Development Defaults)
API_BASE_URL=http://localhost:4000/api
AI_AGENTS_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

---

## 3. Database (Supabase Cloud)

The database is a shared cloud Supabase instance — no local Docker containers needed. pgvector is enabled via the Supabase Dashboard.

### One-Time Setup (Person 1 / Backend Lead)
1. Create a project at [supabase.com](https://supabase.com) (region: Mumbai or Singapore)
2. Dashboard → **Database** → **Extensions** → enable `vector`
3. Dashboard → **Project Settings** → **Database** → copy the **pooled connection string**
4. Share that connection string with the team via the shared `.env`
5. Run `pnpm --filter api prisma migrate dev` once to create all tables

> **Important**: Only Person 1 should run migrations against the shared database to avoid conflicting schema changes. Everyone else only reads/writes data through the API.

---

## 4. Frontend Web Core (`apps/web`)

### [apps/web/package.json](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/package.json)
```json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "firebase": "^10.8.0",
    "framer-motion": "^11.0.3",
    "lucide-react": "^0.331.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.19",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

### [apps/web/tailwind.config.js](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          panel: "var(--bg-panel)",
          glass: "var(--bg-glass)",
          "glass-border": "var(--bg-glass-border)",
        },
        accent: {
          teal: "var(--accent-teal)",
          cyan: "var(--accent-cyan)",
          blue: "var(--accent-blue)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      boxShadow: {
        "glow-teal": "var(--shadow-glow-teal)",
      },
    },
  },
  plugins: [],
}
```

### [apps/web/postcss.config.js](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/postcss.config.js)
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### [apps/web/lib/api-client.ts](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/lib/api-client.ts)
```typescript
import { getAuth } from "firebase/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getAuth();
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Request failed");
  }

  return json.data as T;
}
```

### [apps/web/lib/maps-util.ts](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/lib/maps-util.ts)
```typescript
/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lng1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lng2 Longitude of point 2 in degrees
 * @returns Distance in kilometers (rounded to 2 decimal places)
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(2));
}
```

### [apps/web/hooks/useGeocode.ts](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/hooks/useGeocode.ts)
```typescript
import { useState, useCallback } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

export function useGeocode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(
    async (address: string): Promise<LatLng | null> => {
      setLoading(true);
      setError(null);
      try {
        if (typeof window !== "undefined" && window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          return new Promise<LatLng | null>((resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
              } else {
                reject(new Error(`Geocoding failed with status: ${status}`));
              }
            });
          });
        } else {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            throw new Error("Google Maps API key is not configured.");
          }
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              address
            )}&key=${apiKey}`
          );
          const data = await res.json();
          if (data.status === "OK" && data.results && data.results[0]) {
            const loc = data.results[0].geometry.location;
            return { lat: loc.lat, lng: loc.lng };
          } else {
            throw new Error(data.error_message || `Geocoding status: ${data.status}`);
          }
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred during geocoding");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        if (typeof window !== "undefined" && window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          return new Promise<string | null>((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                resolve(results[0].formatted_address);
              } else {
                reject(new Error(`Reverse geocoding failed with status: ${status}`));
              }
            });
          });
        } else {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            throw new Error("Google Maps API key is not configured.");
          }
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
          );
          const data = await res.json();
          if (data.status === "OK" && data.results && data.results[0]) {
            return data.results[0].formatted_address;
          } else {
            throw new Error(data.error_message || `Reverse geocoding status: ${data.status}`);
          }
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred during reverse geocoding");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { geocodeAddress, reverseGeocode, loading, error };
}
```

### [apps/web/components/shared/LocationPicker.tsx](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/components/shared/LocationPicker.tsx)
```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useGeocode } from "../../hooks/useGeocode";
import { MapPin, Search, Loader2 } from "lucide-react";

interface LocationPickerProps {
  value: {
    lat: number;
    lng: number;
    address: string;
  };
  onChange: (val: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  roleAccent?: "buyer" | "supplier";
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google && window.google.maps) return Promise.resolve();

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (e) => {
        scriptLoadingPromise = null;
        reject(e);
      };
      document.head.appendChild(script);
    });
  }
  return scriptLoadingPromise;
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = "Search address or location...",
  roleAccent = "buyer",
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

  const { reverseGeocode } = useGeocode();

  const ringAccentClass = roleAccent === "buyer" ? "focus:ring-accent-teal" : "focus:ring-accent-blue";
  const textAccentClass = roleAccent === "buyer" ? "text-accent-teal" : "text-accent-blue";
  const glowAccentClass = roleAccent === "buyer" ? "hover:shadow-glow-teal" : "hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]";

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API Key is missing inside environment variables");
      setLoading(false);
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setMapLoaded(true);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load Google Maps SDK");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: value.lat || 17.385, lng: value.lng || 78.4867 },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0F1729" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0F1729" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#E2E8F0" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#14B8A6" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#1E293B" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#334155" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#64748B" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0A0E17" }],
        },
      ],
    });
    mapInstance.current = map;

    const marker = new google.maps.Marker({
      position: { lat: value.lat || 17.385, lng: value.lng || 78.4867 },
      map: map,
      draggable: true,
    });
    markerInstance.current = marker;

    google.maps.event.addListener(marker, "dragend", async () => {
      const position = marker.getPosition();
      if (position) {
        const lat = position.lat();
        const lng = position.lng();
        const address = await reverseGeocode(lat, lng);
        onChange({ lat, lng, address: address || "" });
      }
    });

    if (inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address", "establishment"],
      });
      autocompleteInstance.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || "";

          map.setCenter({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });

          onChange({ lat, lng, address });
        }
      });
    }
  }, [mapLoaded, onChange, reverseGeocode, value.lat, value.lng]);

  useEffect(() => {
    if (mapInstance.current && markerInstance.current && value.lat && value.lng) {
      const currentPos = markerInstance.current.getPosition();
      if (
        !currentPos ||
        Math.abs(currentPos.lat() - value.lat) > 0.0001 ||
        Math.abs(currentPos.lng() - value.lng) > 0.0001
      ) {
        const newPos = { lat: value.lat, lng: value.lng };
        markerInstance.current.setPosition(newPos);
        mapInstance.current.panTo(newPos);
      }
    }
  }, [value.lat, value.lng]);

  return (
    <div className={`flex flex-col space-y-4 p-4 border border-bg-glass-border bg-bg-glass backdrop-blur-md rounded-card transition-all duration-300 ${glowAccentClass}`}>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-text-muted">
          <Search className="w-5 h-5" />
        </span>
        <input
          ref={inputRef}
          type="text"
          defaultValue={value.address}
          placeholder={placeholder}
          disabled={loading}
          className={`w-full pl-10 pr-4 py-3 bg-bg-panel border border-bg-glass-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 ${ringAccentClass} transition-all`}
        />
        {loading && (
          <span className="absolute right-3 text-text-muted animate-spin">
            <Loader2 className="w-5 h-5" />
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm rounded bg-danger/10 border border-danger/20 text-danger">
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg border border-bg-glass-border h-[280px]">
        <div ref={mapRef} className="w-full h-full min-h-[280px] bg-bg-base" />
        {!mapLoaded && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-panel/90 text-text-secondary space-y-2">
            <MapPin className={`w-8 h-8 ${textAccentClass} animate-bounce`} />
            <span className="text-sm">Click search or load map above</span>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-1 text-xs text-text-secondary">
        <div className="flex justify-between">
          <span>Latitude: <span className="font-mono text-text-primary">{value.lat.toFixed(6)}</span></span>
          <span>Longitude: <span className="font-mono text-text-primary">{value.lng.toFixed(6)}</span></span>
        </div>
        <p className="truncate">Selected Address: <span className="text-text-primary">{value.address || "None"}</span></p>
      </div>
    </div>
  );
}
```

### [apps/web/app/globals.css](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/app/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

:root {
  /* Backgrounds */
  --bg-base: #0A0E17;
  --bg-panel: #0F1729;
  --bg-glass: rgba(15, 23, 42, 0.55);
  --bg-glass-border: rgba(148, 163, 184, 0.15);

  /* Brand */
  --accent-teal: #14B8A6;
  --accent-cyan: #22D3EE;
  --accent-blue: #3B82F6;

  /* Semantic */
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #F43F5E;

  /* Text */
  --text-primary: #E2E8F0;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;

  /* Effects */
  --blur-glass: blur(16px);
  --shadow-glow-teal: 0 0 24px rgba(20, 184, 166, 0.25);
  --radius-card: 16px;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: "Inter", sans-serif;
  min-height: 100vh;
  background-image: 
    radial-gradient(at 0% 0%, rgba(20, 184, 166, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%);
  background-attachment: fixed;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Plus Jakarta Sans", sans-serif;
  color: var(--text-primary);
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.glass-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-card);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-base);
}

::-webkit-scrollbar-thumb {
  background: var(--bg-panel);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

### [apps/web/app/layout.tsx](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/app/layout.tsx)
```typescript
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SupplySync AI - Hyperlocal B2B Supply Chain",
  description:
    "An AI-powered B2B platform optimizing supply chain flow with intelligent forecasting, pricing, group-buy matchmaking, and trust-scoring widgets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-accent-teal/30 selection:text-accent-teal">
        {children}
      </body>
    </html>
  );
}
```

### [apps/web/app/page.tsx](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/apps/web/app/page.tsx)
```typescript
"use client";

import { useState } from "react";
import LocationPicker from "../components/shared/LocationPicker";
import { calculateDistanceKm } from "../lib/maps-util";
import { MapPin, Navigation, Compass, Code, LayoutDashboard } from "lucide-react";

export default function Home() {
  const [buyerLoc, setBuyerLoc] = useState({
    lat: 17.4483,
    lng: 78.3741,
    address: "Madhapur, Hyderabad, Telangana, India",
  });

  const [supplierLoc, setSupplierLoc] = useState({
    lat: 17.4834,
    lng: 78.3884,
    address: "Kukatpally, Hyderabad, Telangana, India",
  });

  const distance = calculateDistanceKm(
    buyerLoc.lat,
    buyerLoc.lng,
    supplierLoc.lat,
    supplierLoc.lng
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 flex flex-col min-h-screen">
      <header className="flex flex-col items-center text-center mb-12">
        <div className="flex items-center space-x-3 mb-3 bg-bg-panel/40 px-4 py-1.5 rounded-full border border-bg-glass-border">
          <Compass className="w-5 h-5 text-accent-teal animate-spin" style={{ animationDuration: "10s" }} />
          <span className="text-xs uppercase tracking-widest text-accent-teal font-semibold">
            Integration Dashboard
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent-teal via-accent-cyan to-accent-blue mb-4">
          SupplySync AI
        </h1>
        <p className="text-text-secondary max-w-xl text-lg">
          Master Architecture Core components, maps orchestration, and local orchestration demo for the hyperlocal B2B supply chain ecosystem.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        <section className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-teal/5 rounded-full blur-2xl" />
            <h2 className="text-2xl font-bold flex items-center space-x-2.5 mb-2 text-text-primary">
              <MapPin className="w-6 h-6 text-accent-teal" />
              <span>Location Picker (Buyer)</span>
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Places autocomplete and draggable coordinate pinpointing. Seamless onboarding widget for merchants.
            </p>
            <LocationPicker
              value={buyerLoc}
              onChange={setBuyerLoc}
              roleAccent="buyer"
              placeholder="Search buyer address..."
            />
          </div>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/5 rounded-full blur-2xl" />
            <h2 className="text-2xl font-bold flex items-center space-x-2.5 mb-2 text-text-primary">
              <MapPin className="w-6 h-6 text-accent-blue" />
              <span>Location Picker (Supplier)</span>
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Places autocomplete and draggable coordinates. Onboarding widget for warehouses/distributors.
            </p>
            <LocationPicker
              value={supplierLoc}
              onChange={setSupplierLoc}
              roleAccent="supplier"
              placeholder="Search supplier address..."
            />
          </div>
        </section>

        <section className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 relative overflow-hidden">
            <h2 className="text-xl font-bold flex items-center space-x-2.5 mb-4 text-text-primary">
              <Navigation className="w-5 h-5 text-accent-cyan" />
              <span>Hyperlocal Distance Calculations</span>
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-bg-panel/40 rounded-lg border border-bg-glass-border">
                <div className="text-xs uppercase tracking-wider text-text-secondary mb-1">
                  Buyer Coordinates
                </div>
                <div className="font-mono text-sm text-text-primary flex justify-between">
                  <span>LAT: {buyerLoc.lat.toFixed(4)}</span>
                  <span>LNG: {buyerLoc.lng.toFixed(4)}</span>
                </div>
                <div className="text-xs text-text-muted mt-2 truncate">
                  {buyerLoc.address || "No address selected"}
                </div>
              </div>

              <div className="p-4 bg-bg-panel/40 rounded-lg border border-bg-glass-border">
                <div className="text-xs uppercase tracking-wider text-text-secondary mb-1">
                  Supplier Coordinates
                </div>
                <div className="font-mono text-sm text-text-primary flex justify-between">
                  <span>LAT: {supplierLoc.lat.toFixed(4)}</span>
                  <span>LNG: {supplierLoc.lng.toFixed(4)}</span>
                </div>
                <div className="text-xs text-text-muted mt-2 truncate">
                  {supplierLoc.address || "No address selected"}
                </div>
              </div>

              <div className="p-5 bg-gradient-to-r from-accent-teal/10 to-accent-blue/10 border border-accent-teal/20 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-accent-teal font-semibold">
                    Calculated Distance (Haversine)
                  </div>
                  <div className="text-3xl font-extrabold text-text-primary tabular-nums mt-1">
                    {distance} <span className="text-lg font-medium text-text-secondary">km</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-bg-panel border border-bg-glass-border rounded-full flex items-center justify-center">
                  <Compass className="w-6 h-6 text-accent-cyan" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center space-x-2.5 mb-3 text-text-primary">
              <Code className="w-5 h-5 text-accent-teal" />
              <span>Shared API Client</span>
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Integrated authenticated fetch wrapper with automatic Firebase session token attachment (`Authorization: Bearer &lt;token&gt;`).
            </p>
            <pre className="p-4 bg-bg-base/70 rounded-lg border border-bg-glass-border text-xs font-mono overflow-x-auto text-accent-cyan">
{`// Usage Example:
const listings = await apiFetch<Listing[]>(
  "/listings?lat=17.448&lng=78.374"
);`}
            </pre>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center space-x-2.5 mb-3 text-text-primary">
              <LayoutDashboard className="w-5 h-5 text-accent-blue" />
              <span>Cloud Database & Services</span>
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Database:</span>
                <span className="text-success font-semibold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
                  <span>Supabase PostgreSQL + pgvector</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">API Server:</span>
                <span className="text-text-muted">services/api (pnpm dev)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">AI agents:</span>
                <span className="text-text-muted">services/ai-agents (pnpm dev)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-auto pt-8 border-t border-bg-glass-border text-center text-xs text-text-muted">
        SupplySync AI Monorepo Dashboard • Developed by Person 5 (Integration Lead)
      </footer>
    </main>
  );
}
```


---

## 5. Peer Service Skeletons

### [services/api/package.json](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/services/api/package.json)
```json
{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.19",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3"
  }
}
```

### [services/api/src/index.ts](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/services/api/src/index.ts)
```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    data: { message: "SupplySync AI Express API Server" },
    error: null,
  });
});

app.post("/api/auth/session", (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: "mock-uid-123456",
        email: "demo@supplysync.ai",
        display_name: "Demo Merchant",
        role: "buyer",
      },
    },
    error: null,
  });
});

app.get("/api/listings", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "listing-1",
        material_name: "Premium Rice Grade A",
        category: "grains",
        stock_qty: 1500,
        unit: "kg",
        price_per_unit: 45.0,
      },
      {
        id: "listing-2",
        material_name: "Organic Wheat Seeds",
        category: "seeds",
        stock_qty: 800,
        unit: "kg",
        price_per_unit: 32.5,
      },
    ],
    error: null,
  });
});

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
});
```


### [services/ai-agents/package.json](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/services/ai-agents/package.json)
```json
{
  "name": "ai-agents",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.19",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3"
  }
}
```

### [services/ai-agents/src/index.ts](file:///c:/Users/mouni/OneDrive/Desktop/antigravity/services/ai-agents/src/index.ts)
```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[AI-Agents] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: { message: "SupplySync AI Agent Service" },
    error: null,
  });
});

app.post("/api/forecasts/run", (req, res) => {
  console.log("[AI-Agents] Running Forecast Prediction...");
  res.json({
    success: true,
    data: {
      predicted_qty: 120.0,
      predicted_need_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      confidence: 0.89,
      reasoning: "Historical buyer data shows repeated purchase cycles every 14 days.",
    },
    error: null,
  });
});

app.post("/api/group-buys/match", (req, res) => {
  console.log("[AI-Agents] Matching group-buys...");
  res.json({
    success: true,
    data: {
      matched: true,
      group_buy_id: "group-buy-abc-123",
      savings_percentage: 15.5,
    },
    error: null,
  });
});

app.post("/api/trust/recompute", (req, res) => {
  console.log("[AI-Agents] Recomputing supplier trust score...");
  res.json({
    success: true,
    data: {
      supplier_id: req.body.supplier_id || "supplier-123",
      new_trust_score: 87.5,
      reason: "On-time delivery performance remains optimal at 95%.",
    },
    error: null,
  });
});

app.post("/api/pricing/check", (req, res) => {
  console.log("[AI-Agents] Checking dynamic listing fair price...");
  res.json({
    success: true,
    data: {
      listing_id: req.body.listing_id || "listing-123",
      fair_price_min: 40.0,
      fair_price_max: 48.0,
      is_flagged_high: false,
    },
    error: null,
  });
});

app.listen(PORT, () => {
  console.log(`[AI-Agents] Server running on http://localhost:${PORT}`);
});
```

