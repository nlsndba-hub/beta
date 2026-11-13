/* ===== v17: ajuste automático ao tamanho da janela =====
   Quando a janela é menor que a tela cheia, o sistema reduz tudo (letras e quadros) na mesma proporção para caber,
   mantendo o mesmo desenho. Em tela cheia nada muda. O zoom manual (Acessibilidade) continua valendo como máximo.
   Para remover: apague este bloco inteiro.                                                                   */
(()=>{
 const H0=800,W0=1280,MIN=.58;       // tamanho de referência (em px) em que o desenho cabe sem apertar
 let X=1;                            // redução extra de segurança, calculada após cada tela
 const desk=()=>innerWidth>860;
 const base=()=>{if(!desk())return Z;const o=Math.max(MIN,Math.min(Z,innerHeight/H0,innerWidth/W0)),u=Math.min(4,Math.min(innerHeight/1200,innerWidth/2133)*Z/.9);return Math.max(o,u)};  /* v34: em telas maiores que Full HD (QHD, 4K, 8K) tudo cresce na mesma proporção; em Full HD ou menor fica igual a antes */
 const apply=()=>{const e=Math.max(desk()?MIN:Z,base()*X);document.documentElement.style.zoom=e;document.documentElement.style.setProperty('--z',e)};
 const squashed=()=>[...document.querySelectorAll('.nx-kc>*,.nx-side>*,.kg>*,.nx-top .nx-c')].some(e=>{if(!e.offsetParent)return false;const R=e.getBoundingClientRect();return[...e.children].some(c=>{const r=c.getBoundingClientRect();return r.height&&(r.bottom>R.bottom+1||r.top<R.top-1)})});
 const dens=()=>{const r=document.documentElement;for(let d=0;d<4;d++){r.dataset.dens=d;if(!desk()||!squashed())break}};
 const fit=()=>{X=1;apply();dens();if(!desk()||base()>=Z-.001)return;for(let i=0;i<6&&squashed();i++){X=+(X*.95).toFixed(3);apply()}};
 const z0=A.zoom;A.zoom=n=>{z0(n);fit()};
 const R0=render;
 /* paginação sem rolagem: linhas por página = o que cabe na altura da tabela */
 const fitPS=()=>{for(let k=0;k<6;k++){const w=document.querySelector('main .tw.pg');if(!w||!PGI)return;const r=w.querySelectorAll('tbody tr');if(!r.length)return;const th=w.querySelector('thead').offsetHeight,h=[...r].reduce((a,x)=>a+x.offsetHeight,0),avg=h/r.length,box=w.clientHeight;let np;
   if(w.scrollHeight>box+1)np=Math.max(3,r.length-Math.ceil((w.scrollHeight-box)/avg));else if(PGI.n>r.length&&box-th-h>=avg)np=r.length+Math.floor((box-th-h)/avg);else return;
   if(np===PS)return;const first=(PGI.p-1)*PS;PS=np;PGN[PGI.k]=Math.floor(first/PS)+1;R0()}};
 render=function(){R0();fit();fitPS()};
 let t;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(fit,80)});
 ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(fit,120)));
 apply()})();

/* ===== v18: gráficos funcionam como filtros (estilo Power BI) =====
   Clicar numa barra filtra os números e as tabelas da tela; clicar de novo (ou em "Limpar filtro") remove.
   Ao trocar de página, os filtros dos gráficos são limpos automaticamente.                               */
(()=>{
 Object.assign(A,{xw(d){F.cw=F.cw===d?'':d;render()},rf(k,v){F[k]=F[k]===v?'':v;render()},rfc(){F.rs=F.rd='';render()}});
 const clr=()=>{['xd','xg','xt','xm','xs','cw','rs','rd'].forEach(k=>F[k]='');F.xp='c'};
 const d0=A.dtab;A.dtab=k=>{F.cw='';d0(k)};
 let LV=view;const R1=render;render=function(){if(view!==LV){clr();LV=view}R1()};
 document.addEventListener('keydown',e=>{const g=e.target&&e.target.closest&&e.target.closest('[data-a][role=button]');if(g&&g===e.target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();g.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
})();

