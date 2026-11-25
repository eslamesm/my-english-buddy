import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
const V=createRequire(import.meta.url)('../voice-pack.js');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('function speakTTSFull('),b=html.indexOf('function speakTTS(text, rate)');
const src=html.slice(a,b);
const M={version:1,packs:{teacher_m:{dir:'audio/teacher_m',files:{'lines/g.mp3':1}}},lines:{'great job!':'lines/g.mp3'}};
function env({voicePack='teacher_m',manifest=M,playResult=true,onPlay}={}){
  const spoken=[];let seq=0;
  const ctx={settings:{rate:1,voicePack},VP_MANIFEST:manifest,speechSeq:0,usVoice:null,
    window:{VoicePack:V,speechSynthesis:{cancel(){},speak(u){spoken.push(u);setTimeout(()=>{u.onstart&&u.onstart();u.onend&&u.onend();},0);},getVoices(){return[];}}},
    SpeechSynthesisUtterance:function(t){this.text=t;},speechGuardMs:()=>1000,setTimeout,clearTimeout,
    playFile(url,rate){ctx.played.push([url,rate]);ctx.speechSeq++; /* stopAudio bumps token */ return new Promise(r=>setTimeout(()=>{onPlay&&onPlay(ctx);r(playResult);},5));},played:[]};
  vm.createContext(ctx);vm.runInContext(src.replace('function speakTTSFull','globalThis.speakTTSFull=function speakTTSFull')+';',ctx);
  vm.runInContext("globalThis.speechSynthesis=window.speechSynthesis",ctx);
  return {ctx,spoken};
}
test('pack hit resolves ok without device speech, rate passed once',async()=>{const {ctx,spoken}=env();const s=await ctx.speakTTSFull('Great job!',0.8);assert.equal(s,'ok');assert.equal(spoken.length,0);assert.deepEqual(ctx.played,[['audio/teacher_m/lines/g.mp3',0.8]]);});
test('pack miss uses device with same rate',async()=>{const {ctx,spoken}=env();const s=await ctx.speakTTSFull('Unknown line',0.7);assert.equal(s,'ok');assert.equal(spoken.length,1);assert.equal(spoken[0].rate,0.7);assert.equal(ctx.played.length,0);});
test('device default never touches the pack',async()=>{const {ctx,spoken}=env({voicePack:'device'});await ctx.speakTTSFull('Great job!',1);assert.equal(ctx.played.length,0);assert.equal(spoken.length,1);});
test('superseded during clip play resolves cancel, no stale device speech',async()=>{const {ctx,spoken}=env({onPlay:c=>{c.speechSeq++;}});const s=await ctx.speakTTSFull('Great job!',1);assert.equal(s,'cancel');assert.equal(spoken.length,0);});
test('clip failure falls back to device with same rate',async()=>{const {ctx,spoken}=env({playResult:false});const s=await ctx.speakTTSFull('Great job!',0.9);assert.equal(s,'ok');assert.equal(spoken.length,1);assert.equal(spoken[0].rate,0.9);});
test('clip failure AND superseded does not speak stale fallback',async()=>{const {ctx,spoken}=env({playResult:false,onPlay:c=>{c.speechSeq++;}});const s=await ctx.speakTTSFull('Great job!',1);assert.equal(s,'cancel');assert.equal(spoken.length,0);});
test('no manifest (assets missing/offline) behaves like v66',async()=>{const {ctx,spoken}=env({manifest:null});const s=await ctx.speakTTSFull('Great job!',1);assert.equal(s,'ok');assert.equal(ctx.played.length,0);assert.equal(spoken.length,1);});
test('manifest lists pack with no files: pack not active',async()=>{const {ctx}=env({manifest:{packs:{teacher_m:{dir:'x',files:{}}},lines:{'great job!':'lines/g.mp3'}}});await ctx.speakTTSFull('Great job!',1);assert.equal(ctx.played.length,0);});
test('support course lesson rate computed once via effectiveRate',()=>{const s=fs.readFileSync(new URL('../support-course-ui.js',import.meta.url),'utf8');assert.equal((s.match(/effectiveRate\(settings,0\.8\)/g)||[]).length,2);assert.ok(!/playFile\(path,0\.8\)|speakTTSFull\(text,0\.8\)/.test(s));assert.equal(V.effectiveRate({rate:1},0.8),0.8);assert.ok(Math.abs(V.effectiveRate({rate:1.5},0.8)-1.2)<1e-9);});
