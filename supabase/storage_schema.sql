-- Create a new public bucket for event posters
insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true);

-- Policy: Public Read Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'event-posters' );

-- Policy: Authenticated Upload Access
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'event-posters' and auth.role() = 'authenticated' );

-- Policy: Creator Update/Delete Access (Optional, for future use)
create policy "Creator Update Delete"
  on storage.objects for all
  using ( bucket_id = 'event-posters' and auth.uid() = owner );
