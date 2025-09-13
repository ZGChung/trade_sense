import Foundation

enum PredictionOption: String, CaseIterable {
    case rise = "涨"        // positive performance
    case fall = "跌"        // negative performance  
    case flat = "平"        // no significant change
    
    var emoji: String {
        switch self {
        case .rise: return "📈"
        case .fall: return "📉"
        case .flat: return "➡️"
        }
    }
    
    var valueRange: ClosedRange<Double> {
        switch self {
        case .rise: return 0.01...Double.greatestFiniteMagnitude
        case .fall: return -Double.greatestFiniteMagnitude...(-0.01)
        case .flat: return -0.01...0.01
        }
    }
}