import Foundation

class TradingSession: ObservableObject {
    @Published var currentEventGroup: EventGroup
    @Published var currentEventIndex: Int = 0
    @Published var userPrediction: PredictionOption?
    @Published var showResult: Bool = false
    @Published var totalAttempts: Int = 0
    @Published var correctPredictions: Int = 0
    @Published var currentStreak: Int = 0
    @Published var maxStreak: Int = 0

    private let dataService = DataMigrationService.shared

    init() {
        // Initialize database with mock data if empty
        dataService.initializeWithMockData()
        self.currentEventGroup = dataService.getRandomEventGroup() ?? MockData.shared.getRandomEventGroup()
    }
    
    var currentEvent: HistoricalEvent {
        return currentEventGroup.events[currentEventIndex]
    }
    
    var allEventsInGroup: [HistoricalEvent] {
        return currentEventGroup.events
    }
    
    var hasMoreEventsInGroup: Bool {
        return currentEventIndex < currentEventGroup.events.count - 1
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
        
        // 使用最后一个事件的结果作为整个事件组的最终结果
        let finalEvent = currentEventGroup.events.last!
        let isCorrect = prediction == finalEvent.performanceCategory
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
        // 每次都获取新的事件组，因为用户对整个组进行一次判断
        currentEventGroup = dataService.getRandomEventGroup() ?? MockData.shared.getRandomEventGroup()
        currentEventIndex = 0
        userPrediction = nil
        showResult = false
    }

    func resetSession() {
        totalAttempts = 0
        correctPredictions = 0
        currentStreak = 0
        maxStreak = 0
        currentEventGroup = dataService.getRandomEventGroup() ?? MockData.shared.getRandomEventGroup()
        currentEventIndex = 0
        userPrediction = nil
        showResult = false
    }
}