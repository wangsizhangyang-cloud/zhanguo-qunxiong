// regenerate_generals.mjs
// 重制《战国群雄图鉴》武将与兵种形象：服装与时代统一（春秋/战国/秦/汉初），附史料考据依据。
// 模式优先级：
//   1) 硅基流动 siliconflow_key.txt（sk-）→ Kolors 免费生图（POST /v1/images/generations）
//   2) pollinations pollen_key.txt（sk_）→ gen.pollinations.ai + 阿里 Z-Image Turbo（付费 pollen）
//   3) 无 key → image.pollinations.ai 免费档 flux（45 秒/张）
// 用法：node regenerate_generals.mjs
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_JS = path.join(__dirname, 'data.js');
const OUT_DIR = path.join(__dirname, 'assets', 'gen_ai');
const LOG_FILE = path.join(__dirname, 'regen_log.txt');
let WIDTH = 372, HEIGHT = 460;
const SEED_BASE = 20261026;

// ---------- 读 key ----------
function readKey(f) {
  try {
    if (!fs.existsSync(f)) return '';
    return fs.readFileSync(f, 'utf8').split(/\r?\n/)[0].trim();
  } catch (e) { return ''; }
}
const SF_KEY = readKey(path.join(__dirname, 'siliconflow_key.txt'));
const PL_KEY = readKey(path.join(__dirname, 'pollen_key.txt'));

let MODE = 'legacy'; // legacy | siliconflow | pollen
let GEN_LABEL = 'flux';
if (SF_KEY) { MODE = 'siliconflow'; GEN_LABEL = 'Kwai-Kolors/Kolors'; WIDTH = 512; HEIGHT = 640; }
else if (PL_KEY) { MODE = 'pollen'; GEN_LABEL = 'tongyi-mai/z-image-turbo'; WIDTH = 512; HEIGHT = 640; }
const THROTTLE = MODE === 'siliconflow' ? 20000 : (MODE === 'pollen' ? 3000 : 46000);
const HEADERS = MODE === 'pollen' ? { Authorization: `Bearer ${PL_KEY}` } : {};

// ---------- 读取 data.js ----------
const src = fs.readFileSync(DATA_JS, 'utf8');
const jsonStr = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1);
const data = JSON.parse(jsonStr);
const generals = data.generals || [];

// ---------- 时代桶判定 ----------
function bucketOf(g) {
  const era = g.era || '';
  const state = g.state || '';
  if (/汉/.test(era)) return 'han';
  if (/春秋/.test(era)) return 'chunqiu'; // 春秋秦将（百里奚等）着春秋皮甲
  if (/秦/.test(state)) return 'qin'; // 战国/秦/秦末 的秦将（秦俑式甲、尚黑）
  if (/战国/.test(era)) return 'zhanguo';
  return 'zhanguo';
}

function primaryState(g) {
  return (g.state || '').split('→').pop().split('/').pop().trim();
}

function roleOf(g) {
  const r = g.role || '';
  if (/刺客|死士|力士|屠者/.test(r)) return 'assassin';
  const military = /将|帅|尉|裨|校|司马|军师|贰师|骠骑|元帅/.test(r) && !/统帅/.test(r);
  if (military) return 'warrior';
  if (/相|令尹|太宰|行人|大夫|谋主|谋臣|司寇|司徒|客卿|长史|左尹|相国/.test(r)) return 'advisor';
  if (/王/.test(r) && !/王子|王孙/.test(r)) return 'king';
  return 'warrior';
}

// ---------- 服装描述（据《服装考据报告》） ----------
const CLOTH = {
  chunqiu: {
    armor: '外披犀兕皮甲（深褐皮革甲片，以丝组编缀）',
    plain: '交领右衽深衣，宽袖，束绅带',
    era: '春秋时期',
    color: '以赭褐皮甲为主色',
  },
  zhanguo: {
    armor: '外披铁札甲（铁色甲片编缀，鱼鳞纹样）',
    plain: '交领右衽深衣，束带',
    era: '战国时期',
    color: '以铁灰赭色为主色',
  },
  qin: {
    armor: '外披黑色札甲（甲片编缀，鱼鳞纹样）',
    plain: '交领右衽黑色长襦',
    era: '秦朝',
    color: '以玄黑为主色',
  },
  han: {
    armor: '外披铁札甲（铁色甲片编缀）',
    plain: '交领右衽深衣，衣缘饰赤',
    era: '西汉',
    color: '以赤红为主色',
  },
};

const HEADWEAR = {
  king: { chunqiu: '冕冠', zhanguo: '王冠', qin: '旒冕', han: '冠冕' },
  advisor: { chunqiu: '进贤冠（高冠）', zhanguo: '武冠', qin: '长冠', han: '进贤冠' },
  warrior: { chunqiu: '兜鍪（青铜胄）', zhanguo: '武冠（兜鍪）', qin: '长冠（或鹖冠）', han: '帻与武冠' },
  assassin: { chunqiu: '束发无冠', zhanguo: '束发', qin: '束发', han: '束发' },
};

function colorOf(g) {
  const ps = primaryState(g);
  if (/秦/.test(ps)) return '以玄黑为主色';
  if (/汉/.test(ps)) return '以赤红为主色';
  if (/楚/.test(ps)) return '以赤红为主色';
  return CLOTH[bucketOf(g)].color;
}

function isWuYue(g) {
  return /春秋/.test(g.era || '') && /吴|越/.test(g.state || '');
}

// ---------- 提示词生成 ----------
function buildPrompt(g) {
  const name = g.name;
  const bucket = bucketOf(g);
  const role = roleOf(g);
  const c = CLOTH[bucket];
  const hw = (HEADWEAR[role] && HEADWEAR[role][bucket]) ? HEADWEAR[role][bucket] : HEADWEAR.warrior[bucket];
  const color = colorOf(g);

  const styleBase = '中国古代工笔重彩人物画像，线条精细，设色鲜明，半身立像，面部与服饰细节清晰，庄重威严，统一素净米色宣纸底，单色平涂背景，无景物无装饰';

  let eraNote = c.era;
  if (isWuYue(g)) eraNote += '，吴越断发纹身之风';

  if (name === '赵武灵王') {
    return `${styleBase}，战国赵武灵王胡服骑射，历史武将「赵武灵王」，身穿胡服（短衣窄袖，交领，带钩束腰，合裆长裤，短靴），腰悬弓矢，英武骑射气概，以铁灰赭色为主色。`;
  }

  let body;
  if (role === 'king') {
    body = `头戴${hw}，身穿${c.plain}，${c.armor}，${color}，王者威仪`;
  } else if (role === 'advisor') {
    body = `头戴${hw}，身穿${c.plain}，束带佩玉，儒雅谋臣风度，不着甲`;
  } else if (role === 'assassin') {
    body = `束发短衣短褐，腰藏短剑匕首，精悍凌厉，不着甲`;
  } else {
    body = `头戴${hw}，身穿${c.plain}，${c.armor}，束带佩剑，${color}，英武战将气概`;
  }
  return `${styleBase}，${eraNote}，历史武将「${name}」，${body}。`;
}

// ---------- 兵种提示词 ----------
const UNIT_PROMPTS = {
  '车兵(戎车一乘)': { era: '春秋时期', desc: '战车甲士，头戴皮胄，身穿犀兕皮甲（深褐皮革甲片），手持长戈与弓矢，旁有战车，以赭褐为主色' },
  '轻车(驰车/阙车)': { era: '春秋战国时期', desc: '轻型战车甲士，轻装皮甲，头戴胄，手持戈矛与弓矢，机动轻捷' },
  '车下属徒(春秋徒兵)': { era: '春秋时期', desc: '徒步士兵，束发高髻，短褐，轻皮甲，手持长矛，朴实刚健' },
  '齐技击': { era: '战国时期', desc: '齐国技击之士，束发轻装，手持利剑，身手矫健，以铁灰赭色为主色' },
  '魏武卒': { era: '战国时期', desc: '魏国重装步兵，头戴兜鍪，身穿三属之铁甲，腰挂弩，手持长戟，背负箭囊，英武雄壮' },
  '秦锐士': { era: '战国时期', desc: '秦国精锐步兵，束发挽髻，身穿黑色札甲，手持长矛，尚黑，锐不可当' },
  '魏武士': { era: '战国时期', desc: '魏国武士，甲胄齐整，手持戈矛，英武之气' },
  '魏苍头军': { era: '战国时期', desc: '魏国士兵，青巾包头，身穿甲衣，手持矛戟' },
  '魏奋击': { era: '战国时期', desc: '魏国敢死之士，轻甲短衣，手持利刃，悍勇冲锋之姿' },
  '魏厮徒': { era: '战国时期', desc: '魏国辎重杂役兵，短褐束带，肩挑粮草，朴实耐劳' },
  '胡服骑兵(赵骑射)': { era: '战国时期', desc: '赵国胡服骑兵，短衣窄袖，带钩束腰，合裆长裤，短靴，骑马张弓，骑射英姿' },
  '韩国强弩兵(弩兵)': { era: '战国时期', desc: '韩国弩兵，束发，轻甲，双手端持强弩，腰挂箭囊，专注瞄准' },
  '舟师水军(吴越楚巴蜀)': { era: '春秋战国时期', desc: '水军士兵，短衣跣足，手持长戈与船桨，立于战船之上' },
  '越君子军(亲军/死士)': { era: '春秋时期', desc: '越国君王亲军死士，断发纹身，短衣，手持利剑，视死如归' },
  '工兵器械兵(云梯/灌城/地道)': { era: '春秋战国时期', desc: '工兵器械兵，短褐束带，手持斧凿，旁立云梯等攻城器械' },
};

function safeName(n) { return n.replace(/\//g, '·'); }

function buildUnitPrompt(u) {
  const p = UNIT_PROMPTS[u.name] || { era: '战国时期', desc: '士兵，束发，甲衣，手持兵器' };
  const style = '中国古代工笔重彩人物画像，线条精细，设色鲜明，半身立像，面部与服饰细节清晰，统一素净米色宣纸底，单色平涂背景，无景物无装饰';
  return `${style}，${p.era}${p.desc}，兵种图鉴「${u.name}」。`;
}

// ---------- 生成一张图（按模式） ----------
async function httpGet(url, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs, headers: headers || {} }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => {
          let msg = res.statusCode + ' ' + (res.headers['content-type'] || '');
          try { const j = JSON.parse(body); if (j && j.error && j.error.message) msg += ' :: ' + j.error.message; } catch (e) {}
          reject(new Error(msg));
        });
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}

async function httpPostJson(url, headers, obj, timeoutMs) {
  const bodyStr = JSON.stringify(obj);
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      timeout: timeoutMs,
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }, headers),
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

const NEGATIVE = '现代服装，现代建筑，复杂背景，风景，山水，植物，杂物，水印，文字，英文，照片感，卡通，变形，多余的手指，低质量，模糊，深色背景，渐变背景';

async function generateImage(prompt, seed) {
  if (MODE === 'siliconflow') {
    const r = await httpPostJson('https://api.siliconflow.cn/v1/images/generations',
      { Authorization: `Bearer ${SF_KEY}` },
      {
        model: 'Kwai-Kolors/Kolors',
        prompt: prompt + `（绘画种子 ${seed}）`,
        negative_prompt: NEGATIVE,
        image_size: `${WIDTH}x${HEIGHT}`,
        batch_size: 1,
        num_inference_steps: 25,
        guidance_scale: 7.5,
      }, 120000);
    if (r.status !== 200) {
      let msg = r.status + ' ' + (r.body && r.body.toString().slice(0, 200)) || '';
      throw new Error(msg);
    }
    const j = JSON.parse(r.body.toString('utf8'));
    const im = j && j.images && j.images[0];
    if (!im) throw new Error('no image in response');
    if (im.url) return await httpGet(im.url, null, 120000);
    if (im.b64_json) return Buffer.from(im.b64_json, 'base64');
    throw new Error('unknown image payload');
  }
  if (MODE === 'pollen') {
    return await httpGet(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${encodeURIComponent(GEN_LABEL)}&width=${WIDTH}&height=${HEIGHT}&seed=${seed}&nologo=true`, HEADERS, 120000);
  }
  // legacy 免费 flux
  return await httpGet(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${WIDTH}&height=${HEIGHT}&model=flux&nologo=true&seed=${seed}`, null, 120000);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function log(line) {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${ts}] ${line}\n`, 'utf8');
  console.log(`[${ts}] ${line}`);
}

// ---------- 主流程 ----------
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(LOG_FILE, '', 'utf8');
  log(`MODE=${MODE} model=${GEN_LABEL} ${WIDTH}x${HEIGHT} throttle=${THROTTLE}ms`);

  const existing = new Set(fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png')));
  const todo = generals.filter((g) => !existing.has(`${g.name}.png`));
  log(`START total=${generals.length} todo=${todo.length} (already=${generals.length - todo.length})`);

  let done = 0, fail = 0;
  for (const g of todo) {
    const prompt = buildPrompt(g);
    const seed = SEED_BASE + g.id;
    let ok = false;
    for (let attempt = 1; attempt <= 8 && !ok; attempt++) {
      try {
        const buf = await generateImage(prompt, seed);
        if (!buf || buf.length < 1000) throw new Error('empty/small image (' + (buf ? buf.length : 0) + 'B)');
        fs.writeFileSync(path.join(OUT_DIR, `${g.name}.png`), buf);
        ok = true;
        done++;
        log(`OK ${done}/${todo.length} ${g.name} [${bucketOf(g)}/${roleOf(g)}] ${buf.length}B`);
      } catch (e) {
        const m = String(e && e.message || e);
        if (attempt === 8) { fail++; log(`FAIL ${g.name} ${m}`); }
        else {
          const wait = Math.max(THROTTLE, 2000 * attempt);
          log(`RETRY(${attempt}/8) ${g.name} ${m} -> wait ${Math.round(wait / 1000)}s`);
          await sleep(wait);
        }
      }
    }
    await sleep(THROTTLE);
  }
  log(`DONE total=${generals.length} done=${done} fail=${fail}`);

  // ---------- 兵种（unit） ----------
  const UNIT_OUT_DIR = path.join(__dirname, 'assets', 'unit_ai');
  if (!fs.existsSync(UNIT_OUT_DIR)) fs.mkdirSync(UNIT_OUT_DIR, { recursive: true });
  const units = data.units || [];
  const unitExisting = new Set(fs.readdirSync(UNIT_OUT_DIR).filter((f) => f.endsWith('.png')));
  const unitTodo = units.filter((u) => !unitExisting.has(`${safeName(u.name)}.png`));
  log(`UNITS total=${units.length} todo=${unitTodo.length} (already=${units.length - unitTodo.length})`);

  let udone = 0, ufail = 0;
  for (let ui = 0; ui < unitTodo.length; ui++) {
    const u = unitTodo[ui];
    const prompt = buildUnitPrompt(u);
    const seed = SEED_BASE + 5000 + ui;
    let ok = false;
    for (let attempt = 1; attempt <= 8 && !ok; attempt++) {
      try {
        const buf = await generateImage(prompt, seed);
        if (!buf || buf.length < 1000) throw new Error('empty/small image (' + (buf ? buf.length : 0) + 'B)');
        fs.writeFileSync(path.join(UNIT_OUT_DIR, `${safeName(u.name)}.png`), buf);
        ok = true;
        udone++;
        log(`U-OK ${udone}/${unitTodo.length} ${u.name} ${buf.length}B`);
      } catch (e) {
        const m = String(e && e.message || e);
        if (attempt === 8) { ufail++; log(`U-FAIL ${u.name} ${m}`); }
        else {
          const wait = Math.max(THROTTLE, 2000 * attempt);
          log(`U-RETRY(${attempt}/8) ${u.name} ${m} -> wait ${Math.round(wait / 1000)}s`);
          await sleep(wait);
        }
      }
    }
    await sleep(THROTTLE);
  }
  log(`DONE units total=${units.length} done=${udone} fail=${ufail}`);
}

main().catch((e) => { log('FATAL ' + (e && e.stack || e)); process.exit(1); });
