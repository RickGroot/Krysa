/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


export const KINDS={work:"Work",food:"Food & drink",coffee:"Coffee",sight:"Sightseeing",night:"Night out",travel:"Travel"};

export const TABS=["today","week","rats","money","trip"];

/** Where the old tab names now live: saved sessions, #links and the push function (supabase/functions) still use them. */
export const TAB_ALIAS={plan:"today",ideas:"week",flights:"trip",todo:"trip",info:"trip"};

/** The part of a tab an old name points at, so "Open" on a to-do reminder lands on the to-dos. */
export const TAB_SPOT={flights:"flights",todo:"todo",info:"stay",ideas:"ideas"};

export const BASE={lat:50.0875,lng:14.4213};

export const S: any = {db:null,uid:null,canWrite:true,tab:"today",flights:[],wall:{view:"feed",sort:"new",filter:"all"},week:{view:"days"},ideaFilter:"all",info:{},events:[],ideas:[],todos:[],people:[],expenses:[],rats:[],conv:{amt:"",from:"CZK"},assets:null,isOwner:false,user:null,profiles:{},loaded:false};

try{const t=sessionStorage.getItem("pw-tab");if(t)S.savedTab=t}catch(e){}

try{const w=JSON.parse(localStorage.getItem("pw-wall")||"null");if(w&&typeof w==="object")Object.assign(S.wall,{view:["feed","grid"].includes(w.view)?w.view:"feed",sort:["new","top","shuffle"].includes(w.sort)?w.sort:"new",filter:["all","memes","uploads","mine"].includes(w.filter)?w.filter:"all"})}catch(e){}

try{const v=localStorage.getItem("pw-week");if(v==="ideas")S.week.view="ideas"}catch(e){}

export const pname=id=>(S.people.find(p=>p.id===id)||{}).name||"Someone";

export const kindOpts=Object.entries(KINDS);

export const kindOf=k=>KINDS[k]?k:"work";
