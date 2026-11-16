# 战国群雄 · 10 分钟展示（DAIHUM Reslides）

React + Markdown 幻灯片，使用 `_tools/reslides` 的 Exhibit 主题。共 10 张，`duration: 10min` 倒计时，含 presenter notes。

## 文件

- `slides.md` — 幻灯片源文件
- `public/godot-map.png` — 87 省地图截图
- `public/godot-generals.png` — 武将浏览截图
- `dist/` — 构建后的静态站点
- `slides.pdf` — 12 页 PDF 导出（无法访问 localhost 时直接看这个）

## 运行

在 `E:\508fp` 下：

```powershell
# 开发模式（推荐；自动热更新）
node E:\508fp\_tools\reslides\packages\slidev\bin\reslides.mjs E:\508fp\presentation\slides.md --port 3030

# 浏览器打开
# 观众视图：http://localhost:3030/
# 演讲者视图：http://localhost:3030/#/presenter/
# 总览：http://localhost:3030/#/overview/
```

## 构建

```powershell
cd E:\508fp\_tools\reslides
node packages\slidev\bin\reslides.mjs build E:\508fp\presentation\slides.md
```

输出在 `E:\508fp\presentation\dist\`，可放到任意静态服务器。

## 结构

1. 封面：让历史知识当场兑现
2. 为什么不是电影
3. 纪年：前 771 年是传统锚点
4. 核心回路：识别 → 选择 → 结算 → 反馈
5. 史料与数据：数据库是钥匙清单
6. 地图：空间论证
7. 战斗：公式是史学论点的结算层
8. 教学关：六课结构
9. 边界：已实现 vs 未实现
10. 收束：知识是通关前的筹码

## 证据

- Harnes 2025, PDF p.7 / 9 / 10 / 11 / 14
- Park et al. 2023, PDF p.2 / 9 / 15 / 17–18
- Zhang 2023, PDF p.1 / 18 / 19 / 56 / 80

完整阅读见 `E:\508\dhg508-workspace\projects\zhanguo_qunxiong\research\references\three-key-readings.md`。
