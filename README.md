# 🚀 Libgen 镜像监控系统

一个完整的 Libgen 镜像监控和优化下载体验的解决方案，包括服务端 API、Web 监控面板和 Tampermonkey 脚本。
![Uploading libgen-comp.gif…]()

## 📁 项目结构

```
libgen-mirror-monitor/
├── api/
│   └── speedtest.js          # Vercel API 端点
├── public/
│   └── index.html           # 监控面板页面
├── vercel.json              # Vercel 部署配置
├── tampermonkey-script.js   # 用户脚本
└── README.md               # 项目说明
```

## ⚠️ Vercel 限制说明

### 免费版限制
- **Serverless Functions**: 10秒执行时间限制
- **Edge Functions**: 30秒执行时间限制 ✅ (本项目使用)
- 每月 100 次部署、100GB 流量
- 10 个并发构建

### 为什么使用 Edge Runtime
本项目使用 Vercel Edge Functions 而不是标准 Serverless Functions，原因：
- ✅ 执行时间从 10 秒提升到 30 秒
- ✅ 更快的冷启动时间
- ✅ 更接近用户的边缘节点执行

如果测速仍然超时，可以：
1. 减少镜像数量
2. 降低单个镜像的超时时间
3. 升级到 Vercel Pro 版本（60秒限制）

## 🔧 部署步骤

### 1. 准备 Vercel 项目

1. 登录 [Vercel](https://vercel.com)
2. 创建新项目或导入 GitHub 仓库
3. 将以下文件放置到项目根目录：

```bash
# 创建项目目录结构
mkdir -p api public
```

### 2. 文件配置

#### `api/speedtest.js`
复制第一个 artifact 的代码到此文件。

#### `public/index.html` 
复制第二个 artifact 的代码到此文件。

#### `vercel.json`
复制第四个 artifact 的配置到此文件。

### 3. 部署到 Vercel

```bash
# 安装 Vercel CLI (可选)
npm i -g vercel

# 部署项目
vercel --prod
```

或者直接在 Vercel Dashboard 中连接 GitHub 仓库自动部署。

### 4. 获取 API 地址

部署成功后，你会得到类似这样的地址：
```
https://your-project-name.vercel.app
```

API 端点为：
```
https://your-project-name.vercel.app/api/speedtest
```

## 🔧 Tampermonkey 脚本配置

### 1. 安装脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 复制第三个 artifact 的脚本代码
3. 修改脚本中的 API 地址：

```javascript
// 将这行：
const API_BASE = 'https://your-vercel-app.vercel.app/api/speedtest';

// 改为你的实际 API 地址：
const API_BASE = 'https://your-project-name.vercel.app/api/speedtest';
```

4. 同时更新 `@connect` 指令：

```javascript
// @connect your-project-name.vercel.app
```

### 2. 脚本功能

- ✅ **悬浮菜单**：在所有网页显示，可拖拽、磁吸边缘
- ✅ **智能测速**：服务端定时测速，客户端获取结果
- ✅ **页面增强**：在 Annas Archive 页面显示最佳下载链接
- ✅ **悬停提示**：鼠标悬停 5 秒显示测速信息
- ✅ **管理面板**：点击悬浮按钮打开镜像管理界面

## 🌐 监控面板使用

访问你的 Vercel 应用主页即可看到监控面板：
```
https://your-project-name.vercel.app
```

### 功能特性

- 📊 **实时监控**：显示所有镜像的在线状态和延迟
- 🔄 **自动刷新**：每 5 分钟自动测速更新
- 💾 **数据缓存**：避免频繁请求，提升性能
- 📈 **可视化界面**：类似 SLUM 的美观监控面板
- 🛠️ **管理功能**：支持添加/删除镜像（需扩展后端 API）

## 🔧 自定义配置

### 修改镜像列表

在 `api/speedtest.js` 中修改 `defaultMirrors` 数组：

```javascript
const defaultMirrors = [
  'http://libgen.rs/',
  'http://libgen.st/', 
  'http://libgen.is/',
  // 添加更多镜像...
];
```

### 修改可信域名

```javascript
const trustedDomains = ['libgen.st', 'libgen.rs', 'libgen.is'];
```

### 调整缓存时间

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟，可调整
```

## 📡 API 端点说明

### GET `/api/speedtest`

获取完整测速结果：

```bash
curl https://your-project-name.vercel.app/api/speedtest
```

### GET `/api/speedtest?format=simple`

获取简化结果（仅最佳镜像）：

```bash
curl https://your-project-name.vercel.app/api/speedtest?format=simple
```

### GET `/api/speedtest?force=true`

强制重新测速：

```bash
curl https://your-project-name.vercel.app/api/speedtest?force=true
```

## 🐛 故障排除

## 🐛 故障排除

### 1. API 请求超时
如果遇到函数执行超时：
```javascript
// 方案1：减少单个镜像超时时间
const testMirror = async (url) => {
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒
  // ...
};

// 方案2：减少测试的镜像数量
const defaultMirrors = [
  'http://libgen.rs/',
  'http://libgen.st/', 
  'http://libgen.is/',
  // 暂时注释掉一些镜像
  // 'http://93.174.95.27/',
];

// 方案3：分批测试
const batchTest = async (mirrors) => {
  const batchSize = 3;
  const results = [];
  for (let i = 0; i < mirrors.length; i += batchSize) {
    const batch = mirrors.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(testMirror));
    results.push(...batchResults);
  }
  return results;
};
```

### 2. API 请求失败

### 2. API 请求失败

- 检查 Vercel 部署状态
- 确认 API 地址是否正确
- 查看浏览器开发者工具的网络请求

### 3. CORS 错误

- 确保 `vercel.json` 中的 CORS 配置正确
- 检查 Tampermonkey 脚本的 `@connect` 设置

### 4. 测速缓慢

- 服务端测速有 2-4 秒超时限制
- 可在 `api/speedtest.js` 中调整超时时间
- 考虑减少测试的镜像数量

### 5. 页面增强不生效

- 确认访问的是 `https://zh.annas-archive.org/md5/*` 页面
- 检查控制台是否有 JavaScript 错误
- 确认 API 返回了有效的镜像数据

## 🚀 进阶功能

### 添加数据库存储

可以集成 Vercel KV 或其他数据库来持久化存储测速历史：

```javascript
// 示例：使用 Vercel KV
import { kv } from '@vercel/kv';

async function storeSpeedTestResult(data) {
  await kv.set('latest-speedtest', data);
  await kv.lpush('speedtest-history', data);
}
```

### 添加通知功能

可以集成邮件或 Webhook 通知，当镜像状态变化时发送提醒。

### 定时任务

可以使用 Vercel Cron Jobs 或外部服务定时触发测速：

```javascript
// vercel.json 中添加
{
  "crons": [{
    "path": "/api/speedtest?force=true",
    "schedule": "*/5 * * * *"
  }]
}
```

## 📝 更新日志

- **v4.0**: 架构重构，服务端测速，API 化设计
- **v3.0**: 悬浮菜单、拖拽功能、页面增强
- **v2.0**: 基础测速功能和缓存机制
- **v1.0**: 初始版本

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

MIT License
