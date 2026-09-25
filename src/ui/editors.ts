/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { fmtD, joinDT, splitDT, todayIso } from "../lib/dates";
import { hasCoords } from "../lib/geo";
import { S, kindOpts } from "../state";
import { rate, tripDays } from "./bound";
import { openSheet, removeDocs, snapOf, write } from "./core";
import { toast } from "./dom";
import { scurry } from "./idle";

export function editEvent(ev: any = {},preset: any = {}){
  const days=tripDays();const d=ev.date||preset.date||days[0]||"";
  openSheet({title:ev.id?(ev.draft?"Suggested plan item":"Edit plan item"):"Add to the plan",saveLabel:ev.draft?"Keep":"Save",
    fields:[{id:"title",label:"What",value:ev.title||preset.title,placeholder:"Team dinner at Lokál"},
      [{id:"date",label:"Day",type:"date",value:d},{id:"kind",label:"Type",type:"select",options:kindOpts,value:ev.kind||preset.kind||"work"}],
      [{id:"time",label:"Start",type:"time",value:ev.time},{id:"endTime",label:"End",type:"time",value:ev.endTime}],
      {id:"location",label:"Where",value:ev.location??preset.location,placeholder:"Place name and street"},
      {id:"notes",label:"Notes",type:"textarea",value:ev.notes??preset.notes,placeholder:"Who's joining, booking ref, dress code…"}],
    onSave:async v=>{if(!v.title)return"Give it a name first";if(!v.date)return"Pick a day";
      const data: any={title:v.title,date:v.date,kind:v.kind,time:v.time,endTime:v.endTime,location:v.location,notes:v.notes,draft:false,updatedAt:new Date().toISOString()};
      if(ev.id){if(v.location!==(ev.location||"")){data.lat=null;data.lng=null}return write(()=>S.db.doc("events/"+ev.id).update(data),ev.draft?"Kept":"Saved")}
      data.createdBy=S.uid;data.createdAt=data.updatedAt;
      if(hasCoords(preset)&&v.location===((preset as any).location||"")){data.lat=preset.lat;data.lng=preset.lng}
      const ok=await write(()=>S.db.collection("events").add(data),"Added to "+fmtD(v.date));
      if(ok&&preset.fromIdea)write(()=>S.db.doc("ideas/"+preset.fromIdea).update({scheduled:v.date}));
      return ok},
    onDelete:ev.id?()=>removeDocs([snapOf("events",ev)],"Plan item deleted"):null});
}

export function editIdea(it: any = {}){
  openSheet({title:it.id?"Edit idea":"Suggest something",
    fields:[{id:"title",label:"Idea",value:it.title,placeholder:"Sunset beers at Letná"},
      {id:"kind",label:"Type",type:"select",options:kindOpts,value:it.kind||"food"},
      {id:"location",label:"Where",value:it.location,placeholder:"Place name and street"},
      {id:"link",label:"Link",type:"url",value:it.link,placeholder:"https://…"},
      {id:"notes",label:"Why / details",type:"textarea",value:it.notes}],
    onSave:v=>{if(!v.title)return"Describe the idea first";if(v.link&&!/^https?:\/\//i.test(v.link))return"Links start with https://";
      const data: any={title:v.title,kind:v.kind,location:v.location,link:v.link,notes:v.notes};
      if(it.id){if(v.location!==(it.location||"")){data.lat=null;data.lng=null}return write(()=>S.db.doc("ideas/"+it.id).update(data),"Saved")}
      return write(()=>S.db.collection("ideas").add({...data,votes:S.uid?{[S.uid]:true}:{},createdBy:S.uid,createdAt:new Date().toISOString()}),"Idea added")},
    onDelete:it.id?()=>removeDocs([snapOf("ideas",it)],"Idea deleted"):null});
}

export function editTodo(t: any = {}){
  openSheet({title:t.id?"Edit to-do":"New to-do",
    fields:[{id:"text",label:"Task",value:t.text,placeholder:"Book the team dinner"},
      [{id:"owner",label:"Who",value:t.owner,placeholder:"Name"},{id:"due",label:"By",type:"date",value:t.due}]],
    onSave:v=>{if(!v.text)return"Write the task first";const data: any={text:v.text,owner:v.owner,due:v.due};
      if(t.id)return write(()=>S.db.doc("todos/"+t.id).update(data),"Saved");
      return write(()=>S.db.collection("todos").add({...data,done:false,createdAt:new Date().toISOString()}),"Added")},
    onDelete:t.id?()=>removeDocs([snapOf("todos",t)],"To-do deleted"):null});
}

export function editPerson(p: any = {}){
  const[ad,at]=splitDT(p.arrive),[dd,dt]=splitDT(p.depart);
  openSheet({title:p.id?"Edit traveller":"Add traveller",
    fields:[{id:"name",label:"Name",value:p.name},
      [{id:"ad",label:"Arrives",type:"date",value:ad},{id:"at",label:"Landing time",type:"time",value:at}],
      {id:"arriveBy",label:"Flight / train in",value:p.arriveBy,placeholder:"e.g. AB1234"},
      [{id:"dd",label:"Leaves",type:"date",value:dd},{id:"dt",label:"Departure time",type:"time",value:dt}],
      {id:"departBy",label:"Flight / train out",value:p.departBy,placeholder:"e.g. AB1235"},
      {id:"phone",label:"Phone (optional)",type:"tel",value:p.phone},{id:"notes",label:"Notes",value:p.notes,placeholder:"Diet, room, anything useful"}],
    onSave:v=>{if(!v.name)return"Add a name";
      const data: any={name:v.name,arrive:joinDT(v.ad,v.at),arriveBy:v.arriveBy,depart:joinDT(v.dd,v.dt),departBy:v.departBy,phone:v.phone,notes:v.notes};
      if(p.id)return write(()=>S.db.doc("people/"+p.id).update(data),"Saved");
      return write(()=>S.db.collection("people").add(data),"Added")},
    onDelete:p.id?()=>removeDocs([snapOf("people",p)],"Traveller removed"):null});
}

export function editInfo(){
  const i=S.info;
  openSheet({title:"Trip details",
    fields:[{id:"title",label:"Trip name",value:i.title,placeholder:"Prague week"},
      [{id:"startDate",label:"First day",type:"date",value:i.startDate},{id:"endDate",label:"Last day",type:"date",value:i.endDate}],
      {id:"hotelName",label:"Stay",value:i.hotelName},{id:"hotelAddress",label:"Address",value:i.hotelAddress},
      [{id:"checkIn",label:"Check-in",value:i.checkIn,placeholder:"15:00"},{id:"checkOut",label:"Check-out",value:i.checkOut,placeholder:"11:00"}],
      {id:"booking",label:"Booking reference / key code",value:i.booking},
      {id:"workBase",label:"Work location",value:i.workBase,placeholder:"Office / venue address"},
      {id:"notes",label:"General notes",type:"textarea",value:i.notes}],
    onSave:v=>{if(v.startDate&&v.endDate&&v.endDate<v.startDate)return"The last day is before the first day";
      return write(()=>S.db.doc("trip/info").set({...S.info,...v}),"Trip details saved")}});
}

export function editExpense(x: any = {}){
  if(!S.people.length){toast("Add travellers in Info first");return}
  const all=S.people.map(p=>[p.id,p.name||"Someone"]);
  openSheet({title:x.id?"Edit expense":"Log an expense",
    fields:[{id:"what",label:"What",value:x.what,placeholder:"Dinner at Lokál"},
      [{id:"amount",label:"Amount",value:x.amount!=null?String(x.amount):"",inputmode:"decimal",placeholder:"1250"},{id:"currency",label:"Currency",type:"select",options:[["CZK","CZK (Kč)"],["EUR","EUR (€)"]],value:x.currency||"CZK"}],
      [{id:"paidBy",label:"Paid by",type:"select",options:all,value:x.paidBy||(S.people.find(p=>p.id===S.meId)||S.people[0]).id},{id:"date",label:"Day",type:"date",value:x.date||todayIso()}],
      {id:"split",label:"Split between",type:"checks",options:all,value:x.split||S.people.map(p=>p.id)}],
    onSave:v=>{const amount=parseFloat(String(v.amount).replace(/\s/g,"").replace(",","."));
      if(!v.what)return"Say what it was for";if(!(amount>0))return"Enter an amount above zero";if(!v.split.length)return"Pick at least one person to split with";
      const data: any={what:v.what,amount:Math.round(amount*100)/100,currency:v.currency,paidBy:v.paidBy,date:v.date,split:v.split};
      if(x.id)return write(()=>S.db.doc("expenses/"+x.id).update(data),"Saved");
      return write(()=>S.db.collection("expenses").add({...data,createdBy:S.uid,createdAt:new Date().toISOString()}),"Logged").then(ok=>{if(ok)scurry();return ok})},
    onDelete:x.id?()=>removeDocs([snapOf("expenses",x)],"Expense deleted"):null});
}

export function editRate(){
  openSheet({title:"Exchange rate",fields:[{id:"r",label:"CZK per 1 EUR",value:String(rate()),inputmode:"decimal"}],
    onSave:v=>{const r=parseFloat(v.r.replace(",","."));if(!(r>1&&r<100))return"Enter a rate like 24.3";return write(()=>S.db.doc("trip/info").set({...S.info,eurCzk:r}),"Rate updated")}});
}
