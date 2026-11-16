import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = import.meta.dirname;
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/markdown; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const CORS_BASE = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, HTTP-Referer, X-Title',
  'Access-Control-Allow-Private-Network': 'true',
  'Access-Control-Max-Age': '86400'
};
const ALLOWED_ORIGINS = new Set(['http://127.0.0.1:8642', 'http://localhost:8642', 'null', 'file://']);
function corsFor(req) {
  const origin = String((req && req.headers.origin) || '');
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'http://127.0.0.1:8642';
  return { ...CORS_BASE, 'Access-Control-Allow-Origin': allow, 'Vary': 'Origin' };
}

/* 本地 LLM 代理：浏览器只连 127.0.0.1，Key 由本机文件/环境变量提供，绕开 CORS。 */
const UPSTREAMS = {
  siliconflow: {
    base: 'https://api.siliconflow.cn/v1',
    hosts: ['api.siliconflow.cn'],
    env: 'SILICONFLOW_API_KEY',
    keyFiles: [
      join(ROOT, '..', '战国图鉴', 'siliconflow_key.txt'),
      join(ROOT, 'siliconflow_key.txt'),
      join(ROOT, '..', 'siliconflow_key.txt'),
    ],
  },
  deepseek: {
    base: 'https://api.deepseek.com',
    hosts: ['api.deepseek.com'],
    env: 'DEEPSEEK_API_KEY',
    keyFiles: [join(ROOT, 'deepseek_key.txt'), join(ROOT, '..', 'deepseek_key.txt')],
  },
  openrouter: {
    base: 'https://openrouter.ai/api/v1',
    hosts: ['openrouter.ai'],
    env: 'OPENROUTER_API_KEY',
    keyFiles: [join(ROOT, 'openrouter_key.txt'), join(ROOT, '..', 'openrouter_key.txt')],
  },
};

function firstLine(file) {
  try {
    if (!existsSync(file)) return '';
    return readFileSync(file, 'utf8').split(/\r?\n/)[0].trim();
  } catch (e) { return ''; }
}
function readKey(name) {
  const up = UPSTREAMS[name];
  if (!up) return '';
  if (process.env[up.env]) return String(process.env[up.env]).trim();
  for (const f of up.keyFiles) {
    const k = firstLine(f);
    if (k) return k;
  }
  return '';
}
function inferProvider(model) {
  const m = String(model || '');
  if (/^deepseek\//.test(m)) return 'openrouter';
  if (/^(deepseek-ai|Qwen|zai-org|moonshotai|Pro)\//.test(m)) return 'siliconflow';
  if (/^deepseek-(chat|reasoner)/.test(m)) return 'deepseek';
  return 'siliconflow';
}
function sendJSON(res, status, obj) {
  res.writeHead(status, { ...(res.cors || CORS_BASE), 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

async function handleLLM(req, res) {
  let raw = '';
  for await (const ch of req) raw += ch;
  let body;
  try { body = JSON.parse(raw || '{}'); }
  catch (e) { return sendJSON(res, 400, { error: '请求不是合法 JSON' }); }

  const wanted = (body.provider && UPSTREAMS[body.provider]) ? body.provider : inferProvider(body.model);
  const up = UPSTREAMS[wanted];
  if (!up) return sendJSON(res, 400, { error: '未知服务商：' + body.provider });

  let base = up.base;
  if (body.base) {
    try {
      const u = new URL(body.base);
      if (!up.hosts.includes(u.hostname)) return sendJSON(res, 400, { error: '不允许的接口地址：' + u.hostname });
      base = String(body.base).replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    } catch (e) {
      return sendJSON(res, 400, { error: '接口地址不合法' });
    }
  }

  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const key = auth || readKey(wanted);
  if (!key) {
    return sendJSON(res, 400, {
      error: '没有找到 ' + wanted + ' 的 Key。可在浏览器设置里填，或放到：' + up.keyFiles[0]
    });
  }

  const payload = { ...body };
  delete payload.provider;
  delete payload.base;

  const r = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000),
  });
  const txt = await r.text();
  res.writeHead(r.status, { ...(res.cors || CORS_BASE), 'Content-Type': 'application/json; charset=utf-8' });
  res.end(txt);
}

createServer(async (req, res) => {
  res.cors = corsFor(req);
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, res.cors); res.end(); return; }

    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    if (pathname === '/__llm') {
      if (req.method !== 'POST') return sendJSON(res, 405, { error: '只接受 POST' });
      return await handleLLM(req, res);
    }
    if (pathname === '/__ping') {
      return sendJSON(res, 200, { ok: true, llm: true, upstreams: Object.keys(UPSTREAMS) });
    }
    if (pathname === '/__shot') {            // POST 主维上传：页面送 base64 数据，写盘
      let body = '';
      req.on('data', ch => body += ch);
      req.on('end', async () => {
        const buf = Buffer.from(body, 'base64');
        await writeFile(join(ROOT, '_shot.png'), buf);
        res.writeHead(200, res.cors); res.end('ok ' + buf.length);
      });
      return;
    }

    const p = pathname === '/' ? '/index.html' : pathname;
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403, res.cors); res.end(); return; }
    const buf = await readFile(file);
    res.writeHead(200, { ...res.cors, 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  } catch (e) {
    if (!res.headersSent) res.writeHead(404, res.cors);
    res.end('nf');
  }
}).listen(8642, '127.0.0.1', () => {
  console.log('serving http://127.0.0.1:8642/  (+ /__llm 本地模型代理, /__shot)');
  console.log('本地代理会自动找 Key：战国图鉴/siliconflow_key.txt、deepseek_key.txt、openrouter_key.txt，或环境变量。');
});
