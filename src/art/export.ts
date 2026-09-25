/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { stickerLayer } from "./meme";
import { bgFor, normMeme } from "./model";
import { ratSvg } from "./rat";
import { pragueSkyline, skyLayer, stageLayer, synthLayer } from "./scenes";
import { anchor } from "../lib/dates";
import { h } from "../ui/dom";

export const BG_SOLID={slate:"#39424f",tram:"#c1121f",vltava:"#1c5a66",gold:"#b8892b",plum:"#5b3a6e",pink:"#e98aa8",white:"#f4f4f1",black:"#111111"};

export function bgSvg(bg){
  if(BG_SOLID[bg])return `<rect width="100" height="100" fill="${BG_SOLID[bg]}"/>`;
  const lg=(id,stops,vertical=true)=>`<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical?0:1}" y2="${vertical?1:0}">${stops.map(([o,c])=>`<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient></defs><rect width="100" height="100" fill="url(#${id})"/>`;
  if(bg==="sunburst"){let s=`<rect width="100" height="100" fill="#ff9f1c"/>`;for(let i=0;i<36;i+=2){const a1=i*10*Math.PI/180,a2=(i+1)*10*Math.PI/180;s+=`<path d="M50 62L${(50+150*Math.sin(a1)).toFixed(1)} ${(62-150*Math.cos(a1)).toFixed(1)}L${(50+150*Math.sin(a2)).toFixed(1)} ${(62-150*Math.cos(a2)).toFixed(1)}Z" fill="#ffcf3f"/>`}return s}
  if(bg==="vapor")return lg("gv",[[0,"#ff71ce"],[.55,"#b967ff"],[1,"#01cdfe"]]);
  if(bg==="void")return `<defs><radialGradient id="gvo" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="#555"/><stop offset=".5" stop-color="#151515"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="100" height="100" fill="url(#gvo)"/>`;
  if(bg==="prague")return lg("gp",[[0,"#0b1a3a"],[1,"#2b4580"]])+pragueSkyline().innerHTML;
  if(bg==="sky")return lg("gs",[[0,"#7ec8f2"],[1,"#d7f1ff"]])+skyLayer().innerHTML;
  if(bg==="stage")return lg("gst",[[0,"#1a1030"],[1,"#090612"]])+stageLayer().innerHTML;
  if(bg==="synth")return lg("gsy",[[0,"#2a0a4a"],[.62,"#a0287a"],[1,"#a0287a"]])+synthLayer().innerHTML;
  return `<rect width="100" height="100" fill="#39424f"/>`;
}

export function ratSlots(o){
  const P={"1":[[13,13,74,0]],"3":[[1,40,42,0],[57,40,42,1],[25,30,50,0]],"9":[[3,4],[35,2],[66,5],[-3,35],[34,34],[71,36],[5,66],[36,65],[67,67]].map(([x,y],i)=>[x,y,31,i%2])}[o.count]||[[13,13,74,0]];
  return P.map(([x,y,w,m])=>{
    if(o.count==="1"){if(o.size==="tiny")return[39,64,22,m];if(o.size==="huge")return[-35,-6,170,m];return[x,y,w,m]}
    if(o.count==="3"){if(o.size==="tiny")return[x+w*.25,y+w*.5,w*.5,m];if(o.size==="huge"){const w2=w*1.45;return[x-(w2-w)*.5,y-(w2-w)*.6,w2,m]}return[x,y,w,m]}
    if(o.size==="tiny")return[x+w*.2,y+w*.2,w*.6,m];if(o.size==="huge")return[x-w*.175,y-w*.175,w*1.35,m];return[x,y,w,m]});
}

export function artSvgString(o,face,id){
  const bg=o.bg||bgFor(id);
  const rat=ratSvg({face,hat:o.hat,gear:o.gear,item:o.item,fur:o.fur,ears:o.ears}).innerHTML;
  const rats=ratSlots(o).map(([x,y,w,m])=>m?`<g transform="translate(${x+w} ${y}) scale(-1 1)"><svg x="0" y="0" width="${w}" height="${w}" viewBox="0 0 120 120">${rat}</svg></g>`:`<svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 120 120">${rat}</svg>`).join("");
  const mv={tilt:"rotate(-12 50 50)",flip:"translate(100 0) scale(-1 1)",upside:"rotate(180 50 50)"}[o.move]||"";
  const st=(o.stickers.length||o.filter==="fried")?stickerLayer(o).innerHTML:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 100 100">${bgSvg(bg)}<g transform="${mv}">${rats}</g>${st}</svg>`;
}

export function loadImg(src): Promise<any>{return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("image"));i.src=src})}

export async function artImage(o,face,id){return loadImg("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(artSvgString(o,face,id)))}

export const FONT_FAM={impact:"Anton, Impact, 'Arial Narrow Bold', sans-serif",comic:"'Comic Neue','Comic Sans MS',cursive",clean:"Manrope, system-ui, sans-serif",serif:"'Times New Roman', Times, serif",whisper:"Manrope, system-ui, sans-serif"};

export const TEXT_COL={white:"#ffffff",yellow:"#ffe14d",black:"#111111",red:"#ff3b30"};

export function wrapLines(ctx,text,maxW){const words=String(text).split(/\s+/).filter(Boolean);const lines=[];let cur="";for(const w of words){const t=cur?cur+" "+w:w;if(ctx.measureText(t).width<=maxW||!cur)cur=t;else{lines.push(cur);cur=w}}if(cur)lines.push(cur);return lines}

export function fitText(ctx,text,maxW,maxLines,start,min,fontFor){let size=start;for(;size>=min;size-=4){ctx.font=fontFor(size);const l=wrapLines(ctx,text,maxW);if(l.length<=maxLines&&l.every(x=>ctx.measureText(x).width<=maxW))return{size,lines:l}}ctx.font=fontFor(min);return{size:min,lines:wrapLines(ctx,text,maxW)}}

export function drawOverlay(ctx,o,text,cx,y,maxW,anchor,start=92){
  if(!text)return;const f=o.font;const weight=f==="impact"?"400":f==="whisper"?"400":"800";const fam=FONT_FAM[f]||FONT_FAM.impact;
  const t=f==="impact"?text.toUpperCase():f==="whisper"?text.toLowerCase():text;
  const {size,lines}=fitText(ctx,t,maxW,3,f==="whisper"?Math.round(start*.55):start,26,s=>`${weight} ${s}px ${fam}`);
  const lh=size*1.08;ctx.textAlign="center";ctx.textBaseline="top";ctx.lineJoin="round";
  const total=lh*lines.length;let yy=anchor==="bottom"?y-total:y;
  for(const line of lines){
    if(f!=="whisper"){ctx.lineWidth=Math.max(4,size*.14);ctx.strokeStyle=o.color==="black"?"#ffffff":"#000000";ctx.strokeText(line,cx,yy)}
    else{ctx.shadowColor="rgba(0,0,0,.6)";ctx.shadowBlur=8}
    ctx.fillStyle=f==="whisper"?"#ffffff":(TEXT_COL[o.color]||"#fff");ctx.fillText(line,cx,yy);ctx.shadowBlur=0;yy+=lh}
}

export function drawPlain(ctx,o,text,x,y,maxW,{size=54,color="#111",align="left",fam=undefined,weight="700",upper=false,maxLines=4}: any={}){
  if(!text)return 0;const fm=fam||FONT_FAM[o.font]||FONT_FAM.clean;const t=upper||o.font==="impact"?text.toUpperCase():o.font==="whisper"?text.toLowerCase():text;
  const w=o.font==="impact"?"400":weight;const r=fitText(ctx,t,maxW,maxLines,size,22,s=>`${w} ${s}px ${fm}`);
  ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline="top";const lh=r.size*1.2;r.lines.forEach((l,i)=>ctx.fillText(l,align==="center"?x+maxW/2:x,y+i*lh));return r.lines.length*lh;
}

export function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

export async function memeToPng(m,id){
  const o=normMeme(m);id=id||"x";
  try{await Promise.all(["400 80px Anton","700 60px 'Comic Neue'","800 60px Manrope","700 60px Cinzel"].map(f=>document.fonts.load(f)))}catch(e){}
  const W=1080;const A=await artImage(o,o.face,id);const B=(o.layout==="duo"||o.layout==="stack")?await artImage(o,o.face2,id+"b"):null;
  const c=document.createElement("canvas");const ctx=c.getContext("2d");let H=W;
  const setSize=hh=>{c.width=W;c.height=Math.round(hh);H=c.height};
  const L=o.layout;
  if(L==="caption"){const probe=document.createElement("canvas").getContext("2d");probe.font=`600 56px ${FONT_FAM.clean}`;const txt=[o.top,o.bottom].filter(Boolean).join(" ");const lines=txt?Math.min(5,wrapLines(probe,txt,W-108).length):1;const bar=lines*56*1.25+80;setSize(bar+W);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,bar);drawPlain(ctx,o,txt,54,40,W-108,{size:56,color:"#111",maxLines:5});ctx.drawImage(A,0,bar,W,W)}
  else if(L==="poster"){setSize(1420);ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);ctx.drawImage(A,120,96,840,840);ctx.strokeStyle="#eee";ctx.lineWidth=4;ctx.strokeRect(106,82,868,868);
    drawPlain(ctx,o,o.top,60,1010,W-120,{size:100,color:"#fff",align:"center",fam:"'Times New Roman',Times,serif",weight:"400",upper:true,maxLines:2});drawPlain(ctx,o,o.bottom,90,1250,W-180,{size:40,color:"#ccc",align:"center",fam:"'Times New Roman',Times,serif",weight:"400",maxLines:3})}
  else if(L==="duo"){setSize(W/2);ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);ctx.drawImage(A,0,0,537,537);ctx.drawImage(B,543,0,537,537);drawOverlay(ctx,o,o.top,268,516,500,"bottom",64);drawOverlay(ctx,o,o.bottom,811,516,500,"bottom",64)}
  else if(L==="stack"){setSize(W);ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);[[o.top||"Nah",A,0],[o.bottom||"Yeah",B,543]].forEach(([t,img,y])=>{ctx.fillStyle="#fff";ctx.fillRect(0,y,537,537);const hh=drawPlain(ctx,o,t,40,y+220,457,{size:60,color:"#111",align:"center",maxLines:4});void hh;ctx.drawImage(img,543,y,537,537)})}
  else if(L==="speech"){setSize(W);ctx.drawImage(A,0,0,W,W);if(o.top){const probe=ctx;probe.font=`800 52px ${FONT_FAM[o.font]||FONT_FAM.clean}`;const lines=Math.min(4,wrapLines(probe,o.top,640).length);const bh=lines*62+60;ctx.fillStyle="#fff";ctx.strokeStyle="#111";ctx.lineWidth=5;rrect(ctx,54,54,720,bh,40);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(560,54+bh-3);ctx.lineTo(640,54+bh+60);ctx.lineTo(630,54+bh-3);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillRect(556,54+bh-8,78,8);drawPlain(ctx,o,o.top,94,84,640,{size:52,color:"#111",maxLines:4})}drawOverlay(ctx,o,o.bottom,W/2,1036,W-80,"bottom")}
  else if(L==="news"){setSize(W);ctx.drawImage(A,0,0,W,W);ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(40,40,300,52);ctx.fillStyle="#ff3b30";ctx.beginPath();ctx.arc(70,66,11,0,7);ctx.fill();ctx.fillStyle="#fff";ctx.font=`700 30px ${FONT_FAM.clean}`;ctx.textBaseline="middle";ctx.textAlign="left";ctx.fillText("LIVE · PRAHA",92,67);
    const y0=W-300;ctx.fillStyle="#c1121f";ctx.fillRect(0,y0,300,58);ctx.fillStyle="#fff";ctx.font="800 34px Archivo, 'Arial Narrow', sans-serif";ctx.fillText("BREAKING",28,y0+30);ctx.fillStyle="#fff";ctx.fillRect(0,y0+58,W,120);drawPlain(ctx,o,o.top||"LOCAL RAT SPOTTED",32,y0+80,W-64,{size:56,color:"#111",fam:"Archivo, 'Arial Narrow', sans-serif",weight:"800",upper:true,maxLines:2});
    if(o.bottom){ctx.fillStyle="#111";ctx.fillRect(0,y0+178,W,64);ctx.fillStyle="#ffe14d";ctx.font=`600 32px ${FONT_FAM.clean}`;ctx.textBaseline="middle";ctx.textAlign="left";ctx.fillText(`${o.bottom}  •  ${o.bottom}`,24,y0+211)}}
  else if(L==="boarding"){setSize(1000);ctx.fillStyle="#fbf7ee";ctx.fillRect(0,0,W,H);ctx.fillStyle="#c1121f";ctx.fillRect(0,0,W,96);ctx.fillStyle="#fff";ctx.font="800 40px Archivo, 'Arial Narrow', sans-serif";ctx.textBaseline="middle";ctx.textAlign="left";ctx.fillText("KRYSA AIRLINES",44,50);ctx.textAlign="right";ctx.fillText("BOARDING PASS",W-44,50);
    ctx.drawImage(A,44,140,470,470);const x=560;ctx.textAlign="left";ctx.textBaseline="top";ctx.fillStyle="#6b6f75";ctx.font=`700 26px ${FONT_FAM.clean}`;ctx.fillText("PASSENGER",x,150);drawPlain(ctx,o,o.top||"KRYSA",x,186,W-x-44,{size:68,color:"#17181a",fam:"Archivo, 'Arial Narrow', sans-serif",weight:"800",upper:true,maxLines:2});
    ctx.fillStyle="#17181a";ctx.font="800 96px Archivo, 'Arial Narrow', sans-serif";ctx.fillText("AMS",x,340);ctx.fillStyle="#c1121f";ctx.font="700 56px sans-serif";ctx.fillText("✈",x+230,360);ctx.fillStyle="#17181a";ctx.font="800 96px Archivo, 'Arial Narrow', sans-serif";ctx.fillText("PRG",x+310,340);
    [["FLIGHT","KR"+(1300+(id.split("").reduce((n,ch)=>n+ch.charCodeAt(0),0)%99))],["GATE","C7"],["SEAT","1A"],["CLASS","CHEESE"]].forEach(([k,v],i)=>{const xx=x+(i%2)*230,yy=470+Math.floor(i/2)*80;ctx.fillStyle="#6b6f75";ctx.font=`700 22px ${FONT_FAM.clean}`;ctx.fillText(k,xx,yy);ctx.fillStyle="#17181a";ctx.font="800 36px Archivo, 'Arial Narrow', sans-serif";ctx.fillText(v,xx,yy+26)});
    ctx.setLineDash([10,8]);ctx.strokeStyle="#b9b2a3";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(44,650);ctx.lineTo(W-44,650);ctx.stroke();ctx.setLineDash([]);drawPlain(ctx,o,o.bottom,44,676,W-88,{size:40,color:"#17181a",fam:FONT_FAM.clean,weight:"600",maxLines:3});
    for(let i=0,xx=44;xx<W-44;i++){const w=[4,2,6,3,2,5][i%6];ctx.fillStyle="#17181a";ctx.fillRect(xx,860,w,100);xx+=w+[3,5,2,4][i%4]}}
  else if(L==="wanted"){setSize(1500);ctx.fillStyle="#e8d3a2";ctx.fillRect(0,0,W,H);ctx.fillStyle="#3a2412";ctx.textAlign="center";ctx.textBaseline="top";ctx.font="700 190px 'Times New Roman', Times, serif";ctx.fillText("WANTED",W/2,50);ctx.drawImage(A,119,280,842,842);ctx.strokeStyle="#3a2412";ctx.lineWidth=12;ctx.strokeRect(113,274,854,854);
    drawPlain(ctx,o,o.top||"KRYSA",60,1160,W-120,{size:96,color:"#3a2412",align:"center",fam:"'Times New Roman',Times,serif",weight:"800",upper:true,maxLines:1});ctx.font="italic 48px 'Times New Roman', Times, serif";ctx.fillStyle="#3a2412";ctx.textAlign="center";ctx.fillText(o.bottom||"For stealing the last chlebíček",W/2,1290,W-120);ctx.font="700 60px 'Times New Roman', Times, serif";ctx.fillText("REWARD: 500 Kč",W/2,1380)}
  else{setSize(W);ctx.drawImage(A,0,0,W,W);drawOverlay(ctx,o,o.top,W/2,36,W-80,"top");drawOverlay(ctx,o,o.bottom,W/2,W-36,W-80,"bottom")}
  if(o.filter==="vhs"||o.filter==="night"){ctx.fillStyle="rgba(0,0,0,.18)";for(let y=0;y<H;y+=6)ctx.fillRect(0,y,W,3);if(o.filter==="vhs"){ctx.fillStyle="#fff";ctx.font="700 40px ui-monospace, Menlo, monospace";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText("PLAY ▶",50,H/2)}}
  const FX={fried:"saturate(3.4) contrast(1.9) brightness(1.08) hue-rotate(-10deg)",noir:"grayscale(1) contrast(1.35)",vintage:"sepia(.85) saturate(1.3) contrast(.92)",potato:"blur(3px) contrast(1.5) saturate(1.8)",invert:"invert(1) hue-rotate(180deg)",trippy:"hue-rotate(90deg) saturate(1.6)",night:"grayscale(1) sepia(1) hue-rotate(60deg) saturate(4) brightness(.95) contrast(1.2)",vhs:"saturate(1.45) contrast(1.1)"};
  let out=c;
  if(FX[o.filter]&&"filter" in ctx){const c2=document.createElement("canvas");c2.width=c.width;c2.height=c.height;const x2=c2.getContext("2d");x2.filter=FX[o.filter];x2.drawImage(c,0,0);out=c2}
  return await new Promise((res,rej)=>out.toBlob(b=>b?res(b):rej(new Error("png")),"image/png"));
}
