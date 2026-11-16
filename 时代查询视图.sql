
-- ============================================================
-- 《史记》武将战绩数据库 · 三时代查询视图
-- 用法：任何支持SQLite的工具中，载入 春秋战国武将数据库.db 后即可直接 SELECT * FROM 视图名;
-- ============================================================

-- ---------- 1. 春秋 ----------
DROP VIEW IF EXISTS "v春秋_武将";
CREATE VIEW "v春秋_武将" AS
SELECT g.id AS 编号, g.name AS 姓名, g.aliases AS 别名, g.state AS 国别, g.role AS 身份,
       g.famous_battle AS 著名战役, g.ending AS 结局, g.note AS 标签, g.source_chapter AS 主要出处,
       (SELECT COUNT(*) FROM battle b WHERE b.general_id = g.id) AS 战绩条数
FROM general g
WHERE g.era = '春秋';

DROP VIEW IF EXISTS "v春秋_战绩";
CREATE VIEW "v春秋_战绩" AS
SELECT b.general_name AS 武将, b.event AS 事件, b.opponent AS 对手, b.place AS 地点,
       b.year AS 年代, b.result AS 胜败, b.original_text AS 原文摘录, b.citation AS 出处
FROM battle b
JOIN general g ON b.general_id = g.id
WHERE g.era = '春秋'
ORDER BY g.id, b.id;

-- ---------- 2. 战国（含战国末及过渡人物） ----------
DROP VIEW IF EXISTS "v战国_武将";
CREATE VIEW "v战国_武将" AS
SELECT g.id AS 编号, g.name AS 姓名, g.aliases AS 别名, g.state AS 国别, g.role AS 身份,
       g.famous_battle AS 著名战役, g.ending AS 结局, g.note AS 标签, g.source_chapter AS 主要出处,
       (SELECT COUNT(*) FROM battle b WHERE b.general_id = g.id) AS 战绩条数
FROM general g
WHERE g.era IN ('战国', '战国末', '战国末→秦末');

DROP VIEW IF EXISTS "v战国_战绩";
CREATE VIEW "v战国_战绩" AS
SELECT b.general_name AS 武将, b.event AS 事件, b.opponent AS 对手, b.place AS 地点,
       b.year AS 年代, b.result AS 胜败, b.original_text AS 原文摘录, b.citation AS 出处
FROM battle b
JOIN general g ON b.general_id = g.id
WHERE g.era IN ('战国', '战国末', '战国末→秦末')
ORDER BY g.id, b.id;

-- ---------- 3. 秦统一战争（前236-前221灭六国） ----------
-- 秦方攻坚六国与六国抗秦诸将尽入此视图
DROP VIEW IF EXISTS "v秦统一_武将";
CREATE VIEW "v秦统一_武将" AS
SELECT g.id AS 编号, g.name AS 姓名, g.era AS 时代, CASE WHEN g.state LIKE '秦%' THEN '秦' ELSE '六国' END AS 阵营,
       g.state AS 国别, g.role AS 身份, g.famous_battle AS 著名战役, g.ending AS 结局,
       (SELECT COUNT(*) FROM battle b WHERE b.general_id = g.id) AS 战绩条数
FROM general g
WHERE g.name IN ('王翦','王贲','李信','蒙武','蒙恬','内史腾','辛胜','羌瘣','杨端和','麃公','桓齮',
                 '项燕','李牧','司马尚','赵葱','颜聚','扈辄','樊於期');

DROP VIEW IF EXISTS "v秦统一_战绩";
CREATE VIEW "v秦统一_战绩" AS
SELECT b.general_name AS 武将, CASE WHEN g.state LIKE '秦%' THEN '秦' ELSE '六国' END AS 阵营,
       b.event AS 事件, b.opponent AS 对手, b.place AS 地点, b.year AS 年代, b.result AS 胜败,
       b.original_text AS 原文摘录, b.citation AS 出处
FROM battle b
JOIN general g ON b.general_id = g.id
WHERE g.name IN ('王翦','王贲','李信','蒙武','蒙恬','内史腾','辛胜','羌瘣','杨端和','麃公','桓齮',
                 '项燕','李牧','司马尚','赵葱','颜聚','扈辄','樊於期')
ORDER BY 阵营, g.id, b.id;

-- ============================================================
-- 示例查询
-- ============================================================
-- 春秋武将按战绩排序：
--   SELECT * FROM "v春秋_武将" ORDER BY 战绩条数 DESC;
-- 战国武将中赵国名录：
--   SELECT * FROM "v战国_武将" WHERE 国别 LIKE '%赵%';
-- 秦统一战争中秦方战绩：
--   SELECT * FROM "v秦统一_战绩" WHERE 阵营='秦' ORDER BY 武将;
-- 两个时代同一名将行迹对照（例：廉颇）：
--   SELECT * FROM "v战国_战绩" WHERE 武将='廉颇';
