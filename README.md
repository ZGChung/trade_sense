# TradeSense 📈

A web application designed to train trading intuition through historical events and stock performance data, helping users develop market sensitivity.

> **Note**: The iOS version has been archived and is available in the `TradeSense/` directory for reference. The active development is now focused on the web version.

<img width="671" height="487" alt="Screenshot 2025-09-13 at 4 38 52 PM" src="https://github.com/user-attachments/assets/3a21581c-b3f7-4385-a568-1c9d6173d991" />

## 🎯 App Philosophy

TradeSense aims to help users practice predicting stock price movements in a simulated environment through real historical event cases, thereby cultivating trading intuition and risk management awareness.

## ✨ Core Features

### 🎲 Historical Event Training

-   **12 Real Historical Events**: Including Fed policies, earnings releases, industry news, etc.
-   **Multi-Market Coverage**: Representative companies from US, Hong Kong, and A-share markets
-   **Detailed Event Information**: Event descriptions, related stocks, dates, and impact cycles

### 🎯 3 Prediction Options

-   **Rise** (above +1%) 📈
-   **Flat** (-1% to +1%) 🟰
-   **Fall** (below -1%) 📉

### 📊 Real-time Statistical Feedback

-   **Accuracy Statistics**: Real-time calculation of prediction accuracy
-   **Streak Records**: Track current streak and highest streak
-   **Training Progress**: Total attempts and correct predictions

### 🔄 Complete Learning Loop

1. Display historical events
2. User makes predictions
3. Show actual results comparison
4. Update statistical information
5. Continue to next event

## 🛠 Tech Stack

### Web Version (Active)
-   **React 18** - UI framework
-   **TypeScript** - Type safety
-   **Vite** - Build tool and dev server
-   **Tailwind CSS** - Styling
-   **Vercel** - Deployment platform
-   **DeepSeek API** - AI-powered explanations

### iOS Version (Archived)
-   **SwiftUI** - Declarative UI framework
-   **Swift** - iOS native development language
-   **MVVM Architecture** - Separation of data and UI
-   **@Published** - Reactive state management

## 🚀 Quick Start

### Web Version (Recommended)

#### Requirements
- Node.js 18+ and npm

#### Installation Steps

1. Clone the project
   ```bash
   git clone <repository-url>
   cd trade_sense
   ```

2. Navigate to web directory
   ```bash
   cd web
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env and add your DeepSeek API key
   ```

5. Start development server
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5173`

#### Deployment to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variable `VITE_DEEPSEEK_API_KEY` in Vercel dashboard
4. Deploy!

### iOS Version (Archived)

The iOS version is archived in the `TradeSense/` directory. To use it:

1. Open Xcode project: `open TradeSense/TradeSense.xcodeproj`
2. Requirements: macOS 13.0+, Xcode 15.0+, iOS 17.0+
3. Build and run with `⌘ + R`

## 📁 Project Structure

```
trade_sense/
├── TradeSense/                  # Archived iOS version
│   └── ... (iOS Swift code)
├── web/                         # Web application (Active)
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── EventCard.tsx
│   │   │   ├── PredictionButton.tsx
│   │   │   ├── ResultView.tsx
│   │   │   └── StatsView.tsx
│   │   ├── models/              # TypeScript models
│   │   │   ├── types.ts
│   │   │   └── mockData.ts
│   │   ├── services/            # API services
│   │   │   └── deepSeekService.ts
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── useTradingSession.ts
│   │   ├── App.tsx              # Main app component
│   │   └── main.tsx             # Entry point
│   ├── public/                  # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json              # Vercel deployment config
│   └── .env.example             # Environment variable template
└── README.md
```

## 🎮 Usage Guide

### Basic Operations

1. **View Events**: Read the displayed historical event information
2. **Make Predictions**: Click one of the 3 prediction buttons
3. **View Results**: System shows comparison between your prediction and actual results
4. **Continue Practice**: Click "Continue Practice" to proceed to next event
5. **Reset Statistics**: Click "Reset" button in navigation bar to clear all statistics

### Learning Tips

-   Practice 10-15 events daily
-   Focus on logic behind events rather than pure guessing
-   Analyze reasons for incorrect predictions
-   Track accuracy trend changes

## 📊 Data Sources

The app contains 12 real historical event cases:

-   **Monetary Policy**: Fed rate cuts, central bank policies
-   **Earnings Events**: Apple, Tesla, Microsoft earnings reports
-   **Industry News**: AI technology breakthroughs, metaverse developments
-   **Company Dynamics**: Stock splits, price increases, business adjustments
-   **Market Sentiment**: User growth, revenue expectations

## 🔧 Development Roadmap

### Current Version (v1.0)

-   ✅ Basic prediction functionality
-   ✅ Mock data support
-   ✅ Statistics tracking system
-   ✅ SwiftUI interface
-   ✅ AI-powered explanations
-   ✅ Event grouping system
-   ✅ Collapsible statistics panel

### Future Features

-   [ ] Real data API integration
-   [ ] Expanded historical event library
-   [ ] Difficulty grading system
-   [ ] Achievement system
-   [ ] Social sharing features
-   [ ] Data export functionality

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Development Guidelines

-   Follow Swift API Design Guidelines
-   Use SwiftLint for code style checking
-   Write unit tests covering core logic
-   Run complete test suite before submitting

### Code Structure

-   Model: Pure data structures, no business logic
-   View: Stateless UI components
-   ViewModel: Business logic and state management

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 FAQ

### Q: App won't compile?

A: Ensure Xcode version is 15.0+, iOS deployment target is 17.0+

### Q: Simulator crashes?

A: Clean build folder (⌘ + Shift + K) and recompile

### Q: How to add new event data?

A: Add new items to the `eventGroups` array in `MockData.swift`

### Q: Do I need a developer account for device testing?

A: No, you can use a free Apple ID for device testing

### Q: How to set up AI explanations?

**Web Version**: Copy `web/.env.example` to `web/.env` and add your DeepSeek API key

**iOS Version (Archived)**: Copy `TradeSense/Config/config.example.plist` to `config.plist` and add your DeepSeek API key

## 📞 Support

For questions or suggestions, please contact us through:

-   Submit GitHub Issues
-   Email the development team

---

**TradeSense** - Develop your trading intuition and make smarter investment decisions!
