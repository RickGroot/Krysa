/* eslint-disable */
// Trip: everything that isn't a day of the plan. Flights, to-dos, the stay, who's coming, Prague basics and settings.
import { fmtD, splitDT } from "../lib/dates";
import { S } from "../state";
import { placeLine, write } from "./core";
import { h, toast } from "./dom";
import { editInfo, editPerson, editTodo } from "./editors";
import { editFlight, renderFlights } from "./flights";
import { addBtn, note, secHead } from "./parts";
import { notifSection } from "./push";

export function fmtDT(s){if(!s)return"";const[d,t]=splitDT(s);return fmtD(d)+(t?" "+t:"")}

/** A to-do with its tick box. Ticking the last one gets a word from Krysa. */
export function todoRow(t){
  const text=S.canWrite?h("button",{class:"row-open",type:"button","data-k":"edit:todos:"+t.id,onclick:()=>editTodo(t)},t.text):h("span",{text:t.text});
  return h("li",{class:"row todo"+(t.done?" done":"")},
    h("input",{type:"checkbox",class:"check",id:"todo-"+t.id,"data-k":"todo:"+t.id,checked:!!t.done,disabled:!S.canWrite,"aria-label":t.text,onchange:e=>{const d=e.target.checked;
      write(()=>S.db.doc("todos/"+t.id).update({done:d})).then(ok=>{if(ok&&d&&!S.todos.some(x=>!x.done&&x.id!==t.id))toast("All done. Krysa is impressed.")})}}),
    h("div",{class:"row-main"},h("div",{class:"row-ti"},text),(t.owner||t.due)&&h("p",{class:"row-meta",text:[t.owner,t.due&&"by "+fmtD(t.due)].filter(Boolean).join(" · ")})));
}

const SPOTS=[["flights","Flights"],["todo","To-do"],["stay","Stay"],["people","People"],["basics","Prague basics"],["settings","Settings"]];

export function renderTrip(main){
  const i=S.info;
  main.append(h("nav",{class:"jump","aria-label":"On this page"},SPOTS.map(([id,l])=>h("a",{href:"#"+id,"data-k":"jump:"+id,onclick:e=>{e.preventDefault();document.getElementById(id)?.scrollIntoView({block:"start"})}},l))));
  // Flights
  const fl=h("section",{class:"sec",id:"flights","aria-labelledby":"flights-t"},secHead("Flights",S.canWrite&&addBtn("Flight",()=>editFlight(),"add:flight","Add a flight booking"),"flights-t"));
  renderFlights(fl);main.append(fl);
  // To-do
  const ts=[...S.todos].sort((a,b)=>(a.done-b.done)||(a.due||"9").localeCompare(b.due||"9"));
  main.append(h("section",{class:"sec",id:"todo","aria-labelledby":"todo-t"},secHead("To-do",S.canWrite&&addBtn("To-do",()=>editTodo(),"add:todo","Add a to-do"),"todo-t"),
    ts.length?h("ul",{class:"rows"},ts.map(todoRow)):note("sus","Nothing to do. The rats are suspicious.")));
  // Stay
  const kv=[["Trip",i.title],["Dates",i.startDate&&i.endDate?`${fmtD(i.startDate)} – ${fmtD(i.endDate)}`:"Not set yet"],["Stay",i.hotelName],["Address",i.hotelAddress],["Check-in / out",[i.checkIn,i.checkOut].filter(Boolean).join(" / ")],["Booking / key",i.booking],["Work location",i.workBase],["Notes",i.notes]].filter(([,v])=>v);
  main.append(h("section",{class:"sec",id:"stay","aria-labelledby":"stay-t"},secHead("Stay",S.canWrite&&h("button",{class:"btn small quiet","data-k":"edit:info",onclick:editInfo},"Edit"),"stay-t"),
    h("div",{class:"stay"},h("dl",{class:"kv"},kv.flatMap(([k,v])=>[h("dt",{text:k}),h("dd",{text:v})])),i.hotelAddress&&placeLine({location:i.hotelAddress}))));
  // People
  const ppl=[...S.people].sort((a,b)=>(a.arrive||"9").localeCompare(b.arrive||"9"));
  main.append(h("section",{class:"sec",id:"people","aria-labelledby":"people-t"},secHead("People",S.canWrite&&addBtn("Add",()=>editPerson(),"add:person","Add a traveller"),"people-t"),
    ppl.length?h("ul",{class:"rows"},ppl.map(p=>h("li",{class:"row person"},
      h("div",{class:"row-main"},h("div",{class:"row-ti"},S.canWrite?h("button",{class:"row-open",type:"button","data-k":"edit:people:"+p.id,onclick:()=>editPerson(p)},p.name||"Someone"):h("span",{text:p.name||"Someone"})),
        (p.arrive||p.arriveBy)&&h("p",{class:"row-meta",text:"In: "+[fmtDT(p.arrive),p.arriveBy].filter(Boolean).join(" · ")}),
        (p.depart||p.departBy)&&h("p",{class:"row-meta",text:"Out: "+[fmtDT(p.depart),p.departBy].filter(Boolean).join(" · ")}),
        p.notes&&h("p",{class:"row-meta",text:p.notes})),
      p.phone&&h("a",{class:"btn small call",href:"tel:"+p.phone.replace(/[^\d+]/g,""),"aria-label":`Call ${p.name||"them"}`},"Call"))))
    :note("sus","Add everyone with their flight times so the pickups line up.")));
  // Prague basics
  main.append(h("section",{class:"sec",id:"basics","aria-labelledby":"basics-t"},secHead("Prague basics",null,"basics-t"),h("ul",{class:"tips"},
    h("li",null,h("b",{text:"Money"}),"Czech koruna (CZK, Kč). Cards work almost everywhere; pay in CZK when a terminal offers a currency choice."),
    h("li",null,h("b",{text:"Transport"}),"Trams, metro and buses share one PID ticket. Buy it in the PID Lítačka app and activate it before boarding."),
    h("li",null,h("b",{text:"To FrontKon"}),"Walk to Můstek (about 5 min), metro B towards Černý Most, get off at Českomoravská (6 stops). O2 Universum is next to the station."),
    h("li",null,h("b",{text:"From the airport"}),"Buses link the airport to the metro on a regular PID ticket, or take a taxi or ride-hailing car to Old Town."),
    h("li",null,h("b",{text:"Emergency"}),h("a",{class:"lnk",href:"tel:112",text:"112"})),
    h("li",null,h("b",{text:"Useful words"}),h("span",{lang:"cs",text:"Dobrý den"})," (hello) · ",h("span",{lang:"cs",text:"Děkuji"})," (thanks) · ",h("span",{lang:"cs",text:"Pivo"})," (beer) · ",h("span",{lang:"cs",text:"Účet, prosím"})," (the bill, please)"))));
  // Settings
  main.append(h("section",{class:"sec",id:"settings","aria-labelledby":"settings-t"},secHead("Settings",null,"settings-t"),notifSection()));
}

