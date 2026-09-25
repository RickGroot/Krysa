/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { resolveAsset } from "./bound";
import { memeCached, memeEl } from "../art/meme";
import { krysa, ratSvg } from "../art/rat";
import { fmtD } from "../lib/dates";
import { S } from "../state";
import { tripLive } from "./bound";
import { removeDocs, snapOf, write } from "./core";
import { h, reduced, svg, toast } from "./dom";
import { IDLE, RAT_FACTS, scheduleCameo } from "./idle";
import { postRat, saveMemeImage } from "./maker";
import { render } from "./tabs";
import { nowNextCard } from "./timely";
import { openWrapped } from "./wrapped";

export async function deleteRat(r){
  return removeDocs([snapOf("rats",r)],"Rat removed",{onExpire:()=>{if(r.assetId&&S.assets)S.assets.delete(r.assetId).catch(()=>{})}});
}

export const REACTS: any[]=[["squeaks","squeak",()=>krysa("classic")],["re_cheese","cheese",()=>svg(`<path d="M3 17L20 8L21 19Z" fill="#f2c14e" stroke="#c9962a" stroke-width="1" stroke-linejoin="round"/><circle cx="15" cy="14" r="1.6" fill="#c9962a"/><circle cx="18.5" cy="16.5" r="1" fill="#c9962a"/>`,"0 0 24 24")],["re_dead","dead",()=>{const e=ratSvg({face:"dead"});e.setAttribute("viewBox","24 -2 72 78");return e}],["re_sus","sus",()=>{const e=ratSvg({face:"sus"});e.setAttribute("viewBox","24 -2 72 78");return e}]];

export const reactCount=(r,k)=>Object.values(r[k]||{}).filter(Boolean).length;

export const loveOf=r=>REACTS.reduce((n,[k])=>n+reactCount(r,k),0);

export function saveWall(){try{localStorage.setItem("pw-wall",JSON.stringify(S.wall))}catch(e){}}

export function mediaFor(r,opts: any = {}){
  const media=h("div",{class:"media"});
  if(r.type==="meme")media.append(opts.bare||opts.fresh?memeEl(r,r.id):memeCached(r));
  else if(r.assetId&&/^[A-Za-z0-9_-]{8,64}$/.test(r.assetId)){const src=null;
    const m=r.type==="video"?h("video",{src,controls:!opts.bare,loop:true,muted:true,playsinline:true,autoplay:!!opts.autoplay,preload:"metadata"}):h("img",{src,alt:r.caption||"Rat meme",loading:"lazy"});
    m.addEventListener("error",()=>m.replaceWith(h("p",{class:"empty",style:"padding:24px",text:"This rat escaped."})));media.append(m);resolveAsset(r.assetId).then(u=>{if(u)m.setAttribute("src",u)}).catch(()=>{})}
  return media;
}

export function postCard(r,o: any = {}){
  const who=r.by?(S.profiles[r.by]?.name||(r.by===S.uid?"you":"Someone")):(r.legacyBy?"a colleague":"Krysa");
  const canDel=S.canWrite&&((r.by&&r.by===S.uid)||S.isOwner);
  let armed=false;const del=canDel?h("button",{class:"btn small ghost danger extra",type:"button",onclick:async()=>{if(!armed){armed=true;del.textContent="Tap again";return}await deleteRat(r)}},"Delete"):null;
  const reacts=h("div",{class:"reacts"},REACTS.map(([k,label,icon])=>{const mine=!!(S.uid&&r[k]&&r[k][S.uid]);
    const b=h("button",{class:"react",type:"button","aria-pressed":mine,"aria-label":`${label} (${reactCount(r,k)})`,disabled:!S.canWrite||!S.uid,onclick:e=>{e.stopPropagation();write(()=>S.db.doc("rats/"+r.id).update({[k]:{[S.uid]:!mine}}))}});
    b.append(icon(),h("span",{class:"t",text:label}),h("span",{class:"v",text:reactCount(r,k)}));return b}));
  const media=mediaFor(r,{fresh:o.fresh});
  if(S.wall.view==="grid"){media.style.cursor="zoom-in";media.addEventListener("click",()=>openLightbox(r))}
  return h("article",{class:"post"},media,h("div",{class:"foot"},h("div",null,r.caption&&h("div",{class:"cap",text:r.caption}),h("div",{class:"by",text:"Posted by "+who+(r.createdAt?" · "+fmtD(r.createdAt.slice(0,10)):"")})),
    h("div",{style:"display:flex;gap:6px;align-items:center;flex-wrap:wrap"},reacts,r.type==="meme"&&S.downloads&&h("button",{class:"btn small ghost extra",type:"button",onclick:()=>saveMemeImage(r,r.id)},"Save image"),r.type==="meme"&&S.canWrite&&h("button",{class:"btn small ghost extra",type:"button",onclick:()=>postRat(r)},"Remix"),del)));
}

export function openLightbox(r){const lb=h("div",{class:"lightbox",onclick:e=>{if(e.target===lb)close()}});const close=()=>{lb.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const prevView=S.wall.view;S.wall.view="feed";const card=postCard(r,{fresh:true});S.wall.view=prevView;
  lb.append(h("button",{class:"btn closex",type:"button",onclick:close},"Close"),card);document.body.append(lb)}

export function wallList(){
  let rs=[...S.rats];
  if(S.wall.filter==="memes")rs=rs.filter(r=>r.type==="meme");else if(S.wall.filter==="uploads")rs=rs.filter(r=>r.type!=="meme");else if(S.wall.filter==="mine")rs=rs.filter(r=>r.by&&r.by===S.uid);
  if(S.wall.sort==="top")rs.sort((a,b)=>loveOf(b)-loveOf(a)||(b.createdAt||"").localeCompare(a.createdAt||""));
  else if(S.wall.sort==="shuffle"){const seed=S.wall.seed||(S.wall.seed=Math.random()*1e9|0);const hsh=x=>{let n=seed;for(const c of x)n=(n*33+c.charCodeAt(0))>>>0;return n};rs.sort((a,b)=>hsh(a.id)-hsh(b.id))}
  else rs.sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  return rs;
}

export function ratTV(list){
  if(!list.length){toast("No rats to broadcast yet");return}
  let i=0,timer=null;const bar=h("i");const slot=h("div",{class:"slot"});
  const root=h("div",{class:"ratv",role:"dialog","aria-label":"Rat TV"});
  const close=()=>{clearTimeout(timer);root.remove();document.removeEventListener("keydown",key)};
  const show=n=>{i=(n+list.length)%list.length;const r=list[i];slot.replaceChildren(mediaFor(r,{bare:true,autoplay:true}),r.caption&&h("div",{class:"cap",text:r.caption}));
    bar.style.transition="none";bar.style.width="0";void bar.offsetWidth;const dur=r.type==="video"?12000:6000;
    if(!reduced()){bar.style.transition=`width ${dur}ms linear`;bar.style.width="100%"}clearTimeout(timer);timer=setTimeout(()=>show(i+1),dur)};
  const key=e=>{if(e.key==="Escape")close();else if(e.key==="ArrowRight")show(i+1);else if(e.key==="ArrowLeft")show(i-1)};document.addEventListener("keydown",key);
  root.append(h("div",{class:"ratv-top"},h("span",{class:"onair"},h("i"),"RAT TV · LIVE FROM PRAHA"),h("button",{class:"btn small",type:"button",onclick:close},"Exit")),
    h("div",{class:"ratv-stage"},slot,h("button",{class:"nav prev",type:"button","aria-label":"Previous rat",onclick:()=>show(i-1)}),h("button",{class:"nav next",type:"button","aria-label":"Next rat",onclick:()=>show(i+1)})),
    h("div",{class:"ratv-bar"},bar));
  document.body.append(root);show(0);
}

export function renderRats(main){
  if(tripLive()){const nn=nowNextCard(true);if(nn)main.append(nn)}
  const day=Math.floor(Date.now()/864e5);
  const fact=h("div",{class:"ratfact alive"});fact.append(krysa("classic"),h("div",null,h("div",{class:"lbl",text:"Rat fact of the day"}),h("p",{text:RAT_FACTS[day%RAT_FACTS.length]})));
  main.append(fact);
  main.append(h("div",{class:"sectionhead"},h("p",{text:"The official Rat Wall. Post memes, react to the good ones."}),h("span",{style:"display:flex;gap:6px;flex-wrap:wrap"},S.rats.length>0&&h("button",{class:"btn small",type:"button",onclick:()=>ratTV(wallList())},"Rat TV"),h("button",{class:"btn small",type:"button",onclick:openWrapped},"Rat Wrapped"),S.canWrite&&h("button",{class:"btn primary small",onclick:()=>postRat()},"+ Rat"))));
  const top=[...S.rats].filter(r=>loveOf(r)>0).sort((a,b)=>loveOf(b)-loveOf(a)).slice(0,3);
  if(top.length){main.append(h("section",{class:"fame"},h("h3",{text:"Rats of the week"}),h("div",{class:"fame-row"},top.map((r,i)=>{const b=h("button",{class:"fame-item",type:"button",onclick:()=>openLightbox(r)},mediaFor(r,{bare:true}),h("span",{class:"place-n",text:["1st","2nd","3rd"][i]}),h("span",{class:"muted",text:`${loveOf(r)} reaction${loveOf(r)===1?"":"s"}`}));return b}))))}
  requestAnimationFrame(()=>document.querySelectorAll(".fame-item .media").forEach(m=>{const mm=m.querySelector(".meme");if(mm)mm.style.transform=`scale(${m.clientWidth/360})`}));
  const opt=(label,key,list)=>h("span",{style:"display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap"},h("span",{class:"lblx",text:label}),h("span",{class:"chips"},list.map(([k,l])=>h("button",{type:"button","aria-pressed":S.wall[key]===k,onclick:()=>{S.wall[key]=k;if(k==="shuffle")S.wall.seed=Math.random()*1e9|0;saveWall();render()}},l))));
  main.append(h("div",{class:"wallbar"},h("div",{class:"row2"},opt("View","view",[["feed","Feed"],["grid","Grid"]]),opt("Sort","sort",[["new","Newest"],["top","Most loved"],["shuffle","Shuffle"]])),h("div",{class:"row2"},opt("Show","filter",[["all","All"],["memes","Krysa memes"],["uploads","Uploads"],["mine","Mine"]]))));
  const rs=wallList();
  if(!rs.length){main.append(h("p",{class:"empty",text:S.rats.length?"No rats match this filter.":"No rats yet. Unacceptable."}))}
  else main.append(h("div",{class:"feed"+(S.wall.view==="grid"?" grid":"")},rs.map(postCard)));
  main.append(catchersCard());
  ensureProfiles(S.rats.map(r=>r.by));
}

export function ensureProfiles(ids){ids=[...new Set<any>(ids.filter(Boolean))].filter(id=>!(id in S.profiles));
  if(ids.length&&S.user&&!(ensureProfiles as any).busy){(ensureProfiles as any).busy=true;S.user.profiles(ids).then(ps=>{Object.assign(S.profiles,ps);(ensureProfiles as any).busy=false;if(S.tab==="rats")render()}).catch(()=>{(ensureProfiles as any).busy=false})}}

export function catchersCard(){
  const entries=(Object.entries as any)(S.scores||{}).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);ensureProfiles(entries.map(([id])=>id));
  const toggle=h("button",{class:"btn small",type:"button","aria-pressed":IDLE.on,onclick:()=>{IDLE.on=!IDLE.on;try{localStorage.setItem("pw-idle-rats",IDLE.on?"on":"off")}catch(e){}
    if(IDLE.on)scheduleCameo(true);else{clearTimeout((scheduleCameo as any).t);document.querySelectorAll(".peek,.tail-dangle").forEach(x=>x.remove())}render()}},IDLE.on?"Sneaky rats: on":"Sneaky rats: off");
  return h("div",{class:"card"},h("h3",null,"Rat catchers",toggle),
    h("p",{class:"muted",text:reduced()?"Sneaky rats are paused because your device is set to reduce motion.":"While the page is open, rats sneak in from the edges now and then. Tap one to catch it."}),
    entries.length?h("div",{class:"bal"},entries.flatMap(([id,n],i)=>[h("span",{text:`${i+1}. ${S.profiles[id]?.name||(id===S.uid?"You":"Someone")}`}),h("span",{class:"money",style:"font-weight:700;justify-self:end",text:`${n} rat${n===1?"":"s"}`})]))
      :h("p",{class:"empty",text:"No rats caught yet. Keep your eyes on the edges."}));
}
