/* eslint-disable */
// Ported from the single-file artifact; types are intentionally loose here (see README).
import { RAT } from "./rat";
import { h, svg } from "../ui/dom";

export function pragueSkyline(){const e=svg(`<circle cx="80" cy="17" r="6" fill="#f4e9c1"/><circle cx="14" cy="12" r=".6" fill="#fff"/><circle cx="30" cy="22" r=".5" fill="#fff"/><circle cx="58" cy="9" r=".6" fill="#fff"/><circle cx="92" cy="34" r=".5" fill="#fff"/><path d="M0 100V82h6v-4h5v6h4V72l3-7 3 7v12h4V68l2-12 2 12v-2l2-14 2 14v18h4V78h6v-8l4-4 4 4v14h5V72l3-12 3 12v12h6V80h8v-6h4v10h7V100Z" fill="#0a1128"/>`,"0 0 100 100");e.setAttribute("preserveAspectRatio","xMidYMax slice");e.classList.add("stl");return e}

export function skyLayer(){const e=svg(`<g fill="#fff" opacity=".95"><ellipse cx="18" cy="20" rx="12" ry="5"/><ellipse cx="25" cy="17" rx="7" ry="5"/><ellipse cx="78" cy="32" rx="14" ry="5"/><ellipse cx="84" cy="28" rx="7" ry="5"/><ellipse cx="50" cy="90" rx="30" ry="7" opacity=".7"/></g>`,"0 0 100 100");e.classList.add("stl");return e}

export function synthLayer(){let g=`<circle cx="50" cy="58" r="20" fill="#ffcf3f"/><rect x="28" y="50" width="44" height="1.6" fill="#7a1a7a"/><rect x="28" y="54" width="44" height="2" fill="#7a1a7a"/><rect x="28" y="58.5" width="44" height="2.4" fill="#7a1a7a"/><rect x="0" y="62" width="100" height="38" fill="#1b0033"/>`;for(let i=0;i<=10;i++)g+=`<path d="M50 62L${-50+i*20} 100" stroke="#ff4fa3" stroke-width=".5"/>`;[64,67,71,76,82,90].forEach(y=>g+=`<path d="M0 ${y}H100" stroke="#ff4fa3" stroke-width=".5"/>`);const e=svg(g,"0 0 100 100");e.classList.add("stl");return e}

export function stageLayer(){const e=svg(`<path d="M20 0L2 100H30Z" fill="#fff4d6" opacity=".14"/><path d="M80 0L70 100H98Z" fill="#fff4d6" opacity=".14"/><path d="M50 -5L30 100H70Z" fill="#fff4d6" opacity=".18"/><rect x="0" y="88" width="100" height="12" fill="#2a1a12"/><path d="M0 88H100" stroke="#6b4420" stroke-width="1"/>`,"0 0 100 100");e.classList.add("stl");return e}

export function planeSvg(){const e=svg(`<path d="M4 17l14-2 9-11h4l-4 10 14-2 4-5h3l-2 7 2 7h-3l-4-5-14-2 4 10h-4l-9-11-14-2z" fill="#f4f4f1" stroke="#17181a" stroke-width="1.2" stroke-linejoin="round"/><circle cx="44" cy="17" r="2.6" fill="${RAT.fur}"/><circle cx="43" cy="14.8" r="1.2" fill="${RAT.fur}"/><circle cx="45.4" cy="14.8" r="1.2" fill="${RAT.fur}"/><circle cx="44.8" cy="17" r=".6" fill="${RAT.ink}"/>`,"0 0 54 34");return e}

export const SKYLINE="M0 0V-30H20V-40H34V-50L40-56L46-50V-40H60V-60H66V-72L70-82L74-72V-60H80V-54H96V-68L100-96L104-68V-54H112V-80L116-110L120-80V-54H130V-48H150V-60Q160-78 170-60V-48H182V-40H196V-52L204-60L212-52V-40H226V-50H240V-40H252V-72L256-86L258-92L260-86L264-72V-80L268-96L270-104L272-96L276-80V-40H284V-66L288-84L290-90L292-84L296-66V-40H310V-48H324V-42H340V-54L346-60L352-54V-40H370V-50H384V-34H400V0Z";

export function hzRat(x,y,s,c,up,tail){return `<g transform="translate(${x} ${y}) scale(${s})"><g class="${tail?"hz-tail":""}"><path d="M-13 -3C-36 2-44-16-33-22" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/></g><ellipse cx="0" cy="-12" rx="15" ry="12" fill="${c}"/>${up?`<circle cx="4" cy="-36" r="4.8" fill="${c}"/><circle cx="9" cy="-27" r="8.5" fill="${c}"/><path d="M12 -33L22 -42L17 -25Z" fill="${c}"/>`:`<circle cx="8" cy="-33" r="4.8" fill="${c}"/><circle cx="11" cy="-24" r="8.5" fill="${c}"/><path d="M16 -29L28 -22L16 -17Z" fill="${c}"/>`}<ellipse cx="-6" cy="-1" rx="5" ry="2.2" fill="${c}"/><ellipse cx="7" cy="-1" rx="5" ry="2.2" fill="${c}"/></g>`}

export function hzRand(seed){let r=seed;return()=>{r=(r*9301+49297)%233280;return r/233280}}

export function hzStars(n,w,h,seed,col="#fff8e1"){const R=hzRand(seed);let s="";for(let i=0;i<n;i++){s+=`<circle class="hz-tw" style="animation-delay:${-(i%9)*.4}s" cx="${(R()*w).toFixed(1)}" cy="${(R()*h).toFixed(1)}" r="${i%4?0.9:1.6}" fill="${col}"/>`}return s}

export function hzWaves(x0,x1,y0,y1,c,op,seed){const R=hzRand(seed);let s="";for(let y=y0;y<=y1;y+=7){const n=1+Math.floor(R()*3);for(let k=0;k<n;k++){const x=x0+R()*(x1-x0-20),l=10+R()*30;s+=`<path d="M${x.toFixed(1)} ${y}h${l.toFixed(1)}" stroke="${c}" stroke-width="1.6" stroke-linecap="round" opacity="${op}"/>`}}return s}

export function hzBridge(D,c){let arches="";for(let x=74;x<400;x+=58)arches+=`M${x} ${D+46}A24 30 0 0 1 ${x+46} ${D+46}Z`;let st="";for(let x=78;x<400;x+=29)st+=`M${x} ${D}v-9a3.2 3.2 0 0 1 6.4 0v9z`;
  return `<path fill-rule="evenodd" d="M40 ${D}H400V${D+46}H40Z${arches}" fill="${c}"/><path d="${st}" fill="${c}"/><path fill-rule="evenodd" d="M18 ${D+46}V${D-54}H14L40 ${D-102}L66 ${D-54}H62V${D+46}Z M31 ${D+46}A9 14 0 0 1 49 ${D+46}Z" fill="${c}"/><path d="M14 ${D-54}l-3-16 5 6zM66 ${D-54}l3-16-5 6zM40 ${D-102}v-8" stroke="${c}" stroke-width="2" fill="${c}"/>`}

export function hzPine(x,y,h,c){return `<path d="M${x} ${y-h}L${x+h*.32} ${y-h*.45}H${x+h*.16}L${x+h*.4} ${y}H${x-h*.4}L${x-h*.16} ${y-h*.45}H${x-h*.32}Z" fill="${c}"/>`}

export function hzBirds(list,c){return list.map(([x,y,s])=>`<path d="M${x} ${y}q${4*s} ${-4*s} ${8*s} 0q${4*s} ${-4*s} ${8*s} 0" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`).join("")}

export const SCENES={
  rats:()=>`<defs><linearGradient id="hzN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11152f"/><stop offset=".62" stop-color="#2a2d62"/><stop offset="1" stop-color="#4a3e78"/></linearGradient><radialGradient id="hzMg"><stop offset="0" stop-color="#f7e6ae" stop-opacity=".6"/><stop offset="1" stop-color="#f7e6ae" stop-opacity="0"/></radialGradient><linearGradient id="hzW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#256c7a"/><stop offset="1" stop-color="#12304a"/></linearGradient></defs>
    <rect y="-110" width="400" height="360" fill="url(#hzN)"/><g transform="translate(0 -110)">${hzStars(22,400,110,41)}</g>${hzStars(34,400,150,7)}
    <circle class="hz-glow" cx="292" cy="112" r="104" fill="url(#hzMg)"/><circle cx="292" cy="112" r="54" fill="#f7e6ae"/><circle cx="274" cy="98" r="8" fill="#eed793"/><circle cx="306" cy="128" r="11" fill="#eed793"/><circle cx="302" cy="92" r="4.5" fill="#eed793"/>
    <g transform="translate(0 182)"><path d="${SKYLINE}" fill="#252a57"/></g>
    <rect y="200" width="400" height="50" fill="url(#hzW)"/>${hzWaves(236,350,206,246,"#f7e6ae",.55,3)}${hzWaves(0,220,210,246,"#9fe3dc",.18,5)}
    ${hzBridge(176,"#0c0f26")}
    ${[132,246,362].map(x=>`<path d="M${x} 176v-18" stroke="#0c0f26" stroke-width="2"/><circle cx="${x}" cy="156" r="10" fill="#ffd98a" opacity=".22"/><circle cx="${x}" cy="156" r="3" fill="#ffd98a"/>`).join("")}
    ${hzRat(300,176,1.2,"#0c0f26",true,true)}
    ${[[92,150],[196,138],[344,146],[222,160]].map(([x,y],i)=>`<circle class="hz-ff" style="animation-delay:${-i*.9}s" cx="${x}" cy="${y}" r="1.8" fill="#ffe49a"/>`).join("")}`,
  flights:()=>`<defs><linearGradient id="hzF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd7b5"/><stop offset=".55" stop-color="#ffa587"/><stop offset="1" stop-color="#f47c70"/></linearGradient></defs>
    <rect y="-110" width="400" height="360" fill="url(#hzF)"/>${hzWaves(40,380,-90,-40,"#f0666f",.28,51)}${hzWaves(170,390,26,70,"#f0666f",.4,11)}${hzWaves(20,160,120,150,"#f0666f",.35,13)}
    <circle cx="214" cy="170" r="76" fill="#f0506e"/>
    <path d="M-10 132Q110 44 236 92T420 46" fill="none" stroke="#fff6ec" stroke-width="2" stroke-dasharray="3 7" opacity=".9"/>
    <g transform="translate(244 84) rotate(-12)"><g class="hz-bob"><path d="M-30 4L34 -12L-6 18Z" fill="#fffaf2"/><path d="M-6 18L34 -12L-2 5Z" fill="#f1ddcb"/>${hzRat(-6,-1,.5,"#2c2e55",false,true)}</g></g>
    ${hzBirds([[70,70,1.1],[92,58,.8],[330,110,.9]],"#3b3d68")}
    <path d="M0 250V212L48 184L92 222L150 166L214 236L276 180L334 226L400 188V250Z" fill="#3d3f6b"/><path d="M0 250V236L70 206L130 240L200 212L270 244L340 210L400 230V250Z" fill="#2b2d53"/>`,
  plan:()=>`<defs><linearGradient id="hzD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde6ca"/><stop offset="1" stop-color="#f8b596"/></linearGradient></defs>
    <rect y="-110" width="400" height="360" fill="url(#hzD)"/>
    <circle cx="300" cy="120" r="74" fill="#fff4dc" opacity=".55"/><circle cx="300" cy="120" r="42" fill="#fff1d2"/>
    ${hzBirds([[236,70,1],[258,60,.7],[120,90,.9]],"#8d5a6e")}
    <path d="M0 250V172Q70 132 150 160T300 150T400 162V250Z" fill="#f0ae98"/>
    <path d="M0 250V198Q90 162 190 188T400 178V250Z" fill="#d78883"/>
    <path d="M92 190L98 122H102L108 190Z" fill="#9a5d6e"/><rect x="94" y="114" width="12" height="9" rx="1" fill="#9a5d6e"/><path d="M100 114v-12M96 150h8M95 170h10" stroke="#9a5d6e" stroke-width="1.6"/>
    <path d="M0 250V222Q120 198 240 214T400 206V250Z" fill="#6c486d"/>
    ${hzPine(26,226,34,"#4e3352")}${hzPine(48,228,24,"#4e3352")}${hzPine(356,214,36,"#4e3352")}${hzPine(378,216,26,"#4e3352")}
    ${hzRat(214,214,.95,"#3e2a4c",true,true)}`,
  ideas:()=>`<defs><linearGradient id="hzI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3350"/><stop offset=".58" stop-color="#2f6a73"/><stop offset="1" stop-color="#f2b279"/></linearGradient></defs>
    <rect y="-110" width="400" height="360" fill="url(#hzI)"/><g transform="translate(0 -110)">${hzStars(20,400,120,43)}</g>${hzStars(14,400,80,21)}
    <circle cx="320" cy="206" r="40" fill="#ffd08a" opacity=".9"/>
    <g transform="translate(0 222) scale(1 .55)"><path d="${SKYLINE}" fill="#20485a"/></g>
    <path d="M0 250V166Q90 146 180 176Q240 196 270 250Z" fill="#0f252e"/>
    <circle cx="40" cy="146" r="22" fill="#0f252e"/><circle cx="60" cy="134" r="18" fill="#0f252e"/><circle cx="170" cy="160" r="20" fill="#0f252e"/>
    <path d="M44 138Q108 180 168 150" fill="none" stroke="#0b1b22" stroke-width="1"/>
    ${[60,80,100,120,140,158].map((x,i)=>{const y=138+Math.sin((x-44)/124*Math.PI)*20;return `<circle cx="${x}" cy="${y.toFixed(1)}" r="6" fill="#ffd98a" opacity=".22"/><circle class="hz-ff" style="animation-delay:${-i*.5}s" cx="${x}" cy="${y.toFixed(1)}" r="2.2" fill="#ffe49a"/>`}).join("")}
    <path d="M90 200h54M96 200v12M138 200v12M88 192h58" stroke="#0b1b22" stroke-width="3" stroke-linecap="round"/>
    ${hzRat(116,198,.82,"#0b1b22",false,true)}<rect x="135" y="172" width="8" height="11" rx="1.5" fill="#0b1b22"/><path d="M143 175h3v5h-3" fill="none" stroke="#0b1b22" stroke-width="1.6"/>`,
  todo:()=>`<defs><clipPath id="hzCt"><rect y="-110" width="400" height="260"/></clipPath><clipPath id="hzCb"><rect y="150" width="400" height="100"/></clipPath></defs>
    <rect y="-110" width="400" height="360" fill="#ff9e84"/>${hzWaves(30,330,-80,-40,"#3b3f6b",.35,53)}<rect y="150" width="400" height="100" fill="#3b3f6b"/>
    <circle cx="236" cy="150" r="64" fill="#f0506e" clip-path="url(#hzCt)"/><circle cx="236" cy="150" r="64" fill="#f0506e" opacity=".42" clip-path="url(#hzCb)"/>
    ${hzWaves(150,330,160,236,"#ff9e84",.7,17)}${hzWaves(40,380,40,96,"#3b3f6b",.5,19)}
    <text x="372" y="28" writing-mode="tb" font-family="Manrope,sans-serif" font-weight="800" font-size="13" letter-spacing="5" fill="#3b3f6b">ÚKOLY</text>
    ${hzRat(118,151,.9,"#3b3f6b",true,true)}`,
  money:()=>`<defs><linearGradient id="hzM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171a35"/><stop offset="1" stop-color="#35305f"/></linearGradient><radialGradient id="hzGg"><stop offset="0" stop-color="#f5c86a" stop-opacity=".55"/><stop offset="1" stop-color="#f5c86a" stop-opacity="0"/></radialGradient></defs>
    <rect y="-110" width="400" height="360" fill="url(#hzM)"/><g transform="translate(0 -110)">${hzStars(20,400,110,47)}</g>${hzStars(26,400,160,31)}
    <circle class="hz-glow" cx="300" cy="100" r="88" fill="url(#hzGg)"/><circle cx="300" cy="100" r="48" fill="#f5c86a"/><circle cx="300" cy="100" r="39" fill="none" stroke="#d99e3f" stroke-width="3"/><text x="300" y="112" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="32" fill="#c3852a">Kč</text>
    <path d="M0 250V204Q100 174 200 198T400 192V250Z" fill="#141630"/>
    ${[0,1,2,3,4,5].map(i=>`<ellipse cx="112" cy="${222-i*7}" rx="26" ry="7" fill="#e3ab4e" stroke="#b37a2a" stroke-width="1.2"/>`).join("")}${[0,1,2].map(i=>`<ellipse cx="160" cy="${226-i*7}" rx="20" ry="6" fill="#e3ab4e" stroke="#b37a2a" stroke-width="1.2"/>`).join("")}
    ${hzRat(108,184,.82,"#141630",true,true)}<circle cx="128" cy="150" r="6" fill="#f5c86a" stroke="#b37a2a" stroke-width="1"/>`,
  info:()=>`<rect y="-110" width="400" height="360" fill="#1b2140"/><g transform="translate(0 -110)">${hzStars(14,400,100,57,"#8f9ad0")}</g>${[1,1.4,1.8].map(k=>`<ellipse cx="260" cy="-40" rx="${40*k}" ry="${20*k}" fill="none" stroke="#28305a" stroke-width="1.4"/>`).join("")}
    ${[1,1.35,1.7,2.05].map(k=>`<ellipse cx="90" cy="90" rx="${34*k}" ry="${22*k}" fill="none" stroke="#28305a" stroke-width="1.4" transform="rotate(-12 90 90)"/>`).join("")}${[1,1.4,1.8].map(k=>`<ellipse cx="330" cy="200" rx="${30*k}" ry="${18*k}" fill="none" stroke="#28305a" stroke-width="1.4" transform="rotate(10 330 200)"/>`).join("")}
    <path d="M178 -10C140 60 262 92 214 142S160 214 222 262" fill="none" stroke="#2a8c8c" stroke-width="16" stroke-linecap="round" opacity=".85"/><path d="M178 -10C140 60 262 92 214 142S160 214 222 262" fill="none" stroke="#5fd3c4" stroke-width="2" opacity=".5"/>
    <text x="318" y="66" font-family="Cinzel,serif" font-size="24" letter-spacing="9" fill="#39457a" text-anchor="middle">PRAHA</text>
    <path d="M36 204C96 160 150 180 206 136S292 116 320 152" fill="none" stroke="#f5d27a" stroke-width="2.2" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path transform="translate(26 206) rotate(-30)" d="M10 5.5v-1.2L5.4 1.6V-2a.9.9 0 0 0-1.8 0v3.6L-1 4.3v1.2l4.6-1.3V7L2.4 8v.8L4.5 8l2.1.8V8L5.4 7V4.2z" fill="#f5d27a"/>
    <circle class="hz-pulse" cx="320" cy="152" r="10" fill="#ff8a6b"/><circle cx="320" cy="152" r="6.5" fill="#ff8a6b"/>
    ${hzRat(346,176,.62,"#0f1328",false,true)}`,
};

export function groundEl(){const e=svg(`<path d="M0 64V36C52 18 100 16 154 27S252 42 302 29S372 16 400 22V64Z" fill="currentColor" opacity=".42"/><path d="M0 64V46C62 31 124 31 192 41S322 51 400 37V64Z" fill="currentColor"/>`,"0 0 400 64");e.setAttribute("preserveAspectRatio","none");e.classList.add("ground");return e}
