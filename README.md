# Wheely Admin Dashboard

Partner dashboard for managing car rentals, bookings, and fleet operations.

## Project Structure

```
WheelyAdminDB/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── callback/
│   ├── components/        # React components
│   │   ├── domain/        # Domain-specific components
│   │   │   ├── bookings/
│   │   │   ├── cars/
│   │   │   ├── dashboard/
│   │   │   ├── locations/
│   │   │   ├── payouts/
│   │   │   ├── profile/
│   │   │   └── reviews/
│   │   └── ui/            # Reusable UI components
│   │       ├── alerts/
│   │       ├── dropdowns/
│   │       └── navigation/
│   ├── bookings/          # Bookings page
│   ├── calendar/          # Calendar page
│   ├── cars/              # Cars management page
│   ├── dashboard/         # Dashboard page
│   ├── locations/         # Locations management page
│   ├── payouts/           # Payouts page
│   ├── profile/           # Profile page
│   └── reviews/           # Reviews page
├── database/              # Database scripts
│   ├── migrations/       # Schema migrations
│   ├── rls-policies/     # Row Level Security policies
│   ├── utilities/         # Business logic utilities
│   ├── samples/          # Sample data
│   └── debug/            # Debug scripts
├── docs/                  # Documentation
│   ├── archive/          # Historical docs
│   ├── DESIGN_SYSTEM.md
│   └── PAYOUT_SETUP.md
├── lib/                   # Shared libraries
│   ├── i18n/             # Internationalization
│   ├── server/           # Server-side code
│   │   ├── auth/         # Authentication actions
│   │   └── data/         # Data access layer
│   ├── supabase/         # Supabase client
│   └── utils/            # Utility functions
└── types/                 # TypeScript type definitions

```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Security**: Row Level Security (RLS) policies

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

3. Run database migrations:
```bash
# See database/README.md for migration order
```

4. Start development server:
```bash
npm run dev
```

## Database Setup

See `database/README.md` for detailed database setup instructions.

## Features

- **Dashboard**: Overview of bookings, revenue, and statistics
- **Cars Management**: Add, edit, and manage fleet vehicles
- **Bookings**: View and manage all bookings
- **Calendar**: Visual calendar view of bookings
- **Locations**: Manage pickup and dropoff locations
- **Reviews**: View customer reviews
- **Profile**: Manage company profile and settings

## Security

- Row Level Security (RLS) enabled on all tables
- JWT-based company ownership
- One user = one company enforcement
- Phone number write-once protection

## Internationalization

Supports English and Albanian (sq) languages.

## Development

- TypeScript for type safety
- Server Actions for data mutations
- Client Components for interactive UI
- Timeout utilities for async operations


