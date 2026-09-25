/* eslint-disable */
import { krysa } from "../art/rat";
import { S, TABS } from "../state";
import { editEvent, editExpense, editIdea, editPerson, editTodo } from "./editors";
import { editFlight } from "./flights";
import { ratSays, setupIdle } from "./idle";
import { postRat } from "./maker";
import { goTab, openMore } from "./stage";
import { render } from "./tabs";
import type { Runtime } from "../data/runtime";

export function boot(RUNTIME: Runtime){
document.querySelectorAll("nav.tabs button[data-tab]").forEach(b=>b.addEventListener("click",()=>goTab(b.dataset.tab)));
document.getElementById("more-btn").addEventListener("click",openMore);
document.getElementById("fab").addEventListener("click",()=>({plan:()=>editEvent(),ideas:()=>editIdea(),todo:()=>editTodo(),money:()=>editExpense(),info:()=>editPerson(),rats:()=>postRat(),flights:()=>editFlight()})[S.tab]());
if(TABS.includes(location.hash.slice(1)))S.tab=location.hash.slice(1);
document.getElementById("krysa").append(krysa("classic"));
document.getElementById("krysa").addEventListener("click",ratSays);
setupIdle();
render();
(async()=>{
  const claude:any=RUNTIME;
  const[db,user,assets]=await Promise.all([claude?.use?.("db")??null,claude?.use?.("user")??null,claude?.use?.("assets")??null]);
  S.assets=assets||null;S.user=user||null;
  Promise.resolve(claude?.use?.("downloads")).then(d=>{S.downloads=d||null;if(S.loaded)render()}).catch(()=>{});
  if(!db){S.db=false;render();return}
  S.db=db;
  if(user){S.uid=await user.id();S.isOwner=await user.isOwner();try{const me=await user.me();S.meName=(me.name||"").trim().split(/\s+/)[0]||""}catch(e){}const cw=await user.can("data.write");if(cw===false)S.canWrite=false;else if(cw===true)S._validated=true}
  db.doc("ratgame/scores").onSnapshot(s=>{const d=s.exists?s.data():{};S.scores={...(d.scores||{})};if(S.tab==="rats"&&S.loaded)render()},()=>{});
  const cols=["events","ideas","todos","people","expenses","rats","flights"];
  let pending=cols.length+1;const ready=()=>{if(--pending===0)S.loaded=true;render()};
  const onErr=()=>{};
  let firstInfo=true;
  db.doc("trip/info").onSnapshot(s=>{S.info=s.exists?s.data():{};if(firstInfo){firstInfo=false;ready()}else render()},onErr);
  for(const col of cols){let first=true;
    db.collection(col).onSnapshot(s=>{S[col]=s.docs.map(d=>({id:d.id,...d.data()}));if(first){first=false;ready()}else render()},onErr);
  }
})();
}
