# TradeSense 📈

An iOS app designed to train trading intuition through historical events and stock performance data, helping users develop market sensitivity.

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

-   **SwiftUI** - Declarative UI framework
-   **Swift** - iOS native development language
-   **MVVM Architecture** - Separation of data and UI
-   **@Published** - Reactive state management
-   **DeepSeek API** - AI-powered explanations
-   **Mock Data** - 12 real historical cases

## 🚀 Quick Start

### Requirements

-   macOS 13.0+
-   Xcode 15.0+
-   iOS 17.0+

### Installation Steps

1. Clone the project

    ```bash
    git clone <repository-url>
    cd trade_sense
    ```

2. Open Xcode project

    ```bash
    open TradeSense/TradeSense.xcodeproj
    ```

3. Select simulator device (iPhone 15 Pro recommended)

4. Build and run
    - Shortcut: `⌘ + R`
    - Or click the play button in Xcode toolbar

### Device Testing

1. Connect iPhone device
2. Select your device in Xcode
3. Sign with free Apple ID
4. Run test

## 📁 Project Structure

```
TradeSense/
├── TradeSenseApp.swift          # App entry point
├── ContentView.swift            # Main interface
├── Models/                      # Data models
│   ├── HistoricalEvent.swift    # Historical event model
│   ├── PredictionOption.swift   # Prediction option enum
│   ├── EventGroup.swift         # Event group model
│   ├── TradingSession.swift     # Trading session management
│   └── MockData.swift           # Mock data source
├── Views/                       # UI components
│   ├── EventCard.swift          # Event display card
│   ├── PredictionButton.swift   # Prediction button
│   ├── ResultView.swift         # Result display view
│   └── StatsView.swift          # Statistics panel
├── Services/                    # External services
│   └── DeepSeekService.swift    # AI explanation service
├── Config/                      # Configuration
│   ├── APIConfig.swift          # API configuration
│   └── config.example.plist     # Config template
├── Assets.xcassets/            # Asset files
└── Preview Content/            # Preview assets
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

A: Copy `TradeSense/Config/config.example.plist` to `config.plist` and add your DeepSeek API key

## 📞 Support

For questions or suggestions, please contact us through:

-   Submit GitHub Issues
-   Email the development team

---

**TradeSense** - Develop your trading intuition and make smarter investment decisions!
