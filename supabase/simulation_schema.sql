-- Simulation System Schema
-- This schema enables "controlled chaos" simulation with bot students

-- ============================================
-- 1. Add is_bot marker to profiles (not a role, just a filter flag)
-- ============================================
alter table public.profiles
    add column if not exists is_bot boolean not null default false;

-- ============================================
-- 2. Unique constraint for booking conflicts
-- This prevents duplicate bookings and enables "conflict attempts"
-- ============================================

-- First, create a partial unique index for active bookings only
-- This allows cancelled bookings to exist without blocking new ones
create unique index if not exists bookings_unique_active_seat
    on public.bookings (booking_date, slot_label, zone_id, seat_id)
    where status in ('pending', 'reserved', 'confirmed') and seat_id is not null;

-- For private zones (seat_id is null), one active booking per zone/date/slot
create unique index if not exists bookings_unique_active_private
    on public.bookings (booking_date, slot_label, zone_id)
    where status in ('pending', 'reserved', 'confirmed') and seat_id is null;

-- ============================================
-- 3. Simulation Configuration Table
-- ============================================
create table if not exists public.simulation_config (
    id uuid primary key default gen_random_uuid(),
    name text not null unique default 'default',
    
    -- General settings
    is_active boolean not null default false,
    bot_count integer not null default 80,
    tick_interval_seconds integer not null default 300, -- 5 minutes
    
    -- Action limits per tick
    actions_per_tick integer not null default 30,
    
    -- Probability rates (0.0 - 1.0)
    booking_create_rate numeric(4,3) not null default 0.25,
    booking_confirm_rate numeric(4,3) not null default 0.12,
    booking_cancel_rate numeric(4,3) not null default 0.07,
    conflict_rate numeric(4,3) not null default 0.18,
    invite_rate numeric(4,3) not null default 0.10,
    invite_accept_rate numeric(4,3) not null default 0.65,
    invite_reject_rate numeric(4,3) not null default 0.20,
    friendship_request_rate numeric(4,3) not null default 0.06,
    friendship_accept_rate numeric(4,3) not null default 0.70,
    event_create_rate numeric(4,3) not null default 0.02,
    event_vote_rate numeric(4,3) not null default 0.12,
    event_join_rate numeric(4,3) not null default 0.08,
    
    -- Time-based wave multipliers (hour -> multiplier)
    morning_wave_hours int[] not null default '{8,9,10}',
    morning_wave_multiplier numeric(3,2) not null default 1.50,
    lunch_wave_hours int[] not null default '{11,12,13}',
    lunch_wave_multiplier numeric(3,2) not null default 1.80,
    evening_wave_hours int[] not null default '{17,18,19}',
    evening_wave_multiplier numeric(3,2) not null default 1.30,
    
    -- Booking date range (days from now)
    booking_date_min_days integer not null default 0,
    booking_date_max_days integer not null default 3,
    
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- Insert default config
insert into public.simulation_config (name) values ('default') on conflict (name) do nothing;

-- ============================================
-- 4. Simulation State Table
-- ============================================
create table if not exists public.simulation_state (
    id uuid primary key default gen_random_uuid(),
    config_id uuid references public.simulation_config(id) on delete cascade not null,
    
    -- Execution state
    last_tick_at timestamp with time zone,
    next_tick_at timestamp with time zone,
    total_ticks integer not null default 0,
    
    -- Counters (reset each day)
    counter_date date not null default current_date,
    bookings_created integer not null default 0,
    bookings_cancelled integer not null default 0,
    arrivals_confirmed integer not null default 0,
    invites_sent integer not null default 0,
    invites_accepted integer not null default 0,
    invites_rejected integer not null default 0,
    friendships_requested integer not null default 0,
    friendships_accepted integer not null default 0,
    events_created integer not null default 0,
    events_voted integer not null default 0,
    events_joined integer not null default 0,
    conflicts_attempted integer not null default 0,
    conflicts_failed integer not null default 0,
    
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    
    unique (config_id)
);

-- ============================================
-- 5. Simulation Action Log
-- ============================================
create type simulation_action_type as enum (
    'booking_create',
    'booking_confirm_arrival',
    'booking_cancel',
    'booking_conflict_attempt',
    'invite_send',
    'invite_accept',
    'invite_reject',
    'friendship_request',
    'friendship_accept',
    'friendship_reject',
    'event_create',
    'event_vote',
    'event_join'
);

create table if not exists public.simulation_action_log (
    id uuid primary key default gen_random_uuid(),
    
    -- Action details
    action_type simulation_action_type not null,
    bot_id uuid references public.profiles(id) on delete set null,
    target_id uuid, -- Could be booking_id, event_id, user_id depending on action
    
    -- Result
    success boolean not null default true,
    error_message text,
    
    -- Context (JSON for flexibility)
    context jsonb not null default '{}',
    
    created_at timestamp with time zone not null default now()
);

-- Index for efficient querying
create index if not exists simulation_action_log_created_at_idx 
    on public.simulation_action_log (created_at desc);
create index if not exists simulation_action_log_action_type_idx 
    on public.simulation_action_log (action_type);
create index if not exists simulation_action_log_bot_id_idx 
    on public.simulation_action_log (bot_id);

-- ============================================
-- 6. Zone & Seat Reference (for simulation logic)
-- ============================================
create table if not exists public.simulation_zones (
    id text primary key, -- zone_id like PZ-1, RD-2, etc.
    name text not null,
    zone_type text not null check (zone_type in ('private-zone', 'desk-1p', 'desk-double', 'desk-3p-round', 'table-6p-share')),
    capacity integer not null default 1,
    min_invite_count integer, -- for private zones
    seat_labels text[] not null default '{}' -- ['A', 'B', 'C'] etc.
);

-- Populate zone reference data
insert into public.simulation_zones (id, name, zone_type, capacity, min_invite_count, seat_labels) values
    -- Private Zones (4-6 people, min 3 invites)
    ('PZ-1', 'Private Zone', 'private-zone', 6, 3, '{}'),
    ('PZ-2', 'Private Zone', 'private-zone', 5, 3, '{}'),
    ('PZ-3', 'Private Zone', 'private-zone', 4, 3, '{}'),
    ('PZ-4', 'Private Zone', 'private-zone', 6, 3, '{}'),
    
    -- 3P Round Desks
    ('RD-1', '3P Round Desk', 'desk-3p-round', 3, null, '{A,B,C}'),
    ('RD-2', '3P Round Desk', 'desk-3p-round', 3, null, '{A,B,C}'),
    ('RD-3', '3P Round Desk', 'desk-3p-round', 3, null, '{A,B,C}'),
    ('RD-4', '3P Round Desk', 'desk-3p-round', 3, null, '{A,B,C}'),
    ('RD-5', '3P Round Desk', 'desk-3p-round', 3, null, '{A,B,C}'),
    
    -- 6P Work Tables
    ('WT-1', '6P Work Table', 'table-6p-share', 6, null, '{A,B,C,D,E,F}'),
    ('WT-2', '6P Work Table', 'table-6p-share', 6, null, '{A,B,C,D,E,F}'),
    ('WT-3', '6P Work Table', 'table-6p-share', 6, null, '{A,B,C,D,E,F}'),
    ('WT-4', '6P Work Table', 'table-6p-share', 6, null, '{A,B,C,D,E,F}'),
    
    -- Single Desks (1P)
    ('SD-1', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-2', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-3', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-4', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-5', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-6', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-7', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-8', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-9', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-10', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-11', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-12', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-13', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-14', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-15', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-16', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-17', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-18', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-19', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-20', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-21', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-22', '1P Desk', 'desk-1p', 1, null, '{A}'),
    ('SD-23', '1P Desk', 'desk-1p', 1, null, '{A}'),
    
    -- Double Desks (2P)
    ('DD-1', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-2', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-3', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-4', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-5', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-6', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-7', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-8', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-9', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-10', 'Double Desk', 'desk-double', 2, null, '{A,B}'),
    ('DD-11', 'Double Desk', 'desk-double', 2, null, '{A,B}')
on conflict (id) do nothing;

-- ============================================
-- 7. RLS Policies for simulation tables
-- ============================================
alter table public.simulation_config enable row level security;
alter table public.simulation_state enable row level security;
alter table public.simulation_action_log enable row level security;
alter table public.simulation_zones enable row level security;

-- Config: admin read/write, authenticated read
create policy "Simulation config viewable by authenticated users"
    on public.simulation_config for select
    using (auth.uid() is not null);

-- State: admin read/write, authenticated read
create policy "Simulation state viewable by authenticated users"
    on public.simulation_state for select
    using (auth.uid() is not null);

-- Action log: authenticated read
create policy "Simulation action log viewable by authenticated users"
    on public.simulation_action_log for select
    using (auth.uid() is not null);

-- Zones: public read
create policy "Simulation zones viewable by everyone"
    on public.simulation_zones for select
    using (true);

-- ============================================
-- 8. Time slots reference
-- ============================================
create table if not exists public.simulation_time_slots (
    slot_label text primary key,
    start_hour integer not null,
    end_hour integer not null,
    display_order integer not null
);

insert into public.simulation_time_slots (slot_label, start_hour, end_hour, display_order) values
    ('08:00 - 10:00', 8, 10, 1),
    ('10:00 - 12:00', 10, 12, 2),
    ('12:00 - 14:00', 12, 14, 3),
    ('14:00 - 16:00', 14, 16, 4),
    ('16:00 - 18:00', 16, 18, 5),
    ('18:00 - 20:00', 18, 20, 6)
on conflict (slot_label) do nothing;

alter table public.simulation_time_slots enable row level security;

create policy "Time slots viewable by everyone"
    on public.simulation_time_slots for select
    using (true);
