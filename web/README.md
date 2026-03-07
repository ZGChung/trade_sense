# TradeSense Web

TradeSense 生产版前端（React + Vite）。

## 功能

- 匿名模式：本地 localStorage 持久化
- 登录模式：Supabase Auth + 云端同步（统计、成就、错题）
- 题库来源：Supabase `event_groups/events`，断网自动回退本地缓存
- AI 解释：Gemini 免费 -> 用户自带 Key -> 静态模板兜底
- PWA：自动注册 Service Worker，缓存事件接口

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

可选：`VITE_DEEPSEEK_API_KEY`

## 本地开发

```bash
npm install
npm run dev
```

## 构建与测试

```bash
npm run test
npm run build
```
