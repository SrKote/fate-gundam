/* Shared equipment rules and interface. Also bundled into the standalone sheet. */
(() => {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (v, lo = 0, hi = 99) => Math.min(hi, Math.max(lo, Number.isFinite(+v) ? +v : lo));
  const uid = () => globalThis.crypto?.randomUUID?.() || `gear-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const weapon = (id,n,w,r,load,note,extra={}) => ({id,n,kind:'weapon',sk:'Atirar',w,r:String(r),load,note,damage:'ballistic',action:'Atacar',...extra});
  const tool = (id,n,sk,note,extra={}) => ({id,n,kind:'tool',sk,load:1,note,action:'Criar vantagem',...extra});
  const CATALOG = {
    pilot:[
      weapon('pistol','Pistola',1,1,1,'Compacta. Requer munição.',{ammo:'pistol'}),
      weapon('knife','Faca de combate',1,0,1,'Contato; pequena e útil em espaços apertados.',{sk:'Lutar',damage:'physical'}),
      weapon('smg','Submetralhadora',1,1,2,'Pode criar vantagem de supressão; não concede ataque extra.',{ammo:'smg'}),
      weapon('rifle','Rifle de assalto',2,2,2,'Ostensivo e barulhento; permite criar vantagem de supressão.',{ammo:'rifle'}),
      weapon('shotgun','Espingarda',2,0,2,'Mesma zona. Não atinge vários alvos automaticamente.',{ammo:'shotgun'}),
      weapon('sniper','Rifle de precisão',2,3,2,'Exige linha de tiro; preparar a posição cria vantagem.',{ammo:'sniper'}),
      weapon('grenade','Granadas de fragmentação (2)',2,1,1,'Um alvo ou vantagem na área; terceiros podem estar em risco.',{damage:'fragment',maxUses:2,uses:2}),
      weapon('antims','Lançador antiblindado anti-MS',2,2,3,'Munição especializada; ameaça escala 2. Operador continua escala 0. Um foguete incluído.',{threat:2,maxUses:1,uses:1,damage:'physical'}),
      tool('smoke','Granadas de fumaça (2)','Atirar','Cria cortina de fumaça; não causa dano.',{maxUses:2,uses:2}),
      tool('mines','Minas (2)','Ofícios','Defina gatilho, alvo e potência ao instalar. Furtividade para ocultar; não causam dano automático.',{maxUses:2,uses:2}),
      tool('medkit','Kit médico','Conhecimentos','Estabiliza e inicia recuperação. Não apaga consequências.',{action:'Superar'}),
      tool('tools','Ferramentas de campo','Ofícios','Permitem reparos acessíveis; não substituem oficina.',{action:'Superar'}),
      tool('climb','Equipamento de escalada','Atletismo','Permite ancoragens e rotas seguras.'),
      tool('sensor','Binóculos / sensor portátil','Percepção','Permite observação distante; respeite visibilidade e interferência.'),
      tool('terminal','Terminal eletrônico','Ofícios','Diagnóstico e circuitos. Use Roubo para burlar segurança.'),
      tool('radio','Rádio','Comunicação','Comunicação normal sem rolar; teste apenas com oposição.',{load:0}),
      tool('laser','Comunicador laser','Ofícios','Requer linha de visada e alinhamento; alternativa ao rádio sob Minovsky.'),
      tool('suit','Traje de piloto','Vigor','Proteção ambiental compatível, inclusive vácuo se pressurizado. Não é armadura.',{load:0}),
      {id:'vest',n:'Colete balístico',kind:'armor',load:1,armor:1,protection:'ballistic',note:'Balas e fragmentos de escala pessoal; somente regiões protegidas.'},
      {id:'shield',n:'Escudo portátil',kind:'shield',load:1,stunt:'escudo',note:'Absorção de 2 exige uma façanha Escudo. Sem ela, só permite criar vantagem.'},
      {id:'ammo-rifle',n:'Reserva de munição — rifle',kind:'ammo',load:1,ammo:'rifle',maxUses:1,uses:1,note:'Reabastece um rifle de assalto esgotado compatível.'},
      tool('transport','Transporte / caminhão','Pilotagem','Leva passageiros e carga armazenada. Rolar apenas sob risco.',{load:0,location:'stored',action:'Superar'})
    ],
    ms:[
      weapon('zaku-mg','Metralhadora de Zaku',1,2,2,'Supressão por criar vantagem; não soma dano de rajadas.',{ammo:'zaku-mg'}),
      weapon('zaku-bazooka','Zaku Bazooka',2,2,2,'Munição volumosa. Pode ameaçar blindados ou demolir obstáculos.',{ammo:'zaku-bazooka',damage:'physical'}),
      weapon('heat-hawk','Heat Hawk',1,0,1,'Machado térmico; exige contato.',{sk:'Lutar',damage:'physical'}),
      weapon('beam-rifle','Beam rifle',2,2,2,'Requer alimentação compatível. Recarga em infraestrutura adequada.',{damage:'beam',ammo:'beam',compat:'beam'}),
      weapon('naginata','Beam naginata',2,0,1,'Arma de contato. Duas lâminas não concedem dois ataques.',{sk:'Lutar',damage:'beam',compat:'beam'}),
      {id:'shoulder-shield',n:'Escudo fixo do ombro',kind:'shield',load:0,stunt:'escudo',note:'Integrado; absorção exige a façanha Escudo e posição para interceptar.'},
      {id:'gelgoog-shield',n:'Escudo de Gelgoog',kind:'shield',load:1,stunt:'escudo',note:'Portátil; respeite mãos e suportes. Absorção exige a façanha Escudo.'},
      {id:'zaku-ammo',n:'Reserva de munição — metralhadora de Zaku',kind:'ammo',load:1,ammo:'zaku-mg',maxUses:1,uses:1,note:'Uma reposição da metralhadora; não serve para a bazuca.'},
      {id:'bazooka-ammo',n:'Reserva de munição — Zaku Bazooka',kind:'ammo',load:1,ammo:'zaku-bazooka',maxUses:1,uses:1,note:'Uma reposição da bazuca.'},
      tool('recon','Kit de reconhecimento','Percepção','Permite observação e registro. Não concede bônus automático de Sensores.'),
      tool('repair','Kit de reparo de campo','Ofícios','Remendo +4: funcionamento até o fim da cena. Não apaga avaria.',{action:'Superar'}),
      {id:'plating',n:'Blindagem reforçada balística',kind:'armor',load:1,armor:1,protection:'ballistic',stunt:'gear-plating',note:'Armadura:1 contra balas/fragmentos; exige uma façanha de sistema. Feixes passam.'},
      tool('thruster','Propulsores modificados','Pilotagem','+2 para superar em perseguições e fugas em espaço aberto; exige a façanha correspondente.',{load:0,stunt:'prop',action:'Superar'})
    ]
  };
  const KITS = {zaku:{name:'MS-06F Zaku II',ids:['zaku-mg','zaku-bazooka','heat-hawk','zaku-ammo','shoulder-shield']},gelgoog:{name:'MS-14A Gelgoog',ids:['beam-rifle','naginata','gelgoog-shield','recon','repair']}};
  const STUNTS = {
    escudo:{id:'escudo',n:'Escudo',d:'Uma vaga extra absorve 2 tensões de um ataque físico interceptável. Usou, quebrou; exige reparo ou substituição entre cenas.'},
    'gear-plating':{id:'gear-plating',n:'Blindagem reforçada balística',d:'Com a blindagem equipada, Armadura:1 contra balas e fragmentos de escala igual ou inferior. Feixes passam. Não acumula com outras armaduras.'},
    prop:{id:'prop',n:'Propulsores de alto desempenho',d:'+2 em Pilotagem para superar em perseguições e fugas em espaço aberto.'}
  };
  function normalizeItem(raw,kind='tool',who='pilot') {
    const x = {...raw};
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(x.uid||'')) x.uid=uid(); x.kind = ['weapon','tool','armor','shield','ammo','supply'].includes(x.kind)?x.kind:kind;
    x.n = String(x.n ?? 'Equipamento'); x.note = String(x.note ?? '');
    x.load = num(x.load ?? (x.kind==='weapon'? (x.sk==='Lutar'?1:2):1),0,8);
    x.w = num(x.w,0,2); x.r = String(num(x.r,0,3)); x.sk ||= x.kind==='weapon'?'Atirar':'Ofícios';
    x.action = ['Atacar','Criar vantagem','Superar'].includes(x.action)?x.action:x.kind==='weapon'?'Atacar':'Criar vantagem';
    x.location = x.location==='stored'?'stored':'carried';
    x.status = ['ready','damaged','broken'].includes(x.status)?x.status:'ready';
    x.dry = !!x.dry;
    x.threat = x.threat==null || x.threat===''?null:num(x.threat,0,3);
    x.damage ||= x.sk==='Lutar'?'physical':'ballistic';
    x.armor = num(x.armor,0,2); x.protection ||= 'ballistic';
    x.maxUses = x.maxUses==null?null:num(x.maxUses,1,99);
    x.uses = x.maxUses==null?null:num(x.uses??x.maxUses,0,x.maxUses);
    return x;
  }
  function migrate(s) {
    for(const who of ['pilot','ms']) {
      const p=s[who]; if(!p) continue;
      p.weapons = (Array.isArray(p.weapons)?p.weapons:[]).filter(x=>x&&typeof x==='object').map(x=>normalizeItem(x,'weapon',who));
      p.equipment = (Array.isArray(p.equipment)?p.equipment:[]).filter(x=>x&&typeof x==='object').map(x=>normalizeItem(x,'tool',who));
      p.shieldSpent = !!p.shieldSpent;
      p.stunts = (Array.isArray(p.stunts)?p.stunts:[]).filter(x=>x&&typeof x==='object');
      for(const stunt of p.stunts) if(!stunt.id) stunt.id=uid();
    }
    s.equipmentVersion = 1;
    s.ms.model ||= 'custom';
    return s;
  }
  const all = (s,w) => [...(s[w].weapons||[]),...(s[w].equipment||[])];
  const get = (s,w,id) => all(s,w).find(x=>x.uid===id);
  const scale = (s,w) => w==='pilot'?0:({ma:3,nave:3}[s.ms.cls]||2);
  const threat = (s,w,x) => x.threat??scale(s,w);
  const load = (s,w) => all(s,w).filter(x=>x.location==='carried').reduce((v,x)=>v+x.load,0);
  const active = x => x.location==='carried' && x.status!=='broken' && !x.dry && x.uses!==0;
  function blocked(s,w,x) {
    if(!active(x)) return x.location==='stored'?'Armazenado':x.status==='broken'?'Inutilizado':x.dry?'Sem munição / energia':'Sem usos';
    if(w==='ms' && s.ms.model==='zaku' && x.compat==='beam' && !s.ms.beamConversion) return 'Zaku requer conversão para armas de feixe';
    if(w==='ms' && x.kind==='weapon' && x.sk==='Vontade' && (!s.pilot.aspects.some(a=>a.nt)||!s.ms.stunts.some(a=>a.id==='psy'))) return 'Requer Newtype e Psicomunicador';
    if(x.stunt && !s[w].stunts.some(t=>t.id===x.stunt) && x.kind!=='shield') return 'Requer façanha vinculada';
    return '';
  }
  function add(s,w,source) {
    const x=normalizeItem({...clone(source),uid:uid()},source.kind,w);
    s[w][x.kind==='weapon'?'weapons':'equipment'].push(x); return x;
  }
  function applyKit(s,key) {
    const kit=KITS[key]; if(!kit) throw Error('Kit inexistente');
    if(['ma','nave'].includes(s.ms.cls)) throw Error('Escolha uma classe de mobile suit antes de aplicar este kit.');
    s.ms.weapons=[]; s.ms.equipment=[]; s.ms.model=key; s.ms.beamConversion=false;
    if(!s.ms.name.trim()) s.ms.name=kit.name;
    for(const id of kit.ids) add(s,'ms',CATALOG.ms.find(x=>x.id===id));
    // Never reset stress, shield state, consequences, pilot, aspects, or custom stunts.
    const cap=s.ms.cls==='proto'?3:2;
    if(!s.ms.stunts.some(x=>x.id==='escudo') && s.ms.stunts.length<cap) s.ms.stunts.push(clone(STUNTS.escudo));
  }
  function armor(s,w,damage,incomingScale) {
    if(incomingScale>scale(s,w)) return 0;
    const compatible = p => p==='all'||p===damage||(p==='ballistic'&&damage==='fragment')||(p==='physical'&&damage!=='beam');
    const values=all(s,w).filter(x=>x.kind==='armor' && active(x) && !blocked(s,w,x) && compatible(x.protection)).map(x=>x.armor);
    if(w==='ms' && s.ms.stunts.some(x=>x.id==='luna') && damage!=='beam') values.push(1);
    return Math.max(0,...values);
  }
  function resolve(total,defense,weaponValue,armorValue,scaleDifference=0) {
    const d=num(defense,-99,99)+Math.max(0,-scaleDifference), margin=total-d;
    if(margin<0) return {text:'Errou',stress:0,margin,defense:d};
    const stress=Math.max(0,margin+weaponValue+Math.max(0,scaleDifference)*2-armorValue);
    return {text:stress?`${stress} tensões`:margin===0?'Impulso; sem estresse':'Sem estresse',stress,margin,defense:d};
  }
  globalThis.FGEquipment={CATALOG,KITS,STUNTS,clone,esc,num,normalizeItem,migrate,all,get,scale,threat,load,active,blocked,add,applyKit,armor,resolve};
})();
