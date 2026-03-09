# TradeSense Data Pipeline

## 脚本

- `npm run fetch:news`：抓取一周新闻
- `npm run fetch:prices`：抓取相关新闻股票价格窗口
- `npm run generate:events`：生成 `event_groups/events` 并可写入 Supabase
- `npm run remediate:events`：修复历史 `source=auto` 数据（翻译为中文并补齐到至少 3 条事件）
- `npm run audit:events`：审计并清理不相关事件（默认 dry-run；可删除不相关 events 并补齐到至少 3 条）
- `npm run seed`：把 `web/src/models/mockData.ts` 导入 Supabase

## 环境变量

```bash
STOCKDATA_API_KEY=
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PIPELINE_NEWS_REQUEST_BUDGET=20
PIPELINE_PRICE_REQUEST_BUDGET=80
PIPELINE_REMEDIATE_SYMBOLS=RDNT,TSLA
PIPELINE_REMEDIATE_MAX_GROUPS=10000
PIPELINE_AUDIT_APPLY=false
PIPELINE_AUDIT_MAX_GROUPS=100000
```

## 运行

```bash
npm install
npm run run
```
