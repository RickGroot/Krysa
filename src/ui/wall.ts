/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { resolveAsset } from "./bound";
import { memeCached, memeEl } from "../art/meme";
import { krysa, ratSvg } from "../art/rat";
import { catchers } from "../lib/catchers";
import { fmtD } from "../lib/dates";
import { S } from "../state";
import { removeDocs, snapOf, write } from "./core";
import { armBtn, h, keepFocus, reduced, svg, toast } from "./dom";
import { IDLE, scheduleCameo } from "./idle";
import { postRat, saveMemeImage } from "./maker";
import { render } from "./tabs";

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
  const del=canDel?armBtn(h("button",{class:"btn small ghost danger extra",type:"button","data-k":"del:"+r.id},"Delete"),"Tap again",async()=>{if(await deleteRat(r))o.close?.()}):null;
  const reacts=h("div",{class:"reacts"},REACTS.map(([k,label,icon])=>{const mine=!!(S.uid&&r[k]&&r[k][S.uid]);
    const b=h("button",{class:"react",type:"button","data-k":`react:${r.id}:${k}`,"aria-pressed":mine,"aria-label":`${label} (${reactCount(r,k)})`,disabled:!S.canWrite||!S.uid,onclick:e=>{e.stopPropagation();write(()=>S.db.doc("rats/"+r.id).update({[k]:{[S.uid]:!mine}}))}});
    b.append(icon(),h("span",{class:"t",text:label}),h("span",{class:"v",text:reactCount(r,k)}));return b}));
  const media=mediaFor(r,{fresh:o.fresh});
  if(S.wall.view==="grid")media.append(h("button",{class:"media-hit",type:"button","data-k":"open:"+r.id,"aria-label":r.caption?`Open "${r.caption}"`:"Open this rat",onclick:()=>openLightbox(r)}));
  return h("article",{class:"post"},media,h("div",{class:"foot"},h("div",null,r.caption&&h("div",{class:"cap",text:r.caption}),h("div",{class:"by",text:"Posted by "+who+(r.createdAt?" · "+fmtD(r.createdAt.slice(0,10)):"")})),
    h("div",{style:"display:flex;gap:6px;align-items:center;flex-wrap:wrap"},reacts,r.type==="meme"&&S.downloads&&h("button",{class:"btn small ghost extra",type:"button","data-k":"save:"+r.id,onclick:()=>saveMemeImage(r,r.id)},"Save image"),r.type==="meme"&&S.canWrite&&h("button",{class:"btn small ghost extra",type:"button","data-k":"remix:"+r.id,onclick:()=>{o.close?.();postRat(r)}},"Remix"),del)));
}

export function openLightbox(r){const lb=h("div",{class:"lightbox","aria-label":r.caption?`Rat post: ${r.caption}`:"Rat post",onclick:e=>{if(e.target===lb)close()}});const close=()=>{lb.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const prevView=S.wall.view;S.wall.view="feed";const card=postCard(r,{fresh:true,close});S.wall.view=prevView;
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
  // The progress bar is a CSS animation; the next rat comes on its animationend, so pausing it pauses the show.
  let i=0,paused=false;const bar=h("i");const slot=h("div",{class:"slot"});
  const root=h("div",{class:"ratv",role:"dialog","aria-label":"Rat TV"});
  const close=()=>{root.remove();document.removeEventListener("keydown",key)};
  const show=n=>{i=(n+list.length)%list.length;const r=list[i];slot.replaceChildren(mediaFor(r,{bare:true,autoplay:!paused}),r.caption&&h("div",{class:"cap",text:r.caption}));
    bar.classList.remove("run");void bar.offsetWidth;bar.style.setProperty("--dur",(r.type==="video"?12:6)+"s");if(!reduced())bar.classList.add("run")};
  bar.addEventListener("animationend",()=>show(i+1));
  const pause=h("button",{class:"btn small",type:"button",onclick:()=>setPaused(!paused)},"Pause");
  const setPaused=v=>{paused=v;root.classList.toggle("paused",v);pause.textContent=v?"Play":"Pause";slot.querySelectorAll("video").forEach(x=>{if(v)x.pause();else x.play().catch(()=>{})})};
  const key=e=>{if(e.key==="Escape")close();else if(e.key==="ArrowRight")show(i+1);else if(e.key==="ArrowLeft")show(i-1);else if(e.key===" "&&!e.target.closest?.("button")){e.preventDefault();setPaused(!paused)}};document.addEventListener("keydown",key);
  root.append(h("div",{class:"ratv-top"},h("span",{class:"onair"},h("i"),"RAT TV · LIVE FROM PRAHA"),h("span",{class:"ratv-acts"},pause,h("button",{class:"btn small",type:"button",onclick:close},"Exit"))),
    h("div",{class:"ratv-stage"},slot,h("button",{class:"nav prev",type:"button","aria-label":"Previous rat",onclick:()=>show(i-1)}),h("button",{class:"nav next",type:"button","aria-label":"Next rat",onclick:()=>show(i+1)})),
    h("div",{class:"ratv-bar"},bar));
  document.body.append(root);show(0);
}

export function renderRats(main){
  // The wall is a feed: one toolbar row, then the posts, with the hall of fame after the third.
  const grid=S.wall.view==="grid";
  const sel=(label,key,list)=>h("label",{class:"wsel"},h("span",{class:"sr",text:label}),h("select",{"data-k":"wall:"+key,onchange:e=>{S.wall[key]=e.target.value;if(key==="sort"&&S.wall.sort==="shuffle")S.wall.seed=Math.random()*1e9|0;saveWall();render()}},list.map(([k,l])=>h("option",{value:k,selected:S.wall[key]===k},l))));
  main.append(h("div",{class:"wallbar"},
    sel("Sort","sort",[["new","Newest"],["top","Most loved"],["shuffle","Shuffle"]]),
    sel("Show","filter",[["all","All rats"],["memes","Krysa memes"],["uploads","Uploads"],["mine","Mine"]]),
    S.wall.sort==="shuffle"&&h("button",{class:"btn small",type:"button","data-k":"wall:reshuffle",onclick:()=>{S.wall.seed=Math.random()*1e9|0;saveWall();render()}},"Reshuffle"),
    h("button",{class:"btn small",type:"button","data-k":"wall:view","aria-pressed":grid,onclick:()=>{S.wall.view=grid?"feed":"grid";saveWall();render()}},"Grid")));
  const top=[...S.rats].filter(r=>loveOf(r)>0).sort((a,b)=>loveOf(b)-loveOf(a)).slice(0,3);
  const fame=top.length?h("section",{class:"fame"},h("h3",{text:"Rats of the week"}),h("div",{class:"fame-row"},top.map((r,i)=>h("button",{class:"fame-item",type:"button","data-k":"fame:"+r.id,onclick:()=>openLightbox(r)},mediaFor(r,{bare:true}),h("span",{class:"place-n",text:["1st","2nd","3rd"][i]}),h("span",{class:"muted",text:`${loveOf(r)} reaction${loveOf(r)===1?"":"s"}`}))))):null;
  // Hall-of-fame memes are drawn 360px wide and scaled to the tile, keeping their own shape.
  if(fame)requestAnimationFrame(()=>fame.querySelectorAll(".fame-item .media").forEach(m=>{const mm=m.querySelector(".meme");if(!mm)return;const s=m.clientWidth/360;mm.style.transform=`scale(${s})`;m.style.aspectRatio="auto";m.style.height=`${mm.offsetHeight*s}px`}));
  const rs=wallList();
  if(!rs.length)main.append(...[h("p",{class:"empty",text:S.rats.length?"No rats match this filter.":"No rats yet. Unacceptable."}),fame].filter(Boolean));
  else if(grid)main.append(...[h("div",{class:"feed grid"},rs.map(postCard)),fame].filter(Boolean));
  else main.append(h("div",{class:"feed"},rs.map((r,i)=>fame&&i===Math.min(2,rs.length-1)?[postCard(r),fame]:postCard(r))));
  ensureProfiles(S.rats.map(r=>r.by));
}

export function ensureProfiles(ids){ids=[...new Set<any>(ids.filter(Boolean))].filter(id=>!(id in S.profiles));
  if(ids.length&&S.user&&!(ensureProfiles as any).busy){(ensureProfiles as any).busy=true;S.user.profiles(ids).then(ps=>{Object.assign(S.profiles,ps);(ensureProfiles as any).busy=false;if(S.tab==="rats")render()}).catch(()=>{(ensureProfiles as any).busy=false})}}

/** More → Rat catchers: the scoreboard and the Sneaky rats switch. */
export function openCatchers(){
  const scrim=h("div",{class:"scrim",onclick:e=>{if(e.target===scrim)close()}});
  const close=()=>{scrim.remove();document.removeEventListener("keydown",esc)};const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const sheet=h("div",{class:"sheet",role:"dialog","aria-labelledby":"catch-t"});
  const draw=()=>keepFocus(sheet,()=>{
    // Scores are per device; devices with the same name add up (src/lib/catchers.ts).
    const entries=catchers(S.scores,S.profiles);ensureProfiles(Object.keys(S.scores||{}));
    const toggle=h("button",{class:"btn small",type:"button","data-k":"sneaky","aria-pressed":IDLE.on,onclick:()=>{IDLE.on=!IDLE.on;try{localStorage.setItem("pw-idle-rats",IDLE.on?"on":"off")}catch(e){}
      if(IDLE.on)scheduleCameo(true);else{clearTimeout((scheduleCameo as any).t);document.querySelectorAll(".peek,.tail-dangle").forEach(x=>x.remove())}draw()}},IDLE.on?"Sneaky rats: on":"Sneaky rats: off");
    sheet.replaceChildren(h("h3",{id:"catch-t",text:"Rat catchers"}),
      h("div",{class:"sectionhead"},h("p",{text:reduced()?"Sneaky rats are paused because your device is set to reduce motion.":"While the app is open, rats sneak in from the edges now and then. Tap one to catch it."}),toggle),
      entries.length?h("div",{class:"bal"},entries.flatMap(({ids,name,n},i)=>[h("span",{text:`${i+1}. ${name||(ids.includes(S.uid)?"You":"Someone")}`}),h("span",{class:"money",style:"font-weight:700;justify-self:end",text:`${n} rat${n===1?"":"s"}`})]))
        :h("p",{class:"empty",text:"No rats caught yet. Keep your eyes on the edges."}),
      h("div",{class:"sheetacts"},h("div",{class:"r"},h("button",{class:"btn ghost",type:"button",onclick:close},"Close"))))});
  draw();scrim.append(sheet);document.body.append(scrim);
}
