/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { svg } from "../ui/dom";

export const RAT={fur:"#8e8a96",belly:"#ddd6da",pink:"#e993a4",ink:"#1d2433"};

export const FURS={grey:{f:"#8e8a96",b:"#ddd6da"},agouti:{f:"#8a6a4f",b:"#dcc9b3"},black:{f:"#2e2b33",b:"#4b4652",wh:"#cfcfd6"},white:{f:"#f1ece6",b:"#ffffff",eye:"#d6336c"},hooded:{f:"#f1ece6",b:"#ffffff",h:"#3a3540",e:"#3a3540",s:"#4a4452",hood:"#3a3540",wh:"#cfcfd6"},siamese:{f:"#efe3cf",b:"#faf3e6",e:"#6b4f3a",s:"#b89478",feet:"#b9818b"},golden:{f:"#d9a441",b:"#f3dfb4"},blue:{f:"#7b8aa6",b:"#d2d9e5"}};

export function ratSvg(o: any = {}){
  const FU=FURS[o.fur]||FURS.grey;const F=FU.f,B=FU.b,P=RAT.pink,I=RAT.ink,H=FU.h||F,E=FU.e||F,SN=FU.s||B,EY=FU.eye||I,FT=FU.feet||P,WH=FU.wh||I;
  const dumbo=o.ears==="dumbo";const EL=dumbo?[31,47,14,9]:[39,29,12,7],ER=dumbo?[89,47,14,9]:[81,29,12,7];
  const face=o.face||"classic",hat=o.hat||"none",gear=o.gear||"none",item=o.item||"none";
  const TEETH=`<rect x="57" y="63.5" width="6" height="5" rx="1.2" fill="#fff" stroke="${I}" stroke-width=".9"/><line x1="60" y1="63.5" x2="60" y2="68.5" stroke="${I}" stroke-width=".8"/>`;
  const ML=`<path d="M60 60v3" stroke="${I}" stroke-width="1.2"/>`;
  const DOTS=`<g class="k-eyes"><g class="k-look"><circle cx="51" cy="46" r="3.6" fill="${EY}"/><circle cx="69" cy="46" r="3.6" fill="${EY}"/><circle cx="52.2" cy="44.8" r="1.1" fill="#fff"/><circle cx="70.2" cy="44.8" r="1.1" fill="#fff"/></g></g>`;
  const BLUSH=`<ellipse cx="44.5" cy="55" rx="4" ry="2.4" fill="${P}" opacity=".7"/><ellipse cx="75.5" cy="55" rx="4" ry="2.4" fill="${P}" opacity=".7"/>`;
  const OPEN=`<path d="M54 63.5h12q-1 7-6 7t-6-7z" fill="#7a2d3a"/><rect x="57.5" y="63.5" width="5" height="3" fill="#fff"/>`;
  const heart=(x,y)=>`<path d="M${x} ${y+4}l-4.8-4.6a2.9 2.9 0 0 1 4.8-3.6a2.9 2.9 0 0 1 4.8 3.6z" fill="#e5383b"/>`;
  const star=(cx,cy,r)=>{let d="";for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,rr=i%2?r*.45:r;d+=(i?"L":"M")+(cx+rr*Math.cos(a)).toFixed(1)+" "+(cy+rr*Math.sin(a)).toFixed(1)}return `<path d="${d}Z" fill="#f5c518" stroke="#b8892b" stroke-width=".6"/>`};
  const FACES={
    classic:DOTS+ML+TEETH,
    happy:`<path d="M47 47.5q4-4.5 8 0M65 47.5q4-4.5 8 0" fill="none" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/>`+BLUSH+ML+OPEN,
    sus:`<g class="k-eyes"><ellipse cx="51" cy="47" rx="4" ry="1.4" fill="${I}"/><ellipse cx="69" cy="47" rx="4" ry="1.4" fill="${I}"/></g><line x1="45" y1="41" x2="56" y2="43.5" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/><line x1="75" y1="41" x2="64" y2="43.5" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/>`+ML+TEETH,
    side:`<g class="k-eyes"><circle cx="51" cy="46" r="4.6" fill="#fff" stroke="${I}" stroke-width=".8"/><circle cx="69" cy="46" r="4.6" fill="#fff" stroke="${I}" stroke-width=".8"/><circle cx="54" cy="46.8" r="2.3" fill="${I}"/><circle cx="72" cy="46.8" r="2.3" fill="${I}"/></g><rect x="45.5" y="40.5" width="11" height="4" fill="${H}"/><rect x="63.5" y="40.5" width="11" height="4" fill="${H}"/><path d="M46 44.5h10M64 44.5h10" stroke="${I}" stroke-width="1.4" stroke-linecap="round"/>`+ML+TEETH,
    shocked:`<g class="k-eyes"><circle cx="51" cy="45.5" r="5.8" fill="#fff" stroke="${I}" stroke-width="1"/><circle cx="69" cy="45.5" r="5.8" fill="#fff" stroke="${I}" stroke-width="1"/><circle cx="51" cy="45.5" r="1.8" fill="${I}"/><circle cx="69" cy="45.5" r="1.8" fill="${I}"/></g><path d="M60 60v1.5" stroke="${I}" stroke-width="1.2"/><ellipse cx="60" cy="66.5" rx="3.6" ry="4.6" fill="#5a1f2b"/>`,
    cry:DOTS+`<path class="k-tears" d="M49 50.5q-1.5 9 1 17M71 50.5q1.5 9-1 17" fill="none" stroke="#5fb3e8" stroke-width="3" stroke-linecap="round"/>`+ML+`<path d="M55 67q2.5-2.4 5 0t5 0" fill="none" stroke="${I}" stroke-width="1.3" stroke-linecap="round"/>`,
    angry:DOTS+`<path d="M44 39.5l12 4.5M76 39.5l-12 4.5" stroke="${I}" stroke-width="3.2" stroke-linecap="round"/>`+ML+`<rect x="54.5" y="63.5" width="11" height="5" rx="1.2" fill="#fff" stroke="${I}" stroke-width=".9"/><path d="M57.2 63.5v5M60 63.5v5M62.8 63.5v5M54.5 66h11" stroke="${I}" stroke-width=".7"/>`,
    love:`<g class="k-eyes">${heart(51,44)}${heart(69,44)}</g>`+BLUSH+ML+TEETH,
    smug:`<g class="k-eyes"><circle cx="51" cy="46.5" r="3.6" fill="${I}"/><circle cx="69" cy="46.5" r="3.6" fill="${I}"/></g><rect x="46" y="41" width="10" height="5" fill="${H}"/><rect x="64" y="41" width="10" height="5" fill="${H}"/><path d="M46.5 46h9M64.5 46h9" stroke="${I}" stroke-width="1.5" stroke-linecap="round"/>`+ML+`<path d="M56 66.5q5 2.5 9-2" fill="none" stroke="${I}" stroke-width="1.4" stroke-linecap="round"/>`,
    star:`<g class="k-eyes">${star(51,46,5.6)}${star(69,46,5.6)}</g>`+ML+OPEN,
    crazy:`<g class="k-eyes"><circle cx="50" cy="45" r="6.5" fill="#fff" stroke="${I}" stroke-width="1"/><circle cx="51.5" cy="46" r="2.4" fill="${I}"/><circle cx="69.5" cy="47" r="2.2" fill="${I}"/></g>`+ML+`<path d="M52 63.5h16q-2 6-8 6t-8-6z" fill="#7a2d3a"/><path d="M52.5 63.5h15v2.6h-15z" fill="#fff"/>`,
    dead:`<path d="M47.5 42.5l7 7M54.5 42.5l-7 7M65.5 42.5l7 7M72.5 42.5l-7 7" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/>`+ML+TEETH+`<path d="M61.5 68.5q0 6 3.5 6t3-6z" fill="${P}" stroke="#c46b7c" stroke-width=".6"/>`,
    sleep:`<path d="M47 46.5q4 3.2 8 0M65 46.5q4 3.2 8 0" fill="none" stroke="${I}" stroke-width="2" stroke-linecap="round"/>`+ML+TEETH,
    wink:`<g class="k-eyes"><circle cx="51" cy="46" r="3.6" fill="${EY}"/><circle cx="52.2" cy="44.8" r="1.1" fill="#fff"/></g><path d="M65 46.5q4-3.6 8 0" fill="none" stroke="${I}" stroke-width="2.2" stroke-linecap="round"/>`+ML+TEETH+`<path d="M54 66.5q1.5 1.5 3 1.5M63 68q1.5 0 3-1.5" fill="none" stroke="${I}" stroke-width="1.1" stroke-linecap="round"/>`,
    blep:DOTS+ML+TEETH+`<path d="M58.2 68.5q1.8 4.5 3.6 0z" fill="${P}" stroke="#c46b7c" stroke-width=".5"/>`,
    pleading:`<g class="k-eyes"><circle cx="51" cy="46.5" r="5.4" fill="${EY}"/><circle cx="69" cy="46.5" r="5.4" fill="${EY}"/><circle cx="53" cy="44.5" r="1.9" fill="#fff"/><circle cx="71" cy="44.5" r="1.9" fill="#fff"/><circle cx="49.5" cy="48.5" r=".9" fill="#fff"/><circle cx="67.5" cy="48.5" r=".9" fill="#fff"/></g><path d="M45 40.5l9-2.5M75 40.5l-9-2.5" stroke="${I}" stroke-width="1.8" stroke-linecap="round"/>`+ML+`<path d="M56 67.5q4-2.5 8 0" fill="none" stroke="${I}" stroke-width="1.3" stroke-linecap="round"/>`,
  };
  const flower=(x,y,c)=>{let s="";for(let i=0;i<5;i++){const a=Math.PI*2/5*i;s+=`<circle cx="${(x+3*Math.cos(a)).toFixed(1)}" cy="${(y+3*Math.sin(a)).toFixed(1)}" r="2.4" fill="${c}"/>`}return s+`<circle cx="${x}" cy="${y}" r="1.8" fill="#ffd23f"/>`};
  const HATS={
    party:`<g transform="rotate(-14 60 18)"><path d="M48 28L60 4L72 28Z" fill="#7b5cff"/><path d="M52 19l12-3.2M50 24.5l17-4.6M55.5 11.5l6-1.6" stroke="#ffd23f" stroke-width="2.4"/><circle cx="60" cy="4.5" r="3.6" fill="#ff5d8f"/></g>`,
    crown:`<path d="M45 30L47 14L54 22L60 11L66 22L73 14L75 30Z" fill="#f5c518" stroke="#b8892b" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="25" r="2.2" fill="#e5383b"/><circle cx="51" cy="26" r="1.6" fill="#1c5a66"/><circle cx="69" cy="26" r="1.6" fill="#1c5a66"/>`,
    beanie:`<path d="M36 36Q38 10 60 10Q82 10 84 36Z" fill="#c1121f"/><rect x="35" y="31" width="50" height="8" rx="3" fill="#8f0d17"/><circle cx="60" cy="9" r="5" fill="#f4f4f1"/>`,
    propeller:`<path d="M42 32Q44 18 60 18Q76 18 78 32Z" fill="#2f6fde"/><path d="M42 32h36" stroke="#ffd23f" stroke-width="3"/><rect x="59" y="9" width="2" height="9" fill="#555"/><g class="k-prop"><ellipse cx="52" cy="9" rx="8" ry="2.2" fill="#e5383b"/><ellipse cx="68" cy="9" rx="8" ry="2.2" fill="#ffd23f"/></g>`,
    tophat:`<rect x="47" y="2" width="26" height="24" rx="2" fill="#17181a"/><rect x="47" y="19" width="26" height="4" fill="#c1121f"/><ellipse cx="60" cy="27" rx="19" ry="4" fill="#17181a"/>`,
    cowboy:`<path d="M48 26Q47 8 60 8Q73 8 72 26Z" fill="#8a5a2b"/><path d="M60 8v8" stroke="#6b4420" stroke-width="2"/><rect x="48" y="20" width="24" height="3.5" fill="#4a2e14"/><path d="M30 28Q60 18 90 28Q60 34 30 28Z" fill="#a06b35"/>`,
    bow:`<g transform="translate(84 20) rotate(20)"><path d="M0 0L-9 -6L-9 6Z" fill="#ff5d8f"/><path d="M0 0L9 -6L9 6Z" fill="#ff5d8f"/><circle r="2.6" fill="#e0457a"/></g>`,
    headphones:`<path d="M34 40Q34 14 60 14Q86 14 86 40" fill="none" stroke="#17181a" stroke-width="4"/><rect x="29" y="34" width="10" height="16" rx="4" fill="#17181a"/><rect x="81" y="34" width="10" height="16" rx="4" fill="#17181a"/><rect x="31" y="37" width="3" height="10" rx="1.5" fill="#e5383b"/>`,
    flowers:flower(47,28,"#ff8fb1")+flower(60,24,"#fff")+flower(73,28,"#b69cff"),
    wizard:`<ellipse cx="60" cy="30" rx="26" ry="5" fill="#3b2d8f"/><path d="M42 30L63 1L78 30Z" fill="#4b3aa8"/><path d="M58 18l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.5-2.5 1.5.6-2.8-2.1-1.9 2.8-.3z" fill="#f5c518"/><circle cx="67" cy="24" r="1.3" fill="#f5c518"/><circle cx="62" cy="10" r="1.1" fill="#f5c518"/>`,
    viking:`<path d="M42 26Q30 22 27 7Q36 17 45 20Z" fill="#f4e9c1" stroke="#c9b98a" stroke-width=".8"/><path d="M78 26Q90 22 93 7Q84 17 75 20Z" fill="#f4e9c1" stroke="#c9b98a" stroke-width=".8"/><path d="M40 34Q40 13 60 13Q80 13 80 34Z" fill="#9aa3ad"/><rect x="39" y="30" width="42" height="5" rx="1.5" fill="#6b4f3a"/><path d="M60 13v17" stroke="#6b4f3a" stroke-width="3"/>`,
    grad:`<path d="M46 25v6q14 6 28 0v-6" fill="#17181a"/><path d="M33 22L60 12L87 22L60 32Z" fill="#17181a"/><path d="M60 22L81 25L82 36" fill="none" stroke="#f5c518" stroke-width="1.6"/><circle cx="82" cy="37" r="1.8" fill="#f5c518"/>`,
    pilot:`<path d="M40 32Q42 15 60 14Q78 15 80 32Z" fill="#1d2b53"/><path d="M38 32Q60 40 82 32L80 36Q60 43 40 36Z" fill="#111"/><rect x="40" y="29" width="40" height="3" fill="#f5c518"/><circle cx="60" cy="22" r="3.6" fill="#f5c518"/><path d="M47 22h8M65 22h8" stroke="#f5c518" stroke-width="2" stroke-linecap="round"/>`,
  };
  const GEAR_FACE={
    shades:`<rect x="44" y="41" width="14" height="9" rx="3" fill="#111"/><rect x="62" y="41" width="14" height="9" rx="3" fill="#111"/><path d="M58 44h4M44 43l-6-2M76 43l6-2" stroke="#111" stroke-width="2"/><path d="M47 43.5h4M65 43.5h4" stroke="#fff" stroke-width="1.2" opacity=".7"/>`,
    nerd:`<circle cx="51" cy="46" r="7" fill="none" stroke="#17181a" stroke-width="2"/><circle cx="69" cy="46" r="7" fill="none" stroke="#17181a" stroke-width="2"/><path d="M58 46h4" stroke="#17181a" stroke-width="2"/><rect x="58.5" y="44.5" width="3" height="3" fill="#fff"/>`,
    monocle:`<circle cx="69" cy="46" r="6.5" fill="rgba(255,255,255,.25)" stroke="#b8892b" stroke-width="1.8"/><path d="M75 49q4 10 0 20" fill="none" stroke="#b8892b" stroke-width="1"/>`,
    mustache:`<path d="M60 60.5q-5-3-10 0q-3 2-6 0q2 5 8 4q5-1 8-4q3 3 8 4q6 1 8-4q-3 2-6 0q-5-3-10 0z" fill="#4a2e14"/>`,
    clown:`<circle cx="60" cy="56.5" r="5.5" fill="#e5383b"/><circle cx="58.5" cy="55" r="1.4" fill="#fff" opacity=".7"/>`,
  };
  const GEAR_BODY={
    lanyard:`<path d="M50 70L57 88M70 70L63 88" stroke="#c1121f" stroke-width="2.2"/><rect x="51" y="86" width="18" height="14" rx="1.5" fill="#fff" stroke="#17181a" stroke-width=".8"/><text x="60" y="92" font-size="3.6" font-weight="700" text-anchor="middle" fill="#17181a" font-family="Arial,sans-serif">FRONTKON</text><text x="60" y="97" font-size="3" text-anchor="middle" fill="#c1121f" font-family="Arial,sans-serif">SPEAKER</text>`,
    scarf:`<path d="M38 68Q60 80 82 68L82 75Q60 87 38 75Z" fill="#1c5a66"/><path d="M70 76l4 16l-7 1l-2-15z" fill="#1c5a66"/><path d="M44 71v6M52 74v6M60 75v6M68 74v6M76 71v6" stroke="#f4f4f1" stroke-width="1.5" opacity=".6"/>`,
  };
  const BOWTIE=`<path d="M60 72L50 67V77ZM60 72L70 67V77Z" fill="#c1121f"/><circle cx="60" cy="72" r="2.4" fill="#8f0d17"/>`;
  const ITEMS={
    boarding:`<g transform="rotate(-14 86 64)"><rect x="71" y="56" width="32" height="16" rx="1.5" fill="#fff" stroke="#1c5a66" stroke-width=".8"/><rect x="71" y="56" width="32" height="4.2" fill="#1c5a66"/><text x="87" y="67.5" font-size="4.6" font-weight="700" text-anchor="middle" fill="#17181a" font-family="Arial,sans-serif">AMS → PRG</text><path d="M97 61v10" stroke="#17181a" stroke-width=".4" stroke-dasharray="1 .8"/></g>`,
    suitcase:`<path d="M80 66v-4h10v4" fill="none" stroke="#17181a" stroke-width="2"/><rect x="74" y="66" width="22" height="18" rx="2.5" fill="#c1121f"/><path d="M79 66v18M91 66v18" stroke="#8f0d17" stroke-width="1.6"/><circle cx="85" cy="75" r="2.4" fill="#f5c518"/>`,
    mic:`<g transform="rotate(-20 80 66)"><rect x="77.5" y="58" width="5" height="17" rx="2" fill="#333"/><circle cx="80" cy="56" r="5.2" fill="#9aa3ad" stroke="#555" stroke-width=".8"/><path d="M76 55h8M76 57.5h8" stroke="#555" stroke-width=".5"/></g>`,
    sausage:`<path d="M72 72Q84 60 98 64" stroke="#a0422a" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M76 68Q84 62 94 63" stroke="#f2c14e" stroke-width="1.3" fill="none" stroke-dasharray="3 1.5"/>`,
    beer:`<g transform="rotate(-12 86 70)"><path d="M92 62h5a5 5 0 0 1 0 10h-5" fill="none" stroke="#e9e3d6" stroke-width="3"/><rect x="76" y="58" width="17" height="22" rx="2.5" fill="#e0a72e" stroke="#9c6f12" stroke-width="1.2"/><ellipse cx="84.5" cy="58" rx="9.5" ry="4.2" fill="#fbf7ee"/><circle cx="80" cy="56" r="3" fill="#fbf7ee"/><circle cx="88" cy="55.6" r="3.2" fill="#fbf7ee"/></g>`,
    cheese:`<path d="M72 74L92 62L92 76Z" fill="#f2c14e" stroke="#c9962a" stroke-width="1" stroke-linejoin="round"/><circle cx="86" cy="70" r="1.8" fill="#c9962a"/><circle cx="89.5" cy="73" r="1.1" fill="#c9962a"/>`,
    coffee:`<path d="M76 60h14l-2 18h-10z" fill="#f4f4f1" stroke="#ccc" stroke-width=".8"/><rect x="76.6" y="66" width="12.8" height="6" fill="#8a5a2b"/><rect x="75" y="57.5" width="16" height="3" rx="1" fill="#17181a"/><g class="k-steam" stroke="#bbb" stroke-width="1.2" fill="none" stroke-linecap="round"><path d="M80 54q-2-3 0-6M85 54q-2-3 0-6"/></g>`,
    phone:`<g transform="rotate(-10 79 66)"><rect x="74" y="57" width="10" height="17" rx="2" fill="#17181a"/><rect x="75.3" y="59" width="7.4" height="12" rx="1" fill="#7fd1ff"/></g>`,
    trdelnik:`<g transform="rotate(-20 82 64)"><rect x="76" y="48" width="12" height="28" rx="5" fill="#c9843c"/><path d="M76 54l12 5M76 61l12 5M76 68l12 5" stroke="#8a5a2b" stroke-width="1.6"/><ellipse cx="82" cy="48" rx="6" ry="2.4" fill="#fbf7ee"/><circle cx="80" cy="46.5" r="2.2" fill="#fbf7ee"/><circle cx="84" cy="46" r="2.4" fill="#fbf7ee"/></g>`,
    pizza:`<path d="M74 72L96 58L92 80Z" fill="#f2c14e" stroke="#c9843c" stroke-width="2" stroke-linejoin="round"/><circle cx="87" cy="67" r="2" fill="#c1121f"/><circle cx="90" cy="74" r="1.8" fill="#c1121f"/><circle cx="82" cy="72" r="1.6" fill="#c1121f"/>`,
    money:`<g transform="rotate(-18 84 66)"><rect x="72" y="58" width="26" height="13" rx="1" fill="#6fae6a" stroke="#3f7a3b" stroke-width=".8"/><text x="85" y="67" font-size="6" font-weight="700" text-anchor="middle" fill="#1f4d1c" font-family="Arial,sans-serif">100 Kč</text></g>`,
    rose:`<path d="M78 72q4-14 6-22" stroke="#3f7a3b" stroke-width="1.8" fill="none"/><path d="M80 62q-6-2-6 3q4 1 6-3z" fill="#3f7a3b"/><circle cx="84" cy="48" r="5" fill="#c1121f"/><path d="M81 47q3-3 6 0q-3 3-6 0" fill="none" stroke="#8f0d17" stroke-width="1"/>`,
    sign:`<rect x="86" y="62" width="2.4" height="16" fill="#8a5a2b"/><rect x="80" y="44" width="38" height="20" rx="1.5" fill="#d9b98a" stroke="#a88659" stroke-width="1"/><text x="99" y="52.5" font-size="5.2" font-weight="700" text-anchor="middle" fill="#17181a" font-family="Arial,sans-serif">WILL CODE</text><text x="99" y="60" font-size="5.2" font-weight="700" text-anchor="middle" fill="#17181a" font-family="Arial,sans-serif">FOR CHEESE</text>`,
  };
  const balloon=item==="balloon"?`<path d="M78 70Q84 50 94 32" stroke="#888" stroke-width=".8" fill="none"/><g class="k-balloon"><ellipse cx="96" cy="20" rx="10" ry="12" fill="#e5383b"/><path d="M94 32l2 3l2-3z" fill="#e5383b"/><ellipse cx="92" cy="15" rx="2.5" ry="4" fill="#fff" opacity=".45"/></g>`:"";
  const laptop=item==="laptop"?`<rect x="36" y="74" width="48" height="30" rx="2.5" fill="#b9bcc2" stroke="#8d9097" stroke-width="1"/><path d="M55.5 92L64.5 87.5V93Z" fill="#f2c14e"/><ellipse class="k-type" cx="47" cy="74" rx="5" ry="3.6" fill="${P}"/><ellipse class="k-type k2" cx="73" cy="74" rx="5" ry="3.6" fill="${P}"/>`:"";
  const holding=item!=="none"&&item!=="laptop";
  const paws=item==="laptop"?"":`<ellipse cx="50" cy="73" rx="5" ry="4" fill="${P}"/>`+(holding?`<ellipse cx="${item==="sign"?87:77}" cy="${item==="sign"?76:70}" rx="5" ry="4" fill="${P}"/>`:`<ellipse cx="70" cy="73" rx="5" ry="4" fill="${P}"/>`);
  const el=svg(`
    <g class="k-tail"><path d="M86 98 C106 104 116 86 106 76 C99 69 90 75 97 81" fill="none" stroke="${FU.feet||P}" stroke-width="4.5" stroke-linecap="round"/></g>
    ${balloon}
    <g class="k-body"><ellipse cx="60" cy="84" rx="31" ry="26" fill="${F}"/><ellipse cx="60" cy="90" rx="19" ry="17" fill="${B}"/>${FU.hood?`<ellipse cx="60" cy="69" rx="25" ry="9" fill="${FU.hood}"/>`:""}
    <ellipse cx="45" cy="107" rx="8" ry="4.5" fill="${FT}"/><ellipse cx="75" cy="107" rx="8" ry="4.5" fill="${FT}"/></g>
    ${GEAR_BODY[gear]||""}
    ${hat==="halo"?`<ellipse class="k-halo" cx="60" cy="12" rx="15" ry="4" fill="none" stroke="#f5c518" stroke-width="3"/>`:""}
    <g class="k-head">
      <g class="k-ear l"><circle cx="${EL[0]}" cy="${EL[1]}" r="${EL[2]}" fill="${E}"/><circle cx="${EL[0]}" cy="${EL[1]}" r="${EL[3]}" fill="${P}"/></g>
      <g class="k-ear r"><circle cx="${ER[0]}" cy="${ER[1]}" r="${ER[2]}" fill="${E}"/><circle cx="${ER[0]}" cy="${ER[1]}" r="${ER[3]}" fill="${P}"/></g>
      <circle cx="60" cy="49" r="23" fill="${H}"/>
      <ellipse cx="60" cy="61" rx="12" ry="9.5" fill="${SN}"/>
      ${FACES[face]||FACES.classic}
      <g class="k-nose"><circle cx="60" cy="56.5" r="3.4" fill="${P}"/></g>
      <g class="k-wh l" stroke="${WH}" stroke-width="1" stroke-linecap="round" opacity=".55"><line x1="48" y1="59" x2="30" y2="55"/><line x1="48" y1="62" x2="30" y2="63"/></g>
      <g class="k-wh r" stroke="${WH}" stroke-width="1" stroke-linecap="round" opacity=".55"><line x1="72" y1="59" x2="90" y2="55"/><line x1="72" y1="62" x2="90" y2="63"/></g>
      ${GEAR_FACE[gear]||""}
      ${HATS[hat]||""}
    </g>
    ${gear==="bowtie"?BOWTIE:""}
    ${paws}${ITEMS[item]||""}${laptop}`,"0 0 120 120");
  el.classList.add("k-svg");return el;
}

export function krysa(pose="classic"){return ratSvg(pose==="cheers"?{item:"beer"}:{face:pose==="sus"?"sus":pose==="sleep"?"sleep":"classic"})}

export function sideRat(cheese?){return svg(`<path d="M8 22 C2 22 1 14 7 13" fill="none" stroke="${RAT.pink}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="28" cy="20" rx="17" ry="10" fill="${RAT.fur}"/><circle cx="46" cy="16" r="9" fill="${RAT.fur}"/><path d="M52 12 L62 17 L52 21 Z" fill="${RAT.fur}"/><circle cx="62" cy="17" r="2" fill="${RAT.pink}"/><circle cx="44" cy="8" r="5" fill="${RAT.fur}"/><circle cx="44" cy="8" r="3" fill="${RAT.pink}"/><circle cx="51" cy="14" r="1.6" fill="${RAT.ink}"/><ellipse cx="20" cy="30" rx="4" ry="2" fill="${RAT.pink}"/><ellipse cx="36" cy="30" rx="4" ry="2" fill="${RAT.pink}"/>${cheese?`<path d="M60 20 L75 13 L75 25 Z" fill="#f2c14e" stroke="#c9962a" stroke-width="1" stroke-linejoin="round"/><circle cx="70" cy="18" r="1.6" fill="#c9962a"/><circle cx="72.5" cy="22" r="1.1" fill="#c9962a"/>`:""}`,"0 0 76 34")}
