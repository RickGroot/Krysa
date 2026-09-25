/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { krysa } from "../art/rat";
import { SCENES } from "../art/scenes";
import { dtUTC, nowLocalUTC } from "../lib/dates";
import { fmtAmt, fmtCzk, fmtEur } from "../lib/money";
import { S, pname } from "../state";
import { rate, toCzk } from "./bound";
import { h, reduced, svg } from "./dom";
import { HERO } from "./stage";
import { voteCount } from "./tabs";
import { ensureProfiles, loveOf, mediaFor } from "./wall";

export function wrappedSlides(){
  const rs=S.rats,memes=rs.filter(r=>r.type==="meme").length,love=rs.reduce((a,r)=>a+loveOf(r),0);
  const byPoster={};for(const r of rs){const k=r.by||"krysa";byPoster[k]=(byPoster[k]||0)+1}
  const topPoster=(Object.entries as any)(byPoster).sort((a,b)=>b[1]-a[1])[0];
  const nm=id=>id==="krysa"?"Krysa":(S.profiles[id]?.name||(id===S.uid?"You":"Someone"));
  const best=[...rs].sort((a,b)=>loveOf(b)-loveOf(a))[0];
  const sc=(Object.entries as any)(S.scores||{}).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  const total=S.expenses.reduce((a,e)=>a+toCzk(e),0);const big=[...S.expenses].sort((a,b)=>toCzk(b)-toCzk(a))[0];
  const paid={};for(const e of S.expenses)paid[e.paidBy]=(paid[e.paidBy]||0)+toCzk(e);const topPayer=(Object.entries as any)(paid).sort((a,b)=>b[1]-a[1])[0];
  const topIdea=[...S.ideas].sort((a,b)=>voteCount(b)-voteCount(a))[0];const done=S.todos.filter(t=>t.done).length;
  const ended=nowLocalUTC()>(dtUTC(S.info.endDate,"23:59")||0);
  ensureProfiles([...Object.keys(byPoster).filter(k=>k!=="krysa"),...sc.map(([id])=>id)]);
  return [
    {scene:"rats",k:ended?"The week is done":"The story so far",big:"Rat Wrapped",sub:`${S.info.title||"Prague week"} · ${S.people.map(p=>p.name).join(", ")}`},
    {scene:"ideas",k:"The Rat Wall",big:`${rs.length} rat${rs.length===1?"":"s"}`,sub:`${memes} Krysa meme${memes===1?"":"s"}, ${rs.length-memes} upload${rs.length-memes===1?"":"s"} and ${love} reaction${love===1?"":"s"}.${topPoster?` Most prolific: ${nm(topPoster[0])} with ${topPoster[1]}.`:""}`},
    best&&loveOf(best)>0?{scene:"rats",k:"Most loved rat",media:best,sub:`${loveOf(best)} reaction${loveOf(best)===1?"":"s"}${best.by?` · posted by ${nm(best.by)}`:""}`}:null,
    {scene:"money",k:"Rat catcher champion",big:sc[0]?nm(sc[0][0]):"Nobody yet",sub:sc[0]?`${sc[0][1]} rat${sc[0][1]===1?"":"s"} caught.${sc[1]?` Runner-up: ${nm(sc[1][0])} with ${sc[1][1]}.`:""}`:"The rats are still winning."},
    {scene:"money",k:"Where the money went",big:fmtCzk(total),sub:S.expenses.length?`≈ ${fmtEur(total/rate())} across ${S.expenses.length} expense${S.expenses.length===1?"":"s"}.${big?` Biggest: ${big.what} (${fmtAmt(big)}).`:""}${topPayer?` ${pname(topPayer[0])} paid the most.`:""}`:"Nothing logged yet."},
    {scene:"plan",k:"The plan",big:`${S.events.filter(e=>!e.draft).length} plans`,sub:`${S.ideas.length} ideas${topIdea&&voteCount(topIdea)?`, fan favourite: ${topIdea.title}`:""}. ${done} to-do${done===1?"":"s"} ticked off.`},
    {scene:"flights",k:"Na shledanou, Praha",big:"See you next time",sub:"Krysa will guard the Airbnb until you're back.",rat:true},
  ].filter(Boolean);
}

export function openWrapped(){
  const slides=wrappedSlides();let i=0,timer=null;
  const root=h("div",{class:"wrapped",role:"dialog","aria-label":"Rat Wrapped"});
  const bars=h("div",{class:"wr-bars"},slides.map(()=>h("span",null,h("i"))));
  const stage=h("div",{class:"wr-stage"});
  const close=()=>{clearTimeout(timer);root.remove();document.removeEventListener("keydown",key)};
  const show=n=>{i=Math.max(0,Math.min(slides.length-1,n));const s=slides[i];
    const sv=svg(SCENES[s.scene](),"0 -110 400 360");sv.setAttribute("preserveAspectRatio","xMidYMid slice");sv.classList.add("wr-scene");
    const light=HERO[s.scene]&&HERO[s.scene].light;
    const body=h("div",{class:"wr-body"+(light?" light":"")},h("div",{class:"wr-k",text:s.k}),s.big&&h("div",{class:"wr-big",text:s.big}),s.media&&h("div",{class:"wr-media"},mediaFor(s.media,{bare:true,autoplay:true})),s.rat&&(()=>{const k=h("div",{class:"wr-rat alive"});k.append(krysa("cheers"));return k})(),h("p",{class:"wr-sub",text:s.sub}));
    stage.replaceChildren(sv,body);
    [...bars.children].forEach((b,j)=>{const f=b.firstChild;f.style.transition="none";f.style.width=j<i?"100%":"0";if(j===i){void f.offsetWidth;if(!reduced()){f.style.transition="width 6s linear";f.style.width="100%"}else f.style.width="100%"}});
    clearTimeout(timer);if(i<slides.length-1&&!reduced())timer=setTimeout(()=>show(i+1),6000)};
  const key=e=>{if(e.key==="Escape")close();else if(e.key==="ArrowRight")show(i+1);else if(e.key==="ArrowLeft")show(i-1)};document.addEventListener("keydown",key);
  root.append(bars,h("button",{class:"btn small wr-close",type:"button",onclick:close},"Close"),stage,
    h("button",{class:"nav prev",type:"button","aria-label":"Previous",onclick:()=>show(i-1)}),h("button",{class:"nav next",type:"button","aria-label":"Next",onclick:()=>show(i+1)}));
  document.body.append(root);show(0);
}
