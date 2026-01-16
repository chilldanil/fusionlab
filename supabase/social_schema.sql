-- Social + privacy extensions

-- Profile privacy + progression fields
alter table public.profiles
    add column if not exists xp integer not null default 0,
    add column if not exists is_incognito boolean not null default false;

-- Friendships table
create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid references public.profiles (id) on delete cascade not null,
    receiver_id uuid references public.profiles (id) on delete cascade not null,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
    created_at timestamp with time zone not null default now(),
    constraint friendships_requester_receiver_different check (requester_id <> receiver_id)
);

create unique index if not exists friendships_requester_receiver_idx
    on public.friendships (requester_id, receiver_id);

alter table public.friendships enable row level security;

create policy if not exists "Users can view their friendships."
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy if not exists "Users can create friendship requests."
  on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy if not exists "Participants can update friendship status."
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy if not exists "Participants can delete friendships."
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = receiver_id);
