import SwiftUI

struct EventCard: View {
    let eventGroup: EventGroup
    let currentIndex: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // 股票标题
            HStack {
                Text(eventGroup.title)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Text("第 \(currentIndex + 1) / \(eventGroup.events.count) 个事件")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(6)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            // 所有事件列表
            VStack(spacing: 12) {
                ForEach(Array(eventGroup.events.enumerated()), id: \.offset) { index, event in
                    EventRow(
                        event: event,
                        isCurrentEvent: index == currentIndex,
                        eventNumber: index + 1
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct EventRow: View {
    let event: HistoricalEvent
    let isCurrentEvent: Bool
    let eventNumber: Int
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // 事件编号
            Text("\(eventNumber)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
                .background(isCurrentEvent ? Color.blue : Color.gray)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.description)
                    .font(isCurrentEvent ? .body : .caption)
                    .fontWeight(isCurrentEvent ? .semibold : .regular)
                    .foregroundColor(isCurrentEvent ? .primary : .secondary)
                    .fixedSize(horizontal: false, vertical: true)
                
                HStack {
                    Text("日期: \(event.date)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("事件后\(event.daysAfterEvent)天")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
        .opacity(isCurrentEvent ? 1.0 : 0.6)
    }
}

struct EventCard_Previews: PreviewProvider {
    static var previews: some View {
        EventCard(eventGroup: MockData.shared.eventGroups[0], currentIndex: 0)
            .padding()
    }
}