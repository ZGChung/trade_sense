import SwiftUI

struct ContentView: View {
    @StateObject private var session = TradingSession()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // 头部标题
                    VStack {
                        Text("TradeSense")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("训练你的交易直觉")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top)
                    
                    // 统计信息
                    StatsView(
                        totalAttempts: session.totalAttempts,
                        correctPredictions: session.correctPredictions,
                        currentStreak: session.currentStreak,
                        maxStreak: session.maxStreak
                    )
                    .padding(.horizontal)
                    
                    // 事件卡片
                    EventCard(event: session.currentEvent)
                        .padding(.horizontal)
                    
                    if !session.showResult {
                        // 预测按钮网格
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
                    } else if let userPrediction = session.userPrediction {
                        // 结果展示
                        ResultView(
                            event: session.currentEvent,
                            userPrediction: userPrediction,
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

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}