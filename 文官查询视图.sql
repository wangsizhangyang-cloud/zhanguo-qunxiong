
-- 《春秋战国文官数据库》查询视图（可移植定义）
-- 用法：在 春秋战国文官数据库.db 中执行本脚本，或按需复制视图。

DROP VIEW IF EXISTS "v战国_文官";
CREATE VIEW v战国_文官 AS
SELECT o.id AS 编号,o.name AS 姓名,o.aliases AS 别名,o.state AS 国别,o.role AS 身份,o.office AS 官职,
       o.famous_deed AS 代表事迹,o.ending AS 结局,o.note AS 标签,o.source_chapter AS 主要出处,
       (SELECT COUNT(*) FROM deed d WHERE d.official_id=o.id) AS 事迹条数
FROM official o WHERE o.era IN ('战国','战国末');

DROP VIEW IF EXISTS "v战国_文官事迹";
CREATE VIEW v战国_文官事迹 AS
SELECT d.official_name AS 文官,d.category AS 类别,d.event AS 事件,d.counterpart AS 对象,d.place AS 地点,
       d.year AS 年代,d.result AS 结果,d.original_text AS 原文摘录,d.citation AS 出处
FROM deed d JOIN official o ON d.official_id=o.id WHERE o.era IN ('战国','战国末') ORDER BY o.id,d.id;

DROP VIEW IF EXISTS "v文官_总览";
CREATE VIEW v文官_总览 AS
SELECT o.id AS 编号,o.name AS 姓名,o.era AS 时代,o.state AS 国别,o.role AS 身份,o.office AS 官职,
       r.politics AS 政治,r.diplomacy AS 外交,r.strategy AS 谋略,r.governance AS 治理,r.learning AS 学识,r.influence AS 影响,
       r.overall AS 综合,r.grade AS 评级,
       (SELECT COUNT(*) FROM deed d WHERE d.official_id=o.id) AS 事迹条数
FROM official o JOIN rating r ON r.official_id=o.id ORDER BY r.overall DESC;

DROP VIEW IF EXISTS "v春秋_文官";
CREATE VIEW v春秋_文官 AS
SELECT o.id AS 编号,o.name AS 姓名,o.aliases AS 别名,o.state AS 国别,o.role AS 身份,o.office AS 官职,
       o.famous_deed AS 代表事迹,o.ending AS 结局,o.note AS 标签,o.source_chapter AS 主要出处,
       (SELECT COUNT(*) FROM deed d WHERE d.official_id=o.id) AS 事迹条数
FROM official o WHERE o.era='春秋';

DROP VIEW IF EXISTS "v春秋_文官事迹";
CREATE VIEW v春秋_文官事迹 AS
SELECT d.official_name AS 文官,d.category AS 类别,d.event AS 事件,d.counterpart AS 对象,d.place AS 地点,
       d.year AS 年代,d.result AS 结果,d.original_text AS 原文摘录,d.citation AS 出处
FROM deed d JOIN official o ON d.official_id=o.id WHERE o.era='春秋' ORDER BY o.id,d.id;

