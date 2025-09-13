import SwiftUI

struct ResultView: View {
    let eventGroup: EventGroup
    let event: HistoricalEvent
    let userPrediction: PredictionOption
    let onContinue: () -> Void
    
    @StateObject private var deepSeekService = DeepSeekService.shared
    @State private var aiExplanation: String = ""
    @State private var isLoadingExplanation = false
    @State private var explanationError: String?
    
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
        ScrollView {
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
                
                // AI解释部分
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "brain.head.profile")
                            .foregroundColor(.blue)
                        Text("AI 分析解释")
                            .font(.headline)
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    
                    if isLoadingExplanation {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("AI正在分析...")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } else if let error = explanationError {
                        Text("获取解释失败: \(error)")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(8)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(6)
                    } else if !aiExplanation.isEmpty {
                        Text(aiExplanation)
                            .font(.body)
                            .padding(12)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
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
        }
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
        .onAppear {
            loadAIExplanation()
        }
    }
    
    private func loadAIExplanation() {
        isLoadingExplanation = true
        explanationError = nil
        
        Task {
            do {
                let explanation = try await deepSeekService.explainPredictionResult(
                    events: eventGroup.events,
                    stockName: eventGroup.stockName,
                    correctAnswer: event.performanceCategory,
                    userPrediction: userPrediction,
                    actualPerformance: event.actualPerformance
                )
                
                await MainActor.run {
                    aiExplanation = explanation
                    isLoadingExplanation = false
                }
            } catch {
                await MainActor.run {
                    explanationError = error.localizedDescription
                    isLoadingExplanation = false
                }
            }
        }
    }
}

struct ResultView_Previews: PreviewProvider {
    static var previews: some View {
        ResultView(
            eventGroup: MockData.shared.eventGroups[0],
            event: MockData.shared.eventGroups[0].events[0],
            userPrediction: .rise,
            onContinue: {}
        )
        .padding()
    }
}