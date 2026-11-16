# AGENTS.md

这是 `508fp`（战国群雄期末项目）工作区的 agent 规则。

## 静态 / 编译门槛（改完任何代码先跑）

```bash
# Godot 无头回归（17 个自检脚本，全部必须 PASS）
"E:\508fp\_tools\godot-4.7.2\godot\Godot_v4.7.2-stable_win64_console.exe" --headless --path zhanguo-godot --script res://tests/<脚本名>.gd
```

一键方式：`cmd /c zhanguo-godot\run_tests.bat "E:\508fp\_tools\godot-4.7.2\godot\Godot_v4.7.2-stable_win64_console.exe"`
（注意：bat 内部引号在带空格路径下有 bug，建议逐脚本直接调用。）

## 测试分层

1. **静态门槛（<1s/项）**：上述 Godot 无头脚本（`tests/test_*.gd`，覆盖地图/内政/外交/战斗/战术/结局）。
2. **单元 / 集成**：同一批脚本即集成测试；Web 版数据一致性可对照 `data/*.json`。
3. **E2E（部署后）**：`cd zhanguo-godot/e2e && npx playwright test`（0 控制台错误、关键资源 200、canvas 出现）。

## 部署

- Cloudflare：`cd zhanguo-godot && cmd /c "npx wrangler pages deploy dist --project-name=zhanguo-qunxiong"`
  - dist 里的 `index.wasm` / `index.pck` 已预 gzip 原地压缩（文件名不变），配套 `_headers` 声明 Content-Encoding: gzip —— **重新导出后必须重新 gzip**。
- GitHub Pages 镜像：`deploy-gh/` 内为未压缩原文件，推到 `gh-pages` 分支。

## 规则

- `sources/`（史料 txt）与各 `*.db` 只读，不就地编辑；清洗结果进 JSON/CSV 导出物。
- `dist/`、`deploy-gh/`、`.godot/`、`_tools/` 不提交（见 .gitignore；deploy-gh 通过独立 gh-pages 仓库推送）。
- 关键历史数值改动必须保留「证 / 推断 / 设」出处标签。
- 长自主任务前先读 `docs/plan.md` 的非目标清单。
