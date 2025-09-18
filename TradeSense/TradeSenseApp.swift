import SwiftUI

@main
struct TradeSenseApp: App {
    init() {
        // Initialize database with mock data on app startup
        DataMigrationService.shared.initializeWithMockData()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}