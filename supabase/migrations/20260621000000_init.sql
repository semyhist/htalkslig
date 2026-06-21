-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  total_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Matches Table
create table public.matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  commence_time timestamp with time zone not null,
  home_odd numeric not null,
  draw_odd numeric not null,
  away_odd numeric not null,
  status text not null default 'pending',
  home_score integer,
  away_score integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Predictions Table
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id text references public.matches(id) on delete cascade not null,
  predicted_outcome text not null check (predicted_outcome in ('home', 'draw', 'away')),
  predicted_diff integer not null,
  is_calculated boolean default false not null,
  earned_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, match_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- Profiles Policies
create policy "Allow public read on profiles" on public.profiles
  for select using (true);

create policy "Allow insert on profiles" on public.profiles
  for insert with check (true);

create policy "Allow individual insert/update on profiles" on public.profiles
  for all using (auth.uid() = id);

-- Matches Policies
create policy "Allow public read on matches" on public.matches
  for select using (true);

create policy "Allow authenticated users to manage matches" on public.matches
  for all using (auth.uid() is not null);

-- Predictions Policies
create policy "Allow public read on predictions" on public.predictions
  for select using (true);

create policy "Allow individual predictions" on public.predictions
  for insert with check (auth.uid() = user_id);

create policy "Allow individual updates on open predictions" on public.predictions
  for update using (
    auth.uid() = user_id and 
    exists (
      select 1 from public.matches 
      where id = match_id and commence_time > now()
  );

-- 4. Automatic Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, total_points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    0
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
