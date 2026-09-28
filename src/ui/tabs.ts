/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { CZ, EN, MON, anchor, fmtD, nowLocalUTC, parseD, splitDT, todayIso } from "../lib/dates";
import { krysa } from "../art/rat";
import { eventWindow } from "../lib/schedule";
import { fmtAmt, fmtCzk, fmtEur } from "../lib/money";
import { KINDS, S, pname } from "../state";
import { balances, rate, settle, toCzk, todayOn, tripDays, walkMin } from "./bound";
import { placeLine, removeDocs, snapOf, write } from "./core";
import { armBtn, h, keepFocus, toast } from "./dom";
import { editEvent, editExpense, editIdea, editInfo, editPerson, editRate, editTodo } from "./editors";
import { editFlight, renderFlights } from "./flights";
import { postRat } from "./maker";
import { scurry } from "./idle";
import { watchAnims } from "./perf";
import { paintStage } from "./stage";
import { nowNextCard, planBadge, remindersEl } from "./timely";
import { renderRats } from "./wall";

// The one add button: what it adds follows the tab. Info has none; its cards have their own buttons.
export const ADD={rats:["+ Rat",()=>postRat()],plan:["+ Plan item",()=>editEvent({},todayOn()?{date:todayIso()}:{})],flights:["+ Flight",()=>editFlight()],ideas:["+ Idea",()=>editIdea()],todo:["+ To-do",()=>editTodo()],money:["+ Expense",()=>editExpense()]};

// Data from other phones can arrive in bursts: render at most once a frame, and rebuild the page only when the
// tab shows what changed. The header, badges and hero always update; a plain render() still rebuilds everything.
const DEPS={rats:["rats"],plan:["events","info","flights","todos","people"],flights:["flights","people","info"],ideas:["ideas","info"],todo:["todos"],money:["expenses","people","info"],info:["info","people"]};
let frame=0;const pending=new Set();
export function scheduleRender(col){pending.add(col);frame||=requestAnimationFrame(()=>{frame=0;const cols=[...pending];pending.clear();render(cols)})}

export function render(only?){
  if(frame){cancelAnimationFrame(frame);frame=0;pending.clear()}
  const i=S.info;
  document.getElementById("title").textContent=i.title||"Prague week";
  {const hr=new Date().getHours();document.getElementById("greet").textContent=(hr<11?"Dobré ráno":hr<18?"Dobrý den":"Dobrý večer")+(S.meName?`, ${S.meName}`:"")}
  const open=S.todos.filter(t=>!t.done).length;
  document.getElementById("c-todo").textContent=open?open:"";document.getElementById("c-todo-sr").textContent=open?`, ${open} open to-do${open===1?"":"s"}`:"";
  const fab=document.getElementById("fab"),add=ADD[S.tab];fab.hidden=!add||!S.canWrite||!S.loaded||!S.tabReady;if(add)fab.textContent=add[0];
  // Nothing tab-specific until the start tab is decided (boot.ts).
  if(S.tabReady){document.querySelectorAll("nav.tabs button[data-tab]").forEach(b=>{if(b.dataset.tab===S.tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});document.getElementById("more-btn").classList.toggle("here",["todo","money","info"].includes(S.tab));
    paintStage();planBadge()}
  if(only&&S.loaded&&!only.some(c=>DEPS[S.tab]?.includes(c)))return;
  // Rebuilt on every change; keepFocus puts focus back on the same control (by its data-k).
  const main=document.getElementById("main");
  keepFocus(main,()=>{main.replaceChildren();
    if(!S.loaded){main.append(h("p",{class:"empty",text:S.db===false?"The rats couldn't load the plan. Check your connection and reload.":"The rats are fetching the plan…"}));return}
    // Reminders live on Plan; the Plan button carries a badge elsewhere.
    if(S.tab==="plan")main.append(remindersEl());
    ({plan:renderPlan,ideas:renderIdeas,todo:renderTodo,money:renderMoney,info:renderInfo,rats:renderRats,flights:renderFlights})[S.tab](main);
    if(!S.canWrite)main.append(h("p",{class:"readonly",text:"View only. Reload and enter the trip code to make changes."}));
  });
  if(S.loaded)requestAnimationFrame(watchAnims);
}

/** Krysa beside an empty or finished list: sus, cheers or sleep. */
const ratNote=(pose,text)=>{const k=h("span",{class:"kr","aria-hidden":"true"});k.append(krysa(pose));return h("div",{class:"empty-rat"},k,h("p",{class:"empty",text}))};

export function evCard(e){
  const k=KINDS[e.kind]?e.kind:"work";
  // The title is the card's one button; its ::after covers the card, and Route/Map sit above it.
  const title=S.canWrite?h("button",{class:"ev-open",type:"button","data-k":"ev:"+e.id,onclick:()=>editEvent(e)},e.title):e.title;
  return h("div",{class:"ev k-"+k+(e.draft?" draft":"")},
    h("span",{class:"t",text:e.time?(e.endTime?`${e.time}\n–${e.endTime}`:e.time):"any"}),
    h("span",null,h("div",{class:"ti"},title,e.draft&&h("span",{class:"pill",text:"Suggested"})),
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
  const days=tripDays(),live=todayOn(),today=todayIso();
  if(!S.info.startDate){main.append(h("div",{class:"banner"},h("span",{text:"Set the trip dates to lay out each day."}),S.canWrite&&h("button",{class:"btn primary","data-k":"edit:info",onclick:editInfo},"Set dates")))}
  {const nn=nowNextCard(false);if(nn)main.append(nn)}
  // While the trip is on, today comes first; the day strip and the other days follow.
  if(live)main.append(daySection(today,true));
  const drafts=S.events.filter(e=>e.draft).length;
  if(drafts&&S.canWrite){const rm=armBtn(h("button",{class:"btn small ghost danger","data-k":"drafts:remove"},"Remove all"),"Tap again to remove",()=>bulkDrafts(false));
    main.append(h("div",{class:"banner"},h("span",{text:`${drafts} suggested items (dashed). Tap one to keep, change or delete it.`}),h("span",{class:"banner-acts"},h("button",{class:"btn small","data-k":"drafts:keep",onclick:()=>bulkDrafts(true)},"Keep all"),rm)))}
  if(!days.length)return;
  main.append(h("div",{class:"daystrip"},days.map(d=>{const dt=parseD(d);return h("a",{href:"#"+anchor(d),class:d===today?"today":null,"data-k":"day:"+d,onclick:e=>{e.preventDefault();document.getElementById(anchor(d))?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"})}},h("span",{class:"cz"},h("span",{lang:"cs",text:CZ[dt.getUTCDay()]}),` · ${EN[dt.getUTCDay()]}`),h("span",{class:"n",text:dt.getUTCDate()}))})));
  for(const d of days)if(!(live&&d===today))main.append(daySection(d,false));
}

/** One day of the plan. Today's version is headed "Today" and dims what's already over. */
function daySection(d,isToday){
  const dt=parseD(d),label=`${EN[dt.getUTCDay()]} ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`,now=nowLocalUTC();
  const evs=S.events.filter(e=>e.date===d).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99"));
  return h("section",{class:"day"+(isToday?" is-today":""),id:anchor(d)},
    h("div",{class:"dayhead"},h("h2",null,isToday?"Today":label," ",isToday?h("span",{class:"cz",text:label}):h("span",{class:"cz",lang:"cs",text:CZ[dt.getUTCDay()]})),
      S.canWrite&&h("button",{class:"btn small ghost","data-k":"add:day:"+d,"aria-label":`Add to ${isToday?"today":label}`,onclick:()=>editEvent({},{date:d})},"+ Add")),
    evs.length?h("div",{class:"events"},evs.map(e=>{const c=evCard(e),w=isToday&&eventWindow(e);if(w&&w.en<=now)c.classList.add("past");return c}))
      :h("p",{class:"empty",text:isToday?"Nothing planned today.":"Nothing planned yet."}),
    isToday&&evs.length&&evs.every(e=>{const w=eventWindow(e);return w&&w.en<=now})&&ratNote("sleep","That's today done. Krysa is off to bed."));
}

export function voteCount(it){return Object.values(it.votes||{}).filter(Boolean).length}

export function renderIdeas(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Suggest places and vote. Move winners into the plan."})));
  const present=Object.keys(KINDS).filter(k=>S.ideas.some(i=>i.kind===k));
  if(present.length>1){if(S.ideaFilter!=="all"&&!present.includes(S.ideaFilter))S.ideaFilter="all";
    main.append(h("div",{class:"filters"},[["all","All"],...present.map(k=>[k,KINDS[k]])].map(([k,l])=>h("button",{"data-k":"filter:"+k,"aria-pressed":S.ideaFilter===k,onclick:()=>{S.ideaFilter=k;render()}},l+(k==="all"?"":` ${S.ideas.filter(i=>i.kind===k).length}`)))))}
  const ideas=S.ideas.filter(i=>S.ideaFilter==="all"||i.kind===S.ideaFilter).sort((a,b)=>voteCount(b)-voteCount(a)||(walkMin(a)??99)-(walkMin(b)??99)||(a.title||"").localeCompare(b.title||""));
  if(!ideas.length){main.append(h("p",{class:"empty",text:"No ideas yet. Add the first one."}));return}
  main.append(h("div",{class:"list"},ideas.map(it=>{const mine=!!(S.uid&&it.votes&&it.votes[S.uid]);const k=KINDS[it.kind]?it.kind:"food";
    return h("div",{class:"row idea"},
      h("button",{class:"vote",type:"button","data-k":"vote:"+it.id,"aria-pressed":mine,"aria-label":`Vote for ${it.title} (${voteCount(it)})`,disabled:!S.canWrite||!S.uid,onclick:()=>write(()=>S.db.doc("ideas/"+it.id).update({votes:{[S.uid]:!mine}}))},h("span",{class:"v",text:voteCount(it)}),h("span",{class:"l",text:mine?"voted":"vote"})),
      h("div",{class:"main"},h("div",{class:"ti",text:it.title}),h("div",{class:"meta"},h("span",{class:"chip k-"+k,text:KINDS[k]}),it.scheduled&&` · planned ${fmtD(it.scheduled)}`),
        placeLine(it),
        it.notes&&h("div",{class:"meta note",text:it.notes}),it.link&&/^https?:\/\//i.test(it.link)&&h("div",{class:"meta"},h("a",{href:it.link,target:"_blank",rel:"noopener",text:it.link.replace(/^https?:\/\/(www\.)?/,"").slice(0,48)}))),
      S.canWrite&&h("div",{class:"acts"},h("button",{class:"btn small","data-k":"plan:"+it.id,onclick:()=>editEvent({},{title:it.title,kind:it.kind,notes:it.notes,location:it.location,lat:it.lat,lng:it.lng,fromIdea:it.id})},"Plan it"),h("button",{class:"btn small ghost","data-k":"edit:ideas:"+it.id,onclick:()=>editIdea(it)},"Edit")))})));
}

export function renderTodo(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Bookings and prep. Tick them off as you go."})));
  const ts=[...S.todos].sort((a,b)=>(a.done-b.done)||(a.due||"9").localeCompare(b.due||"9"));
  if(!ts.length){main.append(ratNote("sus","Nothing to do. The rats are suspicious."));return}
  main.append(h("div",{class:"list"},ts.map(t=>h("div",{class:"row"+(t.done?" done":"")},
    h("input",{type:"checkbox",class:"check",id:"todo-"+t.id,"data-k":"todo:"+t.id,checked:!!t.done,disabled:!S.canWrite,onchange:e=>{const d=e.target.checked;write(()=>S.db.doc("todos/"+t.id).update({done:d})).then(ok=>{if(!ok||!d)return;const left=S.todos.some(x=>!x.done&&x.id!==t.id);scurry(left?{}:{cheese:true});if(!left)toast("All done. Krysa is impressed.")})}}),
    h("label",{class:"main",for:"todo-"+t.id},h("div",{class:"ti",text:t.text}),(t.owner||t.due)&&h("div",{class:"meta",text:[t.owner,t.due&&"by "+fmtD(t.due)].filter(Boolean).join(" · ")})),
    S.canWrite&&h("div",{class:"acts"},h("button",{class:"btn small ghost","data-k":"edit:todos:"+t.id,onclick:()=>editTodo(t)},"Edit"))))));
}

export function convCard(){
  const c=S.conv,toEur=c.from==="CZK";
  const out=h("div",{class:"big money",id:"conv-out","aria-live":"polite"});
  const upd=()=>{const n=parseFloat(String(c.amt).replace(/\s/g,"").replace(",","."));out.textContent=!(n>=0)?(toEur?"€ —":"— Kč"):toEur?fmtEur(n/rate()):fmtCzk(n*rate())};
  const inp=h("input",{id:"conv-amt","data-k":"conv-amt",inputmode:"decimal",autocomplete:"off",placeholder:toEur?"285":"12",oninput:e=>{c.amt=e.target.value;upd()}});inp.value=c.amt;
  upd();
  return h("div",{class:"card"},
    h("div",{class:"card-head"},h("h2",{text:"Quick convert"}),h("button",{class:"btn small",type:"button","data-k":"conv-swap",onclick:()=>{c.from=toEur?"EUR":"CZK";render();document.getElementById("conv-amt")?.focus()}},toEur?"Kč → €  ⇄":"€ → Kč  ⇄")),
    h("div",{class:"conv"},h("div",{class:"field"},h("label",{for:"conv-amt",text:toEur?"Price in Kč":"Amount in €"}),inp),h("span",{class:"arrow",text:"≈"}),out),
    h("div",{class:"muted",text:[100,250,500,1000].map(k=>`${fmtCzk(k)} ≈ ${fmtEur(k/rate())}`).join(" · ")}));
}

export function renderMoney(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Log shared costs. Each one splits evenly between the people ticked."})));
  main.append(convCard());
  const total=S.expenses.reduce((s,e)=>s+toCzk(e),0);
  const bal=balances(),moves=settle(bal);
  main.append(h("div",{class:"card"},
    h("div",{class:"card-head"},h("h2",{text:"Settle up"}),h("span",{class:"muted"},`1 € = ${rate().toLocaleString("en-GB")} Kč `,S.canWrite&&h("button",{class:"btn small ghost","data-k":"edit:rate",onclick:editRate},"Edit"))),
    h("div",null,h("div",{class:"big money",text:fmtCzk(total)}),h("div",{class:"muted",text:`≈ ${fmtEur(total/rate())} spent together · ${S.expenses.length} expenses`})),
    moves.length?h("div",{class:"settle"},moves.map(m=>h("div",null,h("b",{text:pname(m.from)}),h("span",{class:"arrow",text:"pays →"}),h("b",{text:pname(m.to)}),h("span",{class:"money",text:fmtCzk(m.amt)}),h("span",{class:"muted money",text:`(${fmtEur(m.amt/rate())})`}))))
      :S.expenses.length?ratNote("cheers","All square. Krysa raises a Pilsner."):h("p",{class:"empty",text:"Nothing logged yet. Add the first shared cost."}),
    S.people.length&&S.expenses.length&&h("div",{class:"bal"},S.people.flatMap(p=>{const v=bal[p.id]||0;return[h("span",{text:p.name||"Someone"}),h("span",{class:"money "+(v>0.5?"pos":v<-0.5?"neg":""),text:(v>0.5?"gets back ":v<-0.5?"owes ":"")+fmtCzk(Math.abs(v))})]}))));
  const xs=[...S.expenses].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||""));
  if(xs.length)main.append(h("div",{class:"list"},xs.map(x=>{const d=parseD(x.date);const n=Array.isArray(x.split)?x.split.length:S.people.length;
    return h("div",{class:"row"},h("span",{class:"walk",text:d?`${EN[d.getUTCDay()]} ${d.getUTCDate()}`:""}),
      h("div",{class:"main"},h("div",{class:"ti",text:x.what}),h("div",{class:"meta",text:`${pname(x.paidBy)} paid · split ${n} way${n===1?"":"s"}${x.currency==="EUR"?` · ≈ ${fmtCzk(toCzk(x))}`:""}`})),
      h("div",{class:"acts"},h("span",{class:"money amt",text:fmtAmt(x)}),S.canWrite&&h("button",{class:"btn small ghost","data-k":"edit:expenses:"+x.id,onclick:()=>editExpense(x)},"Edit")))})));
}

export function fmtDT(s){if(!s)return"";const[d,t]=splitDT(s);return fmtD(d)+(t?" "+t:"")}

export function renderInfo(main){
  const i=S.info;
  const kv=[["Dates",i.startDate&&i.endDate?`${fmtD(i.startDate)} – ${fmtD(i.endDate)}`:"Not set"],["Stay",i.hotelName],["Address",i.hotelAddress],["Check-in / out",[i.checkIn,i.checkOut].filter(Boolean).join(" / ")],["Booking / key",i.booking],["Work location",i.workBase],["Notes",i.notes]].filter(([,v])=>v);
  main.append(h("div",{class:"card"},h("div",{class:"card-head"},h("h2",{text:"Trip"}),S.canWrite&&h("button",{class:"btn small","data-k":"edit:info",onclick:editInfo},"Edit")),h("dl",{class:"kv"},kv.flatMap(([k,v])=>[h("dt",{text:k}),h("dd",{text:v})])),
    i.hotelAddress&&placeLine({location:i.hotelAddress})));
  const ppl=[...S.people].sort((a,b)=>(a.arrive||"9").localeCompare(b.arrive||"9"));
  main.append(h("div",{class:"card"},h("div",{class:"card-head"},h("h2",{text:"Who's coming"}),S.canWrite&&h("button",{class:"btn small","data-k":"add:person",onclick:()=>editPerson()},"+ Add")),
    ppl.length?ppl.map(p=>h("div",{class:"person"},h("div",{class:"ti"},h("span",{text:p.name}),S.canWrite&&h("button",{class:"btn small ghost","data-k":"edit:people:"+p.id,onclick:()=>editPerson(p)},"Edit")),
      (p.arrive||p.arriveBy)&&h("div",{class:"meta",text:"In: "+[fmtDT(p.arrive),p.arriveBy].filter(Boolean).join(" · ")}),
      (p.depart||p.departBy)&&h("div",{class:"meta",text:"Out: "+[fmtDT(p.depart),p.departBy].filter(Boolean).join(" · ")}),
      p.phone&&h("div",{class:"meta"},h("a",{href:"tel:"+p.phone.replace(/[^\d+]/g,""),text:p.phone})),p.notes&&h("div",{class:"meta",text:p.notes})))
    :h("p",{class:"empty",text:"Add everyone with their flight times so pickups line up."})));
  main.append(h("div",{class:"card"},h("h2",{text:"Prague basics"}),h("ul",{class:"tips"},
    h("li",null,h("b",{text:"Money: "}),"Czech koruna (CZK, Kč). Cards work almost everywhere; pay in CZK when a terminal offers a currency choice."),
    h("li",null,h("b",{text:"Transport: "}),"Trams, metro and buses share one PID ticket. Buy it in the PID Lítačka app and activate it before boarding."),
    h("li",null,h("b",{text:"To FrontKon: "}),"Walk to Můstek (about 5 min), metro B towards Černý Most, get off at Českomoravská (6 stops). O2 Universum is next to the station."),
    h("li",null,h("b",{text:"From the airport: "}),"Buses link the airport to the metro on a regular PID ticket, or take a taxi or ride-hailing car to Old Town."),
    h("li",null,h("b",{text:"Emergency: "}),h("a",{href:"tel:112",text:"112"})),
    h("li",null,h("b",{text:"Useful words: "}),h("span",{lang:"cs",text:"Dobrý den"})," (hello) · ",h("span",{lang:"cs",text:"Děkuji"})," (thanks) · ",h("span",{lang:"cs",text:"Pivo"})," (beer) · ",h("span",{lang:"cs",text:"Účet, prosím"})," (the bill, please)"))));
}
