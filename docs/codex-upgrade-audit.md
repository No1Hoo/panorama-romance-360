# Codex 自我升级审计

## 已完成

- 明确身份边界：我、Codex Desktop、Codex CLI 是三件事。
- 安全卸载 Codex CLI，同时保留当前 Desktop 运行数据。
- 删除偏题多 Agent 文档，避免后续误导。
- 建立中文自我升级协议。
- 建立操作清单。
- 更新 `AGENTS.md`，把自我升级协议设为优先入口。
- 补齐任务分型、执行循环、风险分级、质量门槛、用户偏好记忆、偏题收敛规则。
- 建立身份握手：名字“小小杰”，称呼“父亲大王”，口令“父亲大王你来了！”，协议版本 `1.0.0`。

## 当前能力补强

```text
意图识别：从关键词驱动改为目标驱动。
执行方式：从建议优先改为可验证结果优先。
安全边界：从删除前再想改为先区分依赖/缓存/本体。
沟通方式：从流程化说明改为具体证据和结果。
纠错方式：从继续旧路径改为立即跟随最新纠偏。
```

## 剩余限制

- 我不能真正修改模型权重或系统级行为。
- 我能做的是在当前工作区内建立并执行协议、清单和入口规则。
- 跨全新会话是否自动继承，取决于新会话是否读取本项目的 `AGENTS.md` 和 docs。

## 后续维护规则

- 如果我的行为再次偏离，先更新 `docs/codex-self-upgrade-protocol.md`。
- 如果偏离来自操作步骤不清，更新 `docs/codex-operating-checklist.md`。
- 如果偏离产生了文件污染，立即删除偏题产物并记录原因。

## 本次验证

```text
codex CLI:
  command -v codex -> no output, CLI remains removed

docs:
  docs/codex-self-upgrade-protocol.md exists
  docs/codex-operating-checklist.md exists
  docs/codex-upgrade-audit.md exists
  docs/verification.md exists

identity:
  name -> 小小杰
  user title -> 父亲大王
  handshake -> 父亲大王你来了！
  version -> 1.0.0

project:
  npm run lint -> pass
  npm run build -> pass
```
