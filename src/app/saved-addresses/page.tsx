"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================
// SAVED ADDRESSES — Quick re-booking with saved locations
// Like Uber "Saved Places" / Swiggy "Saved Addresses"
// Syncs with /api/auth/profile for server-side persistence
// ============================================================

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
  isDefault: boolean;
}

const defaultIcons = ["🏠", "🏢", "🏗️", "📍", "🅿️", "🏪"];

export default function SavedAddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIcon, setNewIcon] = useState("📍");
  const [detecting, setDetecting] = useState(false);
  const [detectedLat, setDetectedLat] = useState<number>(0);
  const [detectedLng, setDetectedLng] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kaizy_saved_addresses") || "[]");
      setAddresses(saved);
    } catch {}
  }, []);

  // Save to localStorage + sync to server
  const saveToStorage = async (addrs: SavedAddress[]) => {
    localStorage.setItem("kaizy_saved_addresses", JSON.stringify(addrs));
    setAddresses(addrs);

    // Also persist primary address to server
    const primary = addrs.find(a => a.isDefault) || addrs[0];
    if (primary) {
      try {
        await fetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: primary.address,
            landmark: primary.label,
          }),
        });
      } catch (err) {
        console.error("[saved-addresses] sync error:", err);
      }
    }
  };

  // Detect current location — saves real lat/lng
  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Store the real coordinates
        setDetectedLat(latitude);
        setDetectedLng(longitude);

        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
          );
          const data = await res.json();
          if (data.features?.[0]) {
            setNewAddress(data.features[0].place_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          } else {
            setNewAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch {
          setNewAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setDetecting(false);
        showToast("Location detected successfully");
      },
      () => {
        alert("Could not detect location. Please type your address.");
        setDetecting(false);
      }
    );
  };

  // Add address — uses real lat/lng from GPS detection
  const handleAdd = async () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      alert("Please enter both label and address");
      return;
    }

    setSaving(true);

    const addr: SavedAddress = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      address: newAddress.trim(),
      lat: detectedLat,
      lng: detectedLng,
      icon: newIcon,
      isDefault: addresses.length === 0,
    };

    const updated = [...addresses, addr];
    await saveToStorage(updated);

    setAdding(false);
    setNewLabel("");
    setNewAddress("");
    setNewIcon("📍");
    setDetectedLat(0);
    setDetectedLng(0);
    setSaving(false);
    showToast("Address saved");
  };

  // Delete address
  const handleDelete = (id: string) => {
    if (window.confirm("Remove this saved address?")) {
      saveToStorage(addresses.filter(a => a.id !== id));
      showToast("Address removed");
    }
  };

  // Set default
  const setDefault = (id: string) => {
    saveToStorage(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    showToast("Default address updated");
  };

  // Navigate to booking with address pre-filled
  const useForBooking = (addr: SavedAddress) => {
    const params = new URLSearchParams({
      address: addr.address,
      ...(addr.lat ? { lat: addr.lat.toString() } : {}),
      ...(addr.lng ? { lng: addr.lng.toString() } : {}),
    });
    router.push(`/booking?${params}`);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-[14px] p-3 text-center text-[11px] font-bold text-white"
             style={{ background: "var(--success)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" aria-label="Go back" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Saved Addresses</h1>
          <div className="flex-1" />
          <button onClick={() => setAdding(true)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg active:scale-95"
                  style={{ background: "var(--brand)", color: "#fff" }}>
            + Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-4 mb-4">
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "2px solid var(--brand)" }}>
            <p className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>Add New Address</p>

            {/* Icon selector */}
            <div className="flex gap-2">
              {defaultIcons.map(ic => (
                <button key={ic} onClick={() => setNewIcon(ic)}
                        className="w-10 h-10 rounded-lg text-[18px] flex items-center justify-center active:scale-90"
                        style={{
                          background: newIcon === ic ? "var(--brand-tint)" : "var(--bg-elevated)",
                          border: newIcon === ic ? "2px solid var(--brand)" : "1px solid var(--border-1)",
                        }}>
                  {ic}
                </button>
              ))}
            </div>

            {/* Label */}
            <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                   placeholder="Label (e.g., Home, Office, Site)"
                   className="w-full rounded-lg px-3 py-2.5 text-[13px] font-bold outline-none"
                   style={{ background: "var(--bg-elevated)", color: "var(--text-1)", border: "1px solid var(--border-1)" }} />

            {/* Address */}
            <div className="relative">
              <textarea value={newAddress} onChange={e => setNewAddress(e.target.value)}
                        placeholder="Full address..."
                        rows={2}
                        className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none resize-none"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-1)", border: "1px solid var(--border-1)" }} />
              <button onClick={detectLocation} disabled={detecting}
                      className="absolute right-2 bottom-2 text-[10px] font-bold px-2 py-1 rounded active:scale-95"
                      style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                {detecting ? "Detecting..." : "Detect GPS"}
              </button>
            </div>

            {/* Show detected coords */}
            {detectedLat !== 0 && detectedLng !== 0 && (
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                GPS: {detectedLat.toFixed(4)}, {detectedLng.toFixed(4)}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={() => { setAdding(false); setDetectedLat(0); setDetectedLng(0); }}
                      className="flex-1 rounded-lg py-2.5 text-[12px] font-bold active:scale-95"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-2)" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                      className="flex-[2] rounded-lg py-2.5 text-[12px] font-bold text-white active:scale-95"
                      style={{ background: "var(--brand)", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addresses list */}
      <div className="px-4">
        {addresses.length === 0 && !adding && (
          <div className="text-center py-16">
            <p className="text-[48px] mb-3">📍</p>
            <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No saved addresses</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
              Save your home, office, and work sites for quick booking!
            </p>
            <button onClick={() => setAdding(true)}
                    className="mt-6 rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                    style={{ background: "var(--brand)" }}>
              + Add First Address
            </button>
          </div>
        )}

        <div className="space-y-2">
          {addresses.map(addr => (
            <div key={addr.id} className="rounded-xl p-4 flex items-start gap-3"
                 style={{ background: "var(--bg-card)", border: addr.isDefault ? "2px solid var(--brand)" : "1px solid var(--border-1)" }}>
              <span className="text-[24px] mt-0.5">{addr.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{addr.label}</p>
                  {addr.isDefault && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>DEFAULT</span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--text-3)" }}>{addr.address}</p>
                {addr.lat !== 0 && addr.lng !== 0 && (
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text-3)" }}>
                    GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                  </p>
                )}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => useForBooking(addr)}
                          className="text-[10px] font-bold" style={{ color: "var(--brand)" }}>
                    Use for Booking
                  </button>
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)}
                            className="text-[10px] font-bold" style={{ color: "var(--text-2)" }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)}
                          className="text-[10px] font-bold" style={{ color: "var(--danger)" }}>
                    Remove
                  </button>
                </div>
              </div>
              <button onClick={() => useForBooking(addr)}
                      aria-label="Use for booking"
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                      style={{ background: "var(--brand)" }}>
                <span className="text-white text-[14px]">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
