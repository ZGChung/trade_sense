# TradeSense

TradeSense 是一个用于训练交易直觉的 Web 应用：给出历史事件与股票表现，用户预测涨/跌/平后查看结果与 AI 讲解。

## 当前代码结构

- `web/`：前端应用（React + TypeScript + Vite + Tailwind）
- `pipeline/`：数据管道（StockData 抓取 + Gemini 中文化/补全 + Supabase 写入）
- `supabase/`：数据库 schema

## 核心能力

- 三种模式：练习模式 / 每日挑战 / 挑战模式
- 排行榜：每日挑战与挑战模式
- 登录同步：Supabase Auth（邮箱登录）
- 匿名记录：未登录也会写入练习数据用于题目难度分析
- AI 解释缓存：同题仅缓存“答对/答错”两种解释，减少 API 调用
- 自动数据修复：`source=auto` 事件会被翻译为中文、去重，并补齐到至少 3 条

## 本地运行（前端）

```bash
cd web
npm install
cp .env.example .env
# 填写 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_GEMINI_API_KEY
npm run dev
```

## 数据管道

```bash
cd pipeline
npm install
# 配置 STOCKDATA_API_KEY / GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
npm run run
```

常用单独命令：

- `npm run fetch:news`
- `npm run fetch:prices`
- `npm run generate:events`
- `npm run remediate:events`

## 数据库

先在 Supabase SQL Editor 执行 `supabase/schema.sql`，再运行前端与数据管道。

## CI / Workflow

- `.github/workflows/ci.yml`：前端 lint + build
- `.github/workflows/data-pipeline.yml`：定时/手动跑数据抓取与 remediation
