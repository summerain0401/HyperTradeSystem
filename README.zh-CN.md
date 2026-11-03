# HyperTradeSystem

[English](README.md) | [简体中文](README.zh-CN.md)

面向 Hyperliquid 的交易终端原型：市场选择、图表、订单簿、仓位与订单面板，以及钱包连接界面。

**当前状态：界面与集成实验。** 行情接口包含网络失败时的模拟数据回退；下单按钮更新本地 Zustand 模拟状态，初始模拟余额为 10,000 USDC。不能据此认为真实下单流程已经完成。另有面向主网的代理授权代码，连接或签名须自行检查。

## 本地启动

需要满足 Next.js 16 要求的 Node.js 环境（20.9+）与 npm。在仓库根目录执行：

```bash
npm ci
npm run dev
```

打开 <http://localhost:3000>。生产构建和静态检查入口：

```bash
npm run lint
npm run build
npm start
```

## 实现与配置

| 部分 | 入口 |
| --- | --- |
| 页面与布局 | `src/app/`、`src/components/` |
| 行情 REST / WebSocket | `src/lib/hyperliquid-api.ts`、`src/lib/websocket.ts` |
| 模拟订单与余额 | `src/lib/store.ts` |
| 代理授权签名 | `src/lib/auth.ts` |
| 钱包提供方 | `src/components/providers.tsx` |

钱包配置中的 WalletConnect `projectId` 仍为 `YOUR_PROJECT_ID`，需要使用自己的项目 ID。仓库目前没有对应的环境变量加载配置。不要在源码中填入钱包私钥。

技术栈：Next.js、React、TypeScript、Tailwind CSS、Radix UI、Zustand、ECharts/Recharts、wagmi、viem 与 RainbowKit。

## 使用边界

行情与钱包需要联网；界面可能展示模拟数据。项目未提供独立自动化测试脚本，构建成功也不能证明交易或授权正确。本次文档整理未连接钱包、签名、下单或验证生产部署。

## 许可
当前默认分支未提供项目级许可证文件；公开可见不等于授予复用许可。第三方依赖及素材保留各自条款。
