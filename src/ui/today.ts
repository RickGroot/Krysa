/* eslint-disable */
// Today: the one home. Before the trip it counts down and lists what to book and pack; during it, the departure
// board and today's line; after it, who still owes whom. The Rat Wall's latest is always one tap away.
import { EN, MON, isoD, nowLocalUTC, parseD, todayIso } from "../lib/dates";
import { splitFlights } from "../lib/schedule";
import { fmtCzk, fmtEur } from "../lib/money";
import { S, pname } from "../state";
import { balances, nowNext, rate, settle, todayOn, tripDays } from "./bound";
import { h } from "./dom";
import { editEvent, editInfo, editTodo } from "./editors";
import { flightRow } from "./flights";
import { addBtn, dayEvents, note, secHead, stop } from "./parts";
import { goTab } from "./stage";
import { board, headsUp } from "./timely";
import { todoRow } from "./trip";
import { ratStrip } from "./wall";
import { ideaRow, voteCount } from "./week";

const more=(label,tab,key)=>h("button",{class:"lnk more",type:"button","data-k":key,onclick:()=>goTab(tab)},label);

export function phase(){const a=S.info.startDate,b=S.info.endDate,t=todayIso();if(!a||!b)return"none";if(todayOn())return"live";return t<a?"before":t>b?"after":"live"}

export function renderToday(main){
  const p=phase(),now=nowLocalUTC(),today=todayIso();
  main.append(headsUp());
  if(p==="none"){main.append(note("sus","No trip dates yet. Set them and the week lays itself out.",S.canWrite&&h("button",{class:"btn primary","data-k":"today:dates",onclick:editInfo},"Set the dates")))}
  if(p==="live"||p==="before")main.append(board());
  if(p==="live"){
    const evs=dayEvents(today);
    main.append(h("section",{class:"sec","aria-labelledby":"line-t"},secHead("Today's line",S.canWrite&&addBtn("Add",()=>editEvent({},{date:today}),"add:today","Add to today"),"line-t"),
      evs.length?h("ol",{class:"line"},evs.map(e=>stop(e,{now,current:nowNext(now).current?.e.id}))):note("sus","Nothing planned today. Pick something from the ideas?",h("button",{class:"btn small","data-k":"today:ideas",onclick:()=>goTab("ideas")},"See the ideas"))));
    // In the evening, tomorrow's first stops, so nobody has to open the Week to see the morning.
    const tm=isoD(new Date(+parseD(today)+864e5));
    if(new Date(now).getUTCHours()>=17&&tripDays().includes(tm)){const d=parseD(tm),te=dayEvents(tm);
      main.append(h("section",{class:"sec","aria-labelledby":"tm-t"},secHead(`Tomorrow · ${EN[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`,null,"tm-t"),
        te.length?h("ol",{class:"line"},te.slice(0,4).map(e=>stop(e))):h("p",{class:"quiet-note",text:"Nothing planned yet."}),te.length>4&&more(`All ${te.length} in the Week`,"week","today:tm")))}
    const open=[...S.ideas].filter(i=>!i.scheduled).sort((a,b)=>voteCount(b)-voteCount(a)).slice(0,3);
    if(open.length)main.append(h("section",{class:"sec","aria-labelledby":"ig-t"},secHead("Up for grabs",more("All ideas","ideas","today:ideas-all"),"ig-t"),h("ul",{class:"rows"},open.map(it=>ideaRow(it,{compact:true})))));
  }
  if(p==="before"){
    const ts=S.todos.filter(t=>!t.done).sort((a,b)=>(a.due||"9").localeCompare(b.due||"9"));
    main.append(h("section",{class:"sec","aria-labelledby":"bf-t"},secHead("Before you go",S.canWrite&&addBtn("To-do",()=>editTodo(),"add:todo:today","Add a to-do"),"bf-t"),
      ts.length?h("ul",{class:"rows"},ts.slice(0,5).map(todoRow)):note("cheers","Everything's booked and ticked. Krysa approves."),ts.length>5&&more(`All ${ts.length} to-dos`,"todo","today:todos")));
    const {upcoming}=splitFlights(S.flights,now);
    if(upcoming.length)main.append(h("section",{class:"sec","aria-labelledby":"fl-t"},secHead("Flights",more("Details","flights","today:flights"),"fl-t"),h("ul",{class:"rows"},upcoming.slice(0,3).map(legs=>flightRow(legs,now)))));
  }
  if(p==="after"){const moves=settle(balances());
    main.append(h("section",{class:"sec","aria-labelledby":"st-t"},secHead("Settle up",more("The bill","money","today:money"),"st-t"),
      moves.length?h("ul",{class:"rows"},moves.map(m=>h("li",{class:"row"},h("p",{class:"row-main"},h("b",{text:pname(m.from)})," pays ",h("b",{text:pname(m.to)})),h("span",{class:"amt"},fmtCzk(m.amt),h("small",{text:` ≈ ${fmtEur(m.amt/rate())}`})))))
        :note("cheers","All square. Na shledanou, Praha.")))}
  main.append(ratStrip());
}
