/* Journey map + stage detail (dev copy). Read-only view over existing progression data.
   It never changes pass rules, mastery, SRS or stored profile data. UI language is settings.uiLang (device level). */
(function(root){
  'use strict';
  const SLOTS=[{x:34,y:20},{x:204,y:100},{x:44,y:200},{x:194,y:330},{x:34,y:440}]; /* far-future ... current ... oldest */
  const SEG=['M89 49 C 200 49,160 129,259 129','M259 129 C 340 129,190 229,99 234','M99 234 C 40 238,300 300,249 359','M249 359 C 200 420,140 440,89 469'];
  const LOCK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3a2c0" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  const CHK='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
  const PLAY='<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5l11 7-11 7z"/></svg>';
  const DASH='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a3a2c0" stroke-width="3" stroke-linecap="round"><path d="M6 12h12"/></svg>';
  const STAR='<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffb800"><path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z"/></svg>';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- pure model (testable) ---------- */
  /* a check means really mastered (all words at 3 stars) or a valid pass; being placed before the active stage is shown separately */
  function isDone(st){return st.state==='done'&&(st.mastery.complete||st.results.status==='passed');}
  function candidateFor(unit,units,grades){
    const gi=grades.findIndex(g=>g.id===unit.base),term=unit.term||'1';
    if(unit.base==='p1'&&term==='1')return {kind:'term',fromGrade:'p1',toGrade:'p1',fromTerm:'1',toTerm:'2'};
    const next=grades[gi+1];
    if(next&&units.some(u=>u.base===next.id&&(u.words||[]).length))return {kind:'grade',fromGrade:unit.base,toGrade:next.id,fromTerm:term,toTerm:'1'};
    return {kind:'complete',grade:unit.base,term:term};
  }
  function buildStages(p,d){
    const units=(d.units||[]).filter(u=>(u.words||[]).length);
    const active=d.activeUnit?d.activeUnit(p):null;
    const ai=active?units.findIndex(u=>u.key===active.key):-1;
    const now=d.scopeNow?d.scopeNow(p):null;
    return units.map((u,i)=>{
      const m=d.CurriculumPath.mastery(p,u.words);
      const cand=candidateFor(u,d.units,d.grades);
      const sc=d.ProgressionExam.scope(p,cand,d.units,d.subunits);
      const fp=sc?sc.fingerprint:null;
      const state=ai<0?'locked':(i<ai?'done':(i===ai?'current':'locked'));
      const res=d.StageResults.stageResults(p,u.base,u.term||'1',fp||'');
      const canStart=state==='current'&&!!now&&!!fp&&now.fingerprint===fp&&res.status!=='passed';
      return {unit:u,idx:i,state,mastery:m,fingerprint:fp,results:res,canStart,practice:d.StageResults.practiceRow(p,u.key)};
    });
  }
  function windowSlots(stages){
    const ci=stages.findIndex(s=>s.state==='current');
    const out=new Array(5).fill(null);
    if(ci<0){stages.slice(0,5).forEach((s,i)=>{out[i]=s;});return out;}
    for(let k=-2;k<=2;k++){const s=stages[ci-k];if(s)out[2+k]=s;} /* slot 2 = current; slot 0 = two stages ahead; slot 4 = two behind */
    return out;
  }
  /* ---------- DOM ---------- */
  const T=(k)=>I18N.t(k),D=(n)=>I18N.digits(n);
  function lang(){return (typeof settings!=='undefined'&&settings.uiLang==='en')?'en':'ar';}
  function applyLang(){I18N.set(lang());}
  function setLang(l){settings.uiLang=I18N.norm(l);saveSettings();applyLang();rerender();}
  function stageName(u,short){const g=I18N.gradeName(u.base,u.grade);return u.base==='p1'?(g+(short?'<br>':' · ')+T('stage.term')+' '+D(u.term)):g;}
  function stageNameText(u){return I18N.gradeName(u.base,u.grade)+(u.base==='p1'?' · '+T('stage.term')+' '+D(u.term):'');}
  function deps(){return {units:CUR_UNITS,grades:CUR_GRADES,subunits:CUR_SUBUNITS,activeUnit:activeCurriculumUnit,scopeNow:progressionScope,CurriculumPath,ProgressionExam,StageResults};}
  const backSvg=()=>'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2350" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+(lang()==='en'?'M15 5l-7 7 7 7':'M9 5l7 7-7 7')+'"/></svg>';
  function legendHtml(){return T('legend').split('·').map(x=>'<span>'+esc(x.trim())+'</span>').join('');}
  function langBtn(){const other=lang()==='en'?'ar':'en';return '<button class="mj-chip" id="mjLang" type="button" aria-label="'+esc(T('lang.label'))+'" data-lang="'+other+'">'+esc(T('lang.'+other))+'</button>';}
  function header(title,onBack){return '<div class="mj-hd">'+(onBack?'<button class="mj-bk" id="mjBack" type="button" aria-label="'+esc(T('stage.back'))+'">'+backSvg()+'</button>':'')+'<h1>'+esc(title)+'</h1>'+langBtn()+'<div class="mj-chip">'+STAR+'<span>'+D(totalStars())+'</span></div></div>';}
  function header2(title){return '<div class="mj-hd"><button class="mj-bk" id="mjBack" type="button" aria-label="'+esc(T('stage.back'))+'">'+backSvg()+'</button><div style="flex:1"></div>'+langBtn()+'<div class="mj-chip">'+STAR+'<span>'+D(totalStars())+'</span></div></div><h1 class="mj-h1">'+esc(title)+'</h1>';}
  function bindCommon(el,backFn){const l=el.querySelector('#mjLang');if(l)l.onclick=()=>setLang(l.dataset.lang);const b=el.querySelector('#mjBack');if(b&&backFn)b.onclick=backFn;}
  let current={screen:null,idx:null};
  function ensureScreen(id){let s=document.getElementById('screen-'+id);if(!s){s=document.createElement('section');s.id='screen-'+id;s.className='screen';const host=document.getElementById('screen-home').parentNode;host.insertBefore(s,document.getElementById('screen-home').nextSibling);}return s;}
  function renderJourney(){
    const p=currentProfile();const s=ensureScreen('journey');if(!p){s.innerHTML='';return;}
    applyLang();const en=lang()==='en';const stages=buildStages(p,deps()),slots=windowSlots(stages);
    const g=(typeof AGES!=='undefined'&&AGES.find(a=>a.key===p.levelKey))||null;
    let seg='';
    SEG.forEach((d,i)=>{if(!slots[i]||!slots[i+1])return;const done=i>=2;seg+='<path d="'+d+'" stroke="'+(done?'#bfe9d9':'#e2e0f2')+'" stroke-width="'+(done?18:16)+'" stroke-linecap="round"/>'+(done?'<path d="'+d+'" stroke="#25a982" stroke-width="9" stroke-linecap="round"/>':'')+'<path d="'+d+'" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 10"/>';});
    let nodes='';
    slots.forEach((st,i)=>{if(!st)return;const c=st.state==='current',d=st.state==='done'&&isDone(st);const pos=SLOTS[i];const ear=st.state==='done'&&!d;
      nodes+='<button class="mj-node'+(c?' cur':'')+'" type="button" data-i="'+st.idx+'" style="left:'+pos.x+'px;top:'+pos.y+'px"><span class="mj-nb'+(c?' cur':d?' d':'')+'">'+(c?PLAY:d?CHK:ear?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25a982" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="4"/></svg>':LOCK)+'</span>'+stageName(st.unit,true)+(c?'<span style="font-size:11px">'+D(st.mastery.mastered)+' '+esc(T('stage.of'))+' '+D(st.mastery.total)+'</span>':'')+'</button>';});
    const hasCur=slots[2]&&slots[2].state==='current';
    s.innerHTML='<div class="mj" dir="'+(en?'ltr':'rtl')+'" lang="'+lang()+'">'+header(T('journey.title'))+(g&&!en?'<div class="mj-lvl">'+esc(T('level.badge'))+': '+esc(g.title)+'</div>':'')+
      '<div class="mj-map'+(en?' mj-mirror':'')+'"><svg class="mj-pth" viewBox="0 0 390 560" fill="none" preserveAspectRatio="none"><path d="M-20 520 C 80 470,160 520,260 490 C 330 470,380 480,420 470 L420 600 L-20 600Z" fill="#e3f3ec"/><path d="M-20 548 C 90 505,200 560,420 510 L420 600 L-20 600Z" fill="#d3ede2"/><g fill="#fff" opacity=".9"><ellipse cx="310" cy="38" rx="30" ry="11"/><ellipse cx="292" cy="30" rx="16" ry="11"/><ellipse cx="60" cy="150" rx="22" ry="8"/></g>'+seg+'</svg>'+
      '<img class="mj-tro" src="assets/ui/trophy.png" alt="" style="left:172px;top:6px">'+nodes+
      (hasCur?'<img class="mj-me" src="assets/ui/buddy-cut.png" alt="" style="left:150px;top:176px"><div class="mj-bub" style="left:222px;top:190px">'+esc(T('phrase.step'))+'</div><div class="mj-pill" style="left:22px;top:340px">'+esc(T('phrase.today'))+'</div>':'')+'</div><div class="mj-leg">'+legendHtml()+'</div></div>';
    bindCommon(s);
    s.querySelectorAll('.mj-node').forEach(b=>b.onclick=()=>openStage(parseInt(b.dataset.i,10)));
  }
  function examCard(st){
    const r=st.results,chips='<div class="mj-chs"><span>'+esc(T('exam.words20'))+'</span><span>'+esc(T('exam.pass90'))+'</span><span>'+esc(T('exam.unlimited'))+'</span></div>';
    const icon=(bg,svg)=>'<div class="mj-ei" style="background:'+bg+'">'+svg+'</div>';
    const head=(ic,title,sub)=>'<div class="mj-exh">'+ic+'<div><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></div></div>';
    const btn=st.canStart?'<button class="mj-bt on" id="mjStart" type="button">'+esc(T('exam.start'))+'</button>':'';
    if(r.status==='passed')return '<div class="mj-ex ok">'+head(icon('#25a982',CHK),T('exam.passed'),T('exam.title'))+chips+'</div>';
    if(r.status==='passed-earlier')return '<div class="mj-ex lk">'+head(icon('#ecebf6',DASH),T('exam.passedEarlier'),T('exam.title'))+chips+btn+'</div>';
    if(st.canStart)return '<div class="mj-ex">'+head(icon('#ffeccc',PLAY.replace('#fff','#8a5a00')),T('exam.ready'),T('exam.title'))+chips+btn+'</div>';
    if(st.state==='done'&&r.status==='none')return '<div class="mj-ex lk">'+head(icon('#ecebf6',DASH),T('exam.none'),T('exam.title'))+chips+'</div>';
    return '<div class="mj-ex lk">'+head(icon('#ecebf6',LOCK),T('exam.title'),st.state==='current'?T('exam.locked'):T('exam.notThisStage'))+chips+'</div>';
  }
  function renderStage(i){
    const p=currentProfile();const s=ensureScreen('stage');if(!p)return;
    applyLang();const en=lang()==='en';const st=buildStages(p,deps())[i];if(!st){s.innerHTML='';return;}
    const side=en?'right':'left',txs=en?'left':'right',m=st.mastery,pct=m.total?Math.round(m.mastered/m.total*100):0;
    let rows='<div class="mj-ttl">'+esc(T('exam.results'))+'</div>';
    if(st.results.tries.length){st.results.tries.forEach(t=>{rows+='<div class="mj-rw"><div class="n">'+esc(T('exam.try'))+' '+D(t.n)+'<small>'+D(t.correct)+' '+esc(T('exam.of'))+' '+D(t.total)+'</small></div><span class="mj-tg '+(t.passed?'g':'o')+'">'+esc(T(t.passed?'exam.passedTag':'exam.reviewTag'))+'</span></div>';});}
    else rows+='<div class="mj-emp"><b>'+esc(T('exam.none'))+'</b><small>'+esc(T('exam.none.sub'))+'</small></div>';
    if(st.practice)rows+='<div class="mj-ttl">'+esc(T('practice.title'))+'</div><div class="mj-rw"><div class="n">'+esc(T('practice.last'))+'<small>'+esc(T('practice.note'))+'</small></div><span class="mj-tg g"><bdi dir="ltr">'+D(st.practice.pct)+(en?'%':'٪')+'</bdi></span></div>';
    s.innerHTML='<div class="mj" dir="'+(en?'ltr':'rtl')+'" lang="'+lang()+'">'+header2(stageNameText(st.unit))+'<div class="mj-sc"><div class="mj-hero"><img src="assets/ui/buddy-cut.png" alt="" style="'+side+':14px"><div class="tx" style="'+txs+':22px"><small>'+esc(T('pos.'+(st.state==='done'?'earlier':st.state==='current'?'current':'ahead')))+' · '+esc(T('stage.words'))+'</small><b>'+D(m.mastered)+' '+esc(T('stage.of'))+' '+D(m.total)+'</b><div class="mj-bar"><i style="width:'+pct+'%"></i></div><div class="mj-ph">'+esc(T(st.results.status==='passed'?'phrase.next':'phrase.step'))+'</div></div></div></div><div class="mj-sc">'+examCard(st)+'</div>'+rows+'</div>';
    bindCommon(s,()=>openJourney());
    const b=s.querySelector('#mjStart');if(b)b.onclick=()=>startProgressionExam();
  }

  /* ---------- Home v3 shell (additive; the old home content stays and is reachable behind "All sections") ---------- */
  function openLegacy(panel){const sc=document.getElementById('screen-home');sc.classList.add('mj-legacy');renderHomeV3();
    if(panel){const it=document.querySelector('.side-item[data-panel="panel-'+panel+'"]');if(it)it.click();}
    const pn=document.getElementById(panel?'panel-'+panel:'')||sc.querySelector('.home-wrap');if(pn)pn.scrollIntoView({block:'start'});}
  function renderHomeV3(){
    const p=currentProfile(),sc=document.getElementById('screen-home');if(!p||!sc)return;
    applyLang();const en=lang()==='en';let host=document.getElementById('mjHome');
    if(!host){host=document.createElement('div');host.id='mjHome';sc.insertBefore(host,sc.firstChild);}
    const stages=buildStages(p,deps()),cur=stages.find(s=>s.state==='current')||null;
    const g=(typeof AGES!=='undefined'&&AGES.find(a=>a.key===p.levelKey))||null;
    const path=cur?[stages[cur.idx-1],cur,stages[cur.idx+1]].filter(Boolean):stages.slice(0,3);
    const nodeHtml=(st,i)=>{const c=st.state==='current',d=isDone(st),ear=st.state==='done'&&!d;return (i?'<div class="mj-ln"></div>':'')+'<button class="mj-nd'+(c?' cur':'')+'" type="button" data-i="'+st.idx+'"><span class="mj-dot'+(c?' cur':d?' d':'')+'">'+(c?'<svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="6"/></svg>':d?'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>':ear?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25a982" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="4"/></svg>':'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a3a2c0" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>')+'</span>'+stageName(st.unit,true)+'</button>';};
    const card=(cls,k,img,panel)=>'<button class="mj-c '+cls+'" type="button" data-panel="'+panel+'"><b>'+esc(T('home.'+k))+'</b><small>'+esc(T('home.'+k+'.s'))+'</small><img src="'+img+'" alt=""></button>';
    const next=cur?esc(stageNameText(cur.unit))+' · '+D(cur.mastery.mastered)+' '+esc(T('stage.of'))+' '+D(cur.mastery.total):'';
    const open=sc.classList.contains('mj-legacy');
    host.innerHTML='<div class="mj mj-homebox" dir="'+(en?'ltr':'rtl')+'" lang="'+lang()+'"><div class="mj-top"><div class="mj-av"><img src="assets/ui/buddy-cut.png" alt=""></div><div class="mj-hi"><small>'+esc(T('home.hello'))+'</small><b>'+esc(p.name)+'</b></div>'+langBtn()+'<div class="mj-chip">'+STAR+'<span>'+D(totalStars())+'</span></div></div>'+
      '<div class="mj-sc"><div class="mj-herob"><img src="assets/ui/buddy-cut.png" alt="" style="'+(en?'right':'left')+':6px"><div class="tx">'+(g&&!en?'<span class="mj-lv">'+esc(g.title)+'</span>':'')+'<h2>'+esc(T('home.hero.title'))+'</h2><p>'+esc(T('home.next'))+'</p><p class="nx">'+next+'</p><button class="mj-go" id="mjGo" type="button">'+esc(T('home.start'))+'</button></div></div></div>'+
      (path.length?'<div class="mj-sec"><b>'+esc(T('home.journey'))+'</b><button type="button" id="mjMap">'+esc(T('home.viewMap'))+'</button></div><div class="mj-path">'+path.map(nodeHtml).join('')+'</div><div class="mj-leg">'+legendHtml()+'</div>':'')+
      '<div class="mj-sec"><b>'+esc(T('home.pick'))+'</b></div><div class="mj-grid">'+card('t1','learn','assets/ui/number-blocks.png','learn')+card('t2','games','assets/ui/ball.png','games')+card('t3','stories','assets/ui/storybook.png','stories')+card('t4','stars','assets/ui/trophy.png','achv')+'</div>'+
      '<button class="mj-more" id="mjAll" type="button">'+esc(T(open?'home.less':'home.all'))+'</button></div>';
    bindCommon(host);
    host.querySelectorAll('.mj-nd').forEach(b=>b.onclick=()=>openStage(parseInt(b.dataset.i,10)));
    const m=host.querySelector('#mjMap');if(m)m.onclick=()=>openJourney();
    const go1=host.querySelector('#mjGo');if(go1)go1.onclick=()=>openLegacy('session');
    host.querySelectorAll('.mj-c').forEach(b=>b.onclick=()=>openLegacy(b.dataset.panel));
    host.querySelector('#mjAll').onclick=()=>{sc.classList.toggle('mj-legacy');renderHomeV3();};
  }
  function rerender(){if(current.screen==='journey')renderJourney();else if(current.screen==='stage')renderStage(current.idx);else renderHomeV3();if(document.body.classList.contains('meb-nav-on'))renderNav(current.screen==='home'?'home':'journey');}
  function openJourney(){current={screen:'journey',idx:null};renderJourney();go('journey');}
  function openStage(i){current={screen:'stage',idx:i};renderStage(i);go('stage');}

  /* Learn v2 header + nav sync (presentation only) */
  function learnHero(){const pl=document.getElementById('panel-learn');if(!pl)return;let h=document.getElementById('mjLearnHero');
    const old=pl.querySelector('h2.title');if(old)old.style.display='none';applyLang();
    if(!h){h=document.createElement('div');h.id='mjLearnHero';pl.insertBefore(h,pl.firstChild);}
    h.setAttribute('dir',lang()==='en'?'ltr':'rtl');
    h.innerHTML='<div class="mj-lh"><img src="assets/ui/buddy-cut.png" alt=""><div><b>'+esc(T('learn.title'))+'</b><small>'+esc(T('learn.sub'))+'</small></div>'+langBtn()+'</div>';
    const l=h.querySelector('#mjLang');if(l)l.onclick=()=>setLang(l.dataset.lang);}
  function homeNavKey(){const pl=document.getElementById('panel-learn'),sc=document.getElementById('screen-home');return pl&&sc&&sc.classList.contains('mj-legacy')&&pl.classList.contains('active')?'learn':'home';}
  function watchPanels(){const pl=document.getElementById('panel-learn'),sc=document.getElementById('screen-home');if(!pl||!sc||pl.__mjw)return;pl.__mjw=1;
    const sync=()=>{if(pl.classList.contains('active'))learnHero();
      if(document.body.classList.contains('meb-nav-on')&&sc.classList.contains('active')&&current.screen==='home')renderNav(homeNavKey());};
    new MutationObserver(sync).observe(pl,{attributes:true,attributeFilter:['class']});
    new MutationObserver(sync).observe(sc,{attributes:true,attributeFilter:['class']});}
  /* ---------- bottom nav ---------- */
  function buildNav(){
    if(document.getElementById('mebNav'))return;const n=document.createElement('nav');n.id='mebNav';n.setAttribute('aria-label','main');document.body.appendChild(n);}
  function renderNav(active){
    buildNav();applyLang();const n=document.getElementById('mebNav');n.setAttribute('dir',lang()==='en'?'ltr':'rtl');
    const ic={home:'<path d="M4 11l8-7 8 7v9H4z"/>',journey:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8 17c6 0 2-9 8-9"/>',learn:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v13"/>',me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'};
    n.innerHTML=['home','journey','learn','me'].map(k=>'<button type="button" data-k="'+k+'" class="'+(active===k?'on':'')+'"><i><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="'+(active===k?'#3d41a8':'#a3a2c0')+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+ic[k]+'</svg></i>'+esc(T('nav.'+k))+'</button>').join('');
    n.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;
      if(k==='journey'){openJourney();return;}
      enterHome();
      if(k==='learn'||k==='me'){openLegacy(k==='learn'?'learn':'achv');}
    });
  }
  function syncNav(id){
    const on=['home','journey','stage'].indexOf(id)>=0&&!!currentProfile();document.body.classList.toggle('meb-nav-on',on);
    if(id==='home'){const sc=document.getElementById('screen-home');if(sc)sc.classList.remove('mj-legacy');current={screen:'home',idx:null};renderHomeV3();}
    watchPanels();if(on)renderNav(id==='home'?homeNavKey():'journey');
  }
  root.MEBJourney={isDone,renderHomeV3,openLegacy,candidateFor,buildStages,windowSlots,openJourney,openStage,setLang,syncNav,renderJourney,renderStage};
})(typeof window!=='undefined'?window:globalThis);
