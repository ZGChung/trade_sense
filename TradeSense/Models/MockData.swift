import Foundation

class MockData {
    static let shared = MockData()
    
    let historicalEvents: [HistoricalEvent] = [
        HistoricalEvent(
            description: "美联储宣布降息50个基点",
            date: "2020-03-03",
            stockSymbol: "SPY",
            stockName: "标普500ETF",
            actualPerformance: 0.052,
            daysAfterEvent: 5
        ),
        HistoricalEvent(
            description: "苹果公司财报超预期，iPhone销量创新高",
            date: "2021-01-27",
            stockSymbol: "AAPL",
            stockName: "苹果公司",
            actualPerformance: 0.018,
            daysAfterEvent: 3
        ),
        HistoricalEvent(
            description: "特斯拉季度交付量不及预期",
            date: "2022-04-02",
            stockSymbol: "TSLA",
            stockName: "特斯拉",
            actualPerformance: -0.032,
            daysAfterEvent: 2
        ),
        HistoricalEvent(
            description: "亚马逊宣布1:20拆股计划",
            date: "2022-03-09",
            stockSymbol: "AMZN",
            stockName: "亚马逊",
            actualPerformance: 0.008,
            daysAfterEvent: 1
        ),
        HistoricalEvent(
            description: "微软云计算业务收入增长放缓",
            date: "2022-07-26",
            stockSymbol: "MSFT",
            stockName: "微软",
            actualPerformance: -0.025,
            daysAfterEvent: 1
        ),
        HistoricalEvent(
            description: "谷歌AI技术突破，发布新一代对话模型",
            date: "2023-02-06",
            stockSymbol: "GOOGL",
            stockName: "谷歌",
            actualPerformance: 0.045,
            daysAfterEvent: 2
        ),
        HistoricalEvent(
            description: "Meta元宇宙部门亏损超预期",
            date: "2022-10-26",
            stockSymbol: "META",
            stockName: "Meta",
            actualPerformance: -0.248,
            daysAfterEvent: 1
        ),
        HistoricalEvent(
            description: "英伟达数据中心收入翻倍增长",
            date: "2023-05-24",
            stockSymbol: "NVDA",
            stockName: "英伟达",
            actualPerformance: 0.283,
            daysAfterEvent: 1
        ),
        HistoricalEvent(
            description: " Netflix用户增长不及预期",
            date: "2022-01-20",
            stockSymbol: "NFLX",
            stockName: "Netflix",
            actualPerformance: -0.215,
            daysAfterEvent: 1
        ),
        HistoricalEvent(
            description: "比亚迪季度新能源汽车销量创新高",
            date: "2023-04-27",
            stockSymbol: "002594.SZ",
            stockName: "比亚迪",
            actualPerformance: 0.086,
            daysAfterEvent: 3
        ),
        HistoricalEvent(
            description: "茅台提价20%，高端白酒需求旺盛",
            date: "2023-10-31",
            stockSymbol: "600519.SH",
            stockName: "贵州茅台",
            actualPerformance: 0.095,
            daysAfterEvent: 2
        ),
        HistoricalEvent(
            description: "腾讯游戏业务收入首次下滑",
            date: "2022-05-18",
            stockSymbol: "00700.HK",
            stockName: "腾讯控股",
            actualPerformance: -0.067,
            daysAfterEvent: 1
        )
    ]
    
    func getRandomEvent() -> HistoricalEvent {
        return historicalEvents.randomElement() ?? historicalEvents[0]
    }
}