"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// JOB PHOTOS — Before/After documentation
// Like Urban Company's job documentation
// Workers/Users can upload before & after photos
// ============================================================

interface JobPhoto {
  id: string; type: "before" | "after"; url: string;
  label: string; timestamp: number;
}

export default function JobPhotosPage() {
  const { isDark } = useTheme();
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhoto: JobPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: activeTab,
          url: reader.result as string,
          label: activeTab === "before" ? "Before repair" : "After repair",
          timestamp: Date.now(),
        };
        setPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const beforePhotos = photos.filter(p => p.type === "before");
  const afterPhotos = photos.filter(p => p.type === "after");
  const currentPhotos = activeTab === "before" ? beforePhotos : afterPhotos;

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href="/tracking" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Job Photos</h1>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
          {photos.length} photos
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(["before", "after"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
                  className="flex-1 rounded-xl py-3 text-[13px] font-bold active:scale-95 transition-all"
                  style={{
                    background: activeTab === tab ? "var(--brand)" : "var(--bg-card)",
                    color: activeTab === tab ? "#fff" : "var(--text-2)",
                    border: "1px solid var(--border-1)",
                  }}>
            {tab === "before" ? "📸 Before" : "✅ After"} ({tab === "before" ? beforePhotos.length : afterPhotos.length})
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="mx-4 mb-4 rounded-xl p-3" style={{ background: "var(--brand-tint)", border: "1px solid var(--brand)" }}>
        <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
          {activeTab === "before"
            ? "📸 Take photos BEFORE the worker starts — for documentation"
            : "✅ Take photos AFTER the job is done — for quality records"}
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: "var(--text-3)" }}>
          Photos help resolve disputes and maintain quality standards
        </p>
      </div>

      {/* Photos grid */}
      <div className="px-4">
        {currentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[40px] mb-3">{activeTab === "before" ? "📷" : "🏆"}</p>
            <p className="text-[14px] font-black mb-1" style={{ color: "var(--text-1)" }}>
              No {activeTab} photos yet
            </p>
            <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>
              {activeTab === "before"
                ? "Document the issue before the worker starts"
                : "Capture the completed work for your records"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {currentPhotos.map(photo => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-1)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.label} className="w-full h-40 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                  <p className="text-[10px] font-bold text-white">{photo.label}</p>
                  <p className="text-[8px] text-white" style={{ opacity: 0.7 }}>
                    {new Date(photo.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple
               onChange={handleUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl py-4 text-[14px] font-black text-white active:scale-95 mb-3"
                style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
          📷 {activeTab === "before" ? "Take Before Photo" : "Take After Photo"}
        </button>

        {/* Compare side-by-side */}
        {beforePhotos.length > 0 && afterPhotos.length > 0 && (
          <div className="rounded-xl p-3 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-1)" }}>📊 Before vs After</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg overflow-hidden">
                <p className="text-[8px] font-bold text-center py-1" style={{ background: "var(--danger)", color: "#fff" }}>BEFORE</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={beforePhotos[0].url} alt="Before" className="w-full h-28 object-cover" />
              </div>
              <div className="flex-1 rounded-lg overflow-hidden">
                <p className="text-[8px] font-bold text-center py-1" style={{ background: "var(--success)", color: "#fff" }}>AFTER</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={afterPhotos[0].url} alt="After" className="w-full h-28 object-cover" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
