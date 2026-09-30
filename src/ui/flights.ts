/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { planeSvg } from "../art/scenes";
import { dtUTC, fmtD, fmtStamp, nowLocalUTC, parseD, todayIso } from "../lib/dates";
import { checkInRule, flightEnd, splitFlights } from "../lib/schedule";
import { S, pname } from "../state";
import { openSheet, removeDocs, snapOf, write } from "./core";
import { h, toast } from "./dom";
import { note } from "./parts";

export const AIRPORTS={AMS:"Amsterdam",PRG:"Prague"};

export function copyBtn(text,key?){const b=h("button",{class:"btn small quiet",type:"button","data-k":key,"aria-label":"Copy booking code",onclick:async()=>{try{await navigator.clipboard.writeText(text);toast("Booking code copied")}catch(e){toast("Couldn't copy. Show the code and select it instead.")}}},"Copy");return b}

/** Where a flight stands: landed, in the air, check-in open, or how many days to go. */
function flightState(f,now){
  const dep=dtUTC(f.date,f.dep),end=flightEnd(f);if(dep==null)return{text:""};
  if(end!=null&&now>=end)return{text:"Landed"};
  if(now>=dep)return{text:"In the air",cls:"air"};
  if(now>=dep-checkInRule(f.airline).opensH*3600000)return{text:"Check-in open",cls:"open"};
  const days=Math.round((+parseD(f.date)-+parseD(todayIso()))/864e5);return{text:days<=0?"Today":days===1?"Tomorrow":`In ${days} days`};
}

const people=legs=>[...new Set(legs.flatMap(l=>Array.isArray(l.people)?l.people:[]))];

/** One line for Today: number, when, where to, who. */
export function flightRow(legs,now){
  const f=legs[0],st=flightState(f,now),who=people(legs).map(pname).join(", ");
  return h("li",{class:"row flrow"},h("span",{class:"fl-no",text:f.flight||"Flight"}),
    h("div",{class:"row-main"},h("div",{class:"row-ti",text:`${f.from||"—"} → ${f.to||"—"} · ${fmtD(f.date)} ${f.dep||""}`}),who&&h("p",{class:"row-meta",text:who})),
    st.text&&h("span",{class:"state "+(st.cls||""),text:st.text}));
}

export function renderFlights(sec){
  const now=nowLocalUTC(),{upcoming,landed}=splitFlights(S.flights,now);
  if(!upcoming.length&&!landed.length){sec.append(note("sus","No flights yet. Add the first booking and Krysa watches the check-in times."));return}
  // What's still to come first, soonest on top; flights that have landed fold away at the end.
  sec.append(h("div",{class:"tickets"},upcoming.map(legs=>flightCard(legs,now))));
  if(landed.length)sec.append(h("details",{class:"earlier"},h("summary",null,`Landed · ${landed.length}`),h("div",{class:"tickets"},landed.map(legs=>flightCard(legs,now)))));
}

function flightCard(legs,now){
  const f=legs[0];const dep=dtUTC(f.date,f.dep),arr=dtUTC(f.date,f.arr);
  const dur=dep!=null&&arr!=null&&arr>dep?Math.round((arr-dep)/60000):null;
  const rule=checkInRule(f.airline),checkin=dep!=null?dep-rule.opensH*3600000:null,st=flightState(f,now);
  // The plane sits where the flight is: at the gate, on its way (by the clock), or landed.
  const plane=h("div",{class:"fl-plane"});plane.append(planeSvg());
  if(dep!=null)plane.style.setProperty("--p",String(arr!=null&&arr>dep?Math.min(1,Math.max(0,(now-dep)/(arr-dep))):now>=dep?1:0));
  const who=people(legs);
  return h("article",{class:"ticket","aria-label":`${f.flight||"Flight"} ${f.from||""} to ${f.to||""}, ${fmtD(f.date)}`},
    h("div",{class:"tk-head"},h("span",{class:"fl-no",text:f.flight||"Flight"}),h("span",{class:"tk-when",text:`${f.airline?f.airline+" · ":""}${fmtD(f.date)}`}),st.text&&h("span",{class:"state "+(st.cls||""),text:st.text})),
    h("div",{class:"tk-route"},
      h("div",{class:"tk-end"},h("span",{class:"code",text:f.from||"—"}),h("span",{class:"time",text:f.dep||""}),h("span",{class:"city",text:AIRPORTS[f.from]||""})),
      h("div",{class:"tk-line"},plane,dur&&h("span",{class:"tk-dur",text:`${Math.floor(dur/60)} h ${dur%60} min`})),
      h("div",{class:"tk-end to"},h("span",{class:"code",text:f.to||"—"}),h("span",{class:"time",text:f.arr||""}),h("span",{class:"city",text:AIRPORTS[f.to]||""}))),
    h("dl",{class:"tk-facts"},
      h("div",null,h("dt",{text:"On board"}),h("dd",{text:who.length?who.map(pname).join(", "):"Nobody yet"})),
      checkin&&h("div",null,h("dt",{text:"Online check-in"}),h("dd",{text:`opens ${fmtStamp(checkin)}`})),
      dep&&f.from==="PRG"&&h("div",null,h("dt",{text:"At the airport by"}),h("dd",{text:fmtStamp(dep-2*3600000)+` (desk closes ${fmtStamp(dep-rule.desksCloseMin*60000).slice(-5)})`})),
      dep&&f.to==="PRG"&&h("div",null,h("dt",{text:"Into town"}),h("dd",{text:"About 45 min from the airport"}))),
    h("div",{class:"tk-book"},legs.map(l=>h("div",{class:"bk"},h("span",{class:"bk-who"},h("small",{text:"Booking"}),(Array.isArray(l.people)&&l.people.length?l.people.map(pname).join(", "):"Nobody named")+(l.note?" · "+l.note:"")),
      l.booking?[maskedCode(l.booking,"code:"+l.id),copyBtn(l.booking,"copy:"+l.id)]:h("span",{class:"hint",text:"No booking code"}),S.canWrite&&h("button",{class:"btn small quiet",type:"button","data-k":"edit:flights:"+l.id,onclick:()=>editFlight(l)},"Edit")))),
    h("div",{class:"tk-links"},rule.url&&h("a",{class:"btn small primary",href:rule.url,target:"_blank",rel:"noopener",text:`Check in at ${f.airline.trim()}`}),
      h("a",{class:"btn small",href:`https://www.google.com/search?q=${encodeURIComponent((f.flight||"")+" flight status")}`,target:"_blank",rel:"noopener",text:"Flight status"})));
}

export function editFlight(f: any = {}){
  const all=S.people.map(p=>[p.id,p.name||"Someone"]);
  openSheet({title:f.id?"Edit booking":"Add a flight booking",
    fields:[[{id:"flight",label:"Flight number",req:true,value:f.flight,placeholder:"AB1234"},{id:"date",label:"Date",type:"date",req:true,value:f.date}],
      [{id:"from",label:"From (airport code)",value:f.from||"AMS",placeholder:"AMS"},{id:"to",label:"To (airport code)",value:f.to||"PRG",placeholder:"PRG"}],
      [{id:"dep",label:"Departs",type:"time",value:f.dep},{id:"arr",label:"Lands",type:"time",value:f.arr}],
      [{id:"booking",label:"Booking code",value:f.booking,placeholder:"ABC123"},{id:"airline",label:"Airline",value:f.airline||"",placeholder:"KLM"}],
      {id:"note",label:"Note",value:f.note,placeholder:"Booked via the travel desk, seat 12A…"},
      {id:"people",label:"Who's on this booking",type:"checks",options:all,value:f.people||[]}],
    onSave:v=>{if(!/^[A-Za-z0-9 ]{2,10}$/.test(v.flight))return{msg:"Add a flight number like AB1234",field:"flight"};if(!v.date)return{msg:"Pick the date",field:"date"};
      const data: any={flight:v.flight.toUpperCase().replace(/\s+/g,""),date:v.date,from:v.from.toUpperCase().slice(0,4),to:v.to.toUpperCase().slice(0,4),dep:v.dep,arr:v.arr,booking:v.booking.toUpperCase(),airline:v.airline,note:v.note,people:v.people};
      if(f.id)return write(()=>S.db.doc("flights/"+f.id).update(data),"Saved");
      return write(()=>S.db.collection("flights").add(data),"Flight added")},
    onDelete:f.id?()=>removeDocs([snapOf("flights",f)],"Booking removed"):null});
}

export function maskedCode(code,key?){
  if(!code)return h("code",{class:"bk-code",text:"—"});
  // Hidden until asked for, and again after 20 s. The dots mean nothing to a screen reader.
  const dots="•".repeat(Math.min(code.length,6));const c=h("code",{class:"bk-code",text:dots,"aria-hidden":"true"});let shown=false,t;
  const set=v=>{shown=v;c.textContent=v?code:dots;if(v)c.removeAttribute("aria-hidden");else c.setAttribute("aria-hidden","true");b.textContent=v?"Hide":"Show";b.setAttribute("aria-label",v?"Hide the booking code":"Show the booking code")};
  const b=h("button",{class:"btn small quiet",type:"button","data-k":key,"aria-label":"Show the booking code",onclick:()=>{set(!shown);clearTimeout(t);if(shown)t=setTimeout(()=>set(false),20000)}},"Show");
  return h("span",{class:"code-mask"},c,b);
}
