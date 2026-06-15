# Financial Tracker App

A premium, fast, and secure financial tracker web application tailored for a 2-person software agency.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Database & Auth:** Firebase
- **Charts:** Recharts

## Features
- Secure authentication via Firebase
- Real-time shared transactions database
- Visual dashboards with income vs. expense breakdowns
- CSV exports for accounting
- Fast manual entry form

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Production Guidelines Followed
- Small, focused components (< 200 lines).
- Global state managed efficiently via Zustand.
- Separated UI components (shadcn) from feature components.
