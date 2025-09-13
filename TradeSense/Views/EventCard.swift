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
                
            }
                // 所有事件列表
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(Array(eventGroup.events.enumerated()), id: \.offset) { index, event in
                        EventRow(
                            event: event,
                            isCurrentEvent: false, // 不再高亮任何事件
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
        HStack(alignment: .top, spacing: 16) {
            // 事件编号
            Text("\(eventNumber)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
                .background(Color.blue)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.description)
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                
                Text("日期: \(event.date)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct EventCard_Previews: PreviewProvider {
    static var previews: some View {
        EventCard(eventGroup: MockData.shared.eventGroups[0], currentIndex: 0)
            .padding()
    }
}