import Foundation

// MARK: - DeepSeek API Models
struct DeepSeekRequest: Codable {
    let model: String
    let messages: [DeepSeekMessage]
    let temperature: Double
    let max_tokens: Int
    let stream: Bool
}

struct DeepSeekMessage: Codable {
    let role: String
    let content: String
}

struct DeepSeekResponse: Codable {
    let choices: [DeepSeekChoice]
}

struct DeepSeekChoice: Codable {
    let message: DeepSeekMessage
}

// MARK: - DeepSeek Service
class DeepSeekService: ObservableObject {
    static let shared = DeepSeekService()
    
    // 🔑 在这里填入你的DeepSeek API Key
    private let apiKey = "YOUR_DEEPSEEK_API_KEY_HERE"
    
    private let apiURL = "https://api.deepseek.com/chat/completions"
    private let model = "deepseek-chat"
    
    private init() {}
    
    func explainPredictionResult(
        events: [HistoricalEvent],
        stockName: String,
        correctAnswer: PredictionOption,
        userPrediction: PredictionOption,
        actualPerformance: Double
    ) async throws -> String {
        
        // 检查API Key是否已配置
        guard apiKey != "YOUR_DEEPSEEK_API_KEY_HERE" else {
            throw DeepSeekError.missingAPIKey
        }
        
        // 构建事件描述
        let eventsDescription = events.enumerated().map { index, event in
            "事件\(index + 1): \(event.description) (日期: \(event.date))"
        }.joined(separator: "\n")
        
        // 构建提示词
        let prompt = """
        作为一位资深的股票分析师，请分析以下情况：
        
        股票：\(stockName)
        
        相关事件：
        \(eventsDescription)
        
        实际表现：\(String(format: "%.2f%%", actualPerformance * 100))
        正确答案：\(correctAnswer.rawValue)
        用户预测：\(userPrediction.rawValue)
        
        请简洁地解释为什么股票会有这样的表现，重点分析：
        1. 这些事件对股价的影响机制
        2. 市场反应的逻辑
        3. 如果用户预测错误，简要说明可能的原因
        
        请用中文回答，控制在150字以内。
        """
        
        let request = DeepSeekRequest(
            model: model,
            messages: [
                DeepSeekMessage(role: "user", content: prompt)
            ],
            temperature: 0.7,
            max_tokens: 300,
            stream: false
        )
        
        return try await performRequest(request)
    }
    
    private func performRequest(_ request: DeepSeekRequest) async throws -> String {
        guard let url = URL(string: apiURL) else {
            throw DeepSeekError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw DeepSeekError.encodingError(error)
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw DeepSeekError.invalidResponse
            }
            
            guard httpResponse.statusCode == 200 else {
                throw DeepSeekError.httpError(httpResponse.statusCode)
            }
            
            let decodedResponse = try JSONDecoder().decode(DeepSeekResponse.self, from: data)
            
            guard let firstChoice = decodedResponse.choices.first else {
                throw DeepSeekError.noResponse
            }
            
            return firstChoice.message.content
            
        } catch let error as DeepSeekError {
            throw error
        } catch {
            throw DeepSeekError.networkError(error)
        }
    }
}

// MARK: - DeepSeek Errors
enum DeepSeekError: LocalizedError {
    case missingAPIKey
    case invalidURL
    case encodingError(Error)
    case networkError(Error)
    case invalidResponse
    case httpError(Int)
    case noResponse
    
    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "请在DeepSeekService.swift中配置你的API Key"
        case .invalidURL:
            return "无效的API URL"
        case .encodingError(let error):
            return "请求编码错误: \(error.localizedDescription)"
        case .networkError(let error):
            return "网络错误: \(error.localizedDescription)"
        case .invalidResponse:
            return "无效的响应"
        case .httpError(let statusCode):
            return "HTTP错误: \(statusCode)"
        case .noResponse:
            return "没有收到AI响应"
        }
    }
}
