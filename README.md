# DSA Practice — Strivers A2Z

Personal Java practice tool for the Strivers A2Z DSA sheet. Code editor with live grader (Judge0 CE), 18-step roadmap, spaced-repetition reviews, drill mode, analytics dashboard.

## Local dev

```bash
npm install
npm start
# http://localhost:3101
```

## Deploy (Render + Supabase)

Required env vars:

| Var | Purpose |
|---|---|
| `SUPABASE_URL` | e.g. `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | service-role key |
| `AUTH_PASSWORD` | HTTP Basic password |
| `PORT` | Render injects automatically |

Run this SQL once in your Supabase project:

```sql
create table if not exists public.dsa_progress (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.dsa_progress (id, data) values ('main', '{}'::jsonb)
  on conflict (id) do nothing;
```

## Auto-ping

`.github/workflows/ping.yml` hits `/ping` every 10 minutes to keep the Render free instance warm.
