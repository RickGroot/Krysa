/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { bgFor, normMeme } from "./model";
import { ratSvg } from "./rat";
import { pragueSkyline, skyLayer, stageLayer, synthLayer } from "./scenes";
import { h, svg } from "../ui/dom";

export function stickerLayer(o){
  const has=k=>o.stickers.includes(k);let g="";
  const s4=(x,y,r)=>`M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z`;
  const heart=(x,y,s)=>`M${x} ${y+3.4*s}l${-4*s} ${-3.8*s}a${2.4*s} ${2.4*s} 0 0 1 ${4*s} ${-3*s}a${2.4*s} ${2.4*s} 0 0 1 ${4*s} ${3*s}z`;
  const fall=(n,fn)=>{let s="";for(let i=0;i<n;i++){const x=6+((i*37)%88),d=-((i*0.53)%3.5).toFixed(2);s+=fn(x,d,i)}return s};
  if(has("sparkles"))[[12,14,5],[86,20,4],[18,80,3.5],[84,74,5],[50,8,3]].forEach(([x,y,r],i)=>g+=`<path class="st-tw" style="animation-delay:${-i*0.4}s" d="${s4(x,y,r)}" fill="#ffe14d"/>`);
  if(has("hearts"))[[18,72,1],[82,64,1.3],[70,86,.9],[28,40,.8]].forEach(([x,y,s],i)=>g+=`<path class="st-rise" style="animation-delay:${-i*0.7}s" d="${heart(x,y,s)}" fill="#ff4d6d"/>`);
  if(has("sweat"))g+=`<path class="st-drip" d="M67 20q-4 6 0 8.5q4-2.5 0-8.5z" fill="#7fd1ff" stroke="#3a9ad9" stroke-width=".6"/>`;
  if(has("vein"))g+=`<g class="st-pulse" transform="translate(66 22)"><path d="M-4 -1q2 1 2 3M1 -4q-1 2 1 2M4 1q-2 -1 -2 -3M-1 4q1 -2 -1 -2" stroke="#e5383b" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
  if(has("question"))[[76,22,14],[86,14,10],[18,24,12]].forEach(([x,y,f],i)=>g+=`<text class="st-bob" style="animation-delay:${-i*0.5}s" x="${x}" y="${y}" font-size="${f}" fill="#ffe14d" stroke="#000" stroke-width=".8" font-family="Anton,Impact,sans-serif">?</text>`);
  if(has("exclaim"))g+=`<text class="st-bob" x="74" y="22" font-size="14" fill="#ff3b30" stroke="#000" stroke-width=".8" font-family="Anton,Impact,sans-serif">!!</text>`;
  if(has("zzz"))[[68,24,6],[74,17,8],[81,10,10]].forEach(([x,y,f],i)=>g+=`<text class="st-bob" style="animation-delay:${-i*0.4}s" x="${x}" y="${y}" font-size="${f}" fill="#fff" stroke="#000" stroke-width=".5" font-family="Anton,Impact,sans-serif">Z</text>`);
  if(has("fire"))for(let i=0;i<8;i++){const x=6+i*12.5,hh=16+((i*7)%9);g+=`<g class="st-flick" style="animation-delay:${-i*0.13}s"><path d="M${x-6} 101Q${x-7} ${101-hh*.5} ${x-2} ${101-hh*.8}Q${x-1} ${101-hh*.5} ${x+1} ${101-hh*.7}Q${x+3} ${101-hh} ${x} ${101-hh*1.3}Q${x+9} ${101-hh*.6} ${x+6} 101Z" fill="#ff7a1a"/><path d="M${x-3} 101Q${x-3} ${101-hh*.4} ${x} ${101-hh*.6}Q${x+4} ${101-hh*.4} ${x+3} 101Z" fill="#ffd23f"/></g>`}
  if(has("rain")){g+=`<g fill="#9aa3ad"><circle cx="40" cy="12" r="7"/><circle cx="50" cy="8" r="9"/><circle cx="61" cy="12" r="7"/><rect x="36" y="12" width="29" height="7" rx="3.5"/></g>`;for(let i=0;i<6;i++)g+=`<path class="st-drop" style="animation-delay:${-i*0.27}s" d="M${39+i*4.5} 22v5" stroke="#5fb3e8" stroke-width="1.4" stroke-linecap="round"/>`}
  if(has("cheese"))g+=fall(7,(x,d)=>`<path class="st-fall" style="animation-delay:${d}s" d="M${x} 0l9-4.5v9z" fill="#f2c14e" stroke="#c9962a" stroke-width=".6"/>`);
  if(has("money"))g+=fall(7,(x,d)=>`<rect class="st-fall" style="animation-delay:${d}s" x="${x}" y="0" width="11" height="5.5" rx=".6" fill="#6fae6a" stroke="#3f7a3b" stroke-width=".5"/>`);
  if(has("confetti"))g+=fall(16,(x,d,i)=>`<rect class="st-fall" style="animation-delay:${d}s" x="${x}" y="0" width="2.4" height="4.2" fill="${["#ff4d6d","#ffd23f","#4dd4ff","#7b5cff","#3ddc84"][i%5]}"/>`);
  if(has("plane"))g+=`<g class="st-fly"><path d="M0 14l6-1.2 4-5h2l-2 4.6 5-.8 1.6-2h1.4l-1 2.6 1 2.6h-1.4l-1.6-2-5-.8 2 4.6h-2l-4-5z" fill="#fff" stroke="#17181a" stroke-width=".4"/></g>`;
  if(has("notes"))[[16,30,0],[84,40,.6],[24,62,1.1],[78,70,.3]].forEach(([x,y,d])=>g+=`<g class="st-bob" style="animation-delay:${-d}s"><circle cx="${x}" cy="${y}" r="2.4" fill="#fff" stroke="#000" stroke-width=".5"/><path d="M${x+2.2} ${y}v-10l5 2v3l-5-2" fill="#fff" stroke="#000" stroke-width=".5"/></g>`);
  if(has("lasers")&&o.count==="1"&&o.size==="normal"&&o.move==="none")g+=`<g class="st-laser"><path d="M44.4 41.4L-5 78M44.4 41.4L-5 88" stroke="#ff2a2a" stroke-width="2.2" opacity=".85"/><path d="M55.6 41.4L105 78M55.6 41.4L105 88" stroke="#ff2a2a" stroke-width="2.2" opacity=".85"/><circle cx="44.4" cy="41.4" r="3" fill="#fff"/><circle cx="55.6" cy="41.4" r="3" fill="#fff"/></g>`;
  if(has("burst"))g+=`<g class="st-pulse" transform="translate(22 80)"><path d="M0-14L4-6 13-9 8-2 16 3 7 5 9 14 2 8-4 15-5 6-15 6-8 0-14-7-5-6Z" fill="#ffe14d" stroke="#000" stroke-width=".6"/><text y="2.5" font-size="5.2" text-anchor="middle" fill="#e5383b" font-family="Anton,Impact,sans-serif">SQUEAK!</text></g>`;
  if(o.filter==="fried"&&o.count==="1"&&o.size==="normal"&&o.move==="none")g+=`<g class="st-glow"><circle cx="44.4" cy="41.4" r="4" fill="#ff2a2a" opacity=".85"/><circle cx="55.6" cy="41.4" r="4" fill="#ff2a2a" opacity=".85"/><path d="M44.4 33v17M36 41.4h17M55.6 33v17M47 41.4h17" stroke="#fff" stroke-width=".7" opacity=".9"/></g>`;
  const e=svg(g,"0 0 100 100");e.classList.add("stl");return e;
}

export function artEl(o,face,id){
  const art=h("div",{class:"art bg-"+(o.bg||bgFor(id))});
  if(o.bg==="prague")art.append(pragueSkyline());else if(o.bg==="sky")art.append(skyLayer());else if(o.bg==="synth")art.append(synthLayer());else if(o.bg==="stage")art.append(stageLayer());
  const rats=h("div",{class:`rats cnt-${o.count} sz-${o.size} mv-${o.move}`+(o.count==="9"?"":" alive")});
  for(let i=0;i<+o.count;i++){const w=h("div",{class:"r r"+i});w.append(ratSvg({face,hat:o.hat,gear:o.gear,item:o.item,fur:o.fur,ears:o.ears}));rats.append(w)}
  art.append(rats);
  if(o.stickers.length||o.filter==="fried")art.append(stickerLayer(o));
  return art;
}

export function memeEl(m,id){
  const o=normMeme(m);
  const W=h("div",{class:`meme lay-${o.layout} font-${o.font} col-${o.color} fx-${o.filter}`});
  const T=(cls,txt)=>txt?h("div",{class:"mt "+cls,text:txt}):null;
  const add=(el,...kids)=>{for(const k of kids)if(k)el.append(k);return el};
  if(o.layout==="caption")W.append(h("div",{class:"capbar",text:[o.top,o.bottom].filter(Boolean).join("\n")||" "}),artEl(o,o.face,id));
  else if(o.layout==="poster")add(W,h("div",{class:"pframe"},artEl(o,o.face,id)),o.top&&h("div",{class:"ptitle",text:o.top}),o.bottom&&h("div",{class:"psub",text:o.bottom}));
  else if(o.layout==="duo")W.append(add(artEl(o,o.face,id),T("bot",o.top)),add(artEl(o,o.face2,id+"b"),T("bot",o.bottom)));
  else if(o.layout==="stack")W.append(h("div",{class:"srow"},h("div",{class:"stxt",text:o.top||"Nah"}),artEl(o,o.face,id)),h("div",{class:"srow"},h("div",{class:"stxt",text:o.bottom||"Yeah"}),artEl(o,o.face2,id+"b")));
  else if(o.layout==="speech")W.append(add(artEl(o,o.face,id),o.top&&h("div",{class:"sbub",text:o.top}),T("bot",o.bottom)));
  else if(o.layout==="news")W.append(add(artEl(o,o.face,id),h("div",{class:"live"},h("i"),"LIVE · PRAHA"),h("div",{class:"news"},h("div",{class:"ntag",text:"BREAKING"}),h("div",{class:"nhead",text:o.top||"LOCAL RAT SPOTTED"}),o.bottom&&h("div",{class:"ntick"},h("span",{text:`${o.bottom}  •  ${o.bottom}  •  `})))));
  else if(o.layout==="boarding"){const code=("KR"+(1300+((id||"x").split("").reduce((n,c)=>n+c.charCodeAt(0),0)%99)));
    W.append(h("div",{class:"bp"},h("div",{class:"bp-head"},h("span",{text:"KRYSA AIRLINES"}),h("span",{text:"BOARDING PASS"})),
      h("div",{class:"bp-body"},h("div",{class:"bp-art"},artEl(o,o.face,id)),h("div",{class:"bp-info"},
        h("div",{class:"bp-l",text:"PASSENGER"}),h("div",{class:"bp-name",text:o.top||"KRYSA"}),
        h("div",{class:"bp-route"},h("b",{text:"AMS"}),h("span",{text:"✈"}),h("b",{text:"PRG"})),
        h("div",{class:"bp-grid"},...[["FLIGHT",code],["GATE","C7"],["SEAT","1A"],["CLASS","CHEESE"]].map(([k,v])=>h("div",null,h("div",{class:"bp-l",text:k}),h("div",{class:"bp-v",text:v})))))),
      o.bottom&&h("div",{class:"bp-note",text:o.bottom}),h("div",{class:"bp-code"})))}
  else if(o.layout==="wanted")add(W,h("div",{class:"wt-h",text:"WANTED"}),h("div",{class:"wt-frame"},artEl(o,o.face,id)),h("div",{class:"wt-name",text:o.top||"KRYSA"}),h("div",{class:"wt-for",text:o.bottom||"For stealing the last chlebíček"}),h("div",{class:"wt-rew",text:"REWARD: 500 Kč"}));
  else W.append(add(artEl(o,o.face,id),T("top",o.top),T("bot",o.bottom)));
  return W;
}

export const MEME_CACHE=new Map();

export function memeCached(r){const key=JSON.stringify(normMeme(r));const c=MEME_CACHE.get(r.id);if(c&&c.key===key)return c.el;const el=memeEl(r,r.id);MEME_CACHE.set(r.id,{key,el});return el}
