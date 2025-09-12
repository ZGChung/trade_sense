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

struct ResultView_Previews: PreviewProvider {
    static var previews: some View {
        ResultView(
            event: MockData.shared.historicalEvents[0],
            userPrediction: .bigRise,
            onContinue: {}
        )
        .padding()
    }
}