/* eslint-disable */
// The band at the top of every tab: the tab's Prague scene with its name on an enamel street plate. On Today the
// scene follows Prague's clock (morning, afternoon, dusk, night) and the plate makes way for the time itself.
import { krysa } from "../art/rat";
import { SCENES, groundEl } from "../art/scenes";
import { EN, MON, daysUntil, fmtD, nowLocalUTC, parseD, todayIso } from "../lib/dates";
import { fmtCzk } from "../lib/money";
import { S, TABS, TAB_ALIAS, TAB_SPOT } from "../state";
import { toCzk, todayOn } from "./bound";
import { h, svg } from "./dom";
import { render } from "./tabs";

// Light scenes carry dark text; the rest, light text.
const LIGHT=new Set(["plan","flights","todo"]);

/** Prague's hour picks the sky over Today. */
export function skyOf(now=nowLocalUTC()){const hr=new Date(now).getUTCHours();return hr>=5&&hr<10?"plan":hr>=10&&hr<17?"flights":hr>=17&&hr<20?"ideas":"rats"}

const PLATES={
  week:{t:"Week",cs:"Týden",scene:"plan",sub:()=>S.info.startDate&&S.info.endDate?`${fmtD(S.info.startDate)} – ${fmtD(S.info.endDate)}`:"Set the trip dates in Trip"},
  rats:{t:"Rat Wall",cs:"Krysy",scene:"rats",sub:()=>{const n=S.rats.length;return `${n} rat${n===1?"":"s"} posted`}},
  money:{t:"Money",cs:"Peníze",scene:"money",sub:()=>`${fmtCzk(S.expenses.reduce((a,e)=>a+toCzk(e),0))} spent together`},
  trip:{t:"Trip",cs:"Výlet",scene:"info",sub:()=>{const n=S.people.length;return n?`${n} travelling`:"Flights, to-dos and the stay"}},
};

/** Where the trip stands: "Day 3 of 7", "4 days to go"… */
export function tripStatus(){
  const a=S.info.startDate,b=S.info.endDate,t=todayIso();if(!a||!b)return"";
  if(todayOn()){const n=daysUntil(t,a),of=daysUntil(b,a);if(n!=null&&of!=null&&n>=0&&n<=of)return`Day ${n+1} of ${of+1}`}
  const d=daysUntil(a,t),e=daysUntil(b,t);if(d==null||e==null)return"";
  return d>1?`${d} days to go`:d===1?"Tomorrow!":e>=0?"Happening now":"That was the week";
}

function sceneEl(key){const sv=svg(SCENES[key](),"0 -110 400 360");sv.setAttribute("preserveAspectRatio","xMidYMax slice");sv.classList.add("scene");return sv}

let painted="";
export function paintStage(){
  const tab=S.tab,band=document.getElementById("band"),art=document.getElementById("band-art"),body=document.getElementById("band-body");
  const key=tab==="today"?skyOf():PLATES[tab].scene;
  document.body.dataset.tab=tab;band.dataset.scene=LIGHT.has(key)?"light":"dark";
  if(art.dataset.key!==key){art.dataset.key=key;art.replaceChildren(sceneEl(key),groundEl());art.classList.remove("fadein");void art.offsetWidth;art.classList.add("fadein")}
  // Built once per tab, then updated in place: the clock ticks without rebuilding the band.
  if(painted!==tab){painted=tab;
    if(tab==="today"){const kr=h("span",{class:"band-krysa alive","aria-hidden":"true"});kr.append(krysa("classic"));
      body.replaceChildren(h("div",{class:"clockface"},h("h1",{class:"sr",text:"Today"}),h("p",{class:"clock"},h("time",{id:"clock"})),h("p",{class:"band-sub",id:"band-sub"})),kr)}
    else{const p=PLATES[tab];body.replaceChildren(h("div",{class:"plate-wrap"},h("div",{class:"plate"},h("h1",{text:p.t}),h("span",{class:"cs",lang:"cs",text:p.cs})),h("p",{class:"band-sub",id:"band-sub"})))}}
  const sub=document.getElementById("band-sub");
  if(tab==="today"){const now=new Date(nowLocalUTC()),hh=String(now.getUTCHours()).padStart(2,"0"),mm=String(now.getUTCMinutes()).padStart(2,"0");
    const c=document.getElementById("clock");c.textContent=`${hh}:${mm}`;c.setAttribute("datetime",`${todayIso()}T${hh}:${mm}`);
    const d=parseD(todayIso());sub.replaceChildren(`${EN[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`,...(S.loaded&&tripStatus()?[h("span",{class:"dot","aria-hidden":"true",text:"·"}),tripStatus()]:[]))}
  else sub.textContent=S.loaded?PLATES[tab].sub():"";
}

export function goTab(tab,spot?){
  const t=TABS.includes(tab)?tab:TAB_ALIAS[tab]||"today";spot=spot||TAB_SPOT[tab];
  if(t==="week"&&tab==="ideas")S.week.view="ideas";
  S.tab=t;try{sessionStorage.setItem("pw-tab",t)}catch(e){}
  render();
  const el=spot&&document.getElementById(spot);
  if(el)el.scrollIntoView({block:"start",behavior:"auto"});else window.scrollTo(0,0);
}
