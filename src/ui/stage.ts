/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { SCENES, groundEl } from "../art/scenes";
import { anchor, dtUTC, fmtD, nowLocalUTC, parseD, todayIso } from "../lib/dates";
import { fmtCzk } from "../lib/money";
import { S } from "../state";
import { toCzk, tripLive } from "./bound";
import { h, svg } from "./dom";
import { openNotifications, pushOn } from "./push";
import { render } from "./tabs";
import { loveOf } from "./wall";

export const HERO={
  rats:{title:"Rat Wall",eyebrow:()=>"Praha by night",sub:()=>{const n=S.rats.length,r=S.rats.reduce((a,x)=>a+loveOf(x),0);return `${n} rat${n===1?"":"s"} posted · ${r} reaction${r===1?"":"s"}`},arch:true},
  flights:{title:"Flights",eyebrow:()=>"AMS ✈ PRG",sub:()=>{const now=nowLocalUTC();const nx=S.flights.map(f=>({f,t:dtUTC(f.date,f.dep)})).filter(x=>x.t&&x.t>now).sort((a,b)=>a.t-b.t)[0];return nx?`Next up: ${nx.f.flight} · ${fmtD(nx.f.date)} ${nx.f.dep}`:"Everyone's home"},light:true},
  plan:{title:"The Plan",eyebrow:()=>S.info.startDate&&S.info.endDate?`${fmtD(S.info.startDate)} → ${fmtD(S.info.endDate)}`:"Set the dates",sub:()=>{if(!S.info.startDate)return"";const d=Math.round((+parseD(S.info.startDate)-+parseD(todayIso()))/864e5),e=Math.round((+parseD(S.info.endDate)-+parseD(todayIso()))/864e5);return d>1?`${d} days to go`:d===1?"Tomorrow!":e>=0?"Happening now":"That was a week"},light:true},
  ideas:{title:"Ideas",eyebrow:()=>"Where to next",sub:()=>`${S.ideas.length} ideas · vote for your favourites`},
  todo:{title:"To-do",eyebrow:()=>"Seznam úkolů",sub:()=>{const o=S.todos.filter(t=>!t.done).length;return `${o} open · ${S.todos.length-o} done`},light:true},
  money:{title:"Money",eyebrow:()=>"Koruna & euro",sub:()=>`${fmtCzk(S.expenses.reduce((a,e)=>a+toCzk(e),0))} spent together`},
  info:{title:"Info",eyebrow:()=>S.info.hotelAddress?S.info.hotelAddress.split(",")[0]:"The basics",sub:()=>`${S.people.length} travelling`},
};

export function paintStage(){
  const tab=SCENES[S.tab]?S.tab:"rats",H=HERO[tab];
  const slot=document.getElementById("hero-slot");
  if(slot.dataset.tab!==tab){slot.dataset.tab=tab;
    const sv=svg(SCENES[tab](),"0 -110 400 360");sv.setAttribute("preserveAspectRatio","xMidYMax slice");sv.classList.add("scene");
    slot.replaceChildren(sv,groundEl());slot.classList.remove("fadein");void slot.offsetWidth;slot.classList.add("fadein")}
  document.body.dataset.scene=H.light?"light":"dark";
  const ht=document.getElementById("hero-text");
  ht.replaceChildren(h("div",{class:"he",text:H.eyebrow()}),h("h2",{class:"ht",text:H.title}),h("div",{class:"hs",text:S.loaded?H.sub():""}));
}

export function heroEl(tab){
  const H=HERO[tab]||HERO.rats;
  const el=h("section",{class:"hero"+(H.light?" lightscene":"")+(H.arch?" arch":"")});
  const sv=svg((SCENES[tab]||SCENES.rats)(),"0 0 400 250");sv.setAttribute("preserveAspectRatio","xMidYMid slice");sv.classList.add("scene");
  el.append(sv,h("div",{class:"hx"},h("div",{class:"he",text:H.eyebrow()}),h("h2",{class:"ht",text:H.title}),h("div",{class:"hs",text:H.sub()})));
  return el;
}

export const MORE_ICONS={
  todo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.5l2.8 2.8L16.5 9"/></svg>',
  money:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.8v.01"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
};

export function goTab(tab){S.tab=tab;try{sessionStorage.setItem("pw-tab",tab)}catch(e){}render();window.scrollTo(0,0);if(tab==="plan"&&S.loaded&&tripLive())requestAnimationFrame(()=>{const el=document.getElementById(anchor(todayIso()));if(el)el.scrollIntoView({block:"start"})})}

export function openMore(){
  const scrim=h("div",{class:"scrim",onclick:e=>{if(e.target===scrim)close()}});
  const close=()=>{scrim.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const open=S.todos.filter(t=>!t.done).length,total=S.expenses.reduce((a,e)=>a+toCzk(e),0);
  const item=(tab,label,sub)=>{const ico=h("span",{class:"ico"});ico.innerHTML=MORE_ICONS[tab];return h("button",{class:"more-item"+(S.tab===tab?" on":""),type:"button",onclick:()=>{close();goTab(tab)}},ico,h("span",null,h("b",{text:label}),h("small",{text:sub})))};
  const bell=h("span",{class:"ico"});bell.innerHTML=MORE_ICONS.bell;
  const pushSub=h("small",{text:"Reminders and new rats on this device"});
  pushOn().then(on=>{if(on)pushSub.textContent="On for this device"});
  scrim.append(h("div",{class:"sheet more-sheet",role:"dialog","aria-label":"More sections"},h("h3",{text:"More"}),
    item("todo","To-do",open?`${open} open`:"All done"),item("money","Money",`${fmtCzk(total)} spent together`),item("info","Info","Stay, people and Prague basics"),
    h("button",{class:"more-item",type:"button",onclick:()=>{close();openNotifications()}},bell,h("span",null,h("b",{text:"Notifications"}),pushSub))));
  document.body.append(scrim);
}
