/* eslint-disable */
import { krysa } from "../art/rat";
import { startTab } from "../lib/schedule";
import { S, TABS } from "../state";
import { tripLive } from "./bound";
import { h } from "./dom";
import { ratSays, setupIdle } from "./idle";
import { syncPush } from "./push";
import { goTab, openMore } from "./stage";
import { ADD, render } from "./tabs";
import type { Runtime } from "../data/runtime";

export function boot(RUNTIME: Runtime){
document.querySelectorAll("nav.tabs button[data-tab]").forEach(b=>b.addEventListener("click",()=>goTab(b.dataset.tab)));
document.getElementById("more-btn").addEventListener("click",openMore);
document.getElementById("fab").addEventListener("click",()=>ADD[S.tab]?.[1]());
// The start tab: a #link, else this session's pick. Otherwise it waits for the trip dates (Plan while the trip is on),
// and the hero stays empty until then so the Rat Wall's scene doesn't flash first.
const hashTab=location.hash.slice(1),pickTab=()=>startTab({hash:hashTab,saved:S.savedTab,live:tripLive()},TABS);
S.tabReady=[hashTab,S.savedTab].some(t=>TABS.includes(t));S.tab=pickTab();
// A tapped notification (public/sw.js) asks the open app to show its tab.
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const t=e.data&&e.data.krysaTab;if(TABS.includes(t))goTab(t)});
document.getElementById("krysa").append(krysa("classic"));
document.getElementById("krysa").addEventListener("click",ratSays);
setupIdle();
// Offline the plan still shows (the last saved copy) but changes need a connection: say so.
const offline=()=>{let el=document.getElementById("offline");if(navigator.onLine){el?.remove();return}if(el)return;
  const k=h("span",{class:"kr","aria-hidden":"true"});k.append(krysa("sleep"));
  el=h("div",{class:"offline",id:"offline",role:"status"},k,h("span",{text:"Offline. Showing the saved plan; changes need a connection."}));document.querySelector(".stage-in").prepend(el)};
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
  db.doc("ratgame/scores").onSnapshot(s=>{const d=s.exists?s.data():{};S.scores={...(d.scores||{})};if(S.tab==="rats"&&S.loaded)render()},()=>{});
  const cols=["events","ideas","todos","people","expenses","rats","flights"];
  let pending=cols.length+1;const ready=()=>{if(--pending===0)S.loaded=true;render()};
  const onErr=()=>{};
  let firstInfo=true;
  db.doc("trip/info").onSnapshot(s=>{S.info=s.exists?s.data():{};if(firstInfo){firstInfo=false;if(!S.tabReady){S.tab=pickTab();S.tabReady=true}ready()}else render()},onErr);
  for(const col of cols){let first=true;
    db.collection(col).onSnapshot(s=>{S[col]=s.docs.map(d=>({id:d.id,...d.data()}));if(first){first=false;ready()}else render()},onErr);
  }
})();
}
