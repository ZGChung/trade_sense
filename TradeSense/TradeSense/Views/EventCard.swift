import SwiftUI

struct EventCard: View {
    let event: HistoricalEvent
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("历史事件")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text(event.description)
                .font(.title3)
                .fontWeight(.semibold)
                .fixedSize(horizontal: false, vertical: true)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("\(event.stockName) (\(event.stockSymbol))")
                        .font(.subheadline)
                    Text("日期: \(event.date)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text("事件后\(event.daysAfterEvent)天")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(6)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct EventCard_Previews: PreviewProvider {
    static var previews: some View {
        EventCard(event: MockData.shared.historicalEvents[0])
            .padding()
    }
}