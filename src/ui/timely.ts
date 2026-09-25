/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { fmtClock, fmtD, inDur, nowLocalUTC } from "../lib/dates";
import { KINDS, S } from "../state";
import { leaveBy, nowNext, reminders } from "./bound";
import { placeLine } from "./core";
import { h } from "./dom";
import { goTab } from "./stage";

export function nowNextCard(compact?){
  const now=nowLocalUTC();const {current,next}=nowNext(now);
  if(!current&&!next)return null;
  const item=(lbl,x,isNow)=>{const lb=!isNow&&leaveBy(x.e,x.s);const k=KINDS[x.e.kind]?x.e.kind:"work";
    return h("div",{class:"nn-item k-"+k},h("div",{class:"nn-l"},isNow&&h("i",{class:"nn-dot"}),lbl,h("span",{class:"nn-when",text:isNow?(x.e.endTime?` · until ${x.e.endTime}`:` · since ${x.e.time}`):` · ${x.s-now>864e5?`${fmtD(x.e.date)} ${x.e.time}`:`${inDur(x.s-now)} (${x.e.time})`}`})),
      h("div",{class:"nn-t",text:x.e.title}),
      lb&&x.s-now<12*3600000&&h("div",{class:"nn-lb",text:`Leave by ${fmtClock(lb.t)} · ${lb.label}`}),
      !compact&&placeLine(x.e))};
  return h("section",{class:"nn card"+(compact?" compact":""),id:"nn","aria-label":"Now and next"},
    current&&item("Now",current,true),next&&item(current?"Next":"Next up",next,false));
}

export let DISMISSED=new Set();

try{DISMISSED=new Set(JSON.parse(localStorage.getItem("pw-dismissed")||"[]"))}catch(e){}

export function dismissReminder(id){DISMISSED.add(id);try{localStorage.setItem("pw-dismissed",JSON.stringify([...DISMISSED].slice(-200)))}catch(e){}refreshTimely()}

export function remindersEl(){
  const list=reminders();if(!list.length)return h("div",{id:"rem",hidden:true});
  return h("section",{class:"rem",id:"rem","aria-label":"Reminders"},list.slice(0,4).map(r=>h("div",{class:"rm",role:"status"},
    h("span",{class:"rm-bell","aria-hidden":"true"}),h("div",{class:"rm-x"},h("span",{text:r.text}),r.link&&h("a",{href:r.link[1],target:"_blank",rel:"noopener",text:r.link[0]}),r.tab&&r.tab!==S.tab&&h("button",{class:"linkish",type:"button",onclick:()=>goTab(r.tab)},"Open")),
    h("button",{class:"rm-close",type:"button","aria-label":"Dismiss reminder",onclick:()=>dismissReminder(r.id)},"×"))));
}

export function refreshTimely(){
  const r=document.getElementById("rem");if(r)r.replaceWith(remindersEl());
  const n=document.getElementById("nn");if(n){const c=nowNextCard(n.classList.contains("compact"));if(c)n.replaceWith(c);else n.remove()}
}

setInterval(()=>{if(S.loaded&&document.visibilityState==="visible")refreshTimely()},60000);
