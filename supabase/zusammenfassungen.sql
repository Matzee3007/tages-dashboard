-- Zusammenfassungen der KI-News (ADR 0010). Einmal im SQL Editor von Supabase ausführen.
-- Nur das eine Konto darf lesen und schreiben: die User UID aus lib/besitzer.ts.

create table public.zusammenfassungen (
  link text primary key,
  zusammenfassung text not null,
  modell text not null,
  gekuerzt boolean not null,
  erstellt timestamptz not null default now()
);

alter table public.zusammenfassungen enable row level security;

create policy "Besitzer liest" on public.zusammenfassungen
  for select to authenticated
  using (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e');

create policy "Besitzer legt an" on public.zusammenfassungen
  for insert to authenticated
  with check (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e');

create policy "Besitzer ändert" on public.zusammenfassungen
  for update to authenticated
  using (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e')
  with check (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e');
