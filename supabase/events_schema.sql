-- Events Table
create type event_status as enum ('proposal', 'confirmed', 'cancelled');

create table public.events (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  title text not null check (char_length(title) >= 5),
  description text not null,
  event_date timestamptz not null,
  poster_url text,
  status event_status default 'proposal' not null,
  
  -- Constraint: Event must be at least 21 days in the future
  constraint event_date_future_check check (event_date > (now() + interval '21 days'))
);

-- Event Votes Table (for proposals)
create table public.event_votes (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  primary key (event_id, user_id)
);

-- Event Participants Table (for confirmed events)
create table public.event_participants (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  primary key (event_id, user_id)
);

-- RLS Policies

-- Events: Readable by everyone, Insertable by authenticated users
alter table public.events enable row level security;

create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = creator_id);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = creator_id);
  
-- Event Votes: Readable by everyone, Insertable/Deletable by owner
alter table public.event_votes enable row level security;

create policy "Votes are viewable by everyone"
  on public.event_votes for select
  using (true);

create policy "Users can vote"
  on public.event_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their vote"
  on public.event_votes for delete
  using (auth.uid() = user_id);

-- Event Participants: Insertable by owner
alter table public.event_participants enable row level security;

create policy "Participants are viewable by everyone"
  on public.event_participants for select
  using (true);

create policy "Users can join events"
  on public.event_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can leave events"
  on public.event_participants for delete
  using (auth.uid() = user_id);


-- Functions and Triggers

-- 1. Rate Limit: 1 event per month per user
create or replace function check_event_limit()
returns trigger as $$
begin
  if exists (
    select 1 from public.events
    where creator_id = new.creator_id
    and created_at > (now() - interval '1 month')
  ) then
    raise exception 'You can only propose 1 event per month.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_event_limit_trigger
  before insert on public.events
  for each row
  execute function check_event_limit();

-- 2. Auto-Confirm: 10 votes -> confirmed
create or replace function auto_confirm_event()
returns trigger as $$
declare
  vote_count int;
begin
  select count(*) into vote_count
  from public.event_votes
  where event_id = new.event_id;

  if vote_count >= 10 then
    update public.events
    set status = 'confirmed'
    where id = new.event_id
    and status = 'proposal';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_confirm_event_trigger
  after insert on public.event_votes
  for each row
  execute function auto_confirm_event();
