/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
// What's due now: the heads-up rows and the departure board on Today. Both tick every minute.
import { fmtClock, fmtD, inDur, nowLocalUTC, todayIso } from "../lib/dates";
import { eventWindow } from "../lib/schedule";
import { S, TAB_SPOT, kindOf } from "../state";
import { leaveBy, reminders } from "./bound";
import { placeLine } from "./core";
import { h, keepFocus, reduced } from "./dom";
import { editEvent } from "./editors";
import { icon } from "./icons";
import { kindBadge } from "./parts";
import { goTab, paintStage } from "./stage";

export let DISMISSED=new Set();

try{DISMISSED=new Set(JSON.parse(localStorage.getItem("pw-dismissed")||"[]"))}catch(e){}

export function dismissReminder(id){DISMISSED.add(id);try{localStorage.setItem("pw-dismissed",JSON.stringify([...DISMISSED].slice(-200)))}catch(e){}refreshTimely()}

/** Heads-up: check-in, leaving for the airport, the next item within the hour, to-dos that are due. */
// The next plan item is the board's job, so heads-up (and its badge) leave it out.
const heads=()=>reminders().filter(r=>r.tab!=="plan");

export function headsUp(){
  const list=heads();if(!list.length)return h("section",{id:"hu",hidden:true});
  return h("section",{class:"hu",id:"hu","aria-labelledby":"hu-t"},h("h2",{class:"sr",id:"hu-t",text:"Heads-up"}),
    h("ul",{class:"hu-list"},list.map(r=>h("li",{class:"hu-row"},
      h("span",{class:"hu-mark","aria-hidden":"true"},icon("alert")),
      h("p",{class:"hu-x"},h("span",{text:r.text}),
        r.link&&h("a",{class:"lnk",href:r.link[1],target:"_blank",rel:"noopener","data-k":"hu-link:"+r.id,text:r.link[0]}),
        r.tab&&h("button",{class:"lnk",type:"button","data-k":"hu-open:"+r.id,onclick:()=>goTab(r.tab,TAB_SPOT[r.tab])},r.tab==="todo"?"To-dos":"Open")),
      h("button",{class:"icon-btn",type:"button","data-k":"hu:"+r.id,"aria-label":"Dismiss",onclick:()=>dismissReminder(r.id)},icon("close"))))));
}

// The last status each row showed, so a change can flip like a split-flap board.
const shown=new Map();

function status(x,now,lead){
  const lb=leaveBy(x.e,x.s),d=x.s-now;
  if(lb&&now>=lb.t)return{text:"Leave now",go:true};
  // The next departure counts down to when you have to leave, not to when it starts.
  if(lead&&lb&&d<12*3600000)return{text:`Leave ${inDur(lb.t-now)}`};
  if(x.e.date===todayIso()||d<12*3600000)return{text:inDur(d)};
  return{text:fmtD(x.e.date)};
}

/** The departure board: the next departure in full and two after it. What's on now sits in its head. */
export function board(){
  const now=nowLocalUTC();
  const list=S.events.filter(e=>!e.draft).map(e=>{const w=eventWindow(e);return w?{e,...w}:null}).filter(Boolean).sort((a,b)=>a.s-b.s);
  const current=list.filter(x=>x.s<=now&&now<x.en).pop(),next=list.filter(x=>x.s>now).slice(0,3);
  const open=(x)=>S.canWrite?h("button",{class:"dep-open",type:"button","data-k":"dep:"+x.e.id,onclick:()=>editEvent(x.e)},x.e.title||"Untitled"):h("span",{text:x.e.title||"Untitled"});
  const flip=(key,text)=>{const was=shown.get(key);shown.set(key,text);return was!=null&&was!==text&&!reduced()};
  const rows=next.map((x,i)=>{const lead=i===0,st=status(x,now,lead),lb=lead&&leaveBy(x.e,x.s);
    return h("li",{class:"dep"+(lead?" lead":"")},
      h("span",{class:"dep-t",text:x.e.time}),kindBadge(kindOf(x.e.kind)),
      h("div",{class:"dep-main"},h("div",{class:"dep-ti"},open(x))),
      h("span",{class:"dep-st"+(st.go?" go":"")+(flip(x.e.id,st.text)?" flip":""),text:st.text}),
      // The lead's details run under the status too, so they don't wrap into a narrow column.
      lead&&lb&&x.s-now<12*3600000&&h("div",{class:"dep-lb dep-wide"},st.go?`Starts ${x.e.time} · ${lb.label}`:`${fmtClock(lb.t)} · ${lb.label}`),
      lead&&h("div",{class:"dep-wide"},placeLine(x.e,null,null,{walk:!lb})))});
  const empty=!rows.length&&h("div",{class:"dep-empty"},h("p",{text:"Nothing else on the plan."}),
    h("div",{class:"dep-acts"},S.canWrite&&h("button",{class:"btn small board-btn",type:"button","data-k":"board:add",onclick:()=>editEvent({},{date:todayIso()})},"Add to the plan"),
      h("button",{class:"btn small board-btn",type:"button","data-k":"board:ideas",onclick:()=>goTab("ideas")},"See the ideas")));
  return h("section",{class:"board",id:"board","aria-labelledby":"board-t"},
    h("div",{class:"board-head"},h("h2",{id:"board-t",text:"Next up"}),h("span",{class:"cs",lang:"cs","aria-hidden":"true",text:"Odjezdy"}),
      current&&h("p",{class:"board-now"},h("i",{class:"live-dot","aria-hidden":"true"}),h("span",{class:"bn-l",text:"Now"}),open(current),current.e.endTime&&h("span",{class:"bn-t",text:`until ${current.e.endTime}`}))),
    rows.length?h("ol",{class:"deps"},rows):empty);
}

/** How many heads-up rows wait on Today, as a badge on its tab while you're elsewhere. */
export function todayBadge(){const n=S.loaded&&S.tab!=="today"?heads().length:0;
  document.getElementById("c-today").textContent=n?String(n):"";document.getElementById("c-today-sr").textContent=n?`, ${n} heads-up`:""}

export function refreshTimely(){
  paintStage();todayBadge();
  if(S.tab!=="today"||!S.loaded)return;
  keepFocus(document.getElementById("main"),()=>{
    const r=document.getElementById("hu");if(r)r.replaceWith(headsUp());
    const b=document.getElementById("board");if(b)b.replaceWith(board());
  });
}

// On the minute, so the clock and "in 5 min" turn over when the phone's clock does.
const tick=()=>{if(S.loaded&&document.visibilityState==="visible")refreshTimely();setTimeout(tick,60000-Date.now()%60000+50)};
setTimeout(tick,60000-Date.now()%60000+50);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.loaded)refreshTimely()});
