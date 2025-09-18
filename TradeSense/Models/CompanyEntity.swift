import Foundation
import CoreData

@objc(CompanyEntity)
public class CompanyEntity: NSManagedObject {
    @NSManaged public var symbol: String?
    @NSManaged public var name: String?
}

extension CompanyEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<CompanyEntity> {
        return NSFetchRequest<CompanyEntity>(entityName: "CompanyEntity")
    }
}