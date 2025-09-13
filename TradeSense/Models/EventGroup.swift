import Foundation

struct EventGroup: Identifiable {
    let id = UUID()
    let stockSymbol: String
    let stockName: String
    let events: [HistoricalEvent]
    
    var title: String {
        return "\(stockName) (\(stockSymbol))"
    }
}
