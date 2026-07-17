# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Island to Infinity Zhixing is a publicly accessible Next.js web application for a student-led social impact project supporting underprivileged families in Changshu, China. It features public pages (home, families, plans, schedule, AI assistant) and a password-protected admin dashboard.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Data Layer
- **Supabase (Postgres)** is the database; `lib/supabase.ts` creates the server client (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- `lib/data.ts` fetches through the app's own API routes (`app/api/**`), which do the Supabase reads/writes
- `/data/*.json` files are seed/reference data only, not the live store
- Types are centralized in `/types/index.ts`

### Authentication
- Admin auth is **session-based** using httpOnly cookies (sha256 hash)
- `lib/auth.ts`: `createSession()`, `validateSession()`, `destroySession()`
- Admin routes under `/app/admin/` check session via `validateSession()` before rendering

### AI Assistant
- Uses `@anthropic-ai/sdk` via `lib/anthropic.ts`; supports Anthropic-compatible gateways through optional `ANTHROPIC_BASE_URL` / `ANTHROPIC_MODEL` env vars
- API route at `/app/api/ai-assistant/route.ts` (POST only)
- System prompt enforces compassionate, non-medical communication guidelines

### Page Structure
```
app/
├── (site)/                     # Public pages: home, families (+[id]),
│                               #   plans, schedule, ai-assistant
├── admin/                      # Admin dashboard: families, plans,
│                               #   schedule, team, activities
├── login/                      # Admin login page
└── api/
    ├── ai-assistant/route.ts   # POST - AI chat endpoint
    ├── schedule/               # Public schedule API
    └── admin/                  # login/logout + CRUD routes for
                                #   families, plans, schedule, team,
                                #   activities (with [id] variants)
```

### Components
- `/components/layout/` - Navbar, Footer (shared across all pages)
- `/components/home/` - HeroSection, AboutSection, FocusAreasSection
- `/components/families/` - FamilyCard, PhotoGallery
- `/components/schedule/` - EventCard
- `/components/plans/` - PlanCard
- `/components/admin/` - AdminNavbar
- `/components/ai-assistant/` - AI chat components

## Key Patterns

- **Server Components**: All pages are Server Components by default; add `'use client'` only for interactivity
- **Styling**: Tailwind CSS with Geist font variables (`--font-geist-sans`, `--font-geist-mono`)
- **Type safety**: All data operations use TypeScript interfaces from `/types/index.ts`
- **AI responses**: Always handle the case where `ANTHROPIC_API_KEY` is not set (throws error, API returns 503)
