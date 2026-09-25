/* eslint-disable */
// More → Notifications: switch push notifications on or off for this device.
// The krysa-notify Supabase function does the sending (see README).
import { b64uDecode } from "../lib/webpush";
import { S } from "../state";
import { h, toast } from "./dom";

const PREFS_KEY = "krysa-push-prefs";

export function pushPrefs(){try{const p=JSON.parse(localStorage.getItem(PREFS_KEY)||"null");if(p&&typeof p==="object")return{reminders:p.reminders!==false,posts:p.posts!==false}}catch(e){}return{reminders:true,posts:true}}
const savePrefs=p=>{try{localStorage.setItem(PREFS_KEY,JSON.stringify(p))}catch(e){}};

const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const installed=()=>matchMedia("(display-mode: standalone)").matches||(navigator as any).standalone===true;

/** Why notifications can't be switched on here, or null when they can. */
export function pushBlocker(){
  if(!S.push)return"Notifications work in the shared trip, not in this demo.";
  if(import.meta.env.DEV)return"Notifications need the built app, with its service worker: run pnpm build, then pnpm preview.";
  if(isIOS()&&!installed())return"On iPhone and iPad, notifications only work from the Home Screen. Tap Share, then Add to Home Screen, open Krysa from there and switch them on here.";
  if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window))return"This browser can't show notifications.";
  if(Notification.permission==="denied")return"Notifications are blocked for Krysa. Allow them in your browser or phone settings, then try again.";
  return null;
}

async function currentSub(){
  if(import.meta.env.DEV||!("serviceWorker" in navigator))return null;
  const reg=await navigator.serviceWorker.getRegistration();
  return reg&&reg.pushManager?reg.pushManager.getSubscription():null;
}

const keysOf=sub=>{const j=sub.toJSON();return{endpoint:j.endpoint,p256dh:(j.keys&&j.keys.p256dh)||"",auth:(j.keys&&j.keys.auth)||""}};

async function enable(prefs){
  let key=null;
  try{key=await S.push.publicKey()}catch(e){}
  if(!key)throw new Error("Notifications aren't set up on the server yet (see the README).");
  // Must follow the tap directly: browsers only show the permission prompt for a user action.
  if((await Notification.requestPermission())!=="granted")throw new Error("Notifications weren't allowed.");
  const reg=await navigator.serviceWorker.ready;
  const sub=(await reg.pushManager.getSubscription())||(await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64uDecode(key)}));
  await S.push.save(keysOf(sub),prefs);
}

async function disable(){
  const sub=await currentSub();
  if(!sub)return;
  const{endpoint}=sub;
  await sub.unsubscribe();
  await S.push.remove(endpoint);
}

export async function pushOn(){try{return!pushBlocker()&&!!(await currentSub())}catch(e){return false}}

/** On start: keep the server's copy of this device's subscription (and choices) current. */
export async function syncPush(){
  try{
    if(pushBlocker()||Notification.permission!=="granted")return;
    const sub=await currentSub();
    if(sub)await S.push.save(keysOf(sub),pushPrefs());
  }catch(e){/* best effort: the next start tries again */}
}

export function openNotifications(){
  const scrim=h("div",{class:"scrim",onclick:e=>{if(e.target===scrim)close()}});
  const close=()=>{scrim.remove();document.removeEventListener("keydown",esc)};
  const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const sheet=h("div",{class:"sheet",role:"dialog","aria-label":"Notifications"});
  scrim.append(sheet);document.body.append(scrim);
  const draw=async()=>{
    const blocker=pushBlocker(),on=await pushOn(),prefs=pushPrefs();
    const err=h("p",{class:"err",role:"status"});
    const box=(k,label)=>h("label",null,h("input",{type:"checkbox",checked:prefs[k],disabled:!!blocker,onchange:async e=>{
      prefs[k]=e.target.checked;savePrefs(prefs);err.textContent="";
      if(!on)return;
      try{const sub=await currentSub();if(sub)await S.push.save(keysOf(sub),prefs)}catch(x){err.textContent="Couldn't save that. Try again."}}}),label);
    const btn=h("button",{class:"btn primary",type:"button",disabled:!!blocker,onclick:async()=>{
      btn.disabled=true;err.textContent="";
      try{if(on){await disable();toast("Notifications off on this device")}else{await enable(prefs);toast("Notifications on")}await draw()}
      catch(x){err.textContent=(x&&x.message)||"Couldn't change notifications. Try again.";btn.disabled=false}}},on?"Turn off":"Turn on");
    sheet.replaceChildren(
      h("h3",{text:"Notifications"}),
      h("p",{class:"muted",text:"A ping on this device, even when Krysa is closed. Each phone or browser switches on by itself."}),
      h("div",{class:"checks",style:"flex-direction:column;align-items:flex-start;gap:10px"},
        box("reminders","Reminders: check-in, leaving for the airport, what's next and to-dos that are due"),
        box("posts","New rats on the wall")),
      h("p",{class:"muted",text:blocker||(on?"On for this device.":"Off for this device.")}),
      err,
      h("div",{class:"sheetacts"},h("div",{class:"r"},h("button",{class:"btn ghost",type:"button",onclick:close},"Close"),btn)));
  };
  void draw();
}
