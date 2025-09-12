import SwiftUI

struct StatsView: View {
    let totalAttempts: Int
    let correctPredictions: Int
    let currentStreak: Int
    let maxStreak: Int
    
    private var accuracy: Double {
        guard totalAttempts > 0 else { return 0 }
        return Double(correctPredictions) / Double(totalAttempts)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("训练统计")
                .font(.headline)
                .foregroundColor(.secondary)
            
            HStack(spacing: 20) {
                StatItem(
                    title: "总次数",
                    value: "\(totalAttempts)",
                    icon: "number.circle"
                )
                
                StatItem(
                    title: "准确率", 
                    value: String(format: "%.1f%%", accuracy * 100),
                    icon: "target"
                )
                
                StatItem(
                    title: "当前连胜",
                    value: "\(currentStreak)",
                    icon: "flame"
                )
                
                StatItem(
                    title: "最高连胜",
                    value: "\(maxStreak)",
                    icon: "trophy"
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.blue)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct StatsView_Previews: PreviewProvider {
    static var previews: some View {
        StatsView(
            totalAttempts: 25,
            correctPredictions: 18,
            currentStreak: 3,
            maxStreak: 7
        )
        .padding()
    }
}