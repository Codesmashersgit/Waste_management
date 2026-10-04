# 🌍 WasteCHAiN — Decentralized Clean-to-Earn Eco Platform

<div align="center">

![WasteCHAiN Banner](public/hero-bg.jpg)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green?style=for-the-badge)](https://orm.drizzle.team/)
[![NeonDB](https://img.shields.io/badge/NeonDB-Serverless_PostgreSQL-00E5BE?style=for-the-badge)](https://neon.tech/)
[![Web3Auth](https://img.shields.io/badge/Web3Auth-Sapphire_Devnet-7B3FE4?style=for-the-badge)](https://web3auth.io/)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

[Live Demo](#) · [Report Bug](https://github.com/Codesmashersgit/Waste_management/issues)

</div>

---

## 🚀 What is WasteCHAiN?

**WasteCHAiN** is a **DePIN (Decentralized Physical Infrastructure) + ReFi (Regenerative Finance)** platform that transforms waste management from a civic burden into a **tokenized, AI-verified, community-powered economy**.

Citizens earn **WASTE tokens** for reporting and collecting garbage. Every action is verified by **Google Gemini AI** and recorded on a tamper-proof blockchain ledger, making environmental impact transparent and financially rewarding.

> *"We don't trust manual human claims — our Gemini AI verifies the waste type and volume before any token is minted."*

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI-Verified Reporting** | Upload a photo of waste — Gemini AI instantly identifies the type (plastic, organic, metal), estimates weight, and returns a confidence score |
| 🔐 **Web3 Login** | Sign in with Google via Web3Auth — your Ethereum wallet is created automatically (non-custodial) |
| 💰 **Clean-to-Earn** | Earn **10 pts** for reporting waste, **20 pts** for collecting it |
| 📊 **Personal Analytics** | Track your eco-impact: kg cleaned, CO₂ offset, waste breakdown by category, token ledger |
| 🏆 **Leaderboard** | City-wide gamified rankings with gold/silver/bronze eco-champions |
| 🛡️ **Admin Control Center** | Password-protected master dashboard with full citizen audit, analytics per user, and waste report logs |
| 🌐 **Epic Landing Page** | Sci-Fi animated hero page for unauthenticated users |
| 🔔 **Real-time Notifications** | In-app notification bell when points are rewarded |

---

## 🛠️ Tech Stack

```
Frontend       →  Next.js 15 (App Router) + React 19 + TypeScript
Styling        →  Tailwind CSS 4 + Glassmorphism dark theme
AI Engine      →  Google Gemini 1.5 Flash (image analysis)
Authentication →  Web3Auth (Sapphire Devnet) — Google/Social → Ethereum Wallet
Database       →  NeonDB (Serverless PostgreSQL)
ORM            →  Drizzle ORM (type-safe schema + migrations)
Maps           →  Google Maps Places API (location autocomplete)
Blockchain     →  Ethereum Sepolia Testnet
```

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (unauthenticated) + Dashboard (logged in)
│   ├── login/page.tsx        # Web3Auth login gate
│   ├── report/page.tsx       # Report waste with AI verification
│   ├── collect/page.tsx      # Collect waste tasks & earn tokens
│   ├── rewards/page.tsx      # View & redeem reward points
│   ├── leaderboard/page.tsx  # City-wide rankings
│   ├── analytics/page.tsx    # Personal eco analytics dashboard
│   ├── admin/page.tsx        # 🔒 Admin master control center (password protected)
│   └── api/
│       └── admin/login/      # Secure admin authentication API
├── components/
│   ├── Header.tsx            # Navigation with live coin balance + user profile
│   └── Sidebar.tsx           # App navigation sidebar
├── hooks/
│   └── useAuthGuard.ts       # Protected route hook
└── utils/db/
    ├── schema.ts             # Database schema (Users, Reports, Rewards, Transactions...)
    ├── dbConfig.ts           # NeonDB connection
    └── actions.ts            # All DB server actions
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Codesmashersgit/Waste_management.git
cd Waste_management/Waste_Management_App
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root of `Waste_Management_App/`:

```env
# Database (NeonDB)
DATABASE_URL=your_neondb_postgresql_url

# Web3Auth
NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID=your_web3auth_client_id
WEB3_AUTH_CLIENT_SECRET=your_web3auth_client_secret

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Admin Panel (Secret credentials — never commit)
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_secure_admin_password
```

### 4. Push Database Schema

```bash
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

---

## 🔑 Environment Variables Reference

| Variable | Where to Get It |
|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) → Create project → Connection string |
| `NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID` | [dashboard.web3auth.io](https://dashboard.web3auth.io) → Create project → Client ID |
| `NEXT_PUBLIC_GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API Key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) → Enable Maps Places API |
| `ADMIN_EMAIL` | Your custom admin email |
| `ADMIN_PASSWORD` | Your custom secure password |

---

## 🌊 App Flow

```
🌐 Landing Page (Epic Sci-Fi Hero)
         │
         ▼
🔐 Login with Web3Auth (Google OAuth → Ethereum Wallet)
         │
         ▼
🏠 Dashboard (Personalized Welcome + Live Stats)
         │
    ┌────┴────────────────────┬──────────────────┬─────────────────┐
    ▼                         ▼                  ▼                 ▼
📍 Report Waste          ♻️ Collect Waste   🏆 Leaderboard   📊 My Analytics
(Gemini AI Scan)        (Earn 20 pts)      (City Rankings)   (Eco Telemetry)
+10 pts earned
         │
         ▼
🪙 Rewards Page (Redeem / Convert to Crypto)
```

---

## 💡 How Users Earn Real Rewards

1. **Report Waste** → `+10 Points` (verified by Gemini AI)
2. **Collect Waste** → `+20 Points`
3. **Points → WASTE Tokens** (claimable to Ethereum Sepolia wallet)
4. **Tokens → INR** via crypto exchange (Binance, CoinDCX, UPI payout)

### Revenue Model (How the Platform Sustains Rewards)
- 🏭 **EPR Funds** — FMCG brands (Pepsi, Unilever, ITC) pay for verified plastic collection certificates
- ♻️ **Raw Material Sales** — Collected waste sold to recycling plants
- 🌱 **Carbon Credits** — Each 100 kg of plastic = verified carbon offset credits tradeable on global markets

---

## 🛡️ Admin Panel

The admin dashboard is accessible only at `/admin` (not shown in sidebar for security).

- Enter credentials configured in `.env` (`ADMIN_EMAIL` + `ADMIN_PASSWORD`)
- View all registered citizens, their reports, collections, token balances
- Individual citizen audit with full transaction ledger
- Waste report master log with status filters

---

Built with 💚 for a cleaner, greener, decentralized planet.
