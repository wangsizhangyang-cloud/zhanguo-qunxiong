# 诸子文献 · 本地底本

本目录保存《春秋战国原典引文库》使用的十部公版古籍原文，供逐条核验与后续扩充。

## 来源

| 文件 | 书名 | 维基文库页面 |
|---|---|---|
| `论语.txt` | 论语 | https://zh.wikisource.org/wiki/論語 |
| `道德经.txt` | 道德经（王弼本） | https://zh.wikisource.org/wiki/道德經_(王弼本) |
| `墨子.txt` | 墨子 | https://zh.wikisource.org/wiki/墨子 |
| `庄子.txt` | 庄子 | https://zh.wikisource.org/wiki/莊子 |
| `孟子.txt` | 孟子 | https://zh.wikisource.org/wiki/孟子 |
| `荀子.txt` | 荀子 | https://zh.wikisource.org/wiki/荀子 |
| `韩非子.txt` | 韩非子 | https://zh.wikisource.org/wiki/韓非子 |
| `孙子兵法.txt` | 孙子兵法 | https://zh.wikisource.org/wiki/孫子兵法 |
| `公孙龙子.txt` | 公孙龙子 | https://zh.wikisource.org/wiki/公孫龍子 |
| `商君书.txt` | 商君书 | https://zh.wikisource.org/wiki/商君書 |

- 下载日期：2026-11-05
- 下载脚本：`_tools/fetch_classics.py`
- 文本状态：公版古籍，维基文库整理本；已去除模板、脚注、校勘记与 HTML 标记。
- 篇章标记：`===== 篇名 =====`（如《论语》各篇）或 `== 章名 ==`（如《道德经》各章）。

## 注意

- 这是**整理本**，不是校勘本；个别字句与中华书局本、出土简帛本可能有差异。
- 核验脚本 `_tools/build_quote_db.py` 以“与本地底本去标点、繁简归一后逐字一致”为准。
- 展示用简体由 OpenCC 转换；原繁体存于数据库 `quote_trad` 字段。
- 若重新下载，请重跑 `_tools/fetch_classics.py`，再跑 `_tools/build_quote_db.py` 与 `_tools/export_quote.py`。
