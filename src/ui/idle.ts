/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { RAT, krysa, sideRat } from "../art/rat";
import { S } from "../state";
import { h, reduced, svg, toast } from "./dom";
import { render } from "./tabs";

export function scurry(opts: any = {}){if(reduced())return;const el=h("div",{class:"scurry"+(opts.dir===-1?" rev":""),"aria-hidden":"true"});el.append(sideRat(!!opts.cheese));
  el.addEventListener("animationend",e=>{if(e.target===el)el.remove()});
  el.addEventListener("click",e=>{const r=el.getBoundingClientRect();eek(r.left+r.width/2,r.top,opts.cheese?"Caught it, cheese and all!":"Got one!");el.remove();caughtRat()});
  document.body.append(el)}

export const RAT_LINES=[
  "Rats laugh when tickled. You just can't hear it: it's ultrasonic.",
  "Rats can't vomit. Pace yourselves at Lokál.",
  "A rat's front teeth never stop growing. That's why I'm always snacking.",
  "Magawa the rat sniffed out over 100 landmines and unexploded bombs in Cambodia and got a gold medal for it.",
  "Rats will free a trapped friend, then share their chocolate with them. Be the rat.",
  "Rats replay the day's routes in their sleep. Tonight's replay: the walk home from Náplavka.",
  "Czech lesson: a rat is 'krysa', the common brown rat is 'potkan'. I'm Krysa. Hi.",
  "The Rat comes first in the Chinese zodiac. It won the race by riding on the Ox.",
  "Squeak if you've booked Lokál yet.",
  "I've logged zero expenses. I pay in cheese.",
  "Three humans, one Airbnb, zero rats. I've fixed that.",
  "Suggested items are dashed. Tap one to keep it. Rats can't decide for you.",
];

export let ratIdx=Math.floor(Math.random()*RAT_LINES.length);

export function ratSays(){const btn=document.getElementById("krysa");btn.querySelector(".bubble")?.remove();clearTimeout((ratSays as any).t);
  ratIdx=(ratIdx+1)%RAT_LINES.length;const b=h("div",{class:"bubble",role:"status",text:RAT_LINES[ratIdx]});btn.append(b);
  btn.classList.remove("hop");void btn.offsetWidth;btn.classList.add("hop");(ratSays as any).t=setTimeout(()=>b.remove(),6000)}

export const RAT_FACTS=RAT_LINES.slice(0,8);

export const IDLE={on:true,last:Date.now()};

try{IDLE.on=localStorage.getItem("pw-idle-rats")!=="off"}catch(e){}

export const EEKS=["Eek!","Squeak!","You saw nothing.","Got me!","I was never here."];

export function eek(x,y,msg?){const b=h("div",{class:"eek",role:"status",text:msg||EEKS[Math.floor(Math.random()*EEKS.length)],style:`left:${Math.max(60,Math.min(innerWidth-60,x))}px;top:${Math.max(40,y)}px`});document.body.append(b);setTimeout(()=>b.remove(),1400)}

export function caughtRat(){
  S.myCatches=(S.myCatches||0)+1;
  if(S.db&&S.uid&&S.canWrite){const n=((S.scores||{})[S.uid]||0)+1;S.scores={...(S.scores||{}),[S.uid]:n};
    S.db.doc("ratgame/scores").update({scores:{[S.uid]:n}}).catch(()=>{});toast(`Rat caught! That's ${n}.`)}
  else toast(`Rat caught! That's ${S.myCatches}.`);
  if(S.tab==="rats")render();
}

export function catchPeek(el){if(el.classList.contains("caught"))return;el.classList.add("caught");const r=el.getBoundingClientRect();eek(r.left+r.width/2,r.top);caughtRat();setTimeout(()=>el.remove(),400)}

export function peek(side){
  const el=h("button",{class:"peek alive peek-"+side,type:"button","aria-label":"A rat is peeking in. Tap to catch it."});
  if(side==="b")el.style.left=`calc(${8+Math.random()*52}% )`;
  else el.style.top=`${30+Math.random()*40}vh`;
  const r=h("span",{class:"pr"});r.append(krysa(Math.random()<.25?"sus":"classic"));el.append(r);
  el.addEventListener("click",()=>catchPeek(el));
  r.addEventListener("animationend",e=>{if(e.target===r)el.remove()});
  document.body.append(el);
}

export function tailDangle(){
  const top=0;
  const el=h("button",{class:"tail-dangle",type:"button","aria-label":"A rat tail is dangling. Tap to catch it.",style:`top:${top}px;left:${15+Math.random()*65}%`});
  el.append(svg(`<path d="M14 0 C14 26 6 40 12 58 C17 74 7 90 12 86" fill="none" stroke="${RAT.pink}" stroke-width="4" stroke-linecap="round"/>`,"0 0 28 96"));
  el.addEventListener("click",()=>{if(el.classList.contains("caught"))return;el.classList.add("caught");const r=el.getBoundingClientRect();eek(r.left+14,r.top+30,"Hey, that's attached!");caughtRat();setTimeout(()=>el.remove(),300)});
  el.addEventListener("animationend",e=>{if(e.target===el&&!el.classList.contains("caught"))el.remove()});
  document.body.append(el);
}

export function canCameo(){return IDLE.on&&!reduced()&&document.visibilityState==="visible"&&!document.querySelector(".scrim,.peek,.tail-dangle,.scurry")&&Date.now()-IDLE.last>4000}

export function scheduleCameo(first?){clearTimeout((scheduleCameo as any).t);if(!IDLE.on)return;
  (scheduleCameo as any).t=setTimeout(()=>{if(canCameo()){const acts=[()=>peek("b"),()=>peek("b"),()=>peek("r"),()=>peek("l"),tailDangle,()=>scurry({dir:Math.random()<.5?1:-1,cheese:Math.random()<.6})];acts[Math.floor(Math.random()*acts.length)]()}scheduleCameo()},(first?15+Math.random()*10:25+Math.random()*35)*1000)}

export function wakeKrysa(){const k=document.getElementById("krysa");if(!k.classList.contains("sleep"))return;k.classList.remove("sleep","hop");void k.offsetWidth;k.classList.add("hop")}

export function setupIdle(){
  const k=document.getElementById("krysa");k.classList.add("alive");
  k.append(h("span",{class:"zzz","aria-hidden":"true"},h("i",null,"z"),h("i",null,"z"),h("i",null,"Z")));
  const nest=h("footer",{class:"nest"});const kr=h("div",{class:"kr alive sleep"});kr.append(krysa("sleep"),h("span",{class:"zzz","aria-hidden":"true"},h("i",null,"z"),h("i",null,"z"),h("i",null,"Z")));
  nest.append(kr,h("span",{text:"End of the page. Krysa is guarding the plan."}));document.querySelector(".wrap").append(nest);
  const poke=()=>{IDLE.last=Date.now();wakeKrysa()};
  ["pointerdown","keydown","touchstart","wheel"].forEach(ev=>addEventListener(ev,poke,{passive:true,capture:true}));
  addEventListener("scroll",poke,{passive:true,capture:true});
  setInterval(()=>{if(Date.now()-IDLE.last>45000)k.classList.add("sleep")},5000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")IDLE.last=Date.now()});
  scheduleCameo(true);
}
