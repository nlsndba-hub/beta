/* Camada de dados.
   - Modo local: guarda tudo no localStorage deste navegador.
   - Modo nuvem (Supabase): cada item das listas (pacientes, agenda, etc.) vira uma linha na tabela
     "records"; configurações e modelos viram linhas na tabela "settings". Só o que mudou é enviado. */
const Store=(()=>{
  const KEY='ultra-rsl-v5',SEP='\u0001',PAGE=500;
  const remote=()=>!!window.RSL_REMOTE;
  const canon=v=>v===undefined?'null':v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canon).join(',')+']':'{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
  const isColl=v=>Array.isArray(v)&&v.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&typeof x.id==='string');
  const split=s=>{const rec=new Map(),set=new Map();
    for(const k of Object.keys(s)){const v=s[k];
      if(k==='cfg'){const{users,logo,...rest}=v||{};set.set('cfg',rest);set.set('logo',logo||'')}
      else if(isColl(v))v.forEach(x=>rec.set(k+SEP+x.id,{collection:k,id:x.id,data:x}));
      else set.set(k,v)}
    return{rec,set}};
  let LAST={rec:new Map(),set:new Map()},tm=0,busy=false,again=false,pending=false,lastErr=0,rt=0;

  const push=async()=>{const sb=window.sb,cur=split(S),up=[],del=new Map(),sup=[];
    cur.rec.forEach((r,k)=>{const c=canon(r.data);if(LAST.rec.get(k)!==c)up.push({k,c,row:r,old:LAST.rec.get(k)})});
    LAST.rec.forEach((_,k)=>{if(!cur.rec.has(k)){const[c,id]=k.split(SEP);(del.get(c)||del.set(c,[]).get(c)).push({k,id})}});
    cur.set.forEach((v,k)=>{const c=canon(v);if(LAST.set.get(k)!==c)sup.push({k,c,row:{key:k,value:v}})});
    for(let i=0;i<up.length;i+=PAGE){const ch=up.slice(i,i+PAGE);
      ch.forEach(x=>LAST.rec.set(x.k,x.c));
      const{error}=await sb.from('records').upsert(ch.map(x=>x.row),{onConflict:'collection,id'});
      if(error){ch.forEach(x=>x.old===undefined?LAST.rec.delete(x.k):LAST.rec.set(x.k,x.old));throw error}}
    for(const[c,items]of del)for(let i=0;i<items.length;i+=200){const ch=items.slice(i,i+200);
      const{error}=await sb.from('records').delete().eq('collection',c).in('id',ch.map(x=>x.id));if(error)throw error;
      ch.forEach(x=>LAST.rec.delete(x.k))}
    if(sup.length){const old=sup.map(x=>LAST.set.get(x.k));sup.forEach(x=>LAST.set.set(x.k,x.c));
      const{error}=await sb.from('settings').upsert(sup.map(x=>x.row),{onConflict:'key'});
      if(error){sup.forEach((x,i)=>old[i]===undefined?LAST.set.delete(x.k):LAST.set.set(x.k,old[i]));throw error}}};

  const flush=async()=>{if(busy){again=true;return}busy=true;
    try{do{again=false;await push()}while(again);pending=false}
    catch(e){pending=true;if(Date.now()-lastErr>8000){lastErr=Date.now();try{toast('Não foi possível salvar na nuvem ('+(e.message||e)+'). Vou tentar de novo.')}catch(x){}}
      clearTimeout(tm);tm=setTimeout(flush,5000)}
    finally{busy=false}};

  let down=0,lastAct=0;['pointerdown','keydown'].forEach(n=>document.addEventListener(n,()=>{down=n==='pointerdown'?1:down;lastAct=Date.now()},true));
  ['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,()=>{down=0;lastAct=Date.now()},true));
  const refresh=()=>{clearTimeout(rt);const go=()=>{const a=document.activeElement;
      if(down||Date.now()-lastAct<1500||document.querySelector('dialog[open]')||(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))){rt=setTimeout(go,1500);return}
      if(me)render()};rt=setTimeout(go,400)};
  const replace=(o,n)=>{Object.keys(o).forEach(k=>delete o[k]);Object.assign(o,n)};
  const onRec=p=>{const del=p.eventType==='DELETE',row=del?p.old:p.new;if(!row||!row.collection)return;
    const k=row.collection+SEP+row.id,l=S[row.collection]=S[row.collection]||[],i=l.findIndex(x=>x.id===row.id);
    if(del){if(i<0&&!LAST.rec.has(k))return;LAST.rec.delete(k);if(i>=0)l.splice(i,1)}
    else{const c=canon(row.data);if(LAST.rec.get(k)===c)return;LAST.rec.set(k,c);if(i<0)l.push(row.data);else replace(l[i],row.data)}
    refresh()};
  const onSet=p=>{const row=p.new;if(!row||p.eventType==='DELETE')return;const c=canon(row.value);if(LAST.set.get(row.key)===c)return;LAST.set.set(row.key,c);
    if(row.key==='cfg'){const u=S.cfg.users,lg=S.cfg.logo;replace(S.cfg,row.value);S.cfg.users=u;S.cfg.logo=lg}
    else if(row.key==='logo')S.cfg.logo=row.value;else S[row.key]=row.value;refresh()};

  window.addEventListener('beforeunload',e=>{if(remote()&&(pending||busy)){e.preventDefault();e.returnValue=''}});
  return{KEY,
    me(){if(remote()){const P=window.__RSL_PRELOAD;return P&&P.me||null}try{return JSON.parse(sessionStorage.getItem('ur-me'))}catch(e){return null}},
    load(factory){
      if(!remote()){try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}}
      const P=window.__RSL_PRELOAD,b=factory();if(!P||!P.data)return b;const d=P.data;
      d.settings.forEach(({key,value})=>{if(key==='cfg')Object.assign(b.cfg,value);else if(key==='logo')b.cfg.logo=value;else b[key]=value});
      const by={};d.records.forEach(r=>(by[r.collection]=by[r.collection]||[]).push(r.data));Object.assign(b,by);
      b.cfg.users=d.users;
      LAST={rec:new Map(d.records.map(r=>[r.collection+SEP+r.id,canon(r.data)])),set:new Map(d.settings.map(s=>[s.key,canon(s.value)]))};
      return b},
    save(s){
      if(!remote()){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}return}
      if(!Store.me())return;pending=true;clearTimeout(tm);tm=setTimeout(flush,500)},
    subscribe(){if(!remote()||!window.sb||!Store.me())return;
      window.sb.channel('rsl-dados').on('postgres_changes',{event:'*',schema:'public',table:'records'},onRec)
        .on('postgres_changes',{event:'*',schema:'public',table:'settings'},onSet).subscribe()}};
})();
