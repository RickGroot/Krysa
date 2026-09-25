/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { CZ, EN, MON, anchor, fmtD, parseD, splitDT, todayIso } from "../lib/dates";
import { fmtAmt, fmtCzk, fmtEur } from "../lib/money";
import { KINDS, S, pname } from "../state";
import { balances, rate, settle, toCzk, tripDays, walkMin } from "./bound";
import { placeLine, removeDocs, snapOf, write } from "./core";
import { h, toast } from "./dom";
import { editEvent, editExpense, editIdea, editInfo, editPerson, editRate, editTodo } from "./editors";
import { renderFlights } from "./flights";
import { scurry } from "./idle";
import { watchAnims } from "./perf";
import { paintStage } from "./stage";
import { nowNextCard, remindersEl } from "./timely";
import { renderRats } from "./wall";

export function render(){
  const i=S.info;
  document.getElementById("title").textContent=i.title||"Prague week";
  {const hr=new Date().getHours();document.getElementById("greet").textContent=(hr<11?"Dobré ráno":hr<18?"Dobrý den":"Dobrý večer")+(S.meName?`, ${S.meName}`:"")}
  const sub=document.getElementById("sub");sub.replaceChildren();
  if(i.startDate&&i.endDate){sub.append(h("span",null,h("b",{text:fmtD(i.startDate)})," → ",h("b",{text:fmtD(i.endDate)})));
    const diff=Math.round((+parseD(i.startDate)-+parseD(todayIso()))/864e5),end=Math.round((+parseD(i.endDate)-+parseD(todayIso()))/864e5);
    sub.append(h("span",{text:diff>1?`${diff} days to go`:diff===1?"Tomorrow":end>=0?"Happening now":"Trip done"}))}
  else sub.append(h("span",{text:"Dates not set yet"}));
  if(i.hotelName)sub.append(h("span",{text:"Stay: "+i.hotelName}));
  sub.append(h("span",{text:`${S.people.length} travelling`}));
  const open=S.todos.filter(t=>!t.done).length;
  document.getElementById("c-ideas").textContent=S.ideas.length?S.ideas.length:"";
  document.getElementById("c-todo").textContent=open?open:"";
  document.getElementById("c-rats").textContent=S.rats.length?S.rats.length:"";
  document.querySelectorAll("nav.tabs button[data-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===S.tab)));document.getElementById("more-btn").setAttribute("aria-selected",String(["todo","money","info"].includes(S.tab)));
  const fab=document.getElementById("fab");fab.hidden=!S.canWrite||!S.loaded;
  paintStage();
  const act=document.activeElement&&document.activeElement.id;
  const main=document.getElementById("main");main.replaceChildren();
  if(!S.loaded){main.append(h("p",{class:"empty",text:S.db===false?"This planner couldn't connect. Open it on claude.ai while signed in to your organization.":"The rats are fetching the plan…"}));return}
  main.append(remindersEl());
  ({plan:renderPlan,ideas:renderIdeas,todo:renderTodo,money:renderMoney,info:renderInfo,rats:renderRats,flights:renderFlights})[S.tab](main);
  requestAnimationFrame(watchAnims);
  if(act==="conv-amt"){const el=document.getElementById(act);if(el){el.focus();const L=el.value.length;try{(el as any).setSelectionRange(L,L)}catch(e){}}}
  if(!S.canWrite)main.append(h("p",{class:"readonly",text:"You have view-only access. Ask the trip owner for edit rights to make changes."}));
}

export function evCard(e){
  const k=KINDS[e.kind]?e.kind:"work";
  const openIt=()=>{if(S.canWrite)editEvent(e)};
  return h("div",{class:"ev k-"+k+(e.draft?" draft":""),role:S.canWrite?"button":null,tabindex:S.canWrite?"0":null,onclick:openIt,onkeydown:ev=>{if((ev.key==="Enter"||ev.key===" ")&&ev.target===ev.currentTarget){ev.preventDefault();openIt()}}},
    h("span",{class:"t",text:e.time?(e.endTime?`${e.time}\n–${e.endTime}`:e.time):"any"}),
    h("span",null,h("div",{class:"ti"},e.title,e.draft&&h("span",{class:"pill",text:"Suggested"})),
      h("div",{class:"meta"},h("span",{class:"chip k-"+k,text:KINDS[k]})),
      placeLine(e),
      e.notes&&h("div",{class:"meta",text:e.notes})));
}

export async function bulkDrafts(keep){
  const ds=S.events.filter(e=>e.draft);
  if(!keep){await removeDocs(ds.map(e=>snapOf("events",e)),`Removed ${ds.length} suggestions`);return}
  for(const e of ds){const ok=await write(()=>S.db.doc("events/"+e.id).update({draft:false}));if(!ok)return}
  toast(`Kept ${ds.length} items`);scurry();
}

export function renderPlan(main){
  const days=tripDays();
  if(!S.info.startDate){main.append(h("div",{class:"banner"},h("span",{text:"Set the trip dates to lay out each day."}),S.canWrite&&h("button",{class:"btn primary",onclick:editInfo},"Set dates")))}
  {const nn=nowNextCard(false);if(nn)main.append(nn)}
  const drafts=S.events.filter(e=>e.draft).length;
  if(drafts&&S.canWrite){let armed=false;const rm=h("button",{class:"btn small ghost danger",onclick:()=>{if(!armed){armed=true;rm.textContent="Tap again to remove";return}bulkDrafts(false)}},"Remove all");
    main.append(h("div",{class:"banner"},h("span",{text:`${drafts} suggested items (dashed). Tap one to keep, change or delete it.`}),h("span",{style:"display:flex;gap:6px"},h("button",{class:"btn small",onclick:()=>bulkDrafts(true)},"Keep all"),rm)))}
  if(!days.length)return;
  const today=todayIso();
  main.append(h("div",{class:"daystrip"},days.map(d=>{const dt=parseD(d);return h("a",{href:"#"+anchor(d),class:d===today?"today":null,onclick:e=>{e.preventDefault();document.getElementById(anchor(d))?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"})}},h("span",{class:"cz",text:`${CZ[dt.getUTCDay()]} · ${EN[dt.getUTCDay()]}`}),h("span",{class:"n",text:dt.getUTCDate()}))})));
  for(const d of days){
    const dt=parseD(d);
    const evs=S.events.filter(e=>e.date===d).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99"));
    main.append(h("section",{class:"day",id:anchor(d)},
      h("div",{class:"dayhead"},h("h2",null,`${EN[dt.getUTCDay()]} ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`,h("span",{class:"cz",text:CZ[dt.getUTCDay()]})),S.canWrite&&h("button",{class:"btn small ghost",onclick:()=>editEvent({},{date:d})},"+ Add")),
      evs.length?h("div",{class:"events"},evs.map(evCard)):h("p",{class:"empty",text:"Nothing planned yet."})));
  }
}

export function voteCount(it){return Object.values(it.votes||{}).filter(Boolean).length}

export function renderIdeas(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Suggest places and vote. Move winners into the plan."}),S.canWrite&&h("button",{class:"btn primary small",onclick:()=>editIdea()},"+ Idea")));
  const present=Object.keys(KINDS).filter(k=>S.ideas.some(i=>i.kind===k));
  if(present.length>1){if(S.ideaFilter!=="all"&&!present.includes(S.ideaFilter))S.ideaFilter="all";
    main.append(h("div",{class:"filters"},[["all","All"],...present.map(k=>[k,KINDS[k]])].map(([k,l])=>h("button",{"aria-pressed":S.ideaFilter===k,onclick:()=>{S.ideaFilter=k;render()}},l+(k==="all"?"":` ${S.ideas.filter(i=>i.kind===k).length}`)))))}
  const ideas=S.ideas.filter(i=>S.ideaFilter==="all"||i.kind===S.ideaFilter).sort((a,b)=>voteCount(b)-voteCount(a)||(walkMin(a)??99)-(walkMin(b)??99)||(a.title||"").localeCompare(b.title||""));
  if(!ideas.length){main.append(h("p",{class:"empty",text:"No ideas yet. Add the first one."}));return}
  main.append(h("div",{class:"list"},ideas.map(it=>{const mine=!!(S.uid&&it.votes&&it.votes[S.uid]);const k=KINDS[it.kind]?it.kind:"food";
    return h("div",{class:"row"},
      h("button",{class:"vote",type:"button","aria-pressed":mine,"aria-label":mine?"Remove your vote":"Vote for this",disabled:!S.canWrite||!S.uid,onclick:()=>write(()=>S.db.doc("ideas/"+it.id).update({votes:{[S.uid]:!mine}}))},h("span",{class:"v",text:voteCount(it)}),h("span",{class:"l",text:mine?"voted":"vote"})),
      h("div",{class:"main"},h("div",{class:"ti",text:it.title}),h("div",{class:"meta"},h("span",{class:"chip k-"+k,text:KINDS[k]}),it.scheduled&&` · planned ${fmtD(it.scheduled)}`),
        placeLine(it),
        it.notes&&h("div",{class:"meta",text:it.notes}),it.link&&/^https?:\/\//i.test(it.link)&&h("div",{class:"meta"},h("a",{href:it.link,target:"_blank",rel:"noopener",text:it.link.replace(/^https?:\/\/(www\.)?/,"").slice(0,48)}))),
      S.canWrite&&h("div",{class:"acts"},h("button",{class:"btn small",onclick:()=>editEvent({},{title:it.title,kind:it.kind,notes:it.notes,location:it.location,lat:it.lat,lng:it.lng,fromIdea:it.id})},"Plan it"),h("button",{class:"btn small ghost",onclick:()=>editIdea(it)},"Edit")))})));
}

export function renderTodo(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Bookings and prep. Tick them off as you go."}),S.canWrite&&h("button",{class:"btn primary small",onclick:()=>editTodo()},"+ To-do")));
  const ts=[...S.todos].sort((a,b)=>(a.done-b.done)||(a.due||"9").localeCompare(b.due||"9"));
  if(!ts.length){main.append(h("p",{class:"empty",text:"Nothing to do. The rats are suspicious."}));return}
  main.append(h("div",{class:"list"},ts.map(t=>h("div",{class:"row"+(t.done?" done":"")},
    h("input",{type:"checkbox",class:"check",id:"todo-"+t.id,checked:!!t.done,disabled:!S.canWrite,"aria-label":"Done",onchange:e=>{const d=e.target.checked;write(()=>S.db.doc("todos/"+t.id).update({done:d})).then(ok=>{if(ok&&d)scurry()})}}),
    h("label",{class:"main",for:"todo-"+t.id},h("div",{class:"ti",text:t.text}),(t.owner||t.due)&&h("div",{class:"meta",text:[t.owner,t.due&&"by "+fmtD(t.due)].filter(Boolean).join(" · ")})),
    S.canWrite&&h("div",{class:"acts"},h("button",{class:"btn small ghost",onclick:()=>editTodo(t)},"Edit"))))));
}

export function convCard(){
  const c=S.conv,toEur=c.from==="CZK";
  const out=h("div",{class:"big money",id:"conv-out","aria-live":"polite"});
  const upd=()=>{const n=parseFloat(String(c.amt).replace(/\s/g,"").replace(",","."));out.textContent=!(n>=0)?(toEur?"€ —":"— Kč"):toEur?fmtEur(n/rate()):fmtCzk(n*rate())};
  const inp=h("input",{id:"conv-amt",inputmode:"decimal",autocomplete:"off",placeholder:toEur?"285":"12",oninput:e=>{c.amt=e.target.value;upd()}});inp.value=c.amt;
  upd();
  return h("div",{class:"card"},
    h("h3",null,"Quick convert",h("button",{class:"btn small",type:"button",onclick:()=>{c.from=toEur?"EUR":"CZK";render();document.getElementById("conv-amt")?.focus()}},toEur?"Kč → €  ⇄":"€ → Kč  ⇄")),
    h("div",{class:"conv"},h("div",{class:"field"},h("label",{for:"conv-amt",text:toEur?"Price in Kč":"Amount in €"}),inp),h("span",{class:"arrow",text:"≈"}),out),
    h("div",{class:"muted",text:[100,250,500,1000].map(k=>`${fmtCzk(k)} ≈ ${fmtEur(k/rate())}`).join(" · ")}));
}

export function renderMoney(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Log shared costs. Each one splits evenly between the people ticked."}),S.canWrite&&h("button",{class:"btn primary small",onclick:()=>editExpense()},"+ Expense")));
  main.append(convCard());
  const total=S.expenses.reduce((s,e)=>s+toCzk(e),0);
  const bal=balances(),moves=settle(bal);
  main.append(h("div",{class:"card"},
    h("h3",null,"Settle up",h("span",{class:"muted"},`1 € = ${rate().toLocaleString("en-GB")} Kč `,S.canWrite&&h("button",{class:"btn small ghost",onclick:editRate},"Edit"))),
    h("div",null,h("div",{class:"big money",text:fmtCzk(total)}),h("div",{class:"muted",text:`≈ ${fmtEur(total/rate())} spent together · ${S.expenses.length} expenses`})),
    moves.length?h("div",{class:"settle"},moves.map(m=>h("div",null,h("b",{text:pname(m.from)}),h("span",{class:"arrow",text:"pays →"}),h("b",{text:pname(m.to)}),h("span",{class:"money",text:fmtCzk(m.amt)}),h("span",{class:"muted money",text:`(${fmtEur(m.amt/rate())})`}))))
      :h("p",{class:"empty",text:S.expenses.length?"All square.":"Nothing logged yet. Add the first shared cost."}),
    S.people.length&&S.expenses.length&&h("div",{class:"bal"},S.people.map(p=>{const v=bal[p.id]||0;return[h("span",{text:p.name||"Someone"}),h("span",{class:"money "+(v>0.5?"pos":v<-0.5?"neg":""),text:(v>0.5?"gets back ":v<-0.5?"owes ":"")+fmtCzk(Math.abs(v))})]}))));
  const xs=[...S.expenses].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||""));
  if(xs.length)main.append(h("div",{class:"list"},xs.map(x=>{const d=parseD(x.date);const n=Array.isArray(x.split)?x.split.length:S.people.length;
    return h("div",{class:"row"},h("span",{class:"walk",text:d?`${CZ[d.getUTCDay()]} ${d.getUTCDate()}`:""}),
      h("div",{class:"main"},h("div",{class:"ti",text:x.what}),h("div",{class:"meta",text:`${pname(x.paidBy)} paid · split ${n} way${n===1?"":"s"}${x.currency==="EUR"?` · ≈ ${fmtCzk(toCzk(x))}`:""}`})),
      h("div",{class:"acts"},h("span",{class:"money",style:"font-weight:600",text:fmtAmt(x)}),S.canWrite&&h("button",{class:"btn small ghost",onclick:()=>editExpense(x)},"Edit")))})));
}

export function fmtDT(s){if(!s)return"";const[d,t]=splitDT(s);return fmtD(d)+(t?" "+t:"")}

export function renderInfo(main){
  const i=S.info;
  const kv=[["Dates",i.startDate&&i.endDate?`${fmtD(i.startDate)} – ${fmtD(i.endDate)}`:"Not set"],["Stay",i.hotelName],["Address",i.hotelAddress],["Check-in / out",[i.checkIn,i.checkOut].filter(Boolean).join(" / ")],["Booking / key",i.booking],["Work location",i.workBase],["Notes",i.notes]].filter(([,v])=>v);
  main.append(h("div",{class:"card"},h("h3",null,"Trip",S.canWrite&&h("button",{class:"btn small",onclick:editInfo},"Edit")),h("dl",{class:"kv"},kv.flatMap(([k,v])=>[h("dt",{text:k}),h("dd",{text:v})])),
    i.hotelAddress&&placeLine({location:i.hotelAddress})));
  const ppl=[...S.people].sort((a,b)=>(a.arrive||"9").localeCompare(b.arrive||"9"));
  main.append(h("div",{class:"card"},h("h3",null,"Who's coming",S.canWrite&&h("button",{class:"btn small",onclick:()=>editPerson()},"+ Add")),
    ppl.length?ppl.map(p=>h("div",{class:"person"},h("div",{class:"ti"},h("span",{text:p.name}),S.canWrite&&h("button",{class:"btn small ghost",onclick:()=>editPerson(p)},"Edit")),
      (p.arrive||p.arriveBy)&&h("div",{class:"meta",text:"In: "+[fmtDT(p.arrive),p.arriveBy].filter(Boolean).join(" · ")}),
      (p.depart||p.departBy)&&h("div",{class:"meta",text:"Out: "+[fmtDT(p.depart),p.departBy].filter(Boolean).join(" · ")}),
      p.phone&&h("div",{class:"meta",text:p.phone}),p.notes&&h("div",{class:"meta",text:p.notes})))
    :h("p",{class:"empty",text:"Add everyone with their flight times so pickups line up."})));
  main.append(h("div",{class:"card"},h("h3",{text:"Prague basics"}),h("ul",{class:"tips"},
    h("li",null,h("b",{text:"Money: "}),"Czech koruna (CZK, Kč). Cards work almost everywhere; pay in CZK when a terminal offers a currency choice."),
    h("li",null,h("b",{text:"Transport: "}),"Trams, metro and buses share one PID ticket. Buy it in the PID Lítačka app and activate it before boarding."),
    h("li",null,h("b",{text:"To FrontKon: "}),"Walk to Můstek (about 5 min), metro B towards Černý Most, get off at Českomoravská (6 stops). O2 Universum is next to the station."),
    h("li",null,h("b",{text:"From the airport: "}),"Buses link the airport to the metro on a regular PID ticket, or take a taxi or ride-hailing car to Old Town."),
    h("li",null,h("b",{text:"Emergency: "}),"112"),
    h("li",null,h("b",{text:"Useful words: "}),"Dobrý den (hello) · Děkuji (thanks) · Pivo (beer) · Účet, prosím (the bill, please)"))));
}
