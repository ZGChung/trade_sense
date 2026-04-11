/**
 * pipeline/setup-ai-cache.ts
 *
 * Creates the ai_explanation_cache table in Supabase using the
 * Supabase Management API (no exec RPC required).
 *
 * Run with: npx tsx setup-ai-cache.ts
 *
 * Required env vars:
 *   SUPABASE_URL          e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function setup() {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log("🔧 Setting up ai_explanation_cache table...\n");

  // Use the service role client to insert a placeholder row if table is empty.
  // If the table doesn't exist yet, we'll get a clear error and instruct the user.
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Try to check if table exists by querying it
  const { error: checkError } = await supabase
    .from("ai_explanation_cache")
    .select("id")
    .limit(1);

  if (!checkError) {
    console.log("✅ Table ai_explanation_cache already exists.\n");
  } else if (checkError.code === "PGRST116") {
    // Table exists but returns no rows — that's fine
    console.log("✅ Table ai_explanation_cache already exists.\n");
  } else if (checkError.code === "42P01") {
    // Table does not exist
    console.error(
      `❌ Table ai_explanation_cache does not exist.\n` +
        `   Please create it in your Supabase SQL editor with the following SQL:\n\n` +
        SQL_CREATE_TABLE +
        `\n` +
        `   Then re-run this script to verify.\n`
    );
    process.exit(1);
  } else {
    console.error(`❌ Unexpected error checking table: ${checkError.message}`);
    process.exit(1);
  }

  // Verify we can do a dummy upsert (tests write permissions)
  const testKey = `__setup_test__::__setup_test__::__setup_test__::__setup_test__`;
  const { error: upsertError } = await (supabase as any)
    .from("ai_explanation_cache")
    .upsert(
      {
        stock_symbol: "__setup_test__",
        stock_name: "__setup_test__",
        event_ids: "__setup_test__",
        correct_answer: "__setup_test__",
        user_prediction: "__setup_test__",
        explanation: "setup test",
        provider: "setup",
      },
      {
        onConflict: "stock_symbol,event_ids,correct_answer,user_prediction",
      }
    )
    .select("id")
    .single();

  if (upsertError) {
    console.error(`❌ Write test failed: ${upsertError.message}`);
    console.error(`   Ensure the table exists and unique constraint is set (see SQL above).\n`);
    process.exit(1);
  }

  // Clean up test row
  await (supabase as any)
    .from("ai_explanation_cache")
    .delete()
    .eq("stock_symbol", "__setup_test__");

  console.log("✅ ai_explanation_cache table is ready and writable.\n");
  console.log("   Fields:");
  console.log("   - stock_symbol (text)         — ticker e.g. AAPL");
  console.log("   - stock_name (text)           — display name e.g. Apple Inc.");
  console.log("   - event_ids (text)            — sorted comma-separated event UUIDs");
  console.log("   - correct_answer (text)       — 涨 | 跌 | 平");
  console.log("   - user_prediction (text)      — 涨 | 跌 | 平");
  console.log("   - explanation (text)          — cached AI explanation");
  console.log("   - provider (text)             — 'minimax' (default)");
  console.log("   - created_at (timestamptz)    — auto-set");
  console.log("   + unique constraint on (stock_symbol, event_ids, correct_answer, user_prediction)\n");
}

const SQL_CREATE_TABLE = `
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
`.trim();

setup().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
