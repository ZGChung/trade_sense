import Foundation
import CoreData

class DatabaseService {
    static let shared = DatabaseService()

    private let persistentContainer: NSPersistentContainer

    private init() {
        persistentContainer = NSPersistentContainer(name: "TradeSenseData")
        persistentContainer.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Unable to load persistent stores: \(error)")
            }
        }
    }

    private var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    // MARK: - Company Operations

    func addCompany(symbol: String, name: String) {
        let company = CompanyEntity(context: context)
        company.symbol = symbol
        company.name = name

        saveContext()
    }

    func getAllCompanies() -> [Company] {
        let request: NSFetchRequest<CompanyEntity> = CompanyEntity.fetchRequest()

        do {
            let companies = try context.fetch(request)
            return companies.map { Company(symbol: $0.symbol ?? "", name: $0.name ?? "") }
        } catch {
            print("Error fetching companies: \(error)")
            return []
        }
    }

    // MARK: - Event Operations

    func addEvent(event: HistoricalEvent) {
        let eventEntity = EventEntity(context: context)
        eventEntity.id = event.id.uuidString
        eventEntity.symbol = event.stockSymbol
        eventEntity.eventDescription = event.description
        eventEntity.date = event.date
        eventEntity.performance = event.actualPerformance
        eventEntity.daysAfterEvent = Int32(event.daysAfterEvent)

        saveContext()
    }

    func getEventsForSymbol(_ symbol: String) -> [HistoricalEvent] {
        let request: NSFetchRequest<EventEntity> = EventEntity.fetchRequest()
        request.predicate = NSPredicate(format: "symbol == %@", symbol)

        do {
            let events = try context.fetch(request)
            return events.map { event in
                HistoricalEvent(
                    description: event.eventDescription ?? "",
                    date: event.date ?? "",
                    stockSymbol: event.symbol ?? "",
                    stockName: "", // Will be populated from companies
                    actualPerformance: event.performance,
                    daysAfterEvent: Int(event.daysAfterEvent)
                )
            }
        } catch {
            print("Error fetching events: \(error)")
            return []
        }
    }

    func getAllEventGroups() -> [EventGroup] {
        var eventGroups: [EventGroup] = []
        let allCompanies = getAllCompanies()

        for company in allCompanies {
            let events = getEventsForSymbol(company.symbol)
            if !events.isEmpty {
                let eventGroup = EventGroup(
                    stockSymbol: company.symbol,
                    stockName: company.name,
                    events: events
                )
                eventGroups.append(eventGroup)
            }
        }

        return eventGroups
    }

    func getRandomEventGroup() -> EventGroup? {
        let allGroups = getAllEventGroups()
        return allGroups.randomElement()
    }

    func getRandomEvent() -> HistoricalEvent? {
        guard let group = getRandomEventGroup() else { return nil }
        return group.events.randomElement()
    }

    private func saveContext() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Error saving context: \(error)")
            }
        }
    }
}

struct Company {
    let symbol: String
    let name: String
}