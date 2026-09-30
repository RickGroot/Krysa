/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
// Renders the current tab: the band, the tab bar's state, the add button, then the tab's own screen.
import { todayIso } from "../lib/dates";
import { S } from "../state";
import { todayOn } from "./bound";
import { h, keepFocus } from "./dom";
import { editEvent, editExpense, editIdea } from "./editors";
import { icon } from "./icons";
import { postRat } from "./maker";
import { renderMoney } from "./money";
import { watchAnims } from "./perf";
import { paintStage } from "./stage";
import { todayBadge } from "./timely";
import { renderToday } from "./today";
import { renderTrip } from "./trip";
import { renderRats } from "./wall";
import { renderWeek } from "./week";

const planToday=()=>editEvent({},todayOn()?{date:todayIso()}:{});

// The one add button: what it adds follows the tab (and on Week, the view). Trip adds from its own sections.
const ADD={today:()=>["Add plan",planToday],week:()=>S.week.view==="ideas"?["Suggest idea",()=>editIdea()]:["Add plan",planToday],rats:()=>["Post a rat",()=>postRat()],money:()=>["Log expense",()=>editExpense()]};

export const addAction=()=>ADD[S.tab]?.();

// Data from other phones can arrive in bursts: render at most once a frame, and rebuild the page only when the
// tab shows what changed. The band, badges and tab bar always update; a plain render() still rebuilds everything.
const DEPS={today:["events","info","flights","todos","people","ideas","rats","expenses"],week:["events","ideas","info"],rats:["rats"],money:["expenses","people","info"],trip:["flights","todos","people","info"]};
let frame=0;const pending=new Set();
export function scheduleRender(col){pending.add(col);frame||=requestAnimationFrame(()=>{frame=0;const cols=[...pending];pending.clear();render(cols)})}

export function render(only?){
  if(frame){cancelAnimationFrame(frame);frame=0;pending.clear()}
  const open=S.todos.filter(t=>!t.done).length;
  document.getElementById("c-trip").textContent=open?String(open):"";document.getElementById("c-trip-sr").textContent=open?`, ${open} open to-do${open===1?"":"s"}`:"";
  const fab=document.getElementById("fab"),add=addAction();fab.hidden=!add||!S.canWrite||!S.loaded;
  if(add&&fab.dataset.label!==add[0]){fab.dataset.label=add[0];fab.replaceChildren(icon("plus"),h("span",{text:add[0]}))}
  document.querySelectorAll("nav.tabs button[data-tab]").forEach(b=>{if(b.dataset.tab===S.tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  paintStage();todayBadge();
  if(only&&S.loaded&&!only.some(c=>DEPS[S.tab]?.includes(c)))return;
  // Rebuilt on every change; keepFocus puts focus back on the same control (by its data-k).
  const main=document.getElementById("main");
  keepFocus(main,()=>{main.replaceChildren();
    if(!S.loaded){main.append(S.db===false?h("p",{class:"quiet-note",text:"The rats couldn't load the plan. Check your connection and reload."}):h("div",{class:"skel","aria-label":"Loading the plan"},h("i"),h("i"),h("i")));return}
    ({today:renderToday,week:renderWeek,rats:renderRats,money:renderMoney,trip:renderTrip})[S.tab](main);
    if(!S.canWrite)main.append(h("p",{class:"quiet-note readonly",text:"View only. Reload and enter the trip code to make changes."}));
  });
  if(S.loaded)requestAnimationFrame(watchAnims);
}
