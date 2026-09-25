/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


export const KINDS={work:"Work",food:"Food & drink",coffee:"Coffee",sight:"Sightseeing",night:"Night out",travel:"Travel"};

export const TABS=["rats","flights","plan","ideas","todo","money","info"];

export const BASE={lat:50.0875,lng:14.4213};

export const S: any = {db:null,uid:null,canWrite:true,tab:"rats",flights:[],wall:{view:"feed",sort:"new",filter:"all"},ideaFilter:"all",info:{},events:[],ideas:[],todos:[],people:[],expenses:[],rats:[],conv:{amt:"",from:"CZK"},assets:null,isOwner:false,user:null,profiles:{},scores:{},myCatches:0,loaded:false};

try{const t=sessionStorage.getItem("pw-tab");if(TABS.includes(t))S.tab=t}catch(e){}

try{const w=JSON.parse(localStorage.getItem("pw-wall")||"null");if(w&&typeof w==="object")Object.assign(S.wall,{view:["feed","grid"].includes(w.view)?w.view:"feed",sort:["new","top","shuffle"].includes(w.sort)?w.sort:"new",filter:["all","memes","uploads","mine"].includes(w.filter)?w.filter:"all"})}catch(e){}

export const pname=id=>(S.people.find(p=>p.id===id)||{}).name||"Someone";

export const kindOpts=Object.entries(KINDS);
