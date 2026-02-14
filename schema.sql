-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  usd_balance numeric(10, 4) default 0.01 check (usd_balance >= 0),
  last_login timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies for users
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

-- Only service role can update balance (backend)
-- But for simplicity in RLS, we might just allow read for users and let backend use service key for updates.

-- Transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  amount numeric(10, 4) not null,
  type text check (type in ('deposit', 'spend')) not null,
  description text,
  created_at timestamp with time zone default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create or replace function public.spend_balance(p_user_id uuid, p_amount numeric, p_description text)
returns numeric
language plpgsql
security definer
as $$
declare
  current_balance numeric;
  new_balance numeric;
begin
  if p_amount is null or p_amount <= 0 then
    select usd_balance into current_balance from public.users where id = p_user_id;
    return current_balance;
  end if;

  select usd_balance into current_balance
  from public.users
  where id = p_user_id
  for update;

  if current_balance is null then
    raise exception 'user_not_found';
  end if;

  if current_balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  update public.users
  set usd_balance = usd_balance - p_amount
  where id = p_user_id
  returning usd_balance into new_balance;

  insert into public.transactions (user_id, amount, type, description)
  values (p_user_id, -p_amount, 'spend', p_description);

  return new_balance;
end;
$$;

-- Chat Sessions
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text default 'New Chat',
  model_id text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.chat_sessions enable row level security;

create policy "Users can view own sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content jsonb not null, -- Stores text or other parts
  tokens_used int default 0,
  cost numeric(10, 6) default 0,
  created_at timestamp with time zone default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in own sessions" on public.messages
  for select using (
    exists (
      select 1 from public.chat_sessions
      where id = messages.session_id and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own sessions" on public.messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions
      where id = messages.session_id and user_id = auth.uid()
    )
  );

-- Function to handle new user creation trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, usd_balance)
  values (new.id, new.email, 0.01);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
