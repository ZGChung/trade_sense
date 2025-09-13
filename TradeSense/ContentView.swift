import SwiftUI

struct ContentView: View {
    @StateObject private var session = TradingSession()
    @State private var showStats = true
    
    var body: some View {
        NavigationView {
            GeometryReader { geometry in
                ZStack {
                    // 主内容
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
                            .padding(.top, showStats ? 120 : 20)
                            
                            // 事件卡片
                            EventCard(eventGroup: session.currentEventGroup, currentIndex: 0)
                                .padding(.horizontal)
                            
                            if !session.showResult {
                                // 判断日期说明
                                let finalEvent = session.currentEventGroup.events.last!
                                Text("请预测 \(session.currentEventGroup.stockName) 在 \(finalEvent.date) 后\(finalEvent.daysAfterEvent)天的涨跌情况")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.primary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 16)
                                
                                // 预测按钮 - 居中垂直排列
                                VStack(spacing: 16) {
                                    ForEach(PredictionOption.allCases, id: \.self) { option in
                                        PredictionButton(
                                            option: option,
                                            isSelected: session.userPrediction == option,
                                            action: { session.makePrediction(option) }
                                        )
                                    }
                                }
                                .padding(.horizontal, 40)
                            } else if let userPrediction = session.userPrediction {
                                // 结果展示
                                ResultView(
                                    event: session.currentEventGroup.events.last!,
                                    userPrediction: userPrediction,
                                    onContinue: session.nextEvent
                                )
                                .padding(.horizontal)
                            }
                            
                            Spacer()
                        }
                    }
                    
                    // 可折叠统计面板
                    VStack {
                        // 统计面板
                        VStack(spacing: 16) {
                            // 拖拽指示器
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.gray)
                                .frame(width: 40, height: 4)
                                .padding(.top, 8)
                            
                            StatsView(
                                totalAttempts: session.totalAttempts,
                                correctPredictions: session.correctPredictions,
                                currentStreak: session.currentStreak,
                                maxStreak: session.maxStreak
                            )
                            .padding(.horizontal)
                            .padding(.bottom, 16)
                        }
                        .frame(maxWidth: .infinity)
                        .background(Color(.systemBackground))
                        .cornerRadius(16, corners: [.bottomLeft, .bottomRight])
                        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
                        .offset(y: showStats ? 0 : -200)
                        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: showStats)
                        
                        Spacer()
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        withAnimation {
                            showStats.toggle()
                        }
                    }) {
                        Image(systemName: showStats ? "chevron.up" : "chart.bar")
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("重置") {
                        session.resetSession()
                    }
                }
            }
        }
    }
}

// 扩展来支持特定角的圆角
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}