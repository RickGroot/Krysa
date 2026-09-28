/* eslint-disable */
// Sheets and full-screen views are modal <dialog>s. The browser keeps the newest one on top, makes the
// page behind it inert, and sends Escape (or Android's back gesture) to the top one only.
import { h } from "./dom";

/**
 * Opens `content` in a modal dialog and returns {dlg, close}. Escape and a tap on the dim area around
 * the content run `onCancel` when given (to ask before throwing work away), else close.
 */
export function openOverlay({cls="scrim",label=null,labelledby=null,content,onCancel=null,onClose=null,backdrop=true}: any){
  const opener: any=document.activeElement,key=opener?.closest?.("[data-k]")?.dataset.k;
  let done=false,down=false;
  const dlg: any=h("dialog",{class:"ov "+cls,"aria-label":label,"aria-labelledby":labelledby},content);
  const close=()=>{if(done)return;done=true;
    // A toast shown from inside (the Undo after a delete) outlives the dialog.
    const host=[...document.querySelectorAll("dialog.ov[open]")].filter(d=>d!==dlg).pop()||document.body;
    dlg.querySelectorAll(".toast").forEach(t=>host.append(t));
    if(dlg.open)dlg.close();dlg.remove();onClose?.();
    // Back to the opener; if a re-render replaced it, to its twin with the same data-k, else to <main>.
    const to=opener&&document.contains(opener)?opener:(key&&document.querySelector(`[data-k="${CSS.escape(key)}"]`))||document.getElementById("main");
    try{to?.focus({preventScroll:true})}catch(e){}};
  const ask=()=>onCancel?onCancel():close();
  dlg.addEventListener("cancel",e=>{e.preventDefault();ask()});
  dlg.addEventListener("close",close);
  // A tap on the dim area; a drag that only ends there doesn't count.
  if(backdrop){dlg.addEventListener("pointerdown",e=>{down=e.target===dlg});dlg.addEventListener("click",e=>{if(down&&e.target===dlg)ask();down=false})}
  document.body.append(dlg);dlg.showModal();
  return {dlg,close};
}
