-- Booking system tables

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null,
  seat_id text,
  user_id uuid references public.profiles (id) on delete cascade not null,
  booking_date date not null,
  slot_label text not null,
  status text not null default 'reserved' check (status in ('pending', 'reserved', 'confirmed', 'cancelled')),
  arrival_confirmed_at timestamp with time zone,
  rules_accepted_at timestamp with time zone,
  handoff_confirmed_at timestamp with time zone,
  handoff_confirmed_by uuid references public.profiles (id),
  created_at timestamp with time zone not null default now()
);

create index if not exists bookings_zone_id_idx on public.bookings (zone_id);
create index if not exists bookings_seat_id_idx on public.bookings (seat_id);
create index if not exists bookings_slot_idx on public.bookings (booking_date, slot_label);

create table if not exists public.booking_invites (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade not null,
  inviter_id uuid references public.profiles (id) on delete cascade not null,
  invitee_id uuid references public.profiles (id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone not null default now(),
  unique (booking_id, invitee_id)
);

create table if not exists public.property_keys (
  id uuid primary key default gen_random_uuid(),
  key_id text not null unique,
  zone_id text not null,
  seat_id text,
  current_holder_id uuid references public.profiles (id) on delete set null,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.booking_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade not null,
  type text not null check (type in ('checkin_required', 'no_show_cancelled')),
  message text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  unique (booking_id, type)
);

alter table public.bookings enable row level security;
alter table public.booking_invites enable row level security;
alter table public.property_keys enable row level security;
alter table public.booking_notifications enable row level security;

-- Bookings policies
create policy "Bookings are viewable by everyone."
  on public.bookings for select
  using (true);

create policy "Users can create their own bookings."
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookings."
  on public.bookings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bookings."
  on public.bookings for delete
  using (auth.uid() = user_id);

-- Invite policies
create policy "Participants can view booking invites."
  on public.booking_invites for select
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "Inviters can create booking invites."
  on public.booking_invites for insert
  with check (auth.uid() = inviter_id);

create policy "Participants can update booking invites."
  on public.booking_invites for update
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

drop policy if exists "Property keys are viewable by everyone." on public.property_keys;
drop policy if exists "Authenticated users can upsert property keys." on public.property_keys;
drop policy if exists "Authenticated users can update property keys." on public.property_keys;
create policy "Property keys are viewable by everyone."
  on public.property_keys for select
  using (true);

create policy "Authenticated users can upsert property keys."
  on public.property_keys for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update property keys."
  on public.property_keys for update
  using (auth.uid() is not null);

drop policy if exists "Users can view their booking notifications." on public.booking_notifications;
drop policy if exists "Users can update their booking notifications." on public.booking_notifications;
create policy "Users can view their booking notifications."
  on public.booking_notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their booking notifications."
  on public.booking_notifications for update
  using (auth.uid() = user_id);
