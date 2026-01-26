# Interview Preparation Guide - HVLab Workspace Booking Application

**Prepared for Coding Interview - Team Preparation Document**

This document covers all aspects of the codebase that every team member should understand. Use this to prepare for both group-level and individual-level questions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Deep Dive](#4-frontend-deep-dive)
5. [Backend & Database](#5-backend--database)
6. [Authentication Flow](#6-authentication-flow)
7. [Key Features Explained](#7-key-features-explained)
8. [Serverless Functions](#8-serverless-functions)
9. [DevOps & CI/CD](#9-devops--cicd)
10. [Installation Guide](#10-installation-guide)
11. [Common Interview Questions](#11-common-interview-questions)

---

## 1. Project Overview

### What is HVLab?

HVLab is a **full-stack workspace booking web application** for a shared coworking/study space. It allows users to:

- **Book workspace seats** (individual desks, shared tables, private zones)
- **Manage their profile** with XP progression and incognito mode
- **Connect with friends** and send booking invitations
- **Propose and vote on events** (community-driven event planning)
- **Play arcade games** (10 retro-style engineering-themed games)
- **Explore the building** via interactive 3D models and maps

### Project Name & Structure

```
Project: hvlab
Type: Single Page Application (SPA)
Main Framework: React 19 + TypeScript
Backend: Supabase (PostgreSQL + Auth + Edge Functions)
Deployment: GitLab Pages
```

### Directory Structure

```
/fusionlab
├── src/                          # Frontend source code
│   ├── app/                      # App shell (routing, providers)
│   ├── features/                 # Feature modules (landing, booking, auth, etc.)
│   ├── shared/                   # Shared code (context, hooks, UI components)
│   └── main.tsx                  # Entry point
├── supabase/                     # Backend (database schemas, edge functions)
│   ├── *.sql                     # Database schema files
│   └── functions/                # Serverless edge functions
├── public/                       # Static assets (3D models, images)
├── python/                       # Data processing utilities
└── Configuration files           # package.json, vite.config.ts, etc.
```

---

## 2. Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   React 19 SPA                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Landing  │ │ Booking  │ │ Profile  │ │ Arcade   │   │   │
│  │  │ Page     │ │ System   │ │ & Social │ │ Games    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │     Shared: AuthContext, Services, UI Components  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST API + Realtime WebSocket)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Service   │  │   PostgreSQL    │  │ Edge Functions  │ │
│  │  (JWT tokens)   │  │   Database      │  │ (Deno runtime)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  Tables: profiles, bookings, friendships, events, etc.          │
│  RLS: Row Level Security policies for data protection           │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Example (Booking a Seat)

```
1. User clicks "Book Seat" in BookingPage
2. BookingService.createSeatBooking() is called
3. Supabase client sends INSERT to 'bookings' table
4. PostgreSQL RLS policy checks: auth.uid() == user_id
5. If valid, booking is created with status 'reserved'
6. Real-time subscription notifies all connected clients
7. UI updates to show seat as booked
```

---

## 3. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework (latest with concurrent features) |
| **TypeScript** | 5.9.3 | Type safety and better DX |
| **Vite** | 7.2.4 | Build tool (fast HMR, optimized builds) |
| **Tailwind CSS** | 4.1.17 | Utility-first CSS styling |
| **React Router** | 7.9.6 | Client-side routing |
| **Framer Motion** | 12.23.24 | Animations and transitions |
| **Three.js** | 0.181.2 | 3D graphics rendering |
| **@react-three/fiber** | 9.4.0 | React renderer for Three.js |
| **Mapbox GL** | 3.18.0 | Interactive maps |
| **React Hook Form** | 7.66.1 | Form handling with validation |
| **Zod** | 4.1.12 | Schema validation |
| **Lucide React** | 0.554.0 | Icon library |

### Backend Technologies

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service (BaaS) |
| **PostgreSQL** | Relational database |
| **Supabase Auth** | User authentication (JWT-based) |
| **Supabase Edge Functions** | Serverless functions (Deno runtime) |
| **Row Level Security (RLS)** | Database-level access control |

### Why These Choices?

**React 19**: Latest stable version with improved performance and concurrent rendering.

**Vite over Create React App**:
- 10-100x faster development server startup
- Native ES modules support
- Optimized production builds

**Supabase over Firebase**:
- Open source, can self-host
- PostgreSQL (SQL) vs NoSQL
- Built-in Row Level Security
- Real-time subscriptions included

**Tailwind CSS**:
- No CSS files to manage
- Consistent design system
- Small bundle size (purges unused styles)

---

## 4. Frontend Deep Dive

### Application Entry Point

**File: `src/main.tsx`**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### App Shell & Routing

**File: `src/app/App.tsx`**
```typescript
// Three-layer wrapper structure
<AuthProvider>           // Authentication state
  <BrowserRouter>        // React Router
    <AppRoutes />        // Route definitions
  </BrowserRouter>
</AuthProvider>
```

### Route Structure

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | LandingPage | Public | Hero section with 3D model, map |
| `/login` | LoginPage | Public (redirects if logged in) | Login/Register form |
| `/profile` | ProfilePage | Protected | User profile, XP, settings |
| `/booking` | BookingPage | Protected | Workspace booking interface |
| `/my-bookings` | MyBookingsPage | Protected | User's bookings list |
| `/design` | DesignSystemPage | Public | Component documentation |
| `/model` | ModelShowcasePage | Public | 3D model viewer |

### Protected Routes Implementation

```typescript
// src/app/routes.tsx
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return children;
};
```

### Feature Modules

Each feature is self-contained with its own:
- Pages (main views)
- Components (UI elements)
- Services (API calls)
- Hooks (custom React hooks)
- Constants (configuration)

**Example: Booking Feature Structure**
```
src/features/booking/
├── BookingPage.tsx       # Main booking interface
├── MyBookingsPage.tsx    # User's bookings list
├── components/           # Booking-specific components
└── services/
    ├── BookingService.ts   # Booking CRUD operations
    └── ContractService.ts  # Contract handling
```

### State Management

We use **React Context** for global state (not Redux/Zustand):

**AuthContext** (`src/shared/context/AuthContext.tsx`):
- `user`: Current user profile
- `isAuthenticated`: Boolean login status
- `isLoading`: Loading state
- `login()`, `register()`, `logout()`, `updateProfile()`: Actions

```typescript
// Usage in components
const { user, login, logout } = useAuth();
```

### UI Components

Shared reusable components in `src/shared/ui/`:

- **Button**: Primary/outline variants, loading states
- **SchematicAvatar**: User avatar display
- **ErrorBoundary**: Catches and displays React errors

---

## 5. Backend & Database

### Supabase Setup

**Configuration File: `src/shared/config/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Database Schema Overview

#### Core Tables

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │     │    bookings     │     │   friendships   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (uuid, PK)   │◄────│ user_id (FK)    │     │ requester_id    │
│ full_name       │     │ zone_id         │     │ receiver_id     │
│ bio             │     │ seat_id         │     │ status          │
│ skills[]        │     │ booking_date    │     │ (pending/       │
│ role            │     │ slot_label      │     │  accepted/      │
│ xp              │     │ status          │     │  rejected)      │
│ is_incognito    │     │ arrival_confirmed│    └─────────────────┘
│ is_bot          │     │ created_at      │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     events      │     │  event_votes    │     │booking_invites  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (uuid, PK)   │◄────│ event_id (FK)   │     │ booking_id (FK) │
│ creator_id      │     │ user_id (FK)    │     │ inviter_id      │
│ title           │     │ created_at      │     │ invitee_id      │
│ description     │     └─────────────────┘     │ status          │
│ event_date      │                             └─────────────────┘
│ status (enum)   │
│ poster_url      │
└─────────────────┘
```

### Row Level Security (RLS)

RLS ensures users can only access data they're authorized to see.

**Example: Bookings RLS Policies**
```sql
-- Anyone can view bookings (for availability display)
create policy "Bookings are viewable by everyone."
  on public.bookings for select
  using (true);

-- Users can only create their own bookings
create policy "Users can create their own bookings."
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Users can only update their own bookings
create policy "Users can update their own bookings."
  on public.bookings for update
  using (auth.uid() = user_id);
```

### Database Triggers

**Auto-create profile on signup:**
```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Auto-confirm events with 10 votes:**
```sql
create function auto_confirm_event()
returns trigger as $$
declare vote_count int;
begin
  select count(*) into vote_count
  from public.event_votes where event_id = new.event_id;

  if vote_count >= 10 then
    update public.events set status = 'confirmed'
    where id = new.event_id and status = 'proposal';
  end if;
  return new;
end;
$$ language plpgsql;
```

### Booking System Schema

**Zone Types:**
| Type | Capacity | Description |
|------|----------|-------------|
| `desk-1p` | 1 | Single person desk |
| `desk-double` | 2 | Two-person desk |
| `desk-3p-round` | 3 | Round table for 3 |
| `table-6p-share` | 6 | Shared 6-person table |
| `private-zone` | 4-6 | Private room (requires 3+ invites) |

**Booking Status Flow:**
```
pending → reserved → confirmed → (cancelled)
                  ↓
            arrival_confirmed_at (timestamp)
```

**Time Slots:**
```
08:00 - 10:00
10:00 - 12:00
12:00 - 14:00
14:00 - 16:00
16:00 - 18:00
18:00 - 20:00
```

### Real-time Subscriptions

```typescript
// BookingPage.tsx - Real-time booking updates
useEffect(() => {
    const channel = supabase
        .channel(`booking-availability-${activeDate}-${activeSlot}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            () => {
                // Refresh bookings when any change occurs
                BookingService.listBookings(activeDate, activeSlot)
                    .then(setBookings);
            })
        .subscribe();

    return () => supabase.removeChannel(channel);
}, [activeDate, activeSlot]);
```

---

## 6. Authentication Flow

### Login Process

```
1. User enters email/password in LoginPage
2. supabase.auth.signInWithPassword() is called
3. Supabase validates credentials
4. JWT token is returned and stored in localStorage
5. AuthContext updates user state
6. onAuthStateChange listener triggers profile fetch
7. User is redirected to /profile
```

### Registration Process

```typescript
const register = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },  // Stored in user metadata
        },
    });
    // Database trigger creates profile automatically
};
```

### Session Management

- JWT tokens stored in localStorage (default Supabase behavior)
- `supabase.auth.getSession()` checks for existing session on app load
- `onAuthStateChange` listener responds to login/logout events

---

## 7. Key Features Explained

### 7.1 Landing Page

**File: `src/features/landing/LandingPage.tsx`**

Components:
- **CityOpener**: Animated intro sequence with city SVG
- **AnimatedCircuitBackground**: SVG circuit pattern animations
- **BuildingModel**: 3D GLB model rendered with Three.js
- **HorizontalScrollSection**: Scroll-triggered parallax effect
- **MapSection**: Mapbox GL interactive map with Munich locations

```typescript
// Lazy loading for performance
const MapSection = lazy(() => import('./components/MapSection'));
const BuildingModel = lazy(() => import('./components/BuildingModel'));
```

### 7.2 Booking System

**File: `src/features/booking/BookingPage.tsx`**

**Key Features:**
- Interactive floor plan grid (14x8 cells)
- Seat-level booking for shared zones
- Private zone booking with friend invites
- Real-time availability updates
- Grid and list view modes
- Zoom controls for floor plan

**Booking Flow:**
```
1. Select date and time slot
2. View available zones/seats
3. Click to select a zone
4. For private zones: invite 3+ friends
5. For other zones: select specific seat
6. Click "Book Seat" or "Request Private Zone"
```

**State Management in BookingPage:**
```typescript
const [selectedItem, setSelectedItem] = useState<string | null>(null);
const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
const [selectedSlot, setSelectedSlot] = useState('');
const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);
const [activeDate, setActiveDate] = useState(getTodayDate());
const [bookings, setBookings] = useState<BookingRecord[]>([]);
```

### 7.3 Social Features

**Friendships:**
```typescript
// Send friend request
await supabase.from('friendships').insert({
    requester_id: currentUserId,
    receiver_id: targetUserId,
    status: 'pending'
});

// Accept friend request
await supabase.from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
```

**XP System:**
- Users earn XP for activities
- Stored in `profiles.xp` column
- Displayed on profile page

### 7.4 Events System

**Constraints:**
- Events must be 21+ days in the future
- Rate limit: 1 event per month per user
- 10 votes auto-confirms event

```sql
-- 21-day future constraint
constraint event_date_future_check
  check (event_date > (now() + interval '21 days'))
```

### 7.5 Arcade Games

**File: `src/features/arcade/`**

10 canvas-based retro games:
1. Cable Router (Snake)
2. Block Demolition (Breakout)
3. Vector Defense (Space Invaders)
4. Void Drift (Asteroids)
5. Dual Axis (Pong)
6. Shaft Climber (Doodle Jump)
7. Scaffold Run (Donkey Kong)
8. Grid Maze (Pac-Man)
9. Crossing Protocol (Frogger)
10. Soft Landing (Lunar Lander)

**Game Engine Architecture:**
```typescript
interface BaseGameEngine {
  metadata: GameMetadata;
  controls: GameControls;

  // Lifecycle
  init(context: GameContext): void;
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  cleanup(): void;

  // Game loop
  update(deltaTime: number): void;
  render(): void;

  // State
  getState(): GameState;  // idle | playing | paused | gameover
  getScore(): GameScore;
}
```

### 7.6 3D Models & IFC Viewer

**Technologies:**
- Three.js for 3D rendering
- @react-three/fiber for React integration
- @ifc-viewer/core for IFC building data
- web-ifc for IFC parsing (WASM)

**Files:**
- `public/hvhaus.glb` - 3D building model (7MB)
- `public/small-modified.ifc` - IFC building data
- `public/3buildings.svg` - City buildings vector

---

## 8. Serverless Functions

### Supabase Edge Functions

Located in `supabase/functions/`, written in TypeScript for Deno runtime.

#### simulate-tick

**Purpose:** Creates realistic booking patterns with bot users

**Features:**
- Weighted slot popularity (10:00-12:00 is busiest)
- Zone type preferences (shared tables most popular)
- Bot team assignments (groups book together)
- Target fill rates per time slot
- Friendship creation between team members
- Event voting to trigger confirmations

```typescript
// Slot popularity weights
const SLOT_WEIGHTS = {
  '10:00 - 12:00': 1.0,   // Peak morning
  '12:00 - 14:00': 0.95,  // Lunch time
  '18:00 - 20:00': 0.4,   // Evening - less popular
};

// Target fill rates
const TARGET_FILL_RATES = {
  '10:00 - 12:00': 0.90,  // 90% full
  '18:00 - 20:00': 0.30,  // 30% full
};
```

#### Other Functions

- **simulation-control**: Manage simulation state
- **seed-bots**: Create bot user profiles
- **checkin-reminder**: Send booking reminders

---

## 9. DevOps & CI/CD

### GitLab CI/CD Pipeline

**File: `.gitlab-ci.yml`**

```yaml
stages:
  - build
  - deploy

# Stage 1: Build verification
lint:        # ESLint checks
type-check:  # TypeScript --noEmit
build:       # Full Vite build

# Stage 2: Deployment
pages:       # GitLab Pages (only on main branch)
```

**Pipeline Flow:**
```
Push to branch
    ↓
┌─────────────────────────────────────────┐
│              BUILD STAGE                 │
│  ┌────────┐ ┌────────────┐ ┌─────────┐ │
│  │  lint  │ │ type-check │ │  build  │ │
│  └────────┘ └────────────┘ └─────────┘ │
└─────────────────────────────────────────┘
    ↓ (if main branch)
┌─────────────────────────────────────────┐
│             DEPLOY STAGE                 │
│          ┌────────────────┐             │
│          │ GitLab Pages   │             │
│          └────────────────┘             │
└─────────────────────────────────────────┘
```

### Build Configuration

**File: `vite.config.ts`**

```typescript
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-wasm-files',
      buildStart() {
        // Copy WASM files for IFC viewer
        // web-ifc.wasm, web-ifc-mt.wasm
      }
    }
  ],
  optimizeDeps: {
    exclude: ['@ifc-viewer/core', 'web-ifc'],
  },
  assetsInclude: ['**/*.wasm', '**/*.ifc'],
});
```

### Environment Variables

**Required for production:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Set in GitLab: Settings > CI/CD > Variables

---

## 10. Installation Guide

### Prerequisites

- Node.js 20+
- npm or yarn
- Git

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd fusionlab

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Supabase Setup

1. Create project at supabase.com
2. Run SQL files in order:
   - `supabase/schema.sql`
   - `supabase/social_schema.sql`
   - `supabase/booking_schema.sql`
   - `supabase/events_schema.sql`
   - `supabase/simulation_schema.sql`
3. Copy Project URL and anon key to `.env`

---

## 11. Common Interview Questions

### Architecture Questions

**Q: Why did you choose Supabase over Firebase or building your own backend?**

A: Supabase offers several advantages:
- PostgreSQL provides strong relational data modeling (important for our booking system with multiple related tables)
- Row Level Security (RLS) handles authorization at the database level
- Built-in real-time subscriptions for live updates
- Open source - can self-host if needed
- TypeScript SDK with good type inference

**Q: Explain the data flow when a user makes a booking.**

A:
1. User selects zone/seat and time slot in BookingPage
2. BookingService.createSeatBooking() is called with booking details
3. Supabase client sends POST request to REST API
4. PostgreSQL RLS policy verifies `auth.uid() == user_id`
5. INSERT into bookings table with status 'reserved'
6. Real-time subscription broadcasts change to all clients
7. Other users see seat marked as unavailable

**Q: How do you handle concurrent booking attempts?**

A: We use PostgreSQL unique indexes:
```sql
create unique index bookings_unique_active_seat
  on public.bookings (booking_date, slot_label, zone_id, seat_id)
  where status in ('pending', 'reserved', 'confirmed');
```
This prevents duplicate bookings at the database level. If two users try to book the same seat simultaneously, one will succeed and the other will receive an error.

### Frontend Questions

**Q: Why React Context instead of Redux/Zustand for state management?**

A: Our application has relatively simple global state (mainly authentication). React Context is sufficient for:
- User authentication state (logged in/out, user profile)
- Low frequency updates (login/logout are rare operations)
- No complex state derivations or middleware needs

Redux would add unnecessary complexity for our use case.

**Q: Explain the protected route implementation.**

A:
```typescript
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <Loading />;  // Show loading while checking auth
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return children;  // Render protected content
};
```
- Checks authentication state from AuthContext
- Shows loading spinner during initial auth check
- Redirects to login if not authenticated
- Uses React Router's Navigate for client-side redirect

**Q: How does the real-time booking update work?**

A: We use Supabase's real-time subscriptions:
```typescript
const channel = supabase
    .channel('booking-updates')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
            // Refetch bookings when any change occurs
            refreshBookings();
        })
    .subscribe();
```
This establishes a WebSocket connection that receives database change events.

### Database Questions

**Q: Explain Row Level Security and why it's important.**

A: RLS is PostgreSQL's fine-grained access control:
- Policies are evaluated on every database operation
- Runs at database level, not application level
- Even if API is compromised, data is protected
- Example: `using (auth.uid() = user_id)` ensures users only access their own data

**Q: How does the event auto-confirmation trigger work?**

A:
```sql
create function auto_confirm_event()
returns trigger as $$
begin
  -- Count votes for this event
  select count(*) into vote_count
  from event_votes where event_id = new.event_id;

  -- If 10+ votes, update status to confirmed
  if vote_count >= 10 then
    update events set status = 'confirmed'
    where id = new.event_id and status = 'proposal';
  end if;

  return new;
end;
$$ language plpgsql;
```
Trigger fires after each vote insert, checks vote count, and updates event status.

**Q: Explain the booking schema relationships.**

A:
- `profiles` is the central user table
- `bookings` references profiles (user who booked)
- `booking_invites` links inviter → invitee for private zone invitations
- `friendships` is a self-referential relationship (user ↔ user)
- `events` and `event_votes` form a many-to-many relationship through votes

### DevOps Questions

**Q: Describe your CI/CD pipeline.**

A: GitLab CI/CD with two stages:
1. **Build stage** (parallel jobs):
   - `lint`: ESLint code quality checks
   - `type-check`: TypeScript compilation verification
   - `build`: Full production build
2. **Deploy stage** (only main branch):
   - Builds application with production env vars
   - Deploys to GitLab Pages

**Q: How do you handle environment variables in production?**

A:
- Development: `.env` file (gitignored)
- Production: GitLab CI/CD Variables (Settings > CI/CD > Variables)
- Variables are injected at build time via `import.meta.env.VITE_*`

### Code-Specific Questions

**Q: Walk me through the AuthContext implementation.**

A: See `src/shared/context/AuthContext.tsx`:
1. Creates React Context with user state
2. On mount, checks for existing session with `getSession()`
3. Sets up `onAuthStateChange` listener for auth events
4. Fetches profile from database when user authenticates
5. Provides `login`, `register`, `logout`, `updateProfile` methods
6. Exposes `useAuth()` hook for components

**Q: How does the booking page handle different zone types?**

A: The BookingPage differentiates zone types:
- **Private zones**: Require 3+ friend invites, book entire zone
- **Shared zones** (tables, desks): Require seat selection
- Grid position determines visual placement
- Status styles (available/occupied/reserved) are consistent

**Q: Explain the game engine architecture in the arcade.**

A: All games implement `BaseGameEngine` interface:
- `init()`: Set up canvas context, load assets
- `start()`: Begin game loop
- `update(deltaTime)`: Game logic (physics, AI)
- `render()`: Draw to canvas
- `handleKeyDown/Up`: Input handling
- `getState()`: Return current game state
- `getScore()`: Return score object

Games are registered in a factory pattern for easy extensibility.

---

## Quick Reference Card

### Key Files to Know

| File | Purpose |
|------|---------|
| `src/main.tsx` | Application entry point |
| `src/app/App.tsx` | Root component with providers |
| `src/app/routes.tsx` | Route definitions |
| `src/shared/context/AuthContext.tsx` | Authentication state |
| `src/shared/config/supabase.ts` | Supabase client |
| `src/features/booking/BookingPage.tsx` | Main booking interface |
| `supabase/booking_schema.sql` | Booking database schema |
| `vite.config.ts` | Build configuration |
| `.gitlab-ci.yml` | CI/CD pipeline |

### Commands

```bash
npm run dev      # Development
npm run build    # Production build
npm run lint     # Code quality
npm run preview  # Preview build
```

### Environment Variables

```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

**Good luck with your interview!**
