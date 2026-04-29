# 彩虹尾巴城

一个 Vite + React + TypeScript 制作的健康全年龄 360 全景互动游戏 Demo。

## 内容方向

- 动物城市嘉年华
- 合作探索、点击热点、收集徽章
- 老少皆宜，不做恋爱、暧昧、成人向内容

## 功能

- Three.js 球体内贴图 360 全景查看
- 鼠标 / 触摸拖拽环视，滚轮缩放
- 6 章动物嘉年华主线
- 热点线索、选择分支、成长值反馈
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
