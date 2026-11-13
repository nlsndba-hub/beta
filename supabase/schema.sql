-- =====================================================================
-- Ultraclínica RSL · esquema do Supabase
-- Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
-- Pode ser executado mais de uma vez sem estragar nada.
-- =====================================================================

-- 1) PERFIS: um por usuário do Supabase Auth (tipo de acesso, médico e clínicas)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  username   text,
  role       text not null default 'pending'
             check (role in ('admin','fin','rec','med','vend','pending','none')),
  medico_id  text,
  clinicas   text[] not null default '{}',
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (lower(username));

-- 2) DADOS: cada paciente, agendamento, lançamento, item de estoque etc. é uma linha
create table if not exists public.records (
  seq        bigint generated always as identity,   -- mantém a ordem de cadastro
  collection text  not null,                        -- 'pac', 'ag', 'rec', 'pag', 'rp', 'est', 'med', 'ex'...
  id         text  not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (collection, id)
);
create index if not exists records_collection_seq_idx on public.records (collection, seq);

-- 3) CONFIGURAÇÕES: dados da clínica, modelos de mensagem, teste grátis, logo etc.
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

-- 4) Carimbo de quem alterou e quando
create or replace function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists records_touch  on public.records;
create trigger records_touch  before insert or update on public.records
  for each row execute function public.touch_row();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before insert or update on public.settings
  for each row execute function public.touch_row();

-- 5) Todo usuário novo ganha um perfil.
--    O PRIMEIRO usuário vira administrador; os seguintes ficam 'pending' (sem acesso)
--    até um administrador liberar na tela "Funcionários e acessos".
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base  text;
  uname text;
begin
  base  := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1));
  uname := base;
  if exists (select 1 from public.profiles where lower(username) = lower(uname)) then
    uname := base || '-' || substr(new.id::text, 1, 4);
  end if;
  insert into public.profiles (id, email, username, role)
  values (new.id, new.email, uname,
          case when exists (select 1 from public.profiles where role = 'admin') then 'pending' else 'admin' end);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Função auxiliar: tipo de acesso de quem está logado
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
revoke all on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- 7) SEGURANÇA (RLS): sem login não se lê nem se grava nada
alter table public.profiles enable row level security;
alter table public.records  enable row level security;
alter table public.settings enable row level security;

revoke all on public.profiles, public.records, public.settings from anon;
grant select, update                 on public.profiles to authenticated;
grant select, insert, update, delete on public.records  to authenticated;
grant select, insert, update, delete on public.settings to authenticated;

-- profiles: cada um vê o próprio perfil; administrador vê e altera todos
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() = 'admin');
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- records e settings: lê quem tem acesso ativo; grava admin, financeiro, recepção e médico
drop policy if exists records_select on public.records;
create policy records_select on public.records for select to authenticated
  using (public.my_role() in ('admin','fin','rec','med','vend'));
drop policy if exists records_insert on public.records;
create policy records_insert on public.records for insert to authenticated
  with check (public.my_role() in ('admin','fin','rec','med'));
drop policy if exists records_update on public.records;
create policy records_update on public.records for update to authenticated
  using (public.my_role() in ('admin','fin','rec','med')) with check (public.my_role() in ('admin','fin','rec','med'));
drop policy if exists records_delete on public.records;
create policy records_delete on public.records for delete to authenticated
  using (public.my_role() in ('admin','fin','rec','med'));

drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to authenticated
  using (public.my_role() in ('admin','fin','rec','med','vend'));
drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings for insert to authenticated
  with check (public.my_role() in ('admin','fin','rec','med'));
drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings for update to authenticated
  using (public.my_role() in ('admin','fin','rec','med')) with check (public.my_role() in ('admin','fin','rec','med'));
drop policy if exists settings_delete on public.settings;
create policy settings_delete on public.settings for delete to authenticated
  using (public.my_role() = 'admin');

-- 8) TEMPO REAL: quando um usuário salva, os outros veem sem recarregar
do $$
begin
  begin alter publication supabase_realtime add table public.records;  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.settings; exception when duplicate_object then null; end;
end $$;
