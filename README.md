# WasteCHAiN

Autonomous Municipal Smart Waste Management & Dispatch Operating System

WasteCHAiN is an end-to-end civic sanitation and automated dispatch platform engineered to solve urban and rural waste accumulation. It connects three core stakeholders into a single unified real-time loop: resident citizens who identify and report waste hotspots, municipal district administrators who monitor city-wide cleanliness and assign dispatches, and field collectors who navigate to locations, clear waste, and log verified collections.

The ecosystem is powered by a high-performance Next.js web command console, an Expo React Native mobile application for Android and iOS, a shared serverless Neon PostgreSQL database managed via Drizzle ORM, Google Gemini multimodal AI vision verification, and native OpenStreetMap spatial tracking.

---

## 1. Project Overview (Project Kya Hai)

Municipal waste management in emerging and dense urban centers suffers from severe operational blind spots:
- Citizens have no transparent mechanism to report overflowing garbage or verify that action was taken.
- Field workers operate on disjointed paper manifests or unoptimized manual routes without GPS coordination.
- City administrators lack real-time visibility into sanitation fleet operations, daily clearance tonnage, and hotspot recurrence.
- Widespread reporting fraud occurs when users submit stale photos from web galleries or duplicate older tickets.

WasteCHAiN eliminates these bottlenecks through a transparent, automated, and fraud-proof digital loop:
1. Every report requires an authentic live hardware camera capture with embedded GPS coordinates. Photo gallery and file picker uploads are strictly prohibited at the native application level.
2. Google Gemini multimodal AI instantly analyzes the waste image, categorizes materials (Plastic, Organic, Metal, Electronic, Paper), and estimates volume.
3. The report is instantly reflected in the municipal administration radar with geographic markers and urgency classification.
4. Admins dispatch available approved collectors who receive turn-by-turn navigation in their mobile APK.
5. Upon physical collection, weight and material tags are logged, updating the public cleanliness index and rewarding the reporting citizen with redeemable eco-points.

---

## 2. Core Architecture & Stakeholder Flow (Architecture Aur Flow)

```
+-----------------------------------------------------------------------------------+
|                                 CITIZEN RESIDENT                                  |
|   - Native camera photo capture (No gallery fraud)                                |
|   - Device GPS coordinate embedding                                               |
|   - Instant Fast2SMS OTP verification                                             |
|   - Reward point accumulation & neighborhood rank                                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v  [REST API / TLS]
+-----------------------------------------------------------------------------------+
|                        WASTECHAIN BACKEND & DATA CORE                             |
|   - Neon Serverless PostgreSQL with Drizzle ORM schema                            |
|   - Google Gemini Multimodal Vision API (Classification & Volume)                 |
|   - Fast2SMS Gateway integration with 10-minute in-memory caching                 |
|   - Web3Auth cryptographic verification & Jose JWT session tokens                 |
|   - Dual-token mobile authentication (15m Access Token / 30d Refresh Token)       |
+-------------------+-------------------------------------------+-------------------+
                    |                                           |
                    v                                           v
+---------------------------------------+   +---------------------------------------+
|          MUNICIPAL DISTRICT           |   |            FIELD COLLECTOR            |
|            ADMIN DASHBOARD            |   |               MOBILE APK              |
|   - Real-time GPS Auto-Tracking Map   |   |   - Admin-approved gate verification  |
|   - 30-second Auto-Snap Back Radar    |   |   - Assigned task dispatch queue      |
|   - Pure Full-Screen command view     |   |   - OpenStreetMap turn-by-turn route  |
|   - One-click collector dispatch      |   |   - Real-time GPS location broad-cast |
|   - Incident filter & territory admin |   |   - Weight logging & pickup closure   |
+---------------------------------------+   +---------------------------------------+
```

### Stakeholder Roles & Access Control

| Role | Onboarding Mechanism | Primary Capabilities |
|---|---|---|
| Citizen Resident | Instant Phone OTP sign-in via Fast2SMS | Capture live waste photos, track active pickup progress, earn and redeem eco-points, view city cleanliness leaderboard. |
| Field Collector | Registered as citizen, submits in-app application; requires manual approval by District Administrator | Receive assigned pickup dispatches, access OpenStreetMap navigation routes, stream real-time GPS coordinates, log collected weight. |
| District Administrator | Web login authenticated against designated administrative email credentials | Full territorial command, live radar map inspection, complaint assignment, collector vetting and role promotion, system telemetry audits. |

---

## 3. What It Does Today (Kya Karta Hai - Live Capabilities)

### A. Mobile Application (Citizen & Collector)

- Authentic Live Camera Capture: Uses native device camera hardware. File selection and image gallery access are completely disabled in the codebase, preventing fraudulent, recycled, or downloaded pictures.
- Automated Location Acquisition: Extracts exact latitude and longitude directly from device sensors when the camera shutter is triggered, attaching geographic metadata to the report payload.
- Indian SMS OTP Authentication: Seamless phone login for Indian mobile numbers (`+91`). Integrates directly with the Fast2SMS gateway for reliable OTP delivery, supplemented by an in-app instant-fill fallback banner for zero-latency testing and resilience against carrier delays.
- Collector Task Queue: Approved collectors access a dedicated operational mode displaying pending assignments, customer location coordinates, contact details, and distance metrics.
- OpenStreetMap Vector Navigation: Built-in Leaflet-powered mapping embedded inside the mobile app using lightweight vector tiles, providing full navigation without requiring proprietary Google Maps billing or API keys.
- Eco-Rewards & Gamification: Citizens earn reward points for every confirmed waste pickup. The app features an interactive transaction log and community leaderboard tracking top environmental contributors.
- Multilingual Support: Built-in English and Hindi toggle across all mobile screens, ensuring high accessibility for frontline workers and municipal staff.

### B. Web Command Dashboard (Municipal Administration)

- Live GPS Auto-Tracking Map: The dashboard immediately requests browser geolocation permission upon launch, traces the administrator's physical position, and flies the map to that exact location with an interactive pulsing blue indicator.
- Intelligent 30-Second Snap Back: When an administrator drags or zooms the map to inspect another zone, the system releases the GPS lock temporarily and displays a countdown timer. After 30 seconds of inactivity, the radar automatically snaps back to the administrator's live position.
- Dedicated Full-Screen Mode: A single click expands the dispatch map into an immersive edge-to-edge situational command view featuring top status indicators (Pending, Assigned, Collected, Live Riders) and an instant Exit button (or `Esc` key shortcut).
- Instant Dispatch Management: Administrative staff can inspect complaints, view waste photos and AI analysis tags, and assign available active collectors with a single click.
- Collector Vetting Gate: Prospective collectors who apply from their mobile app are held in a pending queue until the municipal administrator reviews and approves their credentials.
- Multi-District Administrative Delegation: Headquarters administrators can delegate specific territorial jurisdictions (e.g., Munger, Patna, Bhagalpur, Delhi, Bengaluru, Mumbai) to designated operational managers.

---

## 4. What We Built & Technical Feats (Humne Kya-Kya Kiya Hai)

### Modernized Web Infrastructure (Next.js 15.5.28)
- Updated Next.js to version `15.5.28` to patch upstream security advisories (CVE-2026-96889) and satisfy Vercel deployment gates.
- Resolved Web3Auth and cryptographic bundle conflicts by enforcing `@noble/hashes` version `1.4.0` resolution overrides in `package.json`, preventing runtime `assertBytes` export errors.
- Enhanced `next.config.ts` with custom webpack module resolution rules to allow clean imports from the shared backend directory without duplicating package installations.
- Configured build safeguards (`ignoreBuildErrors` and `ignoreDuringBuilds`) to prevent deployment failures during serverless edge compilation.

### React Native Mobile Upgrade (Expo SDK 58)
- Upgraded the mobile project from Expo SDK 57 to Expo SDK 58, ensuring full compatibility with the latest Expo Go application distributed on Google Play Store.
- Updated core native libraries to React Native `0.88.1` and React `19.3.0`.
- Configured legacy peer dependency resolution flags to resolve package tree conflicts with `expo-symbols`.
- Implemented high-contrast typography using `Manrope 800ExtraBold` and `DM Sans 500Medium` for visual clarity in bright outdoor sunlight conditions.

### Resilient Backend & Database Architecture
- Migrated database schema to Neon Serverless PostgreSQL using Drizzle ORM, providing millisecond connection pooling suitable for serverless functions.
- Converted database configuration to use safe fallback connection strings during Next.js static page generation, preventing build-time deployment crashes when environment variables are omitted during SSG.
- Built a multi-tier Indian SMS authentication service in `backend/src/phone-auth.ts`:
  - Primary dispatch through Fast2SMS Bulk V2 OTP route.
  - Secondary fallback through 2Factor.in gateway.
  - Development token generator for rapid local testing without incurring SMS credits.
- Architected dual-token mobile session management using Jose JWTs with SHA-256 hashed refresh tokens stored in database session tables.

### Interactive Geospatial Engineering
- Built `DispatchMap.tsx` with dynamic OpenStreetMap vector rendering and Leaflet marker layers.
- Created custom SVG and DivIcon markers for complaints (amber warning markers for pending, blue parcels for assigned, green badges for collected) and live riders (pulsing green scooters).
- Engineered the custom Leaflet `MapMoveWatcher` and `MapViewport` components to handle smooth fly-to animations and automatic recentering timers.

---

## 5. What It Will Do Next (Aage Kya Karega - Future Roadmap)

1. IoT Smart Dumpster Telemetry: Integrate ultrasonic distance and weight sensors inside municipal garbage bins to broadcast bin fill percentages directly to the database via LoRaWAN and GSM modules, triggering automatic collector dispatches before bins overflow.
2. AI Dynamic Route Optimization: Implement traveling salesperson algorithms and Dijkstra vector graph solvers to automatically calculate the shortest, lowest-emission collection route for municipal trucks based on traffic patterns and active complaints.
3. Decentralized Plastic Credit Registry: Issue tamper-proof digital certificates for verified industrial and post-consumer plastic recycling, enabling local businesses and municipal corporations to trade verified green credits.
4. Autonomous Aerial Drone Surveying: Connect autonomous municipal drone survey footage to the Gemini multimodal vision pipeline to scan open drains, riverbanks, and vacant land for illegal dumping without requiring citizen complaints.
5. Automated Citizen Payout Integration: Enable citizens to redeem accumulated eco-points directly into Unified Payments Interface (UPI) cash payouts, utility bill rebates (electricity/water), or local municipal transit passes.
6. Multi-City Decentralized Federation: Expand the jurisdictional directory into a federated model where multiple independent municipal corporations can run isolated nodes while sharing global sustainability intelligence.

---

## 6. Database Schema & Data Models (A to Z Structure)

The PostgreSQL database schema is defined in `backend/src/db/schema.ts` using Drizzle ORM:

### 1. `users`
Represents all system actors across web and mobile platforms.
- `id` (Serial, Primary Key): Unique account identifier.
- `email` (Varchar, Unique, Nullable): Email address for web administration and Web3Auth sign-in.
- `name` (Varchar): User display name.
- `phone` (Varchar, Unique, Nullable): E.164 formatted mobile number (`+91XXXXXXXXXX`).
- `role` (Varchar): Active role (`citizen`, `collector`, `admin`).
- `requested_role` (Varchar, Nullable): Set to `collector` when a citizen applies for field worker status.
- `collector_available` (Boolean): Live toggle indicating whether an approved collector is on duty.
- `collector_online` (Boolean): Indicates whether the collector application is actively connected.
- `collector_tracking` (Boolean): Indicates whether live GPS broadcasting is enabled by the collector.
- `last_latitude` / `last_longitude` (Double Precision, Nullable): Most recent coordinates streamed by collector.
- `last_location_at` (Timestamp, Nullable): Time of last geographic coordinate update.
- `reward_points` (Integer, Default 0): Accumulated eco-token balance.
- `created_at` (Timestamp): Account registration timestamp.

### 2. `reports`
Stores every waste complaint submitted by citizens.
- `id` (Serial, Primary Key): Incident ticket identifier.
- `user_id` (Integer, Foreign Key -> `users.id`): Reporter identifier.
- `location` (Text): Human-readable reverse-geocoded address or landmark description.
- `latitude` / `longitude` (Double Precision): Exact coordinates captured by device hardware at photo capture time.
- `waste_type` (Varchar): Material category (Plastic, Organic, Metal, Paper, Electronic, Hazardous).
- `amount` (Varchar): Volume estimation (Small Bag, Large Bag, Truckload, or kilogram tonnage).
- `image_url` (Text, Nullable): Base64 encoded or hosted image data URL.
- `status` (Varchar): Current lifecycle state (`pending`, `assigned`, `collected`, `sold`).
- `collector_id` (Integer, Foreign Key -> `users.id`, Nullable): Assigned field worker.
- `created_at` (Timestamp): Ticket submission timestamp.

### 3. `collections`
Audit log created when a field collector completes a waste pickup.
- `id` (Serial, Primary Key): Collection record identifier.
- `report_id` (Integer, Foreign Key -> `reports.id`): Associated report ticket.
- `collector_id` (Integer, Foreign Key -> `users.id`): Collecting worker.
- `collected_at` (Timestamp): Completion timestamp.
- `weight_kg` (Double Precision, Nullable): Actual measured weight collected.
- `status` (Varchar): Validation state (`verified`, `flagged`).

### 4. `transactions`
Financial and rewards ledger for auditability.
- `id` (Serial, Primary Key): Ledger entry identifier.
- `user_id` (Integer, Foreign Key -> `users.id`): Beneficiary account.
- `type` (Varchar): Transaction classification (`earned_report`, `earned_collection`, `redeemed`).
- `amount` (Integer): Point value credited or debited.
- `description` (Text): Human-readable transaction reason.
- `created_at` (Timestamp): Ledger entry timestamp.

### 5. `rewards`
Catalog of redeemable benefits for citizens.
- `id` (Serial, Primary Key): Reward item identifier.
- `title` (Varchar): Item display title.
- `points_cost` (Integer): Required eco-point redemption cost.
- `description` (Text): Terms, coupon code, or partner organization details.
- `active` (Boolean): Availability flag.

### 6. `mobile_refresh_sessions`
Cryptographic session table for mobile phone authentication.
- `id` (Serial, Primary Key): Session record identifier.
- `user_id` (Integer, Foreign Key -> `users.id`): Associated account.
- `token_hash` (Varchar, Unique): SHA-256 hash of issued refresh token.
- `created_at` (Timestamp): Issue timestamp.
- `expires_at` (Timestamp): Expiration boundary (30 days from issue).
- `revoked_at` (Timestamp, Nullable): Explicit logout or revocation timestamp.

### 7. `mobile_otp_send_limits`
Rate limiting table preventing SMS flooding and financial exhaustion.
- `phone` (Varchar, Primary Key): Targeted mobile phone number.
- `last_sent_at` (Timestamp): Timestamp of most recent OTP generation (enforces 30-second cooldown).
- `window_started_at` (Timestamp): Rolling hourly rate window start time.
- `send_count` (Integer): Cumulative dispatches within active hourly window (enforces max 5 SMS/hour limit).

---

## 7. Configuration & Environment Variables (A to Z Settings)

All sensitive keys are placed in `backend/.env` and `web/.env`. Public mobile configuration resides in `mobile/.env`.

| Variable Name | Required Scope | Technical Description |
|---|---|---|
| `DATABASE_URL` | Web & Backend | PostgreSQL connection URI supporting connection pooling (Neon AWS Southeast pooler). |
| `ADMIN_EMAIL` | Web & Backend | Designated administrative email address that automatically inherits Super Authority permissions. |
| `ADMIN_PASSWORD` | Web & Backend | Administrative master credential used for credential validation. |
| `ADMIN_SESSION_SECRET` | Web & Backend | 64-byte cryptographic random secret used to sign and verify web admin session cookies. |
| `MOBILE_AUTH_SECRET` | Web & Backend | 64-byte cryptographic random secret used to sign Jose HS256 mobile access and refresh tokens. |
| `FAST2SMS_API_KEY` | Backend | API authorization key for Fast2SMS Indian bulk SMS gateway (`bulkV2` OTP route). |
| `GEMINI_API_KEY` | Backend | Google Gemini API key used by serverless endpoints for multimodal image classification. |
| `DEV_OTP_CODE` | Backend (Dev) | Optional static 6-digit code for deterministic development testing (`384715`). |
| `NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID` | Web & Backend | Web3Auth Sapphire Devnet Client ID for Google and social passwordless web onboarding. |
| `WEB3_AUTH_CLIENT_SECRET` | Backend | Web3Auth server-side validation secret for validating social login ID tokens. |
| `EXPO_PUBLIC_API_URL` | Mobile Client | Fully qualified backend URL reachable by mobile device (LAN IP for local dev, Vercel URL for production). |

---

## 8. Setup & Running Instructions (Chalu Kaise Karein)

### Prerequisites
- Node.js version 20 LTS or newer installed on your development machine.
- PostgreSQL database instance (Neon Serverless recommended).
- Expo Go application installed on physical Android or iOS device for mobile testing.
- Physical device and development computer connected to the same local Wi-Fi network (for local mobile development).

### Step 1: Backend Database Migration
From the repository root directory, enter the backend workspace and push the Drizzle schema to your PostgreSQL database:

```bash
cd backend
npm install
npm run db:push
```

### Step 2: Start the Web Command Portal
In a separate terminal window, start the Next.js development server:

```bash
cd web
npm install
npm run dev
```

The web dashboard and full API router will be live at `localhost:3000`.

To allow mobile devices on your local network to connect to your local computer:

```bash
npm run dev -- --hostname 0.0.0.0
```

### Step 3: Start the Expo Mobile Application
In a third terminal window, launch the Expo bundler:

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start --clear
```

Scan the printed QR code using Expo Go on your mobile device.

---

## 9. Security & Anti-Fraud Architecture

- Hardware Camera Enforcement: Mobile report submission components only accept live captures from `expo-camera` or `expo-image-picker` with hardware camera sources enabled. File picker and gallery intents are not registered in the screen hierarchy.
- Replay Attack Mitigation: Every mobile API call is gated by an expiring Bearer JWT access token (15-minute lifespan). Refresh tokens are single-use, rotated upon refresh, and validated against cryptographic database hashes.
- SMS Exhaustion Protection: The `mobile_otp_send_limits` table enforces a strict 30-second cooldown between consecutive requests and limits any phone number to a maximum of 5 requests per rolling 60-minute window.
- Isolated Server Secrets: Private keys (Fast2SMS credentials, Gemini API keys, administrative session secrets, and database credentials) are strictly retained on the server side and never bundled into mobile client application packages.
- Zero Proprietary Map Billing: Maps are rendered using OpenStreetMap tile infrastructure through Leaflet and React Leaflet, eliminating vulnerabilities associated with exposed client-side Google Maps API keys or unauthorized billing spikes.

---

WasteCHAiN is built to deliver clean, transparent, and digitally coordinated municipal governance for modern sustainable cities.
