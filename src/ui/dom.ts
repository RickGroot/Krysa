/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


/** Attribute text for k, or null to leave it off: ARIA states read "true"/"false", other booleans are presence flags. */
export const attrValue=(k: string, v: any): string|null=>v==null?null:k.startsWith("aria-")?String(v):v===false?null:v===true?"":String(v);

/** Children at any depth, minus the empties h() skips. */
export const flatKids=(kids: any[]): any[]=>kids.flat(Infinity).filter(c=>c!=null&&c!==false&&c!=="");

// `true` also sets the matching property: a script-made <video muted> is only really muted that way.
export const h=(tag: string, attrs?: any, ...kids: any[]): any=>{const el=document.createElement(tag);for(const[k,v]of (Object.entries(attrs||{}) as [string, any][])){if(k==="class"||k==="text"||k.startsWith("on")){if(v==null||v===false)continue;if(k==="class")el.className=v;else if(k==="text")el.textContent=v;else el.addEventListener(k.slice(2),v);continue}const s=attrValue(k,v);if(s==null)continue;el.setAttribute(k,s);if(v===true&&typeof el[k]==="boolean")el[k]=true}for(const c of flatKids(kids))el.append(c.nodeType?c:document.createTextNode(String(c)));return el};

// Toasts go into the dialog on top when one is open: everything below it is inert and hidden behind it.
const toastHost=()=>[...document.querySelectorAll("dialog.ov[open]")].pop()||document.body;

export function toast(msg){const t=h("div",{class:"toast",role:"status",text:msg});toastHost().append(t);setTimeout(()=>t.remove(),2200)}

/** The app behind the trip-code screen: out of reach for taps, Tab and screen readers. */
export function shellInert(on){for(const el of document.querySelectorAll(".skip,.stage,.wrap,nav.tabs,#fab"))el.inert=on}

export const SVGNS="http://www.w3.org/2000/svg";

export function svg(markup: string, vb: string): any {const el=document.createElementNS(SVGNS,"svg");el.setAttribute("viewBox",vb);el.setAttribute("aria-hidden","true");el.innerHTML=markup;return el}

/** Runs build(), which replaces what is inside root, then puts focus back where it was: on the element with the same data-k, else on its neighbour, else on root. */
export function keepFocus(root,build){
  const a: any=document.activeElement,was=!!root&&a!==root&&root.contains(a),k=was&&a.closest("[data-k]")?.dataset.k;
  const keys=k?[...root.querySelectorAll("[data-k]")].map(e=>e.dataset.k):[],sel=k&&"selectionStart" in a?[a.selectionStart,a.selectionEnd]:null;
  build();
  if(!was)return;
  const all=[...root.querySelectorAll("[data-k]")],el=(k&&(all.find(e=>e.dataset.k===k)||all[Math.min(keys.indexOf(k),all.length-1)]))||root;
  el.focus({preventScroll:true});if(sel&&el.setSelectionRange)try{el.setSelectionRange(sel[0],sel[1])}catch(e){}
}

/** A button that asks for a second tap: the first arms it and shows `label`; it disarms after `ms` or when focus leaves. */
export function armBtn(btn,label,fn,ms=4000){let armed=false,t,idle="";
  const disarm=()=>{armed=false;clearTimeout(t);btn.textContent=idle;btn.classList.remove("armed")};
  btn.addEventListener("click",async e=>{if(!armed){armed=true;idle=btn.textContent;btn.textContent=label;btn.classList.add("armed");t=setTimeout(disarm,ms);return}disarm();await fn(e)});
  btn.addEventListener("blur",()=>{if(armed)disarm()});
  return btn}

export const reduced=()=>{try{return matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){return false}};

// An action toast (Undo) stays 10 s, and waits while a pointer or keyboard focus is on it (WCAG 2.2.1).
export function toastAction(msg,label,fn,ms=10000){
  document.querySelectorAll(".toast.act").forEach(t=>{clearTimeout(t._t);t.dispatchEvent(new Event("expire"));t.remove()});
  const t=h("div",{class:"toast act",role:"status"},h("span",{text:msg}),h("button",{class:"tbtn",type:"button",onclick:()=>{clearTimeout(t._t);t._undone=true;t.remove();fn()}},label));
  let left=ms,since=0,paused=false,over=false,focus=false;
  const run=()=>{since=Date.now();t._t=setTimeout(()=>{t.dispatchEvent(new Event("expire"));t.remove()},left)};
  const sync=()=>{const hold=over||focus;if(hold&&!paused){paused=true;clearTimeout(t._t);left=Math.max(1500,left-(Date.now()-since))}else if(!hold&&paused){paused=false;run()}};
  t.addEventListener("pointerenter",()=>{over=true;sync()});t.addEventListener("pointerleave",()=>{over=false;sync()});
  t.addEventListener("focusin",()=>{focus=true;sync()});t.addEventListener("focusout",()=>{focus=false;sync()});
  toastHost().append(t);run();return t;
}
