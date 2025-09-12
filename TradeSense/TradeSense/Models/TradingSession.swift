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