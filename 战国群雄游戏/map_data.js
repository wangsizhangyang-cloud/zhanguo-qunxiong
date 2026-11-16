/* =============================================================================
   战国群雄 v3.6 · 自绘地理地图（HOI4式·城邑级省份·无底图）
   -----------------------------------------------------------------------------
   ★ 整幅地图由本文件绘制：不使用任何外部底图图像。
     · 海岸线（勃海/黄海/东海/日本海）、大河（黄河·河北故道、长江、淮、
       汉、济、渭、汾、泗、辽）、山脉（太行、吕梁、秦岭、大巴、崤、泰山…）、
       湖泽（太湖、洞庭、彭蠡、巢、云梦）、北徼草原界 —— 全部为自绘坐标折线。
     · 投影：二次多项式，来自此前对《戰國形勢圖（前350年）》（玖巧仔 @CC BY-SA 3.0，
       谭其骧《中国历史地图集》战国分幅之改绘）8 个控制点的真经纬↔像素拟合
       （残差≤3.1px），作为本作「真实经纬→面板」的统一坐标系；
       参考地理核心自文献：《史记》《战国策》原文（见 DEFS 的 vol/cite）。
   · 省份：城邑级 —— 每省以一史载城邑为锚点（真实经纬），加权 Voronoi 划格；
     海/北徼之外一律 null（留底色）。
   · 中原小国（周·宋·鲁·卫·中山·越）也是省份，但不涂色（底色透出），
     可点击、可被吞并；七雄涂国色（fill-opacity 0.55）。
   · 游戏层（六边形 R=10 有机边界 + Catmull-Rom 贝塞尔）与 v3.5 相同。
   ============================================================================= */
window.MAP = (function () {
'use strict';

/* ---------- 面板 / 投影 ---------- */
const PANEL = { W: 912, H: 560 };
/* 「经纬→面板像素」：此前以底图 8 个控制点二次拟合（残差≤3.1px）所得常数，
   作为本作的标准经纬投影坐标系（保留以维持与旧存档/教学关布局的一致性）。 */
const SCALE = 912 / 736;
const Y0 = -62.05;
const PCX = [-4822.31851, 55.06641, 42.44611, -0.08217, -0.32722, -0.11741];
const PCY = [689.36310, 12.32337, -26.05588, -0.09669, 0.24051, -0.48410];
function _fx(L, F) { return PCX[0] + PCX[1]*L + PCX[2]*F + PCX[3]*L*L + PCX[4]*L*F + PCX[5]*F*F; }
function _fy(L, F) { return PCY[0] + PCY[1]*L + PCY[2]*F + PCY[3]*L*L + PCY[4]*L*F + PCY[5]*F*F; }
function px(L, F) { return _fx(L, F) * SCALE; }
function py(L, F) { return _fy(L, F) * SCALE + Y0; }
function pxy(L, F) { return [px(L, F), py(L, F)]; }
/* 面板像素 → 经纬（牛顿迭代反解） */
function lonLatAt(sx, sy) {
  const nx = sx / SCALE, ny = (sy - Y0) / SCALE;
  let L = 112, F = 34;
  for (let k = 0; k < 40; k++) {
    const e = 1e-4;
    const f0 = _fx(L, F) - nx, f1 = _fy(L, F) - ny;
    const Jxx = (_fx(L+e,F)-_fx(L-e,F))/(2*e), JxF = (_fx(L,F+e)-_fx(L,F-e))/(2*e);
    const Jyx = (_fy(L+e,F)-_fy(L-e,F))/(2*e), JyF = (_fy(L,F+e)-_fy(L,F-e))/(2*e);
    const det = Jxx*JyF - JxF*Jyx;
    L -= (f0*JyF - JxF*f1) / det;
    F -= (Jxx*f1 - f0*Jyx) / det;
  }
  return [L, F];
}

/* ---------- 网格（采样格） ---------- */
const COLS = 46, ROWS = 28;
const CELLX = PANEL.W / COLS, CELLY = PANEL.H / ROWS;

/* ---------- 自绘地理场景（真实经纬坐标折线） ---------- */
/* 海岸线（闭合折线，陆侧在多边形内）：东北→日本海→朝鲜半岛西岸→辽东半岛
   →渤海湾周圈（西岸南下）→山东半岛→江苏→浙江→闽粤→底/左沿闭合 */
const COAST = [
  [92.0,42.30],[104.0,42.20],[117.0,42.00],[126.0,41.85],[129.30,41.65],
  [128.90,41.20],[128.35,40.10],[128.55,38.95],[128.70,37.80],[128.75,36.60],
  [128.50,35.50],[128.00,34.70],[126.85,34.45],[126.30,34.40],
  [126.45,34.90],[126.20,35.75],[125.95,36.55],[125.75,37.20],[125.60,38.05],
  [125.40,38.80],[125.10,39.60],[124.40,40.05],
  [123.60,39.50],[123.30,39.30],[122.85,38.85],
  [122.30,38.90],[122.05,39.05],[122.00,39.50],[122.05,40.10],[122.20,40.65],
  [121.95,41.00],[121.50,41.05],[121.00,40.80],[120.40,40.45],[119.75,40.05],
  [119.00,39.65],[118.40,39.40],[117.75,39.20],[117.55,38.90],[117.50,38.55],
  [118.00,38.15],[118.60,37.85],[119.35,37.45],[119.90,37.50],[120.75,37.80],
  [121.35,37.60],[122.20,37.35],[122.70,37.40],
  [122.20,36.85],[121.40,36.50],[120.35,36.05],[119.95,35.65],[119.55,35.25],
  [119.70,34.85],[120.20,34.30],[120.50,33.60],[120.90,32.70],[121.35,31.90],
  [121.70,31.55],[121.90,31.20],[121.75,30.85],[121.60,30.35],[121.55,29.90],
  [121.10,29.30],[120.60,28.55],[120.15,27.85],[119.55,27.05],[118.95,26.15],
  [118.35,25.40],[96.0,25.10],[92.0,25.15],[92.0,42.30]
];
/* 北徼草原界（纬线弧，其北为胡地/草原，不入七雄） */
const STEPPE_LINE = [
  [92.0,41.0],[97.5,41.7],[98.2,40.4],[99.5,39.9],[101.5,40.2],[103.5,41.0],
  [105.0,41.3],[107.0,41.2],[109.0,41.3],[111.0,41.4],[113.0,41.6],[115.0,41.5],
  [117.0,41.4],[119.0,41.2],[120.5,41.3],[122.0,41.10],[123.5,41.30],[125.0,41.35],
  [129.6,41.5]
];
/* 主要河流（折线） */
const RIVERS = {
 major: [
  /* 黄河（战国河北故道）：龙门—蒲阪—风陵渡—崤函—孟津—大伾—顿丘—大陆泽—入海 */
  {n:'黄河', w:2.6, pts:[[103.6,35.95],[104.8,35.75],[106.2,35.30],[107.4,35.10],[108.6,35.35],[109.9,35.60],[110.5,35.55],[110.35,34.85],[110.55,34.60],[111.2,34.75],[112.0,34.85],[112.55,34.90],[113.0,35.10],[113.5,35.30],[114.1,35.50],[114.7,35.85],[115.1,36.20],[115.6,36.75],[115.9,37.30],[116.3,37.70],[116.9,38.05],[117.3,38.45],[117.7,38.75],[118.3,38.30],[118.9,37.85],[119.5,37.55]]},
  /* 长江 */
  {n:'江', w:2.6, pts:[[98.5,29.6],[100.5,29.2],[102.0,29.0],[103.5,28.85],[104.6,28.9],[105.4,29.0],[106.3,29.35],[107.0,29.95],[108.3,30.75],[109.4,31.0],[110.6,30.95],[111.3,30.75],[112.2,30.40],[113.3,30.55],[114.35,30.60],[115.4,30.55],[116.3,30.65],[117.0,30.55],[117.9,31.15],[118.75,32.05],[119.4,32.20],[120.6,32.05],[121.35,31.70],[121.65,31.35]]},
  /* 淮水 */
  {n:'淮', w:2.0, pts:[[113.0,32.35],[114.1,32.15],[115.2,32.10],[116.5,32.40],[116.6,32.70],[117.35,32.90],[118.6,33.50],[119.2,33.70]]},
  /* 汉水 */
  {n:'汉', w:2.0, pts:[[106.6,32.85],[107.5,33.05],[108.2,32.60],[109.1,32.20],[110.0,32.15],[111.0,32.20],[112.15,32.05],[112.6,30.65]]},
  /* 济水 */
  {n:'济', w:1.8, pts:[[113.4,34.85],[114.6,35.30],[115.7,35.95],[116.6,36.35],[117.5,36.75],[118.8,37.35]]},
  /* 渭水 */
  {n:'渭', w:2.0, pts:[[104.6,34.7],[105.6,34.55],[106.6,34.40],[107.2,34.40],[108.1,34.35],[108.75,34.35],[110.35,34.55]]},
  /* 汾水 */
  {n:'汾', w:1.8, pts:[[112.1,38.85],[112.55,37.90],[112.3,37.20],[111.6,36.05],[111.3,35.70],[110.55,35.55]]},
  /* 泗水 */
  {n:'泗', w:1.6, pts:[[117.35,35.60],[116.95,35.55],[116.85,34.85],[117.2,34.30],[117.6,33.80],[118.6,33.50]]},
  /* 辽水 */
  {n:'辽', w:1.6, pts:[[123.7,41.90],[123.4,41.30],[123.0,40.90],[122.4,40.75]]}
 ],
 minor: [
  /* 漳水 */
  {n:'漳', w:1.2, pts:[[113.0,36.95],[113.9,37.30],[114.4,37.80],[114.6,38.20]]},
  /* 洛水（伊洛） */
  {n:'洛', w:1.2, pts:[[110.5,34.05],[111.0,34.25],[111.6,34.55],[112.4,34.70]]},
  /* 沅水 */
  {n:'沅', w:1.4, pts:[[108.9,28.1],[109.6,28.5],[110.4,28.95],[111.6,29.25],[112.4,29.4]]},
  /* 湘水 */
  {n:'湘', w:1.4, pts:[[112.9,27.0],[112.9,27.9],[112.95,28.60],[113.0,29.35],[112.45,29.55]]},
  /* 淄水 */
  {n:'淄', w:1.2, pts:[[118.05,37.05],[118.3,36.85],[118.35,36.5]]},
  /* 沂水 */
  {n:'沂', w:1.2, pts:[[118.2,35.8],[118.4,35.3],[118.5,34.8]]},
  /* 滦水（燕辽西界水） */
  {n:'滦', w:1.2, pts:[[116.8,41.65],[117.6,41.15],[118.4,40.55],[118.9,40.05]]}
 ]
};
/* 山脉（浅色脊线） */
const MOUNTS = [
  /* 太行 */
  {n:'太行', pts:[[113.7,35.05],[113.75,35.85],[113.9,36.75],[114.1,37.50],[114.35,38.35],[114.55,39.10]]},
  /* 吕梁 */
  {n:'吕梁', pts:[[110.9,35.60],[111.30,36.40],[111.40,37.20],[111.50,38.00],[111.80,38.80],[112.10,39.60]]},
  /* 阴山 */
  {n:'阴山', pts:[[107.0,41.60],[109.0,41.55],[111.0,41.70],[113.0,41.85],[115.0,41.75],[117.0,41.70]]},
  /* 秦岭 */
  {n:'秦岭', pts:[[103.5,33.6],[104.8,33.3],[106.0,33.15],[107.2,33.30],[108.5,33.65],[109.8,33.90],[110.9,34.10],[111.5,34.35]]},
  /* 大巴 */
  {n:'大巴', pts:[[105.7,32.35],[106.8,31.95],[108.0,31.70],[109.2,31.55],[110.2,31.55],[110.9,31.75]]},
  /* 崤山·函谷 */
  {n:'崤', pts:[[110.6,34.35],[111.2,34.45],[111.8,34.50]]},
  /* 中条山 */
  {n:'中条', pts:[[110.6,35.30],[111.4,35.45],[112.2,35.50]]},
  /* 王屋 */
  {n:'王屋', pts:[[112.15,35.62],[112.75,35.35]]},
  /* 秦岭东（伏牛+外方） */
  {n:'伏牛', pts:[[110.9,33.6],[111.6,33.30],[112.3,33.35]]},
  /* 泰山 */
  {n:'泰山', pts:[[116.9,36.05],[117.5,36.30],[118.2,36.35],[118.5,36.15]]},
  /* 大别 */
  {n:'大别', pts:[[114.9,31.55],[115.7,31.25],[116.5,31.00],[116.9,30.65]]},
  /* 巫山 */
  {n:'巫山', pts:[[109.2,31.45],[109.6,31.00],[109.9,30.65]]},
  /* 武陵（鄂西） */
  {n:'武陵', pts:[[109.3,29.35],[109.9,28.85],[110.3,28.35]]},
  /* 南岭北端（洞庭以南） */
  {n:'五岭?', pts:[[110.8,26.6],[111.8,26.1],[112.8,25.9]]},
  /* 千山（辽东半岛） */
  {n:'千山', pts:[[122.4,39.5],[123.1,39.05],[123.55,39.6],[123.75,40.4],[124.15,40.9]]},
  /* 六盘/陇山 */
  {n:'陇山', pts:[[106.0,35.15],[105.85,34.55],[106.15,34.05]]},
  /* 湔山（岷山南下·蜀北） */
  {n:'岷山', pts:[[102.8,31.8],[103.7,31.4],[104.8,31.25]]},
  /* 会稽（越地丘陵） */
  {n:'会稽山', pts:[[120.1,30.2],[120.4,29.9],[120.6,29.7]]},
  /* 燕山 */
  {n:'燕山', pts:[[116.2,40.85],[117.5,40.85],[118.9,40.75],[120.1,40.7]]}
];
/* 湖泽（椭圆 blob） */
const LAKES = [
  {n:'太湖',  lon:120.20, lat:31.05, rx:0.55, ry:0.36},
  {n:'彭蠡',  lon:116.25, lat:29.35, rx:0.60, ry:0.30},
  {n:'洞庭',  lon:112.70, lat:29.35, rx:0.75, ry:0.30},
  {n:'巢湖', lon:117.70, lat:31.55, rx:0.35, ry:0.18},
  {n:'云梦',  lon:113.30, lat:30.25, rx:0.45, ry:0.22},
  {n:'即?海', lon:119.85, lat:37.35, rx:0.50, ry:0.12}
];
/* 地形配色（HOI4式：低饱和·暗沉·让地形透出） */
const STYLE = {
  sea           : '#6e8494',
  land          : '#b8ab8d',
  landLine      : '#3d4a52',
  landLineWidth : 1.8,
  steppe        : '#a89e6e',
  mountain      : '#6f6250',
  mountainOp    : 0.30,
  mountainW     : 6.5,
  river         : '#4f7186',
  bigRiverOp    : 0.85,
  minorRiverOp  : 0.7,
  lake          : '#6e8494',
  lakeOp        : 1.0
};

/* ---------- 城邑级省份（锚点＝真实经纬；w＝面积权重） ---------- */
const DEFS = [
 /* ===== 秦 ===== */
 {id:'xianyang', name:'咸阳', owner:'QIN', cap:true, terrain:'平原', prod:{gold:5,food:5},
  lon:108.73, lat:34.38, w:0.95,
  vol:'秦都咸阳（渭水北岸·孝公十三年所徙）', cite:'《史记·秦本纪》“作为咸阳，筑冀阙，秦徙都之”'},
 {id:'hangu', name:'函谷', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:110.75, lat:34.68, w:1.60, claim:{lon1:109.40, lat1:34.36, lon2:111.95, lat2:35.05},
  vol:'崤函走廊（函谷关—陕邑）', cite:'《战国策·秦策一》“东有肴、函之固”'},
 {id:'yongyang', name:'栎阳', owner:'QIN', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:109.22, lat:34.47, claim:{lon1:108.95,lat1:34.2,lon2:109.42,lat2:34.72}, w:1.26,
  vol:'栎阳（献公、孝公初年之都）', cite:'《史记·秦本纪》“献公……二年，城栎阳”'},
 {id:'yong', name:'雍', owner:'QIN', cap:false, terrain:'平原', prod:{gold:3,food:4},
  lon:107.38, lat:34.52, w:0.9,
  vol:'雍城大郑宫（德公所居·五畤所祭）', cite:'《史记·秦本纪》“德公元年，初居雍城大郑宫”'},
 {id:'chencang', name:'陈仓', owner:'QIN', cap:false, terrain:'山地', prod:{gold:3,food:3},
  lon:106.72, lat:34.35, w:0.85,
  vol:'陈仓故道（文公祠陈仓北阪）', cite:'《史记·秦本纪》“文公……于陈仓北阪城祠之”'},
 {id:'longxi', name:'陇西·邽', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:105.68, lat:34.58, w:0.80,
  vol:'邽、冀戎地，秦武公初县之（天水·陇西东段）', cite:'《史记·秦本纪》“十年，伐邽、冀戎，初县之”'},
 {id:'didao', name:'狄道', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:103.70, lat:35.13, w:0.75,
  vol:'陇西军事重镇临洮（西陲）', cite:'《史记·匈奴列传》“秦有陇西、北地、上郡”'},
 {id:'wuguan', name:'武关', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:110.42, lat:33.76, w:1.03,
  vol:'武关（商於道之函·秦东南门）', cite:'《史记·秦始皇本纪》“上自南郡由武关归”'},
 {id:'shangyu', name:'商於', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:110.90, lat:33.72, w:0.85,
  vol:'商於十五邑（卫鞅封地商邑）', cite:'《史记·商君列传》“秦封之於、商十五邑”'},
 {id:'lantian', name:'蓝田', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:109.32, lat:34.15, w:1.08,
  vol:'蓝田（秦楚大战处）', cite:'《史记·秦本纪》“（楚怀王）战於蓝田，大败楚军”'},
 {id:'pinyang', name:'频阳·重泉', owner:'QIN', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:109.45, lat:35.05, w:0.9,
  vol:'频阳（美原·王翦故里）、重泉（简公六年所城）', cite:'《史记·秦本纪》“初县频阳；城重泉”'},
 {id:'nanzheng', name:'南郑（汉中）', owner:'QIN', cap:false, terrain:'山地', prod:{gold:3,food:4},
  lon:107.02, lat:33.05, w:0.9,
  vol:'汉中郡治南郑（张仪取地六百里所置）', cite:'《史记·秦本纪》“又攻楚汉中，取地六百里，置汉中郡”'},
 {id:'chengdu', name:'成都', owner:'QIN', cap:false, terrain:'平原', prod:{gold:4,food:5},
  lon:104.07, lat:30.66, w:0.80,
  vol:'蜀郡成都（沃野·李冰穿二江）', cite:'《史记·河渠书》“蜀守冰凿离碓……穿二江成都之中”'},
 {id:'jiangzhou', name:'江州（巴）', owner:'QIN', cap:false, terrain:'山地', prod:{gold:3,food:4},
  lon:106.56, lat:29.57, w:0.80,
  vol:'巴郡江州（巴子都会）', cite:'《战国策·秦策一》“西有巴、蜀之利”'},
 {id:'beidi', name:'北地', owner:'QIN', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:107.60, lat:35.35, w:0.85,
  vol:'北地郡·义渠故地', cite:'《史记·匈奴列传》“秦……置陇西、北地、上郡”'},
 /* ===== 赵 ===== */
 {id:'handan', name:'邯郸', owner:'ZHAO', cap:true, terrain:'平原', prod:{gold:5,food:4},
  lon:114.48, lat:36.60, w:1.13,
  vol:'赵都邯郸（敬侯所徙）', cite:'《史记·赵世家》“敬侯元年，始都邯郸”'},
 {id:'jinyang', name:'晋阳', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:4,food:3},
  lon:112.55, lat:37.87, w:0.95,
  vol:'晋阳（赵氏宗邑·三分晋之基）', cite:'《史记·赵世家》“（襄子）乃奔保晋阳”'},
 {id:'lishi', name:'离石', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:111.13, lat:37.52, w:0.85,
  vol:'离石、蔺（秦北取之赵地）', cite:'《战国策·秦策一》“攻赵，取蔺、离石、祁”'},
 {id:'dai', name:'代', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:114.20, lat:39.75, w:0.85,
  vol:'代郡代王城（赵襄子灭代所置）', cite:'《史记·赵世家》“（襄子）请代王……杀代王”'},
 {id:'yunzhong', name:'云中·九原', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:111.60, lat:40.50, w:0.95,
  vol:'云中、九原（赵武灵王所置）', cite:'《史记·匈奴列传》“赵武灵王……筑长城，自代并阴山下，至高阙为塞”'},
 {id:'yanmen', name:'雁门', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:112.35, lat:39.85, w:0.85,
  vol:'雁门（秦赵战处·赵北塞）', cite:'《史记·秦本纪》“二十四年，与晋战雁门”'},
 {id:'xindu', name:'信都', owner:'ZHAO', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:114.55, lat:37.32, w:0.9,
  vol:'信都（赵别都）', cite:'《史记·张耳陈馀列传》“居信都”'},
 {id:'julu', name:'巨鹿', owner:'ZHAO', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:114.72, lat:37.95, w:0.9,
  vol:'巨鹿（大陆泽之滨）', cite:'《资治通鉴》“以示士卒必死，无一还心。（救巨鹿）”'},
 {id:'shiyi', name:'石邑', owner:'ZHAO', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:114.31, lat:38.08, w:0.85,
  vol:'石邑（井陉之塞）', cite:'《史记·赵世家》“王军取鄗、石邑、封龙、东垣”'},
 /* ===== 燕 ===== */
 {id:'ji', name:'蓟', owner:'YAN', cap:true, terrain:'平原', prod:{gold:5,food:3},
  lon:116.40, lat:39.90, w:0.95,
  vol:'燕都蓟（召公之封）', cite:'《史记·燕召公世家》“封召公于北燕”'},
 {id:'wuyang', name:'燕下都·武阳', owner:'YAN', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:115.82, lat:39.18, w:0.9,
  vol:'燕下都（易水之滨·昭王招贤筑台之地）', cite:'《战国策·燕策一》“乐毅自魏往，邹衍自齐往，剧辛自赵往”'},
 {id:'shanggu', name:'上谷', owner:'YAN', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:115.55, lat:40.42, w:0.9,
  vol:'上谷郡（居庸以北）', cite:'《史记·匈奴列传》“燕……置上谷、渔阳”'},
 {id:'yuyang', name:'渔阳', owner:'YAN', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:117.10, lat:40.35, w:0.9,
  vol:'渔阳郡', cite:'《史记·匈奴列传》“置上谷、渔阳……以拒胡”'},
 {id:'wuzhong', name:'无终', owner:'YAN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:117.42, lat:39.98, w:0.85,
  vol:'无终（山戎故种·燕东陲）', cite:'《左传·襄公四年》“无终子嘉父使孟乐如晋”'},
 {id:'gudu', name:'孤竹', owner:'YAN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:119.05, lat:40.05, w:0.9,
  vol:'孤竹（桓公伐山戎所次）', cite:'《史记·齐太公世家》“齐桓公伐山戎，次于孤竹”'},
 {id:'liaoxi', name:'辽西', owner:'YAN', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:120.40, lat:41.20, w:1,
  vol:'辽西郡（造阳—碣石）', cite:'《史记·匈奴列传》“置上谷……辽西、辽东郡以拒胡”'},
 {id:'liaodong', name:'辽东', owner:'YAN', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:122.85, lat:41.15, w:1,
  vol:'辽东郡襄平', cite:'《史记·匈奴列传》“燕亦筑长城，自造阳至襄平”'},
 /* ===== 魏 ===== */
 {id:'anyi', name:'安邑', owner:'WEI', cap:false, terrain:'平原', prod:{gold:5,food:3},
  lon:111.23, lat:35.03, w:1.60,
  vol:'魏故都安邑（安邑近秦而徙）', cite:'《史记·魏世家》“安邑近秦……于是徙治大梁”'},
 {id:'quwo', name:'曲沃', owner:'WEI', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:110.85, lat:35.55, w:1.21,
  vol:'曲沃（晋宗庙故地）', cite:'《史记·晋世家》“十九年，晋曲沃始为晋侯”'},
 {id:'puban', name:'蒲阪', owner:'WEI', cap:false, terrain:'山地', prod:{gold:3,food:3},
  lon:110.38, lat:34.88, w:1.60,
  vol:'蒲阪（秦魏必争之渡）', cite:'《史记·秦本纪》“四年，取蒲阪”'},
 {id:'pishi', name:'皮氏', owner:'WEI', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:110.75, lat:35.20, w:1.60,
  vol:'皮氏（秦渡河所取）', cite:'《史记·秦本纪》“九年，渡河，取汾阴、皮氏”'},
 {id:'shaoliang', name:'少梁', owner:'WEI', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:110.47, lat:35.48, w:1.21,
  vol:'少梁（河西重镇·秦魏战公孙痤）', cite:'《史记·秦本纪》“二十三年，与魏晋战少梁，虏其将公孙痤”'},
 {id:'shangjun', name:'上郡·肤施', owner:'WEI', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:109.50, lat:36.65, w:0.95,
  vol:'魏上郡（前328拨前属魏）', cite:'《史记·秦本纪》“魏纳上郡十五县”'},
 {id:'diaoyin', name:'雕阴', owner:'WEI', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:109.32, lat:36.22, w:0.85,
  vol:'雕阴（魏筑城·秦魏战处）', cite:'《史记·魏世家》“杀龙贾，遂取雕阴”'},
 {id:'daliang', name:'大梁', owner:'WEI', cap:true, terrain:'平原', prod:{gold:7,food:4},
  lon:114.35, lat:34.79, w:1.49,
  vol:'魏都大梁（鸿沟之滨）', cite:'《史记·魏世家》“徙治大梁”'},
 {id:'ye', name:'邺', owner:'WEI', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:114.42, lat:36.05, w:1.44,
  vol:'邺（西门豹所治·凿十二渠）；中牟为献侯旧都', cite:'《史记·滑稽列传》“西门豹为邺令”'},
 {id:'chaoge', name:'朝歌', owner:'WEI', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:114.18, lat:35.62, w:1.60,
  vol:'朝歌（纣都·殷墟）', cite:'《史记·项羽本纪》“（殷王）王河内，都朝歌”'},
 {id:'zhi', name:'轵', owner:'WEI', cap:false, terrain:'山地', prod:{gold:3,food:2},
  lon:112.75, lat:35.15, w:1.26,
  vol:'轵（太行轵关陉之口）', cite:'《史记·秦本纪》“十六年，左更错取轵及邓”'},
 {id:'shanyang', name:'山阳', owner:'WEI', cap:false, terrain:'平原', prod:{gold:3,food:2},
  lon:113.24, lat:35.25, w:1.60,
  vol:'山阳（河内之邑·嫪毐封地）', cite:'《史记·秦始皇本纪》“予之山阳地”'},
 /* ===== 韩 ===== */
 {id:'xinzheng', name:'新郑', owner:'HAN', cap:true, terrain:'平原', prod:{gold:5,food:3},
  lon:113.73, lat:34.40, claim:{lon1:113.25, lat1:34.15, lon2:114.12, lat2:34.60}, w:1.60,
  vol:'韩都新郑（郑武公所徙）', cite:'《史记·韩世家》“（哀侯）二年，灭郑”'},
 {id:'yangzhai', name:'阳翟', owner:'HAN', cap:false, terrain:'平原', prod:{gold:5,food:3},
  lon:113.49, lat:34.14, w:1.26,
  vol:'阳翟（大贾之都·吕不韦故里）', cite:'《史记·吕不韦列传》“吕不韦者，阳翟大贾人也”'},
 {id:'yiyang', name:'宜阳', owner:'HAN', cap:false, terrain:'山地', prod:{gold:4,food:3},
  lon:111.16, lat:34.42, w:1.60,
  vol:'宜阳（城方八里·材士十万，铁官）', cite:'《战国策·韩策一》“宜阳城方八里，材士十万”'},
 {id:'chenggao', name:'成皋·荥阳', owner:'HAN', cap:false, terrain:'平原', prod:{gold:4,food:2},
  lon:113.42, lat:34.95, claim:{lon1:113.3,lat1:34.8,lon2:113.58,lat2:35.05}, w:1.60,
  vol:'成皋（虎牢·韩东陲）荥阳', cite:'《史记·秦本纪》“韩献成皋、巩”'},
 {id:'shangdang', name:'上党', owner:'HAN', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:113.05, lat:36.19, w:0.9,
  vol:'韩上党（壶关·高平高地）', cite:'《史记·赵世家》“上党守冯亭以上党降赵”'},
 {id:'xincheng', name:'新城', owner:'HAN', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:111.95, lat:34.45, w:1.60,
  vol:'新城（伊阙之北·白起首攻）', cite:'《史记·秦本纪》“左更白起攻新城”'},
 /* ===== 齐 ===== */
 {id:'linzi', name:'临淄', owner:'QI', cap:true, terrain:'平原', prod:{gold:7,food:4},
  lon:118.25, lat:36.81, w:0.95,
  vol:'齐都临淄（七万户）', cite:'《战国策·齐策一》“临淄之中七万户”'},
 {id:'gaotang', name:'高唐', owner:'QI', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:116.41, lat:36.86, w:0.85,
  vol:'高唐（齐西境·晋伐齐至高唐）', cite:'《史记·田敬仲完世家》“晋伐齐，至高唐”'},
 {id:'pinglu', name:'平陆', owner:'QI', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:116.48, lat:35.73, w:0.85,
  vol:'平陆（汶上·齐西南重城）', cite:'《史记·赵世家》“十九年，与齐、宋会平陆”'},
 {id:'chunyu', name:'淳于', owner:'QI', cap:false, terrain:'平原', prod:{gold:3,food:2},
  lon:117.35, lat:36.42, w:0.85,
  vol:'淳于（淳于髡之乡·安丘东）', cite:'《史记·魏世家》“邹衍、淳于髡、孟轲皆至梁”'},
 {id:'ju', name:'莒', owner:'QI', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:118.83, lat:35.99, w:0.9,
  vol:'莒（齐东境大邑、小白所依）', cite:'《史记·齐太公世家》“（小白）奔莒”'},
 {id:'jimo', name:'即墨', owner:'QI', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:119.98, lat:36.38, w:0.9,
  vol:'即墨之饶（田单复国处）', cite:'《史记·田单列传》“齐城不下者二，莒、即墨”'},
 {id:'langya', name:'琅邪', owner:'QI', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:119.85, lat:35.70, w:0.85,
  vol:'琅邪（齐东海之台·东海门）', cite:'《战国策·齐策一》“东有琅邪”'},
 /* ===== 楚 ===== */
 {id:'ying', name:'郢都·江汉', owner:'CHU', cap:true, terrain:'水乡', prod:{gold:5,food:6},
  lon:112.19, lat:30.42, w:0.95,
  vol:'楚都郢（纪南城·江汉平原）', cite:'《史记·楚世家》“白起遂拔我郢”'},
 {id:'yan_ch', name:'鄢', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:3,food:4},
  lon:112.26, lat:31.72, w:0.85,
  vol:'鄢（宜城·楚北陲大邑）', cite:'《史记·楚世家》“白起攻楚，拔鄢、邓五城”'},
 {id:'yiling', name:'夷陵', owner:'CHU', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:111.29, lat:30.70, w:0.85,
  vol:'夷陵（楚先王墓所在）', cite:'《史记·楚世家》“烧先王墓夷陵”'},
 {id:'jingling', name:'竞陵', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:3,food:4},
  lon:113.16, lat:30.65, w:0.85,
  vol:'竞陵（天门·白起所至）', cite:'《史记·楚世家》“遂东至竟陵”'},
 {id:'yun_ch', name:'郧', owner:'CHU', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:110.95, lat:32.75, w:0.85,
  vol:'郧（十堰郧县·昭王奔郧）', cite:'《史记·楚世家》“（昭王）奔郧”'},
 {id:'deng', name:'邓·穰', owner:'CHU', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:112.10, lat:32.70, w:0.85,
  vol:'邓城、穰（南阳盆地东端）', cite:'《史记·秦本纪》“十六年，左更错取轵及邓”'},
 {id:'wanling', name:'宛·南阳', owner:'CHU', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:112.53, lat:32.99, w:0.85,
  vol:'宛（铁官·申伯之国）', cite:'《史记·秦本纪》“攻楚，取宛”'},
 {id:'sui', name:'随', owner:'CHU', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:113.38, lat:31.71, w:0.85,
  vol:'随（汉东大国·曾侯乙故地）', cite:'《左传·桓公六年》“汉东之国随为大”'},
 {id:'shangcai', name:'上蔡', owner:'CHU', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:114.42, lat:33.10, w:0.85,
  vol:'上蔡（李斯故里·蔡迁所至）', cite:'《战国策·楚策一》“上蔡之郡”'},
 {id:'huaibei', name:'陈', owner:'CHU', cap:false, terrain:'平原', prod:{gold:4,food:3},
  lon:114.88, lat:33.73, w:0.9,
  vol:'陈（宛丘·楚北陲重镇）', cite:'《史记·楚世家》“东北保於陈城”'},
 {id:'xiacai', name:'下蔡', owner:'CHU', cap:false, terrain:'平原', prod:{gold:3,food:2},
  lon:116.40, lat:32.60, w:0.85,
  vol:'下蔡（州来迁地·甘茂故里）', cite:'《史记·甘茂列传》“甘茂者，下蔡人也”'},
 {id:'zhongli', name:'钟离', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:2,food:3},
  lon:117.60, lat:32.55, w:0.8,
  vol:'钟离（淮滨·吴楚争处）', cite:'《史记·吴太伯世家》“拔居巢、锺离”'},
 {id:'zhaoguan', name:'昭关', owner:'CHU', cap:false, terrain:'山地', prod:{gold:2,food:2},
  lon:118.05, lat:31.60, w:0.8,
  vol:'昭关（伍子胥过关处）', cite:'《史记·伍子胥列传》“到昭关，昭关欲执之”'},
 {id:'juchao', name:'居巢', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:2,food:3},
  lon:117.95, lat:31.35, w:0.8,
  vol:'居巢（巢湖之滨）', cite:'《史记·吴太伯世家》“公子光伐楚，拔居巢”'},
 {id:'ezhou', name:'鄂', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:2,food:3},
  lon:114.75, lat:30.30, w:0.85,
  vol:'鄂（鄂王城·大冶）', cite:'《史记·楚世家》“熊渠……中子红为鄂王”'},
 {id:'shaxian', name:'沙羡', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:2,food:3},
  lon:114.32, lat:30.40, w:0.85,
  vol:'沙羡（江夏·楚东陲）', cite:'《资治通鉴》“程普领江夏太守，治沙羡”'},
 {id:'wu_ch', name:'巫', owner:'CHU', cap:false, terrain:'山地', prod:{gold:2,food:3},
  lon:110.05, lat:31.07, w:0.85,
  vol:'巫郡（楚西陲·巫山）', cite:'《史记·楚世家》“秦复拔我巫、黔中郡”'},
 {id:'qianzhong', name:'黔中', owner:'CHU', cap:false, terrain:'山地', prod:{gold:2,food:4},
  lon:110.40, lat:28.85, w:0.95,
  vol:'黔中郡（沅水流域）', cite:'《史记·秦本纪》“司马错发陇西，因蜀攻楚黔中，拔之”'},
 {id:'dongting', name:'洞庭·苍梧', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:2,food:5},
  lon:112.45, lat:28.95, w:1,
  vol:'南有洞庭、苍梧（湘水）', cite:'《战国策·楚策一》“南有洞庭、苍梧”'},
 {id:'changsha', name:'长沙', owner:'CHU', cap:false, terrain:'水乡', prod:{gold:2,food:4},
  lon:112.98, lat:28.35, w:0.9,
  vol:'长沙（南楚·贾谊所贬）', cite:'《史记·屈原贾生列传》“为长沙王太傅”'},
 /* ===== 越 ===== */
 {id:'wusuh', name:'吴墟', owner:'YUE', cap:true, terrain:'水乡', prod:{gold:4,food:5},
  lon:120.62, lat:31.32, w:0.9,
  vol:'吴故墟（阖闾城·越并吴）', cite:'《史记·秦始皇本纪》“还过吴”'},
 {id:'kuaiji', name:'会稽', owner:'YUE', cap:false, terrain:'水乡', prod:{gold:3,food:5},
  lon:120.52, lat:29.98, w:0.9,
  vol:'会稽（越都·勾践所栖）', cite:'《史记·越王勾践世家》“越兵横行於江、淮东，号称霸王”'},
 {id:'yanling', name:'延陵', owner:'YUE', cap:false, terrain:'水乡', prod:{gold:3,food:4},
  lon:119.90, lat:31.85, w:0.85,
  vol:'季札封地延陵', cite:'《史记·吴太伯世家》“季札封於延陵，故号曰延陵季子”'},
 /* ===== 宋（小国·不涂色）===== */
 {id:'suiyang', name:'睢阳', owner:'SONG', cap:true, terrain:'平原', prod:{gold:4,food:3},
  lon:115.62, lat:34.40, w:0.9,
  vol:'宋都商丘（微子所封）', cite:'《史记·宋微子世家》“而立微子於宋”'},
 {id:'tao', name:'陶·定陶', owner:'SONG', cap:false, terrain:'平原', prod:{gold:5,food:3},
  lon:115.58, lat:35.07, w:1.13,
  vol:'陶邑（天下之中·范蠡所居）', cite:'《史记·货殖列传》“（陶）为天下之中”'},
 {id:'pengcheng', name:'彭城', owner:'SONG', cap:false, terrain:'平原', prod:{gold:3,food:3},
  lon:117.18, lat:34.20, w:0.85,
  vol:'彭城（宋东陲·大泽之滨）', cite:'《史记·秦始皇本纪》“始皇……过彭城”'},
 /* ===== 卫 ===== */
 {id:'diqiu', name:'帝丘', owner:'W', cap:true, terrain:'平原', prod:{gold:2,food:3},
  lon:115.05, lat:35.55, w:1.21,
  vol:'卫都帝丘（濮阳）', cite:'《左传·僖公三十一年》“十二月，卫迁于帝丘”'},
 /* ===== 鲁 ===== */
 {id:'qufu', name:'曲阜', owner:'LU', cap:true, terrain:'平原', prod:{gold:4,food:3},
  lon:116.99, lat:35.60, w:0.85,
  vol:'鲁都曲阜（周公之封）', cite:'《史记·周本纪》“封弟周公旦于曲阜，曰鲁”'},
 /* ===== 中山 ===== */
 {id:'lingshou', name:'灵寿', owner:'ZS', cap:true, terrain:'平原', prod:{gold:3,food:2},
  lon:114.42, lat:38.26, w:0.9,
  vol:'中山都灵寿（白狄别种）', cite:'《史记·乐毅列传》“魏文侯封乐羊以灵寿”'},
 /* ===== 周 ===== */
 {id:'luoyi', name:'雒邑·王畿', owner:'ZHOU', cap:true, terrain:'平原', prod:{gold:2,food:2},
  lon:112.45, lat:34.64, w:1.57,
  vol:'周王畿·雒邑（天下之中）', cite:'《史记·周本纪》“东迁于雒邑”'}
];

/* ---------- 边徼中立锚点（无主：月氏/匈奴/诸羌/西南夷/东胡/朝鲜） ----------
   参与最近锚点竞争、但 owner 为 null → 格子留 null（底图留白），
   防止七雄锚点把GameManager 与边徼吞进（同 v3.5 的 SEAS 之职能）。 */
const OUTLANDS = [
 {id:'月氏',  lon:98.2,  lat:40.7, w:1.2},
 {id:'匈奴',  lon:104.0, lat:42.3, w:1.2},
 {id:'林胡',  lon:108.5, lat:41.05, w:1.00},
 {id:'楼烦',  lon:112.5, lat:41.15, w:0.95},
 {id:'诸羌',  lon:99.5,  lat:37.0, w:1.3},
 {id:'氐羌',  lon:99.0,  lat:33.0, w:1.25},
 {id:'夜郎',  lon:104.0, lat:26.8, w:1.05},
 {id:'滇',    lon:100.3, lat:27.6, w:1.05},
 {id:'巴西', lon:103.0, lat:29.0, w:1.05},
 {id:'东胡',  lon:123.8, lat:41.4, w:0.95},
 {id:'貊',   lon:126.8, lat:41.6, w:1.05},
 {id:'朝鲜',  lon:126.8, lat:39.5, w:1.15}
];

/* ---------- 教学关割地（真实位置＋声明盒以防切空） ----------
   镐京＝沣镐（西安西南·幽王崩处周边）；犬丘＝西犬丘（礼县·陇山之西） */
const CARVE = [
 {pid:'haojing',  lon:108.72, lat:34.22, rKm:26,
  claim:{lon1:108.18, lat1:33.70, lon2:109.10, lat2:34.62},
  note:'镐京＝沣镐（渭河南岸）'},
 {pid:'quanrong', lon:105.55, lat:34.30, rKm:30,
  claim:{lon1:104.70, lat1:33.60, lon2:106.10, lat2:34.75},
  note:'犬丘＝西犬丘（陇山之西）'}
];

/* ---------- 距离（km） ---------- */
function kmDist(lon1, lat1, lon2, lat2) {
  const mx = (lat1 + lat2) / 2 * Math.PI / 180;
  const dx = (lon2 - lon1) * 111.32 * Math.cos(mx);
  const dy = (lat2 - lat1) * 111.32;
  return Math.hypot(dx, dy);
}

/* ---------- 点在多边形内（自绘掩膜用，O(n) 射线法） ---------- */
function inPoly(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}
/* 在折线上方/下方（STEPPE_LINE 以北 = 草原） */
function northOfLine(lon, lat) {
  for (let i = 0; i < STEPPE_LINE.length - 1; i++) {
    const a = STEPPE_LINE[i], b = STEPPE_LINE[i+1];
    if (lon >= a[0] && lon < b[0]) {
      const t = (lon - a[0]) / (b[0] - a[0]);
      return lat >= a[1] + (b[1] - a[1]) * t + 0.05;
    }
  }
  return false;
}

/* ---------- 领土划分：格子采样（逆投影→真实经纬→加权最近锚点 + 海/草原掩膜） ---------- */
function buildCells(provActive) {
  const act = {}; (provActive || []).forEach(p => { act[p] = true; });
  const grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const [lon, lat] = lonLatAt((c + 0.5) * CELLX, (r + 0.5) * CELLY);
    let best = null, bd = Infinity;
    for (const d of DEFS.concat(OUTLANDS)) {
      const dist = kmDist(lon, lat, d.lon, d.lat) / (d.w || 1);
      if (dist < bd) { bd = dist; best = d; }
    }
    grid[r][c] = best && best.owner ? best.id : null;
    /* 海 / 北徼：自绘掩膜置空 */
    if (!inPoly([lon, lat], COAST) || northOfLine(lon, lat)) grid[r][c] = null;
  }
  /* claim（崤函走廊——常驻；教学关割地声明盒——仅教学关激活时）
     claim 盒以「面板像素矩形」判定（其经纬盒按四角投影取包络）；
     若一格未命中，则保底取距盒中心最近的格（防切空）。 */
  const claimList = DEFS.concat(act['haojing'] ? CARVE.filter(c => act[c.pid]) : []);
  for (const d of claimList) {
    if (!d.claim) continue;
    const cs = [pxy(d.claim.lon1, d.claim.lat1), pxy(d.claim.lon1, d.claim.lat2),
                pxy(d.claim.lon2, d.claim.lat1), pxy(d.claim.lon2, d.claim.lat2)];
    const x1 = Math.min(...cs.map(p => p[0])), x2 = Math.max(...cs.map(p => p[0]));
    const y1 = Math.min(...cs.map(p => p[1])), y2 = Math.max(...cs.map(p => p[1]));
    let grabbed = 0, bestCell = [0, 0], bestDist = Infinity;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cx = (c + 0.5) * CELLX, cy = (r + 0.5) * CELLY;
      const dd = Math.hypot(cx - (x1 + x2) / 2, cy - (y1 + y2) / 2);
      if (dd < bestDist) { bestDist = dd; bestCell = [r, c]; }
      if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) { grid[r][c] = d.id || d.pid; grabbed++; }
    }
    if (!grabbed) grid[bestCell[0]][bestCell[1]] = d.id || d.pid;
  }
  /* 教学关割地（圆域 + 保底最近格） */
  const carved = {};
  for (const cc of CARVE) {
    if (!act[cc.pid]) continue;
    carved[cc.pid] = [];
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

/* ---------- 六边形层（R=10·整数单位·按格采样归属） ----------
   共享角点用 1/100px 整数坐标精确相等（杜绝浮点舍入差分）；
   单位: 1 单位 = 0.01 px。HEXW=1732·HEXVS=1500·R=1000（单位），
   corner offsets 由 60° 三角精确整数给出。 */
const HEXR = 10;            // 像素半径（显示用）
const HEXW = 17.32;         // 像素宽（≈ √3·R）
const HEXVS = 15;           // 像素层高
const HROWS = Math.ceil(PANEL.H / HEXVS) + 1;
const HCOLS = Math.ceil(PANEL.W / HEXW) + 2;

const _HX = {
  W: 1732, VS: 1500, HALF: 866,
  DX: [866, 866, 0, -866, -866, 0],
  DY: [-500, 500, 1000, 500, -500, -1000]
};
const _SIDES = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]];
const _SIDE_NBR = [
  {even:[+1,0], odd:[+1,0]}, {even:[0,+1], odd:[+1,+1]},
  {even:[-1,+1], odd:[0,+1]},{even:[-1,0], odd:[-1,0]},
  {even:[-1,-1], odd:[0,-1]},{even:[0,-1], odd:[+1,-1]}
];
function _hexKey(c, r) { return c + '_' + r; }
function _hexCenter(c, r) { return [_HX.W * c + (r % 2 ? _HX.HALF : 0), _HX.VS * r]; }
function _hexCorners(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push([cx + _HX.DX[i], cy + _HX.DY[i]]);
  return pts;
}
/* 共享角点确定性微扰（±1.2px）——相邻 hex 同角同值，格铺与描边一致 */
function _cornerWobble(pxInt, pyInt) {
  const n = (pxInt * 73856093) ^ (pyInt * 19349663);
  const s = Math.sin(n * 0.000001) * 43758.5453;
  return { dx: (s - Math.floor(s) - 0.5) * 2.4, dy: _hashNoise01(n) * 1.2 };
}
function _hashNoise01(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 1.2;
}
function _hx2px(p) {
  const wx = _cornerWobble(p[0], p[1]);
  return [+(p[0] / 100 + wx.dx).toFixed(2), +(p[1] / 100 + wx.dy).toFixed(2)];
}
function buildHexWorld(provActive) {
  const w = {};
  w.provActive = provActive;
  const sq = buildCells(provActive).grid;
  const byKey = {}; const hexes = [];
  for (let r = 0; r < HROWS; r++) for (let c = 0; c < HCOLS; c++) {
    const h = { c, r, id: null };
    hexes.push(h); byKey[_hexKey(c, r)] = h;
  }
  for (const h of hexes) {
    const [cx, cy] = _hexCenter(h.c, h.r); h.cx = cx; h.cy = cy;
    const gc = Math.floor(cx / 100 / CELLX), gr = Math.floor(cy / 100 / CELLY);
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
  return { hexes, byKey, provActive, grid: sq };
}

/* ---------- 模块级：噪声 / Chaikin 切角 / Catmull-Rom ---------- */
function _hashNoise(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}
/* Chaikin 切角：把六边形折线齿合抹成圆润波浪（closed=闭环与非闭环都支持） */
function _chaikin(base, closed) {
  const out = [];
  const n = base.length;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p = base[i], q = base[(i + 1) % n];
    out.push([+(p[0]*0.75 + q[0]*0.25).toFixed(2), +(p[1]*0.75 + q[1]*0.25).toFixed(2)]);
    out.push([+(p[0]*0.25 + q[0]*0.75).toFixed(2), +(p[1]*0.25 + q[1]*0.75).toFixed(2)]);
  }
  if (!closed && n) out.push(base[n - 1]);
  return out;
}
function _organicize(keys, geo, isCoast, seed, closed) {
  let base = keys.map(k => geo[k]);
  if (base.length < 2) return base;
  /* 两道切角（锯齿振幅 ≈ 1/4），开链时锚住两端 */
  base = _chaikin(_chaikin(base, closed), closed);
  /* 插值（每 9px 一点） */
  const pts = [];
  for (let i = 0; i < base.length - 1; i++) {
    const p = base[i], q = base[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(q[0]-p[0], q[1]-p[1]) / 9));
    for (let t = 0; t < n; t++) pts.push([p[0]+(q[0]-p[0])*t/n, p[1]+(q[1]-p[1])*t/n]);
  }
  pts.push(base[base.length - 1]);
  /* 轻噪声（振幅较先前减半，仅轻微起伏） */
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!closed && (i === 0 || i === pts.length - 1)) { out.push([+p[0].toFixed(2), +p[1].toFixed(2)]); continue; }
    const damp = closed ? 1 : Math.min(1, Math.min(i, pts.length - 1 - i) / 3);
    let dx = pts[(i + 1) % pts.length][0] - pts[(i - 1 + pts.length) % pts.length][0];
    let dy = pts[(i + 1) % pts.length][1] - pts[(i - 1 + pts.length) % pts.length][1];
    const L = Math.hypot(dx, dy) || 1;
    const amp = (isCoast ? 1.5 : 1.0) * Math.sin(i * 0.27 + seed * 1.37)
              + (isCoast ? 0.65 : 0.5) * _hashNoise((seed + 1) * 13.31 + i * 0.717);
    out.push([+(p[0] + (-dy / L) * amp * damp).toFixed(2), +(p[1] + (dx / L) * amp * damp).toFixed(2)]);
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
function catmullPathBackward(pc) { return catmullPath(pc.pts.slice().reverse(), false); }

/* ---------- 拓扑：共享边界折线（整型角点键，跨hex精确相等） + 区域环 ---------- */
function hexTopology(world) {
  const hexes = world.hexes;
  const geo = {};
  const pairEdges = {};     // 'a|b' -> [{s, e}]
  for (const h of hexes) {
    if (!h.id) continue;
    const cs = _hexCorners(h.cx, h.cy);
    for (let s = 0; s < 6; s++) {
      const n = h.nbr ? h.nbr[s] : null;
      const other = n ? n.id : null;
      if (other === h.id) continue;
      const k0 = cs[s][0] + ',' + cs[s][1];
      const k1 = cs[(s + 1) % 6][0] + ',' + cs[(s + 1) % 6][1];
      geo[k0] = _hx2px(cs[s]); geo[k1] = _hx2px(cs[(s + 1) % 6]);
      if (other !== null && h.id > other) continue;   // pair 边统一 a<b 走向（SEA 除外）
      const pair = (other === null) ? (h.id + '|SEA') : (h.id < other ? h.id + '|' + other : other + '|' + h.id);
      (pairEdges[pair] = pairEdges[pair] || []).push({ s: k0, e: k1 });
    }
  }
  /* pair 描边片：grab 定向链（跨支点自动断开） */
  let pieceId = 0;
  const pieces = [];
  for (const pair in pairEdges) {
    const [a, b] = pair.split('|');
    const edges = pairEdges[pair];
    const nE = edges.length;
    const usedE = new Array(nE).fill(false);
    const bucket = {};
    edges.forEach((e, i) => { (bucket[e.s] = bucket[e.s] || []).push(i); });
    for (const sk0 in bucket) {
      for (const i0 of bucket[sk0].slice()) {
        if (usedE[i0]) continue;
        usedE[i0] = true;
        const chain = [edges[i0]];
        const startKey = edges[i0].s;
        let guard = 0;
        while (guard++ < nE + 2) {
          const ek = chain[chain.length - 1].e;
          if (ek === startKey) break;
          const cands = (bucket[ek] || []).filter(i => !usedE[i]);
          if (!cands.length) break;
          usedE[cands[0]] = true;
          chain.push(edges[cands[0]]);
        }
        const keys = chain.map(x => x.s); keys.push(chain[chain.length - 1].e);
        const isCoast = (b === 'SEA');
        const seed = (pair.split('').reduce((q, ch) => (q * 31 + ch.charCodeAt(0)) % 9973, pieceId + 3));
        const cyc = (keys[0] === keys[keys.length - 1]);
        const pts = _organicize(keys, geo, isCoast, seed, cyc);
        pieces.push({ id: pieceId++, a, b, keys, pts, path: catmullPath(pts, false) });
      }
    }
  }
  /* region 环：由 pair 片拼接（相邻省共用同一曲线 —— 填充与描边完全贴合） */
  const outMap = {};
  const loops = {};
  for (const p of pieces) {
    for (const R of [p.a, p.b]) {
      if (R === 'SEA') continue;
      const m = (outMap[R] = outMap[R] || {});
      const e0 = { i: p.id, fwd: (R === p.a) };
      const atKey = e0.fwd ? p.keys[0] : p.keys[p.keys.length - 1];
      (m[atKey] = m[atKey] || []).push(e0);
    }
  }
  for (const R in outMap) {
    const m = outMap[R]; const rl = []; const used = new Set();
    for (const startKey in m) {
      while (m[startKey] && m[startKey].length) {
        const seedE = m[startKey].shift();
        if (used.has(seedE.i)) continue;
        used.add(seedE.i);
        const loop = [[seedE.i, seedE.fwd]];
        const byIdI = pieces[seedE.i];
        let curEnd = (seedE.fwd) ? byIdI.keys[byIdI.keys.length - 1] : byIdI.keys[0];
        for (let g2 = 0; g2 < 6000; g2++) {
          if (curEnd === startKey) break;
          const cand = (m[curEnd] || []).find(x => !used.has(x.i));
          if (!cand) break;
          m[curEnd] = m[curEnd].filter(x => x !== cand);
          used.add(cand.i);
          loop.push([cand.i, cand.fwd]);
          const byIdC = pieces[cand.i];
          curEnd = (cand.fwd) ? byIdC.keys[byIdC.keys.length - 1] : byIdC.keys[0];
        }
        rl.push(loop);
      }
    }
    loops[R] = rl;
  }
  const centroid = {};
  const byProv = {};
  for (const h of hexes) {
    if (!h.id) continue;
    (byProv[h.id] = byProv[h.id] || []).push(h);
    const c = centroid[h.id] = centroid[h.id] || [0, 0, 0];
    c[0] += h.cx; c[1] += h.cy; c[2]++;
  }
  for (const k in centroid) { const c = centroid[k]; centroid[k] = [c[0] / c[2] / 100, c[1] / c[2] / 100]; }
  return { geo, pieces, loops, byProv, centroid, catmullPath };
}
function catmullPathBackward(pc) { return catmullPath(pc.pts.slice().reverse(), false); }
/* 填色外壳：每省 = 其六边形网格并集（共享角点微扰、格间精密贴合；
   可靠、绝无断环/漏色——描边曲线另由 O(piece) 提供） */
function regionFillPath(topo, R) {
  const cells = topo.byProv && topo.byProv[R];
  if (!cells || !cells.length) return '';
  let d = '';
  for (const h of cells) {
    const cs = _hexCorners(h.cx, h.cy).map(_hx2px);
    let s = '';
    for (let i = 0; i < 6; i++) s += (i ? 'L' : 'M') + cs[i][0].toFixed(2) + ' ' + cs[i][1].toFixed(2);
    d += s + 'Z';
  }
  return d;
}
/* ---------- 自绘场景 SVG 片段（gStatic 底层·HOI4式地形质感） ---------- */
function pathOfPts(pts) {
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const [sx, sy] = pxy(pts[i][0], pts[i][1]);
    d += (i ? 'L' : 'M') + sx.toFixed(1) + ' ' + sy.toFixed(1);
  }
  return d;
}
function ellipsePath(lon, lat, rx, ry, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = 2 * Math.PI * i / n;
    pts.push([lon + rx * Math.cos(a), lat + ry * Math.sin(a)]);
  }
  return catmullPath(pts.map(p => pxy(p[0], p[1])), true);
}
/* 地形生境色块（真实经纬·大致分区：沙漠/草原/黄土/平原/丘陵/森林/高原） */
const BIOMES = [
 { c:'#d2b98a', n:'沙漠', pts:[[97.5,36.2],[100,37.2],[103,38.6],[105.5,38.4],[107,37.4],[105.5,36.4],[102.5,35.7],[99.5,35.0],[97.5,35.2]] },
 { c:'#c8ae7d', n:'戈壁', pts:[[104,38.8],[107,39.2],[110,39.0],[113,39.4],[116,39.2],[118,38.9],[116.5,38.2],[113.5,38.0],[110.5,37.8],[107,37.6],[104.5,37.8]] },
 { c:'#ada472', n:'草原', pts:[[100,41.5],[106,41.4],[111,41.3],[116,41.2],[121,41.3],[126,41.4],[129,41.6],[129,41.0],[124,40.8],[120,40.9],[116,40.6],[112,40.4],[108,40.3],[104,40.4],[100,40.8]] },
 { c:'#c4a97e', n:'黄土', pts:[[104,36.6],[106.5,35.9],[108.5,36.2],[110.5,37.2],[112,38.4],[113.4,39.4],[114.4,39.9],[113.2,38.9],[111.2,37.7],[109,36.4],[107,35.6],[104.8,35.9]] },
 { c:'#b9bd8b', n:'华北平原', pts:[[113.4,35.2],[114.5,35.7],[115.6,36.3],[116.6,37.0],[117.6,37.8],[118.6,38.3],[118.9,39.2],[118,39.7],[116.8,39.9],[115.4,39.0],[114.2,38.2],[113.2,37.4],[112.6,36.4],[112.7,35.6],[113,35.1]] },
 { c:'#a8a878', n:'山东丘陵', pts:[[116.9,36.8],[118.3,37.2],[119.9,37.6],[121.4,37.5],[122.5,37.2],[122,36.6],[121,36.2],[119.6,35.7],[118.3,35.6],[117.2,35.9]] },
 { c:'#8fa563', n:'江淮', pts:[[112,30.6],[114,30.9],[116,31.2],[118,31.6],[119.6,32.1],[120,32.9],[119.4,33.6],[117.9,33.8],[116.4,33.3],[114.7,32.6],[112.9,31.9],[112,31.2]] },
 { c:'#87a05e', n:'两湖', pts:[[110.4,29.9],[112,30.1],[113.5,30.5],[114.8,30.7],[114.5,29.9],[113,29.3],[111.4,29.1],[110.2,29.3]] },
 { c:'#9aa66a', n:'四川盆地', pts:[[103,30.2],[104,30.9],[105.5,31.3],[106.8,31.2],[107,30.3],[106,29.3],[104.5,29.0],[103.2,29.6]] },
 { c:'#6f9550', n:'江南岭南', pts:[[110,27.2],[113,26.9],[116,27.6],[119,28.1],[121,28.6],[120.6,27.4],[118,26.6],[115,26.1],[112,26.3],[110,26.6]] },
 { c:'#7a9155', n:'云贵', pts:[[103.5,28.6],[106,28.4],[108,27.9],[110,27.6],[109.6,26.2],[107,25.8],[104.5,26.4],[103,27.4]] },
 { c:'#7d9460', n:'东北', pts:[[119.6,40.3],[121,40.8],[123,41.2],[125,41.4],[126.5,41.2],[127.5,40.6],[126,39.8],[124.5,39.4],[123,38.9],[122,39.4],[121,40],[119.8,39.9]] },
 { c:'#8a9a66', n:'朝鲜', pts:[[124.5,40.3],[125.5,40.5],[126.5,40.3],[127.5,39.5],[127,38.3],[126.2,37.3],[125.8,36.3],[126.4,35.3],[127.2,35.7],[128,36.7],[128.3,37.9],[128.6,38.9],[128.4,39.9],[127.6,40.7],[126.6,41.1],[125.4,40.9]] },
 { c:'#b39b74', n:'河西', pts:[[100.5,36.2],[102.5,36.6],[104.5,36.2],[105.5,35.4],[104,34.8],[102,34.6],[100.5,35.2]] },
 { c:'#b09a80', n:'羌塘', pts:[[97.5,33.5],[99.5,33.9],[101,33.2],[100,31.8],[98.2,31.2],[97.5,31.8]] }
];
/* 地形静态层：海→大陆→生境(模糊)→山脉→大河→小河→湖泽→颗粒 */
function sceneSvg() {
  const s = [];
  s.push(`<defs>
    <filter id="wzxBio" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="wzxGrain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.47  0 0 0 0 0.4  0 0 0 0.35 0"/>
    </filter>
  </defs>`);
  s.push(`<rect x="0" y="0" width="912" height="560" fill="${STYLE.sea}"/>`);
  s.push(`<path d="${pathOfPts(COAST)}Z" fill="${STYLE.land}" stroke="none"/>`);
  /* 生境（模糊成画家式过渡） */
  s.push(`<g filter="url(#wzxBio)">`);
  for (const b of BIOMES) s.push(`<path d="${pathOfPts(b.pts)}Z" fill="${b.c}" fill-opacity="1"/>`);
  /* 山脉（宽笔触，模糊后如晕染山影） */
  for (const m of MOUNTS) s.push(`<path d="${pathOfPts(m.pts)}" fill="none" stroke="${STYLE.mountain}" stroke-opacity="${STYLE.mountainOp + 0.14}" stroke-width="${STYLE.mountainW + 3}" stroke-linecap="round" stroke-linejoin="round"/>`);
  s.push(`</g>`);
  /* 北徼草原 */
  const sp = pathOfPts(STEPPE_LINE);
  s.push(`<path d="${sp}L ${px(130.5,42.6).toFixed(1)} ${py(130.5,42.6).toFixed(1)} L ${px(90,42.6).toFixed(1)} ${py(90,42.6).toFixed(1)}Z" fill="${STYLE.steppe}" stroke="none" opacity="0.8"/>`);
  /* 海岸线（深色描边） */
  s.push(`<path d="${pathOfPts(COAST)}Z" fill="none" stroke="${STYLE.landLine}" stroke-width="${STYLE.landLineWidth}" stroke-linejoin="round" opacity="0.9"/>`);
  /* 大河 / 小河 */
  for (const r of RIVERS.major)
    s.push(`<path d="${pathOfPts(r.pts)}" fill="none" stroke="${STYLE.river}" stroke-opacity="${STYLE.bigRiverOp}" stroke-width="${r.w}" stroke-linecap="round"/>`);
  for (const r of RIVERS.minor)
    s.push(`<path d="${pathOfPts(r.pts)}" fill="none" stroke="${STYLE.river}" stroke-opacity="${STYLE.minorRiverOp}" stroke-width="${r.w}" stroke-linecap="round"/>`);
  /* 湖泽 */
  for (const l of LAKES)
    s.push(`<path d="${ellipsePath(l.lon, l.lat, l.rx, l.ry, 16)}" fill="${STYLE.lake}" fill-opacity="${STYLE.lakeOp}" stroke="none" opacity="0.95"/>`);
  /* 颗粒噪点（画家质感） */
  s.push(`<rect x="0" y="0" width="912" height="560" filter="url(#wzxGrain)" style="mix-blend-mode:overlay" opacity="0.55" pointer-events="none"/>`);
  return s.join('');
}

/* ---------- 自检 ---------- */
function check() {
  const { grid } = buildCells();
  const adj = buildAdj(grid);
  const geom = buildGeom(grid);
  let empty = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!grid[y][x]) empty++;
  const byOwner = {};
  for (const d of DEFS) byOwner[d.owner] = (byOwner[d.owner] || 0) + ((geom[d.id] || {}).n || 0);
  const rpt = { empty, provinces: DEFS.length, byOwner, byProvince: {}, adj };
  for (const d of DEFS) rpt.byProvince[d.id] = { cells: (geom[d.id] || {}).n || 0, adj: (adj[d.id] || []).length, owner: d.owner };
  return rpt;
}

const api = {
  PANEL, SCALE, Y0, COLS, ROWS, CELLX, CELLY,
  DEFS, CARVE, COAST, STEPPE_LINE, RIVERS, MOUNTS, LAKES, STYLE, OUTLANDS,
  px, py, pxy, lonLatAt,
  defsById() { const m = {}; DEFS.forEach(d => m[d.id] = d); return m; },
  buildCells, buildAdj, buildGeom, check,
  sceneSvg, pathOfPts, ellipsePath, inPoly, northOfLine,
  HEXR, HEXW, HEXVS, HROWS, HCOLS,
  buildHexWorld, hexTopology, regionFillPath, catmullPath
};
return api;
})();
