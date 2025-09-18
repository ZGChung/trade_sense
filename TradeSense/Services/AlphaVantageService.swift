import Foundation

class AlphaVantageService {
    static let shared = AlphaVantageService()

    private let apiKey = "YOUR_API_KEY_HERE" // Get free key from https://www.alphavantage.co/support/#api-key
    private let baseURL = "https://www.alphavantage.co/query"

    private let databaseService = DatabaseService.shared

    private init() {}

    func fetchCompanyNews(symbol: String, completion: @escaping (Result<[CompanyNews], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)?function=NEWS_SENTIMENT&tickers=\(symbol)&apikey=\(apiKey)") else {
            completion(.failure(NetworkError.invalidURL))
            return
        }

        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }

            do {
                let newsResponse = try JSONDecoder().decode(NewsResponse.self, from: data)
                completion(.success(newsResponse.feed))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func fetchCompanyOverview(symbol: String, completion: @escaping (Result<CompanyOverview, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)?function=OVERVIEW&symbol=\(symbol)&apikey=\(apiKey)") else {
            completion(.failure(NetworkError.invalidURL))
            return
        }

        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }

            do {
                let overview = try JSONDecoder().decode(CompanyOverview.self, from: data)
                completion(.success(overview))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    // Method to fetch and store data for a specific company
    func fetchAndStoreCompanyData(symbol: String, companyName: String? = nil) {
        // First, ensure company exists in database
        if companyName != nil {
            databaseService.addCompany(symbol: symbol, name: companyName!)
        }

        // Fetch company news
        fetchCompanyNews(symbol: symbol) { [weak self] result in
            switch result {
            case .success(let newsItems):
                self?.processNewsItems(newsItems, for: symbol)
            case .failure(let error):
                print("Error fetching news for \(symbol): \(error)")
            }
        }
    }

    private func processNewsItems(_ newsItems: [CompanyNews], for symbol: String) {
        for news in newsItems {
            // Convert Alpha Vantage news to HistoricalEvent format
            // Note: This is a simplified conversion - you may want to add more logic
            // to determine performance impact based on sentiment analysis

            let event = HistoricalEvent(
                description: news.title,
                date: formatDate(news.timePublished),
                stockSymbol: symbol,
                stockName: "", // Will be populated from companies table
                actualPerformance: calculatePerformanceFromSentiment(news.overallSentimentScore),
                daysAfterEvent: Int.random(in: 1...3) // Placeholder
            )

            databaseService.addEvent(event: event)
        }
    }

    private func formatDate(_ dateString: String) -> String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyyMMdd'T'HHmmss"

        let outputFormatter = DateFormatter()
        outputFormatter.dateFormat = "yyyy-MM-dd"

        if let date = inputFormatter.date(from: dateString) {
            return outputFormatter.string(from: date)
        }
        return dateString
    }

    private func calculatePerformanceFromSentiment(_ score: Double) -> Double {
        // Simple conversion: positive sentiment -> positive performance
        // negative sentiment -> negative performance
        // Scale: -1 to 1 sentiment -> -0.1 to 0.1 performance
        return score * 0.1
    }
}

// MARK: - Data Models

struct NewsResponse: Codable {
    let feed: [CompanyNews]
}

struct CompanyNews: Codable {
    let title: String
    let url: String
    let timePublished: String
    let authors: [String]?
    let summary: String?
    let bannerImage: String?
    let source: String
    let categoryWithinSource: String?
    let overallSentimentScore: Double
    let overallSentimentLabel: String
    let tickerSentiment: [TickerSentiment]?

    enum CodingKeys: String, CodingKey {
        case title, url, authors, summary, source, categoryWithinSource
        case timePublished = "time_published"
        case bannerImage = "banner_image"
        case overallSentimentScore = "overall_sentiment_score"
        case overallSentimentLabel = "overall_sentiment_label"
        case tickerSentiment = "ticker_sentiment"
    }
}

struct TickerSentiment: Codable {
    let ticker: String
    let relevanceScore: String
    let tickerSentimentScore: String
    let tickerSentimentLabel: String

    enum CodingKeys: String, CodingKey {
        case ticker
        case relevanceScore = "relevance_score"
        case tickerSentimentScore = "ticker_sentiment_score"
        case tickerSentimentLabel = "ticker_sentiment_label"
    }
}

struct CompanyOverview: Codable {
    let symbol: String
    let name: String
    let description: String?
    let exchange: String?
    let currency: String?
    let country: String?
    let sector: String?
    let industry: String?

    enum CodingKeys: String, CodingKey {
        case symbol = "Symbol"
        case name = "Name"
        case description = "Description"
        case exchange = "Exchange"
        case currency = "Currency"
        case country = "Country"
        case sector = "Sector"
        case industry = "Industry"
    }
}

enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingError
}