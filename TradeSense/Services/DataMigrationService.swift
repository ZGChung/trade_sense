import Foundation

class DataMigrationService {
    static let shared = DataMigrationService()

    private let databaseService = DatabaseService.shared
    private let alphaVantageService = AlphaVantageService.shared

    private init() {}

    func migrateMockDataToDatabase() {
        let mockData = MockData.shared

        // Add all companies from mock data
        for eventGroup in mockData.eventGroups {
            databaseService.addCompany(symbol: eventGroup.stockSymbol, name: eventGroup.stockName)
        }

        // Add all events from mock data
        for eventGroup in mockData.eventGroups {
            for event in eventGroup.events {
                databaseService.addEvent(event: event)
            }
        }

        print("Mock data migrated to database successfully")
    }

    func initializeWithMockData() {
        // Check if database is empty
        let companies = databaseService.getAllCompanies()
        if companies.isEmpty {
            migrateMockDataToDatabase()
        }
    }

    func fetchDailyData() {
        let allCompanies = databaseService.getAllCompanies()

        // Implement round-robin fetching to stay within free tier limits
        // Fetch data for 2 companies per day (25 requests/day free tier)

        let calendar = Calendar.current
        let dayOfYear = calendar.ordinality(of: .day, in: .year, for: Date()) ?? 0

        let companiesToFetch = allCompanies.count
        let dailyIndex = dayOfYear % companiesToFetch

        // Fetch data for today's companies
        let companiesForToday = Array(allCompanies[dailyIndex..<min(dailyIndex + 2, companiesToFetch)])

        for company in companiesForToday {
            alphaVantageService.fetchAndStoreCompanyData(symbol: company.symbol, companyName: company.name)
        }

        print("Fetched data for companies: \(companiesForToday.map { $0.symbol })")
    }

    func getEventGroups() -> [EventGroup] {
        return databaseService.getAllEventGroups()
    }

    func getRandomEventGroup() -> EventGroup? {
        return databaseService.getRandomEventGroup()
    }

    func getRandomEvent() -> HistoricalEvent? {
        return databaseService.getRandomEvent()
    }
}