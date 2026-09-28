/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


export const FOCUSABLE='button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export function trapFocus(root){
  const prev=document.activeElement;
  if(!root.hasAttribute("role"))root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
  // getClientRects, not offsetParent: fixed-position buttons (the lightbox's Close) have no offsetParent.
  const onKey=e=>{if(e.key!=="Tab")return;const f=[...root.querySelectorAll(FOCUSABLE)].filter(x=>x.getClientRects().length>0||x===document.activeElement);if(!f.length)return;const first=f[0],last=f[f.length-1];
    if(!root.contains(document.activeElement)){e.preventDefault();first.focus();return}
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};
  root.addEventListener("keydown",onKey);
  setTimeout(()=>{if(!root.contains(document.activeElement)){if(!root.hasAttribute("tabindex"))root.setAttribute("tabindex","-1");root.focus({preventScroll:true})}},30);
  // Back to the opener; if a re-render replaced it, to its twin with the same data-k, else to <main>.
  const key=prev&&prev.closest&&prev.closest("[data-k]")?.dataset.k;
  return ()=>{root.removeEventListener("keydown",onKey);const to=prev&&document.contains(prev)?prev:(key&&document.querySelector(`[data-k="${CSS.escape(key)}"]`))||document.getElementById("main");if(to&&to.focus)try{to.focus({preventScroll:true})}catch(e){}};
}

export function setBackgroundInert(on){for(const el of document.querySelectorAll(".stage,.wrap,nav.tabs,#fab"))el.inert=on}

new MutationObserver(ms=>{const rel=[];let added: any=false;for(const m of ms){m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.matches(".scrim,.lightbox,.ratv,.wrapped"))added=n});m.removedNodes.forEach(n=>{if(n.nodeType===1&&n._release){rel.push(n._release);n._release=null}})}
  if(!added&&!rel.length)return;
  setBackgroundInert(!!document.querySelector("body>.scrim,body>.lightbox,body>.ratv,body>.wrapped"));
  rel.forEach(f=>f());
  if(added)added._release=trapFocus(added.querySelector(".sheet")||added)}).observe(document.body,{childList:true});
