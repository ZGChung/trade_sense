import SwiftUI

struct PredictionButton: View {
    let option: PredictionOption
    let isSelected: Bool
    let action: () -> Void
    
    var backgroundColor: Color {
        if isSelected {
            switch option {
            case .rise: return .green.opacity(0.3)
            case .flat: return .gray.opacity(0.3)
            case .fall: return .red.opacity(0.3)
            }
        }
        return Color(.systemGray6)
    }
    
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Spacer()
                
                Text(option.emoji)
                    .font(.title)
                
                Text(option.rawValue)
                    .font(.title3)
                    .fontWeight(.semibold)
                
                Spacer()
            }
            .frame(maxWidth: .infinity, minHeight: 60)
            .padding(.horizontal, 20)
            .background(backgroundColor)
            .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isSelected ? (option == .rise ? Color.green :
                              option == .flat ? Color.gray : Color.red) : Color.clear, lineWidth: 2)
                )
        }
    }
}

struct PredictionButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            PredictionButton(option: .rise, isSelected: true, action: {})
            PredictionButton(option: .flat, isSelected: false, action: {})
            PredictionButton(option: .fall, isSelected: false, action: {})
        }
        .padding()
    }
}