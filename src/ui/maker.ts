/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { memeToPng } from "../art/export";
import { memeEl } from "../art/meme";
import { MM, TEXT_LABELS, normMeme, pickCaption, surpriseMeme } from "../art/model";
import { ratSvg } from "../art/rat";
import { S } from "../state";
import { write } from "./core";
import { h, toast } from "./dom";
import { scurry } from "./idle";

export function uploadErr(e){const c=e&&e.code;return c==="too_large"?"That file is over 20 MB. Try a smaller image or a shorter clip.":c==="unsupported_type"?"That format isn't supported. Use JPG, PNG, GIF, WebP, MP4 or WebM.":c==="quota_or_state"?"The Rat Wall is out of storage. Delete a few old posts first.":c==="rate_limited"?"Slow down, rat. Try again in a moment.":c==="upstream_auth"?"Your session expired. Reload the page and try again.":(c==="not_granted"||c==="capability_disabled"||c==="capability_removed")?"Uploads need edit access to this planner.":"Upload failed. Try again."}

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

export function postRat(prefill?){
  const remix=!!(prefill&&prefill.type==="meme");
  const st={mode:remix||!S.assets?"meme":"upload",file:null,url:null,caption:"",m:remix?normMeme(prefill):normMeme({bg:"slate"})};
  if(!st.m.bg)st.m.bg="slate";
  const scrim=h("div",{class:"scrim",onclick:e=>{if(e.target===scrim)close()}});
  const close=()=>{if(st.url)URL.revokeObjectURL(st.url);scrim.remove();document.removeEventListener("keydown",esc)};
  const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const err=h("div",{class:"err"});const body=h("div",{class:"mk",style:"display:grid;gap:12px"});
  const submit=h("button",{class:"btn primary",type:"submit"},"Post rat");
  let formEl=null;
  const prev=h("div",{class:"mk-prev"});
  const paint=()=>prev.replaceChildren(memeEl(st.m,"preview"));
  const set=(k,v)=>{st.m[k]=v;draw()};
  const chips=(label,list,key,opt: any = {})=>{
    const row=h("div",{class:"chips"+(opt.thumbs?" thumbs":"")});
    for(const[k,l]of list){const on=opt.multi?st.m[key].includes(k):String(st.m[key])===k;
      const b=h("button",{type:"button","aria-pressed":on,title:l,onclick:()=>{if(opt.multi){const a=st.m[key];set(key,on?a.filter(x=>x!==k):[...a,k].slice(-6))}else set(key,k)}});
      if(opt.thumbs){b.setAttribute("aria-label",l);const sv=ratSvg({[opt.thumbs]:k});sv.setAttribute("viewBox",opt.thumbs==="item"||opt.thumbs==="fur"?"0 0 120 120":opt.thumbs==="gear"?"22 14 76 92":opt.thumbs==="ears"?"14 8 92 70":"24 -2 72 78");b.append(sv)}
      else if(opt.swatch){b.setAttribute("aria-label",l);b.classList.add("sw");b.append(h("span",{class:"swc bg-"+k}))}
      else b.textContent=l;
      row.append(b)}
    return h("div",{class:"field"},h("span",{class:"lbl",text:label}),row)};
  const group=(title,open,...kids)=>{const d=h("details",open?{open:true}:null,h("summary",{text:title}),h("div",{class:"mk-g"},...kids));return d};
  const draw=()=>{
    const openState=[...body.querySelectorAll("details")].map(d=>d.open);const sc=formEl?formEl.scrollTop:0;
    body.replaceChildren();err.textContent="";
    if(S.assets)body.append(h("div",{class:"seg"},[["upload","Upload a meme"],["meme","Make a Krysa meme"]].map(([k,l])=>h("button",{type:"button","aria-pressed":st.mode===k,onclick:()=>{st.mode=k;draw()}},l))));
    else body.append(h("p",{class:"muted",text:"Image uploads need edit access. You can still make a Krysa meme."}));
    if(st.mode==="upload"){
      const inp=h("input",{type:"file",id:"rat-file",accept:"image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm"});
      inp.addEventListener("change",()=>{const f=inp.files&&inp.files[0];if(!f)return;if(st.url)URL.revokeObjectURL(st.url);st.file=f;st.url=URL.createObjectURL(f);draw()});
      body.append(h("label",{class:"drop",for:"rat-file"},h("span",{text:st.file?st.file.name:"Pick a rat image, GIF or video"}),h("span",{class:"muted",text:"JPG, PNG, GIF, WebP, MP4 or WebM, up to 20 MB"}),inp));
      if(st.url)body.append(h("div",{class:"preview"},/^video\//.test(st.file.type)?h("video",{src:st.url,muted:true,loop:true,autoplay:true,playsinline:true}):h("img",{src:st.url,alt:"Preview"})));
    }else{
      paint();body.append(prev);
      body.append(h("div",{class:"mk-actions"},
        h("button",{class:"btn",type:"button",onclick:()=>{st.m=surpriseMeme();draw()}},"Surprise me"),
        h("button",{class:"btn",type:"button",onclick:()=>{const[t,b]=pickCaption(st.m.layout);st.m.top=t;st.m.bottom=b;draw()}},"New caption"),
        S.downloads&&h("button",{class:"btn",type:"button",onclick:()=>saveMemeImage(st.m,"preview")},"Save image"),
        h("button",{class:"btn ghost",type:"button",onclick:()=>{st.m=normMeme({bg:"slate",top:st.m.top,bottom:st.m.bottom});draw()}},"Reset")));
      const [l1,l2]=TEXT_LABELS[st.m.layout]||TEXT_LABELS.classic;
      const top=h("input",{id:"rat-top",maxlength:"120",placeholder:"WHEN THE LOKÁL BOOKING",autocomplete:"off",oninput:e=>{st.m.top=e.target.value;paint()}});top.value=st.m.top;
      const bot=h("input",{id:"rat-bot",maxlength:"160",placeholder:"GOES THROUGH",autocomplete:"off",oninput:e=>{st.m.bottom=e.target.value;paint()}});bot.value=st.m.bottom;
      const two=st.m.layout==="duo"||st.m.layout==="stack";
      const groups=[
        group("Template & text",true,chips("Template",MM.layouts,"layout"),
          h("div",{class:"field"},h("label",{for:"rat-top",text:l1}),top),h("div",{class:"field"},h("label",{for:"rat-bot",text:l2}),bot),
          chips("Font",MM.fonts,"font"),chips("Text colour",MM.colors,"color")),
        group("The rat",true,chips("Fur",MM.furs,"fur",{thumbs:"fur"}),chips("Ears",MM.ears,"ears",{thumbs:"ears"}),chips(two?"First rat's face":"Face",MM.faces,"face",{thumbs:"face"}),
          two&&chips("Second rat's face",MM.faces,"face2",{thumbs:"face"}),
          chips("Hat",MM.hats,"hat",{thumbs:"hat"}),chips("Face & outfit",MM.gear,"gear",{thumbs:"gear"}),chips("Holding",MM.items,"item",{thumbs:"item"})),
        group("Scene & chaos",false,chips("Background",MM.bgs,"bg",{swatch:true}),chips("How many rats",MM.counts,"count"),chips("Size",MM.sizes,"size"),
          chips("Movement",MM.moves,"move"),chips("Stickers (pick up to 6)",MM.stickers,"stickers",{multi:true}),chips("Filter",MM.filters,"filter")),
      ];
      groups.forEach((g,i)=>{if(openState.length>i+0&&openState[i]!==undefined)g.open=openState[i];body.append(g)});
    }
    const cap=h("input",{id:"rat-cap",maxlength:"140",placeholder:"Optional caption",autocomplete:"off",oninput:e=>{st.caption=e.target.value}});cap.value=st.caption;
    body.append(h("div",{class:"field"},h("label",{for:"rat-cap",text:"Caption"}),cap));
    if(formEl)formEl.scrollTop=sc;
  };
  const form=h("form",{class:"sheet",onsubmit:async e=>{e.preventDefault();err.textContent="";
      const base={caption:st.caption.trim(),by:S.uid,createdAt:new Date().toISOString(),squeaks:{}};
      if(st.mode==="upload"){
        if(!st.file){err.textContent="Pick a file first";return}
        submit.disabled=true;submit.textContent="Uploading…";
        try{const prep=await prepFile(st.file);if(!prep){throw{code:"unsupported_type"}}
          const up=await S.assets.upload(prep.blob);
          const ok=await write(()=>S.db.collection("rats").add({...base,type:prep.kind,assetId:up.id}),"Rat posted");
          if(ok){close();scurry()}else{try{await S.assets.delete(up.id)}catch(x){}}
        }catch(x){err.textContent=uploadErr(x)}finally{submit.disabled=false;submit.textContent="Post rat"}
      }else{
        const m=normMeme(st.m);m.top=m.top.trim();m.bottom=m.bottom.trim();
        const ok=await write(()=>S.db.collection("rats").add({...base,type:"meme",...m}),"Rat posted");
        if(ok){close();scurry({cheese:true})}
      }}},
    h("h3",{text:remix?"Remix this rat":"Post a rat"}),body,err,
    h("div",{class:"sheetacts"},h("div",{class:"r"},h("button",{class:"btn ghost",type:"button",onclick:close},"Cancel"),submit)));
  formEl=form;draw();scrim.append(form);document.body.append(scrim);
}

export async function saveMemeImage(m,id){
  if(!S.downloads){toast("Saving images isn't available here");return}
  let blob;try{blob=await memeToPng(m,id)}catch(e){toast("Couldn't draw that meme. Try again.");return}
  const slug=(String(m.top||m.bottom||"krysa").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"krysa");
  try{await S.downloads.save({filename:`krysa-${slug}.png`,data:blob})}
  catch(e){const c=e&&e.code;if(c==="declined")return;toast(c==="rate_limited"?"A save is already open. Finish that first.":"Couldn't save the image.")}
}
