-- Spielberichte der Fußball-Kacheln (ADR 0013). Einmal im SQL Editor von Supabase ausführen (oder Supabase-CLI, docs/tools/Supabase.md).
-- Nur das eine Konto darf lesen und schreiben: die User UID aus lib/besitzer.ts.

create table public.spielberichte (
  partie text primary key,
  wettbewerb text not null,
  bericht text not null,
  modell text not null,
  erstellt timestamptz not null default now()
);

alter table public.spielberichte enable row level security;

create policy "Besitzer liest" on public.spielberichte
  for select to authenticated
  using (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e');

create policy "Besitzer legt an" on public.spielberichte
  for insert to authenticated
  with check (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e');

create policy "Besitzer ändert" on public.spielberichte
  for update to authenticated
  using (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e')
  with check (auth.uid() = '19c0195a-1112-4a25-96c0-de11af74b01e');
