/* =========================================================================
   战国群雄 · 内政与外交扩展
   - 法律（长期国策） / 政策（限时诏令） / 民心与腐败 / 城邑开发
   - 外交：赠礼、联姻、索贡、劝降、策反、离间、请盟军
   依赖：index.html 的 G / NATIONS / PROVINCES / UMAP / H 等全局对象
   ========================================================================= */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const pct = v => { const d = Math.round((v-1)*100); return (d>=0?'+':'') + d + '%'; };
  const pct2 = (v,d=0) => (v>=0?'+':'') + v.toFixed(d);

  function relKey(a,b){ return a < b ? a+'|'+b : b+'|'+a; }
  function getRel(a,b){
    if (!G || !G.relations) return 0;
    const k = relKey(a,b);
    if (G.relations[k] == null) return (typeof SC_REL0 !== 'undefined' && SC_REL0[k]) || 0;
    return G.relations[k];
  }
  function addRel(a,b,d,silent){
    if (!G) return;
    if (!G.relations) G.relations = {};
    const k = relKey(a,b);
    const base = getRel(a,b);
    G.relations[k] = clamp(base + d, -100, 100);
    if (!silent && a===playerN) log(`🤝 与 ${NATIONS[b].name} 的关系 ${d>=0?'+':''}${d}（现 ${G.relations[k]}）`,'dip');
  }

  function ensureRealm(fresh){
    if (!G) return;
    if (!G.realms) G.realms = {};
    if (!G.relations) G.relations = {};
    if (!G.marriages) G.marriages = {};
    for (const nid in NATIONS){
      if (!G.realms[nid]){
        const st = (typeof SC_START_REALM !== 'undefined' && SC_START_REALM[nid]) || {stability:52, corruption:12};
        G.realms[nid] = {
          law: (typeof SC_DEFAULT_LAW !== 'undefined' && SC_DEFAULT_LAW[nid]) || null,
          policies: {}, stability: st.stability, corruption: st.corruption, lastLawTurn: -99
        };
      }
      const r = G.realms[nid];
      if (!r.policies) r.policies = {};
      if (r.stability == null) r.stability = 52;
      if (r.corruption == null) r.corruption = 12;
      if (r.lastLawTurn == null) r.lastLawTurn = -99;
    }
    if (fresh){
      const r = G.realms[playerN];
      r.law = null; r.policies = {}; r.lastLawTurn = -99;
    }
    for (const pid in G.provinces){
      if (G.provinces[pid].dev == null) G.provinces[pid].dev = 0;
    }
  }

  function realmMods(nid){
    const m = {gold:1, food:1, upkeep:1, recruit:1, diplomacy:0, stabilityTurn:0, corruptionTurn:0, espionage:0};
    if (!G || !G.realms || !G.realms[nid]) return m;
    const r = G.realms[nid];
    const apply = e => {
      if (!e) return;
      if (e.gold) m.gold *= e.gold;
      if (e.food) m.food *= e.food;
      if (e.upkeep) m.upkeep *= e.upkeep;
      if (e.recruit) m.recruit *= e.recruit;
      if (e.diplomacy) m.diplomacy += e.diplomacy;
      if (e.stabilityTurn) m.stabilityTurn += e.stabilityTurn;
      if (e.corruptionTurn) m.corruptionTurn += e.corruptionTurn;
      if (e.espionage) m.espionage += e.espionage;
    };
    if (r.law && typeof SC_LAWS !== 'undefined' && SC_LAWS[r.law]) apply(SC_LAWS[r.law].effects);
    for (const pid in r.policies){
      if (typeof SC_POLICIES !== 'undefined' && SC_POLICIES[pid]) apply(SC_POLICIES[pid].effects);
    }
    const sf = 0.75 + clamp(r.stability,0,100)/200;
    const cf = Math.max(0.55, 1 - clamp(r.corruption,0,100)/200);
    m.gold *= sf * cf;
    m.food *= sf * cf;
    m.diplomacy += Math.round((r.stability-50)/5);
    m.stability = r.stability;
    m.corruption = r.corruption;
    return m;
  }

  /* ---------- 生产：叠加开发度、法律、政策、民心、腐败 ---------- */
  const _incomeOf = incomeOf;
  incomeOf = function(nid){
    if (!G) return {gold:0, food:0, upkeep:{gold:0, food:0}};
    let gold = 0, food = 0;
    for (const p of PROVINCES){
      const pr = G.provinces[p.id];
      if (!pr || pr.owner !== nid) continue;
      const dev = pr.dev || 0;
      const dm = 1 + dev * 0.12;
      gold += p.prod.gold * 1.8 * dm;
      food += p.prod.food * 1.8 * dm;
    }
    if (nid === 'CHU') food *= 1.3;
    if (nid === 'YAN') gold *= 1.25;
    const m = realmMods(nid);
    gold *= m.gold; food *= m.food;
    return {gold:Math.round(gold), food:Math.round(food), upkeep:upkeepOf(nid), mods:m};
  };

  const _upkeepOf = upkeepOf;
  upkeepOf = function(nid){
    const b = _upkeepOf(nid);
    const m = realmMods(nid);
    return {gold:Math.round(b.gold*m.upkeep), food:Math.round(b.food*m.upkeep)};
  };

  const _recruit = recruit;
  recruit = function(pid, name, costG, costF, turns){
    if (!G) return _recruit(pid,name,costG,costF,turns);
    const m = realmMods(playerN);
    return _recruit(pid, name, Math.round(costG*m.recruit), Math.round(costF*m.recruit), turns);
  };

  /* ---------- 回合：民心 / 腐败 / 政策到期 ---------- */
  function realmTick(){
    if (!G) return;
    for (const nid in NATIONS){
      if (!G.nations[nid] || !G.nations[nid].alive) continue;
      const r = G.realms[nid]; if (!r) continue;
      const m = realmMods(nid);
      r.stability = clamp(r.stability + (m.stabilityTurn||0), 0, 100);
      r.corruption = clamp(r.corruption + 0.3 + (m.corruptionTurn||0), 0, 80);
      if (G.nations[nid].food < 10) r.stability -= 4;
      let war = false;
      for (const pid in G.sieges){
        if (G.sieges[pid].by === nid || (G.provinces[pid] && G.provinces[pid].owner === nid)){ war = true; break; }
      }
      if (war) r.stability -= 1;
      if (r.stability > 75) r.stability -= 1;
      if (r.stability < 25) r.stability += 1;
      r.stability = clamp(r.stability, 0, 100);
      for (const id in r.policies){
        r.policies[id].left--;
        if (r.policies[id].left <= 0){
          delete r.policies[id];
          if (nid === playerN) log(`📜 政策「${SC_POLICIES[id] ? SC_POLICIES[id].name : id}」到期`,'dip');
        }
      }
      if (nid === playerN && r.stability < 15 && Math.random() < 0.22){
        const lossG = Math.round(G.nations[nid].gold*0.10), lossF = Math.round(G.nations[nid].food*0.10);
        G.nations[nid].gold -= lossG; G.nations[nid].food -= lossF;
        log(`⚠ 民心离散：流民四起，损失 ${lossG} 金 / ${lossF} 粮`,'bad');
      }
    }
  }

  const _endTurn = endTurn;
  endTurn = function(){
    const before = G && G.turn;
    _endTurn();
    if (G && !G.over && G.turn !== before){
      realmTick();
      refresh();
    }
  };

  const _startGame = startGame;
  startGame = function(natId, restored){
    _startGame(natId, restored);
    ensureRealm(true);
    log('🏛 内政：先立法律，再颁政策；民心与腐败会逐回合改变产出。','sys');
    refresh();
  };

  const _loadGame = loadGame;
  loadGame = function(){
    _loadGame();
    if (G){ ensureRealm(false); refresh(); }
  };

  const _refresh = refresh;
  refresh = function(){
    if (G && !G.realms) ensureRealm(false);
    _refresh();
    updateRealmChip();
  };

  function updateRealmChip(){
    const btn = $('btnRealm');
    if (!btn) return;
    const inTut = (typeof TUT !== 'undefined' && TUT);
    if (!G || inTut){ btn.style.display = 'none'; return; }
    btn.style.display = '';
    const r = G.realms && G.realms[playerN];
    btn.textContent = r ? `🏛 内政 · 稳${Math.round(r.stability)}` : '🏛 内政';
  }

  /* ---------- 城邑开发 ---------- */
  const _showProv = showProv;
  showProv = function(pid){
    _showProv(pid);
    if (!G || !G.provinces[pid] || G.provinces[pid].owner !== playerN) return;
    const box = $('provCard'); if (!box) return;
    const dev = G.provinces[pid].dev || 0;
    const cg = 100 + dev*60, cf = 60 + dev*40;
    box.insertAdjacentHTML('beforeend', `<div class="devBox">
      <div><b>🏗 城邑开发 Lv.${dev}</b> <span class="mini">每级产出 +12%</span></div>
      <div style="font-size:10.5px;color:var(--dim);margin-top:2px">兴修水利/垦殖：金${cg} 粮${cf}</div>
      <button ${dev>=3?'disabled':''} onclick="developProvince('${pid}')">${dev>=3?'已至上限':'兴修 +1'}</button>
    </div>`);
  };

  function developProvince(pid){
    if (!G || G.over) return;
    const pr = G.provinces[pid];
    if (!pr || pr.owner !== playerN) return;
    const dev = pr.dev || 0;
    if (dev >= 3){ log('🏗 此城开发已至上限','dip'); return; }
    const cg = 100 + dev*60, cf = 60 + dev*40;
    const n = G.nations[playerN];
    if (n.gold < cg || n.food < cf){ log(`💰 开发需金${cg}、粮${cf}`,'bad'); return; }
    snapshot();
    n.gold -= cg; n.food -= cf; pr.dev = dev + 1;
    log(`🏗 ${PROVINCES.find(p=>p.id===pid).name} 开发至 Lv.${pr.dev}（产出 +12%）`,'good');
    refresh();
  }

  /* ---------- 法律 / 政策 ---------- */
  function enactLaw(id){
    if (!G || G.over) return;
    const L = SC_LAWS[id]; if (!L) return;
    ensureRealm(false);
    const r = G.realms[playerN], n = G.nations[playerN];
    if (r.law === id){ log('📜 此法律已在施行','dip'); return; }
    const cost = r.law ? 150 : 0;
    if (G.turn - r.lastLawTurn < 5){ log('📜 变法需缓，距上次立法不足5回合','bad'); return; }
    if (n.gold < cost){ log(`💰 变法需 ${cost} 金`,'bad'); return; }
    snapshot();
    n.gold -= cost; r.law = id; r.lastLawTurn = G.turn;
    if (cost) r.stability = clamp(r.stability - 5, 0, 100);
    log(`📜 颁布法律「${L.name}」（${L.school}）${cost?`，耗金${cost}`:''}`,'sys');
    showRealm(); refresh();
  }

  function enactPolicy(id){
    if (!G || G.over) return;
    const P = SC_POLICIES[id]; if (!P) return;
    ensureRealm(false);
    const r = G.realms[playerN], n = G.nations[playerN];
    if (r.policies[id]){ log('📜 此政策已在施行','dip'); return; }
    if (Object.keys(r.policies).length >= 2){ log('📜 同时最多施行两项政策','bad'); return; }
    if (n.gold < P.cost){ log(`💰 政策需 ${P.cost} 金`,'bad'); return; }
    snapshot();
    n.gold -= P.cost;
    r.policies[id] = {left:P.turns};
    log(`📜 颁布政策「${P.name}」（${P.turns}回合，耗金${P.cost}）`,'sys');
    showRealm(); refresh();
  }

  function cancelPolicy(id){
    if (!G || !G.realms) return;
    const r = G.realms[playerN];
    if (!r.policies[id]) return;
    delete r.policies[id];
    log(`📜 提前废止「${SC_POLICIES[id] ? SC_POLICIES[id].name : id}」`,'dip');
    showRealm(); refresh();
  }

  function effectText(e){
    if (!e) return '';
    const p = [];
    if (e.gold) p.push('金'+pct(e.gold));
    if (e.food) p.push('粮'+pct(e.food));
    if (e.upkeep) p.push('军费'+pct(e.upkeep));
    if (e.recruit) p.push('征兵'+pct(e.recruit));
    if (e.diplomacy) p.push('外交'+pct2(e.diplomacy));
    if (e.stabilityTurn) p.push('稳定'+pct2(e.stabilityTurn,1)+'/回合');
    if (e.corruptionTurn) p.push('腐败'+pct2(e.corruptionTurn,1)+'/回合');
    if (e.espionage) p.push('策反+');
    return p.join(' · ');
  }

  function showRealm(){
    if (!G){ log('🏛 先开局，再议内政','sys'); return; }
    ensureRealm(false);
    const r = G.realms[playerN], n = G.nations[playerN];
    const inc = incomeOf(playerN), m = realmMods(playerN);
    const law = r.law && SC_LAWS[r.law];
    const lawCost = r.law ? 150 : 0;
    const lawReady = G.turn - r.lastLawTurn >= 5;
    const activeN = Object.keys(r.policies).length;

    let h = `<div class="realmStats">
      <div class="realmStat"><span>民心</span><b class="${r.stability<30?'bad':''}">${Math.round(r.stability)}</b><i style="--v:${Math.round(r.stability)}%"></i></div>
      <div class="realmStat"><span>腐败</span><b class="${r.corruption>50?'bad':''}">${Math.round(r.corruption)}</b><i class="cor" style="--v:${Math.round(r.corruption)}%"></i></div>
      <div class="realmStat"><span>金收入</span><b>+${inc.gold}</b></div>
      <div class="realmStat"><span>粮收入</span><b>+${inc.food}</b></div>
      <div class="realmStat"><span>军费</span><b>-${inc.upkeep.gold}金/-${inc.upkeep.food}粮</b></div>
      <div class="realmStat"><span>征兵成本</span><b>${pct(m.recruit)}</b></div>
    </div>
    <div class="realmNow">现行法律：<b>${law?law.name+'（'+law.school+'）':'尚未立法'}</b> · 政策 ${activeN}/2
      <span class="mini">${law?`变法需 ${lawCost} 金、冷却5回合`:'首法免费'}</span></div>`;

    h += `<h3>⚖ 法律 <span class="mini">长期国策 · 只可选一</span></h3><div class="realmGrid">`;
    for (const id in SC_LAWS){
      const L = SC_LAWS[id], cur = r.law === id;
      const can = !cur && lawReady && n.gold >= lawCost;
      h += `<div class="realmCard ${cur?'on':''}">
        <div class="rcHead"><b>${L.name}</b><span class="tag">${L.school}</span>${cur?'<span class="tag on">施行中</span>':''}</div>
        <div class="rcDesc">${L.desc}</div>
        <div class="rcEff">${effectText(L.effects)}</div>
        <div class="rcCite">${L.cite}</div>
        <button ${can?'':'disabled'} onclick="enactLaw('${id}')">${cur?'已行':(lawReady?`立法${lawCost?'('+lawCost+'金)':''}`:'冷却中')}</button>
      </div>`;
    }
    h += `</div>`;

    h += `<h3>📜 政策 <span class="mini">限时诏令 · 最多两项</span></h3><div class="realmGrid">`;
    for (const id in SC_POLICIES){
      const P = SC_POLICIES[id], act = r.policies[id];
      const can = !act && activeN < 2 && n.gold >= P.cost;
      h += `<div class="realmCard ${act?'on':''}">
        <div class="rcHead"><b>${P.name}</b><span class="tag">${P.turns}回合</span>${act?`<span class="tag on">剩${act.left}</span>`:''}</div>
        <div class="rcDesc">${P.desc}</div>
        <div class="rcEff">${effectText(P.effects)}</div>
        <div class="rcCite">${P.cite}</div>
        ${act?`<button onclick="cancelPolicy('${id}')">提前废止</button>`:`<button ${can?'':'disabled'} onclick="enactPolicy('${id}')">颁布(${P.cost}金)</button>`}
      </div>`;
    }
    h += `</div>`;

    h += `<h3>🏗 城邑开发 <span class="mini">每级 +12% 产出，最高 Lv.3</span></h3>`;
    const provs = PROVINCES.filter(p=>G.provinces[p.id].owner===playerN)
      .sort((a,b)=>(G.provinces[a.id].dev||0)-(G.provinces[b.id].dev||0)).slice(0,12);
    h += `<table><tr><th>城邑</th><th>开发</th><th>兴修费用</th><th></th></tr>`;
    for (const p of provs){
      const d = G.provinces[p.id].dev || 0;
      const cg = 100 + d*60, cf = 60 + d*40;
      h += `<tr><td>${p.name}${p.isCap?' 👑':''}</td><td>Lv.${d}</td><td>金${cg}/粮${cf}</td>
        <td><button ${d>=3?'disabled':''} onclick="developProvince('${p.id}')">${d>=3?'满':'兴修'}</button></td></tr>`;
    }
    h += `</table>`;
    h += `<p class="mini" style="margin-top:6px">提示：法律改变国家底盘，政策解决短期问题；民心低于30会拖累产出，腐败高于50会吞噬收入。</p>`;

    $('realmBody').innerHTML = h;
    $('realmModal').classList.remove('hidden');
  }

  function closeRealm(){ $('realmModal').classList.add('hidden'); }

  /* ---------- 外交：关系、赠礼、联姻、索贡、劝降、策反、离间、请盟军 ---------- */
  function nationStrength(nid){
    if (!G.nations[nid]) return 0;
    let p = 0, t = 0;
    for (const pid in G.provinces){
      const pr = G.provinces[pid];
      if (pr.owner === nid){ p++; t += sumTroops(pr.units); }
    }
    return G.nations[nid].gold + G.nations[nid].food + p*45 + t*0.8;
  }
  function playerStrength(){ return nationStrength(playerN); }
  function pay(cost){
    const n = G.nations[playerN];
    if (n.gold < cost){ log(`💰 金不足（需 ${cost}）`,'bad'); return false; }
    n.gold -= cost; return true;
  }
  function adjacentTo(nid){
    for (const pid in G.provinces){
      const pr = G.provinces[pid];
      if (pr.owner !== playerN) continue;
      for (const q of (ADJ[pid]||[])){
        if (G.provinces[q] && G.provinces[q].owner === nid) return true;
      }
    }
    return false;
  }
  function cleanupDead(){
    for (const nid in NATIONS){
      if (!G.nations[nid] || !G.nations[nid].alive) continue;
      if (!PROVINCES.some(p=>G.provinces[p.id].owner===nid)){
        G.nations[nid].alive = false;
        log(`☠️ ${NATIONS[nid].name} 国祚断绝！`,'sys');
        for (const k in G.dip){ if (k.includes(nid)) delete G.dip[k]; }
      }
    }
    checkGameEnd();
  }

  function propose(kind, nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    if (kind === 'alliance' && isAlliedWith(playerN,nid)) return;
    if (kind === 'truce' && hasTruce(playerN,nid)) return;
    const cost = kind==='alliance' ? SC_ACTION_COST.alliance : SC_ACTION_COST.truce;
    if (!pay(cost)) return;
    const rel = getRel(playerN,nid), m = realmMods(playerN);
    let chance = 0.35 + rel/250 + m.diplomacy/100;
    if (kind === 'truce') chance += 0.15;
    if (nationStrength(nid) > playerStrength()) chance -= 0.10;
    chance = clamp(chance, 0.05, 0.92);
    if (Math.random() < chance){
      if (kind === 'alliance') G.dip['ally:'+playerN+':'+nid] = {turns:12};
      else G.dip['truce:'+playerN+':'+nid] = {turns:8};
      addRel(playerN,nid,12);
      log(`🤝 ${NATIONS[nid].name}应允${kind==='alliance'?'结盟，共击强邻':'互不侵犯'}！`,'dip');
    } else {
      addRel(playerN,nid,-4);
      log(`❄ ${NATIONS[nid].name} 婉拒（关系 ${rel}，利与势未合）`,'dip');
    }
    showDip(); refresh();
  }

  function dipGift(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    if (!pay(SC_ACTION_COST.gift)) return;
    const m = realmMods(playerN);
    const gain = 10 + Math.round(m.diplomacy/3);
    addRel(playerN,nid,gain);
    log(`🎁 遣使赠礼，${NATIONS[nid].name} 关系 +${gain}`,'dip');
    showDip(); refresh();
  }

  function dipMarriage(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    ensureRealm(false);
    const k = relKey(playerN,nid);
    if (G.marriages[k]){ log('💍 两国已有婚姻之约','dip'); return; }
    if (getRel(playerN,nid) < 15){ log('💍 关系不足（需≥15），对方不愿联姻','bad'); return; }
    if (!pay(SC_ACTION_COST.marriage)) return;
    const m = realmMods(playerN);
    const chance = clamp(0.55 + getRel(playerN,nid)/300 + m.diplomacy/200, 0.25, 0.95);
    if (Math.random() < chance){
      G.marriages[k] = true;
      addRel(playerN,nid,25);
      G.dip['truce:'+playerN+':'+nid] = {turns:12};
      G.realms[playerN].stability = clamp(G.realms[playerN].stability + 4, 0, 100);
      log(`💍 与 ${NATIONS[nid].name} 联姻，关系 +25，互不侵犯12回合，民心+4`,'dip');
    } else {
      addRel(playerN,nid,-5);
      log(`💍 ${NATIONS[nid].name} 婉拒联姻`,'dip');
    }
    showDip(); refresh();
  }

  function dipTribute(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    const ratio = playerStrength() / (nationStrength(nid) + 1);
    if (ratio < 1.05){ log('⚔ 国力不足以威服，索贡难成','bad'); return; }
    const m = realmMods(playerN);
    const chance = clamp(0.20 + (ratio-1)*0.35 + getRel(playerN,nid)/400 + m.diplomacy/250, 0.05, 0.9);
    if (Math.random() < chance){
      const g = Math.min(80, Math.round(G.nations[nid].gold*0.25));
      const f = Math.min(60, Math.round(G.nations[nid].food*0.25));
      G.nations[nid].gold -= g; G.nations[nid].food -= f;
      G.nations[playerN].gold += g; G.nations[playerN].food += f;
      addRel(playerN,nid,-5,true);
      log(`⚔ 索贡成功：${NATIONS[nid].name} 献金${g}、粮${f}`,'good');
    } else {
      addRel(playerN,nid,-15);
      log(`⚔ ${NATIONS[nid].name} 拒绝索贡，关系 -15`,'bad');
    }
    showDip(); refresh();
  }

  function dipSurrender(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    const hisP = PROVINCES.filter(p=>G.provinces[p.id].owner===nid).length;
    const myP = PROVINCES.filter(p=>G.provinces[p.id].owner===playerN).length;
    const ratio = playerStrength() / (nationStrength(nid) + 1);
    if (hisP > 2 && ratio < 1.6){ log(`🏳 其国尚大（${hisP}城），劝降难成`,'bad'); return; }
    if (!adjacentTo(nid)){ log('🏳 需与目标接壤，才能陈兵劝降','bad'); return; }
    if (getRel(playerN,nid) < 20){ log('🏳 关系不足（需≥20），对方不肯听命','bad'); return; }
    if (!pay(SC_ACTION_COST.surrender)) return;
    const m = realmMods(playerN);
    let chance = 0.05 + getRel(playerN,nid)/300 + (ratio-1)*0.25 + m.diplomacy/200;
    if (hisP <= 2) chance += 0.20;
    if (G.realms[nid].stability < 35) chance += 0.10;
    chance = clamp(chance, 0.05, 0.90);
    if (Math.random() < chance){
      let g = 0, f = 0;
      for (const pid in G.provinces){
        const pr = G.provinces[pid];
        if (pr.owner === nid){ pr.owner = playerN; delete G.sieges[pid]; }
      }
      g = Math.round(G.nations[nid].gold*0.5); f = Math.round(G.nations[nid].food*0.5);
      G.nations[playerN].gold += g; G.nations[playerN].food += f;
      G.nations[nid].alive = false;
      addRel(playerN,nid,0,true);
      log(`🏳 ${NATIONS[nid].name} 举国归降！得 ${hisP} 城、金${g}、粮${f}`,'sys');
      cleanupDead();
    } else {
      addRel(playerN,nid,-20);
      G.realms[nid].stability = clamp(G.realms[nid].stability + 5, 0, 100);
      log(`🏳 ${NATIONS[nid].name} 拒绝劝降，关系 -20`,'bad');
    }
    showDip(); refresh();
  }

  function dipDefect(nid, value){
    if (!G || !G.nations[nid] || !G.nations[nid].alive || !value) return;
    const parts = value.split(':');
    const kind = parts[0], key = parts.slice(1).join(':');
    const m = realmMods(playerN);
    if (kind === 'prov'){
      const pid = key, pr = G.provinces[pid];
      if (!pr || pr.owner !== nid){ log('🕵 目标城邑已易手','bad'); return; }
      if (!adjacentTo(nid)){ log('🕵 需与目标接壤','bad'); return; }
      if (!pay(SC_ACTION_COST.defect_prov)) return;
      const garrison = sumTroops(pr.units);
      let chance = 0.06 + (50 - G.realms[nid].stability)/300 + getRel(playerN,nid)/400 + m.espionage*0.12 - garrison/600;
      if (pr.isCap) chance -= 0.08;
      chance = clamp(chance, 0.03, 0.80);
      if (Math.random() < chance){
        pr.owner = playerN; delete G.sieges[pid];
        log(`🕵 策反成功：${PROVINCES.find(p=>p.id===pid).name} 献城归附！`,'good');
        cleanupDead();
      } else {
        addRel(playerN,nid,-15);
        G.realms[nid].stability = clamp(G.realms[nid].stability + 3, 0, 100);
        log(`🕵 策反失败：${NATIONS[nid].name} 清查内奸，关系 -15`,'bad');
      }
    } else if (kind === 'hero'){
      const hname = key;
      let hp = null;
      for (const pid in G.provinces){
        if (G.provinces[pid].owner === nid && G.provinces[pid].hero === hname){ hp = G.provinces[pid]; break; }
      }
      if (!hp){ log('🕵 目标将领已不在其军中','bad'); return; }
      if (!pay(SC_ACTION_COST.defect_hero)) return;
      const hd = H.find(x=>x.name===hname);
      const grade = hd ? (hd.grade||'B') : 'B';
      let chance = 0.08 + getRel(playerN,nid)/350 + m.espionage*0.15 + (G.realms[nid].stability<35?0.10:0);
      if (grade.startsWith('S')) chance -= 0.10;
      chance = clamp(chance, 0.03, 0.75);
      if (Math.random() < chance){
        let dest = null;
        for (const pid in G.provinces){
          const pr = G.provinces[pid];
          if (pr.owner === playerN && !pr.hero){ dest = pr; break; }
        }
        if (!dest){
          log('🕵 策反成功，但我方无空缺可授职，暂不接纳','bad');
          G.nations[playerN].gold += SC_ACTION_COST.defect_hero;
        } else {
          hp.hero = null; dest.hero = hname;
          log(`🕵 策反成功：${hname} 弃暗投明，归我 ${PROVINCES.find(p=>p.id===dest.id).name}！`,'sys');
        }
      } else {
        addRel(playerN,nid,-20);
        log(`🕵 策反 ${hname} 失败，事泄，关系 -20`,'bad');
      }
    }
    showDip(); refresh();
  }

  function dipSow(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    if (!pay(SC_ACTION_COST.sow)) return;
    const m = realmMods(playerN);
    const chance = clamp(0.5 + m.espionage*0.15 + m.diplomacy/250, 0.2, 0.9);
    if (Math.random() < chance){
      G.realms[nid].stability = clamp(G.realms[nid].stability - 8, 0, 100);
      let n = 0;
      for (const k in G.dip){
        if (k.startsWith('ally:') && k.includes(nid)){
          const ids = k.split(':').slice(1);
          for (const x of ids) if (x !== nid && NATIONS[x]){ addRel(nid,x,-10,true); n++; }
        }
      }
      log(`🕵 离间成功：${NATIONS[nid].name} 民心 -8${n?`，其 ${n} 项同盟关系 -10`:''}`,'good');
    } else {
      addRel(playerN,nid,-10);
      log(`🕵 离间失败：${NATIONS[nid].name} 察觉，关系 -10`,'bad');
    }
    showDip(); refresh();
  }

  function dipAid(nid){
    if (!G || !isAlliedWith(playerN,nid)){ log('🤝 需先结盟，才能请盟军','bad'); return; }
    if (!pay(SC_ACTION_COST.aid)) return;
    const hisProvs = PROVINCES.filter(p=>G.provinces[p.id].owner===nid);
    const src = hisProvs.map(p=>G.provinces[p.id]).sort((a,b)=>sumTroops(b.units)-sumTroops(a.units))[0];
    const myCap = PROVINCES.find(p=>G.provinces[p.id].owner===playerN && p.isCap) ||
                  PROVINCES.find(p=>G.provinces[p.id].owner===playerN);
    if (!src || !myCap){ log('🤝 盟军无兵可派','bad'); return; }
    const unit = Object.keys(src.units).sort((a,b)=>src.units[b]-src.units[a])[0];
    const send = Math.min(20, src.units[unit]||0);
    if (send <= 0){ G.nations[playerN].gold += 80; log('🤝 盟军无兵，改赠金80','dip'); }
    else {
      src.units[unit] -= send;
      g0UnitsAdd(myCap.id, unit, send);
      log(`🤝 ${NATIONS[nid].name} 派 ${unit} ×${send} 援我 ${myCap.name}`,'good');
    }
    showDip(); refresh();
  }

  function dipMediate(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    const mid = document.getElementById('mediate_'+nid) ? document.getElementById('mediate_'+nid).value : '';
    if (!mid || mid===nid || mid===playerN){ log('🤝 请选择调停国（第三国）','bad'); return; }
    if (!pay(SC_ACTION_COST.mediate)) return;
    let chance = 0.30 + getRel(playerN,mid)/300 + (isAlliedWith(playerN,mid)?0.15:0);
    chance = clamp(chance, 0.05, 0.90);
    if (Math.random() < chance){
      const rel = getRel(playerN,nid);
      const gain = rel < 0 ? 12 : 6;
      addRel(playerN,nid,gain);
      addRel(playerN,mid,4);
      log(`🤝 ${NATIONS[mid].name} 出面调停：与 ${NATIONS[nid].name} 关系 +${gain}`,'good');
    } else {
      addRel(playerN,mid,-3);
      log(`🤝 ${NATIONS[mid].name} 不愿出面，关系 -3`,'bad');
    }
    showDip(); refresh();
  }

  function dipPassage(nid){
    if (!G || !G.nations[nid] || !G.nations[nid].alive) return;
    if (isAlliedWith(playerN,nid)){ G.passages = G.passages || {}; G.passages[nid] = 8; log('🛣 同盟通行无阻（8回合）','good'); showDip(); refresh(); return; }
    G.passages = G.passages || {};
    if (G.passages[nid]){ log(`🛣 ${NATIONS[nid].name} 已许借道（剩 ${G.passages[nid]} 回合）`,'dip'); return; }
    if (!pay(SC_ACTION_COST.passage)) return;
    let chance = 0.25 + getRel(playerN,nid)/300;
    chance = clamp(chance, 0.05, 0.90);
    if (Math.random() < chance){
      G.passages[nid] = 8;
      addRel(playerN,nid,2);
      log(`🛣 ${NATIONS[nid].name} 许借道（8回合）`,'good');
    } else {
      addRel(playerN,nid,-5);
      log(`🛣 ${NATIONS[nid].name} 不许借道，关系 -5`,'bad');
    }
    showDip(); refresh();
  }

  function showDip(){
    if (!G) return;
    ensureRealm(false);
    const L = $('dipList'); if (!L) return;
    const myStr = playerStrength();
    let h = `<p class="mini" style="margin-bottom:6px">关系 -100～+100；赠礼、联姻、政策可改善关系。劝降/策反需接壤或兵力优势。</p>`;
    for (const nid in NATIONS){
      if (nid === playerN || !G.nations[nid].alive) continue;
      const n = G.nations[nid];
      const hisP = PROVINCES.filter(p=>G.provinces[p.id].owner===nid).length;
      const rel = getRel(playerN,nid);
      const allied = isAlliedWith(playerN,nid), truce = hasTruce(playerN,nid);
      const relW = Math.round((rel+100)/2);
      const relCol = rel>=20 ? '#66bb6a' : rel<=-20 ? '#ef5350' : '#ffd54f';
      const weak = myStr > nationStrength(nid)*1.4;
      let opts = '';
      for (const p of PROVINCES){
        if (G.provinces[p.id].owner === nid) opts += `<option value="prov:${p.id}">城·${p.name}${p.isCap?' 👑':''}</option>`;
      }
      for (const p of PROVINCES){
        if (G.provinces[p.id].owner === nid && G.provinces[p.id].hero) opts += `<option value="hero:${G.provinces[p.id].hero}">将·${G.provinces[p.id].hero}</option>`;
      }
      h += `<div class="dipCard">
        <div class="dipHead">
          <span class="nc" style="background:${NATIONS[nid].color}"></span>
          <b style="color:${NATIONS[nid].color}">${NATIONS[nid].name}</b>
          <span class="st">占${hisP}城 · 强度${(nationStrength(nid)).toFixed(0)}</span>
          ${allied?'<span class="tag" style="color:#66bb6a">✦ 同盟</span>':''}
          ${truce?'<span class="tag" style="color:#42a5f5">🕊 互不侵犯</span>':''}
          <span class="relTag" style="color:${relCol}">关系 ${rel>=0?'+':''}${rel}</span>
        </div>
        <div class="relBar"><i style="width:${relW}%;background:${relCol}"></i></div>
        <div class="dipActions">
          <button ${allied||truce?'disabled':''} onclick="propose('alliance','${nid}')">结盟(200)</button>
          <button ${truce||allied?'disabled':''} onclick="propose('truce','${nid}')">互不侵犯(100)</button>
          <button onclick="dipGift('${nid}')">赠礼(100)</button>
          <button onclick="dipMarriage('${nid}')">联姻(150)</button>
          <button ${weak?'':'disabled'} onclick="dipTribute('${nid}')">索贡</button>
          <button ${weak?'':'disabled'} onclick="dipSurrender('${nid}')">劝降(250)</button>
          <button onclick="dipSow('${nid}')">离间(80)</button>
          <button ${allied?'':'disabled'} onclick="dipAid('${nid}')">请盟军(50)</button>
          <select id="mediate_${nid}" style="max-width:120px">${Object.keys(NATIONS).filter(x=>x!==playerN&&x!==nid).map(x=>`<option value="${x}">${NATIONS[x].name}</option>`).join('')||'<option value="">无中间国</option>'}</select>
          <button onclick="dipMediate('${nid}')">请调停(120)</button>
          <button onclick="dipPassage('${nid}')">请借道(150)</button>
        </div>
        <div class="dipActions" style="margin-top:4px">
          <select id="defect_${nid}" style="max-width:160px">${opts||'<option value="">无可策反目标</option>'}</select>
          <button ${opts?'':'disabled'} onclick="dipDefect('${nid}', document.getElementById('defect_${nid}').value)">策反(180/150)</button>
          <span class="mini">城需接壤；将需关系与民心</span>
        </div>
      </div>`;
    }
    if (Object.keys(G.dip).length){
      h += '<h3 style="border:none">📋 生效条约</h3>';
      for (const key in G.dip){
        const parts = key.split(':');
        const a = NATIONS[parts[1]] ? NATIONS[parts[1]].name : parts[1];
        const b = NATIONS[parts[2]] ? NATIONS[parts[2]].name : parts[2];
        h += `<p style="font-size:11px;color:#90caf9">· ${key.startsWith('ally')?'⚔同盟':'🕊互不侵犯'}：${a}—${b}（剩${G.dip[key].turns}回合）</p>`;
      }
    }
    L.innerHTML = h;
    $('dipModal').classList.remove('hidden');
  }

  /* ---------- AI 内政：偶尔开发、颁策、改善关系 ---------- */
  const _aiTurn = aiTurn;
  aiTurn = function(){
    _aiTurn();
    if (!G || !G.realms) return;
    for (const nid in NATIONS){
      if (nid === playerN || !G.nations[nid].alive) continue;
      const n = G.nations[nid], r = G.realms[nid]; if (!r) continue;
      if (n.gold > 320 && Math.random() < 0.20){
        const cand = PROVINCES.filter(p=>G.provinces[p.id].owner===nid && (G.provinces[p.id].dev||0)<3);
        if (cand.length){
          const p = cand[Math.floor(Math.random()*cand.length)];
          const d = G.provinces[p.id].dev||0;
          n.gold -= 100 + d*60; G.provinces[p.id].dev = d+1;
        }
      }
      if (Object.keys(r.policies).length < 2 && n.gold > 320 && Math.random() < 0.14){
        const ids = Object.keys(SC_POLICIES).filter(x=>!r.policies[x]);
        if (ids.length){
          const id = ids[Math.floor(Math.random()*ids.length)];
          if (n.gold >= SC_POLICIES[id].cost){
            n.gold -= SC_POLICIES[id].cost;
            r.policies[id] = {left:SC_POLICIES[id].turns};
          }
        }
      }
      if (Math.random() < 0.05) addRel(nid, playerN, 2, true);
    }
  };

  /* ---------- 注入按钮、弹窗与样式 ---------- */
  function injectUI(){
    const top = $('top');
    if (top && !$('btnRealm')){
      const btn = document.createElement('button');
      btn.id = 'btnRealm'; btn.className = 'gold';
      btn.textContent = '🏛 内政'; btn.style.display = 'none';
      btn.onclick = showRealm;
      const end = $('btnEnd');
      if (end) top.insertBefore(btn, end); else top.appendChild(btn);
    }
    if (!$('realmModal')){
      document.body.insertAdjacentHTML('beforeend',
        `<div class="modal hidden" id="realmModal"><div class="box" style="max-width:760px">
          <h2>🏛 内政 · 法律与政策</h2>
          <div id="realmBody" style="font-size:12px;line-height:1.7"></div>
          <div style="text-align:right;margin-top:14px"><button class="primary" onclick="closeRealm()">完成</button></div>
        </div></div>`);
    }
    if (!$('scStyle')){
      const st = document.createElement('style'); st.id = 'scStyle';
      st.textContent = `
.realmStats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0}
.realmStat{background:var(--bg2);border:1px solid var(--line);border-radius:5px;padding:5px 7px;font-size:10.5px;position:relative;overflow:hidden}
.realmStat span{color:var(--dim);display:block}
.realmStat b{font-size:14px;color:var(--txt)}
.realmStat b.bad{color:#ef5350}
.realmStat i{display:block;height:4px;background:var(--gold);width:var(--v);border-radius:2px;margin-top:3px}
.realmStat i.cor{background:#ef5350}
.realmNow{background:var(--bg0);border:1px dashed var(--line);border-radius:5px;padding:6px 8px;margin:6px 0;font-size:11.5px}
.realmGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.realmCard{background:var(--bg2);border:1px solid var(--line);border-radius:5px;padding:7px 8px;font-size:11px}
.realmCard.on{border-color:#ffd54f;box-shadow:0 0 0 1px #ffd54f55}
.realmCard .rcHead{display:flex;gap:6px;align-items:center;margin-bottom:3px}
.realmCard .rcHead b{color:var(--gold);font-size:12.5px}
.realmCard .tag.on{color:#ffd54f}
.realmCard .rcDesc{color:#b0bec5;line-height:1.55}
.realmCard .rcEff{color:#81c784;font-size:10.5px;margin-top:3px}
.realmCard .rcCite{color:#607d8b;font-size:9.5px;margin-top:3px;line-height:1.4}
.realmCard button{margin-top:5px;width:100%;padding:3px 6px;font-size:10.5px}
.devBox{margin-top:6px;padding:6px 8px;background:var(--bg0);border:1px dashed #455a64;border-radius:4px;font-size:11px}
.devBox button{margin-top:4px;padding:3px 8px;font-size:10.5px}
.dipCard{background:var(--bg2);border:1px solid var(--line);border-radius:5px;padding:7px 8px;margin:6px 0}
.dipHead{display:flex;align-items:center;gap:6px;font-size:11.5px}
.dipHead .nc{width:14px;height:14px;border-radius:3px;border:1px solid #666}
.dipHead .st{color:var(--dim);font-size:10px}
.dipHead .relTag{margin-left:auto;font-size:10.5px}
.relBar{height:6px;background:var(--bg0);border:1px solid var(--line);border-radius:3px;overflow:hidden;margin:4px 0}
.relBar i{display:block;height:100%}
.dipActions{display:flex;gap:4px;flex-wrap:wrap}
.dipActions button{padding:2px 6px;font-size:10px}
.dipActions select{font-size:10px;padding:2px 4px}
`;
      document.head.appendChild(st);
    }
    updateRealmChip();
  }

  /* ---------- 暴露给内联 onclick ---------- */
  window.showRealm = showRealm;
  window.closeRealm = closeRealm;
  window.enactLaw = enactLaw;
  window.enactPolicy = enactPolicy;
  window.cancelPolicy = cancelPolicy;
  window.developProvince = developProvince;
  window.showDip = showDip;
  window.propose = propose;
  window.dipGift = dipGift;
  window.dipMarriage = dipMarriage;
  window.dipTribute = dipTribute;
  window.dipSurrender = dipSurrender;
  window.dipDefect = dipDefect;
  window.dipSow = dipSow;
  window.dipAid = dipAid;

  injectUI();
})();
