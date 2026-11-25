const assert=require('assert'); const V=require('../voice-pack.js');
const M={version:1,packs:{teacher_m:{dir:'audio/teacher_m',files:{'words/ball.mp3':1,'letters/A_name.mp3':1,'sentences/0.mp3':1,'lines/g1.mp3':1}},teacher_f:{dir:'audio/teacher_f',files:{}}},lines:{'great job!':'lines/g1.mp3'}};
// only packs with assets are available (honest UI)
assert.deepStrictEqual(V.availablePacks(M),['teacher_m']);
// default / unavailable / unknown choice keeps current behaviour
assert.strictEqual(V.resolveClip({kind:'word',key:'ball'},{},M),null);
assert.strictEqual(V.resolveClip({kind:'word',key:'ball'},{voicePack:'teacher_f'},M),null);
assert.strictEqual(V.resolveClip({kind:'word',key:'ball'},{voicePack:'nope'},M),null);
// resolves when present
const s={voicePack:'teacher_m'};
assert.strictEqual(V.resolveClip({kind:'word',key:'Ball'},s,M),'audio/teacher_m/words/ball.mp3');
assert.strictEqual(V.resolveClip({kind:'letter',key:'A',variant:'name'},s,M),'audio/teacher_m/letters/A_name.mp3');
assert.strictEqual(V.resolveClip({kind:'sentence',key:0},s,M),'audio/teacher_m/sentences/0.mp3');
assert.strictEqual(V.resolveClip({kind:'line',text:'  Great   JOB! '},s,M),'audio/teacher_m/lines/g1.mp3');
// missing clip -> null (fallback), no throw
assert.strictEqual(V.resolveClip({kind:'word',key:'zebra'},s,M),null);
assert.strictEqual(V.resolveClip({kind:'phrase',key:1},s,M),null);
// phoneme sound never from a pack, even if a file with that name were listed
const M2=JSON.parse(JSON.stringify(M)); M2.packs.teacher_m.files['letters/A_sound.mp3']=1;
assert.strictEqual(V.resolveClip({kind:'letter',key:'A',variant:'sound'},s,M2),null);
// null/empty manifest
assert.strictEqual(V.resolveClip({kind:'word',key:'ball'},s,null),null);
assert.deepStrictEqual(V.availablePacks({}),[]);
// rate: reuses app range, clamps
assert.strictEqual(V.clampRate(0.1,1),0.4); assert.strictEqual(V.clampRate(5,1),1.6); assert.strictEqual(V.clampRate('x',0.8),0.8); assert.strictEqual(V.clampRate(null,null),1);
// applyRate sets preservesPitch where the property exists, reports support
const a={}; assert.strictEqual(V.applyRate(a,0.8),false); assert.strictEqual(a.playbackRate,0.8);
const b={preservesPitch:false}; assert.strictEqual(V.applyRate(b,0.8),true); assert.strictEqual(b.preservesPitch,true);
// effective rate: default unchanged, user speed scales fixed context rates, no double apply
assert.strictEqual(V.effectiveRate({rate:1},0.8),0.8);
assert.strictEqual(V.effectiveRate({},0.8),0.8);
assert.strictEqual(V.effectiveRate({rate:0.5},0.8),0.4);
assert.strictEqual(V.effectiveRate({rate:1.5},0.9),1.35);
assert.strictEqual(V.effectiveRate({rate:0.6},null),0.6);
assert.strictEqual(V.effectiveRate({rate:0.5},0.5),0.4);
assert.strictEqual(V.effectiveRate({rate:9},9),1.6);
// text lookup + playTextClip
var MM={version:1,packs:{teacher_m:{dir:'audio/teacher_m',files:{'lines/L0001.mp3':1,'words/ball.mp3':1}}},lines:{'great job!':'lines/L0001.mp3','ball':'words/ball.mp3','missing':'lines/L9.mp3'}};
assert.strictEqual(V.resolveText('  Great   JOB! ',{voicePack:'teacher_m'},MM),'audio/teacher_m/lines/L0001.mp3');
assert.strictEqual(V.resolveText('Great job!',{},MM),null);                       // device default
assert.strictEqual(V.resolveText('missing',{voicePack:'teacher_m'},MM),null);      // listed but file absent
assert.strictEqual(V.resolveText('Great job!',{voicePack:'teacher_f'},MM),null);   // pack has no assets
var calls=[];
V.playTextClip('Ball',0.7,{voicePack:'teacher_m'},MM,{playFile:function(u,r){calls.push([u,r]);return Promise.resolve(true);}}).then(function(ok){
  assert.strictEqual(ok,true); assert.deepStrictEqual(calls,[['audio/teacher_m/words/ball.mp3',0.7]]);
  return V.playTextClip('Ball',0.7,{voicePack:'teacher_m'},MM,{playFile:function(){return Promise.resolve(false);}});
}).then(function(ok){ assert.strictEqual(ok,false);   // clip failed -> caller falls back to device speech
  return V.playTextClip('Ball',1,{voicePack:'teacher_m'},MM,{playFile:function(){return Promise.reject(new Error('x'));}});
}).then(function(ok){ assert.strictEqual(ok,false);
  return V.playTextClip('unknown',1,{voicePack:'teacher_m'},MM,{playFile:function(){throw new Error('must not be called');}});
}).then(function(ok){ assert.strictEqual(ok,false); console.log('ok async'); });
console.log('ok');
