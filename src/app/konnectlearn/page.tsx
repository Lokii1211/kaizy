"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Play, Star, CheckCircle2, Clock, Award,
  TrendingUp, ChevronRight, CircuitBoard, Droplets, Hammer, Wind,
  Wrench, GraduationCap, Users, Globe, Search, BarChart3, Lock,
} from "lucide-react";

const courses = [
  { id: 1, title: "House Wiring — Beginner to Expert", skill: "Electrician", icon: CircuitBoard, lang: "Hindi + Tamil", duration: "12 hrs", lessons: 24, enrolled: "2.3K", rating: 4.8, badge: "Wiring Expert", free: true, color: "#FF6B2C", progress: 65 },
  { id: 2, title: "Solar Panel Installation", skill: "Electrician", icon: CircuitBoard, lang: "Hindi", duration: "8 hrs", lessons: 16, enrolled: "1.5K", rating: 4.7, badge: "Solar Pro", free: true, color: "#F59E0B", progress: 0 },
  { id: 3, title: "Modern Plumbing Techniques", skill: "Plumber", icon: Droplets, lang: "Hindi + Tamil", duration: "10 hrs", lessons: 20, enrolled: "1.8K", rating: 4.6, badge: "Adv Plumber", free: true, color: "#3B82F6", progress: 0 },
  { id: 4, title: "Split AC Service & Repair", skill: "AC Tech", icon: Wind, lang: "Hindi + English", duration: "14 hrs", lessons: 28, enrolled: "1.1K", rating: 4.9, badge: "AC Service Pro", free: false, color: "#00C9A7", progress: 0 },
  { id: 5, title: "Furniture Making & Carpentry", skill: "Carpenter", icon: Hammer, lang: "Hindi", duration: "16 hrs", lessons: 32, enrolled: "980", rating: 4.5, badge: "Furniture Expert", free: true, color: "#8B5CF6", progress: 0 },
  { id: 6, title: "Industrial Welding — MIG & Arc", skill: "Welder", icon: Wrench, lang: "Hindi + Marathi", duration: "18 hrs", lessons: 36, enrolled: "670", rating: 4.7, badge: "Welder Pro", free: false, color: "#EF4444", progress: 0 },
];

export default function KonnectLearnPage() {
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = courses.filter(c => {
    const matchSkill = selectedSkill === "All" || c.skill === selectedSkill;
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSkill && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 pt-3 pb-6 px-5 rounded-b-[28px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />

        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <span className="text-white font-bold text-sm">KonnectLearn</span>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-white mb-1">Learn. Earn Badges. Get Better Jobs.</h1>
        <p className="text-xs text-white/50 mb-4">AI-powered upskilling in your language • FREE</p>

        <div className="flex gap-3">
          {[
            { val: "50+", label: "Courses" },
            { val: "12K+", label: "Trained" },
            { val: "8", label: "Languages" },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-sm font-extrabold text-white">{s.val}</p>
              <p className="text-[9px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4 mt-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Skill Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {["All", "Electrician", "Plumber", "AC Tech", "Carpenter", "Welder"].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSkill(s)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedSkill === s ? "bg-purple-600 text-white shadow-md" : "bg-gray-100 text-gray-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* AI Skill Gap */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-red-500" />
            <p className="text-xs font-extrabold text-red-700">AI Skill Gap Alert</p>
          </div>
          <p className="text-xs text-gray-600 mb-2">Solar Panel installers have <span className="font-bold text-red-600">3x higher demand</span> than supply in your city!</p>
          <button className="text-[10px] text-red-600 font-bold flex items-center gap-0.5 active:scale-95">
            Start Solar Course <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Continue Learning */}
        {courses[0].progress > 0 && (() => {
          const ContinueIcon = courses[0].icon;
          return (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">CONTINUE LEARNING</p>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${courses[0].color}12` }}>
                  <ContinueIcon className="w-6 h-6" style={{ color: courses[0].color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{courses[0].title}</p>
                  <p className="text-[10px] text-gray-400">{courses[0].lessons} lessons • {courses[0].duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${courses[0].progress}%` }} />
                </div>
                <span className="text-[10px] font-bold text-purple-600">{courses[0].progress}%</span>
              </div>
              <button className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                <Play className="w-4 h-4" /> Resume Learning
              </button>
            </div>
          </div>
          );
        })()}

        {/* Course List */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ALL COURSES</p>
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
                {/* Color header */}
                <div className="h-2 w-full" style={{ background: c.color }} />
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}12` }}>
                      <c.icon className="w-5 h-5" style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-bold truncate">{c.title}</h3>
                      </div>
                      <p className="text-[10px] text-gray-400">{c.skill} • {c.lang}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${c.free ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {c.free ? "FREE" : "₹299"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><Play className="w-3 h-3" /> {c.lessons} lessons</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {c.duration}</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {c.rating}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {c.enrolled}</span>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-xl mb-3">
                    <Award className="w-4 h-4 text-purple-600 shrink-0" />
                    <p className="text-[10px] text-purple-700 font-semibold">Earn: <span className="font-bold">{c.badge}</span> badge → unlock higher-paying jobs</p>
                  </div>

                  <button className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <Play className="w-4 h-4" /> Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-400">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}
