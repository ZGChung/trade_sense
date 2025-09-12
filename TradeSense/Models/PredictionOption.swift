import Foundation

enum PredictionOption: String, CaseIterable {
    case bigRise = "大涨"      // +2% or more
    case smallRise = "小涨"    // +1% to +2%
    case unchanged = "不变"     // -1% to +1%
    case smallFall = "小跌"    // -1% to -2%
    case bigFall = "大跌"      // -2% or less
    
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