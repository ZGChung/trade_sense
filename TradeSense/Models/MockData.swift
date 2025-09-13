import Foundation

class MockData {
    static let shared = MockData()
    
    // 按股票分组的事件数据
    let eventGroups: [EventGroup] = [
        // 苹果公司 - 3个事件
        EventGroup(
            stockSymbol: "AAPL",
            stockName: "苹果公司",
            events: [
                HistoricalEvent(
                    description: "苹果公司财报超预期，iPhone销量创新高",
                    date: "2021-01-27",
                    stockSymbol: "AAPL",
                    stockName: "苹果公司",
                    actualPerformance: 0.018,
                    daysAfterEvent: 3
                ),
                HistoricalEvent(
                    description: "苹果发布iPhone 15系列，创新功能受市场欢迎",
                    date: "2023-09-12",
                    stockSymbol: "AAPL",
                    stockName: "苹果公司",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "苹果服务业务收入增长超预期，App Store表现强劲",
                    date: "2023-11-02",
                    stockSymbol: "AAPL",
                    stockName: "苹果公司",
                    actualPerformance: 0.025,
                    daysAfterEvent: 1
                )
            ]
        ),
        
        // 特斯拉 - 3个事件
        EventGroup(
            stockSymbol: "TSLA",
            stockName: "特斯拉",
            events: [
                HistoricalEvent(
                    description: "特斯拉季度交付量不及预期",
                    date: "2022-04-02",
                    stockSymbol: "TSLA",
                    stockName: "特斯拉",
                    actualPerformance: -0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "特斯拉在中国工厂产能大幅提升",
                    date: "2023-01-15",
                    stockSymbol: "TSLA",
                    stockName: "特斯拉",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "马斯克宣布特斯拉大幅降价策略",
                    date: "2023-01-13",
                    stockSymbol: "TSLA",
                    stockName: "特斯拉",
                    actualPerformance: -0.028,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 英伟达 - 3个事件
        EventGroup(
            stockSymbol: "NVDA",
            stockName: "英伟达",
            events: [
                HistoricalEvent(
                    description: "英伟达数据中心收入翻倍增长",
                    date: "2023-05-24",
                    stockSymbol: "NVDA",
                    stockName: "英伟达",
                    actualPerformance: 0.283,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "英伟达发布新一代AI芯片，性能大幅提升",
                    date: "2023-08-22",
                    stockSymbol: "NVDA",
                    stockName: "英伟达",
                    actualPerformance: 0.195,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "美国对华芯片出口限制政策收紧",
                    date: "2022-10-07",
                    stockSymbol: "NVDA",
                    stockName: "英伟达",
                    actualPerformance: -0.089,
                    daysAfterEvent: 1
                )
            ]
        ),
        
        // 腾讯控股 - 3个事件
        EventGroup(
            stockSymbol: "00700.HK",
            stockName: "腾讯控股",
            events: [
                HistoricalEvent(
                    description: "腾讯游戏业务收入首次下滑",
                    date: "2022-05-18",
                    stockSymbol: "00700.HK",
                    stockName: "腾讯控股",
                    actualPerformance: -0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "腾讯获得游戏版号，多款新游戏获批",
                    date: "2023-04-11",
                    stockSymbol: "00700.HK",
                    stockName: "腾讯控股",
                    actualPerformance: 0.085,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "腾讯微信用户数突破13亿，广告收入增长",
                    date: "2023-08-16",
                    stockSymbol: "00700.HK",
                    stockName: "腾讯控股",
                    actualPerformance: 0.042,
                    daysAfterEvent: 3
                )
            ]
        )
    ]
    
    // 保持向后兼容
    let historicalEvents: [HistoricalEvent] = []
    
    func getRandomEventGroup() -> EventGroup {
        return eventGroups.randomElement() ?? eventGroups[0]
    }
    
    func getRandomEvent() -> HistoricalEvent {
        let group = getRandomEventGroup()
        return group.events.randomElement() ?? group.events[0]
    }
}