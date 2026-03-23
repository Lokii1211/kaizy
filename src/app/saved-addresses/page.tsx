"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// SAVED ADDRESSES — Quick re-booking with saved locations
// Like Uber "Saved Places" / Swiggy "Saved Addresses"
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
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIcon, setNewIcon] = useState("📍");
  const [detecting, setDetecting] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kaizy_saved_addresses") || "[]");
      setAddresses(saved);
    } catch {}
  }, []);

  // Save to localStorage
  const saveToStorage = (addrs: SavedAddress[]) => {
    localStorage.setItem("kaizy_saved_addresses", JSON.stringify(addrs));
    setAddresses(addrs);
  };

  // Detect current location
  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
          );
          const data = await res.json();
          if (data.features?.[0]) {
            setNewAddress(data.features[0].place_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch {
          setNewAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setDetecting(false);
      },
      () => {
        alert("Could not detect location. Please type your address.");
        setDetecting(false);
      }
    );
  };

  // Add address
  const handleAdd = () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      alert("Please enter both label and address");
      return;
    }
    const addr: SavedAddress = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      address: newAddress.trim(),
      lat: 0,
      lng: 0,
      icon: newIcon,
      isDefault: addresses.length === 0,
    };
    saveToStorage([...addresses, addr]);
    setAdding(false);
    setNewLabel("");
    setNewAddress("");
    setNewIcon("📍");
  };

  // Delete address
  const handleDelete = (id: string) => {
    if (window.confirm("Remove this saved address?")) {
      saveToStorage(addresses.filter(a => a.id !== id));
    }
  };

  // Set default
  const setDefault = (id: string) => {
    saveToStorage(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
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
            <p className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>📍 Add New Address</p>

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
                {detecting ? "⏳" : "📍"} Detect
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)}
                      className="flex-1 rounded-lg py-2.5 text-[12px] font-bold active:scale-95"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-2)" }}>
                Cancel
              </button>
              <button onClick={handleAdd}
                      className="flex-[2] rounded-lg py-2.5 text-[12px] font-bold text-white active:scale-95"
                      style={{ background: "var(--brand)" }}>
                💾 Save Address
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
                <div className="flex gap-3 mt-2">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)}
                            className="text-[10px] font-bold" style={{ color: "var(--brand)" }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)}
                          className="text-[10px] font-bold" style={{ color: "var(--danger)" }}>
                    Remove
                  </button>
                </div>
              </div>
              <Link href={`/booking?address=${encodeURIComponent(addr.address)}`}
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "var(--brand)" }}>
                <span className="text-white text-[14px]">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
