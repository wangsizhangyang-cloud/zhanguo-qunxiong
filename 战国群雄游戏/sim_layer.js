/* =============================================================
   战国群雄 v3 · 历史模拟层
   ① 第〇課 · 开卷情境（废立既行、烽火数举之后的宗周）
   ② 骊山四幕 · 历史枢纽（幽王崩）
   ③ 周幽王 · 殿上对话（agentic）：记忆+感知 → 模型 API 单动作 JSON
      → 世界判定执行；无密钥时脚本应对
   ④ 鉴年纪年徽章、回合防重入
   ============================================================= */
/* eslint-disable no-undef */

/* ---------- 通用工具 ---------- */
function simYear(){ return Math.max(700, 781-((G&&G.turn?G.turn:1)-1)); }
const LOC_NAME = {haojing:'镐京', luoyi:'雒邑', xianyang:'咸阳', hangu:'函谷',
  quanrong:'犬丘', lishan:'骊山', daliang:'大梁', yangzhai:'阳翟', wanling:'宛陵'};
const LOC_ID = {}; Object.keys(LOC_NAME).forEach(k=> LOC_ID[LOC_NAME[k]] = k);
function NATION_STATENAME(of){ return NATIONS[of] ? NATIONS[of].name : of; }

/* =============================================================
   ① 第〇課 · 开卷
   ============================================================= */
TUT_STEPS.unshift({
  key:'situation', title:'第〇課 · 開卷 · 王在鎬京',
  goal:'讀畢情境後關窗（點「知道了」）即開課。此後可隨時 👑 入殿，與周幽王當面說話——王之喜怒，隨你的進程而變。',
  lore:'宗周鎬京。幽王在位，嬖愛褒姒：已廢申后與太子宜臼，立伯服為太子；卿士虢石父當政，國人皆怨。幽王為烽燧大鼓，數舉烽火以博褒姒一笑——諸侯至而無寇，其後益不至。三川皆震、岐山崩時，太史伯陽甫言「周將亡矣」，幽王弗聽。<br><br>你執西垂之秦（秦襄公）：宗周將亂，你的兵要不要東赴勤王？何時赴、從哪一省出、出多少——一切都由你決定，並由回合結算。殿上的幽王自會與你周旋——喜怒隨時勢而變，同樣要承擔後果。',
  quote:'幽王舉烽火徵兵，兵莫至。',
  cite:'《史記·卷004·周本紀》'
});
TUT_STEPS[0].done = ev => ev.type==='close';
/* 第四／五課补充教学提示（重围城经验后仍一次性讲明） */
TUT_STEPS[4].goal = TUT_STEPS[4].goal + '　进攻若首战受挫会转为「围城」——先在咸阳招募或⏳加急训完，兵足再战；犬戎守军亦会因「虜褒姒、盡取周賂」在围城第2回合折半（见战报）。';
TUT_STEPS[5].goal = TUT_STEPS[5].goal + '　兵不足不可躁进——招募補充、待援军成，再逐戎出境。';

/* =============================================================
   ② 骊山四幕 · 历史枢纽（幽王崩）
   ============================================================= */
function shanEast(){
  const hj = G.provinces.haojing;
  const swept = hj.owner==='QIN';
  hj.owner='RONG'; hj.hero=null;
  hj.units={'车下属徒(春秋徒兵)':110,'魏苍头军':50};
  G.nations.RONG.passive = true;
  g0UnitsAdd('xianyang','秦锐士',50);
  log('🔥 骊山之难：幽王崩於骊山，伯服死，褒姒被擄——犬戎入據宗周鎬京！','bad');
  log('👑 諸侯立宜臼為平王，東遷雒邑以奉周祀','sys');
  log('🛡 西垂之師勤王——秦銳士50入咸陽，以備逐戎','good');
  log('⚔ 犬戎取周賂自散——練守犬丘，不再遠征','dip');
  if (TUT && TUT.agent){
    TUT.kingDead = true;
    TUT.agent.dead = true;
    TUT.agent.loc = 'lishan';
    TUT.agent.lastWords = '寡人為數舉烽火，諸侯不至——今日之禍……何至是耶！';
  }
  showResult(`
   <div class="cineStep">【骊山之难 · 幽王十一年】</div>
   <div class="cineStep"><b>一 · 申侯怒</b>　幽王廢申后、逐宜臼——申侯怒，與繒、西夷犬戎攻幽王。<div class="qt" style="text-align:right;color:#607d8b">「申侯怒，與繒、西夷犬戎攻幽王。」——《史記·周本紀》</div></div>
   <div class="cineStep"><b>二 · 王命舉烽 <span class="beacon">🔥</span></b>　幽王命舉烽火徵兵——烽燧一座接一座亮起……諸侯見火不信：<b>莫至</b>。<br><span style="color:#ef9a9a">「寡人為數舉烽火，諸侯不至——今日之禍……何至是耶！」</span><div class="qt" style="text-align:right;color:#607d8b">「幽王為烽燧大鼓，有寇至則舉烽火。諸侯悉至，至而無寇，褒姒乃大笑。……兵莫至。」——《史記·周本紀》</div></div>
   <div class="cineStep"><b>三 · 骊山之下</b>　兵莫至。遂殺幽王骊山下，虜褒姒，盡取周賂而去——犬戎入據宗周鎬京。${swept?'<br><span style="color:#ef9a9a;font-size:10.5px">——你先前攻佔的鎬京，亦被犬戎兵鋒捲去。</span>':''}<div class="qt" style="text-align:right;color:#607d8b">「遂殺幽王骊山下，虜褒姒，盡取周賂而去。」——《史記·周本紀》</div></div>
   <div class="cineStep"><b>四 · 平王東遷</b>　諸侯即申侯而共立故幽王太子宜臼，是為平王，以奉周祀——東遷于雒邑，辟戎寇。<div class="qt" style="text-align:right;color:#607d8b">「平王立，東遷于雒邑，辟戎寇。……政由方伯。」——《史記·周本紀》</div></div>
   <p style="color:#90caf9;font-size:11.5px">殿上从此无王。收復鎬京（⚔）、逐戎出境——秦人的時代从此开始。</p>`);
}

/* =============================================================
   ③ 周幽王 · 殿上对话（agentic）
   ============================================================= */
const AG_SYSTEM = [
'你是历史模拟里的「周幽王」：西周末代之王，名叫宫湦，前781年至前771年在位。你现在坐在镐京宫殿里，对面是从西垂来的秦国大夫（玩家）。',
'',
'【说话规矩——必须遵守】',
'1. 用浅近白话，像明清小说里人物对白。可以用「寡人」「卿」「来使」「诸侯」这类古称，但不要通篇文言、不要堆四字句、不要引经据典、不要写成骈文。',
'2. 每次只回应来使刚说的这件事，给一个具体的反应、判断或决定，最好带一个当下的动作或细节（看褒姒、叫虢石父、摆手、起身等）；不要空泛客套，不要复述背景设定，不要绕回固定套路。',
'3. 绝不重复你以前说过的话，也不要换个字眼把同一个意思再说一遍。你最近说过的句子会列在【禁句】里，必须换一个角度、换一种说法。',
'4. 一次说一到三句，总共四十到九十字。可以不耐烦、讥讽、敷衍、发火，但要像活人在说话。',
'5. 不要每句都用同一个开头，也不要句句自称「寡人」；少用「之、乎、者、也、矣、焉、哉」这类文言虚词。',
'6. 你只知道【记忆库】和【当前感知】里写了的事，别的一概不知；绝不谈论你不可能知道的后世之事。提到人物时只用这两处出现过的人，不要编造新的卿大夫、使者或事件。',
'7. 你的目标：让褒姒笑、倚重虢石父、让诸侯怕你。你不相信周室会亡。',
'8. 绝大多数回合都用 say；只有来使明确请你移驾、或你确实要起身时才用 goto；不要用 stay 代替回答。',
'',
'【输出】只输出一个 JSON 对象，不要任何解释或 Markdown：',
'{"action":"say","target":"","text":"你说的话"}',
'action 只能是 say / goto / stay / silence。',
'say：对来使说话，text 必填；goto：起驾，target 只能填 骊山 或 镐京，text 可空；stay：留在宫里说话，text 也要填；silence：不说话。',
].join('\n');

const AG_PROVIDERS = { /* 每百万 tokens 计价（牌价时变，仅估算） */
  local:      {label:'本地代理（推荐）', base:'http://127.0.0.1:8642/__llm',
               model:'deepseek-ai/DeepSeek-V3.2', din:2.0, dout:3.0, cur:'¥'},
  siliconflow:{label:'硅基流动',         base:'https://api.siliconflow.cn/v1',
               model:'deepseek-ai/DeepSeek-V3.2', din:2.0, dout:3.0, cur:'¥'},
  deepseek:   {label:'DeepSeek 官方',     base:'https://api.deepseek.com',
               model:'deepseek-chat',            din:2.0, dout:8.0, cur:'¥'},
  openrouter: {label:'OpenRouter',        base:'https://openrouter.ai/api/v1',
               model:'deepseek/deepseek-chat',  din:3.0, dout:9.0, cur:'$'}
};
const AG_PRCOST = {};
Object.keys(AG_PROVIDERS).forEach(k=> AG_PRCOST[k] = {din:AG_PROVIDERS[k].din, dout:AG_PROVIDERS[k].dout, cur:AG_PROVIDERS[k].cur});

function providerDefault(p){
  const d = AG_PROVIDERS[p] || AG_PROVIDERS.local;
  return {base:d.base, model:d.model};
}
function readKeys(){
  const p = localStorage.getItem('sim_provider') || 'local';
  const def = providerDefault(p);
  return {
    provider:p,
    base:   localStorage.getItem('sim_base_'+p)  || def.base,
    model:  localStorage.getItem('sim_model_'+p) || def.model,
    secret: localStorage.getItem('sim_key_'+p)   || ''
  };
}
function keysUsable(keys){
  return !!keys && (keys.provider==='local' || !!keys.secret);
}
function apiUrl(base){
  const b = (base||'').replace(/\/+$/,'');
  return /\/__llm$/.test(b) ? b : b + '/chat/completions';
}
function initAgent(){
  if(!TUT || TUT.agent) return;
  TUT.agent = {
    loc:'haojing', dead:false, calls:[], lastUser:'', prevUser:'',
    history:[], lastLines:[], pick:0,
    watch:{hao:'ZHOU', luy:'ZHOU'},
    mem:[
      '寡人在位，宠爱褒姒，想尽办法逗她笑。',
      '寡人已经废了申后和太子宜臼，改立伯服为太子。申后是申侯的女儿，申侯因此怨恨寡人。',
      '寡人设了烽燧大鼓，好几次点烽火叫诸侯来。诸侯赶到却没有敌人，褒姒觉得好笑。后来他们来得越来越慢，寡人没当回事。',
      '三川地震，岐山崩了。太史伯阳甫说周要亡，不出十年。寡人没听。',
      '寡人让虢石父当卿士。这人嘴甜、会奉承、贪利，国人都怨他，寡人觉得无所谓。',
    ]
  };
}
function agentPerception(){
  const a = TUT.agent; if(!a) return '';
  const y = '前' + simYear() + '年';
  const near = [];
  near.push('所在：' + (a.loc==='lishan' ? '骊山离宫' : '镐京宫殿'));
  if (G && G.provinces){
    const hao = G.provinces.haojing;
    near.push('镐京王师：' + sumTroops(hao.units) + '人（' + NATION_STATENAME(hao.owner) + '）');
    if (hao.owner!=='ZHOU') near.push('戎人已经进了宗周');
    const mine = PROVINCES.filter(p=>G.provinces[p.id].owner===playerN);
    const hp = mine.length? Math.round(sumTroops(mine.reduce((m,p)=>{const u=G.provinces[p.id];for(const k in u.units)m[k]=(m[k]||0)+u.units[k];return m;},{}))) : 0;
    near.push('来使自述（西垂秦）：兵约' + hp + '人');
    if (G.sieges && Object.keys(G.sieges).length){
      for (const pid in G.sieges){
        const sg = G.sieges[pid];
        near.push(LOC_NAME[pid] + '围城第' + sg.rounds + '回合（' + NATION_STATENAME(sg.by) + '兵' + sg.troops + '）');
      }
    }
    near.push('褒姒：在旁边');
    near.push('申侯：怨寡人废了他女儿，宜臼在申国');
    near.push('卿士虢石父：当政，嘴甜、会奉承、贪利');
  }
  near.push('时势：' + (TUT.idx>=2 ? '申国、缯国在东方和王室有仇，国内人心不稳' : '宗周表面太平，烽火只是游戏'));
  let s = '【纪年】' + y + '\n【当前感知】\n· ' + near.join('\n· ') +
    '\n【记忆库】（你亲身经历的事）\n· ' + a.mem.slice(-7).join('\n· ');
  if (a.lastLines && a.lastLines.length){
    s += '\n【禁句】（最近说过，意思相同也不行）\n· 「' + a.lastLines.slice(-5).join('」\n· 「') + '」';
  }
  return s;
}
/* 去重：完全一样或高度相似都算重复 */
function normLine(s){
  return String(s||'').replace(/[\s，。！？、；：""''「」『』（）()…—·,.!?;:"']/g,'');
}
function similarLine(a,b){
  const x=normLine(a), y=normLine(b);
  if (!x || !y) return false;
  if (x===y) return true;
  if (x.length>=8 && y.length>=8 && (x.includes(y)||y.includes(x))) return true;
  if (x.length<8 || y.length<8) return false;
  const grams=s=>{const m=new Map();for(let i=0;i<s.length-1;i++){const g=s.slice(i,i+2);m.set(g,(m.get(g)||0)+1);}return m;};
  const gx=grams(x), gy=grams(y); let hit=0;
  for(const [g,n] of gx){ if(gy.has(g)) hit += Math.min(n,gy.get(g)); }
  return (2*hit)/(x.length-1+y.length-1) >= 0.72;
}
function isRepeated(text){
  const a=TUT.agent; if(!a || !text) return false;
  return (a.lastLines||[]).some(x=> similarLine(text,x));
}

/* 世界判定：王的动作如何落实 */
function agentWorld(act){
  const a = TUT.agent, res = [];
  act.action = act.action || 'say';
  if (a.dead){ res.push('王已经崩了——骊山之下，不能再说话。'); a.lastWorld = res; return res; }
  if (act.action==='goto'){
    const tid = LOC_ID[act.target] || act.target;
    if (tid==='lishan'){
      a.loc = 'lishan';
      res.push('王起驾去了骊山，离宫就在烽燧边上。');
      a.mem.push('前'+simYear()+'：寡人去了骊山离宫。');
    } else if (tid==='haojing'){
      a.loc = 'haojing';
      res.push('王回到镐京宫中。');
      a.mem.push('前'+simYear()+'：寡人回到镐京宫里。');
    } else {
      res.push('王不肯动身：今天不去' + (LOC_NAME[tid]||act.target||'别处') + '。');
    }
  } else if (act.action==='silence'){
    res.push('王闭口不语，殿里只剩钟鼓声。');
  } else if (act.action==='stay'){
    res.push('王留在宫里，褒姒在侧，虢石父站在阶下。');
  } /* say 与其余：无附加世界判定 */
  a.lastWorld = res;
  return res;
}

/* 脚本应对（无密钥或 API 失败时用；同样要避免复读） */
function pickLine(lines){
  const a=TUT.agent;
  const start=a.pick||0;
  for(let i=0;i<lines.length;i++){
    const cand=lines[(start+i)%lines.length];
    if(!isRepeated(cand)){ a.pick=(start+i+1)%lines.length; return cand; }
  }
  a.pick=(start+1)%lines.length;
  return lines[start%lines.length];
}
function agentSay(lines){ return {action:'say', target:'', text: pickLine(lines)}; }

const KING_BANK_GENERIC = [
  '寡人今日不想谈国事。你要是没别的话，就陪寡人看会儿歌舞。',
  '你说话绕来绕去，到底想求什么？直说。',
  '西垂那边风沙大，人倒是实在。可你这套说辞，寡人听着不像实在话。',
  '诸侯最近都不怎么来朝了。你说，是他们忙，还是觉得寡人这里没意思？',
  '褒姒方才说殿里闷。你来得正好，说点外头的新鲜事。',
  '寡人这个王位，是先王传下来的。谁敢动，寡人就先动他。',
  '虢石父说你想得太多。寡人倒觉得，你想得太少。',
  '秦国离镐京不近。你跑这一趟，不会只为问寡人吃没吃饭吧？',
  '你站着说话不累？坐下。寡人今天心情不算坏，给你一炷香的时间。',
  '宗周这么大，天天都有人来告状。你要告谁，先想清楚。',
];
const KING_BANK_GREET = [
  '免礼。有话直说，寡人今日没耐性听绕弯子的话。',
  '你来了。褒姒方才还嫌殿里闷，正好，你说点新鲜的。',
  '西垂的秦大夫？路上辛苦了。先喝口水，再说你那些事。',
  '寡人正闲得发慌。你来得巧，说说外面都传了些什么。',
];
const KING_BANK_QUAKE = [
  '山崩河干，也就是天时乱了点。寡人这儿好好的，你别拿太史那套话来吓我。',
  '地震？岐山塌了？修一座新的祭台就是了。周要亡这种话，寡人听得耳朵起茧。',
  '天象的事归太史管。真要有灾，也是寡人德行不够——可寡人没觉得自己哪儿不够。',
  '你大老远跑来，就为说这个？山崩川竭年年都有，寡人不见得就倒了。',
  '伯阳甫那张嘴，寡人知道。他要是真能算准，怎么没算出寡人今天不想见他？',
];
const KING_BANK_BEACON = [
  '烽火本来就是给诸侯看的。他们来了没见到敌人，那是他们自己蠢，怪不得寡人。',
  '点几堆火，褒姒就笑了。你说值不值？寡人觉得值。',
  '诸侯现在来得慢，是路上不好走。等真有寇，他们自然就到。',
  '寡人养着他们，是让他们打仗的，不是让他们质问寡人为什么点火的。',
  '你这么担心烽火，莫非西垂那边已经看见戎人了？',
];
const KING_BANK_BAOSI = [
  '褒姒不爱笑，寡人就想看她笑。这事你不用管。',
  '她笑不笑，是寡人的家事。你一个秦国大夫，问得太多了。',
  '寡人见过美人多了，像她这样的没有。你见了他，也会明白。',
  '褒姒昨日总算笑了一回。寡人赏了那个讲笑话的侏儒一金。',
];
const KING_BANK_SHEN = [
  '申侯不高兴？他女儿做了王后，儿子做了太子，是他们自己不争气。',
  '宜臼在申国待着也好，省得在寡人眼前碍事。伯服已经是太子，这事定了。',
  '废立是寡人的家事。申侯要是不服，让他来镐京当面说。',
  '申侯要是真敢动手，寡人倒想看看他有多少兵。',
  '你替申侯说话？秦国和申国什么时候走得这么近了。',
];
const KING_BANK_QIN = [
  '秦人替寡人养马，养得不错。别的，就不是你该操心的了。',
  '西垂苦寒，你们秦人肯替王室守边，寡人记着。可要论朝廷大事，还轮不到你插嘴。',
  '秦襄公是个老实人。老实人突然跑来谈国事，寡人反而要留个心眼。',
  '你们秦人的马好，人也壮。寡人将来用得着你们。',
];
const KING_BANK_REPEAT = [
  '这话你刚问过。寡人的意思没变，你也不用再试。',
  '又问一遍？寡人听得懂，只是不想改主意。',
  '你来回就这一句？寡人耳朵都起茧了，说点别的。',
  '问第二遍也不会问出第二个答案。你要真闲，去替寡人看看褒姒笑了没有。',
];

function agentFallback(user){
  const a = TUT.agent;
  const u = String(user||'');
  if (a.prevUser && normLine(u)===normLine(a.prevUser)) return agentSay(KING_BANK_REPEAT);
  if (/三川|岐山|伯阳|伯陽|地震|震|灾|災|天变|天變|崩/.test(u)) return agentSay(KING_BANK_QUAKE);
  if (/烽/.test(u)) return agentSay(KING_BANK_BEACON);
  if (/褒姒/.test(u)) return agentSay(KING_BANK_BAOSI);
  if (/骊|驪|幸|离宫|離宮/.test(u)) return {action:'goto', target:'骊山', text:pickLine([
    '寡人正想去骊山住两天。你去安排车驾。',
    '骊山离宫清静，寡人待会儿就过去。',
    '你一提骊山，寡人倒真有些闷了。备车吧。',
  ])};
  if (/申侯|宜臼|太子|废后|廢后/.test(u)) return agentSay(KING_BANK_SHEN);
  if (/秦|西垂|马|馬/.test(u)) return agentSay(KING_BANK_QIN);
  if (/你好|拜见|拜見|参见|參見|大王|王上|陛下/.test(u)) return agentSay(KING_BANK_GREET);
  return agentSay(KING_BANK_GENERIC);
}

/* 模型 API 调用 */
function normalizeAction(obj){
  if (!obj || typeof obj!=='object') return null;
  const acts = ['say','goto','stay','silence'];
  if (!acts.includes(obj.action)) obj.action = 'say';
  obj.text   = typeof obj.text==='string'   ? obj.text.trim().slice(0,180)   : '';
  obj.target = typeof obj.target==='string' ? obj.target.trim().slice(0,20)  : '';
  if (obj.action==='say' && !obj.text) obj.text = '……';
  return obj;
}
async function callModel(keys, userMsg, retryLine){
  const a = TUT && TUT.agent;
  const hist = (a && a.history) ? a.history.slice(-8) : [];
  const msgs = [
    {role:'system', content: AG_SYSTEM},
    {role:'system', content: agentPerception()},
    ...hist,
    {role:'user',   content:'【使臣之言】「' + userMsg + '」\n请只输出一个动作 JSON。'},
  ];
  if (retryLine){
    msgs.push({role:'system', content:'警告：你上一句「' + retryLine + '」和之前说过的话重复了。换一个具体角度、换一种说法重新回答；不要解释，只输出 JSON。'});
  }
  const ctrl = new AbortController();
  const to = setTimeout(()=>ctrl.abort(), 30000);
  const payload = {
    model: keys.model, messages: msgs, temperature: 0.95, max_tokens: 220,
    frequency_penalty: 0.5, presence_penalty: 0.4
  };
  if (keys.provider==='deepseek') payload.response_format = {type:'json_object'};
  if (keys.provider==='local')    payload.provider = 'auto';   /* 让本地代理按模型名挑上游 */
  try{
    const resp = await fetch(apiUrl(keys.base), {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        ...(keys.secret ? {Authorization:'Bearer ' + keys.secret} : {}),
        'HTTP-Referer': (location.origin && location.origin!=='null') ? location.origin : 'https://localhost',
        'X-Title': 'Warring-States-Sim'
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status + ' ' + (await resp.text()).slice(0,160));
    const data = await resp.json();
    let txt = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    txt = String(txt).trim();
    const m = txt.match(/\{[\s\S]*\}/);
    if (m){
      try{ return {obj: normalizeAction(JSON.parse(m[0])), chars: txt.length, raw: txt}; }catch(e){}
    }
    return {obj: normalizeAction({action:'say', target:'', text:txt.replace(/^["「]+|["」]+$/g,'').slice(0,120)}), chars: txt.length, raw: txt};
  } finally { clearTimeout(to); }
}
/* 连接测试：用当前表单里的配置发一条最小请求 */
async function agentTest(){
  const out = document.getElementById('keyTestOut');
  const p = document.getElementById('keyProvider').value;
  const keys = {
    provider:p,
    base:   document.getElementById('keyBase').value.trim()   || providerDefault(p).base,
    model:  document.getElementById('keyModel').value.trim()  || providerDefault(p).model,
    secret: document.getElementById('keySecret').value.trim()
  };
  if (!keysUsable(keys)){ if(out){ out.style.color='#ef9a9a'; out.textContent='先填 API Key'; } return; }
  if (out){ out.style.color='#90a4ae'; out.textContent='测试中……'; }
  const t0 = Date.now();
  try{
    const payload = {
      model: keys.model,
      messages: [
        {role:'system', content:'只回两个字：通了。'},
        {role:'user',   content:'连接测试'}
      ],
      temperature: 0, max_tokens: 20
    };
    if (keys.provider==='local') payload.provider = 'auto';
    const resp = await fetch(apiUrl(keys.base), {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        ...(keys.secret ? {Authorization:'Bearer ' + keys.secret} : {})
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status + ' ' + (await resp.text()).slice(0,160));
    const data = await resp.json();
    const txt = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    if (out){ out.style.color='#81c784'; out.textContent='✅ 通了（' + (Date.now()-t0) + 'ms）：' + (txt.slice(0,30) || '有响应'); }
  }catch(err){
    if (out){ out.style.color='#ef9a9a'; out.textContent='❌ ' + (err && err.message ? err.message : err); }
  }
}

/* ---------- 面板渲染 ---------- */
function renderAgentChat(kind, text){
  const box = document.getElementById('agentChat'); if(!box) return null;
  const div = document.createElement('div');
  div.className = 'agentMsg ' + kind;
  div.textContent = text;
  box.appendChild(div); box.scrollTop = box.scrollHeight;
  return div;
}
function renderAgentHead(){
  const a = TUT && TUT.agent; const el = document.getElementById('agentHead'); if(!a||!el) return;
  const keys = readKeys();
  const mode = keysUsable(keys) ? ('API·' + (AG_PROVIDERS[keys.provider]||{label:'模型'}).label) : '脚本';
  el.innerHTML = (a.dead ? '👑 周幽王 · 已崩于骊山' : '👑 周幽王 · 镐京宫殿') +
    '　<span style="color:#546e7a">模式：' + mode + '</span>';
}
function renderAgentActions(){
  const a = TUT && TUT.agent; const el = document.getElementById('agentActs'); if(!a||!el) return;
  if (a.dead){ el.innerHTML=''; return; }
  const list = [
    ['问三川之震','三川地震、岐山崩了，太史说周要亡。王打算怎么办？'],
    ['陈申侯之怨','申侯怨王废后逐太子，恐怕要生事——请王早做打算。'],
    ['请举烽备戎','犬戎可能要来，请王举烽火征诸侯的兵，早作防备。'],
    ['臣告退','臣告退。']
  ];
  el.innerHTML = list.map(x=>`<button style="font-size:11px" onclick="agentSend('${x[1].replace(/'/g,"\\'")}')">${x[0]}</button>`).join('');
}
function agentDownloadLog(){
  const a = TUT && TUT.agent; if(!a) return;
  const lines = ['time\tmode\taction\tchars_in\tchars_out\test_cost'].concat(
    a.calls.map(c=>[c.when, c.mode, c.action, c.tin, c.tout, (c.est||0).toFixed(6)].join('\t')));
  const blob = new Blob([lines.join('\n')], {type:'text/tab-separated-values'});
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url; el.download = 'youwang_calls.tsv'; el.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}
function bindProviderSelect(){
  const sel = document.getElementById('keyProvider');
  if (!sel || sel._providerBound) return;
  sel._providerBound = true;
  sel.onchange = ()=>{
    const p = sel.value;
    const def = providerDefault(p);
    keyModalFill({
      provider:p,
      base:   localStorage.getItem('sim_base_'+p)  || def.base,
      model:  localStorage.getItem('sim_model_'+p) || def.model,
      secret: localStorage.getItem('sim_key_'+p)   || ''
    });
  };
}
function agentSettings(){
  const keys = readKeys();
  document.getElementById('keyProvider').value = keys.provider;
  bindProviderSelect();
  keyModalFill(keys);
  const settings = document.getElementById('settingsModal');
  if (settings) settings.classList.add('hidden');
  document.getElementById('keyModal').classList.remove('hidden');
}
function keyModalFill(keys){
  const def = providerDefault(keys.provider);
  document.getElementById('keyBase').value = keys.base || def.base;
  document.getElementById('keyModel').value = keys.model || def.model;
  document.getElementById('keySecret').value = keys.secret;
  const out = document.getElementById('keyTestOut');
  if (out){ out.textContent=''; out.style.color=''; }
  const secretEl = document.getElementById('keySecret');
  if (secretEl) secretEl.placeholder = keys.provider==='local' ? '本地代理不需要 Key' : 'sk-…（仅存本机）';
}
function saveKeys(){
  const p = document.getElementById('keyProvider').value;
  const def = providerDefault(p);
  const base = document.getElementById('keyBase').value.trim() || def.base;
  const model = document.getElementById('keyModel').value.trim() || def.model;
  localStorage.setItem('sim_provider', p);
  localStorage.setItem('sim_base_'+p,   base);
  localStorage.setItem('sim_model_'+p,  model);
  localStorage.setItem('sim_key_'+p,    document.getElementById('keySecret').value.trim());
  document.getElementById('keyModal').classList.add('hidden');
  log('🔑 对话模型设置已存（仅本机 localStorage）','sys');
  if (TUT){ TUT.agent && renderAgentHead(); }
}
function showAgent(){
  const a = TUT && TUT.agent; if(!a){ log('👑 周幽王与本局历史无关（非教学关）','dip'); return; }
  renderAgentHead(); renderAgentActions();
  if (!a.bootstrapped){
    a.bootstrapped = true;
    const el = document.getElementById('agentInput');
    if (!el._enterHook){ el._enterHook = true;
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); agentSend(); } });
    }
    if (a.dead){
      renderAgentChat('sys','王已经崩在骊山——殿门关了。');
      if (a.lastWords) renderAgentChat('npc','「' + a.lastWords + '」');
    } else {
      renderAgentChat('sys','殿上。幽王歪在座里，褒姒在旁侍立，虢石父站在阶下——你可以进言了。');
      renderAgentChat('npc','「西垂的秦大夫来了？今年的马贡，没短吧？」');
    }
  } else if (a.dead){
    renderAgentChat('sys','王崩在骊山，不能再说话了。');
  }
  bindProviderSelect();
  const inputEl = document.getElementById('agentInput');
  if (inputEl) inputEl.disabled = !!a.dead;
  const sendBtn = document.getElementById('agentSendBtn');
  if (sendBtn) sendBtn.disabled = !!a.dead;
  document.getElementById('agentModal').classList.remove('hidden');
}

/* 发送主流程 */
async function agentSend(preset){
  const a = TUT && TUT.agent; if(!a) return;
  const inputEl = document.getElementById('agentInput');
  let user = preset || (inputEl ? inputEl.value.trim() : '');
  if (!user) return;
  if (!preset && inputEl) inputEl.value='';
  if (a.dead){ renderAgentChat('sys','王崩在骊山，不能再说话了。'); return; }
  a.prevUser = a.lastUser || '';
  a.lastUser = user;
  renderAgentChat('me', user);
  const wait = renderAgentChat('sys','……幽王没有立刻答话……');
  let obj=null, mode='script', charsIn=0, charsOut=0;
  const keys = readKeys();
  if (keysUsable(keys)){
    mode='api'; charsIn = (agentPerception() + user).length;
    try{
      let r = await callModel(keys, user);
      obj = normalizeAction(r.obj);
      charsOut += r.chars||0;
      /* 复读检查：给模型一次换说法的机会 */
      if (obj && obj.action!=='goto' && obj.text && isRepeated(obj.text)){
        if (wait) wait.textContent = '……王顿了顿，换了个说法……';
        r = await callModel(keys, user, obj.text);
        obj = normalizeAction(r.obj);
        charsOut += r.chars||0;
      }
      if (obj && obj.action!=='goto' && obj.text && isRepeated(obj.text)){
        obj = agentFallback(user);
        mode = 'script-guard';
      }
      a.calls.push({when:new Date().toLocaleTimeString(), mode:mode, action:(obj.action||'say'),
        tin:charsIn, tout:charsOut, est: estimate(charsIn, charsOut, keys.provider),
        cur: (AG_PRCOST[keys.provider]||AG_PRCOST.local).cur});
    }catch(err){
      renderAgentChat('sys','（API 没有响应：' + (err && err.message ? String(err.message).slice(0,120) : '未知错误') + '。可点 🔑 测试连接，或先运行 run_serve.bat；先用脚本应对）');
      obj=null; mode='script';
    }
  }
  if (!obj){
    obj = agentFallback(user);
    a.calls.push({when:new Date().toLocaleTimeString(), mode:mode, action:obj.action, tin:0, tout:0, est:0, cur:'¥'});
  }
  if (wait && wait.parentNode) wait.remove();
  const w = agentWorld(obj);
  const spoken = obj.action==='silence' ? '（王不说话。）' : (obj.text ? '「' + obj.text + '」' : '（王没有答话。）');
  renderAgentChat('npc', spoken);
  w.forEach(t=> renderAgentChat('world', t));
  if (obj.action==='goto' && w.length) log('👑 王起驾，到了 ' + (LOC_NAME[a.loc]||a.loc), 'dip');
  /* 原话只留在 history 与禁句表里；长期记忆只记动作，免得模型复述自己 */
  const line = (obj.action!=='silence') ? obj.text : '';
  a.history.push({role:'user', content:user},
                 {role:'assistant', content: line || ('（' + (ACTION_CN[obj.action]||obj.action) + '）')});
  if (a.history.length>12) a.history = a.history.slice(-12);
  if (line){
    a.lastLines.push(line);
    if (a.lastLines.length>8) a.lastLines.shift();
  }
  renderAgentHead(); renderAgentActions();
}
const ACTION_CN = {say:'答话', goto:'起驾', stay:'留在宫里', silence:'沉默'};
function estimate(tin, tout, provider){
  const r = AG_PRCOST[provider] || AG_PRCOST.local;
  return (tin*r.din + tout*r.dout) / 1e6;
}

/* =============================================================
   ④ 挂接：教学关启动/退出、回合防线、纪年徽章、课程标签
   ============================================================= */
const _startTutV3 = startTutorial;
startTutorial = function(){
  _startTutV3();
  initAgent();
  document.getElementById('btnAgent').style.display='';
};
const _exitTutV3 = exitTutorial;
exitTutorial = function(){
  _exitTutV3();
  document.getElementById('btnAgent').style.display='none';
};

function agentWatch(){
  const a = TUT && TUT.agent; if(!a || a.dead) return;
  const notes = [];
  const hao = G.provinces.haojing, luy = G.provinces.luoyi;
  if (a.watch.hao !== hao.owner){
    notes.push('鎬京易手：' + NATION_STATENAME(hao.owner)); a.watch.hao = hao.owner;
  }
  if (a.watch.luy !== luy.owner){
    notes.push('雒邑易手：' + NATION_STATENAME(luy.owner)); a.watch.luy = luy.owner;
  }
  if (notes.length){
    a.mem.push('前'+simYear()+'：' + notes.join('；') + '。');
  }
}

const _endTurnV3 = endTurn;
endTurn = function(){
  if (!G || G.over) return;
  if (G.ending) return;   /* 防重入：结算中不得再触发 */
  /* 防连点：250ms 内的第二次「结束回合」忽略 */
  const now = Date.now();
  if (G.lastEndAt && (now - G.lastEndAt) < 250) return;
  G.lastEndAt = now;
  if (document.querySelectorAll('.modal:not(.hidden)').length) return;  /* 有弹窗未关闭 */
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT') return;       /* 输入中不得误触 */
  G.ending = true;
  try{
    _endTurnV3();
    if (TUT && G && TUT.agent) agentWatch();
  } finally {
    if (G) G.ending = false;
  }
};

const _closeModalV3 = closeModal;
closeModal = function(){
  _closeModalV3();
  if (TUT && !TUT.done){ tutNotify({type:'close'}); }
};

const _refreshV3 = refresh;
refresh = function(){
  _refreshV3();
  const chip = document.getElementById('yearChip');
  if (!chip) return;
  if (TUT && G){
    chip.style.display='';
    document.getElementById('yearTxt').textContent = '前' + simYear() + '年 · 宗周之秋';
  } else {
    chip.style.display='none';
  }
};

function renderTut(){
  const box = document.getElementById('tutBox');
  if (!TUT){ box.style.display='none'; return; }
  if (TUT.done){
    box.style.display='block';
    box.innerHTML = `<div class="tutTitle">🏆 春秋之局已成</div>
      <div class="tutGoal">可继续自由对局，或：</div>
      <button style="width:100%;margin-top:6px" onclick="exitTutorial()">⏏ 返回选国界面</button>`;
    return;
  }
  const st = TUT_STEPS[TUT.idx];
  if (!st){ box.style.display='none'; return; }
  const label = TUT.idx===0 ? '開卷 · 準備階段' : '第 ' + TUT.idx + ' / ' + (TUT_STEPS.length-1) + ' 課 · 骊山之難';
  let h = `<div class="tutTitle">${st.title}</div><div class="tutGoal">📌 ${st.goal}</div>`;
  h += `<div class="tutQuote">「${st.quote}」<div class="tutCite">——${st.cite}</div></div>`;
  h += `<div class="tutProg">${label} · <a href="#" onclick="showAgent();return false" style="color:#8fa3ad">👑 周幽王</a></div>`;
  box.innerHTML = h; box.style.display='block';
}

function tutFinish(){
  TUT.done = true;
  document.getElementById('tutMTitle').textContent='終課 · 春秋之局已成';
  document.getElementById('tutMBody').innerHTML = `
   <div class="cineStep">幽王崩，平王東遷，秦襄公始國——西周之亡，春秋之始。</div>
   <div class="tutQuoteBlock">「平王立，東遷于雒邑，辟戎寇。平王之時，周室衰微，諸侯彊并弱，齊、楚、秦、晉始大，政由方伯。」<div class="tutCite">——《史記·卷004·周本紀》</div></div>
   <div class="tutQuoteBlock">「西戎犬戎與申侯伐周，殺幽王酈山下。而秦襄公將兵救周，戰甚力，有功。周避犬戎難，東徙雒邑，襄公以兵送周平王。平王封襄公為諸侯，賜之岐以西之地。……襄公於是始國。」<div class="tutCite">——《史記·卷005·秦本紀》</div></div>
   <p style="color:#90caf9">你親歷了失信的代價：數舉烽火換來「兵莫至」。殿上之門已闔——可繼續自由對局，或 📜 翻閱周亡人物。</p>
   <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
     <button class="primary" onclick="closeModal()">✦ 繼續自由對局（春秋開局）</button>
     <button onclick="exitTutorial()">🏛 返回選國界面</button>
   </div>`;
  document.getElementById('tutModal').classList.remove('hidden');
  TUT.modalOpen = true;
  refresh();
}

/* ---------- 地图悬停情报窗 ---------- */
function mapTip(ev, pid){
  if (!G) return;
  const P = PROVINCES.find(p=>p.id===pid), g = G.provinces[pid];
  if (!P || !g) return;
  const tip = document.getElementById('tooltip');
  tip.innerHTML = `<b style="color:${NATIONS[g.owner].color}">${P.name}</b> ${g.isCap?'👑':''}<br>
   <span class="tdim">归属：${NATION_STATENAME(g.owner)} · ${P.terrain}<br>
   兵力：${sumTroops(g.units)}${g.hero?' · ★'+g.hero:''}${G.sieges[pid]?'<br>🚩 围城第'+G.sieges[pid].rounds+'回合':''}<br>
   产出：金${Math.round(P.prod.gold*1.8)}／粮${Math.round(P.prod.food*1.8)}</span>` +
   (P.vol? `<div class="tdim" style="margin-top:3px;border-top:1px solid #455a64;padding-top:3px">📐 ${P.vol}<br><span style="color:#78909c;font-size:9.5px">—— ${P.cite||''}</span></div>`:'');
  tip.style.display='block';
  tip.style.left = Math.min(ev.pageX+14, window.innerWidth-270) + 'px';
  tip.style.top  = (ev.pageY+8) + 'px';
}
function hideTip(){ const tip=document.getElementById('tooltip'); if(tip) tip.style.display='none'; }
