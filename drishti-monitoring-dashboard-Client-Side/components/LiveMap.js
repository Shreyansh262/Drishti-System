"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so load the actual map only on the client (no SSR).
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
      Loading map...
    </div>
  ),
});

export default function LocationMap({ lat, lng }) {
  return <MapView lat={lat} lng={lng} />;
}
