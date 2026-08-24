# ⚡ Kaizy — India's Workforce Operating System

<div align="center">

![Kaizy Logo](/public/kaizy-logo.png)

**Hyperlocal On-Demand Skilled Workforce Platform for India**  
*Connecting 55 Crore Skilled Technicians with Verified Hirers in Seconds*

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-green?logo=supabase)](https://supabase.com/)
[![Mapbox GL](https://img.shields.io/badge/Mapbox-GL%20JS%20v3-000000?logo=mapbox)](https://www.mapbox.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-3--Stage%20Escrow-02042B?logo=razorpay)](https://razorpay.com/)
[![Claude AI](https://img.shields.io/badge/Anthropic-Claude%20Opus%20AI-CC785C?logo=anthropic)](https://www.anthropic.com/)

</div>

---

## 📖 Overview

**Kaizy** is a mobile-first, high-performance workforce operating platform tailored for India's service economy. Designed with an ultra-responsive interface that operates seamlessly even on budget devices (such as Redmi 9A with 2GB RAM over 3G networks), Kaizy connects homeowners and businesses with verified electricians, plumbers, mechanics, AC repair specialists, carpenters, painters, masons, and locksmiths.

---

## 🚀 Key Modules & Capabilities

### 1. 🚨 Emergency SOS Dispatch (`/hirer/sos`)
- **Sub-3s Dispatch Engine**: High-accuracy GPS geolocation with reverse geocoding fallback.
- **Distance-Zoned Pricing**: Transparent visit fee tiers (₹49 for $< 3$ km, ₹79 for $3\text{--}7$ km, ₹119 for $7\text{--}15$ km).
- **Parallel Dispatch Alerts**: Instant worker broadcast via Web Push / FCM and WhatsApp Business API.
- **Live ETAs**: Real calculations derived from the nearest available worker in the matching trade.

### 2. 🗺️ Live GPS Tracking (`/hirer/tracking/[bookingId]`)
- **Full-Bleed Mapbox GL Dark Map**: Real-time rotating worker marker with compass heading, destination home pin, and orange `#FF6B00` polyline route.
- **Dynamic 4-Stage Progress Visualizer**: `Confirmed` $\to$ `En Route` $\to$ `Arrived` $\to$ `Completed`.
- **Diagnosis Quote Review**: In-app itemized quote approval modal with instant deposit balance deduction.
- **Direct Calling & In-App Chat**: Seamless communication between hirer and worker.

### 3. 📅 Later Booking & Worker Discovery (`/hirer/browse` & `/hirer/worker/[workerId]`)
- **Real-Time Worker Profiles**: Verified credentials (`✓ ID`, `✓ Aadhaar`, `✓ ITI Cert`), KaazyScore rating breakdown, and portfolio gallery lightbox.
- **Transparent Service Pricing**: Granular labour rates and visit charges directly from `worker_pricing`.
- **Availability Calendar**: Dynamic slot booking respecting worker working hours and buffer windows.

### 4. 🛠️ Worker 6-State Active Job Flow (`/worker/job/[bookingId]`)
- **State Machine**:
  1. `accepted`: Job overview & turn-by-turn navigation link to Google Maps.
  2. `en_route`: 10-second continuous background GPS broadcast to `worker_locations`.
  3. `arrived`: Start OTP verification & digital diagnosis sheet requiring $\ge 2$ before-photos.
  4. `quote_sent`: Live quote status waiting for hirer authorization.
  5. `working`: Live task timer with after-photos requirement ($\ge 2$).
  6. `completed`: Immediate auto-settlement release to worker UPI.
- **Celebration Screen** (`/worker/payment-received`): Direct UPI payout breakdown and score multiplier animations.

### 5. ⭐️ Two-Sided Trust & Review System (`/hirer/review/[bookingId]` & `/worker/review-hirer/[bookingId]`)
- **Hirer Reviews**: Spring scale 5-star rating, polarity-adaptive quick tags, multilingual voice review recording with live audio waveform visualization and playback.
- **Worker Reviews**: 3-tier customer feedback (`⭐ Great`, `😐 Okay`, `⚠️ Difficult`), behavior tags, and private safety notes.

### 6. 📋 Real-Time My Jobs Screens
- **Hirer** (`/hirer/my-jobs`): Active job cards with live actions, upcoming schedule management (reschedule/cancel), paginated history with interactive receipt modal breakdown and 1-tap **Book Again**.
- **Worker** (`/worker/my-jobs`): Active job resume card, upcoming jobs with **1-hour location privacy unlock**, and comprehensive **Earnings Tab** with 7-day trend chart, period toggles (Today/Week/Month), and withdrawal links.

### 7. 🤖 KonnectBot Claude AI Assistant (`/kaizybot`)
- **Real Claude Opus Backend** (`/api/bot/chat`): Parallel context retrieval (user stats, KaazyScore, 30-day earnings, recent bookings).
- **Indian Elder Sibling Persona**: Warm, practical, concise responses (max 80 words).
- **Multilingual Switcher**: Native support for **Tamil (`ta`)**, **Hindi (`hi`)**, **Telugu (`te`)**, and **English (`en`)**.
- **Role-Aware Quick Actions**: Workers find jobs, inspect today's earnings, and review KaazyScore perks; Hirers check active booking status, trigger SOS, and review escrow mechanics.

### 8. ⚙️ Settings & DPDP Act 2023 Compliance (`/settings`)
- **In-Line Profile Editor**: Instant name & photo updates.
- **Real Verification Checklist**: Audits phone OTP, profile photo, government ID, and trade cert.
- **Instant Theme & Language Switcher**: Dark/Light/System mode with instant DOM class switching and multi-language chips.
- **Granular Notification Preferences**: JSONB-persisted settings for Push and WhatsApp alerts.
- **Captain Rate & Schedule Controls**: Directly manage service price bounds and weekly operational hours.
- **DPDP Act 2023 Data Privacy**:
  - `POST /api/privacy/export`: Complete JSON data export.
  - `POST /api/auth/delete-account`: 2-step verification (`"DELETE"`), settling pending payouts and scheduling 30-day permanent deletion.
- **In-App Bug Reporting**: Form with category and description logging to `bug_reports`.

### 9. 🚀 Performance & Low-End Mobile Optimization
- **SWR Intelligent Caching** (`src/lib/swr-hooks.ts`):
  - Workers: 30s deduping interval, focus revalidation.
  - Earnings: 60s cache.
  - Market Pricing: 7-day immutable local cache.
- **Mapbox RAM Budgeting**: Markers capped at 20 closest workers; complete WebGL instance cleanup on unmount.
- **Route Pre-Warming**: Next.js route prefetching on touch/hover for critical paths.
- **Offline Resilience**: Persistent low-latency offline banner (`"⚠️ You're offline — some features limited"`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (Turbopack, App Router) |
| **Language & Core** | TypeScript 5, React 19 |
| **Styling & Motion** | TailwindCSS 4, Framer Motion, Vanilla CSS Custom Tokens |
| **Database & Realtime** | Supabase (PostgreSQL, Row Level Security, Realtime Channels, Storage) |
| **Mapping & Geolocation** | Mapbox GL JS v3, Navigator Geolocation API, OpenStreetMap Reverse Geocoding |
| **Payments & Escrow** | Razorpay Standard Checkout SDK, Webhooks, HMAC-SHA256 verification |
| **Artificial Intelligence** | Anthropic Claude API SDK (`@anthropic-ai/sdk`) |
| **Push & Messaging** | Web Push API (`web-push`), Firebase Cloud Messaging, WhatsApp Cloud API |
| **Data Fetching & Cache** | SWR (`swr`) |

---

## 📂 Project Structure

```
kaizy/
├── public/                     # Static assets, icons, manifest.json
├── src/
│   ├── app/
│   │   ├── api/                # Core API Engine
│   │   │   ├── auth/           # OTP, Registration, DPDP Deletion
│   │   │   ├── bot/chat/       # KonnectBot Claude AI Engine
│   │   │   ├── dispatch/       # SOS, Later, Accept, Quote, Status
│   │   │   ├── notifications/  # Read/Unread, Subscriptions
│   │   │   ├── payments/       # Razorpay Order Creation & Verification
│   │   │   ├── privacy/        # DPDP Data Export
│   │   │   ├── reviews/        # Two-Sided Trust & Ratings Engine
│   │   │   ├── support/        # Bug Reporting
│   │   │   └── workers/        # Radar Queries, Pricing, Toggle GPS
│   │   ├── dashboard/          # Hirer & Worker Primary Dashboards
│   │   ├── hirer/              # Hirer SOS, Tracking, Browse, Review, My Jobs
│   │   ├── worker/             # Worker Active Job, My Jobs, Payment Celebration
│   │   ├── kaizybot/           # Multilingual KonnectBot AI Chat UI
│   │   ├── notifications/      # Real-Time 8-Event Notifications Screen
│   │   ├── settings/           # Profile, Verification, Theme, DPDP Settings
│   │   ├── layout.tsx          # Root Layout & Offline Banner Integration
│   │   └── page.tsx            # Full-Bleed Mapbox Discovery Home
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── AndroidBackHandler.tsx  # Native-like Android Back Navigation
│   │   ├── NetworkStatus.tsx       # Real-Time Connectivity Listener
│   │   ├── OfflineBanner.tsx       # Low-Latency Offline Banner
│   │   ├── ToastNotification.tsx   # Global Animated Toast Engine
│   │   └── UserAvatar.tsx          # Optimized Responsive Avatar
│   ├── lib/                    # Supabase, Auth, SWR Hooks, Formatters
│   ├── middleware.ts           # Synchronous Edge Role Guard & Zero-Flash Middleware
│   └── stores/                 # AuthStore, ThemeStore, BookingStore
└── supabase/
    └── migrations/             # SQL Migrations (Tables, RPCs, Triggers, RLS)
```

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mapbox GL
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0.xxx

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-your-key

# JWT Secret & Encryption
JWT_SECRET=your-32-byte-secure-jwt-secret

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@kaizy.in

# WhatsApp Cloud API (Optional)
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

---

## 🗄️ Database Migrations

Apply the migration scripts located in `supabase/migrations/` sequentially:

1. `001_initial_schema.sql` — Core users, worker profiles, trades, jobs, and bookings.
2. `002_market_pricing.sql` — Standard trade pricing benchmarks.
3. `003_worker_pricing.sql` — Worker-customizable pricing bounds.
4. `004_job_alerts.sql` — Real-time dispatch alerts and 45s timers.
5. `005_worker_locations.sql` — GPS telemetry tracking.
6. `006_accept_job_atomic.sql` — Concurrency-safe atomic job claim RPC.
7. `007_nearby_workers_rpc.sql` — PostGIS/Haversine distance search function.
8. `008_notifications.sql` — In-app notification logs and preferences.
9. `009_earnings_and_escrow.sql` — Payout ledgers and Razorpay order references.
10. `010_reviews_and_hirer_reviews.sql` — Two-sided review system and rating recalculations.
11. `011_settings_and_bug_reports.sql` — User preferences and bug report logging.

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Verification
```bash
npx tsc --noEmit && npm run build
```

---

## 🛡️ Security & Pre-Launch Audit

Kaizy has passed all **50/50 Pre-Launch Verification Checks**:
- **Zero-Flash Role Routing**: Edge middleware synchronously validates JWTs before HTML stream generation.
- **Strict Authorization**: Object-level access control on bookings (`GET /api/bookings/[id]` returns HTTP 403 for unauthorized third parties).
- **Payment Signature Integrity**: Cryptographic HMAC-SHA256 signature verification on Razorpay capture webhooks.
- **DPDP Act 2023 Compliance**: Secure data portability JSON export and automated 30-day account deletion queue.

---

## 📄 License

Proprietary © 2026 Kaizy Technologies India Pvt. Ltd. All rights reserved.
