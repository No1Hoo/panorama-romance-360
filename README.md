# 心动环绕线

一个 Vite + React + TypeScript 制作的纯前端 360 全景互动剧情 Demo。

## 功能

- Three.js 球体内贴图 360 全景查看
- 鼠标 / 触摸拖拽环视，滚轮缩放
- 8 章主线剧情
- 热点线索、选择分支、角色好感度
- 本地存档、继续游戏、章节回看
- 多结局判定

## 本地运行

```bash
npm install
npm run dev
```

## 验证

```bash
npm run lint
npm run build
```

## 部署

仓库包含 GitHub Pages Actions 工作流。推送到 `main` 后，GitHub Actions 会构建 `dist` 并发布到 GitHub Pages。
