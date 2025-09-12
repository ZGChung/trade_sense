import Foundation

struct HistoricalEvent: Identifiable {
    let id = UUID()
    let description: String
    let date: String
    let stockSymbol: String
    let stockName: String
    let actualPerformance: Double  // 实际涨跌幅，例如 0.05 表示 +5%
    let daysAfterEvent: Int        // 事件后多少天的表现
    
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