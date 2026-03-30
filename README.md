HEAD
# island-to-infinity-zhixing
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
- **Admin Mode** - Password-protected dashboard for managing content (accessible at `/admin`)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude API
- **Data:** JSON files (no database required)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI Assistant)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
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

# Required for Admin Access (choose a secure password)
ADMIN_PASSWORD=your_admin_password
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

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Vercel Dashboard

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure environment variables:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `ADMIN_PASSWORD` - Your admin password
5. Deploy

### Environment Variables on Vercel

In your Vercel project settings, add these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Yes (for AI Assistant) |
| `ADMIN_PASSWORD` | Admin dashboard password | Yes (for admin access) |

## Privacy & Ethics

- All family data uses **pseudonyms** instead of real names
- Only **general locations** are shown (no specific addresses)
- Photos are only displayed with **explicit consent**
- No sensitive financial or personal details are exposed
- All support plans are framed **ethically and respectfully**

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ai-assistant/  # AI Assistant API
│   │   └── admin/         # Admin auth API
│   ├── admin/             # Admin dashboard
│   ├── families/          # Families pages
│   ├── plans/             # Plans pages
│   ├── schedule/          # Schedule pages
│   └── ai-assistant/      # AI Assistant page
├── components/            # React components
│   ├── layout/           # Navbar, Footer
│   ├── home/             # Home page sections
│   ├── families/         # Family-related components
│   ├── schedule/         # Schedule components
│   ├── plans/            # Plan components
│   ├── ai-assistant/     # AI chat components
│   └── admin/            # Admin components
├── data/                  # JSON data files
│   ├── families.json
│   ├── schedule.json
│   └── plans.json
├── lib/                   # Utility functions
│   ├── anthropic.ts      # Claude API client
│   ├── auth.ts           # Admin authentication
│   └── data.ts           # Data fetching
└── types/                # TypeScript interfaces
```

## License

This project is created for educational and social impact purposes.

---

Built with care for the community.
>>>>>>> 5244565 (Initial commit)
