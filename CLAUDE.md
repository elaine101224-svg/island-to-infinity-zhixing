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
- **JSON files** in `/data/` serve as the database (families.json, schedule.json, plans.json)
- `lib/data.ts` provides async functions to read/write these files using Node.js `fs` promises
- Types are centralized in `/types/index.ts`

### Authentication
- Admin auth is **session-based** using httpOnly cookies (sha256 hash)
- `lib/auth.ts`: `createSession()`, `validateSession()`, `destroySession()`
- Admin routes under `/app/admin/` check session via `validateSession()` before rendering

### AI Assistant
- Uses `@anthropic-ai/sdk` directly (not AI Gateway) via `lib/anthropic.ts`
- API route at `/app/api/ai-assistant/route.ts` (POST only)
- System prompt enforces compassionate, non-medical communication guidelines

### Page Structure
```
app/
├── page.tsx                    # Home page
├── families/[id]/page.tsx      # Family detail page (dynamic route)
├── families/page.tsx           # Families listing
├── plans/page.tsx             # Support plans listing
├── schedule/page.tsx           # Public events calendar
├── ai-assistant/page.tsx      # AI chat interface
├── admin/
│   ├── login/page.tsx          # Admin login (no auth required)
│   ├── page.tsx                # Admin dashboard
│   ├── families/page.tsx       # Manage families
│   ├── plans/page.tsx          # Manage plans
│   └── schedule/page.tsx       # Manage schedule
└── api/
    ├── ai-assistant/route.ts   # POST - AI chat endpoint
    └── admin/
        ├── login/route.ts       # POST - create session
        └── logout/route.ts      # POST - destroy session
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
