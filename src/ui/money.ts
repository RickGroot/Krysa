/* eslint-disable */
// Money: a quick koruna/euro converter, the bill (who pays whom, like a Czech pub's účet) and every shared cost.
import { EN, parseD } from "../lib/dates";
import { fmtAmt, fmtCzk, fmtEur } from "../lib/money";
import { S, pname } from "../state";
import { balances, rate, settle, toCzk } from "./bound";
import { h } from "./dom";
import { editExpense, editRate } from "./editors";
import { icon } from "./icons";
import { note, secHead } from "./parts";
import { render } from "./tabs";

function convCard(){
  const c=S.conv,toEur=c.from==="CZK";
  const out=h("output",{class:"conv-out",id:"conv-out",for:"conv-amt","aria-live":"polite"});
  const upd=()=>{const n=parseFloat(String(c.amt).replace(/\s/g,"").replace(",","."));out.textContent=!(n>=0)?(toEur?"€ —":"— Kč"):toEur?fmtEur(n/rate()):fmtCzk(n*rate())};
  const inp=h("input",{id:"conv-amt","data-k":"conv-amt",inputmode:"decimal",autocomplete:"off",placeholder:toEur?"285":"12",oninput:e=>{c.amt=e.target.value;upd()}});inp.value=c.amt;
  upd();
  return h("section",{class:"sec","aria-labelledby":"conv-t"},secHead("Convert",h("button",{class:"btn small",type:"button","data-k":"conv-swap","aria-label":toEur?"Switch to euro to koruna":"Switch to koruna to euro",onclick:()=>{c.from=toEur?"EUR":"CZK";render();document.getElementById("conv-amt")?.focus()}},icon("swap"),toEur?"Kč → €":"€ → Kč"),"conv-t"),
    h("div",{class:"conv"},h("div",{class:"field"},h("label",{for:"conv-amt",text:toEur?"Price in Kč":"Amount in €"}),inp),h("span",{class:"conv-eq","aria-hidden":"true",text:"≈"}),out),
    h("p",{class:"hint",text:[100,250,500,1000].map(k=>`${fmtCzk(k)} ≈ ${fmtEur(k/rate())}`).join(" · ")}));
}

export function renderMoney(main){
  main.append(convCard());
  const total=S.expenses.reduce((s,e)=>s+toCzk(e),0),bal=balances(),moves=settle(bal);
  main.append(h("section",{class:"sec","aria-labelledby":"bill-t"},secHead("The bill",h("span",{class:"rate"},`1 € = ${rate().toLocaleString("en-GB")} Kč`,S.canWrite&&h("button",{class:"btn small quiet","data-k":"edit:rate",onclick:editRate},"Change")),"bill-t"),
    h("div",{class:"bill panel"},
      h("p",{class:"bill-cs",lang:"cs","aria-hidden":"true",text:"Účet"}),
      moves.length?h("ol",{class:"bill-lines"},moves.map(m=>h("li",null,h("span",{class:"bill-who"},h("b",{text:pname(m.from)})," pays ",h("b",{text:pname(m.to)})),h("span",{class:"bill-amt"},fmtCzk(m.amt),h("small",{text:`≈ ${fmtEur(m.amt/rate())}`})))))
        :h("p",{class:"bill-square",text:S.expenses.length?"All square. Krysa raises a Pilsner.":"Nothing logged yet."}),
      h("div",{class:"bill-total"},h("span",{text:"Spent together"}),h("b",{text:fmtCzk(total)}),h("small",{text:`≈ ${fmtEur(total/rate())} · ${S.expenses.length} expense${S.expenses.length===1?"":"s"}`})),
      S.people.length&&S.expenses.length?h("dl",{class:"bill-bal"},S.people.flatMap(p=>{const v=bal[p.id]||0;return[h("dt",{text:p.name||"Someone"}),h("dd",{class:v>0.5?"pos":v<-0.5?"neg":"",text:(v>0.5?"gets back ":v<-0.5?"owes ":"even ")+(Math.abs(v)>0.5?fmtCzk(Math.abs(v)):"")})]})):null)));
  const xs=[...S.expenses].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||""));
  main.append(h("section",{class:"sec","aria-labelledby":"xs-t"},secHead("Expenses",null,"xs-t"),
    xs.length?h("ul",{class:"rows"},xs.map(x=>{const d=parseD(x.date),n=Array.isArray(x.split)?x.split.length:S.people.length;
      const what=S.canWrite?h("button",{class:"row-open",type:"button","data-k":"edit:expenses:"+x.id,onclick:()=>editExpense(x)},x.what):h("span",{text:x.what});
      return h("li",{class:"row xrow"},h("span",{class:"xdate",text:d?`${EN[d.getUTCDay()]} ${d.getUTCDate()}`:""}),
        h("div",{class:"row-main"},h("div",{class:"row-ti"},what),h("p",{class:"row-meta",text:`${pname(x.paidBy)} paid · split ${n} way${n===1?"":"s"}${x.currency==="EUR"?` · ≈ ${fmtCzk(toCzk(x))}`:""}`})),
        h("span",{class:"amt",text:fmtAmt(x)}))}))
      :note("sus","No shared costs yet. Log the first one and Krysa does the splitting.",S.canWrite&&h("button",{class:"btn primary","data-k":"money:first",onclick:()=>editExpense()},"Log an expense"))));
}
