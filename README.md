# Island to Infinity Zhixing

A publicly accessible web application for a student-led social impact project supporting underprivileged families in Changshu, China.

## Project Overview

Island to Infinity Zhixing is a long-term community project that supports underprivileged families in Changshu. Each family is seen as an "island", and the goal is to build meaningful human connections and reduce isolation.

### Core Focus Areas

- **Mental Health Support** - Emotional support and resources for families
- **Companionship** - Regular visits and social interaction for isolated individuals
- **Social Integration** - Helping families connect with their communities

## Features

- **Home Page** - Mission statement, about section, and focus areas
- **Schedule Page** - Public view of upcoming activities and events
- **Families Page** - Anonymized family profiles (pseudonyms, no sensitive data)
- **Plans Page** - Structured support plans with ethical considerations
- **AI Assistant** - Compassionate communication guidance tool powered by Claude AI
- **Admin Dashboard** - Password-protected management interface at `/admin`
- **Login Page** - Secure admin authentication at `/login`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude API (also works with Anthropic-compatible gateways)
- **Data:** Supabase (Postgres) behind the app's own API routes
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI Assistant)

### Installation

```bash
# Clone the repository
git clone https://github.com/elaine101224-svg/island-to-infinity-zhixing.git
cd island-to-infinity-zhixing

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required for AI Assistant
ANTHROPIC_API_KEY=your_anthropic_api_key
# Optional: use an Anthropic-compatible gateway / different model
ANTHROPIC_BASE_URL=
ANTHROPIC_MODEL=

# Required for Admin Access (choose a secure password)
ADMIN_PASSWORD=your_admin_password

# Required for data storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Public site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Deployment to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add the same environment variables as in `.env.local` above (Project Settings → Environment Variables)
4. Deploy

Or with the CLI: `npm i -g vercel && vercel link && vercel --prod`.

## Privacy & Ethics

- All family data uses **pseudonyms** instead of real names
- Only **general locations** are shown (no specific addresses)
- Photos are only displayed with **explicit consent**
- No sensitive financial or personal details are exposed
- All support plans are framed **ethically and respectfully**

## Project Structure

```
├── app/
│   ├── (site)/               # Public pages: home, families, plans,
│   │                         #   schedule, ai-assistant
│   ├── admin/                # Admin dashboard (families, plans,
│   │                         #   schedule, team, activities)
│   ├── login/                # Admin login page
│   └── api/
│       ├── ai-assistant/     # AI Assistant endpoint
│       ├── schedule/         # Public schedule API
│       └── admin/            # Auth + CRUD APIs (families, plans,
│                             #   schedule, team, activities)
├── components/               # Layout, home, families, schedule,
│                             #   plans, ai-assistant, admin
├── data/                     # Seed JSON (families, schedule, plans)
├── lib/
│   ├── anthropic.ts          # Claude API client (gateway-aware)
│   ├── auth.ts               # Admin session auth
│   ├── supabase.ts           # Supabase server client
│   └── data.ts               # Data fetching via API routes
└── types/
    └── index.ts              # TypeScript interfaces
```

## License

This project is created for educational and social impact purposes.

---

Built with care for the community.
