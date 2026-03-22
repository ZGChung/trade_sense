# 🔐 API 配置安全指南

## 🎯 **快速配置步骤**

### 步骤 1：复制配置模板

```bash
cd TradeSense/Config
cp config.example.plist config.plist
```

### 步骤 2：填入你的 DeepSeek API Key

编辑 `TradeSense/Config/config.plist` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>DeepSeekAPIKey</key>
	<string>sk-你的真实API密钥</string>
</dict>
</plist>
```

### 步骤 3：验证配置

1. 在 Xcode 中重新构建项目
2. 运行应用并完成一次预测
3. 查看是否显示 AI 解释

## 🛡️ **安全特性**

### ✅ **已实现的安全措施：**

1. **配置文件隔离**：API Key 存储在独立的 `config.plist` 文件中
2. **Git 忽略**：`config.plist` 已添加到 `.gitignore`，不会被提交到仓库
3. **模板提供**：`config.example.plist` 作为配置模板，安全地提交到仓库
4. **运行时检查**：应用启动时检查 API Key 是否正确配置
5. **错误提示**：未配置时提供清晰的配置指导

### 📁 **文件结构：**

```
TradeSense/
├── Config/
│   ├── APIConfig.swift          # 配置管理类
│   ├── config.example.plist     # 配置模板（安全，会提交）
│   └── config.plist            # 真实配置（忽略，不会提交）
├── Services/
│   └── DeepSeekService.swift    # 使用 APIConfig.shared
└── ...
```

## 🔍 **配置验证**

### 检查配置是否生效：

1. **控制台输出**：如果 API Key 未配置，控制台会显示配置指导
2. **应用行为**：预测后会显示"请按照 Config/config.example.plist 模板创建配置文件"
3. **成功标志**：预测后显示 AI 分析解释

### 常见问题排查：

```bash
# 检查 config.plist 是否存在
ls -la TradeSense/Config/config.plist

# 检查 .gitignore 是否包含配置文件
grep -n "config.plist" .gitignore

# 验证文件未被 git 跟踪
git status --ignored
```

## 🚀 **进阶配置**

### 环境变量支持（可选）：

如果需要更高的安全性，可以修改 `APIConfig.swift` 支持环境变量：

```swift
var deepSeekAPIKey: String {
    // 优先使用环境变量
    if let envKey = ProcessInfo.processInfo.environment["DEEPSEEK_API_KEY"],
       !envKey.isEmpty {
        return envKey
    }
    
    // 然后尝试配置文件
    if let key = loadAPIKeyFromConfig() {
        return key
    }
    
    // 最后显示配置指导
    // ...
}
```

### 多环境配置：

可以创建不同环境的配置文件：

```
Config/
├── config.development.plist
├── config.staging.plist
└── config.production.plist
```

## ⚠️ **重要提醒**

1. **永远不要**将真实的 API Key 提交到 git 仓库
2. **定期轮换** API Key 以提高安全性
3. **团队协作**时，每个开发者需要创建自己的 `config.plist` 文件
4. **生产部署**时，考虑使用更安全的密钥管理服务

## 📞 **获取 DeepSeek API Key**

1. 访问 [DeepSeek 平台](https://platform.deepseek.com/)
2. 注册/登录账户
3. 进入 API 管理页面
4. 创建新的 API Key
5. 复制密钥到 `config.plist` 文件中

---

**✅ 配置完成后，你的 API Key 将安全地存储在本地，不会泄露到代码仓库中！**
