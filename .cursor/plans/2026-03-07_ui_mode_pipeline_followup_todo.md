# TradeSense Follow-up TODO (2026-03-07)

Status legend: `[ ] pending` `[~] in progress` `[x] done`

## UI / Interaction
- [x] (1) Top-right three controls use aligned style (same width/height/background family; no overlap)
- [x] (2) Add explicit boundary boxes for prediction options `涨 / 跌 / 平`
- [x] (4) Ensure right arrow is also shortcut for `平` (same as left arrow)
- [x] (6) Remove `练习进度` progress bar block
- [x] (7) Show short selected-mode description under mode selector
- [x] (8) Remove daily info box (e.g. `今日得分｜最高`)
- [x] (12) Hide stock search bar in `每日挑战` and `挑战模式`; keep manual search in `练习模式` only
- [x] (13) Keep 3-mode selector visible at all times (including after answer)
- [x] (14) Make `继续练习` and `分享结果` buttons the same height

## Modes / Leaderboard Rules
- [x] (9) Implement leaderboard for `每日挑战` and `挑战模式`
- [x] (9) Add leaderboard entry button near mode selector (next to challenge area) to show selected mode leaderboard
- [x] (10) Daily challenge rules and ranking:
  - [x] 10 fixed questions/day for all users
  - [x] rank by accuracy desc, then total time asc
  - [x] leaderboard view: global top 5 + current user rank below separator
- [x] (11) Challenge mode rules and ranking:
  - [x] 10-second timer per question
  - [x] timeout/wrong => 1 strike
  - [x] 3 strikes => lose run
  - [x] show 3 hearts (strike breaks one)
  - [x] switching mode before loss records voluntary quit
  - [x] rank by solved questions desc, then hearts left desc, then total time asc

## Data / Analytics / Schema
- [x] (5) Add more achievement items
- [x] Update Supabase schema + analytics payload/query logic for new leaderboard metrics

## Pipeline
- [x] (3) Use full StockData free quota whenever quota refreshes (maximize data ingestion each cycle)

