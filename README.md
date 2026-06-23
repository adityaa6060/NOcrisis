# CrisisSync — Real-time Hotel Crisis Coordination

A production-quality hackathon MVP that connects Admin, Staff, and Guests during emergencies via real-time Firebase sync and Gemini AI-generated instructions.

## Architecture

```
/ (Role selector)
├── /admin   → Control dashboard (trigger crises, assign staff, view AI instructions)
├── /staff   → Response interface (check in, follow AI checklist, post updates)
└── /guest   → Mobile PWA via QR (acknowledge alert, follow instructions, mark safe)

API Routes:
├── POST /api/crisis           → Webhook endpoint for external triggers (CCTV, IoT)
└── POST /api/ai-instructions  → Generate Gemini AI response instructions
```

## Tech Stack

- **Next.js 15** (App Router, API Routes)
- **Firebase Realtime Database** (real-time sync across all roles)
- **Google Gemini 1.5 Flash** (AI-generated emergency instructions)
- **Tailwind CSS v4** (dark, monospace UI)
- **React QR Code** (guest QR portal)

## Setup

### 1. Firebase (Realtime Database)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Enable **Realtime Database** (start in test mode)
3. Project Settings → Your Apps → Add Web App → copy config

### 2. Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key

### 3. Environment Variables

```bash
cp .env.local.example .env.local
# Fill in your Firebase + Gemini credentials
```

### 4. Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Firebase Security Rules (for production)

```json
{
  "rules": {
    "crises": {
      ".read": true,
      ".write": "auth != null"
    },
    "staff": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## Demo Flow

1. Open `/admin` → Click **TRIGGER CRISIS** → Select type/severity/location
2. System auto-generates AI instructions via Gemini
3. Open `/staff` (different tab/device) → See real-time alert → Check in
4. Admin assigns staff → Staff sees personalized action checklist
5. Scan QR code (or open `/guest?room=101`) → Guest acknowledges → Marks safe
6. Admin sees live guest acknowledgment count → Resolves incident

## Key Features

- **Real-time sync** — Firebase RTDB pushes updates to all connected clients instantly
- **AI instructions** — Gemini generates role-specific actions for every crisis type
- **Offline fallback** — Hardcoded instructions used if Gemini API is unavailable
- **Guest PWA** — Works on any mobile browser, no app install needed
- **QR per room** — Each room QR encodes room number for tracking
- **Staff check-in** — Staff confirm they're responding; status visible to admin
- **Elapsed timer** — Every stakeholder sees how long the crisis has been active
- **Crisis log** — Full history of all incidents with updates feed

## Crisis Types Supported

🔥 Fire · 🚑 Medical · 🚨 Security · 
