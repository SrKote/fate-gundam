(() => {
  'use strict';
  const G=globalThis.FGEquipment, {esc,clone,num}=G;
  const TYPES={weapon:'Arma',tool:'Ferramenta',armor:'Proteção',shield:'Escudo',ammo:'Munição',supply:'Suprimento'};
  const STATES={ready:'Operante',damaged:'Comprometido',broken:'Inutilizado'};
  const SKILLS=['Atirar','Atletismo','Comunicação','Conhecimentos','Contatos','Empatia','Enganar','Furtividade','Investigação','Lutar','Ofícios','Percepção','Pilotagem','Provocar','Recursos','Roubo','Vigor','Vontade'];
  const options=(xs,v)=>xs.map(([k,n])=>`<option value="${esc(k)}"${String(k)===String(v)?' selected':''}>${esc(n)}</option>`).join('');
  class EquipmentUI {
    constructor(host) {
      this.h=host; this.root=host.root; this.targets={pilot:{range:0,scale:0},ms:{range:0}}; this.result=null; this.busy=false;
      G.migrate(this.h.state());
      this.root.addEventListener('click',e=>this.click(e));
      this.root.addEventListener('change',e=>this.change(e));
      this.root.addEventListener('input',e=>{if(e.target.matches('[data-eq-defense],[data-eq-arm]')) this.paintResult();});
    }
    items(w){return G.all(this.h.state(),w);}
    refresh(){this.h.render();this.render();this.h.save();}
    loadHTML(w){
      const n=G.load(this.h.state(),w), warn=n>8?'Exige transporte':n>6?'Sobrecarregado':'Carga preparada';
      return `<div class="eq-load ${n>6?'eq-warning':''}"><div><b>${n}<small> / 6</small></b><span>${warn}</span></div><div class="eq-slots" aria-label="Carga ${n} de 6">${Array.from({length:Math.max(6,Math.min(9,Math.ceil(n)))},(_,i)=>`<i class="${i<n?'on':''} ${i>=6?'over':''}"></i>`).join('')}</div></div>`;
    }
    field(w,x,key,label,type='text',values=null){
      const attrs=`data-eq-field="${key}" data-eq-who="${w}" data-eq-id="${esc(x.uid)}"`;
      return `<label><span>${label}</span>${values?`<select ${attrs}>${options(values,x[key]??'')}</select>`:`<input ${attrs} type="${type}" value="${esc(x[key]??'')}" ${type==='number'?'min="0" max="99" step="1"':''}>`}</label>`;
    }
    editor(w){
      const s=this.h.state(), cat=G.CATALOG[w];
      const row=x=>`<details class="eq-editor-item"><summary><b>${esc(x.n)}</b><span>${TYPES[x.kind]} · ${x.load} carga · ${STATES[x.status]}${x.location==='stored'?' · Armazenado':''}</span></summary><div class="eq-fields">
        ${this.field(w,x,'n','Nome')}${this.field(w,x,'kind','Categoria','',Object.entries(TYPES))}${this.field(w,x,'load','Carga','number')}
        ${this.field(w,x,'location','Onde está','',[['carried','Com você / na máquina'],['stored','Armazenado / transporte']])}${this.field(w,x,'status','Estado','',Object.entries(STATES))}
        ${this.field(w,x,'sk','Perícia','',SKILLS.map(n=>[n,n]))}${this.field(w,x,'action','Ação','',[['Atacar','Atacar'],['Criar vantagem','Criar vantagem'],['Superar','Superar']])}
        ${x.kind==='weapon'?`${this.field(w,x,'w','Arma','number')}${this.field(w,x,'r','Alcance','',[[0,'Mesma zona / contato'],[1,'1 zona'],[2,'2 zonas'],[3,'3 zonas']])}${this.field(w,x,'damage','Tipo de dano','',[['ballistic','Balas'],['fragment','Fragmentos'],['physical','Físico / explosivo'],['beam','Feixe']])}${this.field(w,x,'threat','Escala de ameaça','',[['','Da plataforma'],[0,'0 · Pessoa'],[1,'1 · Veículo'],[2,'2 · MS'],[3,'3 · Nave / MA']])}${this.field(w,x,'compat','Compatibilidade','',[['','Normal'],['beam','Requer suporte a feixes']])}`:''}
        ${x.kind==='armor'?`${this.field(w,x,'armor','Armadura','number')}${this.field(w,x,'protection','Protege contra','',[['ballistic','Balas e fragmentos'],['physical','Físico, exceto feixe'],['beam','Feixe'],['all','Todos (especial)']])}`:''}
        ${this.field(w,x,'maxUses','Usos máximos (vazio = sem contagem)','number')}${this.field(w,x,'uses','Usos restantes','number')}
        ${this.field(w,x,'ammo','Família de munição')}${this.field(w,x,'stunt','Façanha necessária','',[['','Nenhuma'],...s[w].stunts.map(t=>[t.id,t.n||'Façanha sem nome']),...Object.values(G.STUNTS).filter(t=>!s[w].stunts.some(a=>a.id===t.id)).map(t=>[t.id,`${t.n} · reservar vaga`]),...(x.stunt&&!s[w].stunts.some(t=>t.id===x.stunt)&&!G.STUNTS[x.stunt]?[[x.stunt,'Vínculo ausente · escolha uma façanha']]:[])])}
        <label class="eq-full"><span>Função e limitações</span><textarea data-eq-field="note" data-eq-who="${w}" data-eq-id="${esc(x.uid)}" rows="2">${esc(x.note)}</textarea></label>
        <div class="eq-full eq-controls">${x.stunt?`<button type="button" class="btn sm" data-eq-act="stunt" data-eq-who="${w}" data-eq-id="${x.uid}">Vincular / reservar façanha</button>`:''}<button type="button" class="btn sm ghost" data-eq-act="delete" data-eq-who="${w}" data-eq-id="${x.uid}">Remover item</button></div>
      </div></details>`;
      return `<div class="fg-equipment" data-eq-owner="${w}"><h3>${w==='pilot'?'Equipamentos pessoais':'Equipamentos da máquina'}</h3>${this.loadHTML(w)}
        ${w==='ms'?`<div class="eq-fields"><label><span>Modelo / compatibilidade</span><select data-eq-model>${options([['custom','Outro modelo'],['zaku','MS-06F Zaku II'],['gelgoog','MS-14A Gelgoog']],s.ms.model)}</select></label><label><span>Conversão de feixes instalada</span><select data-eq-conversion>${options([['no','Não'],['yes','Sim — projeto aprovado']],s.ms.beamConversion?'yes':'no')}</select></label></div><div class="eq-controls"><button type="button" class="btn sm" data-eq-act="kit" data-eq-kit="zaku">Kit Zaku II</button><button type="button" class="btn sm" data-eq-act="kit" data-eq-kit="gelgoog">Kit Gelgoog</button></div><p class="eq-help">Troca somente a carga da máquina. Preserva sistemas, avarias e piloto. Escudo reserva uma façanha se houver vaga.</p>`:''}
        <div class="eq-add"><select data-eq-catalog="${w}" aria-label="Catálogo ${w==='pilot'?'pessoal':'da máquina'}">${options(cat.map(x=>[x.id,`${TYPES[x.kind]} · ${x.n}`]),cat[0].id)}</select><button type="button" class="btn sm" data-eq-act="add" data-eq-who="${w}">Adicionar</button><button type="button" class="btn sm ghost" data-eq-act="blank" data-eq-who="${w}">Criar item</button></div>
        ${this.items(w).map(row).join('')||'<p class="eq-help">Escolha os equipamentos para esta missão.</p>'}
        <button type="button" class="btn sm ghost" data-eq-act="service" data-eq-who="${w}">Reabastecer entre missões</button><p class="eq-help">Exige estoque e infraestrutura. Repõe usos, munição e escudo; não conserta avarias ou itens inutilizados.</p></div>`;
    }
    target(w){return {...this.targets[w],scale:w==='ms'?this.h.state().opp:this.targets.pilot.scale};}
    play(w){
      const s=this.h.state(), target=this.target(w), can=this.h.editable(), shield=s[w].stunts.some(x=>x.id==='escudo'), spent=w==='ms'?!!s.ms.dmg.sh.t:s.pilot.shieldSpent;
      const protection=['ballistic','fragment','physical','beam'].map((t,i)=>`${['balas','fragmentos','físico','feixe'][i]} ${G.armor(s,w,t,G.scale(s,w))}`).join(' · ');
      return `<section class="fg-equipment eq-play" data-eq-owner="${w}"><h3>${w==='pilot'?'Equipamentos pessoais':'Carga da máquina'}</h3>${w==='ms'&&G.KITS[s.ms.model]?`<p class="eq-help">Modelo: ${G.KITS[s.ms.model].name}</p>`:''}${this.loadHTML(w)}<p class="eq-help">Proteção até escala ${G.scale(s,w)}: ${protection}. Confirme região atingida e limitações.</p>
        <details class="eq-target"><summary>Alvo: escala ${target.scale} · distância ${target.range} zona(s)</summary><div class="eq-fields"><label><span>Escala do alvo</span><select data-eq-target="scale" data-eq-who="${w}">${options([[0,'Pessoa'],[1,'Veículo'],[2,'Mobile suit'],[3,'Nave / mobile armor']],target.scale)}</select></label><label><span>Distância em zonas</span><select data-eq-target="range" data-eq-who="${w}">${options([[0,'Mesma zona'],[1,'1 zona'],[2,'2 zonas'],[3,'3 zonas']],target.range)}</select></label></div><p class="eq-help">Mesma zona não garante contato ou linha de tiro. Confirme a posição na ficção.</p></details>
        <div class="eq-cards">${this.items(w).map(x=>{
          const reason=G.blocked(s,w,x), attack=x.kind==='weapon';
          const out=attack && +x.r<target.range;
          return `<article class="eq-card ${reason?'eq-muted':''}"><header><b>${esc(x.n)}</b><strong>${attack?`A:${x.w}`:x.kind==='armor'?`ARM:${x.armor}`:x.load===0?'FIXO':`${x.load} ◇`}</strong></header><small>${TYPES[x.kind]} · ${x.location==='stored'?'Armazenado':`${x.load} carga`} · ${STATES[x.status]}${attack?` · ${esc(x.sk)} · alcance ${x.r} · ameaça ${G.threat(s,w,x)}`:''}</small><p>${esc(x.note)}</p>
            ${x.maxUses!=null?`<div class="eq-uses" aria-label="${x.uses} de ${x.maxUses} usos">${Array.from({length:Math.min(12,x.maxUses)},(_,i)=>`<i class="${i<x.uses?'on':''}"></i>`).join('')}<span>${x.uses}/${x.maxUses}</span></div>`:''}
            ${reason||out?`<p class="eq-alert">${esc(reason||'Fora de alcance')}</p>`:''}
            ${can?`<div class="eq-controls">${['weapon','tool','supply'].includes(x.kind)?`<button type="button" class="btn sm" data-eq-act="use" data-eq-who="${w}" data-eq-id="${x.uid}" ${reason||out?'disabled':''}>${attack?'Atacar':x.maxUses!=null?'Usar e rolar':x.action}</button>`:''}
            ${x.kind==='ammo'?`<select data-eq-reload-target="${x.uid}" aria-label="Arma para recarregar">${options(s[w].weapons.filter(t=>t.ammo&&t.ammo===x.ammo&&t.dry&&t.location==='carried').map(t=>[t.uid,t.n]),'')}</select><button type="button" class="btn sm" data-eq-act="reload" data-eq-who="${w}" data-eq-id="${x.uid}" ${reason?'disabled':''}>Recarregar</button>`:''}
            ${attack&&x.ammo&&!x.dry?`<button type="button" class="btn sm ghost" data-eq-act="dry" data-eq-who="${w}" data-eq-id="${x.uid}">Marcar esgotada</button>`:''}
            ${x.kind==='shield'?`<button type="button" class="btn sm" data-eq-act="shield" data-eq-who="${w}" data-eq-id="${x.uid}" ${reason||!shield||spent?'disabled':''}>${spent?'Escudo destruído':shield?'Interceptar 2 tensões':'Exige façanha Escudo'}</button>`:''}</div>`:''}</article>`;
        }).join('')||'<p class="eq-help">Sem equipamentos registrados.</p>'}</div>
        <p class="eq-help">Armadura: maior proteção aplicável, sem somar peças. As limitações e os benefícios condicionais de façanhas são adjudicados pela mesa.</p></section>`;
    }
    render(){
      G.migrate(this.h.state());
      for(const w of ['pilot','ms']) {
        for(const el of this.root.querySelectorAll(`[data-eq-editor="${w}"]`)) el.innerHTML=this.h.editable()?this.editor(w):'';
        for(const el of this.root.querySelectorAll(`[data-eq-play="${w}"]`)) el.innerHTML=this.play(w);
      }
      if(!this.root.querySelector('[data-eq-result]')) {
        const box=document.createElement('aside');box.className='fg-equipment eq-result';box.dataset.eqResult='';box.hidden=true;
        box.innerHTML='<button type="button" class="btn sm ghost" data-eq-act="close-result" aria-label="Fechar resultado">Fechar</button><h3 data-eq-title></h3><p data-eq-total></p><div class="eq-fields"><label><span>Defesa rolada, sem escala</span><input type="number" data-eq-defense value="0" min="-99" max="99"></label><label><span>Armadura aplicável do alvo</span><input type="number" data-eq-arm value="0" min="0" max="2"></label></div><output data-eq-output></output><p class="eq-help">Informe a defesa para calcular. Não altera estresse do alvo. Armadura depende do tipo de ataque, escala e região protegida.</p>';
        (this.root===document?document.body:this.root).appendChild(box);
      }
      this.paintResult();
    }
    actions(w){
      const s=this.h.state();
      return s[w].weapons.map(x=>({kind:'Atacar',n:x.n,w:x.w,gear:x.uid,who:w,nt:x.sk==='Vontade',warn:!!G.blocked(s,w,x),parts:[{l:x.sk,v:this.h.rating(x.sk)},...(w==='ms'?[{l:x.sk==='Lutar'?'Combate':'Mira',v:this.h.eff(x.sk==='Lutar'?'comb':'mira')}]:[])],note:x.note}));
    }
    async use(w,id){
      if(!this.h.editable()||this.busy) return;
      const s=this.h.state(),x=G.get(s,w,id);if(!x)return;
      const reason=G.blocked(s,w,x);if(reason)return this.h.notify(reason);
      const target=this.target(w), attack=x.kind==='weapon', d=G.threat(s,w,x)-target.scale;
      if(attack && +x.r<target.range)return this.h.notify('Fora de alcance.');
      // Small arms cannot damage an intact MS hull. Target vulnerable parts through a narrated advantage.
      if(attack && target.scale>=2 && G.threat(s,w,x)===0)return this.h.notify('Esta arma pessoal não danifica casco intacto de MS. Use uma vantagem para sabotagem ou uma arma anti-MS.');
      const parts=[{l:x.sk,v:this.h.rating(x.sk)}];
      if(attack&&w==='ms') parts.push({l:x.sk==='Lutar'?'Combate':'Mira',v:this.h.eff(x.sk==='Lutar'?'comb':'mira')});
      if(attack&&d>0)parts.push({l:'Escala de ameaça',v:d});
      const note=attack?`${x.note} Arma:${x.w}; alcance ${x.r}; ${x.damage}. Ao empatar/superar a defesa: margem + ${x.w+Math.max(0,d)*2} − Armadura aplicável.${d<0?` O alvo soma +${-d} de escala à defesa.`:''}`:`${x.action}: ${x.note} Benefícios condicionais e dificuldade são definidos pela mesa.`;
      this.busy=true;
      try {
        const total=await this.h.roll(x.n,parts,note);
        const current=G.get(this.h.state(),w,id);
        if(current?.uses!=null)current.uses=Math.max(0,current.uses-1);
        this.result=attack?{n:x.n,total,w:x.w,d}:null;
        this.refresh();
        const box=this.root.querySelector('[data-eq-result]');
        if(attack){box.querySelector('[data-eq-defense]').value='0';box.querySelector('[data-eq-arm]').value='0';this.paintResult();}
      } catch(e){this.h.notify('A rolagem não foi concluída; nenhum uso foi gasto. '+e.message);}
      finally {this.busy=false;}
    }
    paintResult(total){
      const box=this.root.querySelector('[data-eq-result]');if(!box)return;
      box.hidden=!this.result;if(!this.result)return;
      if(Number.isFinite(total))this.result.total=total;
      const r=this.result,out=G.resolve(r.total,num(box.querySelector('[data-eq-defense]').value,-99,99),r.w,num(box.querySelector('[data-eq-arm]').value,0,2),r.d);
      box.querySelector('[data-eq-title]').textContent=r.n;
      box.querySelector('[data-eq-total]').textContent=`Ataque ${r.total} · Arma:${r.w} · bônus de dano da escala ${Math.max(0,r.d)*2}`;
      box.querySelector('[data-eq-output]').textContent=`${out.text} · defesa efetiva ${out.defense}`;
    }
    resetResult(){this.result=null;this.paintResult();}
    confirm(btn,label,fn){
      if(btn.dataset.eqArmed){fn();return;}
      const old=btn.textContent;btn.dataset.eqArmed='1';btn.textContent=label;
      setTimeout(()=>{if(btn.isConnected){delete btn.dataset.eqArmed;btn.textContent=old;}},5000);
    }
    click(e){
      const b=e.target.closest('[data-eq-act]');if(!b||!this.root.contains(b))return;
      e.preventDefault(); const a=b.dataset.eqAct,w=b.dataset.eqWho,s=this.h.state(),id=b.dataset.eqId,x=w&&G.get(s,w,id);
      if(a==='close-result'){this.resetResult();return;}
      if(!this.h.editable())return;
      if(a==='use'){this.use(w,id);return;}
      if(['add','blank','delete','kit','stunt','service'].includes(a)&&this.h.mode()!=='edit')return;
      if(a==='kit'){this.confirm(b,'Confirmar troca de carga',()=>{try{G.applyKit(s,b.dataset.eqKit);this.refresh();this.h.notify('Kit aplicado. Confira carga, compatibilidade e vagas de façanha.');}catch(err){this.h.notify(err.message);}});return;}
      if(a==='service'){this.confirm(b,'Confirmar estoque e manutenção',()=>{for(const i of this.items(w)){if(i.maxUses!=null)i.uses=i.maxUses;i.dry=false;}s[w].shieldSpent=false;if(w==='ms')s.ms.dmg.sh={t:'',loc:''};this.refresh();});return;}
      if(a==='add'){const pick=this.root.querySelector(`[data-eq-catalog="${w}"]`).value;G.add(s,w,G.CATALOG[w].find(i=>i.id===pick));}
      if(a==='blank')G.add(s,w,{n:'Novo equipamento',kind:'tool',load:1,note:''});
      if(a==='delete'&&x){s[w].weapons=s[w].weapons.filter(i=>i.uid!==id);s[w].equipment=s[w].equipment.filter(i=>i.uid!==id);}
      if(a==='stunt'&&x){
        if(s[w].stunts.some(t=>t.id===x.stunt))return this.h.notify('A façanha já ocupa uma vaga.');
        const limit=w==='pilot'?5:s.ms.cls==='proto'?3:2;
        if(s[w].stunts.length>=limit)return this.h.notify('Sem vaga disponível. Ajuste as façanhas antes de vincular.');
        if(!G.STUNTS[x.stunt])return this.h.notify('Crie a façanha no criador e selecione seu nome neste item.');
        s[w].stunts.push(clone(G.STUNTS[x.stunt]));
      }
      if(a==='dry'&&x)x.dry=true;
      if(a==='reload'&&x){
        const select=b.closest('.eq-card').querySelector('[data-eq-reload-target]'),t=G.get(s,w,select?.value);
        if(!t||!t.dry||!x.ammo||t.ammo!==x.ammo||!G.active(x))return this.h.notify('Sem arma esgotada compatível ou reserva disponível.');
        t.dry=false;if(x.uses!=null)x.uses--;this.h.notify('Arma recarregada. Sob fogo, isso gasta sua ação.');
      }
      if(a==='shield'&&x){
        if(!G.active(x)||!s[w].stunts.some(t=>t.id==='escudo'))return;
        if(w==='ms'){if(s.ms.dmg.sh.t)return;s.ms.dmg.sh.t='Escudo destruído';}else{if(s.pilot.shieldSpent)return;s.pilot.shieldSpent=true;}
        this.h.notify('Escudo destruído: absorva 2 tensões se ele podia interceptar o ataque.');
      }
      this.refresh();
    }
    change(e){
      const el=e.target,s=this.h.state();
      if(el.dataset.eqTarget){const w=el.dataset.eqWho,k=el.dataset.eqTarget;if(w==='ms'&&k==='scale'){s.opp=num(el.value,0,3);}else this.targets[w][k]=num(el.value,0,3);this.h.render();this.render();if(this.h.editable())this.h.save();return;}
      if(!this.h.editable()||this.h.mode()!=='edit')return;
      if(el.hasAttribute('data-eq-model')){s.ms.model=el.value;this.refresh();return;}
      if(el.hasAttribute('data-eq-conversion')){s.ms.beamConversion=el.value==='yes';this.refresh();return;}
      const key=el.dataset.eqField,w=el.dataset.eqWho,x=w&&G.get(s,w,el.dataset.eqId);if(!key||!x)return;
      const allowed=['n','kind','load','location','status','sk','action','w','r','damage','threat','compat','armor','protection','maxUses','uses','ammo','stunt','note'];
      if(!allowed.includes(key))return;
      x[key]=['load','w','armor','maxUses','uses','threat'].includes(key)?(el.value===''?null:+el.value):el.value;
      Object.assign(x,G.normalizeItem(x,x.kind,w));
      s[w].weapons=this.items(w).filter(i=>i.kind==='weapon');
      s[w].equipment=[...s[w].equipment.filter(i=>i.uid!==x.uid),...(x.kind!=='weapon'?[x]:[])];
      // Move changed categories without duplicating an entry.
      const seen=new Set();s[w].weapons=s[w].weapons.filter(i=>!seen.has(i.uid)&&seen.add(i.uid));
      this.refresh();
      const detail=this.root.querySelector(`[data-eq-editor="${w}"] [data-eq-id="${x.uid}"]`)?.closest('details');if(detail)detail.open=true;
    }
  }
  G.UI=EquipmentUI;
})();
