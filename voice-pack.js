/* voice-pack.js - optional pre-generated voice packs for My English Buddy (dev copy).
   Pure helpers, no DOM, no storage. The app keeps its own settings object (settings.rate etc).
   A pack is used ONLY when the manifest lists the clip as present; otherwise null is returned and
   the caller keeps today's behaviour (existing wav, then browser speech). */
(function(root, factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.VoicePack=factory();
})(typeof self!=='undefined'?self:this, function(){
  'use strict';
  var DEFAULT_PACK='device';          /* device = current behaviour, no pack */
  var KNOWN=['teacher_m','teacher_f','buddy'];
  /* kinds a synthetic pack may provide. 'sound' (isolated phoneme) is never served from a pack. */
  var LETTER_KINDS={name:1,word:1,full:1};

  function normText(t){ return String(t==null?'':t).replace(/\s+/g,' ').trim().toLowerCase(); }

  /* manifest shape: { version, packs:{ teacher_m:{dir:'audio/teacher_m', files:{ 'words/ball.mp3':1, ... }}}, lines:{ '<normText>':'lines/<id>.mp3' } } */
  function packOf(manifest, id){ return manifest&&manifest.packs&&manifest.packs[id]||null; }
  function has(pack, rel){ return !!(pack&&pack.files&&pack.files[rel]); }

  /* packs that really have assets; the UI must show only these as selectable */
  function availablePacks(manifest){
    var out=[]; KNOWN.forEach(function(id){ var p=packOf(manifest,id); if(p&&p.files&&Object.keys(p.files).length) out.push(id); });
    return out;
  }
  /* unknown/unavailable choice falls back to device */
  function activePack(settings, manifest){
    var id=settings&&settings.voicePack;
    return (id && KNOWN.indexOf(id)>=0 && availablePacks(manifest).indexOf(id)>=0)? id : DEFAULT_PACK;
  }

  /* spec: {kind:'word',key:'ball'} | {kind:'letter',key:'A',variant:'name'} | {kind:'phrase',key:3}
           | {kind:'sentence',key:3} | {kind:'line',text:'Great job!'} */
  function relPath(spec){
    switch(spec&&spec.kind){
      case 'word': return 'words/'+String(spec.key).toLowerCase()+'.mp3';
      case 'letter': return LETTER_KINDS[spec.variant]? 'letters/'+spec.key+'_'+spec.variant+'.mp3' : null;
      case 'phrase': return 'phrases/'+spec.key+'.mp3';
      case 'sentence': return 'sentences/'+spec.key+'.mp3';
      default: return null;
    }
  }
  /* returns a URL string or null (null = caller keeps current behaviour) */
  function resolveClip(spec, settings, manifest){
    var id=activePack(settings, manifest); if(id===DEFAULT_PACK) return null;
    var pack=packOf(manifest,id), rel=null;
    if(spec&&spec.kind==='line'){ rel=manifest.lines&&manifest.lines[normText(spec.text)]||null; }
    else rel=relPath(spec);
    return (rel && has(pack,rel))? pack.dir+'/'+rel : null;
  }
  /* playback rate: reuse the app's existing settings.rate (0.4-1.6); never a second speed store */
  function clampRate(r, fallback){ var v=parseFloat(r); if(!isFinite(v)||v<=0) v=parseFloat(fallback); if(!isFinite(v)||v<=0) v=1; return Math.max(0.4, Math.min(1.6, v)); }
  /* keep pitch while slowing/speeding, where the browser supports it (all current ones use preservesPitch) */
  function applyRate(audioEl, rate){
    audioEl.playbackRate=rate;
    var supported=false;
    ['preservesPitch','mozPreservesPitch','webkitPreservesPitch'].forEach(function(k){ if(k in audioEl){ audioEl[k]=true; supported=true; } });
    return supported;
  }
  /* Global speed with context rates. settings.rate is the user's global speed (default 1).
     ctxRate is a fixed rate a screen deliberately uses (lesson model 0.8, letter quiz 0.9).
     Result = ctxRate x settings.rate, clamped, so the default (1.0) is unchanged and the user's
     slider still moves lessons proportionally. Callers that already derive from settings.rate
     (the 'slow' button) must NOT use this, or the rate is applied twice. Compute once, pass the
     same final value to the clip and to its text-to-speech fallback. */
  function effectiveRate(settings, ctxRate){
    var g=clampRate(settings&&settings.rate,1);
    if(ctxRate==null) return g;
    return clampRate(parseFloat(ctxRate)*g,1);
  }
  /* Text lookup for browser-speech paths (story lines, praise, quiz prompts, words spoken without a file path).
     Returns a clip URL or null. manifest.lines maps normText(text) -> rel path inside the pack. */
  function resolveText(text, settings, manifest){
    var id=activePack(settings, manifest); if(id===DEFAULT_PACK) return null;
    var pack=packOf(manifest,id), rel=manifest.lines&&manifest.lines[normText(text)]||null;
    return (rel && has(pack,rel))? pack.dir+'/'+rel : null;
  }
  /* Used inside speakTTSFull BEFORE device speech. deps.playFile(url, rate) -> Promise<boolean>.
     Resolves true only if a pack clip existed AND finished; false = caller continues to device speech
     (same rate, no double application: the same rate value goes to the clip and to the fallback). */
  function playTextClip(text, rate, settings, manifest, deps){
    var url; try{ url=resolveText(text, settings, manifest); }catch(e){ url=null; }
    if(!url) return Promise.resolve(false);
    return Promise.resolve(deps.playFile(url, rate)).then(function(ok){ return ok===true; }, function(){ return false; });
  }
  return {resolveText:resolveText, playTextClip:playTextClip, effectiveRate:effectiveRate, DEFAULT_PACK:DEFAULT_PACK, KNOWN:KNOWN, normText:normText, availablePacks:availablePacks, activePack:activePack, relPath:relPath, resolveClip:resolveClip, clampRate:clampRate, applyRate:applyRate};
});
