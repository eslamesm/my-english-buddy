/* Read-only helpers for the grade/stage exam view. They never write profile data
   and never change pass rules; they only read ProgressionExam attempts and practice stats. */
(function(root){
  'use strict';
  function parseScope(fp){try{const o=JSON.parse(fp);return o&&o.grade?{kind:o.kind,grade:o.grade,term:String(o.fromTerm||'1')}:null;}catch(e){return null;}}
  function stageKey(grade,term){return String(grade)+':'+(String(term)==='2'?'2':'1');}
  /* attempts newest first. status: none | not-passed | passed */
  function stageResults(profile,grade,term,currentFp){
    const s=profile&&profile.progressionExam,list=(s&&Array.isArray(s.attempts)?s.attempts:[]);
    const key=stageKey(grade,term);
    const mine=list.filter(a=>{const sc=parseScope(a&&a.fingerprint);return sc&&stageKey(sc.grade,sc.term)===key;});
    const tries=mine.map((a,i)=>({n:i+1,correct:a.correct,total:a.total,passed:!!a.passed,at:a.at,reviewed:!!a.reviewed,current:typeof currentFp==='string'?a.fingerprint===currentFp:null}));
    /* A pass counts as current only when it was made on the current word set (same fingerprint).
       A pass on an older word set is shown as 'passed-earlier' and never implies an unlock. If the caller
       gives no current fingerprint, a pass is 'passed-unverified'. */
    let status='none';
    if(tries.length){const p=tries.filter(t=>t.passed);
      if(!p.length)status='not-passed';
      else if(typeof currentFp!=='string')status='passed-unverified';
      else status=p.some(t=>t.current)?'passed':'passed-earlier';}
    return {key,status,tries:tries.slice().reverse(),count:tries.length};
  }
  /* The only stored practice result is one global last exam. Show it on a unit only when it belongs to that unit. */
  function practiceRow(profile,unitKey){
    const le=profile&&profile.stats&&profile.stats.lastExam;
    if(!le||le.key!==unitKey||!Number.isFinite(le.pct))return null;
    return {pct:le.pct,correct:le.correct,total:le.total,stars:le.pct>=90?3:le.pct>=70?2:le.pct>=50?1:0};
  }
  root.StageResults={parseScope,stageKey,stageResults,practiceRow};
})(typeof window!=='undefined'?window:globalThis);
