"use client";
import { useEffect, useRef } from "react";

interface LiveMapProps {
  center: { lat: number; lng: number };
  workerPos?: { lat: number; lng: number } | null;
  userPos?: { lat: number; lng: number } | null;
  workerIcon?: string;
  zoom?: number;
  className?: string;
  isDark?: boolean;
}

export default function LiveMap({ center, workerPos, userPos, workerIcon = "🔧", zoom = 14, className = "", isDark = false }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const workerMarkerRef = useRef<unknown>(null);
  const userMarkerRef = useRef<unknown>(null);
  const polylineRef = useRef<unknown>(null);
  const L = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const init = async () => {
      const leaflet = await import("leaflet");
      L.current = leaflet;

      // Inject Leaflet CSS once
      if (!document.getElementById("leaflet-css")) {
        const style = document.createElement("style");
        style.id = "leaflet-css";
        style.textContent = `.leaflet-container{background:#1a1a2e}.leaflet-tile-container img{filter:${isDark ? "invert(1) hue-rotate(180deg) brightness(0.85) saturate(1.2)" : "none"}}.leaflet-control-attribution{display:none !important}.leaflet-control-zoom{border:none !important}.leaflet-control-zoom a{background:var(--bg-card) !important;color:var(--text-1) !important;border:none !important;border-radius:8px !important;margin-bottom:4px !important;font-size:16px !important}`;
        document.head.appendChild(style);
      }

      const map = leaflet.map(containerRef.current!, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // OpenStreetMap tiles (free, no token)
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // User / destination pin
      if (userPos) {
        const el = leaflet.divIcon({
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);border:3px solid white;box-shadow:0 4px 16px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;font-size:16px">📍</div><div style="width:2px;height:10px;background:#3B82F6;margin-top:2px"></div></div>`,
          iconSize: [0, 0],
          className: "",
        });
        userMarkerRef.current = leaflet.marker([userPos.lat, userPos.lng], { icon: el }).addTo(map);
      }

      // Worker marker
      if (workerPos) {
        const el = leaflet.divIcon({
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#FF6B00,#FF4500);border:3px solid white;box-shadow:0 4px 16px rgba(255,107,0,0.5);display:flex;align-items:center;justify-content:center;font-size:20px">${workerIcon}</div><div style="width:2px;height:10px;background:#FF6B00;margin-top:2px"></div></div>`,
          iconSize: [0, 0],
          className: "",
        });
        workerMarkerRef.current = leaflet.marker([workerPos.lat, workerPos.lng], { icon: el }).addTo(map);
      }

      // Draw line between worker and user
      if (workerPos && userPos) {
        polylineRef.current = leaflet.polyline(
          [[workerPos.lat, workerPos.lng], [userPos.lat, userPos.lng]],
          { color: "#FF6B00", weight: 3, dashArray: "8 6", opacity: 0.7 }
        ).addTo(map);

        // Fit both in view
        map.fitBounds([[workerPos.lat, workerPos.lng], [userPos.lat, userPos.lng]], { padding: [50, 50] });
      }
    };

    init().catch(console.error);

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        workerMarkerRef.current = null;
        userMarkerRef.current = null;
        polylineRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update worker position smoothly
  useEffect(() => {
    if (!workerPos || !workerMarkerRef.current || !mapRef.current || !L.current) return;
    type Marker = { setLatLng: (pos: [number, number]) => void };
    type Polyline = { setLatLngs: (coords: [number, number][]) => void };
    (workerMarkerRef.current as Marker).setLatLng([workerPos.lat, workerPos.lng]);
    if (polylineRef.current && userPos) {
      (polylineRef.current as Polyline).setLatLngs([[workerPos.lat, workerPos.lng], [userPos.lat, userPos.lng]]);
    }
  }, [workerPos, userPos]);

  return <div ref={containerRef} className={className} style={{ zIndex: 1 }} />;
}
