# 战国群雄 · Week 10 计划锚点（plan.md）

> 用途：在启动 OpenCode `/goal` 或任何长自主编辑前锁定意图，防止跑偏。
> 完整设计见 `设计文件.md`；本文件只保留本周作业所需的范围、步骤、非目标与开放问题。

## 项目范围（一句话）

把《史记》等史料做成可查询、可引证、可玩的战国历史模拟：数据库 → 地图/数值/人物 → 回合策略游戏（Web 原型 + Godot 垂直切片），本周把它变成**公开可访问、有自动化测试**的完整作品。

## 本周三步（Week 10 作业）

1. **公开部署**：Godot WebGL 导出 → Cloudflare Pages（gzip 预压缩绕过 25 MiB 限制）+ GitHub Pages 镜像。
2. **三层自动化测试**：
   - 静态/编译门槛：Godot 4.7.2 无头导入 + 17 个 `tests/test_*.gd` 自检脚本（见 `AGENTS.md`）。
   - 单元/集成：`tests/` 已覆盖地图、内政、外交、战斗、战术、结局。
   - E2E：Playwright 对线上 URL 做冒烟测试（0 控制台错误、关键资源 200、canvas 出现）。
3. **真人反馈 → 回归测试**：把链接发给两位朋友，记录 `docs/user-feedback.md`，修 ≥2 个问题并把每个修复写成永久测试。

## 非目标（本周不做）

- 不改战斗公式与历史数值（内容冻结，只修 bug 与可用性）。
- 不移植完整内政/外交到 Godot（垂直切片保持现状）。
- 不做多人与存档云同步。

## 三个开放问题（待讨论 / 待朋友反馈回答）

1. Web 端中文若显示为方块（缺字体），优先级是修字体还是先修玩法反馈？
2. 第一次进入游戏的 5 分钟内，新玩家能否不靠说明文档打完第一场战斗？
3. 「历史知识可兑现」在公开版里最有说服力的展示点选哪个：兵种克制提示、勤王对话，还是战报逐项结算？

## 检查命令（锚点）

```bash
# 静态门槛 + 回归（Godot 无头）
"E:\508fp\_tools\godot-4.7.2\godot\Godot_v4.7.2-stable_win64_console.exe" --headless --path zhanguo-godot --script res://tests/test_warfare.gd
# E2E（部署后的线上 URL）
cd zhanguo-godot/e2e && npx playwright test
```
