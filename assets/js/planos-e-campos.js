/* ===== v33 — campos padronizados + dica 12px; aba Planos; teste grátis ===== */
(()=>{
/* ---------- Planos ---------- */
const PL=[
 {id:1,n:'Básico',p:149,d:'Clínica pequena: agenda e atendimento do dia a dia.'},
 {id:2,n:'Profissional',p:299,d:'Equipe, salas e relatórios para organizar a operação.'},
 {id:3,n:'Premium',p:549,d:'Financeiro, estoque, PACS e WhatsApp integrados.'},
 {id:4,n:'Premium +',p:899,d:'Gestão completa: financeiro avançado, inventário e várias unidades.'}];
const MD=[ /* [módulo, plano mínimo, chaves de menu liberadas] */
 ['Agenda e Pacientes',1,['ag','pac']],
 ['Pendências do dia e Atendimento médico',1,['pend','mdc']],
 ['Cadastro de Médicos e Exames',1,['med','ex']],
 ['Funcionários e acessos',2,['func']],
 ['Salas: visualizar e cadastrar',2,['salv','salc']],
 ['Fluxo do sistema',2,['fluxo']],
 ['Relatórios e exportação CSV',2,['rel']],
 ['Financeiro: visão geral, a receber e a pagar',3,['fin']],
 ['Repasse médico',3,['rp']],
 ['Estoque: itens e movimentações',3,['est']],
 ['PACS / Worklist',3,['pacs']],
 ['WhatsApp: menu de mensagens e botões de envio',3,['wa']],
 ['Financeiro avançado: fluxo de caixa, DRE e regras',4,[]],
 ['Inventário de estoque',4,[]],
 ['Várias clínicas (unidades)',4,[]]];
const KL={};MD.forEach(m=>m[2].forEach(k=>KL[k]=m[1]));
/* Plano global do sistema: definido só pelo acesso proprietário (fluxoclean@local) e guardado em S.plano. */
window.planLv=()=>isOwner()?4:Math.min(4,Math.max(1,(S.plano&&+S.plano.n)||4));
window.planOK=k=>(KL[k]||0)<=window.planLv();
const fdh=t=>new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const left=ms=>{const m=Math.max(1,Math.ceil(ms/60000));return m<60?m+' min':m<1440?(Math.floor(m/60)+' h '+(m%60?m%60+' min':'')).trim():Math.floor(m/1440)+' dia(s)'};
const brl2=n=>'R$ '+n.toLocaleString('pt-BR');

if(!ROLES.some(r=>r[0]==='vend'))ROLES.push(['vend','Vendedor (planos e demonstração)']);

V.plan=()=>{const cur=(S.plano&&+S.plano.n)||4,at=S.plano&&S.plano.em?fdh(S.plano.em):'',por=S.plano&&S.plano.por?S.plano.por:'',
 cards=PL.map(p=>{const on=cur===p.id,li=MD.filter(m=>m[1]===p.id).map(m=>`<li>${esc(m[0])}</li>`).join('');
  return`<article class="pl-c${on?' on':''}"><h3>${esc(p.n)}${on?' <span class="tag ok">Ativo</span>':''}</h3><div class="pl-p"><b>${brl2(p.p)}</b>/mês</div><p class="hint">${esc(p.d)}</p><div class="hint"><b>${p.id===1?'Inclui':'Tudo do '+esc(PL[p.id-2].n)+', mais'}:</b></div><ul>${li}</ul><div class="pl-w${p.id>=3?' y':''}">WhatsApp: ${p.id>=3?'liberado':'não incluso'}</div></article>`}).join('');
 const rows=MD.map(m=>`<tr><td>${esc(m[0])}</td>${PL.map(p=>`<td class="c">${p.id>=m[1]?'<span class="tag ok" aria-label="Incluso">✓</span>':'<span aria-label="Não incluso">—</span>'}</td>`).join('')}</tr>`).join('');
 return`<h1>Planos</h1><p class="sub">Somente este acesso (proprietário) altera o plano. A escolha vale para todos os usuários do sistema.</p><div class="fx"><section class="pn pl-t"><h2>Plano do sistema</h2><p class="fxb" role="status">Plano ativo: <b>${esc(PL[cur-1].n)}</b>${at?' · desde '+at:''}${por?' · por '+esc(por):''}</p><div class="pl-f"><div class="s"><label for="pl_sel">Plano</label><select id="pl_sel">${PL.map(p=>`<option value="${p.id}" ${p.id===cur?'selected':''}>${esc(p.n)} — ${brl2(p.p)}/mês</option>`).join('')}</select></div><div><label>&nbsp;</label><button class="btn p" data-a="plSet">Ativar plano</button></div></div><p class="hint">Este acesso sempre vê todos os menus, qualquer que seja o plano ativo.</p></section>
 <div class="pl-g">${cards}</div><section class="pn"><h2>Resumo do acesso por plano</h2><div class="tw"><table class="pl-tb"><thead><tr><th>Módulo</th>${PL.map(p=>`<th class="c">${esc(p.n)}</th>`).join('')}</tr></thead><tbody><tr><td><b>Mensalidade</b></td>${PL.map(p=>`<td class="c"><b>${brl2(p.p)}</b></td>`).join('')}</tr>${rows}</tbody></table></div></section></div>`};

window.PLCFG=()=>`<div class="fx"><div style="display:grid;gap:12px;max-width:580px"><h2>Plano do sistema</h2><p class="hint">O plano vale para todos os usuários e só pode ser alterado pelo acesso proprietário, na aba Planos.</p></div></div>`;

Object.assign(A,{
 plSet(){if(!isOwner()){toast('Apenas o acesso proprietário altera o plano.');return}const n=+($('#pl_sel').value)||4;if(!confirm('Ativar o plano '+PL[n-1].n+' para todos os usuários?'))return;S.plano={n,em:new Date().toISOString(),por:me.email||me.u};save();render();toast('Plano '+PL[n-1].n+' ativado para todos os usuários')},
});

const g0=A.go;A.go=function(v){if(me&&!window.planOK(v)){toast('Este recurso não está no plano ativo. Fale com o administrador do sistema.');return}return g0.apply(this,arguments)};

const R3=render;render=function(){document.documentElement.dataset.pl=String(window.planLv());return R3.apply(this,arguments)};

/* ---------- Campos com tamanho padrão + dica em 12px ---------- */
const W=(s,w)=>`${s}{flex:0 0 ${w}px!important;width:${w}px!important;min-width:${w}px!important;max-width:${w}px!important}`;
const css=document.createElement('style');css.id='v33';css.textContent=[
'input,select,textarea{box-sizing:border-box}',
'input:not([type=checkbox]):not([type=radio]):not([type=color]):not([type=file]),select{text-overflow:ellipsis;white-space:nowrap}',
'.top>div>label{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
W('.top>div:has(>select)',220),
W('.top>div:has(>input[type=date]),.top>div:has(>input[type=month])',170),
W('.top>div:has(>input[type=time])',130),
W('.top>div:has(>input[type=number])',150),
W('.top>div:has(>input[type=search]),.top>div:has(>input[type=text]),.top>div:has(>input:not([type]))',300),
W('.top.nx-fb>div:has(>select)',160),W('.top.nx-fb>div:has(>#d_xp)',200),
'.top>div:has(>.acts>input[type=date]){flex:none!important;width:auto!important;min-width:0!important;max-width:none!important}',
'.acts>input[type=date]{flex:0 0 170px;width:170px!important;min-width:170px}',
'.acts:has(>input[type=date])>.btn{flex:none;width:40px;min-width:40px;padding:0}',
'.top .acts>span.tag{flex:0 0 170px;width:170px;display:inline-block;box-sizing:border-box;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.tb select.cls{flex:none;width:220px}#idl_t{width:220px;max-width:100%}',
'#ttip{position:fixed;z-index:99999;background:var(--tx);color:var(--bg);padding:4px 8px;border-radius:6px;line-height:1.35;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.3);white-space:normal;overflow-wrap:anywhere;font-weight:400}',
'@media print{#ttip{display:none!important}}',
/* WhatsApp só nos planos 3 e 4 */
'html[data-pl="0"] [data-a^="wa,"],html[data-pl="1"] [data-a^="wa,"],html[data-pl="2"] [data-a^="wa,"],html[data-pl="0"] [data-a^="waPac"],html[data-pl="1"] [data-a^="waPac"],html[data-pl="2"] [data-a^="waPac"]{display:none!important}',
/* página de planos */
'.pl-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:16px}',
'.pl-c{background:var(--s);border:1.5px solid var(--ln);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:6px;min-width:0}',
'.pl-c.on{border-color:var(--c2);box-shadow:0 0 0 2px var(--c2)}',
'.pl-c h3{margin:0}.pl-p b{font-size:26px}.pl-c ul{margin:0;padding-left:18px;flex:1}.pl-c li{margin:3px 0}',
'.pl-w{font-weight:700;color:var(--mu)}.pl-w.y{color:var(--ok)}',
'.pl-t{margin-top:16px}.pl-f{display:flex;gap:12px;flex-wrap:wrap;align-items:end}.pl-f .s{flex:0 0 220px}.pl-f .t{flex:0 0 300px}',
'.pl-tb td.c,.pl-tb th.c{text-align:center}',
/* v34: cabeçalho das tabelas dos cartões com fundo sólido (não sobrepõe as linhas) */
'.nx-c th{background:var(--s)!important;position:sticky;top:0;z-index:2;white-space:nowrap}.nx-body.p .nx-c th,.nx-body.a .nx-c th{position:static!important}'].join('\n');
document.head.appendChild(css);

const tip=document.createElement('div');tip.id='ttip';tip.setAttribute('role','tooltip');
const SEL='input,select,textarea,.btn,.tag,label,.row>span,.kt,.slot,.nx-pt,.un b,th,td';
const cv=document.createElement('canvas').getContext('2d');let tm=0;
const zf=()=>parseFloat(document.documentElement.style.zoom)||1;
const txt=el=>{const t=el.tagName;
 if(t==='SELECT')return el.selectedOptions[0]?el.selectedOptions[0].text:'';
 if(t==='TEXTAREA')return el.value;
 if(t==='INPUT')return /^(text|search|tel|email|url|number)$/.test(el.type)?el.value:'';
 return el.textContent.replace(/\s+/g,' ').trim()};
const over=(el,s)=>{const t=el.tagName;
 if(t==='INPUT'||t==='SELECT'){const c=getComputedStyle(el);cv.font=c.fontWeight+' '+c.fontSize+' '+c.fontFamily;
  return cv.measureText(s).width>el.clientWidth-parseFloat(c.paddingLeft)-parseFloat(c.paddingRight)-(t==='SELECT'?26:0)}
 if(t==='TEXTAREA')return el.scrollHeight>el.clientHeight+1;
 return el.scrollWidth>el.clientWidth+1};
const hide=()=>{clearTimeout(tm);tip.remove()};
const show=(el,x,y)=>{if(!el.isConnected||el.getAttribute('title'))return;const s=txt(el);if(!s||!over(el,s))return;
 const z=zf(),host=[...document.querySelectorAll('dialog[open]')].pop()||document.body;
 tip.textContent=s;tip.style.fontSize=(12/z)+'px';tip.style.maxWidth=(Math.min(420,innerWidth*.8)/z)+'px';host.appendChild(tip);
 const w=tip.offsetWidth,h=tip.offsetHeight,vw=innerWidth/z,vh=innerHeight/z;
 let L=x/z+10,T=y/z+16;if(L+w>vw-6)L=vw-w-6;if(L<6)L=6;if(T+h>vh-6)T=y/z-h-10;if(T<6)T=6;
 tip.style.left=L+'px';tip.style.top=T+'px'};
document.addEventListener('mousemove',e=>{hide();const el=e.target.closest&&e.target.closest(SEL);if(!el)return;const x=e.clientX,y=e.clientY;tm=setTimeout(()=>show(el,x,y),350)},true);
['mousedown','keydown','wheel','scroll'].forEach(n=>document.addEventListener(n,hide,true));
document.addEventListener('mouseleave',hide);
})();

