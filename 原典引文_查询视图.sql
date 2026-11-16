
-- 《春秋战国原典引文库》查询视图（可移植定义）
-- 用法：在 春秋战国原典引文库.db 中执行本脚本，或按需复制视图。

DROP VIEW IF EXISTS "v原典_总览";
CREATE VIEW v原典_总览 AS
SELECT q.id AS 编号,q.work AS 著作,q.school AS 学派,q.thinker AS 人物,q.category AS 类别,
       q.chapter AS 篇章,q.quote AS 原文,q.interpretation AS 释义,q.citation AS 出处,q.char_count AS 字数
FROM quote q ORDER BY q.id;

DROP VIEW IF EXISTS "v原典_按人物";
CREATE VIEW v原典_按人物 AS
SELECT q.thinker AS 人物,q.school AS 学派,COUNT(*) AS 条数,
       GROUP_CONCAT(DISTINCT q.work) AS 著作
FROM quote q GROUP BY q.thinker ORDER BY 条数 DESC;

DROP VIEW IF EXISTS "v原典_按学派";
CREATE VIEW v原典_按学派 AS
SELECT q.school AS 学派,COUNT(*) AS 条数,GROUP_CONCAT(DISTINCT q.thinker) AS 人物,
       GROUP_CONCAT(DISTINCT q.work) AS 著作
FROM quote q GROUP BY q.school ORDER BY 条数 DESC;

DROP VIEW IF EXISTS "v原典_按著作";
CREATE VIEW v原典_按著作 AS
SELECT q.work AS 著作,q.school AS 学派,q.thinker AS 人物,COUNT(*) AS 条数
FROM quote q GROUP BY q.work ORDER BY q.id;

