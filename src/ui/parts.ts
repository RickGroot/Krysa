/* eslint-disable */
// Building blocks the tabs share: line badges, section heads, a stop on the route line, empty states.
import { krysa } from "../art/rat";
import { eventWindow } from "../lib/schedule";
import { KINDS, S, kindOf } from "../state";
import { placeLine, removeDocs, snapOf, write } from "./core";
import { h } from "./dom";
import { editEvent } from "./editors";
import { icon } from "./icons";

/** A plan type as a line badge: the type's colour and icon, named for screen readers. */
export const kindBadge=k=>{k=KINDS[k]?k:"work";return h("span",{class:"lb k-"+k,role:"img","aria-label":KINDS[k]},icon(k))};

/** A section's heading, with its own button beside it. */
export const secHead=(title,action?,id?)=>h("div",{class:"sec-head"},h("h2",{id,text:title}),action||null);

export const addBtn=(label,onclick,key,aria?)=>h("button",{class:"btn small quiet add",type:"button","data-k":key,"aria-label":aria||null,onclick},icon("plus"),label);

/** Krysa beside an empty or finished list, with the one action that fills it. */
export const note=(pose,text,action?)=>{const k=h("span",{class:"kr alive","aria-hidden":"true"});k.append(krysa(pose));return h("div",{class:"note"},k,h("div",null,h("p",{text}),action||null))};

/**
 * One stop on a day's line. On today's line, what's on now is marked (one item, the board's rule: the latest
 * that has started and not ended, `o.current`) and everything else that has started dims.
 * The title opens the item; its ::after covers the row, and Route and Map sit above it.
 */
export function stop(e,o: any = {}){
  const k=kindOf(e.kind),w=o.now!=null&&eventWindow(e);
  const state=w?(o.current===e.id?"now":w.s<=o.now?"past":""):"";
  const title=S.canWrite?h("button",{class:"st-open",type:"button","data-k":"ev:"+e.id,onclick:()=>editEvent(e)},e.title||"Untitled"):h("span",{text:e.title||"Untitled"});
  return h("li",{class:"stop"+(state?" "+state:"")+(e.draft?" draft":"")},
    h("span",{class:"st-time"},e.time?[h("span",{text:e.time}),e.endTime&&h("span",{class:"st-end",text:"–"+e.endTime})]:h("span",{class:"st-any",text:"any time"})),
    h("span",{class:"st-node","aria-hidden":"true"}),
    h("div",{class:"st-main"},
      h("div",{class:"st-title"},kindBadge(k),title,state==="now"&&h("span",{class:"tag now",text:"Now"}),e.draft&&h("span",{class:"tag",text:"Suggested"})),
      placeLine(e),
      e.notes&&h("p",{class:"st-note",text:e.notes}),
      e.draft&&S.canWrite&&h("div",{class:"st-acts"},
        h("button",{class:"btn small",type:"button","data-k":"keep:"+e.id,onclick:()=>write(()=>S.db.doc("events/"+e.id).update({draft:false}),"Kept")},"Keep"),
        h("button",{class:"btn small quiet danger",type:"button","data-k":"drop:"+e.id,onclick:()=>removeDocs([snapOf("events",e)],"Suggestion removed")},"Remove"))));
}

/** A day's stops in time order; items without a time go last. */
export const dayEvents=d=>S.events.filter(e=>e.date===d).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99"));
