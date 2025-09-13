import Foundation

struct APIConfig {
    static let shared = APIConfig()
    
    private init() {}
    
    var deepSeekAPIKey: String {
        // 首先尝试从配置文件读取
        if let key = loadAPIKeyFromConfig() {
            return key
        }
        
        // 如果配置文件不存在，返回占位符并提供指导
        print("⚠️ API Key 未配置！请按照以下步骤配置：")
        print("1. 复制 Config/config.example.plist 为 Config/config.plist")
        print("2. 在 config.plist 中填入你的 DeepSeek API Key")
        print("3. config.plist 已自动加入 .gitignore，不会被提交到仓库")
        
        return "YOUR_DEEPSEEK_API_KEY_HERE"
    }
    
    private func loadAPIKeyFromConfig() -> String? {
        guard let path = Bundle.main.path(forResource: "config", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: path),
              let apiKey = plist["DeepSeekAPIKey"] as? String,
              !apiKey.isEmpty && apiKey != "YOUR_DEEPSEEK_API_KEY_HERE" else {
            return nil
        }
        return apiKey
    }
}
