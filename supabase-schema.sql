create table if not exists public.organization_reports (
  id bigint generated always as identity primary key,
  name text not null,
  invite integer not null check (invite >= 0),
  sign_up integer not null check (sign_up >= 0),
  sign_up_name text,
  invite_achieved integer not null check (invite_achieved >= 0),
  sign_up_achieved integer not null check (sign_up_achieved >= 0),
  forms_purchased integer not null check (forms_purchased >= 0),
  forms_filled integer not null check (forms_filled >= 0),
  week integer not null check (week between 1 and 52),
  report_date date,
  fees_to_pay numeric(12, 2) check (fees_to_pay is null or fees_to_pay >= 0),
  created_at timestamptz not null default now()
);

alter table public.organization_reports
  add column if not exists name text not null default 'PACE SETTERS DATABASE',
  add column if not exists invite integer not null default 0 check (invite >= 0),
  add column if not exists sign_up integer not null default 0 check (sign_up >= 0),
  add column if not exists sign_up_name text,
  add column if not exists invite_achieved integer not null default 0 check (invite_achieved >= 0),
  add column if not exists sign_up_achieved integer not null default 0 check (sign_up_achieved >= 0),
  add column if not exists forms_purchased integer not null default 0 check (forms_purchased >= 0),
  add column if not exists forms_filled integer not null default 0 check (forms_filled >= 0),
  add column if not exists week integer not null default 1 check (week between 1 and 52),
  add column if not exists report_date date,
  add column if not exists fees_to_pay numeric(12, 2) check (fees_to_pay is null or fees_to_pay >= 0),
  add column if not exists created_at timestamptz not null default now();

alter table public.organization_reports enable row level security;

grant insert on public.organization_reports to anon, authenticated;
grant select on public.organization_reports to authenticated;
grant usage, select on sequence public.organization_reports_id_seq to anon, authenticated;

drop policy if exists "Anyone can submit organization records" on public.organization_reports;
create policy "Anyone can submit organization records"
  on public.organization_reports
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Approved admins can read organization records" on public.organization_reports;
create policy "Approved admins can read organization records"
  on public.organization_reports
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') in (
    'ebenezereshunmensahanokye@gmail.com',
    'frankdebrahdarko@gmail.com'
  ));