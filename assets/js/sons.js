/* ===== Toques do sistema =====
   call.mp3 -> toca na sala/computador que está sendo chamado, repetindo até atender, recusar ou cancelar.
   beep.mp3 -> toca na recepção/administração quando um médico pede vínculo, repetindo até aprovar ou recusar.
   Os arquivos ficam em assets/audio/ (mesmo nível de assets/js e assets/css).
   Se um arquivo não existir, o beep usa um bip sintético; a chamada volta ao toque sintético antigo. */
(()=>{
const DIR='assets/audio/',F={call:{src:'call.mp3',gap:400,synth:false},beep:{src:'beep.mp3',gap:1200,synth:true}},P={};
let AC=null;
const actx=()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}};
const synth=()=>{const a=actx();if(!a||a.state!=='running')return;const t=a.currentTime+.02;[880,1175].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.18);g.gain.linearRampToValueAtTime(.18,t+i*.18+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.18+.16);o.connect(g);g.connect(a.destination);o.start(t+i*.18);o.stop(t+i*.18+.2)})};
const mk=k=>{if(P[k])return P[k];const a=new Audio(DIR+F[k].src);a.preload='auto';
 const s=P[k]={a,want:false,tm:0,bad:false,sy:0};
 a.addEventListener('error',()=>{s.bad=true});
 a.addEventListener('ended',()=>{if(!s.want)return;clearTimeout(s.tm);s.tm=setTimeout(()=>go(k),F[k].gap)});
 return s};
const go=k=>{const s=P[k];if(!s||!s.want)return;clearTimeout(s.tm);s.tm=0;if(s.bad)return;
 try{s.a.currentTime=0;const p=s.a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}};
/* start devolve true se o toque está sendo tratado aqui (arquivo ou bip sintético) */
const start=k=>{const s=mk(k);if(s.want)return true;s.want=true;
 if(s.bad){if(!F[k].synth){s.want=false;return false}s.sy=setInterval(synth,1500);synth();return true}
 go(k);return true};
const stop=k=>{const s=P[k];if(!s)return;s.want=false;clearTimeout(s.tm);s.tm=0;clearInterval(s.sy);s.sy=0;try{s.a.pause();s.a.currentTime=0}catch(e){}};
/* o navegador só libera áudio depois de um clique/tecla na página; tenta de novo a cada segundo e a cada clique */
const retry=()=>Object.keys(P).forEach(k=>{const s=P[k];
 if(s.want&&!s.bad&&s.a.paused&&!s.tm)go(k);
 if(s.want&&s.bad&&F[k].synth&&!s.sy){s.sy=setInterval(synth,1500)}});
['pointerdown','keydown'].forEach(n=>document.addEventListener(n,()=>{actx();retry()},{capture:true,passive:true}));
setInterval(retry,1000);
Object.keys(F).forEach(mk);
window.RSL_SOM={start,stop,ok:k=>!mk(k).bad};
})();
