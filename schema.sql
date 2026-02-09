-- Tabla para las jornadas laborales
create table public.jornadas (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references auth.users not null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  break_inicio timestamptz,
  break_fin timestamptz,
  estado text check (estado in ('activa', 'pausada', 'completada')) default 'activa'
);

-- Tabla para las pausas dentro de una jornada
create table public.pausas (
  id uuid default gen_random_uuid() primary key,
  jornada_id uuid references public.jornadas not null,
  inicio timestamptz not null default now(),
  fin timestamptz
);

-- Habilitar RLS (Row Level Security)
alter table public.jornadas enable row level security;
alter table public.pausas enable row level security;

-- Políticas para Jornadas
create policy "Usuarios pueden ver sus propias jornadas"
on public.jornadas for select
using (auth.uid() = usuario_id);

create policy "Usuarios pueden crear sus propias jornadas"
on public.jornadas for insert
with check (auth.uid() = usuario_id);

create policy "Usuarios pueden actualizar sus propias jornadas"
on public.jornadas for update
using (auth.uid() = usuario_id);

-- Políticas para Pausas (vinculadas a la jornada del usuario)
create policy "Usuarios pueden ver sus propias pausas"
on public.pausas for select
using (exists (select 1 from public.jornadas where id = pausas.jornada_id and usuario_id = auth.uid()));

create policy "Usuarios pueden crear sus propias pausas"
on public.pausas for insert
with check (exists (select 1 from public.jornadas where id = jornada_id and usuario_id = auth.uid()));

create policy "Usuarios pueden actualizar sus propias pausas"
on public.pausas for update
using (exists (select 1 from public.jornadas where id = jornada_id and usuario_id = auth.uid()));
