# Vercel Environment Variables for AI Cache

To enable the cross-user AI explanation cache, add these environment variables
in your Vercel project dashboard (Project → Settings → Environment Variables):

## Required

| Name | Value | Notes |
|------|-------|-------|
| `SUPABASE_URL` | `https://xrwoagdzubrndejxzrmz.supabase.co` | Same as `VITE_SUPABASE_URL` without the `VITE_` prefix |
| `SUPABASE_SERVICE_ROLE_KEY` | (your service role key from GitHub secrets) | Must be the **service role** key (bypasses RLS), not the anon key |

## How to find the service role key

1. Go to your Supabase project dashboard → Settings → API
2. Under "Service role" (or "service_key"), copy the `service_role` JWT
3. Add it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel

## Supabase table setup

Before deploying, create the `ai_explanation_cache` table:

```sql
create table ai_explanation_cache (
  id uuid default gen_random_uuid() primary key,
  stock_symbol text not null,
  stock_name text not null,
  event_ids text not null,
  correct_answer text not null,
  user_prediction text not null,
  explanation text not null,
  provider text not null default 'minimax',
  created_at timestamptz default now()
);

create index if not exists idx_ai_explanation_cache_lookup
  on ai_explanation_cache (stock_symbol, event_ids, correct_answer, user_prediction);

alter table ai_explanation_cache
  add constraint ai_explanation_cache_unique
  unique (stock_symbol, event_ids, correct_answer, user_prediction);
```

Run via Supabase SQL Editor (Project → SQL Editor → New Query), or run:
```bash
cd pipeline
SUPABASE_URL=https://xrwoagdzubrndejxzrmz.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx setup-ai-cache.ts
```

## Pre-computation

After the table is created, pre-compute all explanations:

```bash
cd pipeline
SUPABASE_URL=https://xrwoagdzubrndejxzrmz.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_key \
MINIMAX_API_KEY=your_minimax_key \
npx tsx precompute-ai-cache.ts
```

Options:
- `PIPELINE_PRECOMPUTE_DRY_RUN=true` — show what would be computed (no API calls)
- `PIPELINE_PRECOMPUTE_BATCH_SIZE=5` — control parallelism (default: 10)
- `PIPELINE_VERBOSE=true` — log each explanation as it's computed
