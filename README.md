# HVLab - Workspace Booking Application

A full-stack web application for booking shared workspaces, featuring an interactive floor plan, real-time availability, social features, and an arcade with 10 retro games.

## Features

- **Workspace Booking**: Reserve desks, tables, and private zones with seat-level selection
- **Real-time Updates**: Live availability updates via WebSocket subscriptions
- **User Profiles**: XP progression, skills, incognito mode
- **Social System**: Friend requests, booking invitations
- **Event System**: Propose community events, voting-based confirmation
- **3D Visualization**: Interactive building model and map
- **Arcade Games**: 10 engineering-themed retro games

## Tech Stack

### Frontend
- React 19.2 + TypeScript 5.9
- Vite 7.2 (build tool)
- Tailwind CSS 4.1
- React Router 7.9
- Three.js + @react-three/fiber (3D)
- Mapbox GL (maps)
- Framer Motion (animations)

### Backend
- Supabase (BaaS)
- PostgreSQL (database)
- Supabase Auth (authentication)
- Supabase Edge Functions (Deno serverless)

## Prerequisites

- Node.js 20 or higher
- npm 10 or higher
- A Supabase account (free tier available)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fusionlab
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema files in order:
   ```
   supabase/schema.sql
   supabase/social_schema.sql
   supabase/booking_schema.sql
   supabase/events_schema.sql
   supabase/simulation_schema.sql (optional - for bot simulation)
   ```
3. Copy your Project URL and anon key from Project Settings > API

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint code quality checks |
| `npm run preview` | Preview production build locally |

## Project Structure

```
fusionlab/
├── src/
│   ├── app/                    # App shell (routing, providers)
│   │   ├── App.tsx            # Root component
│   │   └── routes.tsx         # Route definitions
│   ├── features/              # Feature modules
│   │   ├── landing/           # Landing page with 3D model, map
│   │   ├── auth/              # Login/register
│   │   ├── booking/           # Workspace booking system
│   │   ├── user/              # User profile
│   │   ├── social/            # Friends, connections
│   │   ├── events/            # Event proposals
│   │   ├── arcade/            # 10 retro games
│   │   ├── model/             # 3D model viewer
│   │   └── dev/               # Design system docs
│   ├── shared/                # Shared code
│   │   ├── config/            # Supabase client
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # Custom hooks
│   │   └── ui/                # Reusable components
│   └── main.tsx               # Entry point
├── supabase/
│   ├── *.sql                  # Database schemas
│   └── functions/             # Edge functions
├── public/                    # Static assets
│   ├── hvhaus.glb            # 3D building model
│   ├── 3buildings.svg        # City buildings
│   └── small-modified.ifc    # IFC building data
└── python/                    # Data processing utilities
```

## Database Schema

### Core Tables

- **profiles**: User profiles with XP, skills, role
- **bookings**: Workspace reservations
- **booking_invites**: Private zone invitations
- **friendships**: User connections
- **events**: Community event proposals
- **event_votes**: Event voting system

### Row Level Security

All tables use PostgreSQL RLS policies for secure data access. Users can only modify their own data while reading is appropriately scoped.

## Deployment

### GitLab Pages (CI/CD)

The project includes `.gitlab-ci.yml` for automated deployment:

1. Set environment variables in GitLab (Settings > CI/CD > Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Push to `main` branch to trigger deployment

### Manual Deployment

```bash
npm run build
# Deploy contents of dist/ to your hosting provider
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## Contributing

1. Create a feature branch
2. Make changes
3. Run `npm run lint` and `npm run build`
4. Submit merge request

## Documentation

- [Interview Preparation Guide](./INTERVIEW_PREP.md) - Comprehensive technical documentation
- [Arcade Games](./src/features/arcade/README.md) - Game engine architecture

## License

Private - University Project
