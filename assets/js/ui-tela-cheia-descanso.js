/* ===== tela cheia: aviso + entra sozinho no primeiro clique/Enter ===== */
(()=>{const de=document.documentElement,req=de.requestFullscreen||de.webkitRequestFullscreen,ex=document.exitFullscreen||document.webkitExitFullscreen;
 const inFs=()=>!!(document.fullscreenElement||document.webkitFullscreenElement),isFs=()=>inFs()||(innerHeight>=screen.height-2&&innerWidth>=screen.width-2);
 const go=()=>{try{const r=req&&req.call(de);r&&r.catch&&r.catch(()=>{})}catch(e){}};
 Object.assign(A,{fs(){inFs()?ex&&ex.call(document):go()}});
 if(!req)return;
 let no=false;try{no=sessionStorage.getItem('ur-fs-no')==='1'}catch(e){}
 const b=document.createElement('div');b.id='fsb';b.setAttribute('role','region');b.setAttribute('aria-label','Tela cheia');
 b.innerHTML='<span>Para aproveitar melhor a tela, use o modo tela cheia.</span><button class="btn p" id="fsy">Entrar em tela cheia</button><button class="btn" id="fsn">Agora não</button>';
 document.body.appendChild(b);
 const sync=()=>{b.hidden=no||isFs()};
 $('#fsy').onclick=()=>{go()};
 $('#fsn').onclick=()=>{no=true;try{sessionStorage.setItem('ur-fs-no','1')}catch(e){}sync()};
 const first=e=>{if(e.type==='keydown'&&e.key!=='Enter')return;if(e.target.closest&&e.target.closest('#fsb'))return;document.removeEventListener('click',first,true);document.removeEventListener('keydown',first,true);if(!no&&!isFs())go()};
 document.addEventListener('click',first,true);document.addEventListener('keydown',first,true);
 ['fullscreenchange','webkitfullscreenchange','resize'].forEach(ev=>addEventListener(ev,sync));
 document.addEventListener('fullscreenchange',sync);sync()})();

/* ===== v16/v20: protetor de tela — após 10 SEGUNDOS sem atividade, a visualização de salas vira "papel de parede" =====
   Mexer o mouse, tocar na tela ou apertar uma tecla faz a tela esmaecer de volta para onde você estava.
   Só conta atividade NESTA janela (mouse, teclado e toque que chegam a ela): se você estiver mexendo na outra tela, esta entra em descanso normalmente.
   Para remover: apague este bloco inteiro.                                                              */
(()=>{
 const IDLE_MS=()=>idleSecs()*1000;  // tempo parado até ativar: escolhido em Acessibilidade › Descanso de tela (padrão 10 s; 0 = desligado)
 const MOSTRAR_PACIENTE=true;       // true: mostra paciente e médico(a) na sala; false: só o exame (mais privacidade)
 const css=document.createElement('style');css.textContent=`
#idle{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;border:0;padding:clamp(16px,3vw,36px);background:var(--bg);color:var(--tx);display:flex;flex-direction:column;gap:14px;opacity:0;transition:opacity 1.6s ease;z-index:2147483647;overflow:hidden;cursor:none}
#idle.on{opacity:1}#idle.off{transition-duration:.8s}#idle *{cursor:none!important}
.idl-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px}.idl-top img{height:clamp(67px,18.7vh,192px);max-width:100%;object-fit:contain;justify-self:center}
.idl-clock{text-align:right;justify-self:end}.idl-clock b{display:block;font-family:inherit;font-weight:700;font-size:clamp(40px,7vh,72px);line-height:1;font-variant-numeric:lining-nums tabular-nums;font-feature-settings:'lnum' 1,'tnum' 1;color:var(--c1)}.idl-clock span{color:var(--mu);text-transform:capitalize}
.idl-lg{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.idl-wrap{flex:1 1 0;min-height:0}.idl-h{margin:0;text-align:center;color:var(--mu);font-size:13px}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .idl-top img{filter:brightness(0) invert(1)}}
@media(prefers-reduced-motion:reduce){#idle,#idle.off{transition-duration:.3s}}
.rm .who{display:flex;flex-direction:column;align-items:center;gap:4px;max-width:100%;font-size:12px;font-weight:400;line-height:1.25}
.rm .who>div{display:flex;align-items:center;justify-content:center;gap:5px;max-width:100%;min-width:0}
.rm .who strong{min-width:0;font-weight:600;overflow-wrap:anywhere}
.rm .who .ic{width:15px;height:15px;margin:0;vertical-align:middle;flex:none}
.rm .who .pi{width:20px;height:20px;flex:none}
.rm .who .ex{opacity:.92}
:root[data-theme=dark] .idl-top img{filter:brightness(0) invert(1)}:root[data-theme=dark] .idl-clock b{color:#c98bd9}@media(prefers-color-scheme:dark){:root:not([data-theme]) .idl-clock b{color:#c98bd9}}
#idle .rm.sm{padding:3px;gap:1px;overflow:hidden}#idle .rm.sm b{font-size:14px}#idle .rm.sm>span{font-size:12px}#idle .rm.sm .who{font-size:12px;gap:1px}#idle .rm.sm .who .ic,#idle .rm.sm .who .pi,#idle .rm.sm .who .ex{display:none}#idle .rm b{font-size:18px}#idle .rm>span{font-size:15px}#idle .rm .who{font-size:15px;gap:6px}#idle .rm .who .ic{width:19px;height:19px}#idle .rm .who .pi{width:26px;height:26px}
.pi-t{fill:var(--s);stroke:var(--ln);stroke-width:1.2}.pi-p{fill:url(#ur-pg)}
#ur-pg stop:first-child{stop-color:var(--c1)}#ur-pg stop:last-child{stop-color:var(--c2)}
:root[data-theme=dark] #ur-pg stop:first-child{stop-color:#c98bd9}
@media(prefers-color-scheme:dark){:root:not([data-theme]) #ur-pg stop:first-child{stop-color:#c98bd9}}`;document.head.appendChild(css);
 document.body.insertAdjacentHTML('beforeend','<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="ur-pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0"/><stop offset="1"/></linearGradient></defs></svg>');
 let last=Date.now(),el=null,tm=null,at=0,lx=-1,ly=-1;
 const html=()=>{const n=new Date(),d=today(),hm=n.toTimeString().slice(0,5),R=SL().map(r=>occ(r,d,hm)),st=o=>!o.link?'n':o.cur?(o.es?'s':'o'):o.nx?'s':'l',LB={l:'Livre',o:'Ocupada',s:'Em breve',n:'Sem vínculo'},cnt=k=>R.filter(o=>st(o)===k).length;
  return`<div class="idl-top"><span></span><img src="${esc(S.cfg.logo||LOGO)}" alt="${esc(S.cfg.nome)}"><div class="idl-clock"><b>${hm}</b><span>${n.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</span></div></div><div class="idl-lg">${['l','o','s','n'].map(k=>`<span class="rl ${k}"><i></i>${LB[k]}: ${cnt(k)}</span>`).join('')}</div><div class="cr-wrap v idl-wrap"><div class="cr-area"><div class="cr-cv">${R.map(o=>{const k=st(o),a=o.cur||o.nx;return`<div class="rm ${k}${o.r.h<=3?' sm':''}" style="${pos(o.r)}"><b>${esc(o.r.nome)}</b><span>${k==='s'&&o.cur?'Terminando':LB[k]}${o.cur?' até '+hm2(m2(o.cur.hora)+30):o.nx?' às '+o.nx.hora:''}</span>${a?who(a,MOSTRAR_PACIENTE):''}</div>`}).join('')}</div></div></div><p class="idl-h">Mova o mouse ou toque na tela para voltar</p>`};
 const show=()=>{if(el)return;try{el=document.createElement('div');el.id='idle';el.setAttribute('role','img');el.setAttribute('aria-label','Protetor de tela com a situação das salas. Mova o mouse para voltar.');el.innerHTML=html();
  if('popover'in el){el.setAttribute('popover','manual');document.body.appendChild(el);try{el.showPopover()}catch(e){}}else document.body.appendChild(el);
  at=Date.now();requestAnimationFrame(()=>requestAnimationFrame(()=>el&&el.classList.add('on')));
  tm=setInterval(()=>{if(el&&!el.classList.contains('off'))el.innerHTML=html()},30000)}catch(err){console.error('Protetor de tela:',err);try{el&&el.remove()}catch(x){}el=null;last=Date.now()}};
 const wake=()=>{if(!el||el.classList.contains('off'))return;const e=el;clearInterval(tm);e.classList.add('off');e.classList.remove('on');
  setTimeout(()=>{try{e.hidePopover&&e.hidePopover()}catch(x){}e.remove();if(el===e)el=null;last=Date.now()},850)};
 const act=e=>{const mv=e.type==='mousemove';if(mv){const d=Math.abs(e.screenX-lx)+Math.abs(e.screenY-ly);lx=e.screenX;ly=e.screenY;if(d<4)return}last=Date.now();if(!el)return;if(!mv){e.stopPropagation();if(e.cancelable)e.preventDefault()}if(Date.now()-at>400)wake()};
 ['mousemove','mousedown','mouseup','click','keydown','keyup','touchstart','wheel','pointerdown'].forEach(t=>document.addEventListener(t,act,{capture:true,passive:false}));
 setInterval(()=>{if(!el&&me&&IDLE_MS()>0&&Date.now()-last>=IDLE_MS())show()},500)})();

