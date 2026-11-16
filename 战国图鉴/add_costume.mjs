// add_costume.mjs — 为 data.js 每位武将追加 "costume"（服饰考据）字段，据《服装考据报告》。
import fs from 'fs';
const DATA_JS = 'E:/508fp/战国图鉴/data.js';

const src = fs.readFileSync(DATA_JS, 'utf8');
const jsonStr = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1);
const data = JSON.parse(jsonStr);
const generals = data.generals || [];

function bucketOf(g){const e=g.era||'',s=g.state||'';if(/汉/.test(e))return'han';if(/春秋/.test(e))return'chunqiu';if(/秦/.test(s))return'qin';if(/战国/.test(e))return'zhanguo';return'zhanguo';}
function roleOf(g){const r=g.role||'';if(/刺客|死士|力士|屠者/.test(r))return'assassin';const mil=/将|帅|尉|裨|校|司马|军师|贰师|骠骑|元帅/.test(r)&&!/统帅/.test(r);if(mil)return'warrior';if(/相|令尹|太宰|行人|大夫|谋主|谋臣|司寇|司徒|客卿|长史|左尹|相国/.test(r))return'advisor';if(/王/.test(r)&&!/王子|王孙/.test(r))return'king';return'warrior';}

const ROLE_WEAR = {
  warrior: {
    chunqiu: '束发高髻·兜鍪·深衣·犀兕皮甲·佩青铜剑',
    zhanguo: '束发·武冠·深衣·铁札甲·佩剑',
    qin: '束发挽髻·长冠·黑色长襦·黑色札甲',
    han: '束发戴帻·武冠·深衣·铁札甲',
  },
  advisor: {
    chunqiu: '束发高髻·进贤冠·深衣宽袖·束绅带·不着甲',
    zhanguo: '束发·武冠·深衣·束带佩玉·不着甲',
    qin: '束发·长冠·黑色深衣·束带·不着甲',
    han: '束发戴帻·进贤冠·深衣·束带·不着甲',
  },
  king: {
    chunqiu: '冕冠·深衣·皮甲·王者威仪',
    zhanguo: '王冠·深衣·铁甲·王者威仪',
    qin: '旒冕·黑色深衣·札甲·王者威仪',
    han: '冠冕·深衣·铁甲·王者威仪',
  },
  assassin: {
    chunqiu: '束发无冠·短衣短褐·腰藏短剑匕首',
    zhanguo: '束发·短衣短褐·腰藏短剑匕首',
    qin: '束发·短衣·腰藏短剑匕首',
    han: '束发·短衣·腰藏短剑匕首',
  },
};

const ERA_CITE = {
  chunqiu: '《左传·宣二》「犀兕尚多」；《国语·齐语》「犀甲」',
  zhanguo: '《史记·赵世家》「胡服骑射」；《史记·主父列传》「介胄生虮虱」',
  qin: '《史记·秦始皇本纪》「衣服旄旌节旗皆上黑」；兵马俑实证',
  han: '《史记·高祖本纪》「帜皆赤，故上赤」；《史记·绛侯世家》「被甲·介胄」',
};

function costumeOf(g) {
  if (g.name === '赵武灵王') {
    return '胡服骑射（短衣窄袖·带钩·合裆长裤·短靴）。《史记·赵世家》「吾欲胡服……胡服骑射以教百姓」';
  }
  const b = bucketOf(g), r = roleOf(g);
  let wear = ROLE_WEAR[r][b] || ROLE_WEAR.warrior[b];
  let cite = ERA_CITE[b];
  if (/春秋/.test(g.era || '') && /吴|越/.test(g.state || '')) {
    wear += '·吴越断发纹身（《史记·赵世家》「翦发文身」）';
  }
  const eraName = { chunqiu: '春秋服制', zhanguo: '战国服制', qin: '秦制（尚黑）', han: '汉制（尚赤）' }[b];
  return `${eraName}：${wear}。${cite}`;
}

let n = 0;
for (const g of generals) {
  if (!g.costume) { g.costume = costumeOf(g); n++; }
}
// 更新（幂等：若已有则覆盖，保证一致）
for (const g of generals) { g.costume = costumeOf(g); }

const out = 'window.GALLERY_DATA=' + JSON.stringify(data) + ';';
fs.writeFileSync(DATA_JS, out, 'utf8');
console.log('updated', generals.length, 'generals; costume field added.');
// 抽样验证
for (const nm of ['管仲','白起','项籍','霍去病','赵武灵王','荆轲','吴王夫差','百里奚','樊哙']) {
  const g = generals.find(x => x.name === nm);
  console.log('\n' + nm + ' [' + g.era + '|' + g.state + '|' + g.role + ']');
  console.log('  ' + g.costume);
}
