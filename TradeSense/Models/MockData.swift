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
        ),
        
        // 微软 - 3个事件
        EventGroup(
            stockSymbol: "MSFT",
            stockName: "微软",
            events: [
                HistoricalEvent(
                    description: "微软Azure云业务收入增长超预期",
                    date: "2023-01-24",
                    stockSymbol: "MSFT",
                    stockName: "微软",
                    actualPerformance: 0.045,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "微软宣布收购动视暴雪获得监管批准",
                    date: "2023-10-13",
                    stockSymbol: "MSFT",
                    stockName: "微软",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "Windows 11更新导致兼容性问题",
                    date: "2022-02-08",
                    stockSymbol: "MSFT",
                    stockName: "微软",
                    actualPerformance: -0.028,
                    daysAfterEvent: 1
                )
            ]
        ),
        
        // 亚马逊 - 3个事件
        EventGroup(
            stockSymbol: "AMZN",
            stockName: "亚马逊",
            events: [
                HistoricalEvent(
                    description: "亚马逊Prime Day销售额创历史新高",
                    date: "2023-07-11",
                    stockSymbol: "AMZN",
                    stockName: "亚马逊",
                    actualPerformance: 0.067,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "AWS云服务出现大规模中断",
                    date: "2021-12-07",
                    stockSymbol: "AMZN",
                    stockName: "亚马逊",
                    actualPerformance: -0.039,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "亚马逊宣布裁员1.8万人",
                    date: "2023-01-04",
                    stockSymbol: "AMZN",
                    stockName: "亚马逊",
                    actualPerformance: -0.052,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 谷歌 - 3个事件
        EventGroup(
            stockSymbol: "GOOGL",
            stockName: "谷歌",
            events: [
                HistoricalEvent(
                    description: "谷歌AI模型Bard演示出现错误",
                    date: "2023-02-08",
                    stockSymbol: "GOOGL",
                    stockName: "谷歌",
                    actualPerformance: -0.076,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "谷歌搜索广告收入强劲增长",
                    date: "2023-04-25",
                    stockSymbol: "GOOGL",
                    stockName: "谷歌",
                    actualPerformance: 0.058,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "谷歌宣布大规模回购股票计划",
                    date: "2023-07-25",
                    stockSymbol: "GOOGL",
                    stockName: "谷歌",
                    actualPerformance: 0.042,
                    daysAfterEvent: 1
                )
            ]
        ),
        
        // Meta - 3个事件
        EventGroup(
            stockSymbol: "META",
            stockName: "Meta",
            events: [
                HistoricalEvent(
                    description: "Meta元宇宙业务亏损超预期",
                    date: "2022-10-26",
                    stockSymbol: "META",
                    stockName: "Meta",
                    actualPerformance: -0.243,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "Meta宣布"效率之年"大规模裁员",
                    date: "2022-11-09",
                    stockSymbol: "META",
                    stockName: "Meta",
                    actualPerformance: 0.102,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "Threads应用发布5天用户破亿",
                    date: "2023-07-10",
                    stockSymbol: "META",
                    stockName: "Meta",
                    actualPerformance: 0.087,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 阿里巴巴 - 3个事件
        EventGroup(
            stockSymbol: "BABA",
            stockName: "阿里巴巴",
            events: [
                HistoricalEvent(
                    description: "阿里巴巴组织架构重大调整",
                    date: "2023-03-28",
                    stockSymbol: "BABA",
                    stockName: "阿里巴巴",
                    actualPerformance: 0.143,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "蚂蚁集团上市被叫停",
                    date: "2020-11-03",
                    stockSymbol: "BABA",
                    stockName: "阿里巴巴",
                    actualPerformance: -0.083,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "阿里云分拆上市计划暂停",
                    date: "2023-11-16",
                    stockSymbol: "BABA",
                    stockName: "阿里巴巴",
                    actualPerformance: -0.096,
                    daysAfterEvent: 1
                )
            ]
        ),
        
        // 台积电 - 3个事件
        EventGroup(
            stockSymbol: "TSM",
            stockName: "台积电",
            events: [
                HistoricalEvent(
                    description: "台积电获得苹果3nm芯片大单",
                    date: "2023-08-24",
                    stockSymbol: "TSM",
                    stockName: "台积电",
                    actualPerformance: 0.098,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "美国芯片法案影响台积电海外扩张",
                    date: "2022-08-09",
                    stockSymbol: "TSM",
                    stockName: "台积电",
                    actualPerformance: -0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "台积电季度营收创历史新高",
                    date: "2023-10-19",
                    stockSymbol: "TSM",
                    stockName: "台积电",
                    actualPerformance: 0.045,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 贵州茅台 - 3个事件
        EventGroup(
            stockSymbol: "600519.SS",
            stockName: "贵州茅台",
            events: [
                HistoricalEvent(
                    description: "茅台提价20%，终端价格预期上涨",
                    date: "2023-10-31",
                    stockSymbol: "600519.SS",
                    stockName: "贵州茅台",
                    actualPerformance: 0.095,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "茅台冰淇淋上市引发市场关注",
                    date: "2022-05-19",
                    stockSymbol: "600519.SS",
                    stockName: "贵州茅台",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "反腐调查影响茅台经销商体系",
                    date: "2022-07-15",
                    stockSymbol: "600519.SS",
                    stockName: "贵州茅台",
                    actualPerformance: -0.078,
                    daysAfterEvent: 1
                )
            ]
        ),
        
        // 美团 - 3个事件
        EventGroup(
            stockSymbol: "03690.HK",
            stockName: "美团",
            events: [
                HistoricalEvent(
                    description: "美团外卖市占率进一步提升",
                    date: "2023-05-25",
                    stockSymbol: "03690.HK",
                    stockName: "美团",
                    actualPerformance: 0.067,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "监管部门要求美团降低佣金费率",
                    date: "2021-04-26",
                    stockSymbol: "03690.HK",
                    stockName: "美团",
                    actualPerformance: -0.145,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "美团优选业务战略性收缩",
                    date: "2022-03-25",
                    stockSymbol: "03690.HK",
                    stockName: "美团",
                    actualPerformance: -0.089,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 京东 - 3个事件
        EventGroup(
            stockSymbol: "JD",
            stockName: "京东",
            events: [
                HistoricalEvent(
                    description: "京东物流上市首日破发",
                    date: "2021-05-28",
                    stockSymbol: "JD",
                    stockName: "京东",
                    actualPerformance: -0.056,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "京东618大促GMV创新高",
                    date: "2023-06-19",
                    stockSymbol: "JD",
                    stockName: "京东",
                    actualPerformance: 0.078,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "京东宣布百亿补贴计划",
                    date: "2023-03-06",
                    stockSymbol: "JD",
                    stockName: "京东",
                    actualPerformance: 0.045,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 拼多多 - 3个事件
        EventGroup(
            stockSymbol: "PDD",
            stockName: "拼多多",
            events: [
                HistoricalEvent(
                    description: "拼多多海外业务Temu增长迅猛",
                    date: "2023-08-29",
                    stockSymbol: "PDD",
                    stockName: "拼多多",
                    actualPerformance: 0.187,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "拼多多因虚假宣传被监管部门处罚",
                    date: "2021-03-15",
                    stockSymbol: "PDD",
                    stockName: "拼多多",
                    actualPerformance: -0.092,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "拼多多年度活跃用户突破9亿",
                    date: "2023-05-26",
                    stockSymbol: "PDD",
                    stockName: "拼多多",
                    actualPerformance: 0.134,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 比亚迪 - 3个事件
        EventGroup(
            stockSymbol: "002594.SZ",
            stockName: "比亚迪",
            events: [
                HistoricalEvent(
                    description: "比亚迪新能源汽车销量全球第一",
                    date: "2023-04-03",
                    stockSymbol: "002594.SZ",
                    stockName: "比亚迪",
                    actualPerformance: 0.089,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "巴菲特减持比亚迪股份",
                    date: "2022-08-30",
                    stockSymbol: "002594.SZ",
                    stockName: "比亚迪",
                    actualPerformance: -0.076,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "比亚迪刀片电池技术获得突破",
                    date: "2023-06-08",
                    stockSymbol: "002594.SZ",
                    stockName: "比亚迪",
                    actualPerformance: 0.057,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 宁德时代 - 3个事件
        EventGroup(
            stockSymbol: "300750.SZ",
            stockName: "宁德时代",
            events: [
                HistoricalEvent(
                    description: "宁德时代与福特合作建设美国工厂",
                    date: "2023-02-13",
                    stockSymbol: "300750.SZ",
                    stockName: "宁德时代",
                    actualPerformance: 0.045,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "碳酸锂价格下跌影响宁德时代利润率",
                    date: "2023-04-20",
                    stockSymbol: "300750.SZ",
                    stockName: "宁德时代",
                    actualPerformance: -0.067,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "宁德时代钠离子电池量产",
                    date: "2023-07-14",
                    stockSymbol: "300750.SZ",
                    stockName: "宁德时代",
                    actualPerformance: 0.032,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 摩根大通 - 3个事件
        EventGroup(
            stockSymbol: "JPM",
            stockName: "摩根大通",
            events: [
                HistoricalEvent(
                    description: "摩根大通收购第一共和银行",
                    date: "2023-05-01",
                    stockSymbol: "JPM",
                    stockName: "摩根大通",
                    actualPerformance: 0.023,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "美联储加息推动银行净息差扩大",
                    date: "2022-06-15",
                    stockSymbol: "JPM",
                    stockName: "摩根大通",
                    actualPerformance: 0.045,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "摩根大通因交易失误亏损20亿美元",
                    date: "2022-05-10",
                    stockSymbol: "JPM",
                    stockName: "摩根大通",
                    actualPerformance: -0.087,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 伯克希尔哈撒韦 - 3个事件
        EventGroup(
            stockSymbol: "BRK.B",
            stockName: "伯克希尔哈撒韦",
            events: [
                HistoricalEvent(
                    description: "巴菲特年度致股东信发布",
                    date: "2023-02-25",
                    stockSymbol: "BRK.B",
                    stockName: "伯克希尔哈撒韦",
                    actualPerformance: 0.018,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "伯克希尔巨额投资西方石油公司",
                    date: "2022-03-04",
                    stockSymbol: "BRK.B",
                    stockName: "伯克希尔哈撒韦",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "伯克希尔季度营业利润创新高",
                    date: "2023-08-05",
                    stockSymbol: "BRK.B",
                    stockName: "伯克希尔哈撒韦",
                    actualPerformance: 0.026,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 联合健康 - 3个事件
        EventGroup(
            stockSymbol: "UNH",
            stockName: "联合健康",
            events: [
                HistoricalEvent(
                    description: "联合健康收购Change Healthcare",
                    date: "2022-10-03",
                    stockSymbol: "UNH",
                    stockName: "联合健康",
                    actualPerformance: -0.034,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "医保政策改革利好医疗保险公司",
                    date: "2023-01-12",
                    stockSymbol: "UNH",
                    stockName: "联合健康",
                    actualPerformance: 0.056,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "联合健康季度营收超预期",
                    date: "2023-04-14",
                    stockSymbol: "UNH",
                    stockName: "联合健康",
                    actualPerformance: 0.042,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 强生 - 3个事件
        EventGroup(
            stockSymbol: "JNJ",
            stockName: "强生",
            events: [
                HistoricalEvent(
                    description: "强生分拆消费者健康业务Kenvue",
                    date: "2023-05-04",
                    stockSymbol: "JNJ",
                    stockName: "强生",
                    actualPerformance: 0.037,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "强生因滑石粉产品面临巨额赔偿",
                    date: "2021-10-08",
                    stockSymbol: "JNJ",
                    stockName: "强生",
                    actualPerformance: -0.023,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "强生新冠疫苗获得紧急使用授权",
                    date: "2021-02-27",
                    stockSymbol: "JNJ",
                    stockName: "强生",
                    actualPerformance: 0.045,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 沃尔玛 - 3个事件
        EventGroup(
            stockSymbol: "WMT",
            stockName: "沃尔玛",
            events: [
                HistoricalEvent(
                    description: "沃尔玛季度同店销售增长超预期",
                    date: "2023-05-18",
                    stockSymbol: "WMT",
                    stockName: "沃尔玛",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "沃尔玛投资无人机配送服务",
                    date: "2022-06-07",
                    stockSymbol: "WMT",
                    stockName: "沃尔玛",
                    actualPerformance: 0.021,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "通胀压力影响沃尔玛利润率",
                    date: "2022-02-17",
                    stockSymbol: "WMT",
                    stockName: "沃尔玛",
                    actualPerformance: -0.112,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 宝洁 - 3个事件
        EventGroup(
            stockSymbol: "PG",
            stockName: "宝洁",
            events: [
                HistoricalEvent(
                    description: "宝洁宣布涨价应对成本上升",
                    date: "2022-04-20",
                    stockSymbol: "PG",
                    stockName: "宝洁",
                    actualPerformance: -0.034,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "宝洁季度盈利超预期",
                    date: "2023-07-28",
                    stockSymbol: "PG",
                    stockName: "宝洁",
                    actualPerformance: 0.048,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "宝洁创新产品推动市场份额增长",
                    date: "2023-10-20",
                    stockSymbol: "PG",
                    stockName: "宝洁",
                    actualPerformance: 0.029,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 可口可乐 - 3个事件
        EventGroup(
            stockSymbol: "KO",
            stockName: "可口可乐",
            events: [
                HistoricalEvent(
                    description: "可口可乐收购BodyArmor增强运动饮料业务",
                    date: "2021-11-01",
                    stockSymbol: "KO",
                    stockName: "可口可乐",
                    actualPerformance: 0.032,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "可口可乐因塑料污染面临诉讼",
                    date: "2022-07-21",
                    stockSymbol: "KO",
                    stockName: "可口可乐",
                    actualPerformance: -0.019,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "可口可乐全球涨价推动营收增长",
                    date: "2023-02-10",
                    stockSymbol: "KO",
                    stockName: "可口可乐",
                    actualPerformance: 0.041,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 迪士尼 - 3个事件
        EventGroup(
            stockSymbol: "DIS",
            stockName: "迪士尼",
            events: [
                HistoricalEvent(
                    description: "迪士尼+流媒体用户增长超预期",
                    date: "2023-02-08",
                    stockSymbol: "DIS",
                    stockName: "迪士尼",
                    actualPerformance: 0.056,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "迪士尼与佛罗里达州政府发生冲突",
                    date: "2022-04-21",
                    stockSymbol: "DIS",
                    stockName: "迪士尼",
                    actualPerformance: -0.043,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "迪士尼乐园门票涨价引发争议",
                    date: "2023-10-11",
                    stockSymbol: "DIS",
                    stockName: "迪士尼",
                    actualPerformance: -0.028,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // Netflix - 3个事件
        EventGroup(
            stockSymbol: "NFLX",
            stockName: "Netflix",
            events: [
                HistoricalEvent(
                    description: "Netflix宣布打击密码共享政策",
                    date: "2023-05-23",
                    stockSymbol: "NFLX",
                    stockName: "Netflix",
                    actualPerformance: 0.092,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "Netflix用户增长首次出现下滑",
                    date: "2022-01-20",
                    stockSymbol: "NFLX",
                    stockName: "Netflix",
                    actualPerformance: -0.215,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "Netflix推出广告支持套餐",
                    date: "2022-11-03",
                    stockSymbol: "NFLX",
                    stockName: "Netflix",
                    actualPerformance: 0.085,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 埃克森美孚 - 3个事件
        EventGroup(
            stockSymbol: "XOM",
            stockName: "埃克森美孚",
            events: [
                HistoricalEvent(
                    description: "俄乌冲突推动油价飙升",
                    date: "2022-03-08",
                    stockSymbol: "XOM",
                    stockName: "埃克森美孚",
                    actualPerformance: 0.078,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "埃克森美孚季度利润创历史纪录",
                    date: "2022-07-29",
                    stockSymbol: "XOM",
                    stockName: "埃克森美孚",
                    actualPerformance: 0.045,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "气候变化诉讼影响石油公司",
                    date: "2021-05-26",
                    stockSymbol: "XOM",
                    stockName: "埃克森美孚",
                    actualPerformance: -0.032,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 雪佛龙 - 3个事件
        EventGroup(
            stockSymbol: "CVX",
            stockName: "雪佛龙",
            events: [
                HistoricalEvent(
                    description: "雪佛龙收购赫斯公司",
                    date: "2023-10-23",
                    stockSymbol: "CVX",
                    stockName: "雪佛龙",
                    actualPerformance: 0.018,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "雪佛龙宣布提高股息和股票回购",
                    date: "2023-01-31",
                    stockSymbol: "CVX",
                    stockName: "雪佛龙",
                    actualPerformance: 0.042,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "加州起诉雪佛龙环境污染",
                    date: "2021-09-17",
                    stockSymbol: "CVX",
                    stockName: "雪佛龙",
                    actualPerformance: -0.026,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 家得宝 - 3个事件
        EventGroup(
            stockSymbol: "HD",
            stockName: "家得宝",
            events: [
                HistoricalEvent(
                    description: "房地产市场火热推动家得宝业绩",
                    date: "2021-08-17",
                    stockSymbol: "HD",
                    stockName: "家得宝",
                    actualPerformance: 0.051,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "家得宝因数据泄露面临集体诉讼",
                    date: "2022-11-08",
                    stockSymbol: "HD",
                    stockName: "家得宝",
                    actualPerformance: -0.034,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "家得宝投资供应链数字化",
                    date: "2023-03-22",
                    stockSymbol: "HD",
                    stockName: "家得宝",
                    actualPerformance: 0.023,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 麦当劳 - 3个事件
        EventGroup(
            stockSymbol: "MCD",
            stockName: "麦当劳",
            events: [
                HistoricalEvent(
                    description: "麦当劳全球同店销售增长强劲",
                    date: "2023-07-27",
                    stockSymbol: "MCD",
                    stockName: "麦当劳",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "麦当劳因俄罗斯业务退出损失",
                    date: "2022-03-11",
                    stockSymbol: "MCD",
                    stockName: "麦当劳",
                    actualPerformance: -0.019,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "麦当劳推出成人开心乐园餐",
                    date: "2022-10-03",
                    stockSymbol: "MCD",
                    stockName: "麦当劳",
                    actualPerformance: 0.031,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 星巴克 - 3个事件
        EventGroup(
            stockSymbol: "SBUX",
            stockName: "星巴克",
            events: [
                HistoricalEvent(
                    description: "星巴克中国业务复苏超预期",
                    date: "2023-05-02",
                    stockSymbol: "SBUX",
                    stockName: "星巴克",
                    actualPerformance: 0.096,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "星巴克员工工会化运动扩大",
                    date: "2022-03-16",
                    stockSymbol: "SBUX",
                    stockName: "星巴克",
                    actualPerformance: -0.042,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "星巴克推出橄榄油咖啡新品",
                    date: "2023-02-22",
                    stockSymbol: "SBUX",
                    stockName: "星巴克",
                    actualPerformance: 0.015,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 耐克 - 3个事件
        EventGroup(
            stockSymbol: "NKE",
            stockName: "耐克",
            events: [
                HistoricalEvent(
                    description: "耐克库存过剩问题严重",
                    date: "2022-09-29",
                    stockSymbol: "NKE",
                    stockName: "耐克",
                    actualPerformance: -0.127,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "耐克与梅西合作推出新系列",
                    date: "2023-06-15",
                    stockSymbol: "NKE",
                    stockName: "耐克",
                    actualPerformance: 0.045,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "耐克数字化销售占比突破50%",
                    date: "2023-03-21",
                    stockSymbol: "NKE",
                    stockName: "耐克",
                    actualPerformance: 0.038,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 英特尔 - 3个事件
        EventGroup(
            stockSymbol: "INTC",
            stockName: "英特尔",
            events: [
                HistoricalEvent(
                    description: "英特尔获得美国政府芯片补贴",
                    date: "2023-09-21",
                    stockSymbol: "INTC",
                    stockName: "英特尔",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "英特尔季度亏损创纪录",
                    date: "2023-01-26",
                    stockSymbol: "INTC",
                    stockName: "英特尔",
                    actualPerformance: -0.065,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "英特尔宣布IDM 2.0战略转型",
                    date: "2021-03-23",
                    stockSymbol: "INTC",
                    stockName: "英特尔",
                    actualPerformance: 0.052,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // AMD - 3个事件
        EventGroup(
            stockSymbol: "AMD",
            stockName: "AMD",
            events: [
                HistoricalEvent(
                    description: "AMD服务器市场份额持续提升",
                    date: "2023-08-01",
                    stockSymbol: "AMD",
                    stockName: "AMD",
                    actualPerformance: 0.089,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "AMD收购赛灵思获得最终批准",
                    date: "2022-02-14",
                    stockSymbol: "AMD",
                    stockName: "AMD",
                    actualPerformance: 0.045,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "PC市场下滑影响AMD业绩",
                    date: "2022-10-06",
                    stockSymbol: "AMD",
                    stockName: "AMD",
                    actualPerformance: -0.139,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 赛富时 - 3个事件
        EventGroup(
            stockSymbol: "CRM",
            stockName: "赛富时",
            events: [
                HistoricalEvent(
                    description: "赛富时收购Slack获得最终批准",
                    date: "2021-07-21",
                    stockSymbol: "CRM",
                    stockName: "赛富时",
                    actualPerformance: 0.027,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "赛富时宣布首次派发股息",
                    date: "2023-08-30",
                    stockSymbol: "CRM",
                    stockName: "赛富时",
                    actualPerformance: 0.063,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "企业软件支出放缓影响赛富时增长",
                    date: "2022-11-30",
                    stockSymbol: "CRM",
                    stockName: "赛富时",
                    actualPerformance: -0.087,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 甲骨文 - 3个事件
        EventGroup(
            stockSymbol: "ORCL",
            stockName: "甲骨文",
            events: [
                HistoricalEvent(
                    description: "甲骨文云基础设施业务增长加速",
                    date: "2023-09-11",
                    stockSymbol: "ORCL",
                    stockName: "甲骨文",
                    actualPerformance: 0.095,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "甲骨文收购Cerner获得监管批准",
                    date: "2022-06-01",
                    stockSymbol: "ORCL",
                    stockName: "甲骨文",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "甲骨文因Java版权诉讼败诉",
                    date: "2021-03-23",
                    stockSymbol: "ORCL",
                    stockName: "甲骨文",
                    actualPerformance: -0.045,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // IBM - 3个事件
        EventGroup(
            stockSymbol: "IBM",
            stockName: "IBM",
            events: [
                HistoricalEvent(
                    description: "IBM分拆Kyndryl独立上市",
                    date: "2021-11-03",
                    stockSymbol: "IBM",
                    stockName: "IBM",
                    actualPerformance: 0.076,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "IBM量子计算业务获得突破",
                    date: "2023-06-14",
                    stockSymbol: "IBM",
                    stockName: "IBM",
                    actualPerformance: 0.041,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "IBM传统硬件业务持续下滑",
                    date: "2022-02-15",
                    stockSymbol: "IBM",
                    stockName: "IBM",
                    actualPerformance: -0.029,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 思科 - 3个事件
        EventGroup(
            stockSymbol: "CSCO",
            stockName: "思科",
            events: [
                HistoricalEvent(
                    description: "思科网络安全业务增长强劲",
                    date: "2023-05-17",
                    stockSymbol: "CSCO",
                    stockName: "思科",
                    actualPerformance: 0.052,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "思科因供应链问题下调业绩指引",
                    date: "2022-02-16",
                    stockSymbol: "CSCO",
                    stockName: "思科",
                    actualPerformance: -0.134,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "思科宣布大规模股票回购计划",
                    date: "2023-11-15",
                    stockSymbol: "CSCO",
                    stockName: "思科",
                    actualPerformance: 0.028,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 高通 - 3个事件
        EventGroup(
            stockSymbol: "QCOM",
            stockName: "高通",
            events: [
                HistoricalEvent(
                    description: "高通与苹果达成芯片供应协议",
                    date: "2023-09-11",
                    stockSymbol: "QCOM",
                    stockName: "高通",
                    actualPerformance: 0.124,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "智能手机需求疲软影响高通业绩",
                    date: "2022-11-02",
                    stockSymbol: "QCOM",
                    stockName: "高通",
                    actualPerformance: -0.078,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "高通汽车芯片业务获得重大订单",
                    date: "2023-03-22",
                    stockSymbol: "QCOM",
                    stockName: "高通",
                    actualPerformance: 0.067,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 博通 - 3个事件
        EventGroup(
            stockSymbol: "AVGO",
            stockName: "博通",
            events: [
                HistoricalEvent(
                    description: "博通收购VMware获得中国批准",
                    date: "2023-11-21",
                    stockSymbol: "AVGO",
                    stockName: "博通",
                    actualPerformance: 0.045,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "博通因反垄断审查暂停收购",
                    date: "2022-07-08",
                    stockSymbol: "AVGO",
                    stockName: "博通",
                    actualPerformance: -0.056,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "博通AI芯片需求强劲增长",
                    date: "2023-08-31",
                    stockSymbol: "AVGO",
                    stockName: "博通",
                    actualPerformance: 0.089,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 艾司摩尔 - 3个事件
        EventGroup(
            stockSymbol: "ASML",
            stockName: "艾司摩尔",
            events: [
                HistoricalEvent(
                    description: "艾司摩尔EUV光刻机需求持续旺盛",
                    date: "2023-07-19",
                    stockSymbol: "ASML",
                    stockName: "艾司摩尔",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "荷兰政府限制先进光刻机出口",
                    date: "2023-06-30",
                    stockSymbol: "ASML",
                    stockName: "艾司摩尔",
                    actualPerformance: -0.092,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "艾司摩尔季度订单创历史新高",
                    date: "2023-10-18",
                    stockSymbol: "ASML",
                    stockName: "艾司摩尔",
                    actualPerformance: 0.078,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 德州仪器 - 3个事件
        EventGroup(
            stockSymbol: "TXN",
            stockName: "德州仪器",
            events: [
                HistoricalEvent(
                    description: "德州仪器宣布新建芯片工厂",
                    date: "2023-02-15",
                    stockSymbol: "TXN",
                    stockName: "德州仪器",
                    actualPerformance: 0.043,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "工业芯片需求疲软影响业绩",
                    date: "2022-10-25",
                    stockSymbol: "TXN",
                    stockName: "德州仪器",
                    actualPerformance: -0.067,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "德州仪器汽车芯片业务增长强劲",
                    date: "2023-05-03",
                    stockSymbol: "TXN",
                    stockName: "德州仪器",
                    actualPerformance: 0.035,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 美光科技 - 3个事件
        EventGroup(
            stockSymbol: "MU",
            stockName: "美光科技",
            events: [
                HistoricalEvent(
                    description: "存储芯片价格反弹推动美光业绩",
                    date: "2023-09-27",
                    stockSymbol: "MU",
                    stockName: "美光科技",
                    actualPerformance: 0.145,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "美光因中国市场限制面临挑战",
                    date: "2023-05-21",
                    stockSymbol: "MU",
                    stockName: "美光科技",
                    actualPerformance: -0.087,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "美光宣布巨额投资新建芯片厂",
                    date: "2022-10-04",
                    stockSymbol: "MU",
                    stockName: "美光科技",
                    actualPerformance: 0.062,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 应用材料 - 3个事件
        EventGroup(
            stockSymbol: "AMAT",
            stockName: "应用材料",
            events: [
                HistoricalEvent(
                    description: "应用材料获得芯片法案补贴",
                    date: "2023-08-09",
                    stockSymbol: "AMAT",
                    stockName: "应用材料",
                    actualPerformance: 0.078,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "半导体设备需求周期性下滑",
                    date: "2022-11-16",
                    stockSymbol: "AMAT",
                    stockName: "应用材料",
                    actualPerformance: -0.054,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "应用材料AI芯片设备订单大增",
                    date: "2023-06-28",
                    stockSymbol: "AMAT",
                    stockName: "应用材料",
                    actualPerformance: 0.096,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 辉瑞 - 3个事件
        EventGroup(
            stockSymbol: "PFE",
            stockName: "辉瑞",
            events: [
                HistoricalEvent(
                    description: "辉瑞新冠疫苗获得紧急使用授权",
                    date: "2020-12-11",
                    stockSymbol: "PFE",
                    stockName: "辉瑞",
                    actualPerformance: 0.045,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "辉瑞新冠口服药疗效显著",
                    date: "2021-11-05",
                    stockSymbol: "PFE",
                    stockName: "辉瑞",
                    actualPerformance: 0.078,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "新冠产品需求下降影响辉瑞业绩",
                    date: "2023-05-02",
                    stockSymbol: "PFE",
                    stockName: "辉瑞",
                    actualPerformance: -0.034,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 默克 - 3个事件
        EventGroup(
            stockSymbol: "MRK",
            stockName: "默克",
            events: [
                HistoricalEvent(
                    description: "默克Keytruda癌症药物销售超预期",
                    date: "2023-07-27",
                    stockSymbol: "MRK",
                    stockName: "默克",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "默克收购Prometheus Biosciences",
                    date: "2023-04-16",
                    stockSymbol: "MRK",
                    stockName: "默克",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "默克因药品定价面临诉讼",
                    date: "2022-09-14",
                    stockSymbol: "MRK",
                    stockName: "默克",
                    actualPerformance: -0.023,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 礼来 - 3个事件
        EventGroup(
            stockSymbol: "LLY",
            stockName: "礼来",
            events: [
                HistoricalEvent(
                    description: "礼来减肥药Mounjaro销售火爆",
                    date: "2023-08-08",
                    stockSymbol: "LLY",
                    stockName: "礼来",
                    actualPerformance: 0.149,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "礼来阿尔茨海默病药物获得突破",
                    date: "2023-05-03",
                    stockSymbol: "LLY",
                    stockName: "礼来",
                    actualPerformance: 0.067,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "礼来因胰岛素定价被调查",
                    date: "2022-03-17",
                    stockSymbol: "LLY",
                    stockName: "礼来",
                    actualPerformance: -0.045,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 艾伯维 - 3个事件
        EventGroup(
            stockSymbol: "ABBV",
            stockName: "艾伯维",
            events: [
                HistoricalEvent(
                    description: "艾伯维修美乐专利到期影响",
                    date: "2023-01-01",
                    stockSymbol: "ABBV",
                    stockName: "艾伯维",
                    actualPerformance: -0.056,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "艾伯维偏头痛新药获得批准",
                    date: "2023-09-28",
                    stockSymbol: "ABBV",
                    stockName: "艾伯维",
                    actualPerformance: 0.042,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "艾伯维完成对Allergan收购",
                    date: "2020-05-08",
                    stockSymbol: "ABBV",
                    stockName: "艾伯维",
                    actualPerformance: 0.035,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 诺华 - 3个事件
        EventGroup(
            stockSymbol: "NVS",
            stockName: "诺华",
            events: [
                HistoricalEvent(
                    description: "诺华分拆山德士独立上市",
                    date: "2023-10-04",
                    stockSymbol: "NVS",
                    stockName: "诺华",
                    actualPerformance: 0.028,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "诺华基因疗法获得重大突破",
                    date: "2023-06-22",
                    stockSymbol: "NVS",
                    stockName: "诺华",
                    actualPerformance: 0.045,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "诺华因数据造假被罚款",
                    date: "2022-03-23",
                    stockSymbol: "NVS",
                    stockName: "诺华",
                    actualPerformance: -0.032,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 罗氏 - 3个事件
        EventGroup(
            stockSymbol: "RHHBY",
            stockName: "罗氏",
            events: [
                HistoricalEvent(
                    description: "罗氏新冠检测需求大幅增长",
                    date: "2021-01-15",
                    stockSymbol: "RHHBY",
                    stockName: "罗氏",
                    actualPerformance: 0.067,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "罗氏阿尔茨海默病药物试验失败",
                    date: "2022-06-15",
                    stockSymbol: "RHHBY",
                    stockName: "罗氏",
                    actualPerformance: -0.089,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "罗氏血液检测业务获得FDA批准",
                    date: "2023-03-17",
                    stockSymbol: "RHHBY",
                    stockName: "罗氏",
                    actualPerformance: 0.034,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 诺和诺德 - 3个事件
        EventGroup(
            stockSymbol: "NVO",
            stockName: "诺和诺德",
            events: [
                HistoricalEvent(
                    description: "诺和诺德减肥药Wegovy需求爆棚",
                    date: "2023-08-10",
                    stockSymbol: "NVO",
                    stockName: "诺和诺德",
                    actualPerformance: 0.178,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "诺和诺德因药品短缺被调查",
                    date: "2023-02-23",
                    stockSymbol: "NVO",
                    stockName: "诺和诺德",
                    actualPerformance: -0.045,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "诺和诺德口服减肥药获得突破",
                    date: "2023-06-26",
                    stockSymbol: "NVO",
                    stockName: "诺和诺德",
                    actualPerformance: 0.096,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 阿斯利康 - 3个事件
        EventGroup(
            stockSymbol: "AZN",
            stockName: "阿斯利康",
            events: [
                HistoricalEvent(
                    description: "阿斯利康新冠疫苗获得欧盟批准",
                    date: "2021-01-29",
                    stockSymbol: "AZN",
                    stockName: "阿斯利康",
                    actualPerformance: 0.045,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "阿斯利康收购Alexion Pharmaceuticals",
                    date: "2021-07-21",
                    stockSymbol: "AZN",
                    stockName: "阿斯利康",
                    actualPerformance: 0.032,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "阿斯利康因疫苗副作用面临诉讼",
                    date: "2021-03-15",
                    stockSymbol: "AZN",
                    stockName: "阿斯利康",
                    actualPerformance: -0.067,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 赛诺菲 - 3个事件
        EventGroup(
            stockSymbol: "SNY",
            stockName: "赛诺菲",
            events: [
                HistoricalEvent(
                    description: "赛诺菲Dupixent销售超预期",
                    date: "2023-07-27",
                    stockSymbol: "SNY",
                    stockName: "赛诺菲",
                    actualPerformance: 0.056,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "赛诺菲因糖尿病药物被调查",
                    date: "2022-11-08",
                    stockSymbol: "SNY",
                    stockName: "赛诺菲",
                    actualPerformance: -0.034,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "赛诺菲mRNA疫苗合作取得进展",
                    date: "2023-03-22",
                    stockSymbol: "SNY",
                    stockName: "赛诺菲",
                    actualPerformance: 0.028,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 吉利德科学 - 3个事件
        EventGroup(
            stockSymbol: "GILD",
            stockName: "吉利德科学",
            events: [
                HistoricalEvent(
                    description: "吉利德HIV新药获得FDA批准",
                    date: "2023-07-12",
                    stockSymbol: "GILD",
                    stockName: "吉利德科学",
                    actualPerformance: 0.045,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "吉利德癌症药物试验结果不及预期",
                    date: "2022-08-22",
                    stockSymbol: "GILD",
                    stockName: "吉利德科学",
                    actualPerformance: -0.078,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "吉利德与默克合作开发HIV药物",
                    date: "2023-01-25",
                    stockSymbol: "GILD",
                    stockName: "吉利德科学",
                    actualPerformance: 0.032,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 再生元 - 3个事件
        EventGroup(
            stockSymbol: "REGN",
            stockName: "再生元",
            events: [
                HistoricalEvent(
                    description: "再生元新冠抗体疗法需求旺盛",
                    date: "2021-01-29",
                    stockSymbol: "REGN",
                    stockName: "再生元",
                    actualPerformance: 0.089,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "再生元眼科药物Eylea销售强劲",
                    date: "2023-08-03",
                    stockSymbol: "REGN",
                    stockName: "再生元",
                    actualPerformance: 0.056,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "再生元因定价策略被调查",
                    date: "2022-05-17",
                    stockSymbol: "REGN",
                    stockName: "再生元",
                    actualPerformance: -0.042,
                    daysAfterEvent: 3
                )
            ]
        ),
        
        // 莫德纳 - 3个事件
        EventGroup(
            stockSymbol: "MRNA",
            stockName: "莫德纳",
            events: [
                HistoricalEvent(
                    description: "莫德纳新冠疫苗获得FDA批准",
                    date: "2020-12-18",
                    stockSymbol: "MRNA",
                    stockName: "莫德纳",
                    actualPerformance: 0.201,
                    daysAfterEvent: 1
                ),
                HistoricalEvent(
                    description: "莫德纳新冠疫苗需求下降",
                    date: "2023-02-23",
                    stockSymbol: "MRNA",
                    stockName: "莫德纳",
                    actualPerformance: -0.134,
                    daysAfterEvent: 2
                ),
                HistoricalEvent(
                    description: "莫德纳个性化癌症疫苗取得突破",
                    date: "2023-10-11",
                    stockSymbol: "MRNA",
                    stockName: "莫德纳",
                    actualPerformance: 0.078,
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