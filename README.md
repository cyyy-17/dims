# DIMS — Dormitory & Inventory Management System
### ASEAN Student Residences (ASR) · School Field Campus Edition

> **DIMS** is an award-winning, minimalist management platform built specifically for the standalone operations of the ASEAN Student Residences (ASR) staff representative. Powered by **Next.js 16 (Turbopack)**, **Tailwind CSS v4**, **React 19**, **Supabase Cloud PostgreSQL**, and **Brevo Bulk Email API**.

---

## ✨ Features & Architecture

- **🏠 Dormitory Management**:
  - Multi-resident classification: **Students**, **Employees**, and **Visitors**.
  - Dynamic room allocation (Single, Double, Quad, Executive Suite).
  - Individual bed slot assignments with conflict prevention.
  - Campus visitor registry with host linkage and time-in/time-out logging.
  - Bulk CSV import and instant CSV export across all resident tables.

- **📦 Physical Asset & Inventory Custody**:
  - Item catalog with SKU generation, low-stock threshold alerts, and locations.
  - High-resolution SVG/PNG **QR code property tags** for physical equipment tagging.
  - Stock movement ledger: Stock In, Stock Out (assigned to dormer/room), and Returns with condition inspection.
  - Stationed room asset deployment tracking.

- **📢 Brevo Bulk Email Announcements**:
  - Audience targeting: All Dormers, Students, Employees, Visitors, or Specific Room Occupants.
  - Dispatch via secure server-side Route Handler with Brevo REST API v3.
  - Responsive branded HTML email template with recipient manifest logging.
  - Automatic fallback simulation mode for campus testing.

- **📊 Executive Reports & Print Suites**:
  - 5 formal printable audit suites with official institutional letterhead, doc reference codes, and signature blocks.
  - Audit period date range filter (From / To).
  - Real-time KPI summaries and Recharts data visualizations.

- **🛡️ Security & Cloud Sync**:
  - **Next.js 16 Proxy (`proxy.ts`)**: Route protection guarding all internal pages.
  - **Single Shared Staff Office Login**: Official campus credentials with offline verification fallback.
  - **Supabase Cloud Database**: Single source of truth with Row Level Security (RLS) policies.
  - **Offline Sync Queue**: Automatic mutation queuing and background replay upon reconnection.
  - **Zero Hardcoded Secrets**: All credentials isolated in environment variables.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16.3.5](https://nextjs.org/) (App Router, Turbopack, `proxy.ts`)
- **UI Library**: [React 19.2.8](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + GoTrue Auth)
- **Email Delivery**: [Brevo](https://www.brevo.com/) (REST API v3)
- **Data Parsing & QR**: PapaParse, QRCode, Lucide React, Recharts

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/cyyy-17/dims.git
cd dims
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

BREVO_API_KEY=xkeysib-your-api-key
BREVO_SENDER_EMAIL=aseanresidences@firstasia.edu.ph
BREVO_SENDER_NAME=ASR Dormitory Office

NEXT_PUBLIC_APP_NAME=DIMS
NEXT_PUBLIC_APP_CAMPUS=ASR School Field Campus
```

### 4. Database Setup (Supabase)
Execute the SQL statements from [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Staff Office Credentials

```
Office Email:     aseanresidences@firstasia.edu.ph
Default Password: ASRStaff2026!
Staff Officer:    Maria Joy Clemente (ASR Campus Representative)
```

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub:
   ```bash
   git push origin master
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
3. Import `cyyy-17/dims`.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_CAMPUS`
5. Click **Deploy**. Vercel will automatically build with Next.js Turbopack and deploy to your custom domain.

---

## 📄 License
Internal proprietary software for ASEAN Student Residences (ASR) · First Asia Institute of Technology and Humanities.
