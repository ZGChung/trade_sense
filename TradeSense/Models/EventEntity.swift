import Foundation
import CoreData

@objc(EventEntity)
public class EventEntity: NSManagedObject {
    @NSManaged public var id: String?
    @NSManaged public var symbol: String?
    @NSManaged public var eventDescription: String?
    @NSManaged public var date: String?
    @NSManaged public var performance: Double
    @NSManaged public var daysAfterEvent: Int32
}

extension EventEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<EventEntity> {
        return NSFetchRequest<EventEntity>(entityName: "EventEntity")
    }
}