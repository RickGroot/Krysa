/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { hasCoords } from "../lib/geo";
import { S } from "../state";
import { walkMin } from "./bound";
import { armBtn, h, toast, toastAction } from "./dom";
import { render } from "./tabs";

export async function write(fn,okMsg?){if(!S.db){toast("Saving isn't available here");return false}try{await fn();if(okMsg)toast(okMsg);return true}catch(e){if(e&&e.code==="invalid_argument"&&!S._validated){S.canWrite=false;render();toast("View only. Reload and enter the trip code to make changes.")}else if(e&&e.code==="quota_exceeded"){toast("The planner is full, delete a few old items")}else{toast(navigator.onLine===false?"You're offline, so that didn't save.":"Couldn't save, try again")}return false}}

export function placeLine(it){
  if(!it.location&&!hasCoords(it))return null;
  const dest=it.location?`${it.location}, Praha`:`${it.lat},${it.lng}`;
  const m=walkMin(it),far=m!=null&&m>35;
  const origin=(S.info.hotelAddress||"Staroměstské náměstí, Praha 1")+", Czechia";
  const route=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=${far?"transit":"walking"}`;
  const map=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
  const stop=e=>e.stopPropagation();
  return h("div",{class:"place"},it.location&&h("span",{text:it.location}),
    m!=null&&h("span",{class:"walk",text:far?"far · metro/tram":`~${m} min walk`}),
    h("a",{href:route,target:"_blank",rel:"noopener",onclick:stop},"Route"),
    h("a",{href:map,target:"_blank",rel:"noopener",onclick:stop},"Map"));
}

let sheetN=0;

export function openSheet({title,fields,onSave,onDelete=null,saveLabel="Save"}: any){
  const scrim=h("div",{class:"scrim",onclick:e=>{if(e.target===scrim)close()}});
  const close=()=>{scrim.remove();document.removeEventListener("keydown",esc)};
  const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const tid="sheet-t"+(++sheetN);
  // role=alert from the start, so a message set later is announced.
  const err=h("div",{class:"err",id:tid+"-err",role:"alert"});
  const get={},els={};
  const mk=f=>{const id="f-"+f.id;let el;const done=x=>(els[f.id]=el,x);
    if(f.type==="checks"){el=h("div",{class:"checks",id},f.options.map(([v,l])=>h("label",null,h("input",{type:"checkbox",value:v,checked:(f.value||[]).includes(v)}),l)));
      get[f.id]=()=>[...el.querySelectorAll("input:checked")].map(x=>x.value);return done(h("div",{class:"field"},h("span",{class:"lbl",text:f.label}),el))}
    if(f.type==="select"){el=h("select",{id,required:f.req},f.options.map(([v,l])=>h("option",{value:v,selected:String(f.value??"")===v},l)))}
    else if(f.type==="textarea"){el=h("textarea",{id,required:f.req,placeholder:f.placeholder||""});el.value=f.value||""}
    else{el=h("input",{id,type:f.type||"text",required:f.req,placeholder:f.placeholder||"",autocomplete:"off",inputmode:f.inputmode});el.value=f.value??""}
    get[f.id]=()=>el.value.trim();return done(h("div",{class:"field"},h("label",{for:id,text:f.label}),el))};
  const body=[];for(const f of fields){if(Array.isArray(f))body.push(h("div",{class:"grid2"},f.map(mk)));else body.push(mk(f))}
  const del=onDelete?armBtn(h("button",{class:"btn danger ghost",type:"button"},"Delete"),"Tap again to delete",async()=>{if(await onDelete())close()}):null;
  // onSave returns a message, or {msg, field} to point at the field that needs fixing.
  const fail=(msg,field)=>{err.textContent=msg;const el=els[field];const t=el&&(el.matches("input,select,textarea")?el:el.querySelector("input"));if(t){t.setAttribute("aria-invalid","true");t.setAttribute("aria-describedby",err.id);t.focus()}};
  const form=h("form",{class:"sheet","aria-labelledby":tid,novalidate:true,onsubmit:async e=>{e.preventDefault();form.querySelectorAll("[aria-invalid]").forEach(x=>{x.removeAttribute("aria-invalid");x.removeAttribute("aria-describedby")});
    const v={};for(const k in get)v[k]=get[k]();const r=await onSave(v);if(typeof r==="string")fail(r,null);else if(r&&typeof r==="object")fail(r.msg,r.field);else if(r!==false)close()}},
    h("h3",{id:tid,text:title}),...body,err,
    h("div",{class:"sheetacts"},del,h("div",{class:"r"},h("button",{class:"btn ghost",type:"button",onclick:close},"Cancel"),h("button",{class:"btn primary",type:"submit"},saveLabel))));
  scrim.append(form);document.body.append(scrim);
  const first=form.querySelector("input,select,textarea");if(first&&matchMedia("(pointer:fine)").matches)first.focus();
}

export const snapOf=(col,obj)=>{const {id,...data}=obj;return {col,id,data}};

export async function removeDocs(items,msg,opts: any = {}){
  const done=[];
  for(const it of items){const ok=await write(()=>S.db.doc(it.col+"/"+it.id).delete());if(!ok)break;done.push(it)}
  if(!done.length)return false;
  let expired=false;
  const t=toastAction(msg,"Undo",async()=>{for(const it of done)await write(()=>S.db.doc(it.col+"/"+it.id).set(it.data));toast(done.length>1?`Restored ${done.length} items`:"Restored")});
  t.addEventListener("expire",()=>{if(expired||t._undone)return;expired=true;if(opts.onExpire)opts.onExpire()});
  return true;
}
