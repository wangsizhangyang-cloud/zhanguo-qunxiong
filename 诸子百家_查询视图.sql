
-- 《春秋战国诸子百家数据库》查询视图（可移植定义）
-- 用法：在 春秋战国诸子百家数据库.db 中执行本脚本，或按需复制视图。

DROP VIEW IF EXISTS "v各家_宗旨";
CREATE VIEW v各家_宗旨 AS
SELECT s.name AS 学派,s.founder AS 宗师,s.core_ideas AS 核心主张,s.representative_works AS 代表著作,
       (SELECT group_concat(t.name,'、') FROM thinker t WHERE t.school=s.name) AS 代表人物
FROM school s ORDER BY s.id;

DROP VIEW IF EXISTS "v学派_总览";
CREATE VIEW v学派_总览 AS
SELECT s.id AS 编号,s.name AS 学派,s.aliases AS 别名,s.founder AS 宗师,s.era AS 时代,
       s.core_ideas AS 核心主张,s.representative_works AS 代表著作,
       (SELECT COUNT(*) FROM thinker t WHERE t.school=s.name) AS 人物数,
       (SELECT COUNT(*) FROM doctrine d WHERE d.school=s.name) AS 学说条数,
       s.brief AS 简述,s.source_chapter AS 主要出处,s.note AS 标签
FROM school s ORDER BY s.id;

DROP VIEW IF EXISTS "v学说_全览";
CREATE VIEW v学说_全览 AS
SELECT d.id AS 编号,d.school AS 学派,d.thinker_name AS 人物,d.category AS 类别,
       d.proposition AS 命题,d.counterpart AS 对象,d.place AS 地点,d.year AS 年代,d.result AS 结果,
       d.original_text AS 原文摘录,d.interpretation AS 释义,
       d.citation AS 出处
FROM doctrine d ORDER BY d.id;

DROP VIEW IF EXISTS "v战国_诸子";
CREATE VIEW v战国_诸子 AS
SELECT t.id AS 编号,t.name AS 姓名,t.school AS 学派,t.era AS 时代,t.state AS 国别,t.role AS 身份,
       t.main_thought AS 核心思想,t.famous_work AS 代表著作,
       (SELECT COUNT(*) FROM doctrine d WHERE d.thinker_id=t.id) AS 学说条数
FROM thinker t WHERE t.era IN ('战国','战国末') ORDER BY t.id;

DROP VIEW IF EXISTS "v春秋_诸子";
CREATE VIEW v春秋_诸子 AS
SELECT t.id AS 编号,t.name AS 姓名,t.school AS 学派,t.state AS 国别,t.role AS 身份,
       t.main_thought AS 核心思想,t.famous_work AS 代表著作,
       (SELECT COUNT(*) FROM doctrine d WHERE d.thinker_id=t.id) AS 学说条数
FROM thinker t WHERE t.era='春秋' ORDER BY t.id;

DROP VIEW IF EXISTS "v诸子_总览";
CREATE VIEW v诸子_总览 AS
SELECT t.id AS 编号,t.name AS 姓名,t.aliases AS 别名,t.school AS 学派,t.era AS 时代,t.state AS 国别,
       t.role AS 身份,t.main_thought AS 核心思想,t.famous_work AS 代表著作,
       r.depth AS 思想深度,r.originality AS 原创,r.system AS 体系,r.practice AS 实践,
       r.transmission AS 传承,r.influence AS 影响,r.overall AS 综合,r.grade AS 评级,
       (SELECT COUNT(*) FROM doctrine d WHERE d.thinker_id=t.id) AS 学说条数
FROM thinker t JOIN rating r ON r.thinker_id=t.id ORDER BY r.overall DESC;

