/* eslint-disable */
import { krysa } from "../art/rat";
import { startTab } from "../lib/schedule";
import { S, TABS, TAB_ALIAS } from "../state";
import { h } from "./dom";
import { iconHTML } from "./icons";
import { syncPush } from "./push";
import { goTab } from "./stage";
import { addAction, render, scheduleRender } from "./tabs";
import type { Runtime } from "../data/runtime";

export function boot(RUNTIME: Runtime){
document.querySelectorAll("nav.tabs [data-icon]").forEach((el: any)=>{el.innerHTML=iconHTML(el.dataset.icon)});
document.querySelectorAll("nav.tabs button[data-tab]").forEach(b=>b.addEventListener("click",()=>goTab(b.dataset.tab)));
document.getElementById("fab").addEventListener("click",()=>addAction()?.[1]());
// The start tab: a #link (or a tapped notification), else this session's pick, else Today.
S.tab=startTab({hash:location.hash.slice(1),saved:S.savedTab},TABS,TAB_ALIAS);
// A tapped notification (public/sw.js) asks the open app to show its tab; the push function still uses the old names.
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const t=e.data&&e.data.krysaTab;if(typeof t==="string")goTab(t)});
// Offline the plan still shows (the last saved copy) but changes need a connection: say so.
const offline=()=>{let el=document.getElementById("offline");if(navigator.onLine){el?.remove();return}if(el)return;
  const k=h("span",{class:"kr","aria-hidden":"true"});k.append(krysa("sleep"));
  el=h("p",{class:"band-note",id:"offline",role:"status"},k,h("span",{text:"Offline. Showing the saved plan; changes need a connection."}));document.getElementById("band-notes").prepend(el)};
addEventListener("online",offline);addEventListener("offline",offline);offline();
render();
(async()=>{
  const claude:any=RUNTIME;
  const[db,user,assets,push]=await Promise.all([claude?.use?.("db")??null,claude?.use?.("user")??null,claude?.use?.("assets")??null,claude?.use?.("push")??null]);
  S.assets=assets||null;S.user=user||null;S.push=push||null;
  void syncPush();
  Promise.resolve(claude?.use?.("downloads")).then(d=>{S.downloads=d||null;if(S.loaded)render()}).catch(()=>{});
  if(!db){S.db=false;render();return}
  S.db=db;
  // Only the id is needed to start listening; the rest of the profile arrives in the background.
  if(user){S.uid=await user.id();Promise.all([user.isOwner(),user.me().catch(()=>null),user.can("data.write")]).then(([own,me,cw])=>{S.isOwner=own;if(me)S.meName=(me.name||"").trim().split(/\s+/)[0]||"";if(cw===false)S.canWrite=false;else if(cw===true)S._validated=true;render()}).catch(()=>{})}
  const cols=["events","ideas","todos","people","expenses","rats","flights"];
  let pending=cols.length+1;const ready=()=>{if(--pending===0)S.loaded=true;render()};
  const onErr=()=>{};
  let firstInfo=true;
  db.doc("trip/info").onSnapshot(s=>{S.info=s.exists?s.data():{};if(firstInfo){firstInfo=false;ready()}else scheduleRender("info")},onErr);
  for(const col of cols){let first=true;
    db.collection(col).onSnapshot(s=>{S[col]=s.docs.map(d=>({id:d.id,...d.data()}));if(first){first=false;ready()}else scheduleRender(col)},onErr);
  }
})();
}
