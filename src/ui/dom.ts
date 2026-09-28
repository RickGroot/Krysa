/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


/** Attribute text for k, or null to leave it off: ARIA states read "true"/"false", other booleans are presence flags. */
export const attrValue=(k: string, v: any): string|null=>v==null?null:k.startsWith("aria-")?String(v):v===false?null:v===true?"":String(v);

/** Children at any depth, minus the empties h() skips. */
export const flatKids=(kids: any[]): any[]=>kids.flat(Infinity).filter(c=>c!=null&&c!==false&&c!=="");

// `true` also sets the matching property: a script-made <video muted> is only really muted that way.
export const h=(tag: string, attrs?: any, ...kids: any[]): any=>{const el=document.createElement(tag);for(const[k,v]of (Object.entries(attrs||{}) as [string, any][])){if(k==="class"||k==="text"||k.startsWith("on")){if(v==null||v===false)continue;if(k==="class")el.className=v;else if(k==="text")el.textContent=v;else el.addEventListener(k.slice(2),v);continue}const s=attrValue(k,v);if(s==null)continue;el.setAttribute(k,s);if(v===true&&typeof el[k]==="boolean")el[k]=true}for(const c of flatKids(kids))el.append(c.nodeType?c:document.createTextNode(String(c)));return el};

export function toast(msg){const t=h("div",{class:"toast",role:"status",text:msg});document.body.append(t);setTimeout(()=>t.remove(),2200)}

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

export const reduced=()=>{try{return matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){return false}};

export function toastAction(msg,label,fn,ms=8000){
  document.querySelectorAll(".toast.act").forEach(t=>{clearTimeout(t._t);t.dispatchEvent(new Event("expire"));t.remove()});
  const t=h("div",{class:"toast act",role:"status"},h("span",{text:msg}),h("button",{class:"tbtn",type:"button",onclick:()=>{clearTimeout(t._t);t._undone=true;t.remove();fn()}},label));
  document.body.append(t);t._t=setTimeout(()=>{t.dispatchEvent(new Event("expire"));t.remove()},ms);return t;
}
