/*
 * gen_art.mjs — My English Buddy Islamic storybook illustration system.
 * Hand-authored, fully offline vector (SVG) illustrations generated from a
 * shared component kit (palette, Islamic arch frame, geometric pattern,
 * character kit, object/animal renderers). No external services.
 *
 * Output: C:\EnglishKids\img\art\<slug>.svg
 * Run:    node tools/gen_art.mjs
 */
import fs from 'fs';
import path from 'path';

const OUT = 'C:\\EnglishKids\\img\\art';
fs.mkdirSync(OUT, { recursive: true });

/* ---------------- palette ---------------- */
const C = {
  purple:'#8a5cff', purpleD:'#6d28d9', indigo:'#4c1d95', navy:'#1e3a8a',
  blue:'#38bdf8', blueD:'#0284c7', blueL:'#bae6fd', cyan:'#22d3ee',
  green:'#22c55e', greenD:'#15803d', leaf:'#4ade80',
  gold:'#fbbf24', goldL:'#fde68a', goldD:'#d97706',
  cream:'#fff7ed', paper:'#fef3c7', ink:'#2b1b4d',
  white:'#ffffff', skin:'#f6c9a0', skinD:'#d69a67',
  pink:'#fb7185', rose:'#f472b6', red:'#ef4444', redD:'#b91c1c',
  brown:'#b06a3b', brownD:'#7c3f18', orange:'#fb923c',
  gray:'#94a3b8', grayD:'#64748b', teal:'#14b8a6'
};

/* ---------------- primitives ---------------- */
/* Every filled shape gets a consistent dark outline (the cohesive "kawaii
   sticker" look used by the bespoke pieces). Pass "noline" in ex to opt out
   (soft shadows, glows, cheek blushes, patterned glyphs). */
const OL='stroke="#2b1b4d" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
const noLine=(f,ex)=>f==='none'||f==='transparent'||/noline/.test(ex)||/\bstroke=/.test(ex);
const clean=(ex)=>ex.replace(/\bnoline\b/,'').replace(/\s+/g,' ').trim();
const withLine=(f,ex)=>noLine(f,ex)?'':(' '+OL);
const cir=(cx,cy,r,f,ex='')=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${withLine(f,ex)}${clean(ex)?' '+clean(ex):''}/>`;
const ell=(cx,cy,rx,ry,f,ex='')=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${withLine(f,ex)}${clean(ex)?' '+clean(ex):''}/>`;
const rr=(x,y,w,h,r,f,ex='')=>{const big=(parseFloat(w)>=300||parseFloat(h)>=180);return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}"${(noLine(f,ex)||big)?'':(' '+OL)}${clean(ex)?' '+clean(ex):''}/>`;};
const pth=(d,f,ex='')=>typeof ex==='number'
  ? `<path d="${d}" fill="none" stroke="${f}" stroke-width="${ex}" stroke-linecap="round" stroke-linejoin="round"/>`
  : `<path d="${d}" fill="${f}"${withLine(f,ex)}${clean(ex)?' '+clean(ex):''}/>`;
const ln=(d,st,w,ex='')=>`<path d="${d}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${ex?' '+clean(ex):''}/>`;
const grp=(c,t='')=>`<g${t?' '+t:''}>${c}</g>`;

/* cute face: eyes + highlights + cheeks + smile */
function face(cx,cy,s=1,o={}){
  let g='';
  g+=cir(cx-15*s,cy,7*s,C.ink);
  g+=cir(cx+15*s,cy,7*s,C.ink);
  g+=cir(cx-17*s,cy-2*s,2.6*s,C.white);
  g+=cir(cx+13*s,cy-2*s,2.6*s,C.white);
  if(o.cheeks!==false){
    g+=cir(cx-27*s,cy+11*s,6*s,C.pink,'opacity=".5" noline');
    g+=cir(cx+27*s,cy+11*s,6*s,C.pink,'opacity=".5" noline');
  }
  if(o.mouth==='open') g+=ell(cx,cy+16*s,7*s,9*s,'#7f1d1d');
  else if(o.mouth==='o') g+=cir(cx,cy+16*s,6*s,'#7f1d1d');
  else g+=ln(`M${cx-9*s} ${cy+12*s} q${9*s} ${10*s} ${18*s} 0`,'#7f1d1d',4*s);
  return g;
}
const shadow=(cx=256,cy=430,rx=92,ry=15)=> (cx>=500||cy>=500||rx<2||ry<2) ? '' : ell(cx,cy,rx,ry,'#2b1b4d','opacity=".12" noline');

/* ---------------- frame / card ---------------- */
const ARCH = 'M120 444 L120 224 C120 150 190 108 256 90 C322 108 392 150 392 224 L392 444 Z';
function card(inner, o={}){
  const bg1 = o.night ? C.indigo : C.purpleD;
  const bg2 = o.night ? '#0f1035' : C.blueD;
  const panel = o.panel || C.cream;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" preserveAspectRatio="xMidYMid meet">
<defs>
  <radialGradient id="bg" cx="50%" cy="34%" r="80%">
    <stop offset="0%" stop-color="${bg2}"/><stop offset="100%" stop-color="${bg1}"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.goldL}"/><stop offset="55%" stop-color="${C.gold}"/><stop offset="100%" stop-color="${C.goldD}"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="${panel}"/>
  </linearGradient>
  <pattern id="geo" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
    <path d="M32 6 L40 24 L58 32 L40 40 L32 58 L24 40 L6 32 L24 24 Z" fill="#ffffff" opacity="0.08"/>
    <circle cx="32" cy="32" r="4" fill="#ffffff" opacity="0.06"/>
  </pattern>
  <clipPath id="archClip"><path d="${ARCH}"/></clipPath>
</defs>
<rect width="512" height="512" fill="url(#bg)"/>
<rect width="512" height="512" fill="url(#geo)"/>
${o.night? nightSky():''}
<path d="${ARCH}" fill="url(#panel)"/>
<g clip-path="url(#archClip)">${o.floor?`<rect x="120" y="360" width="272" height="84" fill="${o.floor}"/>`:''}${inner}</g>
<path d="${ARCH}" fill="none" stroke="${C.ink}" stroke-width="6" opacity="0.18"/>
<path d="${ARCH}" fill="none" stroke="url(#gold)" stroke-width="9"/>
<path d="${ARCH}" fill="none" stroke="${C.goldL}" stroke-width="3" opacity="0.9" transform="translate(0 0) scale(0.965) translate(9 9)"/>
${decor()}
</svg>`;
}
function nightSky(){ let s=''; [[70,70,2.6],[440,60,3],[400,140,2.2],[60,180,2.2],[120,60,2],[150,120,1.8]].forEach(([x,y,r])=>s+=cir(x,y,r,'#fff','opacity=".85" noline'));
  s+=cir(64,320,26,C.goldL,'opacity=".9"'); return s; }
function decor(){
  const star=(x,y,s,f=C.gold)=>{ const p=[]; for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2? s*0.42:s; p.push((x+Math.cos(a)*rr).toFixed(1)+','+(y+Math.sin(a)*rr).toFixed(1)); } return `<polygon points="${p.join(' ')}" fill="${f}"/>`; };
  return grp(
    star(74,60,20)+star(438,60,20)+star(74,452,14)+star(438,452,14)+
    // little hanging lanterns inside top corners
    ln('M150 34 v18','#ffffff88',3)+pth('M150 52 l16 10 v22 l-16 10 l-16 -10 v-22 Z',C.gold)+
    ln('M412 34 v18','#ffffff88',3)+pth('M412 52 l16 10 v22 l-16 10 l-16 -10 v-22 Z',C.gold),
    'opacity="0.95"');
}

/* ---------------- character kit (modest Muslim kids) ---------------- */
function boy(o={}){
  const s=o.s||1, x=o.x||256,y=o.y||330;
  return grp(
    // legs
    rr(x-30,y+70,24,58,10,C.navy)+rr(x+6,y+70,24,58,10,C.navy)+
    rr(x-34,y+120,32,16,8,C.ink)+rr(x+2,y+120,32,16,8,C.ink)+
    // body (thobe-ish tunic, modest)
    pth(`M${x-48} ${y+80} q-4 -70 48 -70 q52 0 48 70 Z`,C.teal)+
    // collar
    pth(`M${x-16} ${y+14} l16 14 l16 -14`,C.white,'stroke="'+C.white+'" stroke-width="10"')+
    // arms
    ln(`M${x-46} ${y+30} q-26 24 -20 52`,C.teal,20)+ln(`M${x+46} ${y+30} q26 24 20 52`,C.teal,20)+
    cir(x-72,y+86,12,C.skin)+cir(x+72,y+86,12,C.skin)+
    // head
    cir(x,y-46,50,C.skin)+
    // cap
    pth(`M${x-52} ${y-70} q52 -46 104 0 q-6 -30 -52 -30 q-46 0 -52 30 Z`,C.purple)+
    pth(`M${x-52} ${y-70} q52 -20 104 0`,C.gold,'stroke="'+C.gold+'" stroke-width="8"')+
    face(x,y-40,s)+
    shadow(x,y+150,80,14)
  );
}
function girl(o={}){
  const s=o.s||1, x=o.x||256,y=o.y||330, hijab=o.hijab||C.rose;
  return grp(
    // dress (long, modest)
    pth(`M${x-52} ${y+150} q-6 -150 52 -150 q58 0 52 150 Z`,hijab)+
    pth(`M${x-52} ${y+150} q52 18 104 0`,C.gold,'stroke="'+C.gold+'" stroke-width="7"')+
    // arms
    ln(`M${x-50} ${y+22} q-24 26 -18 54`,hijab,18)+ln(`M${x+50} ${y+22} q24 26 18 54`,hijab,18)+
    cir(x-70,y+80,12,C.skin)+cir(x+70,y+80,12,C.skin)+
    // head + hijab
    cir(x,y-46,52,C.skin)+
    pth(`M${x-56} ${y-40} q0 -64 56 -64 q56 0 56 64 q-8 -34 -56 -34 q-48 0 -56 34 Z`,hijab)+
    pth(`M${x-56} ${y-40} q0 -64 56 -64 q56 0 56 64`,hijab,'stroke="'+hijab+'" stroke-width="16"')+
    face(x,y-40,s)+
    shadow(x,y+150,80,14)
  );
}

/* ---------------- subjects ---------------- */
const ART = {};

ART.apple=(()=>{ const cx=256,cy=300,r=98; return (
  pth(`M${cx} ${cy-70} q-6 -22 14 -30 q-2 20 -14 30`,C.brownD)+
  pth(`M${cx+6} ${cy-84} q34 -26 60 -6 q-24 30 -60 6 Z`,C.green)+
  pth(`M${cx-4} ${cy-60} q-40 -34 -84 -2 q6 -60 56 -58 q34 2 44 30`,C.red)+
  pth(`M${cx+4} ${cy-60} q40 -34 84 -2 q-6 -60 -56 -58 q-34 2 -44 30`,C.redD)+
  cir(cx-30,cy+30,20,C.white,'opacity=".28"')
);})();

ART.ball=(()=>{ const cx=256,cy=296,r=100; let g=cir(cx,cy,r,C.white)+cir(cx,cy,r,'none','stroke="'+C.gray+'" stroke-width="6"');
  const pent=(x,y,s)=>pth(`M${x} ${y-s} l${s*0.95} ${s*0.7} l-${s*0.36} ${s*1.15} l-${s*0.5} 0 l-${s*0.36} -${s*1.15} Z`,C.ink);
  g+=pent(cx,cy-30,30)+pent(cx-52,cy+34,24)+pent(cx+52,cy+34,24)+pent(cx-30,cy+70,20)+pent(cx+30,cy+70,20);
  g+=ell(cx,cy,r+8,10,C.blue,'opacity=".35" transform="translate(0 -6)"');
  return g;})();

ART.cat=(()=>{ const cx=256,cy=250; return (
  ell(cx+70,cy+120,26,60,C.grayD,'transform="rotate(18 '+cx+' '+cy+')"')+
  ell(cx,cy+70,86,74,C.gray)+
  pth(`M${cx-62} ${cy-40} L${cx-86} ${cy-108} L${cx-18} ${cy-72} Z`,C.gray)+
  pth(`M${cx+62} ${cy-40} L${cx+86} ${cy-108} L${cx+18} ${cy-72} Z`,C.gray)+
  pth(`M${cx-58} ${cy-50} L${cx-74} ${cy-92} L${cx-30} ${cy-66} Z`,C.pink)+
  pth(`M${cx+58} ${cy-50} L${cx+74} ${cy-92} L${cx+30} ${cy-66} Z`,C.pink)+
  cir(cx,cy,80,C.gray)+
  face(cx,cy,1)+
  ln(`M${cx-16} ${cy+14} L${cx-6} ${cy+8}`,C.ink,3)+
  ln(`M${cx-70} ${cy+2} l-34 -6 M${cx-70} ${cy+12} l-34 6`,C.white,3)+
  ln(`M${cx+70} ${cy+2} l34 -6 M${cx+70} ${cy+12} l34 6`,C.white,3)+
  shadow(cx,442,96,14)
);})();

ART.dog=(()=>{ const cx=256,cy=252; return (
  ell(cx-78,cy-6,26,54,C.brownD)+ell(cx+78,cy-6,26,54,C.brownD)+
  cir(cx,cy+78,84,C.brown)+
  cir(cx,cy,82,C.brown)+
  ell(cx,cy+34,40,30,C.cream)+
  cir(cx,cy+20,15,C.ink)+
  face(cx,cy-12,1,{cheeks:false})+
  ln(`M${cx-10} ${cy+34} q10 10 20 0`,C.ink,4)+
  ell(cx+72,cy+110,18,26,C.brownD,'transform="rotate(20 '+(cx+72)+' '+(cy+110)+')"')+
  shadow(cx,442,96,14)
);})();

ART.egg=(()=>{ const cx=256,cy=300; return (
  pth(`M${cx} ${cy-120} C${cx+96} ${cy-120} ${cx+96} ${cy+120} ${cx} ${cy+120} C${cx-96} ${cy+120} ${cx-96} ${cy-120} ${cx} ${cy-120} Z`,C.paper)+
  cir(cx-26,cy-20,20,C.gold,'opacity=".35"')+cir(cx+30,cy+40,14,C.gold,'opacity=".3"')+cir(cx-10,cy+70,10,C.gold,'opacity=".3"')+
  ell(cx-30,cy-30,16,26,C.white,'opacity=".6"')+
  shadow(cx,442,80,14)
);})();

ART.fish=(()=>{ const cx=244,cy=290; return (
  pth(`M${cx+96} ${cy} l70 -46 l0 92 Z`,C.orange)+
  pth(`M${cx+30} ${cy-70} l20 -44 l40 30 Z`,C.cyan)+
  ell(cx,cy,104,66,C.cyan)+
  ell(cx-10,cy+30,72,34,C.white)+
  pth(`M${cx-40} ${cy-6} q40 -30 80 0 q-40 30 -80 0`,C.orange,'opacity=".7"')+
  cir(cx-50,cy-16,15,C.white)+cir(cx-50,cy-16,8,C.ink)+cir(cx-53,cy-19,3,C.white)+
  ln(`M${cx-40} ${cy+8} q10 8 18 2`,C.ink,3)+
  cir(150,220,10,C.white,'opacity=".7"')+cir(170,190,6,C.white,'opacity=".6"')+
  shadow(cx,442,110,14)
);})();

ART.goat=(()=>{ const cx=256,cy=280; return (
  pth(`M${cx-44} ${cy-70} q-30 -40 -54 -30 q20 6 30 40 Z`,C.cream)+
  pth(`M${cx+44} ${cy-70} q30 -40 54 -30 q-20 6 -30 40 Z`,C.cream)+
  ell(cx,cy+90,74,54,C.cream)+
  cir(cx,cy,64,C.white)+
  ell(cx,cy+30,30,26,C.paper)+
  face(cx,cy-8,0.9)+
  pth(`M${cx-8} ${cy+58} q8 26 -6 34 q-10 -8 -2 -34 Z`,C.gray)+
  shadow(cx,442,96,14)
);})();

ART.hat=(()=>{ const cx=256,cy=300; return (
  ell(cx,cy+70,118,26,C.indigo)+
  rr(cx-70,cy-96,140,168,16,C.purple)+
  rr(cx-70,cy+26,140,44,10,C.gold)+
  ln(`M${cx-56} ${cy+6} l112 0`,C.goldL,10)+
  rr(cx-70,cy-96,44,168,14,C.purpleD)+
  shadow(cx,442,110,14)
);})();

ART.ice=(()=>{ const cube=(x,y,s,f)=>(rr(x,y,s,s,16,f)+pth(`M${x+8} ${y+8} l${s*0.5} 0 l0 ${s*0.5} l-${s*0.5} 0 Z`,'#ffffff55')+ln(`M${x} ${y+s} l${s} -${s}`,C.white,3,'opacity=".5"'));
  return cube(180,300,110,C.blue)+cube(268,320,96,C.cyan)+pth('M256 150 l10 30 l-20 0 Z',C.cyan)+cir(360,180,6,C.white)+
  shadow(280,442,100,14);})();

ART.juice=(()=>{ const cx=256,cy=320; return (
  pth(`M${cx-58} ${cy-70} l10 150 q2 20 22 20 l52 0 q20 0 22 -20 l10 -150 Z`,'#ffffffcc')+
  pth(`M${cx-52} ${cy-10} l-6 -46 q0 -16 22 -16 l72 0 q22 0 22 16 l-6 46 Z`,C.orange)+
  ell(cx,cy-72,58,16,'#ffffff99')+
  rr(cx+6,cy-140,12,80,6,C.pink,'transform="rotate(16 '+(cx+6)+' '+(cy-140)+')"')+
  cir(cx-22,cy-40,9,C.white,'opacity=".6"')+cir(cx+14,cy-30,6,C.white,'opacity=".5"')+
  ell(cx,cy+104,64,14,'#2b1b4d','opacity=".12"')
);})();

ART.kite=(()=>{ const cx=256,cy=240; return (
  pth(`M${cx} ${cy-130} l86 96 l-86 104 l-86 -104 Z`,C.red)+
  pth(`M${cx} ${cy-130} l86 96 l-86 0 Z`,C.gold)+
  pth(`M${cx} ${cy-34} l-86 0 l-86 0 l86 104 Z`,C.gold,'opacity=".001"')+
  pth(`M${cx} ${cy-130} l-86 96 l86 0 Z`,C.redD)+
  pth(`M${cx} ${cy-34} l86 0 l-86 104 Z`,'#ffffff','opacity=".35"')+
  pth(`M${cx} ${cy-34} l-86 0 l86 104 Z`,'#000000','opacity=".10"')+
  ln(`M${cx} ${cy+70} q30 60 -18 110 q-30 30 8 70`,C.indigo,4)+
  pth(`M${cx+6} ${cy+70} l-16 -10 l0 20 Z`,C.gold)+
  pth(`M${cx-14} ${cy+178} l-16 -8 l0 16 Z`,C.gold)+
  pth(`M${cx-4} ${cy+246} l-16 -8 l0 16 Z`,C.gold)
);})();

ART.lion=(()=>{ const cx=256,cy=290; let mane=''; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; mane+=cir(cx+Math.cos(a)*72,cy+Math.sin(a)*72,34,C.orange); }
  return mane+cir(cx,cy,74,C.gold)+face(cx,cy-6,1)+
  ell(cx,cy+34,30,22,C.cream)+cir(cx,cy+26,12,C.ink)+ln(`M${cx-10} ${cy+40} q10 8 20 0`,C.ink,3)+
  shadow(cx,442,100,14);})();

ART.monkey=(()=>{ const cx=256,cy=270; return (
  cir(cx-72,cy-6,26,C.brownD)+cir(cx+72,cy-6,26,C.brownD)+
  cir(cx-72,cy-6,14,C.gold)+cir(cx+72,cy-6,14,C.gold)+
  cir(cx,cy+80,72,C.brown)+
  cir(cx,cy,66,C.brown)+
  ell(cx,cy+22,42,34,C.gold)+
  face(cx,cy-14,0.95)+
  ell(cx,cy+34,16,12,C.ink,'opacity=".5"')+
  shadow(cx,442,96,14)
);})();

ART.nest=(()=>{ const cx=256,cy=320; let g='';
  for(let i=0;i<7;i++) g+=ln(`M${cx-90+i*8} ${cy+40} q${30+i*6} -${30+i*2} ${120-i*4} 0`,C.brownD,7,'opacity=".8"');
  for(let i=0;i<6;i++) g+=ln(`M${cx-80+i*9} ${cy+58} q${28+i*5} -${24+i*2} ${108-i*4} 0`,C.brown,7,'opacity=".8"');
  return ell(cx,cy+20,94,60,C.brown)+ell(cx,cy-4,80,44,C.brownD)+
    ell(cx-34,cy-6,30,34,C.paper)+ell(cx+2,cy-12,30,34,C.paper)+ell(cx+34,cy-6,28,32,C.white)+
    ell(cx-6,cy+6,90,30,C.brownD)+g+shadow(cx,442,104,14);})();

ART.orange=(()=>{ const cx=256,cy=310,r=92; return (
  pth(`M${cx+4} ${cy-78} q-4 -22 12 -30 q4 20 -12 30`,C.brownD)+
  pth(`M${cx+10} ${cy-92} q30 -22 54 -4 q-22 26 -54 4 Z`,C.green)+
  cir(cx,cy,r,C.orange)+cir(cx,cy,r,'none','stroke="'+C.goldD+'" stroke-width="8"')+
  cir(cx-28,cy-16,58,'#ffffff','opacity=".18"')+
  cir(cx-30,cy-40,14,C.white,'opacity=".5"')+
  ln(`M${cx-40} ${cy-40} q40 -24 80 0`,C.goldD,4,'opacity=".5"')+
  shadow(cx,442,90,14)
);})();

ART.pig=(()=>{ const cx=256,cy=280; return (
  pth(`M${cx-56} ${cy-46} l-14 -40 l40 20 Z`,C.rose)+pth(`M${cx+56} ${cy-46} l14 -40 l-40 20 Z`,C.rose)+
  cir(cx,cy+70,80,C.pink)+cir(cx,cy,80,C.rose)+
  ell(cx,cy+34,34,26,C.pink)+cir(cx-12,cy+34,6,C.ink)+cir(cx+12,cy+34,6,C.ink)+
  face(cx,cy-16,1,{cheeks:false})+
  cir(cx-30,cy+8,10,C.pink,'opacity=".6"')+cir(cx+30,cy+8,10,C.pink,'opacity=".6"')+
  shadow(cx,442,96,14)
);})();

ART.queen=(()=>{ const cx=256,cy=280; return (
  pth(`M${cx-96} ${cy+40} l18 -104 l40 52 l38 -70 l38 70 l40 -52 l18 104 Z`,C.gold)+
  ln(`M${cx-96} ${cy+40} l192 0`,C.goldD,10)+
  rr(cx-96,cy+34,192,40,12,C.goldD)+
  cir(cx-78,cy-64,12,C.red)+cir(cx-4,cy-104,13,C.blue)+cir(cx+70,cy-64,12,C.green)+
  cir(cx-40,cy+54,8,C.pink)+cir(cx,cy+54,8,C.purple)+cir(cx+40,cy+54,8,C.cyan)+
  shadow(cx,442,104,14)
);})();

ART.rabbit=(()=>{ const cx=256,cy=300; return (
  ell(cx-34,cy-118,26,74,C.white)+ell(cx+34,cy-118,26,74,C.white)+
  ell(cx-34,cy-118,14,56,C.pink)+ell(cx+34,cy-118,14,56,C.pink)+
  cir(cx,cy+50,72,C.white)+cir(cx,cy-20,66,C.white)+
  face(cx,cy-24,1)+cir(cx,cy+18,13,C.pink)+
  shadow(cx,442,96,14)
);})();

ART.sun=(()=>{ const cx=256,cy=280,r=84; let rays=''; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; rays+=pth(`M${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r} l${Math.cos(a)*40} ${Math.sin(a)*40} l${Math.cos(a+0.25)*16} ${Math.sin(a+0.25)*16} l-${Math.cos(a)*52} -${Math.sin(a)*52} Z`,C.gold); }
  return rays+cir(cx,cy,r,C.goldL)+cir(cx,cy,r,'none','stroke="'+C.gold+'" stroke-width="8"')+
  face(cx,cy,1.1,{mouth:'open'})+
  shadow(cx,442,96,14);})();

ART.tiger=(()=>{ const cx=256,cy=270; return (
  pth(`M${cx-64} ${cy-46} l-20 -50 l50 26 Z`,C.orange)+pth(`M${cx+64} ${cy-46} l20 -50 l-50 26 Z`,C.orange)+
  pth(`M${cx-56} ${cy-52} l-12 -34 l34 18 Z`,C.ink)+pth(`M${cx+56} ${cy-52} l12 -34 l-34 18 Z`,C.ink)+
  cir(cx,cy,80,C.orange)+
  ln(`M${cx-40} ${cy-56} l10 26 M${cx} ${cy-66} l0 28 M${cx+40} ${cy-56} l-10 26`,C.ink,7)+
  ln(`M${cx-72} ${cy-8} l24 6 M${cx-74} ${cy+14} l24 4`,C.ink,7)+
  ln(`M${cx+72} ${cy-8} l-24 6 M${cx+74} ${cy+14} l-24 4`,C.ink,7)+
  ell(cx,cy+28,38,28,C.white)+ell(cx,cy+22,13,10,C.ink)+
  face(cx,cy-14,1,{cheeks:false})+ln(`M${cx-10} ${cy+38} q10 8 20 0`,C.ink,3)+
  shadow(cx,442,96,14)
);})();

ART.umbrella=(()=>{ const cx=256,cy=250; let canopy=''; const cols=[C.red,C.gold,C.blue,C.green,C.purple,C.orange];
  for(let i=0;i<6;i++){ const a1=-Math.PI+ i*Math.PI/6, a2=-Math.PI+(i+1)*Math.PI/6; canopy+=pth(`M${cx} ${cy-10} L${cx+Math.cos(a1)*120} ${cy+Math.sin(a1)*120} A120 120 0 0 1 ${cx+Math.cos(a2)*120} ${cy+Math.sin(a2)*120} Z`,cols[i]); }
  return canopy+ln(`M${cx} ${cy-10} l0 150 q0 30 -34 30 q-16 0 -16 -16`,C.brown,10)+
  cir(cx,cy-16,12,C.gold)+shadow(cx,442,96,14);})();

ART.van=(()=>{ const cx=256,cy=320; return (
  rr(cx-120,cy-70,240,96,18,C.blue)+
  pth(`M${cx-120} ${cy-70} q60 -6 90 -44 l50 0 q30 6 40 44 Z`,C.blueD)+
  rr(cx-104,cy-56,58,38,8,'#bae6fd')+rr(cx-30,cy-60,58,42,8,'#bae6fd')+
  rr(cx+22,cy-18,40,30,6,'#bae6fd')+
  rr(cx-124,cy+8,248,20,8,C.gold)+
  rr(cx-70,cy+4,44,18,6,C.goldL)+
  cir(cx-64,cy+40,30,C.ink)+cir(cx-64,cy+40,13,C.gray)+
  cir(cx+62,cy+40,30,C.ink)+cir(cx+62,cy+40,13,C.gray)+
  shadow(cx,442,120,14)
);})();

ART.water=(()=>{ return (
  girl({x:200,y:300,hijab:C.cyan})+
  grp(
    pth('M322 246 l9 104 q1 16 16 16 l30 0 q15 0 16 -16 l9 -104 Z','#ffffffcc')+
    pth('M326 288 l7 60 q0 12 12 12 l28 0 q12 0 12 -12 l7 -60 Z',C.blue)+
    ell(352,246,37,11,'#ffffff99')+
    cir(342,226,7,C.blue,'opacity=".65"')+cir(366,210,5,C.blue,'opacity=".55"')+cir(330,206,4,C.blue,'opacity=".5"')
  ) +
  shadow(276,442,120,14)
);})();

ART.fox=(()=>{ const cx=256,cy=290; return (
  pth(`M${cx-70} ${cy-52} l-16 -58 l56 30 Z`,C.orange)+pth(`M${cx+70} ${cy-52} l16 -58 l-56 30 Z`,C.orange)+
  pth(`M${cx-60} ${cy-58} l-10 -38 l38 20 Z`,C.ink)+pth(`M${cx+60} ${cy-58} l10 -38 l-38 20 Z`,C.ink)+
  cir(cx,cy,78,C.orange)+
  pth(`M${cx-78} ${cy+10} q-24 30 -4 62 q34 -6 44 -40 Z`,C.orange)+pth(`M${cx+78} ${cy+10} q24 30 4 62 q-34 -6 -44 -40 Z`,C.orange)+
  pth(`M${cx-66} ${cy+4} q78 56 132 0 q-20 74 -66 74 q-46 0 -66 -74 Z`,C.white)+
  face(cx,cy-14,1,{cheeks:false})+cir(cx,cy+38,12,C.ink)+
  shadow(cx,442,96,14)
);})();

ART.yoyo=(()=>{ const cx=256,cy=300; return (
  ln(`M${cx} ${cy-150} q34 40 0 78`,C.grayD,6)+
  cir(cx,cy,72,C.red)+cir(cx,cy,30,C.gold)+cir(cx,cy,72,'none','stroke="'+C.redD+'" stroke-width="10"')+
  cir(cx-22,cy-24,14,C.white,'opacity=".5"')+
  shadow(cx,442,84,14)
);})();

ART.zebra=(()=>{ const cx=256,cy=286; let g=ell(cx,cy+70,72,58,C.white)+cir(cx,cy-30,66,C.white);
  g+=pth(`M${cx-56} ${cy-66} l-8 -50 l40 22 Z`,C.white)+pth(`M${cx+56} ${cy-66} l8 -50 l-40 22 Z`,C.white);
  [ -30,0,30,60 ].forEach(dy=>g+=ln(`M${cx-52} ${cy-2+dy} q10 -8 18 0`,C.ink,8));
  g+=pth(`M${cx-40} ${cy-70} l-6 -34 l26 20 Z`,C.ink)+pth(`M${cx+40} ${cy-70} l6 -34 l-26 20 Z`,C.ink);
  g+=ell(cx,cy+28,34,24,C.white)+face(cx,cy-30,1,{cheeks:false})+cir(cx,cy+22,10,C.ink);
  return g+shadow(cx,442,96,14);})();

ART.star=(()=>{ const star=(x,y,s,f)=>pth((()=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?s*0.44:s;p.push((x+Math.cos(a)*r).toFixed(1)+','+(y+Math.sin(a)*r).toFixed(1));}return 'M'+p.join(' L')+' Z';})(),f);
  return star(256,300,150,C.gold)+star(256,300,96,C.goldL)+
  star(96,150,34,C.gold)+star(410,170,26,C.goldL)+star(120,420,22,C.goldL)+
  shadow(256,442,96,12);})();

ART.tree=(()=>{ const cx=256,cy=300; return (
  rr(cx-26,cy+40,52,120,16,C.brown)+
  ln(`M${cx} ${cy+70} l0 70`,C.brownD,8)+
  cir(cx,cy-30,96,C.green)+cir(cx-64,cy+10,62,C.greenD)+cir(cx+64,cy+10,62,C.greenD)+cir(cx,cy-96,58,C.leaf)+
  cir(cx-30,cy-40,10,C.red)+cir(cx+40,cy-10,10,C.red)+cir(cx-6,cy+30,10,C.red)+
  shadow(cx,442,104,14)
);})();

ART.book=(()=>{ const cx=256,cy=300; return (
  grp(boy({x:150,y:210,s:0.86}),'')+
  pth(`M210 250 q46 -30 92 0 l0 96 q-46 -30 -92 0 Z`,C.purple)+
  pth(`M302 250 q46 -30 92 0 l0 96 q-46 -30 -92 0 Z`,C.blue)+
  pth(`M210 250 q46 -30 92 0 l0 96 q-46 -30 -92 0 Z`,C.purple,'stroke="'+C.gold+'" stroke-width="5"')+
  pth(`M302 250 q46 -30 92 0 l0 96 q-46 -30 -92 0 Z`,C.blue,'stroke="'+C.gold+'" stroke-width="5"')+
  ln(`M302 254 l0 92`,C.gold,7)+
  ln(`M232 282 h48 M232 302 h48 M232 322 h36`,C.white,5,'opacity=".85"')+
  ln(`M324 282 h48 M324 302 h48 M324 322 h36`,C.white,5,'opacity=".85"')+
  shadow(cx,442,120,14)
);})();

ART.milk=(()=>{ const cx=256,cy=310; return (
  pth(`M${cx-58} ${cy-70} l0 150 q0 20 20 20 l76 0 q20 0 20 -20 l0 -150 Z`,'#ffffff')+
  pth(`M${cx-58} ${cy-70} l22 -34 l92 0 l22 34 Z`,C.blue)+
  rr(cx-58,cy-10,156,44,6,C.blue)+
  cir(cx,cy+12,20,C.white)+cir(cx,cy+12,20,'none','stroke="'+C.blue+'" stroke-width="6"')+
  ell(cx,cy+90,64,14,'#2b1b4d','opacity=".12"')
);})();

ART.cake=(()=>{ const cx=256,cy=320; let candles='';
  [-40,0,40].forEach(dx=>{ candles+=ln(`M${cx+dx} ${cy-70} l0 -34`,C.white,7)+pth(`M${cx+dx} ${cy-104} q-10 -6 -6 -16 q10 2 6 16 q10 -6 6 -16 q-10 2 -6 16`,C.orange); });
  return (
    rr(cx-96,cy-10,192,72,12,C.paper)+rr(cx-96,cy-10,192,20,10,C.pink)+
    rr(cx-72,cy-70,144,64,12,C.goldL)+rr(cx-72,cy-70,144,18,10,C.red)+
    candles+
    rr(cx-110,cy+54,220,20,8,C.grayD)+shadow(cx,442,110,14)
  );})();

ART.bird=(()=>{ const cx=250,cy=250; return (
  ell(cx+30,cy+50,64,50,C.blue)+pth(`M${cx+84} ${cy+40} l58 -22 l-50 44 Z`,C.blueD)+
  cir(cx-16,cy-10,52,C.cyan)+
  cir(cx-42,cy-22,10,C.white)+cir(cx-42,cy-22,6,C.ink)+
  pth(`M${cx-64} ${cy-14} l-30 -6 l30 -12 Z`,C.gold)+
  pth(`M${cx+6} ${cy+30} q34 12 22 46 q-30 -2 -34 -34 Z`,C.cyan)+
  ln(`M${cx-30} ${cy+96} l0 14 M${cx+18} ${cy+100} l0 14`,C.gold,5)+
  cir(390,190,12,C.gold,'opacity=".8"')+
  shadow(cx,442,96,14)
);})();

ART.moon=(()=>{ const cx=256,cy=270; return (
  pth(`M${cx+58} ${cy-128} A132 132 0 1 0 ${cx+58} ${cy+128} A104 104 0 1 1 ${cx+58} ${cy-128} Z`,C.goldL)+
  pth(`M${cx+58} ${cy-110} A114 114 0 1 0 ${cx+58} ${cy+110} A88 88 0 1 1 ${cx+58} ${cy-110} Z`,C.gold,'opacity=".5"')+
  (()=>{const st=(x,y,s,f=C.white)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?s*0.44:s;p.push((x+Math.cos(a)*r).toFixed(1)+','+(y+Math.sin(a)*r).toFixed(1));}return `<polygon points="${p.join(' ')}" fill="${f}"/>`;}; return st(360,150,26)+st(120,180,18)+st(400,300,16);})()
);})();

ART.car=(()=>{ const cx=256,cy=318; return (
  pth(`M${cx-130} ${cy} q4 -54 60 -64 l30 -34 q10 -12 28 -12 l56 0 q18 0 26 14 l26 32 q50 10 54 64 Z`,C.red)+
  pth(`M${cx-40} ${cy-96} q6 -8 20 -8 l50 0 q12 0 20 10 l20 28 l-116 0 Z`,'#bae6fd')+
  rr(cx-130,cy-6,260,26,10,C.redD)+
  rr(cx-40,cy+2,50,12,5,C.goldL)+
  cir(cx-68,cy+34,30,C.ink)+cir(cx-68,cy+34,13,C.gray)+
  cir(cx+68,cy+34,30,C.ink)+cir(cx+68,cy+34,13,C.gray)+
  shadow(cx,442,124,14)
);})();

ART.house=(()=>{ const cx=256,cy=300; return (
  rr(cx-110,cy-30,220,140,14,C.cream)+
  pth(`M${cx-134} ${cy-26} L${cx} ${cy-140} L${cx+134} ${cy-26} Z`,C.red)+
  rr(cx-20,cy+48,48,62,8,C.brown)+cir(cx+6,cy+80,4,C.gold)+
  rr(cx-84,cy+4,44,40,6,'#bae6fd')+rr(cx+44,cy+4,44,40,6,'#bae6fd')+
  ln(`M${cx-84} ${cy+24} l44 0 M${cx-62} ${cy+4} l0 40`,C.white,4)+
  ln(`M${cx+44} ${cy+24} l44 0 M${cx+66} ${cy+4} l0 40`,C.white,4)+
  cir(cx+96,cy-40,0,C.red)+pth(`M${cx+70} ${cy-40} l0 -40 q0 -22 26 -22 q26 0 26 22 l0 40 Z`,C.brownD)+
  ln(`M${cx+96} ${cy-104} q-14 -20 6 -30 q2 16 -6 30`,C.gray,'3','opacity=".6"')+
  shadow(cx,442,120,14)
);})();

ART.flower=(()=>{ const cx=256,cy=240; let petals=''; for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; petals+=ell(cx+Math.cos(a)*46,cy+Math.sin(a)*46,34,52,i%2?C.rose:C.pink,'transform="rotate('+(a*180/Math.PI+90)+' '+(cx+Math.cos(a)*46)+' '+(cy+Math.sin(a)*46)+')"'); }
  return ln(`M${cx} ${cy+20} l0 150`,C.greenD,12)+
  pth(`M${cx} ${cy+90} q-56 -26 -74 8 q40 40 74 -8 Z`,C.green)+pth(`M${cx} ${cy+120} q56 -26 74 8 q-40 40 -74 -8 Z`,C.green)+
  petals+cir(cx,cy,40,C.gold)+cir(cx,cy,22,C.goldD)+
  shadow(cx,442,96,14);})();

ART.banana=(()=>{ const cx=256,cy=290; return (
  pth(`M${cx-92} ${cy-52} C${cx-118} ${cy+80} ${cx+96} ${cy+96} ${cx+96} ${cy-20} C${cx+40} ${cy+30} ${cx-40} ${cy+26} ${cx-92} ${cy-52} Z`,C.gold)+
  pth(`M${cx-92} ${cy-52} C${cx-96} ${cy-6} ${cx-56} ${cy+52} ${cx+10} ${cy+72}`,C.goldL,0)+
  ln(`M${cx-92} ${cy-52} C${cx-96} ${cy-6} ${cx-56} ${cy+52} ${cx+8} ${cy+72}`,C.goldL,8,'opacity=".7"')+
  pth(`M${cx-96} ${cy-58} l-16 -10 l18 -6 Z`,C.brownD)+pth(`M${cx+96} ${cy-20} l14 -10 l2 14 Z`,C.brownD)+
  shadow(cx,442,96,14)
);})();

ART.table=(()=>{ const cx=256,cy=310; return (
  rr(cx-130,cy-30,260,34,10,C.brown)+rr(cx-130,cy-30,260,12,6,C.goldL)+
  rr(cx-110,cy+4,26,110,6,C.brownD)+rr(cx+84,cy+4,26,110,6,C.brownD)+
  rr(cx-70,cy+40,140,14,6,C.brownD)+
  shadow(cx,446,120,12)
);})();

/* hero banner (homepage) */
ART.hero=(()=>{ return card(
  grp(
    // mosque silhouette far
    pth('M150 444 l0 -120 q0 -40 40 -40 q40 0 40 40 l0 120 Z',C.goldD,'opacity=".35"')+
    pth('M230 444 l0 -150 q0 -50 46 -50 q46 0 46 50 l0 150 Z',C.purpleD,'opacity=".45"')+
    pth('M312 444 l0 -120 q0 -40 40 -40 q40 0 40 40 l0 120 Z',C.goldD,'opacity=".35"')+
    cir(276,232,14,C.gold,'opacity=".6"')+
    // ground
    ell(256,438,150,20,C.greenD,'opacity=".35"')+
    girl({x:196,y:326,s:0.72,hijab:C.rose})+
    boy({x:316,y:326,s:0.72})
  )
);})();

/* ---------------- write files ---------------- */
const PILOT = [
  ['apple','Apple','تفاحة'],['ball','Ball','كرة'],['cat','Cat','قطة'],['dog','Dog','كلب'],
  ['egg','Egg','بيضة'],['fish','Fish','سمكة'],['goat','Goat','عنزة'],['hat','Hat','قبعة'],
  ['ice','Ice','ثلج'],['juice','Juice','عصير'],['kite','Kite','طائرة ورقية'],['lion','Lion','أسد'],
  ['monkey','Monkey','قرد'],['nest','Nest','عش'],['orange','Orange','برتقالة'],['pig','Pig','خنزير'],
  ['queen','Queen','ملكة'],['rabbit','Rabbit','أرنب'],['sun','Sun','شمس'],['tiger','Tiger','نمر'],
  ['umbrella','Umbrella','مظلة'],['van','Van','شاحنة'],['water','Water','ماء'],['fox','Fox','ثعلب'],
  ['yoyo','Yo-yo','يويو'],['zebra','Zebra','حمار وحشي'],['star','Star','نجمة'],['tree','Tree','شجرة'],
  ['book','Book','كتاب'],['milk','Milk','حليب'],['cake','Cake','كيكة'],['bird','Bird','طائر'],
  ['moon','Moon','قمر'],['car','Car','سيارة'],['house','House','منزل'],['flower','Flower','زهرة'],
  ['banana','Banana','موز'],['table','Table','طاولة']
];

const NIGHT = new Set(['moon']);
let made=0;
for (const [slug] of PILOT){
  const fn = ART[slug];
  if(!fn){ console.log('MISSING SUBJECT:', slug); continue; }
  const html = card(fn, { night: NIGHT.has(slug), floor: NIGHT.has(slug)?'#1e1b4b':'#e9d5ff' });
  fs.writeFileSync(path.join(OUT, slug+'.svg'), html);
  made++;
}
fs.writeFileSync(path.join(OUT,'hero.svg'), ART.hero);
const indexObj = {};
for (const [slug,en,ar] of PILOT) indexObj[slug] = { en, ar, src:'img/art/'+slug+'.svg' };
fs.writeFileSync(path.join(OUT,'index.json'), JSON.stringify(indexObj,null,2));
console.log('generated', made, 'word illustrations + hero.svg at', OUT);

/* =====================================================================
   FULL LIBRARY — parametric renderers so EVERY word gets an illustration.
   Style matches the bespoke pilot (flat storybook vector, Islamic arch frame).
   ===================================================================== */
const W = JSON.parse(fs.readFileSync('C:\\EnglishKids\\tools\\words.json','utf8'));
const LETTER = {a:'apple',b:'ball',c:'cat',d:'dog',e:'egg',f:'fish',g:'goat',h:'hat',i:'ice',j:'juice',k:'kite',l:'lion',m:'monkey',n:'nest',o:'orange',p:'pig',q:'queen',r:'rabbit',s:'sun',t:'tiger',u:'umbrella',v:'van',w:'water',x:'fox',y:'yoyo',z:'zebra'};

/* ---- generic quadruped ---- */
function beast(o){
  o=o||{}; const x=o.x||256, y=o.y||252;
  const body=o.body||C.brown, belly=o.belly||o.body||C.brown, head=o.head||o.body||C.brown;
  const ear=o.ears||'tri', ein=o.earIn||C.pink;
  let g='';
  g+=rr(x-60,y+112,32,60,12,o.leg||body)+rr(x+28,y+112,32,60,12,o.leg||body);
  g+=rr(x-50,y+160,36,18,8,C.ink)+rr(x+14,y+160,36,18,8,C.ink);
  g+=ln(`M${x+82} ${y+34} q40 8 30 56`,body,14);
  g+=ell(x,y+88,98,74,body);
  g+=ell(x,y+104,60,46,belly);
  if(o.stripes) for(let i=-1;i<=1;i++) g+=rr(x+i*46-10,y+22,20,116,10,o.stripes,'opacity=".5"');
  if(o.hump) g+=ell(x,y+22,52,40,body);
  g+=cir(x,y-4,72,head);
  if(ear==='tri'){ g+=pth(`M${x-54} ${y-50} L${x-80} ${y-118} L${x-14} ${y-78} Z`,head)+pth(`M${x+54} ${y-50} L${x+80} ${y-118} L${x+14} ${y-78} Z`,head)+pth(`M${x-50} ${y-56} L${x-68} ${y-100} L${x-28} ${y-74} Z`,ein)+pth(`M${x+50} ${y-56} L${x+68} ${y-100} L${x+28} ${y-74} Z`,ein); }
  else if(ear==='round'){ g+=cir(x-70,y-46,26,head)+cir(x+70,y-46,26,head)+cir(x-70,y-46,13,ein)+cir(x+70,y-46,13,ein); }
  else if(ear==='long'){ g+=ell(x-52,y-66,18,56,head,'transform="rotate(-14 '+x+' '+(y-66)+')"')+ell(x+52,y-66,18,56,head,'transform="rotate(14 '+x+' '+(y-66)+')"'); }
  else if(ear==='floppy'){ g+=ell(x-74,y-4,24,50,head)+ell(x+74,y-4,24,50,head); }
  if(o.mane) g+=pth(`M${x-66} ${y-44} q-16 -74 66 -74 q82 0 66 74 q-22 -44 -66 -44 q-44 0 -66 44 Z`,o.mane);
  if(o.horns) g+=pth(`M${x-40} ${y-58} q-22 -44 -50 -40 q18 12 24 48 Z`,C.cream)+pth(`M${x+40} ${y-58} q22 -44 50 -40 q-18 12 -24 48 Z`,C.cream);
  if(o.trunk) g+=ln(`M${x} ${y+44} q4 56 -32 70`,head,22);
  if(o.spots) [[x-40,y-24,15],[x+32,y-34,12],[x-8,y-66,10],[x+46,y+6,11]].forEach(([a,bb,r])=>g+=cir(a,bb,r,o.spot||C.brownD));
  if(o.beak) g+=pth(`M${x} ${y+20} l-32 12 l32 16 l32 -16 Z`,C.gold);
  if(o.comb){ g+=cir(x-10,y-76,11,C.red)+cir(x+8,y-82,10,C.red)+cir(x+20,y-70,9,C.red)+pth(`M${x} ${y+52} q12 26 0 30 q-12 -4 -8 -30 Z`,C.red); }
  g+=face(x,y-12,1,{cheeks:o.cheeks!==false});
  if(o.nose) g+=cir(x,y+20,o.nose,C.ink);
  g+=shadow(x,442,100,14);
  return g;
}
const ANIMA={
  cow:{body:'#ffffff',belly:'#f1f5f9',spot:'#1f2937',horns:1,ears:'round',earIn:'#f9a8d4',nose:7},
  horse:{body:C.brown,belly:'#d8a06a',leg:C.brownD,mane:'#4b2e18',ears:'tri',earIn:C.brownD},
  duck:{body:'#facc15',belly:'#fde68a',beak:1,ears:'none',leg:C.orange},
  chicken:{body:'#ffffff',belly:'#fff7ed',comb:1,beak:1,ears:'none',leg:C.orange},
  camel:{body:'#e6c07b',belly:'#f0d9a8',hump:1,ears:'round',earIn:'#d9b06a',nose:6},
  sheep:{body:'#f8fafc',belly:'#e5e7eb',ears:'floppy',earIn:'#cbd5e1',nose:6,cheeks:false},
  frog:{body:C.green,belly:'#dcfce7',ears:'none',eyes:1},
  rat:{body:C.gray,belly:'#cbd5e1',ears:'round',earIn:'#f9a8d4',nose:6}
};
const SPECIAL={
  turtle(){ const x=256,y=300; return (
    cir(x-84,y+52,26,C.green)+cir(x+84,y+52,26,C.green)+
    ell(x,y+34,96,64,C.greenD)+
    pth(`M${x} ${y-72} q98 24 98 118 q-30 24 -98 24 q-68 0 -98 -24 q0 -94 98 -118 Z`,C.green)+
    ln(`M${x-64} ${y-22} l128 0`,C.greenD,5)+ln(`M${x-52} ${y+26} l104 0`,C.greenD,5)+ln(`M${x} ${y-70} l0 158`,C.greenD,5)+
    cir(x,y+128,30,C.green)+face(x,y+128,0.7)+
    shadow(x,442,100,14)); },
  snake(){ const x=256,y=300; return (
    pth(`M${x-6} ${y-96} q70 0 70 54 q0 44 -60 44 q-52 0 -52 40 q0 40 60 40 q40 0 40 34`,C.green)+
    ln(`M${x-6} ${y-96} q70 0 70 54 q0 44 -60 44 q-52 0 -52 40 q0 40 60 40 q40 0 40 34`,C.greenD,16)+
    cir(x-6,y-104,30,C.green)+face(x-6,y-108,0.68)+ln(`M${x+18} ${y-118} l22 -14`,C.red,5)+ln(`M${x-30} ${y-118} l-22 -14`,C.red,5)+
    shadow(x,442,90,14)); },
  butterfly(){ const x=256,y=290; const wing=(s)=>pth(`M${x} ${y-10} q${s*90} -70 ${s*96} -6 q${s*6} 62 -${s*96} 52 Z`,s>0?C.gold:C.rose); return (
    pth(`M${x} ${y-10} q86 -66 92 -4 q4 58 -92 48 Z`,C.rose)+pth(`M${x} ${y-10} q-86 -66 -92 -4 q-4 58 92 48 Z`,C.gold)+
    pth(`M${x} ${y+40} q60 30 66 66 q-40 6 -66 -30 Z`,C.gold)+pth(`M${x} ${y+40} q-60 30 -66 66 q40 6 66 -30 Z`,C.rose)+
    ell(x,y+24,14,74,C.ink)+cir(x,y-56,16,C.ink)+ln(`M${x} ${y-68} l-24 -20`,C.ink,4)+ln(`M${x} ${y-68} l24 -20`,C.ink,4)+
    cir(x-6,y-60,3,C.white)+cir(x+6,y-60,3,C.white)+shadow(x,442,70,12)); },
  elephant(){ const x=256,y=250; return (
    rr(x-66,y+118,34,58,14,C.grayD)+rr(x+32,y+118,34,58,14,C.grayD)+
    ell(x,y+90,102,78,C.gray)+cir(x-72,y,58,C.gray)+cir(x+72,y,58,C.gray)+
    cir(x,y-2,76,C.gray)+ln(`M${x} ${y+52} q6 60 -30 74`,C.gray,30)+
    face(x,y-16,1,{cheeks:false})+shadow(x,442,104,14)); },
  giraffe(){ const x=256,y=210; return (
    rr(x-52,y+150,30,54,12,C.gold)+rr(x+22,y+150,30,54,12,C.gold)+
    ell(x,y+124,80,58,C.gold)+
    rr(x-26,y-96,52,190,24,C.gold)+
    cir(x,y-120,50,C.gold)+cir(x-64,y-124,26,C.gold,'')+
    pth(`M${x-34} ${y-150} L${x-60} ${y-176} L${x-16} ${y-166} Z`,C.gold)+pth(`M${x+34} ${y-150} L${x+60} ${y-176} L${x+16} ${y-166} Z`,C.gold)+
    [[x-10,y-60,12],[x+12,y-24,10],[x-8,y+14,11],[x-56,y+120,10],[x+40,y+128,9]].forEach(([a,bb,r])=>cir(a,bb,r,C.brownD))+
    face(x,y-128,0.9)+shadow(x,442,80,14)); },
  bat(){ const x=256,y=300; return (
    pth(`M${x} ${y} q-120 -96 -152 8 q72 32 152 -8 Z`,C.ink)+pth(`M${x} ${y} q120 -96 152 8 q-72 32 -152 -8 Z`,C.ink)+
    cir(x,y,34,C.ink)+pth(`M${x-16} ${y-18} l-12 -36 l28 12 Z`,C.ink)+pth(`M${x+16} ${y-18} l12 -36 l-28 12 Z`,C.ink)+
    cir(x-11,y-4,5,C.white)+cir(x+11,y-4,5,C.white)+cir(x,y+120,0,'transparent')+shadow(x,442,130,14)); }
};

/* ---- food ---- */
function food(k){
  const x=256,y=300;
  const board=(c)=>ell(x,y+98,112,24,c||C.white)+ell(x,y+98,112,24,'none','stroke="'+C.gray+'" stroke-width="4"');
  switch(k){
    case 'bread': return pth(`M${x-98} ${y+44} q0 -74 98 -74 q98 0 98 74 q0 42 -32 42 l-132 0 q-32 0 -32 -42 Z`,C.gold)+ln(`M${x-72} ${y-4} h144`,C.goldD,5,'opacity=".6"')+ln(`M${x-72} ${y+20} h144`,C.goldD,5,'opacity=".6"')+cir(x-84,y-34,16,C.goldL)+cir(x+88,y-30,14,C.goldL)+shadow(x,442,100,14);
    case 'rice': return cir(x,y-6,96,C.white)+pth(`M${x-96} ${y+6} q96 84 192 0 q-10 96 -96 96 q-86 0 -96 -96 Z`,C.blue)+ell(x,y-6,96,20,C.blueD)+[ -40,-10,20,50 ].map(dx=>cir(x+dx,y-40,10,C.brown)).join('')+shadow(x,442,104,14);
    case 'cheese': return pth(`M${x-100} ${y+70} L${x+96} ${y+70} L${x+96} ${y-10} L${x-100} ${y+34} Z`,C.gold)+[ [-40,30],[20,40],[60,20],[-70,46] ].map(([a,bb])=>cir(x+a,y+bb-40,13,C.goldD)).join('')+shadow(x,442,104,14);
    case 'meat': return ell(x-20,y+66,84,34,C.cream)+pth(`M${x-60} ${y+54} q-30 -70 40 -98 q96 -34 120 34 q18 54 -40 76 q-70 22 -120 -12 Z`,C.redD)+cir(x+10,y-30,26,C.pink,'opacity=".5"')+shadow(x,442,104,14);
    case 'eggs': return board()+[ [-46,-2],[0,-16],[46,-2] ].map(([a,bb])=>pth(`M${x+a} ${y+bb-70} C${x+a+58} ${y+bb-70} ${x+a+58} ${y+bb+50} ${x+a} ${y+bb+50} C${x+a-58} ${y+bb+50} ${x+a-58} ${y+bb-70} ${x+a} ${y+bb-70} Z`,C.paper)).join('')+shadow(x,442,104,14);
    case 'chocolate': return rr(x-96,y-84,192,168,16,C.brownD)+`<g>`+[...Array(3)].map((_,r)=>[...Array(3)].map((_,c)=>rr(x-84+c*56,y-72+r*56,48,48,8,r%2?C.brown:C.brownD)).join('')).join('')+`</g>`+shadow(x,442,104,14);
    case 'chips': return pth(`M${x-66} ${y-60} l132 0 l-14 158 q-2 16 -18 16 l-68 0 q-16 0 -18 -16 Z`,C.red)+rr(x-66,y-84,132,32,10,C.redD)+ln(`M${x-40} ${y-60} l-4 158`,C.white,4,'opacity=".4"')+cir(x,y+30,34,C.gold)+shadow(x,442,100,14);
    case 'sandwich': return pth(`M${x-104} ${y+56} L${x} ${y-98} L${x+104} ${y+56} Z`,C.gold)+rr(x-96,y+6,192,20,6,C.green)+rr(x-96,y+26,192,20,6,C.red)+rr(x-96,y+46,192,20,6,C.cream)+shadow(x,442,110,14);
    case 'pizza': return cir(x,y,104,C.gold)+cir(x,y,104,'none','stroke="'+C.goldD+'" stroke-width="10"')+[ [-40,-30],[30,-40],[40,30],[-24,40],[0,-2] ].map(([a,bb])=>cir(x+a,y+bb,15,C.red)).join('')+ell(x-30,y-34,12,8,'#ffffff88')+shadow(x,442,104,14);
    case 'tea': return pth(`M${x-70} ${y-54} l16 150 q2 18 20 18 l68 0 q18 0 20 -18 l16 -150 Z`,'#ffffffdd')+ell(x,y-54,70,18,C.white)+ln(`M${x-40} ${y-30} q40 26 80 0`,C.gold,8,'opacity=".5"')+cir(x-30,y-90,14,C.gray,'opacity=".5"')+cir(x+16,y-120,18,C.gray,'opacity=".35"')+shadow(x,442,90,14);
    case 'grapes': return ln(`M${x} ${y-96} q-30 -14 -50 -6`,C.brownD,5)+[ [-46,-38],[-16,-38],[14,-38],[44,-38],[-30,0],[0,0],[30,0],[-16,36],[16,36],[0,72] ].map(([a,bb])=>cir(x+a,y+bb,24,C.purple)).join('')+cir(x-8,y-74,8,C.green)+shadow(x,442,70,14);
    case 'watermelon': return pth(`M${x-110} ${y-40} A110 110 0 0 0 ${x+110} ${y-40} Z`,C.green)+pth(`M${x-98} ${y-40} A98 98 0 0 0 ${x+98} ${y-40} Z`,C.white)+pth(`M${x-88} ${y-40} A88 88 0 0 0 ${x+88} ${y-40} Z`,C.red)+[ -50,-20,10,40 ].map(a=>pth(`M${x+a} ${y-40} l10 40 l-10 20 l-10 -20 Z`,C.ink)).join('')+shadow(x,442,104,14);
    case 'tomato': return cir(x,y,90,C.red)+pth(`M${x} ${y-84} l-18 -22 l26 6 l10 -22 l10 22 l26 -6 l-18 22 Z`,C.green)+cir(x-30,y-30,18,'#ffffff44')+shadow(x,442,84,14);
    case 'potato': return ell(x,y,98,74,C.brown)+[[-40,-20],[-10,24],[34,-14],[8,-40]].forEach(([a,bb])=>ell(x+a,y+bb,10,7,C.brownD))+shadow(x,442,100,14);
    case 'carrot': return pth(`M${x} ${y+96} L${x-52} ${y-56} L${x+52} ${y-56} Z`,C.orange)+ln(`M${x-18} ${y-50} l-6 60`,C.goldD,4,'opacity=".5"')+ln(`M${x+18} ${y-50} l6 60`,C.goldD,4,'opacity=".5"')+ln(`M${x-40} ${y-56} q-6 -46 -30 -60`,C.green,10)+ln(`M${x+2} ${y-58} q0 -52 0 -70`,C.green,10)+ln(`M${x+40} ${y-56} q8 -46 32 -58`,C.green,10)+shadow(x,442,60,12);
    case 'onion': return cir(x,y,88,C.paper)+pth(`M${x} ${y-96} q-8 -30 0 -46 q8 16 0 46`,C.green)+ln(`M${x} ${y-84} q-4 90 0 172`,C.gold,'3')+ln(`M${x-40} ${y-70} q-30 90 -8 156`,C.gold,'3')+ln(`M${x+40} ${y-70} q30 90 8 156`,C.gold,'3')+shadow(x,442,84,14);
    case 'cucumber': return rr(x-60,y-96,120,196,58,C.green)+[ [-16,-60],[10,-30],[-14,4],[12,38],[-8,70] ].map(([a,bb])=>cir(x+a,y+bb,7,C.greenD)).join('')+ell(x-14,y-40,10,40,'#ffffff33')+shadow(x,442,80,14);
    case 'fruits': return board(C.goldL)+cir(x-52,y-8,40,C.red)+cir(x+8,y-18,42,C.orange)+cir(x+58,y-2,34,C.green)+pth(`M${x-52} ${y-48} l-6 -20`,C.brownD)+pth(`M${x+8} ${y-58} l-6 -20`,C.brownD)+pth(`M${x+58} ${y-36} l-4 -18`,C.brownD)+shadow(x,442,110,14);
    case 'breakfast': return food('bread')+cir(x+90,y+40,34,C.paper)+ln(`M${x-120} ${y+70} l-40 -50`,C.white,8)+ln(`M${x+120} ${y+70} l40 -50`,C.white,8);
    case 'lunch': return pth(`M${x} ${y-70} l-110 130 l220 0 Z`,C.red)+rr(x-40,y-20,80,60,6,C.gold)+ell(x,y-66,26,16,C.white)+shadow(x,442,110,14);
    case 'dinner': return board()+pth(`M${x} ${y-60} q70 0 70 60 q0 60 -70 60 l-70 0 l0 -120 Z`,C.paper)+rr(x-70,y-6,60,50,4,C.gold)+ln(`M${x-14} ${y-40} l-26 0`,C.gray,6)+ln(`M${x-14} ${y-18} l-26 0`,C.gray,6)+shadow(x,442,110,14);
  }
  return splat(C.orange);
}

/* ---- objects ---- */
function obj(k){
  const x=256,y=302;
  const gl=(cx,cy,rx,ry,o='.3')=>ell(cx,cy,rx,ry,'#ffffff','opacity="'+o+'" noline');
  const seam=(d,c,w)=>ln(d,c||C.ink,w||3,'opacity=".22" noline');
  switch(k){
    case 'chair':
      return rr(x-72,y+8,18,92,8,C.brownD)+rr(x+54,y+8,18,92,8,C.brownD)
        +rr(x-72,y-100,26,108,10,C.brown)+rr(x+46,y-100,26,108,10,C.brown)
        +rr(x-70,y-100,140,22,11,C.brown)+seam(`M${x-58} ${y-84} l116 0`,C.brownD)+seam(`M${x-58} ${y-66} l116 0`,C.brownD)
        +rr(x-72,y-8,144,28,12,C.brownD)+gl(x-34,y+2,34,5,.3)
        +cir(x-59,y-90,3,C.goldD)+cir(x+59,y-90,3,C.goldD)+cir(x-59,y-2,3,C.goldD)+cir(x+59,y-2,3,C.goldD)
        +shadow(x,442,92,14);
    case 'desk':
      return rr(x-112,y-26,224,30,11,C.gold)+gl(x-46,y-18,70,5,.3)
        +rr(x-100,y+4,22,90,8,C.brownD)+rr(x+78,y+4,22,90,8,C.brownD)
        +rr(x-72,y-60,116,34,4,'#ffffff')+ln(`M${x-66} ${y-52} l104 0`,C.gray,3)+ln(`M${x-66} ${y-44} l104 0`,C.gray,3)+ln(`M${x-66} ${y-36} l64 0`,C.gray,3)
        +rr(x+2,y-78,124,20,4,C.red)+rr(x+14,y-100,124,20,4,C.teal)+rr(x-34,y-118,96,18,4,C.purple)+gl(x+30,y-92,40,3,.25)
        +rr(x-88,y-10,44,10,4,C.brownD)+rr(x-36,y-10,44,10,4,C.brownD)+shadow(x,442,126,14);
    case 'pencil':
      return rr(x-26,y-36,52,150,6,C.gold)+gl(x-14,y-24,10,60,.35)
        +pth(`M${x-26} ${y+114} l26 30 l26 -30 Z`,C.goldL)+pth(`M${x-11} ${y+142} l11 16 l11 -16 Z`,C.ink)
        +rr(x-26,y-62,52,28,3,C.redD)+rr(x-26,y-88,52,28,5,C.gray)+rr(x-26,y-116,52,30,8,C.pink)
        +ln(`M${x+14} ${y-24} l0 132`,C.goldD,3,'opacity=".45"')+ln(`M${x-14} ${y-24} l0 132`,C.goldD,3,'opacity=".25"')
        +shadow(x,442,54,12);
    case 'eraser':
      return rr(x-92,y-44,184,116,16,C.rose)+rr(x-92,y-44,184,46,16,C.blue)
        +gl(x-40,y-32,54,6,.3)+ln(`M${x-92} ${y+2} l184 0`,C.ink,5,'opacity=".25"')
        +ln(`M${x-58} ${y+28} l116 0`,C.red,5,'opacity=".3"')+ln(`M${x-46} ${y+48} l92 0`,C.red,5,'opacity=".2"')
        +shadow(x,442,102,14);
    case 'crayon':
      return rr(x-30,y-94,60,182,14,C.red)+rr(x-30,y-94,60,14,7,C.redD)+rr(x-30,y-50,60,30,5,C.goldL)
        +pth(`M${x-30} ${y-94} l30 -36 l30 36 Z`,C.redD)+pth(`M${x-8} ${y-116} l8 -14 l8 14 Z`,C.white,'opacity=".6"')
        +gl(x-14,y-30,10,44,.3)+ln(`M${x+16} ${y-90} l0 172`,C.white,4,'opacity=".3"')
        +shadow(x,442,54,12);
    case 'board':
      return rr(x-116,y-84,232,164,12,C.greenD)+rr(x-116,y-84,232,164,12,'none','stroke="'+C.brownD+'" stroke-width="12"')
        +ln(`M${x-86} ${y-46} l58 58`,C.white,6)+ln(`M${x-28} ${y+12} l26 -36`,C.white,6)+ln(`M${x-50} ${y+12} l46 0`,C.white,6)
        +rr(x-116,y+64,232,14,4,C.brownD)+rr(x-8,y+58,54,10,5,C.white)+rr(x-70,y+58,54,10,5,C.rose)
        +shadow(x,442,124,14);
    case 'bag':
      return pth(`M${x-80} ${y-20} l160 0 l-16 130 q-2 16 -18 16 l-92 0 q-16 0 -18 -16 Z`,C.purple)
        +gl(x-42,y+2,40,10,.22)+rr(x+48,y+6,26,68,7,C.purpleD)+rr(x+52,y+18,18,8,3,C.gold)
        +ln(`M${x-46} ${y-20} q0 -62 46 -62 q46 0 46 62`,C.gold,10)
        +rr(x-40,y+28,80,22,7,C.gold)+cir(x,y+39,4,C.goldD)+shadow(x,442,100,14);
    case 'cap':
      return pth(`M${x-92} ${y+30} q0 -112 92 -112 q92 0 92 112 Z`,C.blueD)+gl(x-30,y-56,34,12,.2)
        +pth(`M${x-92} ${y+30} l200 0 q16 28 -12 36 l-188 0 Z`,C.blue)+seam(`M${x} ${y-82} l0 112`,C.blue,4)
        +cir(x,y-52,15,C.gold)+cir(x,y-52,6,C.goldD)+shadow(x,442,112,14);
    case 'tshirt':
      return pth(`M${x-96} ${y-60} l44 -30 q52 18 104 0 l44 30 l-30 40 l-18 -10 l0 116 l-96 0 l0 -116 l-18 10 Z`,C.cyan)
        +pth(`M${x-52} ${y-92} q52 18 104 0`,C.white,'stroke="'+C.white+'" stroke-width="12"')
        +cir(x,y-4,16,C.gold)+pth(`M${x-6} ${y-15} l4 10 l9 1 l-7 7 l2 10 l-8 -5 l-8 5 l2 -10 l-7 -7 l9 -1 Z`,C.white,'noline')
        +shadow(x,442,112,14);
    case 'dress':
      return pth(`M${x-26} ${y-92} l52 0 l-8 58 l54 142 q-72 24 -144 0 l54 -142 Z`,C.rose)
        +pth(`M${x-30} ${y-92} q30 16 60 0`,C.gold,'stroke="'+C.gold+'" stroke-width="9"')
        +rr(x-46,y-18,92,12,4,C.goldD)+cir(x-38,y+34,8,C.white,'opacity=".5" noline')+cir(x+30,y+54,8,C.white,'opacity=".5" noline')+cir(x-14,y+76,8,C.white,'opacity=".5" noline')
        +shadow(x,442,112,14);
    case 'trousers':
      return pth(`M${x-70} ${y-96} l140 0 l-10 70 l-30 122 l-46 0 l14 -110 l-14 110 l-46 0 l-30 -122 Z`,C.navy)
        +rr(x-70,y-96,140,28,5,C.blueD)+cir(x,y-70,4,C.goldD)
        +ln(`M${x-30} ${y-58} l0 92`,C.blueD,3,'opacity=".5"')+ln(`M${x+30} ${y-58} l0 92`,C.blueD,3,'opacity=".5"')
        +shadow(x,442,112,14);
    case 'pants': return obj('trousers');
    case 'skirt':
      return pth(`M${x-54} ${y-80} l108 0 l46 152 q-100 26 -200 0 Z`,C.purple)
        +rr(x-54,y-84,108,22,6,C.gold)
        +[-40,-13,14,41].map(dx=>seam(`M${x+dx} ${y-52} l${dx+ (dx<0?46:46)} ${128}`,C.purpleD)).join('')
        +shadow(x,442,112,14);
    case 'shorts':
      return pth(`M${x-80} ${y-70} l160 0 l-8 60 l-22 62 l-40 0 l10 -62 l-30 0 l10 62 l-40 0 l-22 -62 Z`,C.green)
        +rr(x-80,y-70,160,22,5,C.greenD)+ln(`M${x-24} ${y-46} l-4 32`,C.greenD,3,'opacity=".5"')+ln(`M${x+24} ${y-46} l4 32`,C.greenD,3,'opacity=".5"')
        +cir(x,y-59,5,C.gold)+shadow(x,442,112,14);
    case 'shoes':
      return rr(x-100,y+26,84,58,20,C.indigo)+rr(x+16,y+26,84,58,20,C.indigo)
        +pth(`M${x-100} ${y+84} q-12 -20 6 -24 l78 0 l0 24 Z`,C.ink)+pth(`M${x+16} ${y+84} q-12 -20 6 -24 l78 0 l0 24 Z`,C.ink)
        +ln(`M${x-70} ${y+48} l34 0`,C.white,5)+ln(`M${x-70} ${y+60} l34 0`,C.white,5)+ln(`M${x+46} ${y+48} l34 0`,C.white,5)+ln(`M${x+46} ${y+60} l34 0`,C.white,5)
        +gl(x-58,y+36,24,6,.25)+gl(x+58,y+36,24,6,.25)+shadow(x,442,112,14);
    case 'socks':
      return rr(x-80,y-70,64,152,20,C.red)+rr(x+16,y-70,64,152,20,C.blue)
        +ln(`M${x-80} ${y-54} l64 0`,C.white,9)+ln(`M${x-80} ${y-40} l64 0`,C.white,6)+ln(`M${x+16} ${y-54} l64 0`,C.white,9)+ln(`M${x+16} ${y-40} l64 0`,C.white,6)
        +gl(x-62,y-4,16,40,.2)+gl(x+34,y-4,16,40,.2)+shadow(x,442,112,14);
    case 'tv':
      return rr(x-116,y-84,232,168,16,C.ink)+rr(x-104,y-72,208,144,8,C.blueD)
        +pth(`M${x-46} ${y-8} l96 -44 l0 88 Z`,C.white,'opacity=".75" noline')
        +cir(x+76,y-56,7,C.green)+cir(x+76,y-36,7,C.gold)+cir(x+76,y-16,7,C.red)
        +rr(x-40,y+96,80,14,6,C.grayD)+ln(`M${x-74} ${y-104} l-22 -26`,C.gray,6)+ln(`M${x+74} ${y-104} l22 -26`,C.gray,6)+cir(x-96,y-130,5,C.grayD)+cir(x+96,y-130,5,C.grayD)
        +shadow(x,442,124,14);
    case 'fridge':
      return rr(x-80,y-112,160,228,18,C.white)+rr(x-74,y-106,148,92,10,'#eef2ff')+gl(x-40,y-92,50,10,.25)
        +ln(`M${x-80} ${y-6} l160 0`,C.gray,6)+rr(x+54,y-72,10,34,4,C.grayD)+rr(x+54,y+22,10,46,4,C.grayD)
        +cir(x-30,y-56,10,C.rose)+cir(x-6,y-40,8,C.gold)+rr(x-44,y+30,44,34,5,C.blueL)+ln(`M${x-44} ${y+48} l44 0`,C.blue,3)
        +shadow(x,442,112,14);
    case 'oven':
      return rr(x-92,y-80,184,170,16,C.grayD)+rr(x-80,y-64,160,72,10,C.ink)+rr(x-74,y-58,148,60,8,'#334155')
        +ln(`M${x+10} ${y-18} l36 0 l-18 26 Z`,C.goldL,4)+ell(x-30,y-30,26,16,'#00000055','noline')
        +cir(x-46,y+18,12,C.goldL)+cir(x+46,y+18,12,C.goldL)+ln(`M${x-46} ${y+18} l0 -8`,C.grayD,3)+ln(`M${x+46} ${y+18} l8 0`,C.grayD,3)
        +rr(x-66,y+8,132,58,8,C.gray)+rr(x-80,y+8,160,10,4,C.grayD)+ln(`M${x-40} ${y+34} l80 0`,C.grayD,5)+shadow(x,442,112,14);
    case 'sink':
      return rr(x-96,y-30,192,80,16,C.white)+ell(x,y-30,96,26,'#e2e8f0')+ell(x,y-30,72,16,'#cbd5e1','noline')
        +ln(`M${x} ${y-52} q0 -62 -42 -62`,C.grayD,11)+cir(x-42,y-114,11,C.grayD)+ln(`M${x-42} ${y-104} l0 12`,C.blue,5)
        +cir(x+40,y-14,10,C.grayD)+cir(x-40,y-14,10,C.grayD)+cir(x,y+70,10,C.blue)+gl(x-40,y+2,44,8,.25)+shadow(x,442,112,14);
    case 'toilet':
      return rr(x-58,y-100,56,92,10,C.white)+rr(x-50,y-92,40,14,5,'#eef2ff')+cir(x-30,y-108,5,C.grayD)
        +pth(`M${x-46} ${y-40} q46 -12 46 22 l0 58 l44 0 q22 0 22 26 l0 34 l-112 0 Z`,C.white)
        +ell(x-32,y+58,58,20,'#e2e8f0')+ell(x-32,y+58,42,12,'#cbd5e1','noline')+shadow(x,442,112,14);
    case 'couch':
      return rr(x-122,y-8,244,62,16,C.red)+rr(x-122,y-74,244,74,16,C.redD)+rr(x-112,y-64,100,58,10,C.rose)+rr(x+12,y-64,100,58,10,C.rose)
        +gl(x-62,y-56,40,8,.22)+gl(x+62,y-56,40,8,.22)+cir(x-62,y-30,4,C.redD)+cir(x+62,y-30,4,C.redD)
        +rr(x-122,y+34,22,66,8,C.brownD)+rr(x+100,y+34,22,66,8,C.brownD)+shadow(x,442,124,14);
    case 'cup':
      return pth(`M${x-54} ${y-60} l12 126 q2 16 18 16 l40 0 q16 0 18 -16 l12 -126 Z`,C.white)
        +ell(x,y-60,54,16,C.gray)+ell(x,y-60,44,10,'#e2e8f0','noline')
        +ln(`M${x+66} ${y-26} q42 8 20 58`,C.white,14)
        +ln(`M${x-24} ${y-34} q28 22 56 0`,C.gray,6,'opacity=".4" noline')
        +ln(`M${x-10} ${y-98} q-8 -20 6 -34`,C.white,6,'opacity=".6"')+ln(`M${x+14} ${y-94} q-8 -18 6 -30`,C.white,6,'opacity=".45"')
        +shadow(x,442,82,14);
    case 'net':
      return ln(`M${x} ${y-98} l0 32`,C.brownD,7)
        +ln(`M${x-72} ${y-66} l144 0`,C.grayD,4)+ln(`M${x-72} ${y-28} l144 0`,C.grayD,4)+ln(`M${x-72} ${y+10} l144 0`,C.grayD,4)+ln(`M${x-72} ${y+48} l144 0`,C.grayD,4)
        +ln(`M${x-72} ${y-66} l0 130`,C.grayD,4)+ln(`M${x-24} ${y-66} l0 130`,C.grayD,4)+ln(`M${x+24} ${y-66} l0 130`,C.grayD,4)+ln(`M${x+72} ${y-66} l0 130`,C.grayD,4)
        +shadow(x,442,100,14);
    case 'nut':
      return cir(x,y,84,C.brown)+pth(`M${x-84} ${y-10} q84 -70 168 0 q-30 22 -84 22 q-54 0 -84 -22 Z`,C.brownD)
        +cir(x,y-10,36,C.brownD)+cir(x,y-10,20,C.brown)+gl(x-24,y-40,22,10,.28)
        +ell(x,y+42,54,30,'#ffffff','opacity=".12" noline')+shadow(x,442,86,14);
    case 'pot':
      return pth(`M${x-84} ${y-70} l168 0 l-16 130 q-2 18 -20 18 l-96 0 q-18 0 -20 -18 Z`,C.grayD)
        +ell(x,y-70,84,20,C.gray)+ell(x,y-70,66,12,C.grayD,'noline')
        +ln(`M${x-44} ${y-98} q44 -22 88 0`,C.grayD,11)+cir(x,y-106,14,C.grayD)
        +cir(x-104,y-8,15,C.grayD)+cir(x+104,y-8,15,C.grayD)
        +ln(`M${x-30} ${y-138} q-8 -18 4 -32`,C.white,5,'opacity=".5"')+ln(`M${x+8} ${y-136} q-8 -18 4 -30`,C.white,5,'opacity=".4"')
        +shadow(x,442,102,14);
    case 'log':
      return rr(x-120,y-42,240,84,42,C.brown)+ell(x-120,y,42,42,C.brownD)+ell(x-120,y,28,28,C.brown)+ell(x-120,y,13,13,C.brownD,'noline')
        +ln(`M${x-40} ${y-34} l150 6`,C.brownD,4,'opacity=".4"')+ln(`M${x-30} ${y+26} l140 -6`,C.brownD,4,'opacity=".3"')
        +cir(x+80,y-30,4,C.brownD)+cir(x+96,y+18,4,C.brownD)+shadow(x,442,124,14);
    case 'mat':
      return pth(`M${x-120} ${y-42} l240 0 l0 92 l-240 0 Z`,C.purple)+pth(`M${x-120} ${y-42} l240 0 l0 32 l-240 0 Z`,C.gold)
        +ln(`M${x-96} ${y+22} l192 0`,C.goldL,4)+ln(`M${x-96} ${y+38} l192 0`,C.goldL,3,'opacity=".7"')
        +[-80,0,80].map(dx=>cir(x+dx,y+6,7,C.goldL,'noline')).join('')+shadow(x,442,124,14);
    case 'bed':
      return rr(x-122,y-96,244,26,10,C.brownD)+rr(x-112,y-72,224,58,10,C.white)
        +rr(x-104,y-66,84,44,10,'#eef2ff')+gl(x-64,y-58,34,8,.3)
        +rr(x-122,y-18,244,62,12,C.brown)+rr(x-112,y-6,120,44,8,C.blue)+rr(x+4,y-6,108,44,8,C.blueL)
        +ln(`M${x-112} ${y+12} l112 0`,C.white,3,'opacity=".5"')+shadow(x,442,126,14);
    case 'swing':
      return ln(`M${x-112} ${y+90} l0 -184`,C.grayD,12)+ln(`M${x+112} ${y+90} l0 -184`,C.grayD,12)
        +ln(`M${x-112} ${y-94} l224 0`,C.gray,12)+cir(x-112,y-94,8,C.grayD)+cir(x+112,y-94,8,C.grayD)
        +ln(`M${x-42} ${y-90} l0 86`,C.brownD,6)+ln(`M${x+42} ${y-90} l0 86`,C.brownD,6)
        +rr(x-56,y-10,112,20,9,C.gold)+gl(x-30,y-4,30,5,.3)+shadow(x,442,124,14);
    case 'slide':
      return pth(`M${x-100} ${y-96} l0 40 l160 146 l44 -32 l-160 -146 l44 -14 Z`,C.red)
        +ln(`M${x-100} ${y-150} l0 60`,C.grayD,10)+ln(`M${x-100} ${y-150} q56 -20 150 0`,C.gray,8)
        +ln(`M${x+28} ${y-64} l70 -58`,C.grayD,10)+rr(x-100,y-34,196,12,5,C.gray)
        +ln(`M${x-70} ${y-34} l0 -104`,C.grayD,8)+ln(`M${x-40} ${y-34} l0 -104`,C.grayD,8)+ln(`M${x-70} ${y-100} l30 0`,C.gray,6)
        +shadow(x,442,132,14);
    case 'mower':
      return rr(x-84,y+40,168,54,12,C.red)+rr(x-84,y+40,168,16,8,C.redD)
        +rr(x-26,y-34,88,74,12,C.grayD)+rr(x-16,y-30,66,30,8,C.blueL)+cir(x+17,y-6,8,C.grayD)
        +cir(x-76,y+96,26,C.ink)+cir(x+76,y+96,26,C.ink)+cir(x-76,y+96,10,C.gray)+cir(x+76,y+96,10,C.gray)
        +ln(`M${x+40} ${y-52} l66 -64`,C.grayD,9)+cir(x+108,y-116,9,C.red)
        +shadow(x,442,120,14);
    case 'grass':
      return pth(`M${x-150} ${y+84} q150 -70 300 0 Z`,C.green)+pth(`M${x-150} ${y+84} q150 -46 300 0 Z`,C.leaf,'noline')
        +[...Array(8)].map((_,i)=>ln(`M${x-120+i*34} ${y+72} q-8 -56 -18 -80`,C.greenD,6)).join('')
        +cir(x+70,y+18,10,C.gold)+cir(x+70,y+18,5,C.goldL,'noline')+cir(x-80,y+30,8,C.rose)+cir(x-80,y+30,4,C.goldL,'noline')
        +shadow(x,442,150,14);
    case 'truck':
      return rr(x-142,y-12,182,90,10,C.blue)+rr(x-142,y-12,182,18,8,C.blueD)
        +rr(x+40,y-74,104,152,10,C.blueD)+rr(x+52,y-64,80,48,8,C.blueL)+gl(x+70,y-56,40,8,.25)
        +rr(x-130,y+6,120,54,8,C.blueL)+cir(x-70,y+34,10,C.white)
        +cir(x-92,y+90,28,C.ink)+cir(x-32,y+90,28,C.ink)+cir(x+86,y+90,28,C.ink)+cir(x-92,y+90,10,C.gray)+cir(x-32,y+90,10,C.gray)+cir(x+86,y+90,10,C.gray)
        +shadow(x,442,152,14);
    case 'bus':
      return rr(x-142,y-64,284,122,12,C.gold)+rr(x-142,y-64,284,20,8,C.goldD)
        +rr(x-128,y-50,118,58,8,C.blueL)+rr(x+14,y-50,114,58,8,C.blueL)+ln(`M${x+14} ${y-50} l0 58`,C.gold,7)+gl(x-96,y-42,50,8,.22)
        +rr(x-142,y+58,284,32,6,C.goldD)+cir(x-84,y+98,26,C.ink)+cir(x+84,y+98,26,C.ink)+cir(x-84,y+98,10,C.gray)+cir(x+84,y+98,10,C.gray)
        +cir(x-150,y+30,9,C.white)+cir(x+150,y+30,9,C.white)+shadow(x,442,152,14);
    case 'tennis':
      return cir(x-70,y+46,36,C.goldL)+cir(x-70,y+46,36,'none','stroke="'+C.green+'" stroke-width="10"')+ln(`M${x-98} ${y+34} q28 -18 56 0`,C.grayD,4)
        +rr(x+22,y-118,15,168,8,C.grayD,'transform="rotate(20 '+(x+22)+' '+(y-118)+')"')
        +ell(x+40,y-112,42,32,C.red,'transform="rotate(20 '+(x+22)+' '+(y-118)+')"')
        +ln(`M${x+18} ${y-96} l26 18`,C.redD,3,'transform="rotate(20 '+(x+22)+' '+(y-118)+')"')+ln(`M${x+22} ${y-122} l28 8`,C.redD,3,'transform="rotate(20 '+(x+22)+' '+(y-118)+')"')
        +shadow(x,442,124,14);
    case 'basketball':
      return cir(x-24,y-24,74,C.orange)+cir(x-24,y-24,74,'none','stroke="'+C.brownD+'" stroke-width="5"')
        +ln(`M${x-98} ${y-24} q74 -46 148 0`,C.brownD,4)+ln(`M${x-24} ${y-98} q46 74 0 148`,C.brownD,4)+ln(`M${x-72} ${y-72} q48 48 96 96`,C.brownD,4,'opacity=".5"')
        +gl(x-46,y-48,20,10,.3)+rr(x+74,y-118,122,14,6,C.red)+rr(x+100,y-104,58,40,6,C.paper)+ln(`M${x+106} ${y-64} l46 0 l-23 34 Z`,C.red)
        +shadow(x,442,124,14);
    case 'cartoon':
      return rr(x-116,y-84,232,168,16,C.gold)+rr(x-104,y-72,208,144,8,C.cyan)
        +cir(x-38,y-8,36,C.gold)+cir(x+38,y-8,36,C.rose)+face(x-38,y-12,0.72)+face(x+38,y-12,0.72)
        +rr(x-40,y+96,80,14,6,C.grayD)+ln(`M${x-70} ${y-104} l-18 -22`,C.gray,6)+ln(`M${x+70} ${y-104} l18 -22`,C.gray,6)
        +shadow(x,442,124,14);
    case 'football':
      return cir(x,y,82,C.white)+cir(x,y,82,'none','stroke="'+C.gray+'" stroke-width="5"')
        +pth(`M${x} ${y-34} l34 25 l-13 41 l-42 0 l-13 -41 Z`,C.ink)
        +cir(x-44,y+44,15,C.ink)+cir(x+44,y+44,15,C.ink)+cir(x-60,y-30,11,C.ink)+cir(x+60,y-30,11,C.ink)
        +gl(x-24,y-50,30,10,.35)+shadow(x,442,90,14);
    case 'pen':
      return rr(x-10,y-100,20,180,9,C.blueD)+rr(x-10,y-100,20,180,9,'none','stroke="'+C.navy+'" stroke-width="3"')
        +pth(`M${x-10} ${y+80} l10 32 l10 -32 Z`,C.ink)+pth(`M${x-4} ${y+96} l4 16 l4 -16 Z`,C.gray)
        +rr(x-10,y-70,20,24,3,C.gray)+rr(x-10,y-100,20,28,4,C.blueL)+gl(x-4,y-96,4,24,.4)
        +rr(x-16,y-64,8,26,4,C.gold)+shadow(x,442,52,12);
    case 'doll':
      return cir(x,y-58,44,C.skin)+pth(`M${x-48} ${y-52} q0 -62 48 -62 q48 0 48 62 q-16 -38 -48 -38 q-32 0 -48 38 Z`,C.gold)
        +face(x,y-56,0.8)+cir(x-30,y-84,6,C.goldL,'noline')+cir(x+30,y-84,6,C.goldL,'noline')
        +pth(`M${x-50} ${y+40} q50 -42 100 0 l0 74 q-50 -22 -100 0 Z`,C.rose)+ln(`M${x-20} ${y+30} l40 0`,C.gold,5)
        +cir(x,y+70,6,C.gold,'noline')+ln(`M${x-64} ${y-28} l-22 44`,C.skin,14)+ln(`M${x+64} ${y-28} l22 44`,C.skin,14)
        +cir(x-86,y+18,10,C.skin)+cir(x+86,y+18,10,C.skin)+shadow(x,442,94,14);
    case 'door':
      return rr(x-72,y-114,144,228,12,C.brownD)+rr(x-58,y-100,116,200,8,C.brown)
        +rr(x-44,y-84,88,74,6,C.brownD)+rr(x-44,y+6,88,74,6,C.brownD)+cir(x+38,y+6,11,C.gold)+cir(x+38,y+6,4,C.goldD)
        +shadow(x,442,94,14);
    case 'window':
      return rr(x-98,y-98,196,196,14,C.white)+rr(x-86,y-86,172,172,6,C.blueL)
        +ln(`M${x} ${y-86} l0 172`,C.white,14)+ln(`M${x-86} ${y} l172 0`,C.white,14)
        +cir(x+44,y-58,15,C.goldL)+pth(`M${x-30} ${y+60} q30 -40 60 0 Z`,C.green,'noline')
        +shadow(x,442,112,14);
  }
  return splat(C.grayD);
}

/* ---- places / architecture ---- */
function place(k){
  const x=256, base=430;
  const wall=(c,ww,hh,wy)=>rr(x-ww/2,wy||base-hh,ww,hh,10,c)+rr(x-ww/2,wy||base-hh,ww,hh,10,'none','stroke="'+C.ink+'" stroke-width="3" opacity=".15"');
  const win=(wx,wy,w,f)=>rr(wx-16,wy,32,40,6,f||C.blueL)+ln(`M${wx-16} ${wy+20} l32 0`,C.goldL,3)+ln(`M${wx} ${wy} l0 40`,C.goldL,3);
  const door=(wy,h,c)=>pth(`M${x-34} ${wy+h} l0 -${h-14} q34 -30 68 0 l0 ${h-14} Z`,c||C.brownD)+cir(x+18,wy+h-30,5,C.gold);
  const dome=(cy,c)=>pth(`M${x-70} ${cy} q70 -96 140 0 Z`,c||C.teal)+cir(x,cy-84,14,C.gold);
  switch(k){
    case 'home': return wall(C.cream,220,150)+pth(`M${x-130} ${base-150} l130 -80 l130 80 Z`,C.red)+win(x-60,base-120)+win(x+60,base-120)+door(base-90,90)+shadow(x,442,130,14);
    case 'building': return wall(C.indigo,200,300)+[...Array(4)].map((_,r)=>[...Array(2)].map((_,c)=>win(x-54+c*108,base-260+r*60,C.goldL)).join('')).join('')+door(base-70,70)+shadow(x,442,120,14);
    case 'school': return wall(C.goldL,230,150)+pth(`M${x-140} ${base-150} l140 -70 l140 70 Z`,C.blueD)+cir(x,base-230,20,C.white)+[...Array(3)].map((_,i)=>win(x-70+i*70,base-120,C.blue)).join('')+door(base-90,90,C.brownD)+pth(`M${x-10} ${base-250} l0 -40 l20 0 l0 40 Z`,C.red)+shadow(x,442,140,14);
    case 'hospital': return wall(C.white,220,180)+rr(x-20,base-250,40,20,C.red)+rr(x-10,base-270,20,60,C.red)+[...Array(2)].map((_,i)=>win(x-60+i*120,base-150,C.blueL)).join('')+door(base-100,100,C.blueD)+shadow(x,442,120,14);
    case 'mosque': return wall(C.cream,210,120)+dome(base-120,C.teal)+rr(x-120,base-260,24,140,6,C.teal)+rr(x+96,base-260,24,140,6,C.teal)+cir(x-108,base-264,16,C.gold)+cir(x+108,base-264,16,C.gold)+pth(`M${x-30} ${base} l0 -80 q30 -40 60 0 l0 80 Z`,C.teal)+ln(`M${x-40} ${base-30} q40 -24 80 0`,C.goldL,4)+shadow(x,442,130,14);
    case 'church': return wall(C.paper,180,150)+pth(`M${x-70} ${base-150} l70 -110 l70 110 Z`,C.brownD)+rr(x-6,base-320,12,60,C.gold)+rr(x-24,base-300,60,12,C.gold)+cir(x,base-200,14,C.rose)+door(base-80,80,C.brownD)+shadow(x,442,120,14);
    case 'museum': return wall(C.paper,240,140)+pth(`M${x-140} ${base-140} l140 -70 l140 70 Z`,C.gray)+`<g>`+[-80,-20,40,100].map(dx=>rr(x+dx-12,base-140,24,140,4,C.white)+rr(x+dx-14,base-152,28,14,3,C.grayD)).join('')+`</g>`+shadow(x,442,140,14);
    case 'shop': return wall(C.rose,210,120)+pth(`M${x-115} ${base-120} l230 0 l0 -34 l-230 0 Z`,C.red)+ln(`M${x-115} ${base-154} l230 0`,C.goldL,6)+rr(x-90,base-100,180,50,8,'#ffffff88')+door(base-90,90,C.brownD)+shadow(x,442,120,14);
    case 'station': return wall(C.blueD,240,150)+pth(`M${x-150} ${base-150} l150 -60 l150 60 Z`,C.navy)+rr(x-120,base-116,240,30,6,C.blueL)+cir(x-70,base-60,30,C.ink)+cir(x+70,base-60,30,C.ink)+door(base-70,70)+shadow(x,442,140,14);
    case 'street': return rr(x-150,base-20,300,20,4,C.grayD)+[ -90,-20,50 ].map(dx=>rr(x+dx-10,base+40,20,40,4,C.goldL)).join('')+wall(C.cream,60,140,base-60)+win(x-90,base-140,C.blue)+win(x+90,base-140,C.blue)+shadow(x,442,150,14);
    case 'park': return pth(`M${x-150} ${base} q150 -40 300 0 Z`,C.green,'noline')+cir(x-70,base-120,60,C.green)+rr(x-78,base-120,16,110,6,C.brownD)+cir(x+60,base-100,46,C.leaf)+rr(x+54,base-100,14,90,6,C.brownD)+rr(x-40,base-30,80,14,6,C.brownD)+shadow(x,442,150,14);
    case 'zoo': return wall(C.greenD,230,120)+`<g>`+[...Array(9)].map((_,i)=>ln(`M${x-115+i*28} ${base-120} l0 -60`,C.gray,5)).join('')+`</g>`+ln(`M${x-115} ${base-180} l230 0`,C.gray,5)+cir(x-40,base-90,26,C.orange)+face(x-40,base-96,0.6)+shadow(x,442,130,14);
    case 'garden': return pth(`M${x-150} ${base} q150 -30 300 0 Z`,C.leaf,'noline')+[ -90,-40,10,60 ].map((dx,i)=>ln(`M${x+dx} ${base-20} l0 -60`,C.greenD,6)+cir(x+dx,base-90,20,[C.red,C.gold,C.rose,C.purple][i])+cir(x+dx,base-90,8,C.goldL)).join('')+cir(x+100,base-120,8,C.goldL)+shadow(x,442,150,14);
    case 'farm': return pth(`M${x-150} ${base} q150 -40 300 0 Z`,C.green,'noline')+wall(C.red,150,90,base-90)+pth(`M${x-80} ${base-90} l80 -50 l80 50 Z`,C.brownD)+rr(x-30,base-40,40,60,4,C.brownD)+ln(`M${x+90} ${base} l0 -120`,C.brownD,8)+pth(`M${x+90} ${base-120} q30 -30 0 -60`,C.brownD,8)+shadow(x,442,150,14);
    case 'beach': return rr(x-160,base-40,320,130,0,C.blue)+rr(x-160,base-40,320,30,0,C.cyan)+pth(`M${x-160} ${base+10} q160 -60 320 0 l0 90 l-320 0 Z`,C.goldL,'noline')+cir(x+70,base-150,34,C.gold)+cir(x-90,base-40,10,C.white)+cir(x-50,base-60,7,C.white)+shadow(0,999,0,0);
    case 'sea': return rr(x-160,base-140,320,230,0,C.blue)+rr(x-160,base-140,320,40,0,C.cyan)+[0,1,2].map(i=>ln(`M${x-140} ${base-90+i*60} q20 -16 40 0 t40 0 t40 0 t40 0 t40 0 t40 0`,C.white,5,'opacity=".7"')).join('')+cir(x+80,base-190,28,C.gold);
    case 'river': return pth(`M${x-60} ${base-160} q-40 80 20 160 l60 0 q-60 -90 20 -160 Z`,C.blue,'noline')+rr(x-160,base-20,320,90,0,C.green)+cir(x-90,base-120,40,C.green)+cir(x+90,base-110,34,C.leaf)+shadow(0,999,0,0);
    case 'mountain': return pth(`M${x-160} ${base} l110 -220 l90 150 l60 -90 l80 160 Z`,C.grayD)+pth(`M${x-50} ${base-220} l40 66 l-80 0 Z`,C.white)+pth(`M${x+140} ${base} l40 -70 l60 70 Z`,C.gray)+cir(x+120,base-260,26,C.gold)+shadow(0,999,0,0);
    case 'desert': return pth(`M${x-160} ${base} q160 -80 320 0 Z`,C.goldL,'noline')+pth(`M${x-160} ${base-20} q160 -70 320 0 Z`,C.gold,'noline')+cir(x-90,base-150,40,C.gold)+pth(`M${x+40} ${base-20} l60 -140 l60 140 Z`,C.goldL)+ln(`M${x+100} ${base-20} l0 -140`,C.goldD,3)+shadow(0,999,0,0);
    case 'jungle': return rr(x-160,base-20,320,90,0,C.greenD)+cir(x-90,base-120,64,C.green)+cir(x-30,base-160,54,C.leaf)+cir(x+70,base-110,58,C.green)+ln(`M${x-60} ${base-20} q-20 -140 -60 -180`,C.brownD,14)+ln(`M${x+40} ${base-20} q10 -120 60 -170`,C.brownD,14)+shadow(0,999,0,0);
    case 'playground': return pth(`M${x-150} ${base} q150 -30 300 0 Z`,C.goldL,'noline')+ln(`M${x-70} ${base-10} l0 -150`,C.gray,10)+ln(`M${x+70} ${base-10} l0 -150`,C.gray,10)+ln(`M${x-70} ${base-160} l140 0`,C.gray,10)+ln(`M${x-30} ${base-160} l0 80`,C.grayD,8)+cir(x-30,base-60,18,C.grayD)+pth(`M${x+40} ${base-10} l40 -110 l40 110 Z`,C.red)+ln(`M${x+80} ${base-120} l60 0`,C.red,8)+shadow(0,999,0,0);
    case 'sky': return rr(x-160,base-260,320,300,0,'#bae6fd')+cir(x+70,base-150,40,C.gold)+[ [ -60,base-190,60],[20,base-160,44],[100,base-200,36] ].map(([dx,wy,r])=>cir(x+dx,wy,r,C.white)+cir(x+dx-r,wy+8,r*0.7,C.white)+cir(x+dx+r,wy+8,r*0.7,C.white)).join('')+pth(`M${x-160} ${base} q160 -60 320 0 Z`,C.green,'noline');
    case 'pyramid': return pth(`M${x-40} ${base} l92 -186 l92 186 Z`,C.goldL)+pth(`M${x-40} ${base} l92 -186 l-32 186 Z`,C.gold)+pth(`M${x-146} ${base} l52 -116 l52 116 Z`,C.gold)+cir(x+96,base-262,26,C.gold)+ln(`M${x-150} ${base} q150 -22 300 0`,C.goldL,6)+shadow(0,999,0,0);
    default: return wall(C.cream,220,150)+pth(`M${x-130} ${base-150} l130 -80 l130 80 Z`,C.red)+win(x-60,base-120)+win(x+60,base-120)+door(base-90,90)+shadow(x,442,130,14);
  }
}

/* ---- people / roles ---- */
function person(k){
  const x=256, y=326;
  const girlish=['teacher','nurse','mother','sister','grandmother','guide','tourist'].includes(k);
  let g = girlish? girl({x,y,hijab:(k==='grandmother'||k==='mother')?C.gray:(k==='nurse'?C.white:C.rose)}) : boy({x,y});
  const cap=(f)=>pth(`M${x-52} ${y-70} q52 -46 104 0 q-6 -30 -52 -30 q-46 0 -52 30 Z`,f)+pth(`M${x-54} ${y-70} q54 -18 108 0`,C.gold,'stroke="'+C.gold+'" stroke-width="7"');
  let acc='';
  switch(k){
    case 'doctor': acc=rr(x-56,y-16,112,84,12,C.white,'opacity=".94"')+ln(`M${x-26} ${y+6} q0 42 26 42 q26 0 26 -42`,C.grayD,8)+cir(x,y+48,12,C.grayD)+rr(x+24,y-108,12,40,3,C.red)+rr(x+10,y-94,40,12,3,C.red); break;
    case 'nurse': acc=rr(x-56,y-16,112,84,12,C.white,'opacity=".94"')+rr(x+24,y-108,12,40,3,C.red)+rr(x+10,y-94,40,12,3,C.red); break;
    case 'policeman': acc=cap(C.blueD)+rr(x-56,y-16,112,84,12,C.navy,'opacity=".9"')+cir(x-26,y+12,10,C.gold)+ln(`M${x+16} ${y+44} l24 0`,C.white,6); break;
    case 'farmer': acc=ell(x,y-82,76,16,C.gold)+rr(x-42,y-110,84,32,8,C.gold)+rr(x-56,y-16,112,84,12,C.blue,'opacity=".85"'); break;
    case 'baker': acc=ell(x,y-88,62,18,C.white)+rr(x-42,y-122,84,38,10,C.white)+rr(x-56,y-16,112,74,12,C.white,'opacity=".9"')+ln(`M${x-20} ${y+16} l40 0`,C.rose,8); break;
    case 'engineer': acc=ell(x,y-84,62,20,C.gold)+rr(x-46,y-114,92,34,8,C.gold)+ln(`M${x-30} ${y-34} l0 -34`,C.grayD,8)+cir(x-30,y-82,14,C.grayD)+cir(x-30,y-82,6,C.white); break;
    case 'pilot': acc=cap(C.navy)+pth(`M${x-72} ${y+6} q-22 32 0 64`,C.white,10)+pth(`M${x+72} ${y+6} q22 32 0 64`,C.white,10); break;
    case 'tourist': acc=ell(x,y-82,72,16,C.paper)+rr(x-38,y-108,76,28,10,C.paper)+rr(x+44,y+16,54,42,8,C.ink)+cir(x+71,y+37,14,C.blueL); break;
    case 'guide': acc=rr(x-58,y-16,116,84,12,C.orange,'opacity=".85"')+ln(`M${x+74} ${y-46} l0 140`,C.brownD,6)+pth(`M${x+74} ${y-46} l54 15 l-54 15 Z`,C.red); break;
    case 'grandfather': acc=cap(C.grayD)+pth(`M${x-22} ${y-6} q22 44 44 0`,C.white,16); break;
    case 'father': acc=cap(C.teal); break;
    case 'brother': acc=''; break;
    case 'friend': acc=''; break;
    case 'friends': g=boy({x:x-56,y})+girl({x:x+56,y}); break;
    case 'group': g=boy({x:x-80,y:y+18,s:0.78})+girl({x:x+80,y:y+18,s:0.78})+boy({x:x,y:y-28,s:0.9}); break;
    case 'girl': g=girl({x,y}); break;
    case 'men': g=boy({x:x-70,y})+boy({x:x+70,y}); break;
    case 'student': acc=rr(x+42,y+40,110,82,8,C.white)+ln(`M${x+97} ${y+40} l0 82`,C.gray,4)+rr(x+54,y+58,60,8,3,C.blue)+rr(x+54,y+74,44,8,3,C.red); break;
  }
  return grp(g+acc);
}

/* ---- body parts (isolated, highlighted) ---- */
function part(k){
  const x=256,y=288;
  switch(k){
    case 'hair': return cir(x,y+30,96,C.skin)+pth(`M${x-96} ${y+24} q0 -120 96 -120 q96 0 96 120 q-32 -54 -96 -54 q-64 0 -96 54 Z`,C.ink)+ln(`M${x-40} ${y-40} q40 30 80 0`,C.ink,5)+shadow(x,442,90,14);
    case 'face': return cir(x,y,100,C.skin)+cir(x-34,y-8,11,C.ink)+cir(x+34,y-8,11,C.ink)+cir(x-37,y-11,4,C.white)+cir(x+31,y-11,4,C.white)+ln(`M${x-28} ${y+36} q28 26 56 0`,C.ink,7)+cir(x-56,y+16,10,C.pink,'opacity=".5"')+cir(x+56,y+16,10,C.pink,'opacity=".5"')+shadow(x,442,96,14);
    case 'eyes': return cir(x-62,y-6,50,C.white)+cir(x+62,y-6,50,C.white)+cir(x-62,y-6,26,C.brownD)+cir(x+62,y-6,26,C.brownD)+cir(x-62,y-6,11,C.ink)+cir(x+62,y-6,11,C.ink)+cir(x-68,y-14,6,C.white)+cir(x+56,y-14,6,C.white)+ln(`M${x-110} ${y-58} q48 -18 96 0`,C.ink,7)+ln(`M${x+14} ${y-58} q48 -18 96 0`,C.ink,7)+shadow(x,442,120,14);
    case 'ears': return cir(x-82,y,58,C.skin)+cir(x+82,y,58,C.skin)+pth(`M${x-82} ${y-30} q30 0 26 40 q-30 6 -26 -40 Z`,C.skinD)+pth(`M${x+82} ${y-30} q-30 0 -26 40 q30 6 26 -40 Z`,C.skinD)+cir(x-82,y-6,20,C.gold+'')+shadow(x,442,120,14);
    case 'nose': return ell(x,y,54,84,C.skin)+cir(x-24,y+40,12,C.skinD)+cir(x+24,y+40,12,C.skinD)+pth(`M${x-40} ${y-40} q40 26 0 60`,C.skinD,'opacity=".4"')+shadow(x,442,70,14);
    case 'mouth': return pth(`M${x-96} ${y} q96 -70 192 0 q-96 70 -192 0 Z`,C.rose)+pth(`M${x-96} ${y} q96 70 192 0 q-96 30 -192 0 Z`,C.red)+ln(`M${x-96} ${y} q96 -8 192 0`,C.redD,4)+shadow(x,442,110,14);
    case 'teeth': return pth(`M${x-92} ${y-30} q92 -60 184 0 q-92 100 -184 0 Z`,C.redD)+`<g>`+[...Array(6)].map((_,i)=>rr(x-72+i*24,y-34,22,44,4,C.white)).join('')+`</g>`+rr(x-16,y+16,32,26,6,C.rose)+shadow(x,442,110,14);
    case 'head': return cir(x,y,104,C.skin)+pth(`M${x-104} ${y-6} q0 -130 104 -130 q104 0 104 130 q-34 -60 -104 -60 q-70 0 -104 60 Z`,C.ink)+ln(`M${x-40} ${y-40} q40 30 80 0`,C.ink,5)+ln(`M${x-30} ${y+40} q30 22 60 0`,C.ink,5)+shadow(x,442,110,14);
    case 'tongue': return pth(`M${x-96} ${y-16} q96 -56 192 0 q-96 96 -192 0 Z`,C.redD)+pth(`M${x-60} ${y+6} q60 -30 120 0 q-60 78 -120 0 Z`,C.pink)+ln(`M${x-96} ${y-16} q96 -10 192 0`,C.redD,4)+shadow(x,442,110,14);
    case 'arm': case 'arms': return ln(`M${x-70} ${y-70} q-30 70 0 150`,C.skin,44)+cir(x-70,y+80,24,C.skin)+ln(`M${x-70} ${y-70} q30 -20 20 30`,C.skin,40)+shadow(x,442,110,14);
    case 'hand': case 'hands': return cir(x,y,58,C.skin)+[ -40,-14,14,40 ].map(dx=>rr(x+dx-11,y-118,22,60,11,C.skin)).join('')+rr(x-46,y-84,16,44,8,C.skin)+ln(`M${x-30} ${y+10} q30 20 60 0`,C.skinD,5)+shadow(x,442,90,14);
    case 'leg': case 'legs': return rr(x-56,y-70,52,180,22,C.skin)+rr(x+8,y-70,52,180,22,C.skin)+rr(x-60,y+90,58,26,12,C.ink)+rr(x+4,y+90,58,26,12,C.ink)+shadow(x,442,110,14);
    case 'foot': case 'feet': return pth(`M${x-100} ${y+20} q10 -50 50 -50 l30 0 q40 0 40 40 l0 20 q-70 24 -120 -10 Z`,C.skin)+rr(x-100,y+40,120,20,10,C.ink)+pth(`M${x+40} ${y-20} q60 -10 60 40 l0 30 q-50 10 -60 -40 Z`,C.skin)+rr(x+40,y+50,60,18,9,C.ink)+shadow(x,442,130,14);
    case 'toe': return pth(`M${x-90} ${y+10} q10 -50 50 -50 l30 0 q40 0 40 40 l0 20 q-70 24 -120 -10 Z`,C.skin)+[ -80,-50,-22,6 ].map((dx,i)=>cir(x+dx,y-30+(i?6:0),16,C.skinD)).join('')+rr(x-90,y+30,120,20,10,C.ink)+shadow(x,442,130,14);
  }
  return splat(C.skin);
}

/* ---- shapes/colors/numbers ---- */
function shapeOf(k){
  const x=256,y=292;
  if(k==='circle') return cir(x,y,110,C.purple)+cir(x-36,y-36,26,'#ffffff44')+shadow(x,442,110,14);
  if(k==='square') return rr(x-104,y-104,208,208,18,C.blue)+rr(x-72,y-72,60,60,10,'#ffffff44')+shadow(x,442,120,14);
  if(k==='triangle') return pth(`M${x} ${y-118} L${x+120} ${y+108} L${x-120} ${y+108} Z`,C.gold)+pth(`M${x} ${y-60} L${x+56} ${y+60} L${x-56} ${y+60} Z`,'#ffffff44')+shadow(x,442,130,14);
  if(k==='rectangle') return rr(x-124,y-82,248,164,16,C.green)+rr(x-92,y-52,80,50,10,'#ffffff44')+shadow(x,442,140,14);
  return splat(C.purple);
}
function splat(f){
  const x=256,y=292;
  return cir(x,y,88,f)+pth(`M${x} ${y-134} q62 12 80 62 q-72 10 -80 72 q-8 -62 -80 -72 q18 -50 80 -62 Z`,f)+cir(x-96,y+40,22,f)+cir(x+100,y-30,18,f)+cir(x-44,y-108,15,f)+ell(x-38,y-40,22,13,'#ffffff66')+shadow(x,442,96,14);
}
function numeral(n){
  const x=256,y=300;
  let g=rr(x-100,y-104,200,200,46,C.paper)+rr(x-100,y-104,200,22,46,C.gold);
  g+='<text x="'+x+'" y="'+(y+50)+'" font-family="Arial,Helvetica,sans-serif" font-size="150" font-weight="900" fill="'+C.purpleD+'" text-anchor="middle">'+n+'</text>';
  for(let i=0;i<n;i++){ const c=i%5, r=Math.floor(i/5); g+=cir(x-64+c*32,y+120+r*30,11,C.blueD); }
  return g+shadow(x,442,110,14);
}

/* ---- calendar / time ---- */
function calGlyph(kind,cx,cy){
  if(kind==='night') return pth(`M${cx+18} ${cy-34} a36 36 0 1 0 0 68 a28 28 0 1 1 0 -68 Z`,C.goldL);
  if(kind==='week') return cir(cx,cy,32,C.gold)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return ln(`M${cx+Math.cos(a)*42} ${cy+Math.sin(a)*42} l${Math.cos(a)*16} ${Math.sin(a)*16}`,C.gold,7)}).join('');
  if(kind==='clock') return cir(cx,cy,58,C.white)+cir(cx,cy,58,'none','stroke="'+C.navy+'" stroke-width="7"')+ln(`M${cx} ${cy} l0 -34`,C.navy,6)+ln(`M${cx} ${cy} l26 18`,C.navy,6)+cir(cx,cy,6,C.navy);
  return '';
}
function cal(k,kind){
  const x=256,y=300;
  const hue=(kind==='month')?C.purpleD:(kind==='night'?'#0f1035':C.blueD);
  const abbr=(k||'').slice(0,2).toUpperCase();
  let glyph, band='';
  if(kind==='week') glyph=calGlyph('week',x,y+18);
  else if(k==='night'||kind==='night') glyph=calGlyph('night',x,y+18);
  else if(kind==='month'){ glyph='<text x="'+x+'" y="'+(y+44)+'" font-family="Arial,Helvetica,sans-serif" font-size="96" font-weight="900" fill="'+C.purpleD+'" text-anchor="middle">'+abbr+'</text>'; band='<text x="'+x+'" y="'+(y-58)+'" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="800" fill="#ffffff" text-anchor="middle">'+abbr+'</text>'; }
  else glyph=calGlyph('clock',x,y+18);
  const g=rr(x-104,y-96,208,208,20,C.white)+rr(x-104,y-96,208,52,20,hue)+rr(x-104,y-46,208,10,0,hue)+
    rr(x-70,y-118,16,36,8,C.grayD)+rr(x+54,y-118,16,36,8,C.grayD)+glyph+band;
  return g+shadow(x,442,110,14);
}

/* ---- emotions ---- */
function bust(x,y,mood){
  let g=cir(x,y,58,C.skin)+pth(`M${x-60} ${y-4} q0 -78 60 -78 q60 0 60 78 q-14 -44 -60 -44 q-46 0 -60 44 Z`,C.ink);
  if(mood==='wide'){ g+=cir(x-18,y-2,14,C.white)+cir(x+18,y-2,14,C.white)+cir(x-18,y-2,7,C.ink)+cir(x+18,y-2,7,C.ink)+cir(x,y+22,10,'#7f1d1d'); }
  else if(mood==='angry'){ g+=ln(`M${x-30} ${y-26} l24 10`,C.ink,5)+ln(`M${x+30} ${y-26} l-24 10`,C.ink,5)+cir(x-16,y+2,6,C.ink)+cir(x+16,y+2,6,C.ink)+ln(`M${x-16} ${y+26} q16 -14 32 0`,C.ink,5); }
  else if(mood==='sad'){ g+=ln(`M${x-30} ${y-22} l24 10`,C.ink,5)+ln(`M${x+30} ${y-22} l-24 10`,C.ink,5)+cir(x-16,y+2,6,C.ink)+cir(x+16,y+2,6,C.ink)+ln(`M${x-16} ${y+28} q16 -14 32 0`,C.ink,5); }
  else g+=face(x,y,0.98);
  return g;
}
function emo(k){
  const x=256,y=250; let g=bust(x,y);
  const mood = ({scared:'wide',surprised:'wide',angry:'angry',tired:'sad',sad:'sad'})[k];
  if(mood) g=bust(x,y,mood);
  if(k==='sad') g+=pth(`M${x-18} ${y+16} q-6 22 -14 30 q14 4 18 -12 Z`,C.blue)+'' ;
  if(k==='happy') g+=cir(x+66,y-56,8,C.goldL)+cir(x-70,y-40,6,C.goldL)+cir(x+52,y+40,6,C.goldL);
  if(k==='tired') g+='<text x="'+(x+78)+'" y="'+(y-40)+'" font-family="Arial" font-size="34" font-weight="900" fill="'+C.navy+'">z</text><text x="'+(x+96)+'" y="'+(y-66)+'" font-family="Arial" font-size="26" font-weight="900" fill="'+C.blueD+'">z</text>';
  if(k==='angry') g+=pth(`M${x-72} ${y-70} q20 -20 40 -6`,C.red,5)+pth(`M${x+72} ${y-70} q-20 -20 -40 -6`,C.red,5);
  if(k==='surprised') g+=rr(x-4,y-112,8,30,3,C.gold)+cir(x,y-66,7,C.gold);
  if(k==='scared') g+=pth(`M${x-84} ${y-10} q-10 -30 -40 -30`,C.blue,6)+pth(`M${x+84} ${y-10} q10 -30 40 -30`,C.blue,6);
  if(k==='brave') g+=pth(`M${x-70} ${y+30} q-30 40 -10 90 l30 -20 Z`,C.red)+pth(`M${x+70} ${y+30} q30 40 10 90 l-30 -20 Z`,C.red);
  if(k==='helpful') g+=cir(x+86,y+20,20,C.rose)+cir(x-86,y+20,20,C.rose);
  if(k==='beautiful') g+=cir(x+80,y-60,14,C.rose)+cir(x+104,y-40,8,C.goldL)+cir(x-86,y-30,10,C.pink);
  if(k==='friendly') g+=ln(`M${x+70} ${y+30} q40 -10 40 -60`,C.skin,18)+cir(x+110,y-40,13,C.skin);
  if(k==='wonderful') g+=cir(x-88,y-56,10,C.goldL)+cir(x+90,y-70,8,C.goldL)+cir(x+70,y+50,7,C.goldL);
  if(k==='delicious') g+=cir(x-84,y+40,30,C.gold)+ln(`M${x-84} ${y+40} q30 -30 60 0`,C.goldD,4)+pth(`M${x-8} ${y+30} q16 30 0 40 q-16 -10 0 -40 Z`,C.pink);
  if(k==='interesting') g+=rr(x-96,y+16,60,80,6,C.blueD)+rr(x-88,y+26,44,8,3,C.white)+rr(x-88,y+42,44,8,3,C.white)+cir(x-84,y+6,8,C.goldL);
  if(k==='easy') g+=pth(`M${x+52} ${y+10} l26 30 l54 -70`,C.green,16);
  if(k==='difficult') g+=rr(x-96,y+10,50,50,8,C.blueD)+rr(x-42,y+10,50,50,8,C.gold);
  if(k==='famous') g+=pth(`M${x-70} ${y+40} l-10 70 l50 -30 Z`,C.red)+pth(`M${x+70} ${y+40} l10 70 l-50 -30 Z`,C.red);
  if(k==='important') g+=cir(x-90,y+30,26,C.gold)+pth(`M${x-90} ${y+6} l-10 -34 l40 0 l-10 34 Z`,C.red);
  if(k==='big'){ g+=cir(x-84,y+40,60,C.blue); g+=cir(x+66,y+56,26,C.red); }
  if(k==='small'){ g+=cir(x-70,y+44,26,C.red); g+=cir(x+66,y+40,60,C.blue); }
  if(k==='warm') return g+cir(x-88,y-70,34,C.gold)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return ln(`M${x-88+Math.cos(a)*44} ${y-70+Math.sin(a)*44} l${Math.cos(a)*14} ${Math.sin(a)*14}`,C.gold,6)}).join('')+shadow(x,442,110,14);
  if(k==='cold') return bust(x,y,'wide')+ln(`M${x+80} ${y-30} l0 70 M${x+50} ${y+5} l60 0`,C.blue,6)+cir(x-90,y-10,8,C.white)+cir(x-70,y+20,6,C.white)+shadow(x,442,110,14);
  if(k==='hot') return bust(x,y,'wide')+cir(x+82,y-70,30,C.gold)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return ln(`M${x+82+Math.cos(a)*40} ${y-70+Math.sin(a)*40} l${Math.cos(a)*12} ${Math.sin(a)*12}`,C.gold,6)}).join('')+cir(x-88,y+40,10,C.red)+cir(x-64,y+62,7,C.red)+shadow(x,442,120,14);
  return grp(g)+shadow(x,442,120,14);
}

/* ---- actions ---- */
function act(k){
  const x=238,y=300;
  const kid=(o)=>boy(Object.assign({x,y,s:0.82},o||{}));
  const arc=(cx,cy)=>ln(`M${cx-50} ${cy} q50 -34 100 0`,C.gold,5,'opacity=".7"')+ln(`M${cx-34} ${cy+22} q34 -22 68 0`,C.gold,5,'opacity=".5"');
  const ball=(cx,cy)=>cir(cx,cy,24,C.white)+cir(cx,cy,24,'none','stroke="'+C.gray+'" stroke-width="4"')+cir(cx-6,cy-6,6,C.ink);
  switch(k){
    case 'walk': return kid()+arc(x+30,y+130);
    case 'run': return kid()+arc(x+30,y+130)+ln(`M${x+50} ${y+80} l50 -30`,C.white,6,'opacity=".6"');
    case 'jump': return kid({y:y-40})+arc(x+20,y+180)+arc(x+20,y+210);
    case 'skip': return kid()+ln(`M${x-20} ${y+120} q60 30 120 0`,C.rose,8)+arc(x+40,y+160);
    case 'play': return kid()+ball(x+110,y+150)+arc(x+30,y+130);
    case 'kick': return kid()+ball(x+120,y+180)+ln(`M${x+40} ${y+120} l60 40`,C.white,7,'opacity=".7"');
    case 'throw': return kid()+ball(x+130,y+30)+ln(`M${x+40} ${y+40} l60 -40`,C.white,7,'opacity=".7"');
    case 'catch': return kid({o:1})+ball(x+40,y+130)+ln(`M${x-10} ${y+30} q20 -20 40 0`,C.white,6);
    case 'swim': return rr(x-150,y+120,300,70,0,'transparent')+[0,1].map(i=>ln(`M${x-140} ${y+130+i*34} q20 -18 40 0 t40 0 t40 0 t40 0 t40 0 t40 0`,C.cyan,7)).join('')+cir(x,y+70,42,C.skin)+pth(`M${x-44} ${y+62} q0 -58 44 -58 q44 0 44 58 q-10 -34 -44 -34 q-34 0 -44 34 Z`,C.rose)+face(x,y+78,0.8)+ln(`M${x+50} ${y+90} q40 -20 60 10`,C.skin,16);
    case 'dig': return rr(x-150,y+120,300,90,0,C.brown)+ln(`M${x+60} ${y-20} l0 130`,C.grayD,10)+pth(`M${x+60} ${y+110} l-30 30 l60 0 Z`,C.gray)+kid()+arr0();
    case 'read': return kid()+rr(x+70,y+70,120,80,8,C.white)+ln(`M${x+130} ${y+70} l0 80`,C.gray,4)+rr(x+84,y+82,36,10,3,C.gray)+rr(x+84,y+98,36,10,3,C.gray)+rr(x+138,y+82,36,10,3,C.gray)+rr(x+138,y+98,36,10,3,C.gray);
    case 'visit': return kid()+place('home');
    case 'watch': return kid()+rr(x+80,y+60,150,110,12,C.ink)+rr(x+90,y+70,130,90,6,C.blueD)+pth(`M${x+130} ${y+100} l60 -20 l0 60 Z`,C.white,'opacity=".8"');
    case 'share': return boy({x:x-80,y,s:0.78})+girl({x:x+80,y,s:0.78})+cir(x,y+40,26,C.rose)+cir(x-9,y+34,6,C.rose)+cir(x+9,y+34,6,C.rose)+pth(`M${x} ${y+66} l18 -20 l-36 0 Z`,C.rose);
    case 'shakehands': return boy({x:x-80,y,s:0.78})+girl({x:x+80,y,s:0.78})+ln(`M${x-40} ${y+70} q40 -20 80 0`,C.skin,20);
    case 'getup': return cir(x-110,y-60,40,C.gold)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return ln(`M${x-110+Math.cos(a)*50} ${y-60+Math.sin(a)*50} l${Math.cos(a)*14} ${Math.sin(a)*14}`,C.gold,6)}).join('')+kid({y:y-20})+rr(x+60,y+70,120,24,8,C.white)+rr(x+60,y-10,120,90,8,C.blue);
    case 'gotobed': return rr(x+70,y+40,130,120,10,C.brownD)+rr(x+70,y+70,130,20,8,C.white)+rr(x+70,y-10,60,90,10,C.white)+cir(x-90,y-70,26,C.goldL)+kid({x:x-60,y:y+10});
    case 'gotoschool': return kid()+place('school');
    case 'help': return boy({x:x-80,y,s:0.78})+boy({x:x+80,y,s:0.78})+ln(`M${x-30} ${y+90} q30 -40 60 0`,C.skin,16)+cir(x,y+30,20,C.rose);
    case 'hit': return kid()+ball(x+130,y+40)+ln(`M${x+30} ${y-10} l40 -70`,C.gold,12);
    case 'hop': return kid({y:y-30})+arc(x+20,y+170)+arc(x+20,y+200);
    case 'eat': return kid()+place0()+ell(x+90,y+170,110,26,C.white)+cir(x+90,y+140,24,C.gold)+cir(x+50,y+150,16,C.red)+cir(x+130,y+150,16,C.green);
    case 'drink': return kid()+pth(`M${x+60} ${y+110} l8 90 q2 14 16 14 l40 0 q14 0 16 -14 l8 -90 Z`,C.white)+ell(x+96,y+110,46,14,C.cyan)+cir(x+96,y+140,20,C.blue,'opacity=".4"');
    case 'sleep': return rr(x-40,y+60,260,50,10,C.brownD)+cir(x-20,y+20,44,C.skin)+pth(`M${x-66} ${y+16} q0 -60 46 -60 q46 0 46 60 q-12 -34 -46 -34 q-34 0 -46 34 Z`,C.rose)+face(x-20,y+30,0.7)+'<text x="'+(x+60)+'" y="'+(y-20)+'" font-family="Arial" font-size="40" font-weight="900" fill="'+C.navy+'">z</text><text x="'+(x+90)+'" y="'+(y-56)+'" font-family="Arial" font-size="30" font-weight="900" fill="'+C.blueD+'">z</text>';
  }
  return kid();
}
function arr0(){ return ''; }
function place0(){ return ''; }

/* ---- prepositions ---- */
function prep(k){
  const bx=256, by=350, bw=180, bh=86;
  const boxBack=rr(bx-bw/2,by-bh/2,bw,bh,12,C.gold);
  const boxFront=rr(bx-bw/2,by-bh/2,bw,26,8,C.goldD);
  const ball=(cx,cy)=>cir(cx,cy,26,C.red)+pth(`M${cx-26} ${cy} q26 -26 52 0 q-26 8 -52 0 Z`,C.white);
  const openBox=boxBack+cir(bx,by+6,0,'transparent')+boxFront;
  if(k==='in') return boxBack+ball(bx,by-6)+rr(bx-bw/2,by-bh/2+2,bw,22,8,C.goldD)+ln(`M${bx-bw/2} ${by-bh/2+2} l${bw} 0`,C.goldL,4)+shadow(0,999,0,0);
  if(k==='on') return boxBack+ball(bx,by-bh/2-24)+boxFront+shadow(0,999,0,0);
  if(k==='under') return boxBack+boxFront+ball(bx,by+bh/2+24)+shadow(0,999,0,0);
  if(k==='before') return cir(bx-110,by,26,C.red)+ln(`M${bx-60} ${by} l70 0`,C.grayD,6)+arrTip(bx+10,by)+boxBack+boxFront+shadow(0,999,0,0);
  if(k==='after') return boxBack+boxFront+ln(`M${bx+96} ${by} l70 0`,C.grayD,6)+arrTip(bx+166,by)+cir(bx+166,by,0,'transparent')+ball(bx+230,by)+shadow(0,999,0,0);
  return cir(bx,by,26,C.red)+shadow(0,999,0,0);
}
function arrTip(cx,cy){ return pth(`M${cx} ${cy} l-20 -12 l0 24 Z`,C.grayD); }

/* ---- weather & seasons ---- */
function skyArt(k){
  const x=256,y=290;
  const sun=(cx,cy)=>cir(cx,cy,44,C.gold)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return ln(`M${cx+Math.cos(a)*56} ${cy+Math.sin(a)*56} l${Math.cos(a)*18} ${Math.sin(a)*18}`,C.gold,8)}).join('');
  const cloud=(cx,cy)=>cir(cx,cy,40,C.white)+cir(cx-44,cy+10,30,C.white)+cir(cx+44,cy+10,30,C.white)+rr(cx-66,cy+8,132,34,16,C.white);
  const drop=(cx,cy)=>pth(`M${cx} ${cy} q14 20 0 30 q-14 -10 0 -30 Z`,C.blue);
  if(k==='sunny'||k==='summer') return sun(x,y-20)+shadow(x,442,110,14)+(k==='summer'?pth(`M${x-150} 430 q150 -40 300 0 Z`,C.green,'noline'):'');
  if(k==='rainy'||k==='rain') return cloud(x,y-40)+drop(x-50,y+40)+drop(x,y+40)+drop(x+50,y+40)+shadow(x,442,110,14);
  if(k==='cloudy') return cloud(x-30,y-60)+cloud(x+60,y+10)+shadow(x,442,110,14);
  if(k==='windy'||k==='wind') return ln(`M${x-130} ${y-40} q90 -30 180 0`,C.blueL,12)+ln(`M${x-100} ${y+20} q110 -34 220 0`,C.blueL,12)+ln(`M${x-60} ${y+80} q90 -30 180 0`,C.blueL,12)+cir(x+90,y-70,10,C.goldL);
  if(k==='weather') return sun(x+70,y-60)+cloud(x-40,y+10);
  if(k==='spring') return cir(x-70,y-10,54,C.green)+rr(x-78,y-10,16,120,6,C.brownD)+cir(x+50,y+20,40,C.rose)+cir(x+50,y+20,12,C.goldL)+cir(x+120,y-40,26,C.purple);
  if(k==='fall') return rr(x-6,y-120,14,150,6,C.brownD)+[[-70,-40],[30,-70],[-30,10],[70,-10],[-90,60]].map(([a,b])=>pth(`M${x+a} ${y+b} q18 -20 36 0 q-18 20 -36 0 Z`,C.orange)).join('')+rr(x-90,424,200,20,8,C.brownD);
  if(k==='winter') return rr(x-6,y-120,14,150,6,C.brownD)+[[-70,-30],[20,-60],[-20,20],[70,0],[-90,60]].map(([a,b])=>cir(x+a,y+b,20,C.white)+cir(x+a,y+b,4,C.blueL)).join('')+rr(x-90,424,220,20,8,C.white);
  return cloud(x,y)+shadow(x,442,110,14);
}

/* ---- symbolic (abstract ideas) ---- */
function sym(k){
  const x=256,y=286;
  const bulb=()=>cir(x,y,72,C.gold)+rr(x-26,y+58,52,30,8,C.grayD)+ln(`M${x-16} ${y+96} l32 0`,C.grayD,6)+ln(`M${x-14} ${y+110} l28 0`,C.grayD,6)+ln(`M${x-34} ${y-30} q34 -30 68 0`,C.goldD,6)+cir(x-24,y-8,10,C.goldL);
  const medal=(f)=>ln(`M${x-26} ${y-96} l14 60`,C.blueD,10)+ln(`M${x+26} ${y-96} l-14 60`,C.red,10)+cir(x,y+18,66,f||C.gold)+cir(x,y+18,44,C.goldL)+pth(`M${x} ${y-6} l10 22 l24 3 l-17 17 l4 24 l-21 -11 l-21 11 l4 -24 l-17 -17 l24 -3 Z`,C.goldD);
  const book=(f)=>pth(`M${x-96} ${y-56} q48 -22 96 0 q48 -22 96 0 l0 130 q-48 -22 -96 0 q-48 -22 -96 0 Z`,f||C.blueD)+ln(`M${x} ${y-56} l0 130`,C.white,4)+ln(`M${x-72} ${y-28} q40 -12 60 -2`,C.white,4);
  const globe=()=>cir(x,y,84,C.blue)+pth(`M${x-84} ${y} q84 -40 168 0 q-84 40 -168 0 Z`,'#ffffff55')+ln(`M${x} ${y-84} l0 168`,C.white,4)+ln(`M${x-72} ${y-40} q72 30 144 0`,C.white,4)+ln(`M${x-72} ${y+40} q72 -30 144 0`,C.white,4);
  const gear=(f)=>cir(x,y,60,f||C.grayD)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return rr(x+Math.cos(a)*72-16,y+Math.sin(a)*72-16,32,32,6,f||C.grayD)}).join('')+cir(x,y,24,C.white);
  const handshake=()=>ln(`M${x-60} ${y+20} q60 -40 120 0`,C.skin,30)+cir(x-90,y+10,22,C.skin)+cir(x+90,y+10,22,C.skin)+cir(x,y-30,24,C.rose);
  const chart=()=>rr(x-90,y+30,180,20,6,C.gray)+rr(x-70,y-10,30,40,4,C.blue)+rr(x-20,y-50,30,80,4,C.gold)+rr(x+30,y-90,30,120,4,C.green)+ln(`M${x-100} ${y+50} l200 0`,C.grayD,5);
  const shield=(f)=>pth(`M${x} ${y-90} l84 30 l0 60 q0 76 -84 110 q-84 -34 -84 -110 l0 -60 Z`,f||C.blueD)+pth(`M${x} ${y-58} l56 20 l0 44 q0 52 -56 76 q-56 -24 -56 -76 l0 -44 Z`,C.blueL);
  const scale=()=>ln(`M${x} ${y-80} l0 150`,C.brownD,10)+ln(`M${x-80} ${y-50} l160 0`,C.brownD,10)+pth(`M${x-80} ${y-50} l-34 60 l68 0 Z`,C.gold)+pth(`M${x+80} ${y-50} l-34 60 l68 0 Z`,C.gray)+rr(x-40,y+70,80,14,6,C.brownD);
  const speech=(f)=>rr(x-96,y-70,192,120,20,f||C.white)+pth(`M${x-20} ${y+50} l-10 40 l40 -40 Z`,f||C.white)+rr(x-74,y-44,120,10,5,C.gray)+rr(x-74,y-22,90,10,5,C.gray)+rr(x-74,y+2,140,10,5,C.gray);
  const doc=(f)=>rr(x-76,y-96,152,196,14,C.white)+pth(`M${x+30} ${y-96} l46 46 l-46 0 Z`,C.gray)+rr(x-52,y-30,104,10,5,f||C.blueD)+rr(x-52,y-6,104,10,5,f||C.blueD)+rr(x-52,y+18,70,10,5,C.gold);
  const leaf=(f)=>pth(`M${x} ${y+96} q-96 -40 -80 -140 q96 -10 120 90 q20 40 -40 50 Z`,f||C.green)+ln(`M${x-2} ${y+60} q-40 -60 -70 -90`,C.greenD,6);
  const factory=()=>rr(x-96,y-30,60,140,6,C.grayD)+rr(x-30,y-60,60,170,6,C.gray)+rr(x+36,y-90,60,200,6,C.grayD)+cir(x-70,y-50,26,'#9ca3af')+cir(x-8,y-84,30,'#9ca3af')+cir(x+60,y-116,34,'#9ca3af')+pth(`M${x+10} ${y+60} l18 -70 l16 4 l-12 66 Z`,C.green);
  const thermo=()=>rr(x-24,y-100,48,190,24,C.white)+ell(x,y+96,40,40,C.red)+ln(`M${x} ${y+96} l0 -170`,C.red,18)+ln(`M${x+26} ${y-60} l14 0`,C.grayD,5)+ln(`M${x+26} ${y-20} l14 0`,C.grayD,5)+ln(`M${x+26} ${y+20} l14 0`,C.grayD,5);
  const heart=()=>pth(`M${x} ${y+80} q-120 -70 -90 -140 q30 -50 90 10 q60 -60 90 -10 q30 70 -90 140 Z`,C.rose);
  const lightStar=()=>pth(`M${x} ${y-96} l28 66 l72 8 l-54 48 l16 72 l-62 -36 l-62 36 l16 -72 l-54 -48 l72 -8 Z`,C.gold);
  const clock=()=>cir(x,y,88,C.white)+cir(x,y,88,'none','stroke="'+C.navy+'" stroke-width="10"')+ln(`M${x} ${y} l0 -56`,C.navy,8)+ln(`M${x} ${y} l40 30`,C.navy,8)+cir(x,y,8,C.navy);
  const puzzle=()=>rr(x-80,y-80,72,72,10,C.blue)+rr(x+8,y-80,72,72,10,C.gold)+rr(x-80,y+8,72,72,10,C.green)+rr(x+8,y+8,72,72,10,C.rose);
  const flag=()=>ln(`M${x-40} ${y+100} l0 -190`,C.brownD,10)+pth(`M${x-40} ${y-90} l120 26 l-120 26 Z`,C.red)+cir(x-40,y-110,12,C.gold);
  const arrow=()=>ln(`M${x-100} ${y+20} q40 -80 100 -40 q60 40 100 -20`,C.purple,12)+pth(`M${x+100} ${y-40} l0 56 l-40 -28 Z`,C.purple);
  const route=()=>pth(`M${x-110} ${y+80} q100 -30 60 -90 q-40 -60 60 -70 q60 -6 90 40`,C.blueD,10)+cir(x-110,y+80,16,C.red)+cir(x+100,y-40,16,C.gold);
  const trophy=()=>cir(x,y+30,44,C.gold)+pth(`M${x-44} ${y-10} q-40 0 -20 50 q14 20 30 6`,C.goldD,0)+pth(`M${x+44} ${y-10} q40 0 20 50 q-14 20 -30 6`,C.goldD,0)+rr(x-10,y+64,20,40,4,C.goldD)+rr(x-44,y+96,88,18,6,C.goldD)+cir(x,y+10,16,C.goldL);
  const target=()=>cir(x,y,90,C.red)+cir(x,y,60,C.white)+cir(x,y,30,C.red)+cir(x-4,y-4,8,C.ink)+ln(`M${x} ${y} l96 -60`,C.navy,5)+pth(`M${x+96} ${y-60} l-4 -22 l-22 4 Z`,C.navy);
  const key=()=>cir(x-70,y-6,32,C.gold)+cir(x-70,y-6,12,C.white)+rr(x-40,y-12,120,18,6,C.gold)+rr(x+40,y-12,14,44,4,C.gold)+rr(x+14,y-12,14,34,4,C.gold);
  const gift=()=>rr(x-80,y-20,160,120,10,C.rose)+rr(x-8,y-20,16,120,4,C.gold)+rr(x-80,y-40,160,34,10,C.gold)+pth(`M${x-8} ${y-40} q-40 -50 0 -60 q40 10 0 60 Z`,C.goldL)+pth(`M${x+8} ${y-40} q40 -50 0 -60 q-40 10 0 60 Z`,C.goldL);
  const eye=()=>pth(`M${x-100} ${y} q100 -80 200 0 q-100 80 -200 0 Z`,C.white)+cir(x,y,40,C.blueD)+cir(x,y,18,C.ink)+cir(x-6,y-6,7,C.white);
  const ear=()=>pth(`M${x+20} ${y+80} q-70 0 -70 -90 q0 -80 70 -80 q60 0 60 60 q0 40 -40 46`,C.skin)+pth(`M${x-6} ${y-2} q-20 0 -20 -22 q0 -26 26 -26`,C.skinD,'');
  const nose=()=>pth(`M${x-30} ${y-80} q-30 90 10 128 q20 20 40 6`,C.skinD,26)+cir(x+2,y+40,12,C.ink,'opacity=".3"');
  const tongue=()=>pth(`M${x-80} ${y-30} q80 -50 160 0 q-80 90 -160 0 Z`,C.redD)+pth(`M${x-46} ${y-6} q46 -22 92 0 q-46 62 -92 0 Z`,C.pink);
  const skinTouch=()=>cir(x,y,66,C.skin)+[ -34,-12,10,32 ].map(dx=>rr(x+dx-9,y-108,18,52,9,C.skin)).join('')+cir(x,y,66,'');
  const brain=()=>cir(x-40,y-40,44,C.pink)+cir(x+40,y-40,44,C.rose)+cir(x-40,y+30,44,C.rose)+cir(x+40,y+30,44,C.pink)+cir(x,y,40,C.rose)+ln(`M${x} ${y-70} l0 140`,C.pink,4);
  const scalesSoc=()=>cir(x-60,y,34,C.blue)+cir(x+60,y,34,C.rose)+cir(x,y-50,34,C.gold)+cir(x,y+50,34,C.green);
  const flagGoal=()=>ln(`M${x} ${y+90} l0 -170`,C.grayD,10)+pth(`M${x} ${y-80} l100 24 l-100 24 Z`,C.green);
  switch(k){
    case 'knowledge': case 'education': case 'skill': case 'science': case 'math': case 'class': case 'subject': case 'research': case 'improve': case 'practice': case 'performance': case 'confidence': case 'experience': case 'opinion': case 'reason': case 'result': case 'advice': case 'decision': case 'plan': case 'project': case 'homework': case 'message': case 'email': case 'internet': return bulb();
    case 'achievement': case 'success': case 'ambition': case 'opportunity': case 'challenge': return medal(k==='success'?C.gold:(k==='ambition'?C.purple:C.gold));
    case 'important': case 'famous': return lightStar();
    case 'culture': case 'social': case 'environment': case 'climate': case 'holiday': case 'travel': case 'journey': case 'adventure': case 'explore': case 'trip': case 'future': return globe();
    case 'technology': case 'computer': case 'camera': case 'inventor': return gear();
    case 'cooperation': case 'responsibility': case 'helpful': case 'encourage': case 'effort': case 'participate': case 'organize': case 'present': case 'discuss': case 'share': return handshake();
    case 'respect': case 'health': case 'brave': return shield();
    case 'argument': case 'compare': return scale();
    case 'english': case 'music': case 'art': case 'culture2': case 'read2': return book(k==='music'?C.purple:(k==='art'?C.rose:C.blueD));
    case 'explain': case 'suggest': return speech(C.paper);
    case 'pollution': return factory();
    case 'temperature': case 'headache': case 'medicine': case 'tooth': return (k==='temperature'?thermo():(k==='medicine'?gift():nose()));
    case 'see': return eye();
    case 'hear': return ear();
    case 'smell': return nose();
    case 'taste': case 'delicious': return tongue();
    case 'touch': return skinTouch();
    case 'culture3': return brain();
    case 'song': return ln(`M${x-18} ${y+64} l0 -150 q46 -14 78 12`,C.purple,16)+ell(x-34,y+70,22,17,C.purple)+ell(x+62,y+50,22,17,C.purple)+ln(`M${x+56} ${y-76} l0 142`,C.purple,16)+cir(x+66,y-92,11,C.goldL)+shadow(x,442,110,14);
    default: return bulb();
  }
}

/* ---- phrase / sentence scenes ---- */
function scene(k){
  const x=256, y=306;
  const bow=(o)=>boy(Object.assign({x,y,s:0.8},o||{}));
  const gir=(o)=>girl(Object.assign({x,y,s:0.8},o||{}));
  const soccer=(cx,cy,r)=>cir(cx,cy,r,C.white)+cir(cx,cy,r,'none','stroke="'+C.gray+'" stroke-width="4"')+pth(`M${cx} ${cy-r*0.4} l${r*0.4} ${r*0.3} l-${r*0.16} ${r*0.5} l-${r*0.48} 0 l-${r*0.16} -${r*0.5} Z`,C.ink)+cir(cx-r*0.7,cy+r*0.5,r*0.22,C.ink)+cir(cx+r*0.7,cy+r*0.5,r*0.22,C.ink);
  const heart=(cx,cy,s)=>pth(`M${cx} ${cy+s} q-${s*1.6} -${s*0.9} -${s*1.2} -${s*1.8} q${s*0.4} -${s*0.66} ${s*1.2} ${s*0.13} q${s*0.8} -${s*0.8} ${s*1.2} -${s*0.13} q${s*0.4} ${s*0.9} -${s*1.2} ${s*1.8} Z`,C.rose);
  const sunAt=(cx,cy,r)=>cir(cx,cy,r,C.gold)+[...Array(8)].map((_,i)=>{const a=i*Math.PI/4;return ln(`M${cx+Math.cos(a)*(r+8)} ${cy+Math.sin(a)*(r+8)} l${Math.cos(a)*16} ${Math.sin(a)*16}`,C.gold,7)}).join('');
  const moonAt=(cx,cy,r)=>pth(`M${cx+r*0.4} ${cy-r} a${r} ${r} 0 1 0 0 ${2*r} a${r*0.82} ${r*0.82} 0 1 1 0 -${2*r} Z`,C.goldL);
  const glass=(cx,cy)=>pth(`M${cx-30} ${cy-40} l6 90 q2 12 14 12 l20 0 q12 0 14 -12 l6 -90 Z`,'#ffffffdd')+ell(cx,cy-40,30,10,C.white)+pth(`M${cx-24} ${cy-20} l4 60 q0 8 10 8 l20 0 q10 0 10 -8 l4 -60 Z`,C.cyan);
  const bubble=(cx,cy,s)=>rr(cx-s,cy-s*0.7,s*2,s*1.4,s*0.4,C.white)+pth(`M${cx+s*0.4} ${cy+s*0.6} l-${s*0.3} ${s*0.8} l${s*0.7} -${s*0.4} Z`,C.white);
  const school=(cx,cy)=>rr(cx-70,cy-40,140,90,8,C.goldL)+pth(`M${cx-80} ${cy-40} l80 -46 l80 46 Z`,C.blueD)+rr(cx-16,cy+4,32,46,4,C.brownD);
  const house=(cx,cy)=>rr(cx-70,cy-30,140,90,8,C.cream)+pth(`M${cx-80} ${cy-30} l80 -50 l80 50 Z`,C.red)+rr(cx-16,cy+10,32,50,4,C.brownD);
  switch(k){
    case 'goodmorning': return sunAt(x-80,y-60,54)+gir({x:x+60,y})+ln(`M${x+40} ${y-90} q40 -40 80 0`,C.skin,16)+cir(x+120,y-108,12,C.skin);
    case 'goodnight': return moonAt(x-80,y-70,54)+girl({x:x+70,y:y+40,s:0.7})+rr(x-40,y+90,240,26,8,C.brownD)+rr(x-30,y+40,120,54,10,C.blue);
    case 'thankyou': return gir({x:x-70,y})+bow({x:x+70,y})+heart(x,y-30,40);
    case 'youarewelcome': return gir({x:x-70,y})+bow({x:x+70,y})+ln(`M${x-30} ${y-90} q30 24 60 0`,C.ink,7);
    case 'iloveyou': return boy({x:x-80,y,s:0.74})+girl({x:x+80,y,s:0.74})+heart(x,y-40,54);
    case 'howareyou': return bow()+bubble(x+96,y-70,52)+'<text x="'+(x+96)+'" y="'+(y-46)+'" font-family="Arial" font-size="60" font-weight="900" fill="'+C.purpleD+'" text-anchor="middle">?</text>';
    case 'iamfine': return bow()+cir(x+96,y+60,40,C.green)+pth(`M${x+78} ${y+60} l14 12 l26 -30`,C.white,8);
    case 'mynameis': return bow()+rr(x+80,y+40,120,80,10,C.white)+rr(x+96,y+60,88,10,5,C.gray)+rr(x+96,y+82,60,10,5,C.gray)+cir(x+90,y+150,12,C.gold);
    case 'excuseme': return bow()+ln(`M${x+40} ${y-40} q-6 -90 40 -110`,C.skin,18)+cir(x+86,y-158,14,C.skin);
    case 'seeyoulater': return bow()+ln(`M${x+40} ${y-40} q40 -60 90 -20`,C.skin,16)+cir(x+134,y-72,13,C.skin)+rr(x+120,y-40,80,180,8,C.brownD)+cir(x+200,y+50,10,C.gold);
    case 'goodluck': return bow()+pth(`M${x+80} ${y-20} q-40 -60 0 -90 q40 30 0 90 Z`,C.green)+pth(`M${x+80} ${y-20} q-60 -30 -80 20 q60 20 80 -20 Z`,C.leaf)+cir(x+80,y-70,10,C.goldL);
    case 'happybirthday': return ART.cake+cir(x-90,y-70,10,C.goldL)+cir(x+90,y-90,8,C.goldL);
    case 'iliketoplayfootball': return bow()+soccer(x+120,y+150,44);
    case 'myfavoritecolorisblue': return bow({x:x-70,y})+cir(x+90,y,60,C.blue)+cir(x+60,y-40,20,C.blueD)+cir(x+120,y+40,16,C.blueD)+cir(x+110,y-50,12,'#ffffff66');
    case 'thesunisverybrighttoday': return sunAt(x,y-20,96)+shadow(x,442,120,14);
    case 'ihavealittlecatathome': return house(x-40,y-10)+cir(x+90,y+90,34,C.gray)+pth(`M${x+70} ${y+66} l-14 -26 l24 8 Z`,C.gray)+pth(`M${x+110} ${y+66} l14 -26 l-24 8 Z`,C.gray)+face(x+90,y+90,0.6);
    case 'canihavesomewaterplease': return bow()+glass(x+110,y+40)+cir(x+110,y+20,10,C.blue,'opacity=".6"');
    case 'mymothermakesadeliciouscake': return girl({x:x-70,y})+ART.cake;
    case 'wegotoschooleverymorning': return boy({x:x-80,y,s:0.72})+girl({x:x+80,y,s:0.72})+school(x,y-90);
    case 'thebirdsingsabeautifulsong': return ART.bird+ln(`M${x+70} ${y-70} q20 -20 40 0`,C.ink,4)+cir(x+90,y-70,7,C.ink)+ln(`M${x+118} ${y-90} l0 -20`,C.purple,5)+cir(x+112,y-116,8,C.purple)+ln(`M${x+146} ${y-70} l0 -20`,C.blue,5)+cir(x+140,y-96,8,C.blue);
    case 'iwanttolearnenglishverywell': return bow()+rr(x+70,y+40,140,110,8,C.white)+ln(`M${x+140} ${y+40} l0 110`,C.gray,4)+rr(x+84,y+60,50,10,4,C.blue)+rr(x+84,y+80,60,10,4,C.red)+rr(x+84,y+100,44,10,4,C.green)+rr(x+150,y+60,44,10,4,C.gold)+cir(x+40,y-30,10,C.goldL)+cir(x+70,y-70,8,C.goldL);
    case 'yesterdayiplayedwithmyfriends': return boy({x:x-90,y,s:0.7})+girl({x:x+90,y,s:0.7})+soccer(x,y+150,40);
    case 'hello': return bow()+ln(`M${x+40} ${y-40} q40 -60 90 -20`,C.skin,16)+cir(x+134,y-72,13,C.skin)+bubble(x-96,y-72,46);
    case 'goodbye': return bow()+ln(`M${x+40} ${y-40} q40 -60 90 -20`,C.skin,16)+cir(x+134,y-72,13,C.skin)+rr(x+120,y-40,70,190,8,C.brownD)+cir(x+190,y+60,9,C.gold);
    case 'pets': return cir(x-92,y+16,46,C.gray)+pth(`M${x-118} ${y-12} l-12 -32 l26 8 Z`,C.gray)+pth(`M${x-66} ${y-12} l12 -32 l-26 8 Z`,C.gray)+face(x-92,y+16,0.7)+cir(x+72,y+44,52,C.brown)+ell(x-24,y-24,44,32,C.cream)+face(x+72,y+40,0.6,{cheeks:false})+cir(x+16,y-52,30,C.cyan)+face(x+16,y-54,0.5)+pth(`M${x+58} ${y-52} l28 -18 l0 36 Z`,C.cyan);
    case 'animals': return cir(x-96,y-56,44,C.orange)+face(x-96,y-62,0.65)+pth(`M${x-130} ${y-92} l-10 -26 l24 8 Z`,C.orange)+pth(`M${x-62} ${y-92} l10 -26 l-24 8 Z`,C.orange)+cir(x+84,y+16,44,C.brown)+face(x+84,y+10,0.65)+ell(x-8,y+92,52,36,C.gray)+cir(x-8,y+68,34,C.gray)+face(x-8,y+66,0.55)+ln(`M${x-44} ${y+112} q36 26 72 0`,C.gray,16);
    case 'family': return boy({x:x-96,y:y+10,s:0.72})+girl({x:x+96,y:y+10,s:0.72,hijab:C.gray})+boy({x:x,y:y-42,s:0.55});
  }
  return boy();
}

/* ============ coverage map: every word -> a renderer ============ */
const KIND={};
const put=(list,t,a)=>list.split(' ').forEach(s=>{KIND[s]=[t,a];});
put('cow horse duck chicken camel sheep frog','beast');
put('turtle snake butterfly elephant giraffe','special');
put('bread rice cheese meat eggs chocolate chips sandwich pizza tea grapes watermelon tomato potato carrot onion cucumber fruits breakfast lunch dinner','food');
put('chair desk pencil eraser crayon board bag cap tshirt dress trousers pants skirt shorts shoes socks tv fridge oven sink toilet couch cup net nut pot log mat','obj');
put('home bedroom livingroom kitchen diningroom bathroom closet classroom school hospital mosque church museum shop station street building park zoo garden farm beach sea river mountain desert jungle sky playground','place');
put('see hear smell taste touch knowledge education skill science math class subject research improve practice performance confidence experience opinion reason result advice decision plan project homework message email internet technology computer camera inventor culture social environment climate pollution holiday travel journey adventure explore trip future temperature headache medicine tooth art music argue compare explain','sym');
put('achievement success ambition opportunity challenge important famous cooperation responsibility helpful encourage effort participate organize present discuss share respect health brave suggestion','sym');
put('boy friends teacher mother father sister brother grandfather grandmother parents group doctor nurse policeman farmer baker engineer pilot tourist guide friend','person');
put('hair face eyes ears nose mouth teeth head tongue arm arms hand hands foot feet leg legs toe','part');
put('circle square triangle rectangle','shape');
put('green blue red yellow black white','splat');
'one two three four five six seven eight nine ten'.split(' ').forEach((s,i)=>KIND[s]=['num',i+1]);
put('sunday monday tuesday wednesday thursday friday saturday','cal','week');
put('today tomorrow yesterday morning noon night evening week','cal','time');
put('january february march april may june july august september october november december','cal','month');
put('happy sad angry tired surprised scared brave helpful beautiful friendly wonderful delicious interesting easy difficult famous important big small warm cold','emo');
put('walk run jump skip kick play throw catch swim dig read visit watch share shakehands getup gotobed gotoschool help hit hop eat drink sleep','act');
put('in on under before after','prep');
put('weather rain wind windy rainy sunny cloudy spring summer fall winter','sky');
put('goodmorning goodnight thankyou youarewelcome howareyou iamfine mynameis iloveyou excuseme seeyoulater goodluck happybirthday iliketoplayfootball myfavoritecolorisblue thesunisverybrighttoday ihavealittlecatathome canihavesomewaterplease mymothermakesadeliciouscake wegotoschooleverymorning thebirdsingsabeautifulsong iwanttolearnenglishverywell yesterdayiplayedwithmyfriends','scene');
KIND['bat']=['special','bat'];
KIND['rat']=['beast'];
put('bed swing slide mower grass truck bus tennis basketball cartoon football','obj');
KIND['pyramid']=['place','pyramid'];
KIND['hot']=['emo','hot'];
KIND['men']=['person','men']; KIND['girl']=['person','girl'];
put('hello goodbye pets animals','scene');
KIND['chairs']=['alias','chair'];
KIND['swimming']=['alias','swim'];
KIND['played']=['alias','play'];
KIND['english']=['sym','english'];
KIND['suggest']=['sym','suggest'];
KIND['argument']=['sym','argument'];
KIND['dad']=['person','father'];
KIND['mom']=['person','mother'];
KIND['family']=['scene','family'];
KIND['student']=['person','student'];
KIND['eye']=['alias','eyes'];
put('pen doll door window','obj');
KIND['song']=['sym','song'];

const COL={green:'#22c55e',blue:'#38bdf8',red:'#ef4444',yellow:'#fbbf24',black:'#1f2937',white:'#ffffff'};
function build(slug){
  const e=KIND[slug]; if(!e) return null;
  const t=e[0], a=e[1];
  switch(t){
    case 'beast': return beast(ANIMA[slug]||{});
    case 'special': return SPECIAL[slug]();
    case 'food': return food(slug);
    case 'obj': return obj(slug);
    case 'place': return place(slug);
    case 'person': return person(slug);
    case 'part': return part(slug);
    case 'shape': return shapeOf(slug);
    case 'splat': return splat(COL[slug]||C.purple);
    case 'num': return numeral(a);
    case 'cal': return cal(slug,a);
    case 'emo': return emo(slug);
    case 'act': return act(slug);
    case 'prep': return prep(slug);
    case 'sky': return skyArt(slug);
    case 'sym': return sym(slug);
    case 'scene': return scene(slug);
    case 'alias': return ART[a]||build(a);
  }
  return null;
}

/* ============ write the whole library ============ */
const ARTX=Object.assign({}, ART);
for(const s of Object.keys(LETTER)) ARTX[s]=ART[LETTER[s]];
const NIGHT2=new Set(['moon','night','goodnight','dream']);
let made2=0; const miss=[];
const fullIndex={};
for(const w of W){
  const slug=w.slug;
  let inner=(ARTX[slug]!==undefined)?ARTX[slug]:build(slug);
  if(inner==null){ miss.push(slug); inner=ARTX['star']||ART.star; }
  const night=NIGHT2.has(slug);
  fs.writeFileSync(path.join(OUT, slug+'.svg'), card(inner, {night, floor:night?'#1e1b4b':'#e9d5ff'}));
  fullIndex[slug]={en:w.en, ar:w.ar, emoji:w.emoji||'', src:'img/art/'+slug+'.svg'};
  made2++;
}
const EXTRA=[
  ['dad','Dad','أب','👨'],['mom','Mom','أم','👩'],['family','Family','عائلة','👨‍👩‍👧'],
  ['pen','Pen','قلم','🖊️'],['doll','Doll','دمية','🪆'],['song','Song','أغنية','🎵'],
  ['student','Student','طالب','🧑‍🎓'],['door','Door','باب','🚪'],['window','Window','نافذة','🪟'],['eye','Eye','عين','👁️'],
  ['goat','Goat','عنزة','🐐'],['ice','Ice','ثلج','🧊'],['kite','Kite','طائرة ورقية','🪁'],['nest','Nest','عش','🪺'],
  ['queen','Queen','ملكة','👑'],['umbrella','Umbrella','مظلة','☂️'],['van','Van','شاحنة','🚐'],['fox','Fox','ثعلب','🦊'],
  ['yoyo','Yo-yo','يويو','🪀'],['zebra','Zebra','حمار وحشي','🦓']
];
for(const [slug,en,ar,emoji] of EXTRA){
  const inner=(typeof ART[slug]==='function'? ART[slug]() : (build(slug)||ARTX['star']||ART.star));
  const night=NIGHT2.has(slug);
  fs.writeFileSync(path.join(OUT,slug+'.svg'), card(inner,{night,floor:night?'#1e1b4b':'#e9d5ff'}));
  fullIndex[slug]={en,ar,emoji,src:'img/art/'+slug+'.svg'}; made2++;
}
fs.writeFileSync(path.join(OUT,'index.json'), JSON.stringify(fullIndex,null,2));
console.log('FULL: wrote', made2, 'svgs;', miss.length, 'fallbacks', miss.length?('['+miss.join(', ')+']'):'');


