/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { resolveAsset } from "./bound";
import { memeCached, memeEl } from "../art/meme";
import { krysa, ratSvg } from "../art/rat";
import { fmtD } from "../lib/dates";
import { S } from "../state";
import { removeDocs, snapOf, write } from "./core";
import { SVGNS, armBtn, h, svg } from "./dom";
import { icon } from "./icons";
import { openOverlay } from "./overlay";
import { postRat, saveMemeImage } from "./maker";
import { note, secHead } from "./parts";
import { goTab } from "./stage";
import { render } from "./tabs";

export async function deleteRat(r){
  return removeDocs([snapOf("rats",r)],"Rat removed",{onExpire:()=>{if(r.assetId&&S.assets)S.assets.delete(r.assetId).catch(()=>{})}});
}

export const REACTS: any[]=[["squeaks","squeak",()=>krysa("classic")],["re_cheese","cheese",()=>svg(`<path d="M3 17L20 8L21 19Z" fill="#f2c14e" stroke="#c9962a" stroke-width="1" stroke-linejoin="round"/><circle cx="15" cy="14" r="1.6" fill="#c9962a"/><circle cx="18.5" cy="16.5" r="1" fill="#c9962a"/>`,"0 0 24 24")],["re_dead","dead",()=>{const e=ratSvg({face:"dead"});e.setAttribute("viewBox","24 -2 72 78");return e}],["re_sus","sus",()=>{const e=ratSvg({face:"sus"});e.setAttribute("viewBox","24 -2 72 78");return e}]];

// Each post drew its reaction icons in full: three rat drawings per post. They're drawn once, as <symbol>s, and reused.
let sprite=null;
const reactIcon=k=>{
  if(!sprite){sprite=document.createElementNS(SVGNS,"svg");sprite.setAttribute("class","sprite");sprite.setAttribute("aria-hidden","true");
    for(const[key,,make]of REACTS){const src=make(),sym=document.createElementNS(SVGNS,"symbol");sym.id="react-"+key;sym.setAttribute("viewBox",src.getAttribute("viewBox"));sym.innerHTML=src.innerHTML;sprite.append(sym)}
    document.body.append(sprite)}
  return svg(`<use href="#react-${k}"/>`,sprite.querySelector("#react-"+k).getAttribute("viewBox"))};

export const reactCount=(r,k)=>Object.values(r[k]||{}).filter(Boolean).length;

export const loveOf=r=>REACTS.reduce((n,[k])=>n+reactCount(r,k),0);

export function saveWall(){try{localStorage.setItem("pw-wall",JSON.stringify(S.wall))}catch(e){}}

const posterOf=r=>r.by?(S.profiles[r.by]?.name||(r.by===S.uid?"you":"Someone")):(r.legacyBy?"a colleague":"Krysa");

export function mediaFor(r,opts: any = {}){
  const media=h("div",{class:"media"});
  if(r.type==="meme")media.append(opts.bare||opts.fresh?memeEl(r,r.id):memeCached(r));
  else if(r.assetId&&/^[A-Za-z0-9_-]{8,64}$/.test(r.assetId)){const src=null;
    const m=r.type==="video"?h("video",{src,"aria-label":r.caption?`Rat video: ${r.caption}`:"Rat video",controls:!opts.bare,loop:true,muted:true,playsinline:true,autoplay:!!opts.autoplay,preload:"metadata"}):h("img",{src,alt:r.caption||"Rat meme",loading:"lazy"});
    // Newer uploads know their shape, so the feed keeps their space and doesn't jump when they load.
    if(typeof r.ar==="number"&&r.ar>.1&&r.ar<10)m.style.aspectRatio=String(r.ar);
    m.addEventListener("error",()=>m.replaceWith(h("p",{class:"escaped",text:"This rat escaped."})));media.append(m);resolveAsset(r.assetId).then(u=>{if(u)m.setAttribute("src",u)}).catch(()=>{})}
  return media;
}

/** A square tile of a post (hall of fame, Today). Memes are drawn 360px wide and scaled down to the tile. */
export function thumb(r,key,label?){
  const media=mediaFor(r,{bare:true});
  return h("button",{class:"thumb",type:"button","data-k":key,"aria-label":label||(r.caption?`Open "${r.caption}"`:"Open this rat"),onclick:()=>openLightbox(r)},media);
}
// Memes fill their square. A tall one keeps its top (where the joke usually is). A wide one is centred,
// except the two-rat template, which shows its first rat whole rather than half of each.
export function fitThumbs(root){requestAnimationFrame(()=>root.querySelectorAll(".thumb .media").forEach(m=>{const mm=m.querySelector(".meme");if(!mm||!mm.offsetHeight)return;
  const sc=Math.max(m.clientWidth/360,m.clientHeight/mm.offsetHeight),x=mm.classList.contains("lay-duo")?0:(m.clientWidth-360*sc)/2;
  mm.style.transform=`translateX(${x}px) scale(${sc})`}))}

export function postCard(r,o: any = {}){
  const canDel=S.canWrite&&((r.by&&r.by===S.uid)||S.isOwner);
  const del=canDel?armBtn(h("button",{class:"btn small quiet danger",type:"button","data-k":"del:"+r.id},"Delete"),"Tap again",async()=>{if(await deleteRat(r))o.close?.()}):null;
  const reacts=h("div",{class:"reacts",role:"group","aria-label":"Reactions"},REACTS.map(([k,label])=>{const mine=!!(S.uid&&r[k]&&r[k][S.uid]);
    const b=h("button",{class:"react",type:"button","data-k":`react:${r.id}:${k}`,"aria-pressed":mine,"aria-label":`${label} (${reactCount(r,k)})`,title:label,disabled:!S.canWrite||!S.uid,onclick:e=>{e.stopPropagation();write(()=>S.db.doc("rats/"+r.id).update({[k]:{[S.uid]:!mine}}))}});
    b.append(reactIcon(k),h("span",{class:"v",text:reactCount(r,k)}));return b}));
  const media=mediaFor(r,{fresh:o.fresh});
  if(S.wall.view==="grid"&&!o.fresh)media.append(h("button",{class:"media-hit",type:"button","data-k":"open:"+r.id,"aria-label":r.caption?`Open "${r.caption}"`:"Open this rat",onclick:()=>openLightbox(r)}));
  return h("article",{class:"post"},media,h("div",{class:"post-foot"},
    h("div",{class:"post-who"},r.caption&&h("p",{class:"cap",text:r.caption}),h("p",{class:"by",text:posterOf(r)+(r.createdAt?" · "+fmtD(r.createdAt.slice(0,10)):"")})),
    h("div",{class:"post-bar"},reacts,h("div",{class:"post-acts"},r.type==="meme"&&S.downloads&&h("button",{class:"btn small quiet",type:"button","data-k":"save:"+r.id,onclick:()=>saveMemeImage(r,r.id)},"Save image"),r.type==="meme"&&S.canWrite&&h("button",{class:"btn small quiet",type:"button","data-k":"remix:"+r.id,onclick:()=>{o.close?.();postRat(r)}},"Remix"),del))));
}

export function openLightbox(r){let ov;const close=()=>ov.close();
  const prevView=S.wall.view;S.wall.view="feed";const card=postCard(r,{fresh:true,close});S.wall.view=prevView;
  ov=openOverlay({cls:"lightbox",label:r.caption?`Rat post: ${r.caption}`:"Rat post",content:[h("button",{class:"icon-btn closex",type:"button","aria-label":"Close",onclick:close},icon("close")),card]})}

export function wallList(){
  let rs=[...S.rats];
  if(S.wall.filter==="memes")rs=rs.filter(r=>r.type==="meme");else if(S.wall.filter==="uploads")rs=rs.filter(r=>r.type!=="meme");else if(S.wall.filter==="mine")rs=rs.filter(r=>r.by&&r.by===S.uid);
  if(S.wall.sort==="top")rs.sort((a,b)=>loveOf(b)-loveOf(a)||(b.createdAt||"").localeCompare(a.createdAt||""));
  else if(S.wall.sort==="shuffle"){const seed=S.wall.seed||(S.wall.seed=Math.random()*1e9|0);const hsh=x=>{let n=seed;for(const c of x)n=(n*33+c.charCodeAt(0))>>>0;return n};rs.sort((a,b)=>hsh(a.id)-hsh(b.id))}
  else rs.sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  return rs;
}

/** The latest three rats, for Today. */
export function ratStrip(){
  const rs=[...S.rats].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")).slice(0,3);
  const sec=h("section",{class:"sec","aria-labelledby":"strip-t"},secHead("On the Rat Wall",h("button",{class:"lnk more",type:"button","data-k":"strip:wall",onclick:()=>goTab("rats")},"Open the wall"),"strip-t"),
    rs.length?h("div",{class:"strip"},rs.map(r=>thumb(r,"strip:"+r.id))):note("classic","No rats yet. Unacceptable.",S.canWrite&&h("button",{class:"btn small","data-k":"strip:post",onclick:()=>postRat()},"Post the first rat")));
  fitThumbs(sec);return sec;
}

export function renderRats(main){
  // One toolbar row, then the posts, with the hall of fame after the third.
  const grid=S.wall.view==="grid";
  const set=(key,v)=>{S.wall[key]=v;if(key==="sort"&&v==="shuffle")S.wall.seed=Math.random()*1e9|0;saveWall();render()};
  main.append(h("div",{class:"wallbar"},
    h("div",{class:"filters",role:"group","aria-label":"Show"},[["all","All"],["memes","Memes"],["uploads","Uploads"],["mine","Mine"]].map(([k,l])=>h("button",{type:"button","data-k":"wall:f:"+k,"aria-pressed":S.wall.filter===k,onclick:()=>set("filter",k)},l))),
    h("div",{class:"wallbar-r"},
      h("label",{class:"sel"},h("span",{class:"sr",text:"Sort"}),h("select",{"data-k":"wall:sort",onchange:e=>set("sort",e.target.value)},[["new","Newest"],["top","Most loved"],["shuffle","Shuffle"]].map(([k,l])=>h("option",{value:k,selected:S.wall.sort===k},l)))),
      S.wall.sort==="shuffle"&&h("button",{class:"btn small",type:"button","data-k":"wall:reshuffle",onclick:()=>{S.wall.seed=Math.random()*1e9|0;saveWall();render()}},"Reshuffle"),
      h("button",{class:"icon-btn boxed",type:"button","data-k":"wall:view","aria-pressed":grid,"aria-label":"Show as a grid",onclick:()=>{S.wall.view=grid?"feed":"grid";saveWall();render()}},icon("grid")))));
  const top=[...S.rats].filter(r=>loveOf(r)>0).sort((a,b)=>loveOf(b)-loveOf(a)).slice(0,3);
  const fame=top.length?h("section",{class:"fame","aria-labelledby":"fame-t"},h("h2",{id:"fame-t",text:"Rats of the week"}),h("ol",{class:"podium"},top.map((r,i)=>h("li",null,thumb(r,"fame:"+r.id,`${["First","Second","Third"][i]} place${r.caption?`: "${r.caption}"`:""}, ${loveOf(r)} reactions`),h("span",{class:"place-n",text:["1st","2nd","3rd"][i]}),h("span",{class:"place-v",text:`${loveOf(r)} reaction${loveOf(r)===1?"":"s"}`}))))):null;
  if(fame)fitThumbs(fame);
  const rs=wallList();
  if(!rs.length)main.append(...[S.rats.length?h("p",{class:"quiet-note",text:"No rats match this filter."}):note("classic","No rats yet. Unacceptable. Post one: a Krysa meme takes ten seconds.",S.canWrite&&h("button",{class:"btn primary","data-k":"wall:first",onclick:()=>postRat()},"Post a rat")),fame].filter(Boolean));
  else if(grid)main.append(...[h("div",{class:"feed grid"},rs.map(r=>postCard(r))),fame].filter(Boolean));
  else main.append(h("div",{class:"feed"},rs.map((r,i)=>fame&&i===Math.min(2,rs.length-1)?[postCard(r),fame]:postCard(r))));
  ensureProfiles(S.rats.map(r=>r.by));
}

export function ensureProfiles(ids){ids=[...new Set<any>(ids.filter(Boolean))].filter(id=>!(id in S.profiles));
  if(ids.length&&S.user&&!(ensureProfiles as any).busy){(ensureProfiles as any).busy=true;S.user.profiles(ids).then(ps=>{Object.assign(S.profiles,ps);(ensureProfiles as any).busy=false;if(S.tab==="rats"||S.tab==="today")render()}).catch(()=>{(ensureProfiles as any).busy=false})}}
