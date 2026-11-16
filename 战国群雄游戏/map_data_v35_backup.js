/* =============================================================================
   战国群雄 v3.5 · 真实底图地图
   -----------------------------------------------------------------------------
   ★ 底图：《戰國形勢圖（前350年）》 · 作者 玖巧仔（Wikimedia Commons）
     CC BY-SA 3.0 / GFDL 双许可 —— 地形数据 ETOPO1，矢量底图 Natural Earth，
     参考 谭其骧《中国历史地图集》战国部分。本游戏在其上叠加游戏层（归属
     半透明填色 / 国名 / 围城旗 / 点选高亮），属改编作品，同样以 CC BY-SA 3.0
     共享；署名见 mapPanel 底部小字与《游戏说明.md》。

   · 配准：以图上 8 个可确读的都城/城邑红方块像素坐标与其真实经纬做
     二次多项式最小二乘拟合（Natural Earth 投影的子午线是曲线，线性拟合
     残差 21px，二次拟合残差 3.1px）：
       蓟(461,119)·临淄(519,225)·离石(343,209)·咸阳(288,315)·大梁(434,301)
       成都(166,439)·巴(233,468)·吴(602,387)
     由此得 nat 像素 ↔ 经纬 的双向映射，网格每格中心经逆投影求真实经纬。
   · 领土划分：加权 Voronoi —— 每格归「除以面积权重 w 后最近」的锚点省；
     锚点经纬取《史记》《战国策》所载城邑（见 DEFS.vol/cite）。
   · 非七雄区域（朝鲜/东胡/匈奴/楼烦/林胡/月氏/诸羌/越?）以 SEAS 中立锚点
     留白，底图原色透出。越（吴墟）单独成 YUE 国（前350年越尚存）。
   · 游戏层（六边形 R=10 有机边界 + Catmull-Rom 贝塞尔）照旧。
   ============================================================================= */
window.MAP = (function () {
'use strict';

/* ---------- 面板 / 底图 / 投影 ---------- */
const PANEL = { W: 912, H: 560 };
const IMG = {
  url: 'assets/zhanguo350.png',
  natW: 736, natH: 786,
  scale: 912 / 736,          // 1.23913（宽适配）
  y0: -62.05                 // 面板顶 = 图内北纬约 41.7°（中经 110.5°E）
};
/* 二次多项式：nat 像素 ← (lon,lat)   [1, L, F, L², L·F, F²] */
const PCX = [-4822.31851, 55.06641, 42.44611, -0.08217, -0.32722, -0.11741];
const PCY = [689.36310, 12.32337, -26.05588, -0.09669, 0.24051, -0.48410];
function pxNat(L, F) { return PCX[0] + PCX[1]*L + PCX[2]*F + PCX[3]*L*L + PCX[4]*L*F + PCX[5]*F*F; }
function pyNat(L, F) { return PCY[0] + PCY[1]*L + PCY[2]*F + PCY[3]*L*L + PCY[4]*L*F + PCY[5]*F*F; }
/* 经纬 → 面板像素 */
function px(L, F) { return pxNat(L, F) * IMG.scale; }
function py(L, F) { return pyNat(L, F) * IMG.scale + IMG.y0; }
/* 面板像素 → 经纬（牛顿迭代反解） */
function lonLatAt(sx, sy) {
  const nx = sx / IMG.scale, ny = (sy - IMG.y0) / IMG.scale;
  let L = 112, F = 34;
  for (let k = 0; k < 40; k++) {
    const e = 1e-4;
    const f0 = pxNat(L, F) - nx, f1 = pyNat(L, F) - ny;
    const Jxx = (pxNat(L+e,F)-pxNat(L-e,F))/(2*e), JxF = (pxNat(L,F+e)-pxNat(L,F-e))/(2*e);
    const Jyx = (pyNat(L+e,F)-pyNat(L-e,F))/(2*e), JyF = (pyNat(L,F+e)-pyNat(L,F-e))/(2*e);
    const det = Jxx*JyF - JxF*JyF;
    L -= (f0*JyF - JxF*f1) / det;
    F -= (Jxx*f1 - f0*Jyx) / det;
  }
  return [L, F];
}

/* ---------- 网格（采样格） ---------- */
const COLS = 46, ROWS = 28;
const CELLX = PANEL.W / COLS, CELLY = PANEL.H / ROWS;

/* ---------- 36 省（锚点＝真实经纬；w＝面积权重） ---------- */
const DEFS = [
 /* ===== 秦 ===== */
 {id:'xianyang', name:'咸阳·关中', owner:'QIN', cap:true, terrain:'平原', prod:{gold:5,food:5},
  lon:108.71, lat:34.38, w:1.40,
  vol:'关中自汧、雍以东至河、华（渭河谷地）', cite:'《史记·货殖列传》“关中……膏壤沃野千里”'},
 {id:'hangu', name:'函谷', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:111.2, lat:34.65, w:0.85, claim:{lon1:110.55, lat1:34.30, lon2:111.95, lat2:35.05},
  vol:'崤函走廊（函谷关—陕县）', cite:'《战国策·秦策一》“东有肴、函之固”'},
 {id:'shangjun', name:'上郡', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:109.8, lat:37.2, w:1.35,
  vol:'上郡（肤施一带，陕北）', cite:'《史记·秦本纪》“魏纳上郡十五县”'},
 {id:'beidi', name:'北地', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:107.75, lat:35.35, w:1.10,
  vol:'义渠故地（庆阳、平凉）', cite:'《史记·匈奴列传》“秦有陇西、北地、上郡”'},
 {id:'longxi', name:'陇西', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:103.85, lat:35.38, w:1.05,
  vol:'陇山以西至临洮（狄道）', cite:'《史记·匈奴列传》'},
 {id:'hanzhong', name:'汉中', owner:'QIN', cap:false, terrain:'山地', prod:{gold:3,food:4},
  lon:107.03, lat:33.05, w:1.25,
  vol:'汉中郡·南郑（取地六百里所置）', cite:'《史记·秦本纪》“取地六百里，置汉中郡”'},
 {id:'shu', name:'蜀', owner:'QIN', cap:false, terrain:'平原', prod:{gold:4,food:5},
  lon:104.06, lat:30.66, w:1.20,
  vol:'蜀郡·成都（前316年入秦）', cite:'《史记·货殖列传》“巴蜀亦沃野”'},
 {id:'ba', name:'巴', owner:'QIN', cap:false, terrain:'山地', prod:{gold:3,food:4},
  lon:106.55, lat:29.56, w:1.20,
  vol:'巴郡·江州（前316年入秦）', cite:'《战国策·秦策一》“西有巴、蜀之利”'},
 /* ===== 赵 ===== */
 {id:'yunzhong', name:'云中·九原', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:110.5, lat:40.55, w:1.30,
  vol:'云中、九原郡（呼包平原）', cite:'《战国策·燕策一》“西有云中、九原”'},
 {id:'dai', name:'代郡', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:114.4, lat:39.8, w:1.20,
  vol:'代郡·代王城（桑干河谷）', cite:'《战国策·燕策一》“过代、上谷”'},
 {id:'taiyuan', name:'太原', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:4,food:3},
  lon:112.55, lat:37.87, w:1.25,
  vol:'太原郡·晋阳（汾河上游）', cite:'《史记·秦本纪》“司马梗北定太原”'},
 {id:'julu', name:'巨鹿', owner:'ZHAO', cap:false, terrain:'平原', prod:{gold:5,food:4},
  lon:114.4, lat:38.0, w:1.05,
  vol:'鄗、石邑、封龙、东垣（滹沱）', cite:'《史记·赵世家》'},
 {id:'handan', name:'邯郸', owner:'ZHAO', cap:true, terrain:'平原', prod:{gold:5,food:4},
  lon:114.49, lat:36.61, w:1.15,
  vol:'赵都邯郸', cite:'《史记·赵世家》“赵始都邯郸”'},
 /* ===== 燕 ===== */
 {id:'shanggu', name:'上谷', owner:'YAN', cap:false, terrain:'山地', prod:{gold:4,food:2},
  lon:115.5, lat:40.42, w:0.85,
  vol:'上谷郡·沮阳（居庸以北）', cite:'《史记·匈奴列传》“燕置上谷……以拒胡”'},
 {id:'ji', name:'蓟城', owner:'YAN', cap:true, terrain:'平原', prod:{gold:6,food:3},
  lon:116.42, lat:39.93, w:1.15,
  vol:'燕都蓟（含渔阳）', cite:'《战国策·燕策一》'},
 {id:'liaoxi', name:'辽西·碣石', owner:'YAN', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:120.3, lat:41.0, w:1.25,
  vol:'辽西郡（碣石—朝阳）', cite:'《战国策·燕策一》“南有碣石之饶”'},
 {id:'liaodong', name:'辽东', owner:'YAN', cap:false, terrain:'山地', prod:{gold:4,food:2},
  lon:123.15, lat:41.25, w:1.40,
  vol:'辽东郡·襄平（东至朝鲜）', cite:'《战国策·燕策一》“东有朝鲜、辽东”'},
 /* ===== 魏 ===== */
 {id:'anyi', name:'安邑', owner:'WEI', cap:false, terrain:'平原', prod:{gold:5,food:3},
  lon:111.23, lat:35.14, w:1.05,
  vol:'魏故都·河东安邑', cite:'《史记·秦本纪》“魏献安邑”'},
 {id:'henei', name:'河内', owner:'WEI', cap:false, terrain:'平原', prod:{gold:5,food:3},
  lon:114.0, lat:35.45, w:1.00,
  vol:'河内（朝歌、野王）', cite:'《史记·秦始皇本纪》“端和将河内”'},
 {id:'daliang', name:'大梁', owner:'WEI', cap:true, terrain:'平原', prod:{gold:8,food:5},
  lon:114.35, lat:34.79, w:1.10,
  vol:'魏都大梁（鸿沟之滨）', cite:'《史记·魏世家》“徙治大梁”'},
 /* ===== 韩 ===== */
 {id:'yiyang', name:'宜阳', owner:'HAN', cap:false, terrain:'山地', prod:{gold:3,food:3},
  lon:111.16, lat:34.42, w:0.85,
  vol:'宜阳（城方八里、材士十万）', cite:'《战国策·韩策一》'},
 {id:'luoyi', name:'雒邑·王畿', owner:'ZHOU', cap:true, terrain:'平原', prod:{gold:2,food:2},
  lon:112.45, lat:34.64, w:0.70,
  vol:'周王畿·雒邑', cite:'《史记·周本纪》“东迁于雒邑”'},
 {id:'xinzheng', name:'新郑', owner:'HAN', cap:true, terrain:'平原', prod:{gold:5,food:3},
  lon:113.73, lat:34.40, w:0.95,
  vol:'韩都新郑', cite:'《战国策·韩策一》'},
 {id:'yangzhai', name:'阳翟', owner:'HAN', cap:false, terrain:'平原', prod:{gold:5,food:3},
  lon:113.49, lat:34.14, w:0.80,
  vol:'韩故都·阳翟（大贾之都）', cite:'《史记·吕不韦列传》'},
 {id:'shangdang', name:'上党', owner:'HAN', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:113.11, lat:36.20, w:0.95,
  vol:'韩上党高地（长治）', cite:'《史记·秦本纪》“上党降赵”'},
 /* ===== 楚（地方五千里 → 7块）===== */
 {id:'huaibei', name:'陈', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:4,food:4},
  lon:114.88, lat:33.73, w:0.95,
  vol:'陈地（淮阳·汝南）', cite:'《史记·楚世家》“东北保於陈城”'},
 {id:'xiazhou', name:'寿春·夏州', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:4,food:4},
  lon:116.79, lat:32.58, w:1.25,
  vol:'江淮之间（夏州、海阳）', cite:'《战国策·楚策一》“东有夏州、海阳”'},
 {id:'ying', name:'郢都·南郡', owner:'CHU', cap:true, terrain:'水乡', prod:{gold:6,food:6},
  lon:112.19, lat:30.42, w:1.35,
  vol:'楚都郢（纪南城·江汉）', cite:'《史记·秦本纪》“取郢为南郡”'},
 {id:'wanling', name:'宛·南阳', owner:'CHU', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:112.53, lat:32.99, w:0.95,
  vol:'宛（南阳盆地·铁官）', cite:'《战国策·韩策一》“东有宛、穰”'},
 {id:'dongting', name:'洞庭·苍梧', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:3,food:5},
  lon:112.5, lat:28.6, w:1.20,
  vol:'南有洞庭、苍梧（湘水）', cite:'《战国策·楚策一》'},
 {id:'wuqian', name:'巫·黔中', owner:'CHU', cap:false, terrain:'山地', prod:{gold:2,food:5},
  lon:110.0, lat:28.7, w:1.35,
  vol:'西有黔中、巫郡（沅澧）', cite:'《战国策·楚策一》'},
 /* ===== 越（前350年越尚存）===== */
 {id:'wusuh', name:'吴墟·越地', owner:'YUE', cap:false, terrain:'水乡', prod:{gold:4,food:5},
  lon:120.62, lat:31.32, w:1.30,
  vol:'越王 国·故吴地至浙江', cite:'《史记·越王句践世家》'},
 /* ===== 齐（方二千里·四塞 → 4块）===== */
 {id:'qinghe', name:'清河', owner:'QI', cap:false, terrain:'平原', prod:{gold:7,food:4},
  lon:115.5, lat:36.55, w:0.90,
  vol:'齐西境·清河（高唐、阿）', cite:'《战国策·齐策一》“西有清河”'},
 {id:'linzi', name:'临淄', owner:'QI', cap:true, terrain:'平原', prod:{gold:8,food:5},
  lon:118.25, lat:36.81, w:0.90,
  vol:'齐都临淄（七万户）', cite:'《战国策·齐策一》'},
 {id:'jimo', name:'即墨', owner:'QI', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:119.98, lat:36.52, w:0.85,
  vol:'即墨之饶（胶东）', cite:'《史记·高祖本纪》“东有琅邪、即墨之饶”'},
 {id:'langya', name:'琅邪', owner:'QI', cap:false, terrain:'山地', prod:{gold:3,food:4},
  lon:119.92, lat:35.70, w:0.75,
  vol:'琅邪台之滨（含莒）', cite:'《战国策·齐策一》“东有琅邪”'}
];

/* ---------- 中立锚点（非七雄：留白露底图） ---------- */
const SEAS = [
 {id:'SEA', name:'勃海',    lon:119.8, lat:38.6,  w:1.05},
 {id:'SEA', name:'黄海北',  lon:123.8, lat:36.6,  w:1.30},
 {id:'SEA', name:'黄海南',  lon:124.9, lat:33.2,  w:1.35},
 {id:'SEA', name:'东海南',  lon:125.3, lat:29.3,  w:1.35},
 {id:'SEA', name:'朝鲜',    lon:126.5, lat:40.0,  w:0.95},
 {id:'SEA', name:'东胡',    lon:122.3, lat:41.35, w:1.15},
 {id:'SEA', name:'匈奴东',  lon:113.5, lat:41.4,  w:1.20},
 {id:'SEA', name:'匈奴西',  lon:105.4, lat:41.4,  w:1.15},
 {id:'SEA', name:'楼烦',    lon:113.0, lat:41.15, w:0.95},
 {id:'SEA', name:'林胡',    lon:108.6, lat:41.3,  w:1.00},
 {id:'SEA', name:'月氏',    lon:98.2,  lat:40.6,  w:1.20},
 {id:'SEA', name:'羌北',    lon:98.3,  lat:37.2,  w:1.25},
 {id:'SEA', name:'羌中',    lon:99.0,  lat:33.6,  w:1.25},
 {id:'SEA', name:'羌南',    lon:99.8,  lat:30.0,  w:1.25}
];

/* ---------- 教学关割地（真实位置） ----------
   镐京＝沣镐（西安西南）；犬丘＝西犬丘（礼县一带，陇山以西） */
const CARVE = [
 {pid:'haojing',  lon:108.75, lat:34.28, rKm:35},
 {pid:'quanrong', lon:105.55, lat:34.25, rKm:42}
];

/* ---------- 距离（km） ---------- */
function kmDist(lon1, lat1, lon2, lat2) {
  const mx = (lat1 + lat2) / 2 * Math.PI / 180;
  const dx = (lon2 - lon1) * 111.32 * Math.cos(mx);
  const dy = (lat2 - lat1) * 111.32;
  return Math.hypot(dx, dy);
}

/* ---------- 领土划分：格子采样（逆投影→真实经纬→加权最近锚点） ---------- */
function buildCells(provActive) {
  const act = {}; (provActive || []).forEach(p => { act[p] = true; });
  const nodes = DEFS.concat(SEAS);
  const grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const [lon, lat] = lonLatAt((c + 0.5) * CELLX, (r + 0.5) * CELLY);
    let best = null, bd = Infinity;
    for (const nd of nodes) {
      const d = kmDist(lon, lat, nd.lon, nd.lat) / (nd.w || 1);
      if (d < bd) { bd = d; best = nd; }
    }
    grid[r][c] = (best && best.owner) ? best.id : null;   // SEA→null
  }
  /* 常驻 claim（崤函走廊划给函谷） */
  for (const d of DEFS) {
    if (!d.claim) continue;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const [lon, lat] = lonLatAt((c + 0.5) * CELLX, (r + 0.5) * CELLY);
      if (lon >= d.claim.lon1 && lon <= d.claim.lon2 && lat >= d.claim.lat1 && lat <= d.claim.lat2)
        grid[r][c] = d.id;
    }
  }
  /* 教学关割地（圆域 + 保底最近格） */
  const carved = {};
  for (const cc of CARVE) {
    if (!act[cc.pid]) continue;
    carved[cc.pid] = [];
    /* 保底：割地中心点所在格必收 */
    let bestC = 0, bestR = 0, bestD = Infinity;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const [lon, lat] = lonLatAt((c + 0.5) * CELLX, (r + 0.5) * CELLY);
      const d = kmDist(lon, lat, cc.lon, cc.lat);
      if (d < bestD) { bestD = d; bestC = c; bestR = r; }
      if (d <= cc.rKm) { carved[cc.pid].push([c, r]); grid[r][c] = cc.pid; }
    }
    if (!carved[cc.pid].length) { carved[cc.pid].push([bestC, bestR]); grid[bestR][bestC] = cc.pid; }
  }
  return { grid, carved };
}

/* ---------- 邻接 ---------- */
function buildAdj(grid) {
  const adj = {};
  const key = (x, y) => (x < 0 || x >= COLS || y < 0 || y >= ROWS) ? null : grid[y][x];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const a = grid[y][x]; if (!a) continue;
    adj[a] = adj[a] || new Set();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const b = key(x + dx, y + dy);
      if (b && b !== a) { adj[a].add(b); (adj[b] = adj[b] || new Set()).add(a); }
    }
  }
  const out = {}; for (const k in adj) out[k] = [...adj[k]];
  return out;
}

/* ---------- 几何（label 锚点用像素质心） ---------- */
function buildGeom(grid) {
  const acc = {};
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const id = grid[y][x]; if (!id) continue;
    const a = acc[id] = acc[id] || { n:0, sx:0, sy:0, cells:[] };
    a.n++; a.sx += x; a.sy += y; a.cells.push([x, y]);
  }
  const out = {};
  for (const id in acc) {
    const a = acc[id];
    out[id] = { n: a.n, cells: a.cells,
      x: (a.sx / a.n + 0.5) * CELLX, y: (a.sy / a.n + 0.5) * CELLY };
  }
  return out;
}

/* ---------- 六边形层（R=10，覆盖整面板；按格采样归属） ---------- */
const HEXR = 10;
const HEXW = Math.sqrt(3) * HEXR;
const HEXVS = 1.5 * HEXR;
const HROWS = Math.ceil(PANEL.H / HEXVS) + 1;
const HCOLS = Math.ceil(PANEL.W / HEXW) + 1;

const _SIDES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]];
const _SIDE_NBR = [
  {even:[+1,0], odd:[+1,0]}, {even:[0,+1], odd:[+1,+1]},
  {even:[-1,+1], odd:[0,+1]},{even:[-1,0], odd:[-1,0]},
  {even:[-1,-1], odd:[0,-1]},{even:[0,-1], odd:[+1,-1]}
];
function _hexKey(c, r) { return c + '_' + r; }
function _hexCenter(c, r) { return [HEXW * c + (r % 2 ? HEXW / 2 : 0), HEXVS * r]; }
function _hexCorners(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    pts.push([+(cx + HEXR * Math.cos(a)).toFixed(2), +(cy + HEXR * Math.sin(a)).toFixed(2)]);
  }
  return pts;
}
function buildHexWorld(provActive) {
  const sq = buildCells(provActive).grid;
  const byKey = {}; const hexes = [];
  for (let r = 0; r < HROWS; r++) for (let c = 0; c < HCOLS; c++) {
    const h = { c, r, id: null };
    hexes.push(h); byKey[_hexKey(c, r)] = h;
  }
  for (const h of hexes) {
    const [cx, cy] = _hexCenter(h.c, h.r); h.cx = cx; h.cy = cy;
    const gc = Math.floor(cx / CELLX), gr = Math.floor(cy / CELLY);
    h.id = (gc >= 0 && gc < COLS && gr >= 0 && gr < ROWS) ? sq[gr][gc] : null;
  }
  for (const h of hexes) {
    h.nbr = new Array(6).fill(null);
    for (let s = 0; s < 6; s++) {
      const d = (h.r % 2 === 0) ? _SIDE_NBR[s].even : _SIDE_NBR[s].odd;
      h.nbr[s] = byKey[_hexKey(h.c + d[0], h.r + d[1])] || null;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    for (const h of hexes) {
      const ids = h.nbr.map(n => n && n.id);
      const land = ids.filter(x => x).length;
      if (h.id === null && land >= 3) {
        const cnt = {}; for (const x of ids) if (x) cnt[x] = (cnt[x] || 0) + 1;
        let bk = null, bn = 0; for (const k in cnt) if (cnt[k] > bn) { bn = cnt[k]; bk = k; }
        if (bn >= 3) h.id = bk;
      } else if (h.id && land === 0) h.id = null;
    }
  }
  return { hexes, byKey };
}

/* ---------- 模块级：噪声 / Catmull-Rom ---------- */
function _hashNoise(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}
function _organicize(keys, geo, isCoast, seed) {
  const base = keys.map(k => geo[k]);
  const pts = [];
  for (let i = 0; i < base.length - 1; i++) {
    const p = base[i], q = base[i+1];
    const n = Math.max(1, Math.round(Math.hypot(q[0]-p[0], q[1]-p[1]) / 7));
    for (let t = 0; t < n; t++) pts.push([p[0]+(q[0]-p[0])*t/n, p[1]+(q[1]-p[1])*t/n]);
  }
  pts.push(base[base.length-1]);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0 || i === pts.length-1) { out.push([+p[0].toFixed(2), +p[1].toFixed(2)]); continue; }
    const damp = Math.min(1, Math.min(i, pts.length-1-i) / 3);
    let dx = pts[i+1][0]-pts[i-1][0], dy = pts[i+1][1]-pts[i-1][1];
    const L = Math.hypot(dx, dy) || 1;
    const amp = (isCoast ? 3.1 : 2.2) * Math.sin(i*0.31 + seed*1.37)
              + (isCoast ? 1.6 : 1.2) * _hashNoise((seed+1)*13.31 + i*0.717);
    out.push([+(p[0] + (-dy/L)*amp*damp).toFixed(2), +(p[1] + (dx/L)*amp*damp).toFixed(2)]);
  }
  return out;
}
function catmullPath(pts, closed) {
  if (!pts || pts.length < 2) return '';
  const n = pts.length;
  const P = i => closed ? pts[(i+n)%n] : pts[Math.max(0, Math.min(n-1, i))];
  let d = `M${P(0)[0].toFixed(1)} ${P(0)[1].toFixed(1)}`;
  const last = closed ? n : n-1;
  for (let i = 0; i < last; i++) {
    const p0=P(i-1), p1=P(i), p2=P(i+1), p3=P(i+2);
    d += `C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  if (closed) d += 'Z';
  return d;
}

/* ---------- 拓扑：共享边界折线 + 区域环 ---------- */
function hexTopology(world) {
  const { hexes } = world;
  const ckey = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const geo = {}, raw = {};
  const emit = (a, b, p0, p1) => {
    const k0 = ckey(p0), k1 = ckey(p1);
    geo[k0] = p0; geo[k1] = p1;
    const norm = (b !== 'SEA') ? (a < b) : true;
    const pair = (b === 'SEA') ? a + '|SEA' : (a < b ? a + '|' + b : b + '|' + a);
    const dir = norm ? [k0, k1] : [k1, k0];
    (raw[pair] = raw[pair] || []).push({ s: dir[0], e: dir[1] });
  };
  for (const h of hexes) {
    if (!h.id) continue;
    const cs = _hexCorners(h.cx, h.cy);
    for (let s = 0; s < 6; s++) {
      const n = h.nbr ? h.nbr[s] : null;
      const other = n ? n.id : null;
      if (other === h.id) continue;
      const b = other === null ? 'SEA' : other;
      if (b !== 'SEA' && h.id > b) continue;
      emit(h.id, b, cs[_SIDES[s][0]], cs[_SIDES[s][1]]);
    }
  }
  const plines = [];
  for (const pair in raw) {
    const [a, b] = pair.split('|');
    const list = raw[pair].slice();
    while (list.length) {
      const head = list.shift();
      const keys = [head.s, head.e];
      for (let g2 = 0; g2 < 3000; g2++) {
        const i = list.findIndex(p => p.s === keys[keys.length-1]);
        if (i < 0) break;
        keys.splice(keys.length, 0, list.splice(i,1)[0].e);
      }
      for (let g2 = 0; g2 < 3000; g2++) {
        const i = list.findIndex(p => p.e === keys[0]);
        if (i < 0) break;
        keys.unshift(list.splice(i,1)[0].s);
      }
      plines.push({ id: plines.length, a, b, keys });
    }
  }
  const pieces = plines.map(pl => {
    const pts = _organicize(pl.keys, geo, pl.b === 'SEA', pl.id);
    return { id: pl.id, a: pl.a, b: pl.b, keys: pl.keys, pts, path: catmullPath(pts, false) };
  });
  const outMap = {};
  const byId = new Map(pieces.map(p => [p.id, p]));
  for (const p of pieces) {
    for (const R of [p.a, p.b]) {
      if (R === 'SEA') continue;
      const m = outMap[R] = outMap[R] || {};
      if (R === p.a) (m[p.keys[0]] = m[p.keys[0]] || []).push({ i: p.id, fwd: true });
      else (m[p.keys[p.keys.length-1]] = m[p.keys[p.keys.length-1]] || []).push({ i: p.id, fwd: false });
    }
  }
  const loops = {}; const used = new Set();
  for (const R in outMap) {
    const m = outMap[R]; const rl = [];
    for (const startKey in m) {
      while (m[startKey] && m[startKey].length) {
        const seed = m[startKey].shift();
        if (used.has(seed.i)) continue;
        used.add(seed.i);
        const loop = [[seed.i, seed.fwd]];
        let curEnd = (seed.fwd) ? byId.get(seed.i).keys[byId.get(seed.i).keys.length-1]
                                : byId.get(seed.i).keys[0];
        for (let g2 = 0; g2 < 3000; g2++) {
          if (curEnd === startKey) break;
          const cand = (m[curEnd] || []).find(x => !used.has(x.i));
          if (!cand) break;
          m[curEnd] = m[curEnd].filter(x => x !== cand);
          used.add(cand.i);
          loop.push([cand.i, cand.fwd]);
          curEnd = (cand.fwd) ? byId.get(cand.i).keys[byId.get(cand.i).keys.length-1]
                              : byId.get(cand.i).keys[0];
        }
        rl.push(loop);
      }
    }
    loops[R] = rl;
  }
  const centroid = {};
  for (const h of hexes) {
    if (!h.id) continue;
    const c = centroid[h.id] = centroid[h.id] || [0, 0, 0];
    c[0] += h.cx; c[1] += h.cy; c[2]++;
  }
  for (const k in centroid) { const c = centroid[k]; centroid[k] = [c[0]/c[2], c[1]/c[2]]; }
  return { geo, pieces, loops, centroid, catmullPath };
}
function catmullPathBackward(pc) { return catmullPath(pc.pts.slice().reverse(), false); }
function regionFillPath(topo, R) {
  const byId = new Map(topo.pieces.map(p => [p.id, p]));
  let d = '';
  for (const loop of (topo.loops[R] || []))
    for (const [i, fwd] of loop) {
      const pc = byId.get(i);
      d += fwd ? pc.path : catmullPathBackward(pc);
    }
  return d;
}

/* ---------- 自检 ---------- */
function check() {
  const { grid } = buildCells();
  const adj = buildAdj(grid);
  const geom = buildGeom(grid);
  let empty = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!grid[y][x]) empty++;
  const rpt = { empty, provinces: DEFS.length, byProvince: {}, adj };
  for (const d of DEFS) rpt.byProvince[d.id] = { cells: (geom[d.id] || {}).n || 0, adj: (adj[d.id] || []).length, owner: d.owner };
  return rpt;
}

const api = {
  PANEL, IMG, COLS, ROWS, CELLX, CELLY,
  DEFS, SEAS, CARVE,
  px, py, lonLatAt,
  defsById() { const m = {}; DEFS.forEach(d => m[d.id] = d); return m; },
  buildCells, buildAdj, buildGeom, check,
  HEXR, HEXW, HEXVS, HROWS, HCOLS,
  buildHexWorld, hexTopology, regionFillPath, catmullPath
};
return api;
})();
