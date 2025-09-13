# DeepSeek API 配置指南

## 🔑 **API密钥配置**

### 步骤 1：获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册/登录账户
3. 进入 API 管理页面
4. 创建新的 API Key

### 步骤 2：配置 API Key

打开文件：`TradeSense/Services/DeepSeekService.swift`

找到第 30 行：

```swift
// 🔑 在这里填入你的DeepSeek API Key
private let apiKey = "YOUR_DEEPSEEK_API_KEY_HERE"
```

将 `YOUR_DEEPSEEK_API_KEY_HERE` 替换为你的实际 API Key：

```swift
private let apiKey = "sk-xxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 步骤 3：测试集成

1. 在 Xcode 中重新构建项目
2. 运行应用
3. 完成一次预测
4. 查看 ResultView 中是否显示 AI 解释

## 🛡️ **安全注意事项**

### 生产环境建议：

1. **不要将 API Key 硬编码在代码中**
2. **使用环境变量或安全存储**
3. **定期轮换 API Key**

### 推荐的生产配置方式：

```swift
// 使用环境变量（推荐）
private let apiKey: String = {
    if let key = ProcessInfo.processInfo.environment["DEEPSEEK_API_KEY"] {
        return key
    }
    return "YOUR_DEEPSEEK_API_KEY_HERE" // 开发环境回退
}()
```

或者使用 Keychain 存储：

```swift
// 使用 Keychain（更安全）
private let apiKey: String = {
    // 从 Keychain 读取 API Key 的代码
    return KeychainHelper.getAPIKey() ?? "YOUR_DEEPSEEK_API_KEY_HERE"
}()
```

## 📋 **API 使用说明**

### 功能特性：

- ✅ **自动解释预测结果**：基于历史事件分析股价表现
- ✅ **错误处理**：网络错误、API 错误的优雅处理
- ✅ **加载状态**：显示 AI 分析进度
- ✅ **解耦设计**：独立的服务模块，便于维护

### API 调用流程：

1. 用户完成预测
2. 自动调用 DeepSeek API
3. 发送事件描述、预测结果、实际表现
4. 接收 AI 分析解释
5. 在 ResultView 中展示

### 自定义提示词：

可以在 `DeepSeekService.swift` 中的 `explainPredictionResult` 方法中修改提示词，以调整 AI 分析的风格和内容。

## 🔧 **故障排除**

### 常见问题：

1. **API Key 未配置**
   - 错误信息：`请在DeepSeekService.swift中配置你的API Key`
   - 解决方案：按照步骤 2 配置正确的 API Key

2. **网络连接问题**
   - 错误信息：`网络错误: xxx`
   - 解决方案：检查网络连接，确保能访问 DeepSeek API

3. **API 调用失败**
   - 错误信息：`HTTP错误: xxx`
   - 解决方案：检查 API Key 是否有效，账户是否有足够余额

4. **响应格式错误**
   - 错误信息：`没有收到AI响应`
   - 解决方案：检查 API 响应格式是否正确

### 调试建议：

1. 在模拟器中测试，查看控制台输出
2. 检查 API Key 格式是否正确
3. 确认 DeepSeek API 服务状态

## 📞 **技术支持**

如果遇到问题，可以：

1. 查看 DeepSeek 官方文档
2. 检查项目的 git 提交历史
3. 在 Xcode 中查看详细错误信息

---

**注意**：请确保妥善保管你的 API Key，不要在公开代码库中暴露！
