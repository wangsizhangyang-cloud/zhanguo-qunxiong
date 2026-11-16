---
framework: react
theme: exhibit
title: "为什么要做历史游戏"
routerMode: hash
layout: cover
kicker: Digital Humanities · 历史模拟
meta: 10 分钟展示
duration: 10min
timer: countdown
---

# 为什么要做历史游戏

一个讲数据和史料的策略游戏

::by::

战国群雄 · DAIHUM Reslides

<!--
0:00–0:40 · 40 秒

开场先说判断，不要先说“我做了个游戏”。
“游戏讲历史，最大的好处，是让历史知识变得有用：你学到的知识，能帮你过关，还能马上得到奖励。”

这句话是设计目标，不是已经证明的结论。后面会讲证据边界。
-->

---
kicker: 1 · 为什么不是影视
---

# 影视告诉你结果，游戏让你用知识做决定。

<div class="cols">
<div>
<div class="head">影视作品 ·《大明王朝1566》（2007）</div>
<div class="frame fit" style="padding: 0; border: none; margin-bottom: 18px;">
<img src="/jiajing_barge.jpg" alt="明宫廷绘画《嘉靖帝乘舟图》" style="width: 100%; height: 190px; object-fit: cover; display: block;" />
</div>
<p style="font-size: 25px; line-height: 1.6;">你看嘉靖、严嵩、海瑞怎么斗；知道谁输谁赢，但不能改。</p>
</div>
<div class="red">
<div class="head">游戏 ·《全面战争：三国》（2019）</div>
<div class="frame fit" style="padding: 0; border: none; margin-bottom: 18px;">
<img src="/tw3k_25.jpg" alt="《全面战争：三国》截帧" style="width: 100%; height: 190px; object-fit: cover; display: block;" />
</div>
<p style="font-size: 25px; line-height: 1.6;">你要懂兵种、地形、粮草、将领，才能赢；选错就输。</p>
</div>
</div>

> 历史题材：影视给你一个版本，游戏让你用知识做选择。

::foot::

Harnes 2025, p.9：语境化与证据工作是共情学习的瓶颈；p.14：实质知识是历史共情的基础。

<!--
0:40–1:30 · 50 秒

Harnes 的综述发现：学生不是不够感动，而是不会把史料放回背景；先懂历史，才谈得上共情。
影视可以让你感动，但很难让你因为“不知道”而输。游戏可以。

图片来源：明宫廷绘画《嘉靖帝乘舟图》（公有领域）；《全面战争：三国》刘备受难预告片截帧（CC BY 3.0，Total War）。
-->

---
kicker: 2 · 纪年
---

# 前 771 年只是传统说法，不是唯一答案。

<div class="chron">
<div class="y">《史记》</div><div class="t">前 771 幽王死 · 前 770 平王东迁</div>
<div class="y">Zhang 2023</div><div class="t">幽王 790–780 · 平王 772 即位 · 770 东迁</div>
<div class="y">秦襄公</div><div class="t">救周是传统说法，年份对不上</div>
<div class="y">作者说</div><div class="t">这只是“可以检验的假设”</div>
</div>

::foot::

Zhang 2023, p.1：七年空位；p.18：幽王 790–780、平王 772 即位；p.56：秦襄公救周年份有冲突；p.80：作者自称“假设”。

<!--
1:30–2:20 · 50 秒

这一页不是要推翻《史记》，而是让学生知道：历史书写本身也有争议。
知道 771 只是传统说法，玩家就不会把“受封岐西”当成理所当然。
“780 还是 771 会改变勤王时间”是我们的玩法推演，不是 Zhang 的结论。
-->

---
kicker: 3 · 核心回路
---

# 知识要经过四步，才能变成“我懂了、我赢了”。

<div class="body col">
<div class="route">
<div class="step"><span class="yr">01</span><p class="what">看懂</p><p class="how">看清局面</p></div>
<div class="arrow">→</div>
<div class="step"><span class="yr">02</span><p class="what">选择</p><p class="how">知道该选什么</p></div>
<div class="arrow">→</div>
<div class="step"><span class="yr">03</span><p class="what">算账</p><p class="how">知识进公式</p></div>
<div class="arrow">→</div>
<div class="step red"><span class="yr">04</span><p class="what">看结果</p><p class="how">马上有反馈</p></div>
</div>
<div class="frame hot"><span class="label">一个例子</span><div class="text">知道“齐技击打不过魏武卒，魏武卒打不过秦锐士”，就不会拿弱兵去送死；战报马上显示<mark>克制 ×1.3</mark>。</div></div>
</div>

::foot::

Harnes 2025, p.14：实质知识是历史共情的基础。

<!--
1:30–2:40 · 70 秒

四步：
1 看懂：谁是谁、粮道多远、谁的话能信。
2 选择：知道得多，选项就多；不知道，就容易踩坑。
3 算账：兵种相克、地形、城防、将领，都算进战斗。
4 看结果：战报、对话、纪年、奖励，马上告诉你对在哪、错在哪。

一句话：知识不是通关后的注释，是通关前的帮手。
-->

---
kicker: 4 · 史料与数据
---

# 数据库不是拿来查的，它是你的“通关钥匙”。

<div class="bars">
<div class="n">190</div><div class="b" style="width: 95%"></div><div class="v">武将</div>
<div class="n">1215</div><div class="b" style="width: 98%"></div><div class="v">战绩</div>
<div class="n">15</div><div class="b red" style="width: 55%"></div><div class="v">兵种</div>
<div class="n">13</div><div class="b red" style="width: 45%"></div><div class="v">克制</div>
</div>

<div style="height: 30px"></div>

知道兵种为什么强，才知道该造什么兵；知道谁克谁，才知道该怎么排兵；知道战绩从哪来，才知道战报凭什么这么算。

<!--
2:40–3:40 · 60 秒

这些数字不是摆设。每个兵种都有“为什么强”的说明；每条战绩都有原文和出处。
但现在玩家还要自己翻资料，战报里还不能直接点开出处。这是下一步要补的。
-->

---
kicker: 5 · 地图
---

# 地图不是背景图，它决定你怎么走、怎么打。

<div class="body">
<div class="frame" style="flex: 1.15;">
<span class="label">87 省 · 城邑级省份</span>
<div class="pic"><img src="/godot-map.png" alt="战国群雄 87 省地图" /></div>
</div>
<div style="flex: .85; padding-top: 12px; font-size: 24px; line-height: 1.7;">
<p><strong>位置真</strong>：每座城都按史书记载的位置放。</p>
<p><strong>地形真</strong>：海岸、大河、山脉、湖泽，都是自己画的。</p>
<p><strong>大小有据</strong>：汉中“六百里”、巴蜀“沃野”、楚“地方五千里”。</p>
</div>
</div>

<!--
3:40–4:30 · 50 秒

地图上每块地都能问一句：凭什么这么大？凭什么在这里？
知道汉中六百里、巴蜀沃野，才知道先打哪里、粮道有多长。
现在地形、产出还没完全接进行军和粮耗计算，这是下一步。
-->

---
kicker: 6 · 战斗
---

# 战斗公式，把历史结论变成输赢。

<div class="frame" style="padding: 22px 28px; margin-bottom: 24px;">
<div style="font-family: ui-monospace, monospace; font-size: 22px; line-height: 1.65;">
攻方 = Σ 兵数 × (攻击×0.55 + 远程×0.25 + 机动×0.2)<br/>
　　　　× 克制 × 地形 × 将领 × 技卡<br/>
守方 = Σ 兵数 × (防御×0.65 + 持久×0.35) × 城防
</div>
</div>

| 你必须知道 | 它能帮你 | 马上能看到 |
|---|---|---|
| 兵种相克 / 地形 | 少送兵、走对路 | 战报列出主力 |
| 维持费 / 粮草 | 不被贵兵拖垮 | 资源变化 |
| 城防 / 围城 | 强攻还是围城 | 破城 / 受挫 / 撤围 |

::foot::

Harnes 2025, p.14：实质知识是历史共情的基础。

<!--
4:30–5:20 · 50 秒

魏武卒很强，但很贵，会把国家拖穷。知道这一点，玩家才会算账。
现在战报只列前三主力，还没有逐项拆开。没有拆开，玩家就不知道“为什么赢”，知识的作用就还没完全显出来。
-->

---
kicker: 7 · 教学关
---

# 六节课：先讲背景，再做选择，最后复盘。

<div class="tl" style="--n: 6;">
<div class="ev"><span class="yr">第〇课</span><p>开卷</p><span class="note">王在镐京</span></div>
<div class="ev"><span class="yr">第一课</span><p>看国情</p><span class="note">宗周形势</span></div>
<div class="ev"><span class="yr">第二课</span><p>动员</p><span class="note">兵 / 粮 / 路线</span></div>
<div class="ev red"><span class="yr">第三课</span><p>骊山之难</p><span class="note">要不要勤王</span></div>
<div class="ev"><span class="yr">第四课</span><p>救周逐戎</p><span class="note">围城 / 受赂</span></div>
<div class="ev"><span class="yr">第五课</span><p>封侯建国</p><span class="note">岐西 / 名分</span></div>
</div>

> 不知道申侯为什么生气、犬戎从哪里来，选项还是能点，但代价更高、收益更少。

::foot::

Harnes 2025, p.10：多视角是入口，但不等于整合；p.11：第一人称写作会提高 presentism 与道德审判的风险。

<!--
6:10–7:00 · 50 秒

六节课不是读课文，是：先讲背景，再做选择，最后复盘。
学生演秦襄公，幽王是“别人”，不是“你”。
复盘不问“你赢了吗”，问“哪些事让你看懂了？哪些事你根本不可能知道？”
“名分/政治资本”现在还是设计，没有单独做进游戏。
-->

---
kicker: 8 · 边界
---

# 已经做出来的，和还没做出来的

<div class="cols">
<div>
<div class="head">已经能做</div>
<p>87 省地图 / 190 将</p>
<p>15 兵种 / 13 克制</p>
<p>战斗 / 围城 / 6 节课</p>
<p>幽王 AI / 简繁 / Godot 导出</p>
</div>
<div class="red">
<div class="head">接下来要做</div>
<p>AI 参与决策</p>
<p>战报理由演绎</p>
<p>选项影响未来</p>
<p>美术资源更新</p>
</div>
</div>

::foot::

Park et al. 2023, pp.2, 9, 15：LLM 角色会记忆，但记忆不是真相。

<!--
8:40–9:20 · 40 秒

我不想把“想做”说成“已经做了”。现在能玩的是兵力、粮草、城池、技卡、事件。
接下来做：AI 参与决策、战报理由演绎、选项影响未来、美术资源更新。
“有没有获得感”也还没测。
-->

---
kicker: 9 · 收束
---

# 游戏的即时奖励机制，让历史真正鲜活。

<div class="body col" style="justify-content: center; gap: 34px; margin-top: 0;">
<div class="frame hot" style="padding: 30px 34px;">
<span class="label">一句话</span>
<div class="text" style="font-size: 32px; line-height: 1.5;">读懂一条史料，就能在游戏里用上；用对了，立刻得到回应。历史不再是背景，而是你正在经历的选择。</div>
</div>

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px;">
<div class="frame" style="padding: 24px 18px; text-align: center;">
<span class="label">史料</span>
<div class="text" style="font-size: 36px;">读得懂</div>
</div>
<div class="frame" style="padding: 24px 18px; text-align: center;">
<span class="label">选择</span>
<div class="text" style="font-size: 36px;">有代价</div>
</div>
<div class="frame hot" style="padding: 24px 18px; text-align: center;">
<span class="label">奖励</span>
<div class="text" style="font-size: 36px;">活起来</div>
</div>
</div>
</div>

::foot::

Harnes 2025, pp.7, 14：共情含认知与情感，需与证据绑定；Park et al. 2023, pp.2, 9, 15：记忆可用，但会漏取、编造；Zhang 2023, pp.18, 19, 80：771 是传统说法。

<!--
9:20–10:00 · 40 秒

一句话：让历史知识在游戏里当场有用，同时让每一条知识都能回到证据。
即时奖励让历史活起来；文献讲条件，设计做机制；效果还要测。
谢谢，欢迎提问。

可能被问：
1 “这不就是数值游戏吗？”——数值只是算账；关键是知识有没有真的改变选择。
2 “怎么证明学生学到了？”——现在不能证明；计划前测、后测、选择记录和访谈。
3 “为什么用 771，不用 780？”——771 是《史记》传统，上课好对照；Zhang 的说法作为“另一种可能”展示。
-->
