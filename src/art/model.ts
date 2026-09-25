/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).


export const MM={
  layouts:[["classic","Classic"],["caption","Caption bar"],["poster","Poster"],["duo","Side by side"],["stack","Nah / Yeah"],["speech","Speech bubble"],["news","Breaking news"],["boarding","Boarding pass"],["wanted","Wanted poster"]],
  furs:[["grey","Grey"],["agouti","Agouti"],["black","Black"],["white","Albino"],["hooded","Hooded"],["siamese","Siamese"],["golden","Golden"],["blue","Blue"]],
  ears:[["standard","Top ears"],["dumbo","Dumbo ears"]],
  faces:[["classic","Normal"],["happy","Happy"],["sus","Suspicious"],["side","Side-eye"],["shocked","Shocked"],["cry","Crying"],["angry","Angry"],["love","In love"],["smug","Smug"],["star","Starstruck"],["crazy","Unhinged"],["dead","Dead inside"],["sleep","Asleep"],["wink","Wink"],["blep","Blep"],["pleading","Pleading"]],
  hats:[["none","No hat"],["party","Party hat"],["crown","Crown"],["beanie","Beanie"],["propeller","Propeller cap"],["tophat","Top hat"],["cowboy","Cowboy"],["halo","Halo"],["bow","Bow"],["headphones","Headphones"],["flowers","Flowers"],["wizard","Wizard"],["viking","Viking"],["grad","Graduate"],["pilot","Captain"]],
  gear:[["none","Nothing"],["shades","Shades"],["nerd","Nerd glasses"],["monocle","Monocle"],["mustache","Mustache"],["clown","Clown nose"],["bowtie","Bow tie"],["lanyard","FrontKon lanyard"],["scarf","Scarf"]],
  items:[["none","Nothing"],["beer","Pilsner"],["cheese","Cheese"],["coffee","Coffee"],["laptop","Laptop"],["phone","Phone"],["trdelnik","Trdelník"],["pizza","Pizza"],["money","100 Kč"],["rose","Rose"],["balloon","Balloon"],["sign","Sign"],["boarding","Boarding pass"],["suitcase","Suitcase"],["mic","Microphone"],["sausage","Klobása"]],
  bgs:[["slate","Slate"],["tram","Tram red"],["vltava","Vltava"],["gold","Gold"],["plum","Plum"],["pink","Pink"],["white","White"],["black","Black"],["sunburst","Sunburst"],["prague","Prague night"],["vapor","Vaporwave"],["void","The void"],["sky","Sky"],["stage","On stage"],["synth","Synthwave"]],
  filters:[["none","None"],["fried","Deep fried"],["noir","Noir"],["vintage","Vintage"],["potato","Potato quality"],["invert","Inverted"],["trippy","Trippy"],["night","Night vision"],["vhs","VHS tape"]],
  counts:[["1","One rat"],["3","Rat gang"],["9","The horde"]],
  sizes:[["normal","Normal"],["tiny","Tiny"],["huge","Way too close"]],
  moves:[["none","Still"],["tilt","Tilted"],["flip","Flipped"],["upside","Upside down"],["bounce","Bouncing"],["spin","Spinning"],["shake","Nervous"],["vibe","Vibing"]],
  stickers:[["sparkles","Sparkles"],["hearts","Hearts"],["sweat","Sweat drop"],["vein","Anger"],["question","???"],["exclaim","!!"],["zzz","Zzz"],["fire","Fire"],["rain","Rain cloud"],["cheese","Cheese rain"],["money","Money rain"],["confetti","Confetti"],["plane","Plane"],["notes","Music"],["lasers","Laser eyes"],["burst","SQUEAK!"]],
  fonts:[["impact","Impact"],["comic","Comic"],["clean","Clean"],["serif","Serif"],["whisper","whisper"]],
  colors:[["white","White"],["yellow","Yellow"],["black","Black"],["red","Red"]],
};

export const MEME_BG=["tram","vltava","gold","slate","plum"];

export const bgFor=id=>{let n=0;for(const c of String(id))n=(n*31+c.charCodeAt(0))>>>0;return MEME_BG[n%MEME_BG.length]};

export const mmPick=(list,v,d)=>list.some(([k])=>k===v)?v:d;

export function normMeme(m: any = {}){
  const st=Array.isArray(m.stickers)?[...new Set(m.stickers)].filter(x=>MM.stickers.some(([k])=>k===x)).slice(0,6):[];
  return {fur:mmPick(MM.furs,m.fur,"grey"),ears:mmPick(MM.ears,m.ears,"standard"),layout:mmPick(MM.layouts,m.layout,"classic"),face:mmPick(MM.faces,m.face,m.pose==="sus"?"sus":"classic"),face2:mmPick(MM.faces,m.face2,"happy"),
    hat:mmPick(MM.hats,m.hat,"none"),gear:mmPick(MM.gear,m.gear,"none"),item:mmPick(MM.items,m.item,m.pose==="cheers"?"beer":"none"),
    bg:mmPick(MM.bgs,m.bg,null),filter:mmPick(MM.filters,m.filter,"none"),count:mmPick(MM.counts,String(m.count||"1"),"1"),size:mmPick(MM.sizes,m.size,"normal"),
    move:mmPick(MM.moves,m.move,"none"),stickers:st,font:mmPick(MM.fonts,m.font,"impact"),color:mmPick(MM.colors,m.color,"white"),
    top:String(m.top||"").slice(0,120),bottom:String(m.bottom||"").slice(0,160)};
}

export const CAPS={
  any:[["ME AFTER ONE PILSNER","FLUENT IN CZECH"],["WHEN THE AIRBNB WIFI DROPS","DURING THE WORK BLOCK"],["THE 10:00 KEYNOTE","ME AT 9:58 ON METRO B"],["TRUST ME","I'M A SENIOR FRONTEND RAT"],["ACHIEVEMENT UNLOCKED","ORDERED A BEER IN CZECH"],["WHO ATE THE LAST CHLEBÍČEK?","IT WAS ME"],["POV:","YOU ASKED THE RAT FOR RESTAURANT TIPS"],["I CAME TO PRAGUE","FOR THE CONFERENCE (THE CHEESE)"],["SPLIT THE BILL?","I ONLY HAD 3 PILSNERS AND A TRDELNÍK"],["IT WORKS ON MY MACHINE","SHIP IT"],["NEW JS FRAMEWORK DROPPED","DURING THE FRONTKON Q&A"],["WHEN SOMEONE SAYS","\"JUST ONE MORE BAR\""],["SQUEAK","SQUEAK SQUEAK"],["ME CHECKING THE PLANNER","FOR THE 40TH TIME TODAY"]],
  caption:[["Nobody:","Krysa at 3am in Staré Město:"],["me explaining to my manager why the Prague trip was a learning experience",""],["the group chat when someone suggests a 7am Charles Bridge sunrise",""],["POV: you said \"just one beer\" at Lokál",""],["when the Airbnb host says check-out is at 10:00",""]],
  poster:[["MOTIVATION","It's just a rat. Eating cheese. In Prague."],["TEAMWORK","Three humans, one Airbnb, zero sleep."],["PRODUCTIVITY","The work block was more of a suggestion."],["AMBITION","Went to FrontKon. Came back with a trdelník."]],
  duo:[["DAY 1","DAY 5"],["POTKAN","KRYSA"],["BEFORE FRONTKON","AFTER FRONTKON"],["LEAVING THE AIRBNB","COMING BACK AT 2AM"]],
  stack:[["Salad","Tank Pilsner"],["Splitting the bill evenly","Splitting it by cheese eaten"],["Waking up for the keynote","Watching the recording"],["Taxi","Tram 22"],["Div soup","Semantic HTML"]],
  speech:[["I'm not a rat, I'm a frontend developer",""],["Has anyone booked Lokál yet?",""],["One more bar. Then bed. Promise.",""],["Actually, it's pronounced krysa",""]],
  boarding:[["KRYSA","Window seat, obviously"],["THE INTERN","Upgraded to cheese class"],["THE WHOLE TEAM","Boarding group: whenever"],["CAPTAIN KRYSA","Please remain seated until the cheese has fully stopped"]],
  wanted:[["KRYSA","For stealing the last chlebíček"],["THE RAT","For deploying on a Friday"],["KRYSA","For eating a trdelník that wasn't his"],["UNKNOWN RAT","For squeaking during the keynote"]],
  news:[["LOCAL RAT ATTENDS FRONTKON","Rat reportedly asked \"is there cheese\" during Q&A • Pilsner supplies stable"],["RAT SPOTTED ON CHARLES BRIDGE AT SUNRISE","Witnesses describe him as extremely photogenic"],["RAT CAUGHT DEPLOYING ON A FRIDAY","More at 11"],["RAT-CATCHING LEADERBOARD IN TURMOIL","Sources confirm the rats are winning"]],
};

export const rnd=a=>a[Math.floor(Math.random()*a.length)];

export function pickCaption(layout){return rnd(CAPS[layout]&&Math.random()<.8?CAPS[layout]:CAPS.any)}

export function surpriseMeme(){
  const layout=Math.random()<.4?"classic":rnd(MM.layouts)[0];const [top,bottom]=pickCaption(layout);
  const maybe=(p,list,d)=>Math.random()<p?rnd(list)[0]:d;
  return normMeme({layout,top,bottom,fur:maybe(.45,MM.furs,"grey"),ears:maybe(.3,MM.ears,"standard"),face:rnd(MM.faces)[0],face2:rnd(MM.faces)[0],hat:maybe(.6,MM.hats,"none"),gear:maybe(.5,MM.gear,"none"),item:maybe(.6,MM.items,"none"),
    bg:rnd(MM.bgs)[0],filter:maybe(.22,MM.filters,"none"),count:maybe(.2,MM.counts,"1"),size:maybe(.18,MM.sizes,"normal"),move:maybe(.2,MM.moves,"none"),
    stickers:MM.stickers.filter(()=>Math.random()<.12).map(([k])=>k).slice(0,3),font:maybe(.3,MM.fonts,"impact"),color:maybe(.2,MM.colors,"white")});
}

export const TEXT_LABELS={classic:["Top text","Bottom text"],caption:["Caption","Second line"],poster:["Title","Subtitle"],duo:["Left label","Right label"],stack:["The nah","The yeah"],speech:["Krysa says","Bottom text"],news:["Headline","Ticker"],boarding:["Passenger","Note"],wanted:["Name","Wanted for"]};
