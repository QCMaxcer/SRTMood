# SRTMood

SRTMood 是一个本地全栈 Web 应用，使用 TypeSafe Jev 模型判断字幕中每一句的情绪，并可根据配置为字幕追加对应的 emoji。

## 功能

- 支持上传并解析 `.srt` 和 `.txt` 字幕文件。
- 使用 Jev 判断每条字幕的情绪，并支持配置上下文窗口。
- 支持自定义情绪类别、颜色、多 emoji、emoji 轮换和语义边界。
- 支持用 Jev 判断当前字幕是否适合追加 emoji。
- 支持连续同情绪字幕自动抑制重复 emoji。
- 支持逐条预览分析结果，并导出修改后的字幕文件。
- TypeSafe API Key 仅保存在服务端 `server/.env`，不会进入浏览器代码或提交到仓库。

## 环境要求

- Node.js 20 或更高版本
- TypeSafe API Key：https://console.typesafe.ai/keys

## 双击运行（推荐）

Windows 下直接双击项目根目录的 `启动 SRTMood.bat`，即可启动并自动弹出界面窗口：

- 首次运行会自动安装依赖并构建前后端，需要几分钟；之后启动只需几秒。
- 服务默认监听 `http://127.0.0.1:3001`，端口被占用时会自动顺延到下一个可用端口。
- 如果服务已在运行，再次双击只会打开一个新的界面窗口，不会重复启动。
- 界面以无地址栏的应用窗口打开；系统缺少 Edge / Chrome 时退回默认浏览器。
- 停止服务：双击 `停止 SRTMood.bat`。直接关闭界面窗口不会停止后台服务。
- 启动日志与进程号保存在 `logs/` 目录，便于排查问题。

首次使用仍需在界面左侧设置面板输入 TypeSafe API Key。

## 安装与运行

```bash
npm install
npm run dev
```

打开终端中 Vite 输出的地址，通常是：

```text
http://localhost:5173
```

首次使用时，在左侧设置面板输入 TypeSafe API Key。Key 只会保存到服务端 `server/.env`。

## 常用命令

- `npm run dev`：同时启动 Express 后端和 Vite 前端。
- `npm run build`：构建 `server/dist` 和 `client/dist`。
- `npm start`：由 Express 服务端提供构建后的前端页面。
- `npm test`：运行服务端和前端单元测试。

服务端默认只监听 `127.0.0.1`，需要通过局域网访问时可设置 `HOST` 环境变量，例如
`$env:HOST="0.0.0.0"; npm start`。

## 配置说明

每个情绪类别支持以下配置：

- 情绪名称
- 显示颜色
- 是否追加 emoji
- 多个 emoji，并支持按顺序轮换
- 定义
- 包含项
- 排除项
- 示例

这些语义边界会作为结构化 criteria 发送给 Jev，用于减少仅按字面词误判的情况。

## 开源协议

MIT
