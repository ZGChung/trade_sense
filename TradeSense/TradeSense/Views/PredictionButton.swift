import SwiftUI

struct PredictionButton: View {
    let option: PredictionOption
    let isSelected: Bool
    let action: () -> Void
    
    var backgroundColor: Color {
        if isSelected {
            switch option {
            case .bigRise, .smallRise: return .green.opacity(0.3)
            case .unchanged: return .gray.opacity(0.3)
            case .smallFall, .bigFall: return .red.opacity(0.3)
            }
        }
        return Color(.systemGray6)
    }
    
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(option.emoji)
                    .font(.title2)
                Text(option.rawValue)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity, minHeight: 80)
            .background(backgroundColor)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? (option == .bigRise || option == .smallRise ? Color.green : 
                          option == .unchanged ? Color.gray : Color.red) : Color.clear, lineWidth: 2)
            )
        }
    }
}

struct PredictionButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            PredictionButton(option: .bigRise, isSelected: true, action: {})
            PredictionButton(option: .smallRise, isSelected: false, action: {})
            PredictionButton(option: .unchanged, isSelected: false, action: {})
        }
        .padding()
    }
}