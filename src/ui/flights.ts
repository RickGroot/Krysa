/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { planeSvg } from "../art/scenes";
import { dtUTC, fmtD, fmtStamp, nowLocalUTC, parseD, todayIso } from "../lib/dates";
import { checkInRule } from "../lib/schedule";
import { S, pname } from "../state";
import { openSheet, removeDocs, snapOf, write } from "./core";
import { h, toast } from "./dom";

export const AIRPORTS={AMS:"Amsterdam",PRG:"Prague"};

export function copyBtn(text){const b=h("button",{class:"btn small ghost",type:"button",onclick:async()=>{try{await navigator.clipboard.writeText(text);toast("Copied "+text)}catch(e){toast("Couldn't copy. Select the code instead.")}}},"Copy");return b}

export function renderFlights(main){
  main.append(h("div",{class:"sectionhead"},h("p",{text:"Everyone's flights. Check-in and leave-for-the-airport reminders show up on the Rats page when it's time."}),S.canWrite&&h("button",{class:"btn primary small",onclick:()=>editFlight()},"+ Flight")));
  const groups: any={};for(const f of S.flights){const k=`${f.flight}|${f.date}`;(groups[k]=groups[k]||[]).push(f)}
  const list: any[]=Object.values(groups).sort((a,b)=>((a[0].date||"")+(a[0].dep||"")).localeCompare((b[0].date||"")+(b[0].dep||"")));
  if(!list.length){main.append(h("p",{class:"empty",text:"No flights yet. Add the first booking."}));return}
  const now=nowLocalUTC();
  for(const legs of list){
    const f=legs[0];const dep=dtUTC(f.date,f.dep),arr=dtUTC(f.date,f.arr);
    const dur=dep!=null&&arr!=null&&arr>dep?Math.round((arr-dep)/60000):null;
    const checkin=dep!=null?dep-checkInRule(f.airline).opensH*3600000:null;
    let state="",cls="";
    if(dep!=null){if(now>=(arr||dep))state="Landed";else if(now>=dep)state="In the air";else if(now>=checkin){state="Check-in open";cls=" open"}else{const days=Math.round((+parseD(f.date)-+parseD(todayIso()))/864e5);state=days<=0?"Today":days===1?"Tomorrow":`In ${days} days`}}
    const people=[...new Set(legs.flatMap(l=>Array.isArray(l.people)?l.people:[]))];
    const plane=h("div",{class:"fl-plane"});plane.append(planeSvg());
    main.append(h("section",{class:"flight"},
      h("div",{class:"fl-head"},h("div",{class:"fl-no"},f.flight||"Flight",h("small",{text:`${f.airline?f.airline+" · ":""}${fmtD(f.date)}`})),state&&h("span",{class:"fl-state"+cls,text:state})),
      h("div",{class:"fl-route"},
        h("div",{class:"fl-end"},h("div",{class:"code",text:f.from||"—"}),h("div",{class:"time",text:f.dep||""}),h("div",{class:"city",text:AIRPORTS[f.from]||""})),
        h("div",{class:"fl-line"},plane,dur&&h("div",{class:"fl-dur",text:`${Math.floor(dur/60)} h ${dur%60} min`})),
        h("div",{class:"fl-end to"},h("div",{class:"code",text:f.to||"—"}),h("div",{class:"time",text:f.arr||""}),h("div",{class:"city",text:AIRPORTS[f.to]||""}))),
      h("div",{class:"fl-meta"},
        h("div",null,h("div",{class:"k",text:"On board"}),h("div",{class:"v"},people.length?people.map(pname).join(", "):"Nobody yet")),
        checkin&&h("div",null,h("div",{class:"k",text:"Online check-in opens"}),h("div",{class:"v",text:fmtStamp(checkin)})),
        dep&&f.from==="PRG"&&h("div",null,h("div",{class:"k",text:"Be at the airport by"}),h("div",{class:"v",text:fmtStamp(dep-2*3600000)+" (desk closes "+fmtStamp(dep-40*60000).slice(-5)+")"})),
        dep&&f.to==="PRG"&&h("div",null,h("div",{class:"k",text:"Into town"}),h("div",{class:"v",text:"Allow about 45 min into town"}))),
      h("div",{class:"fl-book"},h("div",{class:"k",style:"font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)",text:"Bookings"}),
        legs.map(l=>h("div",{class:"bk"},maskedCode(l.booking),l.booking&&copyBtn(l.booking),h("span",{text:(Array.isArray(l.people)?l.people.map(pname).join(", "):"")+(l.note?" · "+l.note:"")}),S.canWrite&&h("button",{class:"btn small ghost",type:"button",onclick:()=>editFlight(l)},"Edit")))),
      h("div",{class:"fl-links"},h("a",{href:`https://www.google.com/search?q=${encodeURIComponent((f.flight||"")+" flight status")}`,target:"_blank",rel:"noopener",text:"Flight status"}),(()=>{const r=checkInRule(f.airline);return r.url?h("a",{href:r.url,target:"_blank",rel:"noopener",text:`Check in at ${f.airline.trim()}`}):null})())));
  }
}

export function editFlight(f: any = {}){
  const all=S.people.map(p=>[p.id,p.name||"Someone"]);
  openSheet({title:f.id?"Edit booking":"Add a flight booking",
    fields:[[{id:"flight",label:"Flight number",value:f.flight,placeholder:"AB1234"},{id:"date",label:"Date",type:"date",value:f.date}],
      [{id:"from",label:"From (airport code)",value:f.from||"AMS",placeholder:"AMS"},{id:"to",label:"To (airport code)",value:f.to||"PRG",placeholder:"PRG"}],
      [{id:"dep",label:"Departs",type:"time",value:f.dep},{id:"arr",label:"Lands",type:"time",value:f.arr}],
      [{id:"booking",label:"Booking code",value:f.booking,placeholder:"ABC123"},{id:"airline",label:"Airline",value:f.airline||"",placeholder:"KLM"}],
      {id:"note",label:"Note",value:f.note,placeholder:"Booked via the travel desk, seat 12A…"},
      {id:"people",label:"Who's on this booking",type:"checks",options:all,value:f.people||[]}],
    onSave:v=>{if(!/^[A-Za-z0-9 ]{2,10}$/.test(v.flight))return"Add a flight number like AB1234";if(!v.date)return"Pick the date";
      const data: any={flight:v.flight.toUpperCase().replace(/\s+/g,""),date:v.date,from:v.from.toUpperCase().slice(0,4),to:v.to.toUpperCase().slice(0,4),dep:v.dep,arr:v.arr,booking:v.booking.toUpperCase(),airline:v.airline,note:v.note,people:v.people};
      if(f.id)return write(()=>S.db.doc("flights/"+f.id).update(data),"Saved");
      return write(()=>S.db.collection("flights").add(data),"Flight added")},
    onDelete:f.id?()=>removeDocs([snapOf("flights",f)],"Booking removed"):null});
}

export function maskedCode(code){
  if(!code)return h("code",{text:"—"});
  const dots="•".repeat(Math.min(code.length,6));const c=h("code",{text:dots});let shown=false,t;
  const b=h("button",{class:"btn small ghost",type:"button","aria-label":"Show booking code",onclick:()=>{shown=!shown;c.textContent=shown?code:dots;b.textContent=shown?"Hide":"Show";clearTimeout(t);if(shown)t=setTimeout(()=>{shown=false;c.textContent=dots;b.textContent="Show"},20000)}},"Show");
  return h("span",{style:"display:inline-flex;gap:4px;align-items:center"},c,b);
}
