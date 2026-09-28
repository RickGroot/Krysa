/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { memeToPng } from "../art/export";
import { memeEl } from "../art/meme";
import { MM, TEXT_LABELS, normMeme, pickCaption, surpriseMeme } from "../art/model";
import { ratSvg } from "../art/rat";
import { S } from "../state";
import { write } from "./core";
import { h, toast } from "./dom";
import { openOverlay } from "./overlay";
import { scurry } from "./idle";

export function uploadErr(e){const c=e&&e.code;return c==="too_large"?"That file is over 20 MB. Try a smaller image or a shorter clip.":c==="unsupported_type"?"That format isn't supported. Use JPG, PNG, GIF, WebP, MP4 or WebM.":"Upload failed. Check your connection and try again."}

export async function prepFile(file){
  const t=(file.type||"").toLowerCase();
  if(/^video\/(mp4|webm)$/.test(t))return{blob:file,kind:"video"};
  if(t==="image/gif")return{blob:file,kind:"image"};
  if(t.startsWith("image/")){
    try{const bmp=await createImageBitmap(file);const sc=Math.min(1,1600/Math.max(bmp.width,bmp.height));
      if(sc===1&&file.size<1.5e6&&/^image\/(png|jpeg|webp)$/.test(t))return{blob:file,kind:"image"};
      const c=document.createElement("canvas");c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);
      const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.86));if(blob)return{blob,kind:"image"}}catch(e){}
    if(/^image\/(png|jpeg|webp)$/.test(t))return{blob:file,kind:"image"};
  }
  return null;
}

/** Width ÷ height of an upload, kept with the post so the feed can hold its space before the file loads. */
async function mediaRatio(blob,kind){
  try{if(kind==="image"){const b=await createImageBitmap(blob);const r=b.width/b.height;b.close?.();return r}
    const v=document.createElement("video"),u=URL.createObjectURL(blob);v.muted=true;v.preload="metadata";v.src=u;
    await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=rej;setTimeout(rej,4000)});URL.revokeObjectURL(u);return v.videoWidth&&v.videoHeight?v.videoWidth/v.videoHeight:null}
  catch(e){return null}}

export function postRat(prefill?){
  const remix=!!(prefill&&prefill.type==="meme");
  const st={mode:remix||!S.assets?"meme":"upload",file:null,url:null,caption:"",dirty:false,m:remix?normMeme(prefill):normMeme({bg:"slate"})};
  if(!st.m.bg)st.m.bg="slate";
  // A fresh meme starts with a caption, so the preview is never a blank rat. That doesn't count as a change.
  if(!remix&&!st.m.top&&!st.m.bottom){const[t,b]=pickCaption(st.m.layout);st.m.top=t;st.m.bottom=b}
  let ov;const close=()=>ov.close();
  const err=h("div",{class:"err",role:"alert"});
  const submit=h("button",{class:"btn primary",type:"submit"},"Post rat");
  const cancel=h("button",{class:"btn ghost",type:"button",onclick:close},"Cancel");
  const acts=h("div",{class:"sheetacts"},h("div",{class:"r"},cancel,submit));
  // Tapping outside or Escape with work in progress asks first; Cancel is an explicit no.
  const ask=()=>{if(!(st.dirty||st.file||st.caption.trim()))return close();if(acts.querySelector(".discard"))return;
    const keep=h("button",{class:"btn",type:"button",onclick:()=>{acts.replaceChildren(h("div",{class:"r"},cancel,submit));submit.focus()}},"Keep editing");
    acts.replaceChildren(h("span",{class:"discard",role:"alert",text:"Discard this rat?"}),h("div",{class:"r"},keep,h("button",{class:"btn danger ghost",type:"button",onclick:close},"Discard")));keep.focus()};
  const changed=()=>{st.dirty=true;err.textContent=""};
  // Meme mode. Every option row is built once; a change updates the pressed states and the preview in place,
  // so the tapped option keeps focus and the sheet keeps its scroll.
  const prev=h("div",{class:"mk-prev"});
  let raf=0;const paint=()=>{raf=0;prev.replaceChildren(memeEl(st.m,"preview"))};const paintSoon=()=>{raf||=requestAnimationFrame(paint)};
  const rows=[];
  const sync=()=>{for(const r of rows)for(const b of r.el.children)b.setAttribute("aria-pressed",String(r.multi?st.m[r.key].includes(b.dataset.v):String(st.m[r.key])===b.dataset.v))};
  const chips=(label,list,key,opt: any = {})=>{
    const row=h("div",{class:"chips"+(opt.thumbs?" thumbs":"")});
    for(const[k,l]of list){
      const b=h("button",{type:"button","data-v":k,title:l,onclick:()=>{if(opt.multi){const a=st.m[key];st.m[key]=a.includes(k)?a.filter(x=>x!==k):[...a,k].slice(-6)}else st.m[key]=k;changed();update(key)}});
      if(opt.thumbs){b.setAttribute("aria-label",l);const sv=ratSvg({[opt.thumbs]:k});sv.setAttribute("viewBox",opt.thumbs==="item"||opt.thumbs==="fur"?"0 0 120 120":opt.thumbs==="gear"?"22 14 76 92":opt.thumbs==="ears"?"14 8 92 70":"24 -2 72 78");b.append(sv)}
      else if(opt.swatch){b.setAttribute("aria-label",l);b.classList.add("sw");b.append(h("span",{class:"swc bg-"+k}))}
      else b.textContent=l;
      row.append(b)}
    rows.push({key,multi:!!opt.multi,el:row});
    return h("div",{class:"field"},h("span",{class:"lbl",text:label}),row)};
  const group=(title,open,...kids)=>h("details",open?{open:true}:null,h("summary",{text:title}),h("div",{class:"mk-g"},...kids));
  const top=h("input",{id:"rat-top",maxlength:"120",placeholder:"WHEN THE LOKÁL BOOKING",autocomplete:"off",oninput:e=>{st.m.top=e.target.value;changed();paintSoon()}});
  const bot=h("input",{id:"rat-bot",maxlength:"160",placeholder:"GOES THROUGH",autocomplete:"off",oninput:e=>{st.m.bottom=e.target.value;changed();paintSoon()}});
  const topL=h("label",{for:"rat-top"}),botL=h("label",{for:"rat-bot"});
  const face=chips("Face",MM.faces,"face",{thumbs:"face"}),face2=chips("Second rat's face",MM.faces,"face2",{thumbs:"face"});
  // Only these depend on the template: the two text labels and whether there's a second rat.
  const relabel=()=>{const[l1,l2]=TEXT_LABELS[st.m.layout]||TEXT_LABELS.classic;topL.textContent=l1;botL.textContent=l2;const two=st.m.layout==="duo"||st.m.layout==="stack";face.querySelector(".lbl").textContent=two?"First rat's face":"Face";face2.hidden=!two};
  const update=(key?)=>{sync();paint();if(!key||key==="layout")relabel()};
  const setText=()=>{top.value=st.m.top;bot.value=st.m.bottom};
  const memeSec=h("div",{class:"mk-sec"},prev,
    h("div",{class:"mk-actions"},
      h("button",{class:"btn",type:"button",onclick:()=>{st.m=surpriseMeme();setText();changed();update()}},"Surprise me"),
      h("button",{class:"btn",type:"button",onclick:()=>{const[t,b]=pickCaption(st.m.layout);st.m.top=t;st.m.bottom=b;setText();changed();paint()}},"New caption"),
      S.downloads&&h("button",{class:"btn",type:"button",onclick:()=>saveMemeImage(st.m,"preview")},"Save image"),
      h("button",{class:"btn ghost",type:"button",onclick:()=>{st.m=normMeme({bg:"slate",top:st.m.top,bottom:st.m.bottom});changed();update()}},"Reset")),
    group("Template & text",true,chips("Template",MM.layouts,"layout"),h("div",{class:"field"},topL,top),h("div",{class:"field"},botL,bot),chips("Font",MM.fonts,"font"),chips("Text colour",MM.colors,"color")),
    group("The rat",true,chips("Fur",MM.furs,"fur",{thumbs:"fur"}),chips("Ears",MM.ears,"ears",{thumbs:"ears"}),face,face2,
      chips("Hat",MM.hats,"hat",{thumbs:"hat"}),chips("Face & outfit",MM.gear,"gear",{thumbs:"gear"}),chips("Holding",MM.items,"item",{thumbs:"item"})),
    group("Scene & chaos",false,chips("Background",MM.bgs,"bg",{swatch:true}),chips("How many rats",MM.counts,"count"),chips("Size",MM.sizes,"size"),
      chips("Movement",MM.moves,"move"),chips("Stickers (pick up to 6)",MM.stickers,"stickers",{multi:true}),chips("Filter",MM.filters,"filter")));
  setText();update();
  // Upload mode.
  const inp=h("input",{type:"file",id:"rat-file",accept:"image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm"});
  const dropName=h("span",{text:"Pick a rat image, GIF or video"}),filePrev=h("div",{class:"preview",hidden:true});
  inp.addEventListener("change",()=>{const f=inp.files&&inp.files[0];if(!f)return;if(st.url)URL.revokeObjectURL(st.url);st.file=f;st.url=URL.createObjectURL(f);changed();
    dropName.textContent=f.name;filePrev.replaceChildren(/^video\//.test(f.type)?h("video",{src:st.url,muted:true,loop:true,autoplay:true,playsinline:true}):h("img",{src:st.url,alt:"Preview"}));filePrev.hidden=false});
  const uploadSec=h("div",{class:"mk-sec"},h("label",{class:"drop",for:"rat-file"},dropName,h("span",{class:"muted",text:"JPG, PNG, GIF, WebP, MP4 or WebM, up to 20 MB"}),inp),filePrev);
  const seg=S.assets?h("div",{class:"seg"},[["upload","Upload a meme"],["meme","Make a Krysa meme"]].map(([k,l])=>h("button",{type:"button","data-v":k,onclick:()=>{st.mode=k;showMode()}},l)))
    :h("p",{class:"muted",text:"Uploads aren't available here. You can still make a Krysa meme."});
  const showMode=()=>{memeSec.hidden=st.mode!=="meme";uploadSec.hidden=st.mode!=="upload";if(S.assets)for(const b of seg.children)b.setAttribute("aria-pressed",String(b.dataset.v===st.mode));err.textContent=""};
  showMode();
  const cap=h("input",{id:"rat-cap",maxlength:"140",placeholder:"Optional caption",autocomplete:"off",oninput:e=>{st.caption=e.target.value}});
  const body=h("div",{class:"mk"},seg,memeSec,uploadSec,h("div",{class:"field"},h("label",{for:"rat-cap",text:"Caption"}),cap));
  const form=h("form",{class:"sheet",onsubmit:async e=>{e.preventDefault();err.textContent="";
      const base={caption:st.caption.trim(),by:S.uid,createdAt:new Date().toISOString(),squeaks:{}};
      if(st.mode==="upload"){
        if(!st.file){err.textContent="Pick a file first";document.getElementById("rat-file")?.focus();return}
        submit.disabled=true;submit.textContent="Uploading…";
        try{const prep=await prepFile(st.file);if(!prep){throw{code:"unsupported_type"}}
          const ar=await mediaRatio(prep.blob,prep.kind);
          const up=await S.assets.upload(prep.blob);
          const ok=await write(()=>S.db.collection("rats").add({...base,type:prep.kind,assetId:up.id,...(ar?{ar:Math.round(ar*1000)/1000}:{})}),"Rat posted");
          if(ok){close();scurry()}else{try{await S.assets.delete(up.id)}catch(x){}}
        }catch(x){err.textContent=uploadErr(x)}finally{submit.disabled=false;submit.textContent="Post rat"}
      }else{
        const m=normMeme(st.m);m.top=m.top.trim();m.bottom=m.bottom.trim();
        const ok=await write(()=>S.db.collection("rats").add({...base,type:"meme",...m}),"Rat posted");
        if(ok){close();scurry({cheese:true})}
      }}},
    h("h3",{id:"mk-title",tabindex:"-1",autofocus:true,text:remix?"Remix this rat":"Post a rat"}),body,err,acts);
  ov=openOverlay({labelledby:"mk-title",content:form,onCancel:ask,onClose:()=>{if(st.url)URL.revokeObjectURL(st.url)}});
}

export async function saveMemeImage(m,id){
  if(!S.downloads){toast("Saving images isn't available here");return}
  let blob;try{blob=await memeToPng(m,id)}catch(e){toast("Couldn't draw that meme. Try again.");return}
  const slug=(String(m.top||m.bottom||"krysa").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"krysa");
  try{await S.downloads.save({filename:`krysa-${slug}.png`,data:blob})}
  catch(e){const c=e&&e.code;if(c==="declined")return;toast(c==="rate_limited"?"A save is already open. Finish that first.":"Couldn't save the image.")}
}
