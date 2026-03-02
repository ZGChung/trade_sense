# TradeSense - 交易直觉训练应用

> 训练你的交易直觉，成为更好的投资者

![CI/CD](https://github.com/ZGChung/trade_sense/actions/workflows/ci.yml/badge.svg)
![Vercel](https://vercel.com/button)
![PWA](https://img.shields.io/badge/PWA-Ready-green)

## 功能特性

### 🎮 练习模式
- **休闲模式** - 自由练习，无限题目
- **挑战模式** - 10题一轮，测试你的准确率
- **每日挑战** - 每日更新的挑战题目

### 🏆 成就系统
- 14个成就等你解锁
- 连续答对、累计练习、首次达成等成就类型

### 📊 数据统计
- 正确率追踪
- 连续答对记录
- 历史练习记录

### 🎨 用户体验
- 🌙 暗色模式支持
- 📱 响应式设计 (手机/桌面)
- ⌨️ 快捷键支持
- 🔔 音效和触感反馈
- 📶 PWA 离线支持

## 快捷键

| 按键 | 功能 |
|------|------|
| ↑ / W | 预测上涨 |
| ↓ / S | 预测下跌 |
| ← / A | 预测持平 |
| 空格 / Enter | 继续下一题 |
| H | 显示/隐藏统计 |
| O | 显示/隐藏成就 |
| L | 显示/隐藏历史 |
| R | 重置会话 |

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + Framer Motion
- **CI/CD**: GitHub Actions
- **部署**: Vercel
- **PWA**: vite-plugin-pwa

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 项目结构

```
web/
├── src/
│   ├── components/     # React 组件
│   │   ├── AchievementBadge.tsx
│   │   ├── AchievementPanel.tsx
│   │   ├── EventCard.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── PredictionButton.tsx
│   │   ├── ResultView.tsx
│   │   ├── StatsView.tsx
│   │   └── StockFilter.tsx
│   ├── hooks/          # 自定义 Hooks
│   ├── models/         # 类型定义
│   ├── App.tsx
│   └── main.tsx
├── public/             # 静态资源
├── dist/              # 构建输出
└── package.json
```

## 部署

项目已配置 GitHub Actions CI/CD:
- Push 到 main 分支自动部署到 Vercel
- 需要配置 Vercel secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## 许可证

MIT License
