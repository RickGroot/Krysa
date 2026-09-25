/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


export const h=(tag: string, attrs?: any, ...kids: any[]): any=>{const el=document.createElement(tag);for(const[k,v]of (Object.entries(attrs||{}) as [string, any][])){if(v==null||v===false)continue;if(k==="class")el.className=v;else if(k==="text")el.textContent=v;else if(k.startsWith("on"))el.addEventListener(k.slice(2),v);else el.setAttribute(k,v===true?"":v)}for(const c of kids.flat()){if(c==null||c===false||c==="")continue;el.append(c.nodeType?c:document.createTextNode(String(c)))}return el};

export function toast(msg){const t=h("div",{class:"toast",role:"status",text:msg});document.body.append(t);setTimeout(()=>t.remove(),2200)}

export const SVGNS="http://www.w3.org/2000/svg";

export function svg(markup: string, vb: string): any {const el=document.createElementNS(SVGNS,"svg");el.setAttribute("viewBox",vb);el.setAttribute("aria-hidden","true");el.innerHTML=markup;return el}

export const reduced=()=>{try{return matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){return false}};

export function toastAction(msg,label,fn,ms=8000){
  document.querySelectorAll(".toast.act").forEach(t=>{clearTimeout(t._t);t.dispatchEvent(new Event("expire"));t.remove()});
  const t=h("div",{class:"toast act",role:"status"},h("span",{text:msg}),h("button",{class:"tbtn",type:"button",onclick:()=>{clearTimeout(t._t);t._undone=true;t.remove();fn()}},label));
  document.body.append(t);t._t=setTimeout(()=>{t.dispatchEvent(new Event("expire"));t.remove()},ms);return t;
}
