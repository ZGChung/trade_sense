# TradeSense iOS App 设置指南

## 第一步：在Xcode中创建新项目
1. 打开Xcode
2. 选择 "Create New Project"
3. 选择 "iOS" → "App"
4. 配置项目：
   - Product Name: `TradeSense`
   - Interface: `SwiftUI`
   - Language: `Swift`
   - 取消勾选 "Include Tests"
5. 选择保存位置

## 第二步：替换文件内容
将以下文件内容复制到Xcode项目中：

### 1. Models/PredictionOption.swift
```swift
import Foundation

enum PredictionOption: String, CaseIterable {
    case bigRise = "大涨"
    case smallRise = "小涨"
    case unchanged = "不变"
    case smallFall = "小跌"
    case bigFall = "大跌"
    
    var emoji: String {
        switch self {
        case .bigRise: return "📈"
        case .smallRise: return "↗️"
        case .unchanged: return "➡️"
        case .smallFall: return "↘️"
        case .bigFall: return "📉"
        }
    }
    
    var valueRange: ClosedRange<Double> {
        switch self {
        case .bigRise: return 0.02...Double.greatestFiniteMagnitude
        case .smallRise: return 0.01...0.02
        case .unchanged: return -0.01...0.01
        case .smallFall: return -0.02...(-0.01)
        case .bigFall: return -Double.greatestFiniteMagnitude...(-0.02)
        }
    }
}
```

### 2. Models/HistoricalEvent.swift
```swift
import Foundation

struct HistoricalEvent: Identifiable {
    let id = UUID()
    let description: String
    let date: String
    let stockSymbol: String
    let stockName: String
    let actualPerformance: Double
    let daysAfterEvent: Int
    
    var formattedPerformance: String {
        let percent = actualPerformance * 100
        let sign = percent >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.1f", percent))%"
    }
    
    var performanceCategory: PredictionOption {
        for option in PredictionOption.allCases {
            if option.valueRange.contains(actualPerformance) {
                return option
            }
        }
        return .unchanged
    }
}
```

（继续在下一个文件中...）

### 3. Models/MockData.swift
```swift
import Foundation

class MockData {
    static let shared = MockData()
    
    let historicalEvents: [HistoricalEvent] = [
        HistoricalEvent(
            description: "美联储宣布降息50个基点",
            date: "2020-03-03",
            stockSymbol: "SPY",
            stockName: "标普500ETF",
            actualPerformance: 0.052,
            daysAfterEvent: 5
        ),
        HistoricalEvent(
            description: "苹果公司财报超预期，iPhone销量创新高",
            date: "2021-01-27",
            stockSymbol: "AAPL",
            stockName: "苹果公司",
            actualPerformance: 0.018,
            daysAfterEvent: 3
        ),
        // ... 其他事件数据
    ]
    
    func getRandomEvent() -> HistoricalEvent {
        return historicalEvents.randomElement() ?? historicalEvents[0]
    }
}
```

### 4. Models/TradingSession.swift
```swift
import Foundation

class TradingSession: ObservableObject {
    @Published var currentEvent: HistoricalEvent
    @Published var userPrediction: PredictionOption?
    @Published var showResult: Bool = false
    @Published var totalAttempts: Int = 0
    @Published var correctPredictions: Int = 0
    @Published var currentStreak: Int = 0
    @Published var maxStreak: Int = 0
    
    private let mockData = MockData.shared
    
    init() {
        self.currentEvent = mockData.getRandomEvent()
    }
    
    var accuracy: Double {
        guard totalAttempts > 0 else { return 0 }
        return Double(correctPredictions) / Double(totalAttempts)
    }
    
    var formattedAccuracy: String {
        return String(format: "%.1f%%", accuracy * 100)
    }
    
    func makePrediction(_ prediction: PredictionOption) {
        userPrediction = prediction
        totalAttempts += 1
        
        let isCorrect = prediction == currentEvent.performanceCategory
        if isCorrect {
            correctPredictions += 1
            currentStreak += 1
            maxStreak = max(maxStreak, currentStreak)
        } else {
            currentStreak = 0
        }
        
        showResult = true
    }
    
    func nextEvent() {
        currentEvent = mockData.getRandomEvent()
        userPrediction = nil
        showResult = false
    }
    
    func resetSession() {
        totalAttempts = 0
        correctPredictions = 0
        currentStreak = 0
        maxStreak = 0
        nextEvent()
    }
}
```

### 5. Views/PredictionButton.swift
```swift
import SwiftUI

struct PredictionButton: View {
    let option: PredictionOption
    let isSelected: Bool
    let action: () -> Void
    
    var backgroundColor: Color {
        if isSelected {
            switch option {
            case .bigRise, .smallRise: return .green.opacity(0.3)
            case .unchanged: return .gray.opacity(0.3)
            case .smallFall, .bigFall: return .red.opacity(0.3)
            }
        }
        return Color(.systemGray6)
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(option.emoji)
                    .font(.title2)
                Text(option.rawValue)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity, minHeight: 80)
            .background(backgroundColor)
            .cornerRadius(12)
        }
    }
}
```

### 6. Views/EventCard.swift
```swift
import SwiftUI

struct EventCard: View {
    let event: HistoricalEvent
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("历史事件")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text(event.description)
                .font(.title3)
                .fontWeight(.semibold)
                .fixedSize(horizontal: false, vertical: true)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("\(event.stockName) (\(event.stockSymbol))")
                        .font(.subheadline)
                    Text("日期: \(event.date)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text("事件后\(event.daysAfterEvent)天")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(6)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}
```

### 7. Views/ResultView.swift
```swift
import SwiftUI

struct ResultView: View {
    let event: HistoricalEvent
    let userPrediction: PredictionOption
    let onContinue: () -> Void
    
    private var isCorrect: Bool {
        userPrediction == event.performanceCategory
    }
    
    private var resultColor: Color {
        isCorrect ? .green : .red
    }
    
    private var resultIcon: String {
        isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill"
    }
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: resultIcon)
                .font(.system(size: 50))
                .foregroundColor(resultColor)
            
            Text(isCorrect ? "预测正确!" : "预测错误")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(resultColor)
            
            VStack(spacing: 8) {
                Text("你的预测: \(userPrediction.rawValue) \(userPrediction.emoji)")
                    .font(.headline)
                
                Text("实际结果: \(event.performanceCategory.rawValue) \(event.performanceCategory.emoji)")
                    .font(.headline)
                
                Text("涨跌幅: \(event.formattedPerformance)")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(event.actualPerformance >= 0 ? .green : .red)
            }
            
            Button(action: onContinue) {
                Text("继续练习")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
    }
}
```

### 8. Views/StatsView.swift
```swift
import SwiftUI

struct StatsView: View {
    let totalAttempts: Int
    let correctPredictions: Int
    let currentStreak: Int
    let maxStreak: Int
    
    private var accuracy: Double {
        guard totalAttempts > 0 else { return 0 }
        return Double(correctPredictions) / Double(totalAttempts)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("训练统计")
                .font(.headline)
                .foregroundColor(.secondary)
            
            HStack(spacing: 20) {
                StatItem(title: "总次数", value: "\(totalAttempts)", icon: "number.circle")
                StatItem(title: "准确率", value: String(format: "%.1f%%", accuracy * 100), icon: "target")
                StatItem(title: "当前连胜", value: "\(currentStreak)", icon: "flame")
                StatItem(title: "最高连胜", value: "\(maxStreak)", icon: "trophy")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.blue)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
```

### 9. ContentView.swift (主界面)
```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var session = TradingSession()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    VStack {
                        Text("TradeSense")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("训练你的交易直觉")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top)
                    
                    StatsView(
                        totalAttempts: session.totalAttempts,
                        correctPredictions: session.correctPredictions,
                        currentStreak: session.currentStreak,
                        maxStreak: session.maxStreak
                    )
                    .padding(.horizontal)
                    
                    EventCard(event: session.currentEvent)
                        .padding(.horizontal)
                    
                    if !session.showResult {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                            ForEach(PredictionOption.allCases, id: \.self) { option in
                                PredictionButton(
                                    option: option,
                                    isSelected: session.userPrediction == option,
                                    action: { session.makePrediction(option) }
                                )
                            }
                        }
                        .padding(.horizontal)
                    } else {
                        ResultView(
                            event: session.currentEvent,
                            userPrediction: session.userPrediction!,
                            onContinue: session.nextEvent
                        )
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("重置") {
                        session.resetSession()
                    }
                }
            }
        }
    }
}
```

## 第三步：运行测试
1. 在Xcode中选择模拟器设备（如iPhone 15）
2. 点击运行按钮 (⌘ + R)
3. 测试所有功能：
   - 选择预测按钮
   - 查看结果反馈
   - 重置会话
   - 统计信息更新

## 项目结构
在Xcode中创建以下文件结构：
```
TradeSense/
├── Models/
│   ├── PredictionOption.swift
│   ├── HistoricalEvent.swift
│   ├── MockData.swift
│   └── TradingSession.swift
├── Views/
│   ├── PredictionButton.swift
│   ├── EventCard.swift
│   ├── ResultView.swift
│   └── StatsView.swift
└── ContentView.swift
```

这个应用现在包含了完整的功能：历史事件展示、5种预测选择、结果对比、会话统计和重置功能。