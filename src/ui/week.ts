/* eslint-disable */
// Week: the days as stops on a line, and the ideas the group votes on before they go on a day.
import { EN, MON, anchor, fmtD, nowLocalUTC, parseD, todayIso } from "../lib/dates";
import { KINDS, S } from "../state";
import { nowNext, todayOn, tripDays, walkMin } from "./bound";
import { placeLine, removeDocs, snapOf, write } from "./core";
import { armBtn, h, toast } from "./dom";
import { editEvent, editIdea, editInfo } from "./editors";
import { addBtn, dayEvents, kindBadge, note, stop } from "./parts";
import { render } from "./tabs";

export function voteCount(it){return Object.values(it.votes||{}).filter(Boolean).length}

const setView=v=>{S.week.view=v;try{localStorage.setItem("pw-week",v)}catch(e){}render();window.scrollTo(0,0)};

export function renderWeek(main){
  const ideas=S.week.view==="ideas";
  main.append(h("div",{class:"seg",role:"group","aria-label":"Show"},
    h("button",{type:"button","data-k":"week:days","aria-pressed":!ideas,onclick:()=>setView("days")},"Days"),
    h("button",{type:"button","data-k":"week:ideas","aria-pressed":ideas,onclick:()=>setView("ideas")},"Ideas",h("span",{class:"n",text:S.ideas.length||""}))));
  if(ideas)renderIdeas(main);else renderDays(main);
}

async function bulkDrafts(keep){
  const ds=S.events.filter(e=>e.draft);
  if(!keep){await removeDocs(ds.map(e=>snapOf("events",e)),`Removed ${ds.length} suggestions`);return}
  for(const e of ds){const ok=await write(()=>S.db.doc("events/"+e.id).update({draft:false}));if(!ok)return}
  toast(`Kept ${ds.length} items`);
}

function daySection(d,today,now){
  const dt=parseD(d),label=`${EN[dt.getUTCDay()]} ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`,isToday=d===today,evs=dayEvents(d);
  return h("section",{class:"day"+(isToday?" is-today":""),id:anchor(d),"aria-labelledby":"h-"+anchor(d)},
    h("div",{class:"day-head"},h("h2",{id:"h-"+anchor(d)},label,isToday&&h("span",{class:"tag now",text:"Today"})),
      S.canWrite&&addBtn("Add",()=>editEvent({},{date:d}),"add:day:"+d,`Add to ${label}`)),
    evs.length?h("ol",{class:"line"},evs.map(e=>stop(e,isToday?{now,current:nowNext(now).current?.e.id}:{}))):h("p",{class:"quiet-note",text:"Nothing planned yet."}));
}

function renderDays(main){
  const days=tripDays(),today=todayIso(),live=todayOn(),now=nowLocalUTC();
  if(!S.info.startDate){main.append(note("sus","Set the trip dates to lay out each day.",S.canWrite&&h("button",{class:"btn primary","data-k":"week:dates",onclick:editInfo},"Set the dates")));if(!days.length)return}
  const drafts=S.events.filter(e=>e.draft).length;
  if(drafts&&S.canWrite)main.append(h("div",{class:"banner"},h("p",{text:`${drafts} suggested item${drafts===1?"":"s"}, marked with a dashed stop. Keep what you like.`}),
    h("div",{class:"banner-acts"},h("button",{class:"btn small","data-k":"drafts:keep",onclick:()=>bulkDrafts(true)},"Keep all"),armBtn(h("button",{class:"btn small quiet danger","data-k":"drafts:remove"},"Remove all"),"Tap again to remove",()=>bulkDrafts(false)))));
  // The station strip: every day as a stop; tap one to go there.
  main.append(h("nav",{class:"stations","aria-label":"Days"},h("ol",null,days.map(d=>{const dt=parseD(d),n=dayEvents(d).length;
    return h("li",{class:(d===today?"today":"")+(d<today&&live?" past":"")},h("a",{href:"#"+anchor(d),"data-k":"day:"+d,"aria-label":`${fmtD(d)}, ${n} item${n===1?"":"s"}`,onclick:e=>{e.preventDefault();const el=document.getElementById(anchor(d)),fold=el?.closest("details");if(fold)fold.open=true;el?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"})}},
      h("span",{class:"wd",text:EN[dt.getUTCDay()]}),h("span",{class:"n",text:dt.getUTCDate()}),h("span",{class:"dots","aria-hidden":"true"},Array.from({length:Math.min(n,4)},()=>h("i")))))}))));
  // During the trip the days still to come lead; finished days fold away at the end.
  const ahead=live?days.filter(d=>d>=today):days,past=live?days.filter(d=>d<today):[];
  for(const d of ahead)main.append(daySection(d,today,now));
  if(past.length)main.append(h("details",{class:"earlier"},h("summary",null,`Earlier this week · ${past.length} day${past.length===1?"":"s"}`),h("div",{class:"earlier-days"},past.map(d=>daySection(d,today,now)))));
}

/** An idea: vote, what and where, and a button to put it on a day. `compact` keeps just the essentials (Today). */
export function ideaRow(it,o: any = {}){
  const mine=!!(S.uid&&it.votes&&it.votes[S.uid]),k=KINDS[it.kind]?it.kind:"food",n=voteCount(it);
  const site=it.link&&/^https?:\/\//i.test(it.link)&&h("a",{href:it.link,target:"_blank",rel:"noopener",title:it.link.replace(/^https?:\/\/(www\.)?/,""),text:"Website"});
  const planIt=()=>editEvent({},{title:it.title,kind:it.kind,notes:it.notes,location:it.location,lat:it.lat,lng:it.lng,fromIdea:it.id});
  return h("li",{class:"row idea"+(o.compact?" compact":"")},
    h("button",{class:"vote",type:"button","data-k":"vote:"+it.id,"aria-pressed":mine,"aria-label":`${mine?"Voted":"Vote"} for ${it.title} (${n} vote${n===1?"":"s"})`,disabled:!S.canWrite||!S.uid,
      onclick:()=>write(()=>S.db.doc("ideas/"+it.id).update({votes:{[S.uid]:!mine}}))},h("span",{class:"v",text:n}),h("span",{class:"l",text:mine?"voted":"vote"})),
    h("div",{class:"idea-main"},
      h("div",{class:"idea-ti"},kindBadge(k),h("span",{text:it.title})),
      o.compact?(walkMin(it)!=null&&h("p",{class:"idea-meta",text:`${it.location?it.location+" · ":""}~${walkMin(it)} min walk`})):placeLine(it,null,site),
      !o.compact&&it.notes&&h("p",{class:"idea-note",text:it.notes}),
      it.scheduled&&h("p",{class:"idea-meta planned",text:`On the plan: ${fmtD(it.scheduled)}`}),
      S.canWrite&&h("div",{class:"idea-acts"},h("button",{class:"btn small","data-k":"plan:"+it.id,onclick:planIt},it.scheduled?"Plan again":"Plan it"),!o.compact&&h("button",{class:"btn small quiet","data-k":"edit:ideas:"+it.id,onclick:()=>editIdea(it)},"Edit"))));
}

function renderIdeas(root){
  // The hint, the type filters and the list are one block.
  const main=h("section",{class:"sec","aria-label":"Ideas"});root.append(main);
  main.append(h("p",{class:"hint",text:"Vote for what you'd go to. Plan it puts an idea on a day."}));
  const present=Object.keys(KINDS).filter(k=>S.ideas.some(i=>i.kind===k));
  if(present.length>1){if(S.ideaFilter!=="all"&&!present.includes(S.ideaFilter))S.ideaFilter="all";
    main.append(h("div",{class:"filters",role:"group","aria-label":"Type"},[["all","All"],...present.map(k=>[k,KINDS[k]])].map(([k,l])=>h("button",{type:"button","data-k":"filter:"+k,"aria-pressed":S.ideaFilter===k,onclick:()=>{S.ideaFilter=k;render()}},
      k==="all"?null:kindBadge(k),l,h("span",{class:"n",text:k==="all"?S.ideas.length:S.ideas.filter(i=>i.kind===k).length})))))}
  const ideas=S.ideas.filter(i=>S.ideaFilter==="all"||i.kind===S.ideaFilter).sort((a,b)=>voteCount(b)-voteCount(a)||(walkMin(a)??99)-(walkMin(b)??99)||(a.title||"").localeCompare(b.title||""));
  if(!ideas.length){main.append(note("sus","No ideas yet. Suggest the first place worth going to.",S.canWrite&&h("button",{class:"btn primary","data-k":"idea:first",onclick:()=>editIdea()},"Suggest an idea")));return}
  main.append(h("ul",{class:"rows"},ideas.map(it=>ideaRow(it))));
}
