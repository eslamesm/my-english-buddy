/* Dedicated progression assessment. Policy approved 2026-11-24. Ordinary exams never create this proof. */
(function(root){
  'use strict';
  const VERSION='progression-exam-1', COUNT=20, PASS=90;
  const key=w=>String(w&&w.t||'').trim().toLowerCase();
  function unique(words){const seen=new Set();return (words||[]).filter(w=>{const k=key(w);if(!k||seen.has(k))return false;seen.add(k);return true;});}
  function shuffled(a,rng){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
  function scope(profile,candidate,units,subunits){
    if(!profile||!candidate||!['term','grade','complete'].includes(candidate.kind))return null;
    const grade=candidate.fromGrade||candidate.grade;
    const use=(units||[]).filter(u=>u.base===grade&&(candidate.kind!=='term'||u.term===candidate.fromTerm));
    const groups=[];
    use.forEach(u=>{const subs=(subunits||{})[u.key];if(subs&&subs.length){subs.forEach(s=>groups.push({term:u.term||'1',unit:u.key+':'+s.n,words:unique((s.words||[]).map(w=>({t:w[0],emoji:w[1],ar:w[2]})))}));const mapped=new Set(groups.filter(g=>g.term===(u.term||'1')).flatMap(g=>g.words.map(key)));const remaining=unique(u.words).filter(w=>!mapped.has(key(w)));if(remaining.length)groups.push({term:u.term||'1',unit:u.key+':other',words:remaining});}else groups.push({term:u.term||'1',unit:u.key,words:unique(u.words)});});
    const words=unique(groups.flatMap(g=>g.words));if(!words.length)return null;
    const identity={version:VERSION,profileId:profile.id,kind:candidate.kind,grade,fromTerm:candidate.fromTerm||candidate.term||'1',toGrade:candidate.toGrade||null,toTerm:candidate.toTerm||null,available:words.map(w=>[key(w),w.emoji||'',w.ar||'']).sort((a,b)=>a[0].localeCompare(b[0])),content:groups.map(g=>({term:g.term,unit:g.unit,words:g.words.map(w=>[key(w),w.emoji||'',w.ar||'']).sort((a,b)=>a[0].localeCompare(b[0]))}))};
    return {fingerprint:JSON.stringify(identity),candidate,groups,words,total:Math.min(COUNT,words.length),grade};
  }
  /* Round-robin terms first, then units within each term. Distinct words can belong to more than one unit. */
  function select(scope,rng){
    rng=rng||Math.random;const terms=shuffled([...new Set(scope.groups.map(g=>g.term))],rng).map(term=>({groups:shuffled(scope.groups.filter(g=>g.term===term).map(g=>({words:shuffled(g.words,rng)})),rng),cursor:0}));
    const out=[],seen=new Set();let changed=true;
    while(out.length<scope.total&&changed){changed=false;for(const term of terms){let found=null;for(let j=0;j<term.groups.length;j++){const group=term.groups[term.cursor++%term.groups.length];while(group.words.length&&seen.has(key(group.words[0])))group.words.shift();if(group.words.length){found=group.words.shift();break;}}if(found){out.push(found);seen.add(key(found));changed=true;}if(out.length===scope.total)break;}}
    return shuffled(out,rng);
  }
  function score(correct,total){return Number.isInteger(correct)&&Number.isInteger(total)&&total>0&&correct>=0&&correct<=total&&correct*100>=PASS*total;}
  function validProof(profile,scope){const s=profile&&profile.progressionExam;const p=s&&s.pass;return !!(scope&&p&&p.version===VERSION&&p.profileId===profile.id&&p.fingerprint===scope.fingerprint&&typeof p.attemptId==='string'&&s.version===VERSION&&Array.isArray(s.attempts)&&s.attempts.some(a=>a.attemptId===p.attemptId&&a.passed&&a.profileId===profile.id&&a.fingerprint===scope.fingerprint&&a.correct===p.correct&&a.total===p.total)&&p.total===scope.total&&score(p.correct,p.total));}
  function state(profile){let s=profile.progressionExam;if(!s||s.version!==VERSION||!Array.isArray(s.attempts)){s={version:VERSION,attempts:[],pass:null,last:null};profile.progressionExam=s;}return s;}
  function needsReview(profile,scope){const s=state(profile),a=s.last;return !!(a&&a.fingerprint===scope.fingerprint&&!a.passed&&a.wrong&&a.wrong.length&&!a.reviewed);}
  function commit(profile,scope,attempt){
    if(!profile||!scope||typeof attempt.attemptId!=='string'||!attempt.attemptId||attempt.profileId!==profile.id||attempt.fingerprint!==scope.fingerprint||attempt.total!==scope.total||!Number.isInteger(attempt.correct)||attempt.correct<0||attempt.correct>attempt.total||!Array.isArray(attempt.wrong)||unique(attempt.wrong).length!==attempt.wrong.length||attempt.wrong.some(w=>!scope.words.some(x=>key(x)===key(w)))||attempt.wrong.length!==attempt.total-attempt.correct)return null;
    const s=state(profile);if(s.attempts.some(a=>a.attemptId===attempt.attemptId))return null;
    const a={version:VERSION,attemptId:attempt.attemptId,profileId:profile.id,fingerprint:scope.fingerprint,correct:attempt.correct,total:attempt.total,wrong:attempt.wrong.map(w=>({t:w.t,emoji:w.emoji,ar:w.ar})),passed:score(attempt.correct,attempt.total),reviewed:false,at:Date.now()};
    s.attempts.push(a);s.last=a;if(a.passed)s.pass={version:VERSION,profileId:profile.id,fingerprint:scope.fingerprint,attemptId:a.attemptId,correct:a.correct,total:a.total,at:a.at};else s.pass=null;return a;
  }
  root.ProgressionExam={VERSION,COUNT,PASS,key,unique,scope,select,score,validProof,state,needsReview,commit};
})(typeof window!=='undefined'?window:globalThis);
