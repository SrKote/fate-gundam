/**
 * Fate Gundam — ficha de piloto e mobile suit para Fate Core no Foundry VTT.
 * A ficha guarda tudo num flag do ator (flags.fate-gundam.json) e funciona com qualquer sistema.
 */
const MOD = "fate-gundam";
const ASSET = f => `modules/${MOD}/assets/${f}`;
const IMG = { pilot: ASSET("piloto.webp"), ms: ASSET("ms.webp") };
const DEFAULT_ACTOR_IMG = ["icons/svg/mystery-man.svg", ""];
const DIE = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="2.5" width="15" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 6.2v7.6M6.2 10h7.6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>';

/* ---------------- regras ---------------- */
const SKILLS = ["Atirar","Atletismo","Comunicação","Conhecimentos","Contatos","Empatia","Enganar","Furtividade","Investigação","Lutar","Ofícios","Percepção","Pilotagem","Provocar","Recursos","Roubo","Vigor","Vontade"];
const TIERS = [{v:4,n:"Ótimo"},{v:3,n:"Bom"},{v:2,n:"Razoável"},{v:1,n:"Regular"}];
const LAD = {"8":"Lendário","7":"Épico","6":"Fantástico","5":"Excepcional","4":"Ótimo","3":"Bom","2":"Razoável","1":"Regular","0":"Medíocre","-1":"Ruim","-2":"Terrível"};
const ladder = n => n > 8 ? "Além de Lendário" : n < -2 ? "Abaixo de Terrível" : LAD[String(n)];
const sgn = n => (n < 0 ? "−" : "+") + Math.abs(n);
const PTS = 5, MAX = 2;
const CLASSES = {
  massa: {n:"Produção em massa",ex:"Zaku II, GM",scale:2,st:2,perk:"Peça sobrando: uma vez por sessão, entre cenas, apague uma Avaria suave sem rolar Ofícios."},
  custom: {n:"MS de ás",ex:"Zaku II de Char",scale:2,st:2,perk:"Pintura conhecida: no começo de cada conflito, o aspecto Marca vem com uma invocação grátis."},
  proto: {n:"Protótipo",ex:"RX-78-2 Gundam",scale:2,st:3,perk:"Uma façanha de sistema a mais. Em troca, o mestre começa cada sessão com uma invocação grátis do Defeito."},
  ma: {n:"Mobile armor",ex:"Elmeth, Big Zam",scale:3,st:2,lock:{comb:0},perk:"Escala 3. Combate fica travado em +0, e quem luta corpo a corpo contra ela ganha +2."},
  nave: {n:"Nave de guerra",ex:"White Base, Musai",scale:3,st:2,lock:{comb:0},perk:"Escala 3, usada pela tripulação da ponte. Combate fica travado em +0."}
};
const SYS = [
  {k:"mob",n:"Mobilidade",h:"Soma em Pilotagem: defender, mover, perseguir"},
  {k:"mira",n:"Mira",h:"Soma em Atirar e nas armas psicomu"},
  {k:"comb",n:"Combate",h:"Soma em Lutar: sabre, machado, corpo a corpo"},
  {k:"sens",n:"Sensores",h:"Soma em Percepção e na ordem de turno"},
  {k:"estr",n:"Estrutura",h:"Não soma; define as caixas de estresse"}
];
const SYSN = {mob:"Mobilidade",mira:"Mira",comb:"Combate",sens:"Sensores",estr:"Estrutura"};
// Corpo de avarias de cada tipo de máquina: [local, x%, y%, sistema que zera]
const BODIES = {
  ms: {img:ASSET("ms.webp"), kind:"Mobile suit", kana:"モビルスーツ", zones:[["Cabeça",50,6,"sens"],["Propulsores",21,9,"mob"],["Tronco",50,31,null],["Braço D",13,43,"mira"],["Braço E",87,26,"comb"],["Pernas",50,70,"mob"]]},
  ma: {img:ASSET("ma.webp"), kind:"Mobile armor", kana:"モビルアーマー", wide:true, zones:[["Sensor",40,61,"sens"],["Casco",53,36,null],["Canhões",16,50,"mira"],["Propulsores",87,21,"mob"]]},
  nave: {img:ASSET("nave.webp"), kind:"Nave de guerra", kana:"戦艦", wide:true, zones:[["Ponte",55,35,"sens"],["Torres",72,47,"mira"],["Casco",45,71,null],["Hangar",21,61,null],["Motores",89,69,"mob"]]}
};
const bodyKey = c => c === "ma" ? "ma" : c === "nave" ? "nave" : "ms";
const DSLOTS = [["l",2,"Suave"],["m",4,"Moderada"],["s",6,"Severa"],["sh",2,"Escudo"]];
const P_ASP = ["Conceito","Problema","Aspecto","Aspecto","Aspecto"];
const P_ASP_PH = ["Quem você é, em uma linha","O que complica sua vida","","",""];
const M_ASP = ["Conceito","Defeito","Marca"];
const M_ASP_PH = ["O que ela é e para quem foi feita","O que trai a máquina na hora errada","História, pintura, quem pilotou antes"];
const RANGES = [["0","Mesma zona"],["1","1 zona"],["2","2 zonas"],["3","3+ zonas"]];
const WSK = ["Atirar","Lutar","Vontade"];
const SCALES = [[0,"Pessoa"],[1,"Veículo"],[2,"MS"],[3,"MA / nave"]];
const P_ST = [
  {id:"as",n:"Ás em desvantagem",d:"+2 em Pilotagem para defender quando houver mais inimigos que aliados na sua zona."},
  {id:"cab",n:"Nascido na cabine",d:"+2 em Pilotagem para superar obstáculos dentro de um mobile suit."},
  {id:"longe",n:"Tiro de longe",d:"+2 em Atirar para criar vantagem contra alvos a duas zonas ou mais."},
  {id:"mec",n:"Mãos de mecânico",d:"Seu remendo na cabine é contra Razoável (+2) em vez de Ótimo (+4)."},
  {id:"g",n:"Corpo de piloto de teste",d:"+2 em Vigor nas manobras extremas."},
  {id:"vet",n:"Ouvido de veterano",d:"Sob partículas Minovsky, seus Sensores somam até duas zonas de distância."},
  {id:"flash",nt:true,n:"Flash Newtype",d:"Uma vez por conflito, defenda com Empatia + Mobilidade em vez de Pilotagem + Mobilidade. Com sucesso com estilo, o mestre revela a próxima ação do atacante."},
  {id:"press",nt:true,n:"Pressão",d:"Ataque mental com Vontade contra um piloto na sua zona ou na adjacente. O alvo defende com Vontade e o dano vai para o estresse mental."},
  {id:"bits",nt:true,psy:true,n:"Controle de bits",d:"Ataque com Vontade + Mira usando armas psicomu e divida o resultado entre alvos a até duas zonas. Requer Psicomunicador na máquina."},
  {id:"res",nt:true,n:"Ressonância",d:"Use Empatia para notar pessoas em qualquer ponto da cena, através de paredes e de partículas Minovsky."}
];
const M_ST = [
  {id:"escudo",n:"Escudo",d:"Uma Avaria suave extra chamada Escudo. Usou, quebrou; volta na próxima manutenção."},
  {id:"psy",n:"Psicomunicador",d:"Permite armas psicomu (bits, funnels). Sem piloto Newtype, elas não disparam."},
  {id:"core",n:"Core Block",d:"Quando a máquina é tirada de ação, o piloto escapa no núcleo ejetável sem sofrer as tensões que sobraram do ataque."},
  {id:"luna",n:"Blindagem de luna titânio",d:"Armadura:1 contra armas físicas (balas, bazucas, machados). Feixes passam normalmente."},
  {id:"prop",n:"Propulsores de alto desempenho",d:"+2 em Pilotagem para superar em perseguições e fugas em espaço aberto."},
  {id:"mono",n:"Mono-olho de longo alcance",d:"+2 em Percepção para detectar alvos a duas zonas ou mais."},
  {id:"amb",n:"Feito para o ambiente",d:"Escolha terra, espaço ou água. Nesse ambiente, ignore uma vez por cena um aspecto de cena que atrapalharia o movimento."}
];
const lib = (L, id) => Object.assign({}, L.find(x => x.id === id));
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function blank() {
  const dm = () => ({t:"",loc:""});
  return {v:2,faction:"fed",cockpit:false,show:"pilot",opp:2,
    pilot:{name:"",desc:"",fp:3,trade:false,aspects:[0,1,2,3,4].map(() => ({t:"",nt:false})),
      skills:{"4":[""],"3":["",""],"2":["","",""],"1":["","","",""]},stunts:[],
      stress:{f:[0,0,0,0],m:[0,0,0,0]},cons:{s:"",m:"",sv:"",x:""}},
    ms:{name:"",cls:"massa",img:"",aspects:["","",""],sys:{mob:0,mira:0,comb:0,sens:0,estr:0},stunts:[],weapons:[],
      stress:[0,0,0,0],dmg:{l:dm(),m:dm(),s:dm(),sh:dm()}}};
}
function example() {
  const s = blank(); s.faction = "zeon";
  const p = s.pilot;
  p.name = "Lalah Sune";
  p.desc = "Jovem garota de origem indiana com poderes newtype incrivelmente potentes.";
  ['Newtype empática que pilota o terrível MAN-08 Elmeth. Minha alcunha é "o Fantasma de Solomon".',
   "Estou dividida entre meu amor por Char Aznable e por Amuro Ray.",
   "Sou um newtype!",
   "Minha vida é inteiramente dedicada àqueles que amo.",
   'Minha "voz" percorre o espaço e minha "visão" transcende o tempo.'].forEach((t, i) => p.aspects[i].t = t);
  p.aspects[2].nt = true;
  p.skills = {"4":["Empatia"],"3":["Pilotagem","Vontade"],"2":["Comunicação","Percepção","Conhecimentos"],"1":["Furtividade","Investigação","Ofícios","Contatos"]};
  p.stunts = [lib(P_ST,"flash"), lib(P_ST,"bits"), lib(P_ST,"res")];
  const m = s.ms;
  m.name = "MAN-08 Elmeth"; m.cls = "ma";
  m.aspects = ["Mobile armor de bits feita para uma Newtype","Enorme e lenta para virar de perto","Ninguém vê de onde vem o tiro"];
  m.sys = {mob:1,mira:2,comb:0,sens:1,estr:1};
  m.stunts = [lib(M_ST,"psy"), lib(M_ST,"prop")];
  m.weapons = [{n:"Bits",sk:"Vontade",w:2,r:"2",note:"Psicomu. Atacam de ângulos que o radar não acompanha."},
               {n:"Canhões de mega partículas",sk:"Atirar",w:2,r:"2",note:"Disparo frontal; a Elmeth precisa estar virada para o alvo."}];
  return s;
}
function sysMax(k, c) { const C = CLASSES[c]; return C.lock && k in C.lock ? C.lock[k] : MAX; }
function normalize(o) {
  const b = blank(); if (!o || typeof o !== "object") return b;
  const s = Object.assign(b, o);
  s.pilot = Object.assign(blank().pilot, o.pilot || {});
  s.ms = Object.assign(blank().ms, o.ms || {});
  s.pilot.skills = Object.assign(blank().pilot.skills, s.pilot.skills || {});
  s.pilot.stress = Object.assign(blank().pilot.stress, s.pilot.stress || {});
  s.pilot.cons = Object.assign(blank().pilot.cons, s.pilot.cons || {});
  s.ms.sys = Object.assign(blank().ms.sys, s.ms.sys || {});
  const od = (o.ms && o.ms.dmg) || {}; s.ms.dmg = blank().ms.dmg;
  ["l","m","s","sh"].forEach(k => { if (od[k]) s.ms.dmg[k] = Object.assign({t:"",loc:""}, od[k]); });
  if (!Array.isArray(s.pilot.aspects) || s.pilot.aspects.length !== 5) s.pilot.aspects = blank().pilot.aspects;
  if (!Array.isArray(s.ms.aspects) || s.ms.aspects.length !== 3) s.ms.aspects = ["","",""];
  if (!Array.isArray(s.pilot.stunts)) s.pilot.stunts = [];
  if (!Array.isArray(s.ms.stunts)) s.ms.stunts = [];
  if (!Array.isArray(s.ms.weapons)) s.ms.weapons = [];
  if (!Array.isArray(s.ms.stress)) s.ms.stress = [0,0,0,0];
  if (!CLASSES[s.ms.cls]) s.ms.cls = "massa";
  if (s.faction !== "zeon") s.faction = "fed";
  if (![0,1,2,3].includes(s.opp)) s.opp = 2;
  Object.keys(s.ms.sys).forEach(k => s.ms.sys[k] = Math.max(0, Math.min(sysMax(k, s.ms.cls), +s.ms.sys[k] || 0)));
  s.ms.weapons.forEach(w => w.w = Math.max(0, Math.min(2, +w.w || 0)));
  s.v = 2;
  return s;
}

/* ---------------- HTML ---------------- */
function template() {
  return `<div class="fg">
  <header class="deck">
    <div class="brand">
      <h1 class="title">FATE <span class="g">GUNDAM</span></h1>
      <p class="sub">Piloto e mobile suit para Fate Core <span class="kana">パイロット・モビルスーツ</span></p>
    </div>
    <div class="tools">
      <div class="seg" role="group" aria-label="Facção">
        <button type="button" data-fac="fed" aria-pressed="true">Federação</button>
        <button type="button" data-fac="zeon" aria-pressed="false">Zeon</button>
      </div>
      <div class="seg" role="group" aria-label="Vista">
        <button type="button" data-view="ficha" aria-pressed="true">Ficha</button>
        <button type="button" data-view="manual" aria-pressed="false">Manual</button>
      </div>
    </div>
    <div class="rail" aria-hidden="true"></div>
  </header>

  <section data-id="v-ficha">
    <div class="link">
      <div class="link-side"><small>Piloto</small><b data-id="lk-pilot">—</b></div>
      <button type="button" class="hatch" data-id="cockpit" aria-pressed="false" aria-label="Alternar modo de combate: piloto na cabine">
        <span class="shutter l"></span><span class="shutter r"></span><span class="lbl" data-id="hatch-lbl">Entrar na cabine</span>
      </button>
      <div class="link-side r"><small><span data-id="lk-kind">Mobile suit</span> · escala <span data-id="lk-scale">2</span></small><b data-id="lk-ms">—</b></div>
    </div>
    <p class="link-note" data-id="link-note"></p>

    <div class="seg mswitch" data-id="mswitch" role="group" aria-label="Mostrar ficha">
      <button type="button" data-show="pilot" aria-pressed="true">Piloto</button>
      <button type="button" data-show="ms" aria-pressed="false">Máquina</button>
    </div>

    <div class="combat" data-id="combat" hidden>
      <div class="scan" data-id="scan" aria-hidden="true"></div>
      <div class="col" data-id="cb-left">
        <article class="panel"><div class="in">
          <header class="hd"><h2>Ações na cabine</h2><span class="kana">戦闘</span></header>
          <div class="opp"><span class="lbl">Escala do oponente</span><div class="seg" role="group" aria-label="Escala do oponente" data-id="opp"></div></div>
          <div class="tiles" data-id="tiles"></div>
          <div class="eject"><small data-id="eject-note"></small><button type="button" class="btn sm warn" data-act="eject">Ejetar</button></div>
        </div></article>
      </div>
      <div class="col" data-id="cb-right"></div>
    </div>

    <div class="cols" data-id="cols" data-show="pilot">
      <div class="col" data-id="col-pilot">
        <article class="panel" style="--i:0"><div class="in">
          <header class="hd"><h2>Piloto</h2><span class="kana">パイロット</span></header>
          <div class="ident">
            <figure class="slot-img portrait" data-id="img-pilot">
              <img alt="Retrato do piloto">
              <span class="decal" data-id="p-dflt">Figura padrão</span>
              <span class="decal nt" data-id="p-decal" hidden>Newtype</span>
              <div class="img-act">
                <button type="button" class="btn sm" data-pick="pilot">Imagem</button>
                <button type="button" class="btn sm ghost" data-prompt="pilot">Prompt</button>
              </div>
            </figure>
            <div class="ident-f">
              <label class="fld"><span>Nome</span><input type="text" data-bind="pilot.name" placeholder="Nome do piloto"></label>
              <label class="fld"><span>Descrição</span><textarea rows="3" data-bind="pilot.desc" placeholder="Quem é, de onde vem, o que quer"></textarea></label>
              <div class="meters">
                <div class="meter"><span class="lbl">Recarga</span><b data-id="refresh">3</b><small data-id="refresh-note"></small></div>
                <div class="meter"><span class="lbl">Pontos de destino</span>
                  <div class="fp-row">
                    <button type="button" class="step" data-fp="-1" aria-label="Gastar ponto de destino">−</button>
                    <span class="fp-n" data-id="fp-n">3</span>
                    <button type="button" class="step" data-fp="1" aria-label="Ganhar ponto de destino">+</button>
                    <div class="pips" data-id="fp-pips" aria-hidden="true"></div>
                  </div>
                  <small>Volta à Recarga no início da sessão.</small>
                </div>
              </div>
            </div>
          </div>
        </div></article>

        <article class="panel" style="--i:1"><div class="in">
          <header class="hd"><h2>Aspectos</h2><span class="kana">アスペクト</span></header>
          <div data-id="asp-pilot"></div>
          <p class="hint">Marque <b>NT</b> no aspecto que faz do personagem um Newtype. Só um por ficha; ele libera as façanhas Newtype e as armas psicomu.</p>
        </div></article>

        <article class="panel" style="--i:2"><div class="in">
          <header class="hd"><h2>Perícias</h2><span class="kana">技能</span></header>
          <div class="pyr" data-id="pyr"></div>
          <div class="row-tools">
            <span class="hint" style="margin:0">Fora da pirâmide, a perícia vale Medíocre (+0). As somas com a máquina aparecem ao fechar a escotilha.</span>
            <button type="button" class="btn sm ghost" data-act="roll4">Rolar 4dF</button>
          </div>
        </div></article>

        <article class="panel" style="--i:3"><div class="in">
          <header class="hd"><h2>Façanhas</h2><span class="kana">特技</span></header>
          <div class="sock-h"><span class="lbl">Encaixes</span><button type="button" class="toggle" data-id="trade" aria-pressed="false">Trocar encaixes vazios por Recarga</button></div>
          <div class="sockets" data-id="sockets" aria-live="polite"></div>
          <div data-id="st-pilot"></div>
          <div class="adder">
            <select data-id="lib-pilot" aria-label="Façanha da lista"></select>
            <button type="button" class="btn sm fac" data-add-stunt="pilot">Adicionar</button>
            <button type="button" class="btn sm" data-build="pilot">Criar façanha</button>
          </div>
        </div></article>

        <article class="panel" style="--i:4" data-id="pn-pstress"><div class="in">
          <header class="hd red"><h2>Estresse e consequências</h2><span class="kana">ストレス</span></header>
          <div class="dmg-grid">
            <div>
              <div class="track-b"><div class="track-h"><span class="lbl">Físico</span><small data-id="tn-f"></small></div><div class="track" data-id="tr-f"></div></div>
              <div class="track-b"><div class="track-h"><span class="lbl">Mental</span><small data-id="tn-m"></small></div><div class="track" data-id="tr-m"></div></div>
            </div>
            <div class="cons" data-id="cons-pilot"></div>
          </div>
        </div></article>
      </div>

      <div class="col" data-id="col-ms">
        <article class="panel" style="--i:1"><div class="in">
          <header class="hd"><h2 data-id="ms-h">Mobile suit</h2><span class="kana" data-id="ms-kana">モビルスーツ</span></header>
          <figure class="slot-img hero" data-id="img-ms">
            <img alt="Imagem da máquina">
            <span class="decal" data-id="ms-decal"></span>
            <div class="img-act">
              <button type="button" class="btn sm" data-pick="ms">Imagem</button>
              <button type="button" class="btn sm ghost" data-prompt="ms">Prompt</button>
              <button type="button" class="btn sm ghost" data-rmimg="ms" hidden>Tirar</button>
            </div>
          </figure>
          <div class="ms-meta">
            <label class="fld"><span>Designação</span><input type="text" data-bind="ms.name" placeholder="Ex.: MS-06 Zaku II"></label>
            <label class="fld"><span>Classe</span><select data-id="ms-cls"></select></label>
            <div class="scale"><span class="lbl">Escala</span><b data-id="ms-scale">2</b></div>
          </div>
          <p class="perk" data-id="cls-perk"></p>
        </div></article>

        <article class="panel" style="--i:2"><div class="in">
          <header class="hd"><h2>Aspectos da máquina</h2><span class="kana">アスペクト</span></header>
          <div data-id="asp-ms"></div>
        </div></article>

        <article class="panel" style="--i:3"><div class="in">
          <header class="hd"><h2>Sistemas</h2><span class="kana">システム</span></header>
          <div class="budget" data-id="budget"><span class="lbl">Pontos</span><div class="bar" data-id="bar"></div><span class="budget-t" data-id="budget-t"></span></div>
          <div data-id="sys"></div>
        </div></article>

        <article class="panel" style="--i:4"><div class="in">
          <header class="hd"><h2>Façanhas de sistema</h2><span class="kana">特殊装備</span></header>
          <p class="limit" data-id="ms-limit"></p>
          <div data-id="st-ms"></div>
          <div class="adder">
            <select data-id="lib-ms" aria-label="Façanha de sistema da lista"></select>
            <button type="button" class="btn sm fac" data-add-stunt="ms">Adicionar</button>
            <button type="button" class="btn sm" data-build="ms">Criar façanha</button>
          </div>
        </div></article>

        <article class="panel" style="--i:5"><div class="in">
          <header class="hd"><h2>Armamento</h2><span class="kana">武装</span></header>
          <div data-id="wpn"></div>
          <div class="adder"><button type="button" class="btn sm fac" data-act="add-w">Adicionar arma</button></div>
          <p class="hint">Arma:1 ou Arma:2. O tamanho da máquina já entra pela escala. Os ataques rolam no modo de combate.</p>
        </div></article>

        <article class="panel" style="--i:6" data-id="pn-mdmg"><div class="in">
          <header class="hd red"><h2>Estrutura e avarias</h2><span class="kana">損傷</span></header>
          <div class="track-b"><div class="track-h"><span class="lbl">Estresse estrutural</span><small data-id="tn-ms"></small></div><div class="track" data-id="tr-ms"></div></div>
          <div class="dmg-wrap" data-id="dmg-wrap">
            <div class="dfig" data-id="dfig"></div>
            <div class="cons" data-id="cons-ms"></div>
          </div>
          <p class="hint">Escolha a linha da avaria e toque no corpo. Avaria moderada ou severa zera o sistema daquele local até o reparo.</p>
        </div></article>
      </div>
    </div>

    <div class="filebar">
      <small>A ficha fica guardada no próprio ator. Para levar a outro mundo, use Exportar dados no menu do ator.</small>
      <button type="button" class="btn sm ghost" data-act="example">Exemplo: Lalah Sune</button>
      <button type="button" class="btn sm ghost" data-act="new">Nova ficha</button>
    </div>
  </section>

  <section data-id="v-manual" hidden>${manual()}</section>
</div>`;
}

function manual() {
  const clsRows = Object.values(CLASSES).map(c => `<tr><td class="k">${c.n}</td><td>${c.ex}</td><td class="num">${c.scale}</td><td>${c.perk}</td></tr>`).join("");
  const ntList = P_ST.filter(s => s.nt).map(s => `<li><b>${s.n}.</b> ${s.d}</li>`).join("");
  const msList = M_ST.map(s => `<li><b>${s.n}.</b> ${s.d}</li>`).join("");
  const figs = Object.values(BODIES).map(b => `<figure class="mfig-c"><div class="dfig mfig"><img src="${b.img}" alt="${b.kind} com os locais de avaria">${b.zones.map(([z, x, y, k]) => `<span class="zone" style="left:${x}%;top:${y}%">${z}<small>${k ? "−" + SYSN[k] : "só aspecto"}</small></span>`).join("")}</div><figcaption>${b.kind}</figcaption></figure>`).join("");
  const toc = [["m-fichas","Duas fichas"],["m-cabine","Na cabine"],["m-pilotagem","Pilotagem"],["m-facanhas","Façanhas"],["m-newtype","Newtype"],["m-montar","Montar a máquina"],["m-dano","Dano e reparo"],["m-ponte","A nave e a ponte"],["m-escala","Escala"],["m-minovsky","Minovsky"],["m-escada","Escada"]];
  return `<div class="manual">
  <nav class="toc" aria-label="Seções do manual">${toc.map(([id,n]) => `<button type="button" data-goto="${id}">${n}</button>`).join("")}</nav>
  <div class="doc">
    <article class="panel" data-sec="m-fichas"><div class="in">
      <header class="hd"><h2>Duas fichas, um piloto no comando</h2><span class="kana">二枚</span></header>
      <div class="prose">
        <p><span class="stepn">1</span>O Fate trata qualquer coisa importante como personagem (a <b>Regra de Bronze</b>). O mobile suit ganha aspectos, perícias próprias chamadas <b>Sistemas</b>, façanhas, estresse e consequências chamadas <b>Avarias</b>.</p>
        <p><span class="stepn">2</span>A máquina não tem Recarga nem Pontos de Destino. Quem decide, invoca e gasta é o piloto. O mestre força os aspectos da máquina como os de qualquer personagem.</p>
        <p><span class="stepn">3</span>Piloto: cinco aspectos (Conceito, Problema e três livres); pirâmide de uma perícia +4, duas +3, três +2, quatro +1; três façanhas grátis e Recarga 3. Estresse com duas caixas; Vigor e Vontade +1 ou +2 abrem a terceira, +3 ou +4 abrem a quarta. A ficha calcula tudo isso.</p>
      </div>
    </div></article>

    <article class="panel" data-sec="m-cabine"><div class="in">
      <header class="hd"><h2>Na cabine</h2><span class="kana">コックピット</span></header>
      <div class="eq">
        <figure><img src="${IMG.pilot}" alt="Piloto"><figcaption>Atirar do piloto<b>+3</b></figcaption></figure>
        <span class="op">+</span>
        <figure><img src="${IMG.ms}" alt="Mobile suit"><figcaption>Mira da máquina<b>+2</b></figcaption></figure>
        <span class="op">+</span>
        <figure><span class="dicebox"><span>+</span><span>+</span><span></span><span>−</span></span><figcaption>4dF<b>+1</b></figcaption></figure>
        <span class="op">=</span>
        <span class="result">+6<small>Fantástico</small></span>
      </div>
      <div class="tbl"><table>
        <thead><tr><th>Perícia do piloto</th><th>Sistema que soma</th><th>Usos</th></tr></thead>
        <tbody>
          <tr><td class="k">Pilotagem</td><td>Mobilidade</td><td>Defender, mover, perseguir, fugir</td></tr>
          <tr><td class="k">Atirar</td><td>Mira</td><td>Armas de disparo</td></tr>
          <tr><td class="k">Lutar</td><td>Combate</td><td>Sabre, machado, corpo a corpo</td></tr>
          <tr><td class="k">Percepção</td><td>Sensores</td><td>Detectar e ordem de turno</td></tr>
          <tr><td class="k">Vontade</td><td>Mira</td><td>Bits e funnels (aspecto NT + Psicomunicador)</td></tr>
          <tr><td class="k">Empatia</td><td>Mobilidade</td><td>Só com a façanha Flash Newtype, para defender</td></tr>
        </tbody>
      </table></div>
      <div class="prose"><p>Na ficha, fechar a escotilha abre o <b>modo de combate</b>: cada ação já aparece com a soma pronta, e um clique rola no chat.</p></div>
    </div></article>

    <article class="panel" data-sec="m-pilotagem"><div class="in">
      <header class="hd"><h2>Pilotagem e o resto da cabine</h2><span class="kana">操縦</span></header>
      <div class="prose">
        <p><b>Pilotagem substitui Condução</b> e cobre tudo que tem comando: carro, Core Fighter, nave e mobile suit. Mirai Yashima conduz a White Base com a mesma perícia que Amuro usa no Gundam.</p>
        <h3>Outras perícias com trabalho na cabine</h3>
      </div>
      <div class="tbl"><table>
        <thead><tr><th>Perícia</th><th>Ação</th><th>Efeito</th></tr></thead>
        <tbody>
          <tr><td class="k">Vigor</td><td>Manobra extrema (criar vantagem)</td><td>Posição que ninguém aguentaria. Falhou: estresse físico igual à diferença, pela força G.</td></tr>
          <tr><td class="k">Conhecimentos</td><td>Ler o inimigo (criar vantagem)</td><td>Revela ou cria um aspecto do MS inimigo (<i>Junta do joelho exposta</i>).</td></tr>
          <tr><td class="k">Comunicação</td><td>Ordem pelo rádio (criar vantagem)</td><td>A invocação grátis vai para um aliado.</td></tr>
          <tr><td class="k">Ofícios</td><td>Remendo na cabine (superar)</td><td>Gasta a ação; contra Ótimo (+4), apaga uma Avaria suave.</td></tr>
        </tbody>
      </table></div>
      <div class="prose"><p>Lista de perícias: Atirar, Atletismo, Comunicação, Conhecimentos, Contatos, Empatia, Enganar, Furtividade, Investigação, Lutar, Ofícios, Percepção, <b>Pilotagem</b>, Provocar, Recursos, Roubo, Vigor, Vontade. Atletismo não funciona dentro da máquina.</p></div>
    </div></article>

    <article class="panel" data-sec="m-facanhas"><div class="in">
      <header class="hd"><h2>Façanhas e Recarga</h2><span class="kana">特技</span></header>
      <div class="prose">
        <p><span class="stepn">1</span><b>Encaixes.</b> Todo piloto tem três encaixes de façanha grátis. Cada façanha além do terceiro custa 1 de Recarga, com mínimo 1.</p>
        <p><span class="stepn">2</span><b>Trocar encaixes por Recarga</b> (regra opcional da mesa). Cada encaixe grátis que fica vazio vira +1 de Recarga: sem nenhuma façanha, a Recarga vai a 6. Serve para quem prefere viver de aspectos e pontos de destino.</p>
        <p><span class="stepn">3</span><b>Escrever uma façanha.</b> O livro dá três moldes. O <b>Criador de façanha</b> da ficha monta a frase e confere cada regra enquanto você escolhe.</p>
      </div>
      <div class="tbl"><table>
        <thead><tr><th>Molde</th><th>Frase</th><th>Cuidado</th></tr></thead>
        <tbody>
          <tr><td class="k">Bônus de +2</td><td>Porque eu…, recebo +2 em [perícia] para [ação] quando [circunstância].</td><td>Uma perícia, uma ação, circunstância estreita.</td></tr>
          <tr><td class="k">Nova ação</td><td>Porque eu…, posso usar [perícia] para [ação] quando [circunstância].</td><td>A perícia não pode já fazer essa ação.</td></tr>
          <tr><td class="k">Exceção à regra</td><td>Porque eu…, uma vez por [cena ou sessão], [efeito].</td><td>Efeito forte pede limite de uso; sem limite, fica do tamanho de +2.</td></tr>
        </tbody>
      </table></div>
    </div></article>

    <article class="panel" data-sec="m-newtype"><div class="in">
      <header class="hd"><h2>Newtype</h2><span class="kana">ニュータイプ</span></header>
      <div class="prose">
        <p><span class="stepn">1</span><b>Permissão.</b> Só quem tem um aspecto marcado NT compra façanhas Newtype e opera armas psicomu. Um por ficha, em qualquer posição, inclusive no Problema.</p>
        <p><span class="stepn">2</span><b>Custo.</b> As façanhas Newtype saem das três grátis ou da Recarga. O espaço de aspecto é o preço de entrada. Sugestão: um ou dois Newtypes por grupo.</p>
        <p><span class="stepn">3</span><b>Forçar.</b> Sentir alguém morrer e perder a troca; um laboratório (Instituto Flanagan, Laboratório Murasame) atrás de você; outro Newtype te achando escondido; superiores te usando como arma.</p>
        <p><span class="stepn">4</span><b>Ressonância.</b> Dois Newtypes na mesma cena podem invocar o aspecto NT um do outro. Entre eles não há emboscada.</p>
        <p><span class="stepn">5</span><b>Newtype artificial.</b> Aspecto que deixa claro a origem de laboratório. Uma vez por sessão o mestre força esse aspecto e o jogador não pode recusar; ainda recebe o ponto.</p>
        <h3>Façanhas Newtype</h3>
        <ul>${ntList}</ul>
      </div>
    </div></article>

    <article class="panel" data-sec="m-montar"><div class="in">
      <header class="hd"><h2>Montar a máquina</h2><span class="kana">組立</span></header>
      <div class="prose"><p>Toda máquina de jogador tem o <b>mesmo orçamento</b>: 5 pontos de sistema, máximo +2 em cada, duas façanhas de sistema. A classe muda a escala e dá uma vantagem com custo.</p></div>
      <div class="tbl"><table>
        <thead><tr><th>Classe</th><th>Exemplos</th><th>Escala</th><th>O que muda</th></tr></thead>
        <tbody>${clsRows}</tbody>
      </table></div>
      <div class="prose">
        <h3>Aspectos</h3>
        <p><b>Conceito</b>: o que é e para quem foi feita. <b>Defeito</b>: o que trai a máquina na hora errada. <b>Marca</b>: história, pintura, quem pilotou antes.</p>
        <h3>Armas</h3>
        <p><b>Arma:1</b> para vulcan e metralhadora; <b>Arma:2</b> para rifle de feixe, sabre, bazuca e mega partícula. A diferença de tamanho vem da escala, não do número da arma.</p>
        <h3>Façanhas de sistema</h3>
        <ul>${msList}</ul>
      </div>
    </div></article>

    <article class="panel" data-sec="m-dano"><div class="in">
      <header class="hd red"><h2>Dano e reparo</h2><span class="kana">損傷</span></header>
      <div class="mfigs">${figs}</div>
      <div class="prose">
        <p><span class="stepn">1</span><b>Estrutura</b> define as caixas: +0 dá duas, +1 dá três, +2 dá quatro.</p>
        <p><span class="stepn">2</span><b>Avaria tem local.</b> Cada tipo de máquina tem o próprio corpo, desenhado acima. Avaria moderada ou severa zera o sistema daquele local até o reparo. No mobile suit, cabeça tira Sensores, braço direito tira Mira, braço esquerdo tira Combate, pernas e propulsores tiram Mobilidade. Na mobile armor, sensor, canhões e propulsores. Na nave, ponte tira Sensores, torres tiram Mira, motores tiram Mobilidade; hangar e casco não derrubam sistema, mas uma avaria no hangar vira o aspecto que impede lançar ou recolher MS. Avaria suave é só aspecto.</p>
        <p><span class="stepn">3</span><b>O piloto</b> só marca estresse físico quando o atacante cria antes a vantagem <i>Cabine exposta</i>, ou quando a máquina é tirada de ação.</p>
        <p><span class="stepn">4</span><b>Ejetar é conceder.</b> Ganha 1 ponto de destino mais 1 por avaria da máquina. A campanha ganha o aspecto <i>Sem máquina</i> até alguém conseguir outra: uma cena de Recursos ou de Contatos, contra Ótimo (+4) para produção em massa e Fantástico (+6) para o resto.</p>
      </div>
      <div class="tbl"><table>
        <thead><tr><th>Avaria</th><th>Reparo com Ofícios</th><th>Some depois de</th></tr></thead>
        <tbody>
          <tr><td class="k">Suave (2)</td><td>Razoável (+2)</td><td>uma cena</td></tr>
          <tr><td class="k">Moderada (4)</td><td>Ótimo (+4)</td><td>uma sessão</td></tr>
          <tr><td class="k">Severa (6)</td><td>Fantástico (+6)</td><td>um cenário</td></tr>
        </tbody>
      </table></div>
    </div></article>

    <article class="panel" data-sec="m-ponte"><div class="in">
      <header class="hd"><h2>A nave e a ponte</h2><span class="kana">艦橋</span></header>
      <div class="prose"><p>A nave é outro personagem, montado com a mesma ficha de máquina na classe <b>Nave de guerra</b> (escala 3). Quem não pilota faz a ficha dele normalmente e escolhe a nave na coluna da máquina; o modo de combate mostra as mesmas ações, agora somando os sistemas da nave.</p></div>
      <div class="tbl"><table>
        <thead><tr><th>Posto</th><th>Rolagem</th><th>Na batalha</th></tr></thead>
        <tbody>
          <tr><td class="k">Comando</td><td>Comunicação</td><td>Ordem: cria vantagem cuja invocação grátis vai para um piloto</td></tr>
          <tr><td class="k">Operação</td><td>Percepção + Sensores</td><td>Acha o inimigo e passa a posição como aspecto</td></tr>
          <tr><td class="k">Timão</td><td>Pilotagem + Mobilidade</td><td>Move e defende a nave</td></tr>
          <tr><td class="k">Artilharia</td><td>Atirar + Mira</td><td>Canhões da nave</td></tr>
          <tr><td class="k">Mecânica</td><td>Ofícios</td><td>Repara avarias de um MS que volta ao hangar no meio da luta</td></tr>
        </tbody>
      </table></div>
    </div></article>

    <article class="panel" data-sec="m-escala"><div class="in">
      <header class="hd"><h2>Escala</h2><span class="kana">スケール</span></header>
      <div class="scalefig">
        <figure><img src="${IMG.pilot}" alt="Pessoa" style="height:22px"><figcaption>Pessoa<br>escala 0</figcaption></figure>
        <figure><img src="${IMG.ms}" alt="Mobile suit" style="height:220px"><figcaption>Mobile suit · 18 m<br>escala 2</figcaption></figure>
      </div>
      <div class="tbl"><table>
        <thead><tr><th>Escala</th><th>O que entra</th></tr></thead>
        <tbody>
          <tr><td class="num">0</td><td>Pessoa a pé</td></tr>
          <tr><td class="num">1</td><td>Veículo: tanque, Core Fighter, mobile pod (Ball)</td></tr>
          <tr><td class="num">2</td><td>Mobile suit</td></tr>
          <tr><td class="num">3</td><td>Mobile armor e nave de guerra</td></tr>
        </tbody>
      </table></div>
      <div class="prose"><p>Por degrau de diferença, o maior soma +1 ao atacar e ao defender contra o menor, e cada acerto dele causa +2 tensões por degrau. O menor sobrevive criando vantagem. No modo de combate, escolha a escala do oponente e a ficha soma sozinha.</p></div>
    </div></article>

    <article class="panel" data-sec="m-minovsky"><div class="in">
      <header class="hd"><h2>Partículas Minovsky</h2><span class="kana">ミノフスキー</span></header>
      <div class="prose"><p><i>Partículas Minovsky densas</i> é aspecto de cena na maioria das batalhas. Com ele ativo, Sensores só somam na mesma zona ou na adjacente, e rádio entre zonas distantes exige criar vantagem antes (laser, sinalizador). Ressonância ignora o limite para notar pessoas.</p></div>
    </div></article>

    <article class="panel" data-sec="m-escada"><div class="in">
      <header class="hd"><h2>Escada</h2><span class="kana">ラダー</span></header>
      <div class="tbl"><table>
        <thead><tr><th>Valor</th><th>Nome</th><th>Valor</th><th>Nome</th></tr></thead>
        <tbody>
          <tr><td class="num">+8</td><td>Lendário</td><td class="num">+2</td><td>Razoável</td></tr>
          <tr><td class="num">+7</td><td>Épico</td><td class="num">+1</td><td>Regular</td></tr>
          <tr><td class="num">+6</td><td>Fantástico</td><td class="num">+0</td><td>Medíocre</td></tr>
          <tr><td class="num">+5</td><td>Excepcional</td><td class="num">−1</td><td>Ruim</td></tr>
          <tr><td class="num">+4</td><td>Ótimo</td><td class="num">−2</td><td>Terrível</td></tr>
          <tr><td class="num">+3</td><td>Bom</td><td></td><td></td></tr>
        </tbody>
      </table></div>
    </div></article>
  </div>
</div>`;
}

const TRAY = `<button type="button" class="btn pill" data-act="roll4">Rolar 4dF</button>
<div class="tray-card" data-id="tray-card" hidden>
  <header class="hd"><h2 data-id="tr-title">4dF</h2><button type="button" class="x" data-act="close-tray" aria-label="Fechar bandeja">×</button></header>
  <div class="dice" data-id="dice"><span class="fd" data-v="0"></span><span class="fd" data-v="0"></span><span class="fd" data-v="0"></span><span class="fd" data-v="0"></span></div>
  <div class="res" aria-live="polite"><b data-id="tr-total">+0</b><span data-id="tr-ladder">Medíocre</span></div>
  <p class="brk" data-id="tr-brk"></p>
  <p class="tnote" data-id="tr-note" hidden></p>
  <div class="tacts">
    <button type="button" class="btn sm" data-act="invoke">Invocar +2</button>
    <button type="button" class="btn sm ghost" data-act="reroll">Invocar e rerrolar</button>
    <label><input type="checkbox" data-id="tr-free"> grátis</label>
  </div>
</div>`;

/* ---------------- criador de façanha ---------------- */
// Ações de cada perícia na tabela do Fate Core, com Pilotagem no lugar de Condução.
const ACTS = {"Atirar":["Superar","Criar vantagem","Atacar"],"Atletismo":["Superar","Criar vantagem","Defender"],"Comunicação":["Superar","Criar vantagem","Defender"],"Conhecimentos":["Superar","Criar vantagem"],"Contatos":["Superar","Criar vantagem","Defender"],"Empatia":["Superar","Criar vantagem","Defender"],"Enganar":["Superar","Criar vantagem","Defender"],"Furtividade":["Superar","Criar vantagem","Defender"],"Investigação":["Superar","Criar vantagem"],"Lutar":["Superar","Criar vantagem","Atacar","Defender"],"Ofícios":["Superar","Criar vantagem"],"Percepção":["Superar","Criar vantagem","Defender"],"Pilotagem":["Superar","Criar vantagem","Defender"],"Provocar":["Superar","Criar vantagem","Atacar"],"Recursos":["Superar","Criar vantagem"],"Roubo":["Superar","Criar vantagem"],"Vigor":["Superar","Criar vantagem"],"Vontade":["Superar","Criar vantagem","Defender"]};
const ACTIONS = ["Superar","Criar vantagem","Atacar","Defender"];
const ACTV = {"Superar":"superar","Criar vantagem":"criar vantagem","Atacar":"atacar","Defender":"defender"};
const FREQ = [["cena","uma vez por cena"],["sessao","uma vez por sessão"],["pd","gastando 1 ponto de destino"],["sempre","sempre"]];
const BTYPES = [["bonus","Bônus de +2","+2 numa ação, numa circunstância estreita"],["acao","Nova ação","Uma perícia faz o que normalmente não faz"],["excecao","Exceção à regra","Quebra uma regra, com limite de uso"]];
const BEX = {
  pilot: {bonus:{why:"treinei manobras em gravidade zero",skill:"Pilotagem",action:"Superar",when:"manobro entre destroços no espaço",name:"Dança nos destroços"},
          acao:{why:"decorei os manuais de combate da Federação e de Zeon",skill:"Conhecimentos",action:"Defender",when:"um MS de série me ataca com uma manobra padrão",name:"Já li esse manual"},
          excecao:{why:"conheço cada parafuso da minha máquina",freq:"sessao",effect:"apago uma Avaria moderada no fim de uma cena de manutenção",name:"Mecânico de bordo"}},
  ms: {bonus:{why:"tem propulsores de longo curso",skill:"Pilotagem",action:"Superar",when:"persegue um alvo em espaço aberto",name:"Pós-combustor"},
       acao:{why:"tem o ombro blindado para abalroar",skill:"Pilotagem",action:"Atacar",when:"avança em linha reta contra uma máquina na mesma zona",name:"Ombrada"},
       excecao:{why:"tem um gerador reserva",freq:"sessao",effect:"ignora uma Avaria que zerou um sistema até o fim da cena",name:"Gerador reserva"}}
};
const BUILDER = `<div class="fg fg-bcard" role="dialog" aria-modal="true" aria-label="Criador de façanha">
  <header class="hd"><h2>Criador de façanha</h2><button type="button" class="x" data-act="close-builder" aria-label="Fechar criador">×</button></header>
  <div class="btypes" data-id="btypes" role="group" aria-label="Tipo de façanha"></div>
  <div class="bwho"><span class="lbl">Para</span><div class="seg" role="group" aria-label="Para quem é a façanha" data-id="bwho"><button type="button" data-bwho="pilot">Piloto</button><button type="button" data-bwho="ms">Máquina</button></div></div>
  <div class="sentence" data-id="bsent"></div>
  <div class="bchecks" data-id="bchecks" aria-live="polite"></div>
  <div class="bfoot">
    <label class="fld"><span>Nome da façanha</span><input type="text" data-id="bname" placeholder="Curto e com cara do personagem"></label>
    <button type="button" class="btn fac" data-act="b-add">Adicionar à ficha</button>
    <div class="row">
      <label class="chkbox" data-id="bnt-wrap"><input type="checkbox" data-id="bnt"> Façanha Newtype (só funciona com aspecto NT)</label>
      <button type="button" class="btn sm ghost" data-act="b-example">Ver um exemplo</button>
    </div>
  </div>
</div>`;

/* ---------------- interface da ficha ---------------- */
class SheetUI {
  constructor(app, root, tray, builder) {
    this.app = app; this.root = root; this.trayEl = tray; this.bEl = builder; this.B = null;
    this.activeDmg = "l"; this.homes = {}; this.cur = null; this.token = 0;
    this.RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.load();
  }
  get actor() { return this.app.document; }
  $(s, r) { return (r || this.root).querySelector(s.replace(/#([\w-]+)/g, '[data-id="$1"]')); }
  $$(s, r) { return Array.from((r || this.root).querySelectorAll(s.replace(/#([\w-]+)/g, '[data-id="$1"]'))); }
  t$(s) { return this.trayEl.querySelector(s.replace(/#([\w-]+)/g, '[data-id="$1"]')); }
  b$(s) { return this.bEl.querySelector(s.replace(/#([\w-]+)/g, '[data-id="$1"]')); }
  b$$(s) { return Array.from(this.bEl.querySelectorAll(s.replace(/#([\w-]+)/g, '[data-id="$1"]'))); }

  /* criador de façanha */
  openBuilder(who) {
    this.B = {who, type:"bonus", why:"", skill:"Pilotagem", action:"Superar", when:"", freq:"cena", effect:"", name:"", nt:false, last:{}};
    this.b$("#bname").value = ""; this.b$("#bnt").checked = false;
    this.renderBuilder(); this.bEl.hidden = false;
    const f = this.b$(".sentence .slot"); if (f) f.focus();
  }
  subj() { return this.B.who === "ms" ? "Porque esta máquina" : "Porque eu"; }
  slotIn(k, ph) { const B = this.B; return `<input type="text" class="slot${B[k] ? " filled" : ""}" data-b="${k}" value="${esc(B[k])}" placeholder="${ph}" aria-label="${ph}">`; }
  slotSel(k, opts) { const lb = {skill:"Perícia", action:"Ação", freq:"Frequência"}[k]; return `<select class="slot filled" data-b="${k}" aria-label="${lb}">${opts.map(([v, n]) => `<option value="${esc(v)}"${v === this.B[k] ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>`; }
  fitSlot(el) { el.style.width = Math.max(8, Math.min(48, (el.value || el.placeholder).length + 2)) + "ch"; }
  renderBuilder() {
    const B = this.B, who = B.who === "ms";
    this.b$("#btypes").innerHTML = BTYPES.map(([k, n, d]) => `<button type="button" class="btype" data-btype="${k}" aria-pressed="${k === B.type}"><b>${n}</b><small>${d}</small></button>`).join("");
    this.b$$("[data-id='bwho'] button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.bwho === B.who)));
    this.b$("#bnt-wrap").hidden = who;
    const sk = this.slotSel("skill", SKILLS.map(s => [s, s])), ac = this.slotSel("action", ACTIONS.map(a => [a, ACTV[a]]));
    const why = this.slotIn("why", who ? "tem o quê" : "o que você é ou fez");
    let h;
    if (B.type === "bonus") h = `${this.subj()} ${why}, ${who ? "o piloto recebe" : "recebo"} <span class="plus">+2</span> em ${sk} para ${ac} quando ${this.slotIn("when", "em que situação")}.`;
    else if (B.type === "acao") h = `${this.subj()} ${why}, ${who ? "o piloto pode" : "posso"} usar ${sk} para ${ac} quando ${this.slotIn("when", "em que situação")}.`;
    else h = `${this.subj()} ${why}, ${this.slotSel("freq", FREQ)} ${this.slotIn("effect", "qual regra você quebra")}.`;
    this.b$("#bsent").innerHTML = h;
    this.b$$(".sentence input.slot").forEach(el => this.fitSlot(el));
    this.renderChecks();
  }
  stuntText() {
    const B = this.B, who = B.who === "ms";
    if (B.type === "bonus") return `${this.subj()} ${B.why}, ${who ? "o piloto recebe" : "recebo"} +2 em ${B.skill} para ${ACTV[B.action]} quando ${B.when}.`;
    if (B.type === "acao") return `${this.subj()} ${B.why}, ${who ? "o piloto pode" : "posso"} usar ${B.skill} para ${ACTV[B.action]} quando ${B.when}.`;
    const f = B.freq === "sempre" ? "" : FREQ.find(x => x[0] === B.freq)[1] + ", ";
    return `${this.subj()} ${B.why}, ${f}${B.effect}.`;
  }
  builderChecks() {
    const B = this.B, C = [], t = B.type, why = B.why.trim(), when = B.when.trim();
    C.push(why ? {s:"ok", t:"A façanha nasce de quem usa: a justificativa está na ficção."} : {s:"fail", t:"Complete o \"porque\": o livro pede que a façanha venha do personagem ou da máquina."});
    if (t !== "excecao") {
      if (!when) C.push({s:"fail", t:"Falta a circunstância. Sem ela, o efeito vale sempre e passa do limite de uma façanha."});
      else if (when.length < 14) C.push({s:"warn", t:"Circunstância curta. Diga quando, onde ou contra quem, para ela não valer o tempo todo."});
      else C.push({s:"ok", t:"Circunstância estreita: o efeito aparece em parte das cenas, não em todas."});
    }
    if (t === "acao") {
      const has = (ACTS[B.skill] || []).includes(B.action);
      C.push(has ? {s:"fail", t:`${B.skill} já pode ${ACTV[B.action]} sem façanha. Escolha outra ação ou troque para Bônus de +2.`} : {s:"ok", t:`${B.skill} normalmente não pode ${ACTV[B.action]}: é uma ação nova de verdade.`});
    }
    if (t === "bonus" && B.action === "Atacar") C.push({s:"warn", t:"Bônus de ataque pesa em todo conflito. Deixe a circunstância bem estreita."});
    if (t === "excecao") {
      C.push(B.effect.trim() ? {s:"ok", t:"A regra quebrada está escrita."} : {s:"fail", t:"Escreva o efeito: que regra do jogo a façanha quebra."});
      C.push(B.freq === "sempre" ? {s:"warn", t:"Efeito sem limite de uso: mantenha do tamanho de +2 ou 2 tensões."} : {s:"ok", t:"Efeito forte com limite de uso, como o livro recomenda."});
    }
    if (B.who === "pilot" && B.nt && !this.hasNT()) C.push({s:"warn", t:"Façanha Newtype: fica travada até a ficha ter um aspecto NT."});
    C.push(B.name.trim() ? {s:"ok", t:"Tem nome."} : {s:"fail", t:"Dê um nome curto à façanha."});
    return C;
  }
  renderChecks() {
    const B = this.B, C = this.builderChecks(), sym = {ok:"✓", warn:"!", fail:"×"};
    this.b$("#bchecks").innerHTML = C.map((c, i) => `<div class="chk${c.s === "ok" && B.last[i] && B.last[i] !== "ok" ? " stamp" : ""}" data-s="${c.s}"><i>${sym[c.s]}</i><span>${esc(c.t)}</span></div>`).join("");
    B.last = C.map(c => c.s);
    this.b$('[data-act="b-add"]').disabled = C.some(c => c.s === "fail");
  }
  builderExample() { const ex = BEX[this.B.who][this.B.type]; Object.assign(this.B, ex); this.b$("#bname").value = ex.name; this.renderBuilder(); }
  builderAdd() {
    if (!this.app.isEditable || this.builderChecks().some(c => c.s === "fail")) return;
    const w = this.B.who, s = {n:this.B.name.trim(), d:this.stuntText()}; if (w === "pilot" && this.B.nt) s.nt = true;
    this.state[w].stunts.push(s); this.renderStunts(w); this.renderDerived(); this.save();
    this.bEl.hidden = true;
    const rows = this.$$(`[data-id='st-${w}'] .stunt`), last = rows[rows.length - 1];
    if (last) { last.classList.add("fresh"); last.scrollIntoView({block:"nearest"}); }
    ui.notifications.info(`Façanha adicionada: ${s.n}`);
  }
  attachBuilder() {
    const E = this.bEl;
    E.addEventListener("input", e => {
      const el = e.target, B = this.B; if (!B) return;
      if (el.dataset.b) { const k = el.dataset.b, was = !!B[k]; B[k] = el.value;
        if (el.tagName === "INPUT") { this.fitSlot(el); el.classList.toggle("filled", !!el.value); if (!was && el.value && !this.RM) { el.classList.remove("filled"); void el.offsetWidth; el.classList.add("filled"); } }
        this.renderChecks(); }
      else if (el.dataset.id === "bname") { B.name = el.value; this.renderChecks(); }
      else if (el.dataset.id === "bnt") { B.nt = el.checked; this.renderChecks(); }
    });
    E.addEventListener("click", e => {
      if (e.target === E) { E.hidden = true; return; }
      const t = e.target.closest("button"); if (!t) return;
      const d = t.dataset;
      if (d.btype) { this.B.type = d.btype; this.renderBuilder(); }
      else if (d.bwho) { this.B.who = d.bwho; this.renderBuilder(); }
      else if (d.act === "close-builder") E.hidden = true;
      else if (d.act === "b-example") this.builderExample();
      else if (d.act === "b-add") this.builderAdd();
    });
    E.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); E.hidden = true; } });
  }

  /* estado */
  load() {
    let raw = this.actor.getFlag(MOD, "json"), s = null;
    if (raw) { try { s = normalize(JSON.parse(raw)); } catch (e) { s = null; } }
    if (!s) { s = blank(); s.pilot.name = this.actor.name; }
    s.pilot.name = this.actor.name;
    this.state = s;
  }
  save() {
    this.dirty = true;
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => this.flush(), 400);
  }
  async flush() {
    clearTimeout(this._saveT);
    if (!this.dirty || !this.app.isEditable) return;
    this.dirty = false;
    const data = {[`flags.${MOD}.json`]: JSON.stringify(this.state)};
    const nm = (this.state.pilot.name || "").trim();
    if (nm && nm !== this.actor.name) data.name = nm;
    this.app._lastSave = Date.now();
    await this.actor.update(data);
  }
  getPath(p) { return p.split(".").reduce((o, k) => o == null ? o : o[k], this.state); }
  setPath(p, v) { const ks = p.split("."); let o = this.state; for (let i = 0; i < ks.length - 1; i++) { o = o[ks[i]]; if (o == null) return; } o[ks[ks.length - 1]] = v; }
  bindValues(root) { this.$$("[data-bind]", root).forEach(el => { const v = this.getPath(el.dataset.bind); el.value = v == null ? "" : v; }); }

  /* consultas */
  rating(sk) { for (const t of TIERS) { if ((this.state.pilot.skills[t.v] || []).includes(sk)) return t.v; } return 0; }
  hasNT() { return this.state.pilot.aspects.some(a => a.nt); }
  msHas(id) { return this.state.ms.stunts.some(s => s.id === id); }
  pHas(id) { return this.state.pilot.stunts.some(s => s.id === id); }
  cls() { return CLASSES[this.state.ms.cls]; }
  sysUsed() { return Object.values(this.state.ms.sys).reduce((a, b) => a + b, 0); }
  dslots() { return DSLOTS.filter(([k]) => k !== "sh" || this.msHas("escudo")); }
  body() { return BODIES[bodyKey(this.state.ms.cls)]; }
  zsys(z) { const e = this.body().zones.find(x => x[0] === z); return e ? e[3] : null; }
  zoneOk(z) { return this.body().zones.some(x => x[0] === z); }
  downBy(k) { for (const [slot, v] of DSLOTS) { const d = this.state.ms.dmg[slot]; if (v >= 4 && d.loc && this.zoneOk(d.loc) && this.zsys(d.loc) === k) return d.loc; } return null; }
  eff(k) { return this.downBy(k) ? 0 : this.state.ms.sys[k]; }
  isShip() { return this.state.ms.cls === "nave"; }
  P(n) { return {l:n, v:this.rating(n)}; }
  S(k) { return {l:SYSN[k] + (this.downBy(k) ? " (zerado)" : ""), v:this.eff(k)}; }

  /* montagem */
  init() {
    this.buildStatic();
    this.renderAll();
    this.attach();
    this.attachBuilder();
    if (!this.app.isEditable) this.$$("input,select,textarea").forEach(el => el.disabled = true);
  }
  buildStatic() {
    this.$("#asp-pilot").innerHTML = P_ASP.map((l, i) => `<div class="asp" data-i="${i}"><span class="asp-l">${l}</span><input type="text" data-bind="pilot.aspects.${i}.t" placeholder="${esc(P_ASP_PH[i])}" aria-label="${l}"><button type="button" class="nt-tog" data-nt="${i}" aria-pressed="false" aria-label="Marcar como aspecto Newtype">NT</button></div>`).join("");
    this.$("#asp-ms").innerHTML = M_ASP.map((l, i) => `<div class="asp"><span class="asp-l">${l}</span><input type="text" data-bind="ms.aspects.${i}" placeholder="${esc(M_ASP_PH[i])}" aria-label="${l}" style="grid-column:2/-1"></div>`).join("");
    const mk = path => [0,1,2,3].map(i => `<button type="button" class="box" data-box="${path}.${i}" aria-pressed="false" aria-label="Caixa ${i + 1}"><span>${i + 1}</span></button>`).join("");
    this.$("#tr-f").innerHTML = mk("pilot.stress.f"); this.$("#tr-m").innerHTML = mk("pilot.stress.m"); this.$("#tr-ms").innerHTML = mk("ms.stress");
    const pc = [["s",2,"Suave",""],["m",4,"Moderada",""],["sv",6,"Severa",""],["x",2,"Extra","Vigor ou Vontade +5"]];
    this.$("#cons-pilot").innerHTML = pc.map(([k, v, n, sub]) => `<div class="con" data-con="${k}"><span class="v">${v}</span><span class="n">${n}${sub ? `<small>${sub}</small>` : ""}</span><input type="text" data-bind="pilot.cons.${k}" aria-label="Consequência ${n}"></div>`).join("");
    this.$("#cons-ms").innerHTML = DSLOTS.map(([k, v, n]) => `<div class="dcon" data-slot="${k}"><span class="v">${v}</span><div class="top"><span class="n">${n}</span><button type="button" class="loc" data-clearloc="${k}" aria-label="Local da avaria ${n}"></button></div><input type="text" data-bind="ms.dmg.${k}.t" aria-label="Avaria ${n}" placeholder="${k === "sh" ? "Escudo destruído" : "O que quebrou"}"></div>`).join("");
    this.$("#ms-cls").innerHTML = Object.entries(CLASSES).map(([k, c]) => `<option value="${k}">${c.n}</option>`).join("");
    this.$("#lib-pilot").innerHTML = `<optgroup label="Piloto">${P_ST.filter(s => !s.nt).map(s => `<option value="${s.id}">${s.n}</option>`).join("")}</optgroup><optgroup label="Newtype (requer aspecto NT)">${P_ST.filter(s => s.nt).map(s => `<option value="${s.id}">${s.n}</option>`).join("")}</optgroup>`;
    this.$("#lib-ms").innerHTML = M_ST.map(s => `<option value="${s.id}">${s.n}</option>`).join("");
    this.$("#opp").innerHTML = SCALES.map(([v, n]) => `<button type="button" data-opp="${v}" aria-pressed="false">${n}</button>`).join("");
  }

  /* partes dinâmicas */
  renderPyramid() {
    const used = new Set(); TIERS.forEach(t => this.state.pilot.skills[t.v].forEach(s => s && used.add(s)));
    this.$("#pyr").innerHTML = TIERS.map(t => `<div class="tier"><div class="tier-l">${t.n}<b>${sgn(t.v)}</b></div><div class="tier-slots">${this.state.pilot.skills[t.v].map((s, i) => `<div class="sk${s ? " filled" : ""}"><select data-tier="${t.v}" data-idx="${i}" aria-label="Perícia ${t.n}, espaço ${i + 1}"><option value="">—</option>${SKILLS.map(n => `<option${n === s ? " selected" : ""}${used.has(n) && n !== s ? " disabled" : ""}>${n}</option>`).join("")}</select><button type="button" class="die" data-roll="${esc(s)}" ${s ? "" : "disabled"} aria-label="Rolar ${esc(s || "perícia")}">${DIE}</button></div>`).join("")}</div></div>`).join("");
  }
  renderStunts(who) {
    const arr = this.state[who].stunts, el = this.$("#st-" + who);
    el.innerHTML = arr.length ? arr.map((s, i) => `<div class="stunt" data-i="${i}"><input type="text" data-bind="${who}.stunts.${i}.n" placeholder="Nome da façanha" aria-label="Nome da façanha"><div class="tags">${s.nt ? '<span class="tag nt">Newtype</span>' : ""}<span class="tag lock" hidden></span><button type="button" class="x" data-del-stunt="${who}" data-i="${i}" aria-label="Remover façanha">×</button></div><textarea rows="2" data-bind="${who}.stunts.${i}.d" placeholder="O que ela faz, em termos de jogo" aria-label="Efeito da façanha"></textarea></div>`).join("") : '<p class="empty">Nenhuma façanha ainda.</p>';
    this.bindValues(el);
  }
  renderLocks() {
    this.$$("[data-id='st-pilot'] .stunt").forEach(row => {
      const s = this.state.pilot.stunts[+row.dataset.i]; if (!s) return;
      let msg = ""; if (s.nt && !this.hasNT()) msg = "Requer aspecto NT"; else if (s.psy && !this.msHas("psy")) msg = "Requer Psicomunicador";
      const tag = this.$(".tag.lock", row); tag.hidden = !msg; tag.textContent = msg; row.classList.toggle("locked", !!msg);
    });
  }
  renderWeapons() {
    const ws = this.state.ms.weapons, el = this.$("#wpn");
    el.innerHTML = ws.length ? ws.map((w, i) => `<div class="wpn"><input type="text" class="nm" data-bind="ms.weapons.${i}.n" placeholder="Nome da arma" aria-label="Nome da arma"><select class="sk-s" data-bind="ms.weapons.${i}.sk" aria-label="Perícia que dispara">${WSK.map(k => `<option>${k}</option>`).join("")}</select><label class="w"><span>Arma</span><input type="number" min="0" max="2" data-bind="ms.weapons.${i}.w" data-num aria-label="Valor de Arma"></label><select class="r" data-bind="ms.weapons.${i}.r" aria-label="Alcance">${RANGES.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select><button type="button" class="x" data-del-w="${i}" aria-label="Remover arma">×</button><input type="text" class="note" data-bind="ms.weapons.${i}.note" placeholder="Nota: munição, efeito, aspecto da arma" aria-label="Nota da arma"></div>`).join("") : '<p class="empty">Nenhuma arma ainda.</p>';
    this.bindValues(el);
  }
  renderSys() {
    const used = this.sysUsed(), c = this.state.ms.cls;
    this.$("#sys").innerHTML = SYS.map(s => { const v = this.state.ms.sys[s.k], mx = sysMax(s.k, c), d = this.downBy(s.k);
      return `<div class="sys"><div class="sys-n"><b>${s.n}</b><small>${d ? `<span class="down">Zerado pela avaria em ${d}</span>` : (mx === 0 && s.k === "comb" ? "Travado em +0 nesta classe" : s.h)}</small><div class="spips">${Array.from({length:MAX}, (_, i) => `<i class="${i < v ? "on" : ""}"></i>`).join("")}</div></div><div class="stepper"><button type="button" class="step" data-sys="${s.k}" data-d="-1" aria-label="Diminuir ${s.n}" ${v <= 0 ? "disabled" : ""}>−</button><output class="${d && v ? "zero" : ""}">${sgn(v)}</output><button type="button" class="step" data-sys="${s.k}" data-d="1" aria-label="Aumentar ${s.n}" ${(v >= mx || used >= PTS) ? "disabled" : ""}>+</button></div></div>`; }).join("");
    this.$("#bar").innerHTML = Array.from({length:Math.max(PTS, used)}, (_, i) => `<i class="${i < used ? "on" : ""}"></i>`).join("");
    this.$("#budget").classList.toggle("over", used > PTS);
    this.$("#budget-t").textContent = used > PTS ? `${used} de ${PTS} pontos: tire ${used - PTS}` : `${used} de ${PTS} pontos · máximo +2 por sistema`;
  }
  renderTrack(id, path, count) {
    this.$$(`#${id} .box`).forEach((b, i) => { const v = !!this.getPath(path + "." + i); b.disabled = i >= count; b.setAttribute("aria-pressed", String(v && i < count)); });
  }
  refresh() { const n = this.state.pilot.stunts.length; if (n > 3) return Math.max(1, 3 - (n - 3)); return this.state.pilot.trade ? 3 + (3 - n) : 3; }
  renderSockets() {
    const st = this.state.pilot.stunts, n = st.length, trade = !!this.state.pilot.trade, cells = [];
    this.$("#trade").setAttribute("aria-pressed", String(trade));
    for (let i = 0; i < Math.max(3, n); i++) {
      const s = st[i];
      if (s) cells.push(`<div class="sock ${i < 3 ? "full" : "paid"}"><b>${esc(s.n || "Sem nome")}</b>${i < 3 ? "grátis" : "−1 Recarga"}</div>`);
      else if (trade) cells.push(`<div class="sock traded"><i></i>+1 Recarga</div>`);
      else cells.push(`<div class="sock">Encaixe livre</div>`);
    }
    this.$("#sockets").innerHTML = cells.join("");
  }
  renderFP() {
    const ref = this.refresh(), fp = this.state.pilot.fp;
    this.$("#fp-n").textContent = fp;
    this.$("#fp-pips").innerHTML = Array.from({length:Math.max(ref, fp)}, (_, i) => `<i class="pip${i < fp ? " on" : ""}"></i>`).join("");
    this.$('[data-fp="-1"]').disabled = fp <= 0;
  }
  renderBodyFig() {
    const k = bodyKey(this.state.ms.cls); if (k === this.shownBody) return; this.shownBody = k;
    const b = BODIES[k];
    this.$("#dmg-wrap").classList.toggle("wide", !!b.wide);
    this.$("#dfig").innerHTML = `<img src="${b.img}" alt="Diagrama de ${b.kind.toLowerCase()} para marcar avarias">` + b.zones.map(([z, x, y]) => `<button type="button" class="zone" data-zone="${z}" style="left:${x}%;top:${y}%">${z}<small></small></button>`).join("");
  }
  renderDamage() {
    this.renderBodyFig();
    const sev = {}; DSLOTS.forEach(([k, v]) => { const d = this.state.ms.dmg[k]; if (d.loc && this.zoneOk(d.loc) && (k !== "sh" || this.msHas("escudo"))) sev[d.loc] = Math.max(sev[d.loc] || 0, v); });
    this.$$("[data-id='dfig'] .zone").forEach(z => { const n = z.dataset.zone, s = sev[n] || 0; if (s) z.dataset.sev = s; else delete z.dataset.sev;
      this.$("small", z).textContent = s >= 4 && this.zsys(n) ? `−${SYSN[this.zsys(n)]}` : (s ? "avariado" : "");
      z.setAttribute("aria-label", `${n}${s ? ", avariado" : ""}. Marcar na avaria selecionada`); });
    this.$$("[data-id='cons-ms'] .dcon").forEach(row => { const k = row.dataset.slot, d = this.state.ms.dmg[k];
      row.hidden = k === "sh" && !this.msHas("escudo"); row.classList.toggle("active", k === this.activeDmg);
      const b = this.$(".loc", row); b.textContent = d.loc ? d.loc + " ×" : "sem local"; b.classList.toggle("set", !!d.loc); b.hidden = k === "sh"; });
  }
  renderDerived() {
    const st = this.state, n = st.pilot.stunts.length, extra = Math.max(0, n - 3);
    this.$("#refresh").textContent = this.refresh();
    this.$("#refresh-note").textContent = n > 3 ? `${extra} façanha${extra > 1 ? "s" : ""} paga${extra > 1 ? "s" : ""} com Recarga` : (st.pilot.trade && n < 3 ? `3 + ${3 - n} de encaixe${3 - n > 1 ? "s" : ""} trocado${3 - n > 1 ? "s" : ""}` : `${3 - n} de 3 encaixes grátis livres`);
    this.renderFP(); this.renderSockets();
    const boxes = r => 2 + (r >= 1 ? 1 : 0) + (r >= 3 ? 1 : 0);
    const rv = this.rating("Vigor"), rw = this.rating("Vontade");
    this.renderTrack("tr-f", "pilot.stress.f", boxes(rv)); this.$("#tn-f").textContent = `Vigor ${ladder(rv)}: ${boxes(rv)} caixas`;
    this.renderTrack("tr-m", "pilot.stress.m", boxes(rw)); this.$("#tn-m").textContent = `Vontade ${ladder(rw)}: ${boxes(rw)} caixas`;
    const px = rv >= 5 || rw >= 5, xc = this.$('[data-con="x"]'); xc.classList.toggle("off", !px); this.$("input", xc).disabled = !px || !this.app.isEditable;
    const c = this.cls(), e = st.ms.sys.estr, mcount = [2,3,4][e] || 2;
    this.renderTrack("tr-ms", "ms.stress", mcount); this.$("#tn-ms").textContent = `Estrutura ${sgn(e)}: ${mcount} caixas`;
    this.$("#ms-scale").textContent = c.scale; this.$("#lk-scale").textContent = c.scale;
    this.$("#cls-perk").innerHTML = `<b>${c.n}</b>${c.perk}`;
    this.$("#ms-h").textContent = this.body().kind; this.$("#ms-kana").textContent = this.body().kana; this.$("#lk-kind").textContent = this.body().kind;
    const ns = st.ms.stunts.length, lim = this.$("#ms-limit");
    lim.textContent = ns > c.st ? `${ns} de ${c.st} façanhas: acima do limite da classe` : `${ns} de ${c.st} façanhas da classe`;
    lim.classList.toggle("over", ns > c.st);
    this.renderDamage(); this.renderLink(); this.renderLocks(); this.renderCombat();
  }
  renderLink() {
    this.$("#lk-pilot").textContent = this.state.pilot.name || "Sem nome";
    this.$("#lk-ms").textContent = this.state.ms.name || "Sem designação";
    this.$("#ms-decal").textContent = this.state.ms.img ? `Piloto ${this.state.pilot.name || "—"} · escala ${this.cls().scale}` : "Figura padrão · escolha a imagem da sua máquina";
    this.$("#p-decal").hidden = !this.hasNT();
  }
  renderNT(flashIdx) {
    this.$$(".nt-tog").forEach(b => b.setAttribute("aria-pressed", String(!!this.state.pilot.aspects[+b.dataset.nt].nt)));
    if (flashIdx != null && !this.RM) { const row = this.$(`.asp[data-i="${flashIdx}"]`); row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash"); }
    this.renderLink(); this.renderLocks(); this.renderCombat();
  }
  actorImg() { const i = this.actor.img; return DEFAULT_ACTOR_IMG.includes(i || "") ? "" : i; }
  renderImages() {
    const pimg = this.actorImg();
    const fp = this.$("#img-pilot img"); fp.src = pimg || IMG.pilot; fp.classList.toggle("dflt", !pimg);
    this.$("#p-dflt").hidden = !!pimg;
    const fm = this.$("#img-ms img"), mimg = this.state.ms.img; fm.src = mimg || this.body().img; fm.classList.toggle("dflt", !mimg);
    this.$('[data-rmimg="ms"]').hidden = !mimg;
    this.renderLink();
  }

  /* modo de combate */
  actions() {
    const A = [], nt = this.hasNT(), P = n => this.P(n), S = k => this.S(k);
    A.push({kind:"Defender",n:"Esquivar",parts:[P("Pilotagem"),S("mob")]});
    if (this.pHas("flash") && nt) A.push({kind:"Defender",n:"Flash Newtype",nt:true,parts:[P("Empatia"),S("mob")],note:"Uma vez por conflito."});
    A.push({kind:"Superar",n:this.isShip() ? "Manobrar a nave" : "Mover e perseguir",parts:[P("Pilotagem"),S("mob")]});
    A.push({kind:"Notar",n:"Detectar e turno",parts:[P("Percepção"),S("sens")],note:"Sob Minovsky densa, Sensores só somam até a zona ao lado."});
    this.state.ms.weapons.forEach(w => {
      const k = w.sk === "Lutar" ? "comb" : "mira", ok = w.sk !== "Vontade" || (nt && this.msHas("psy"));
      A.push({kind:"Atacar",n:w.n || "Arma sem nome",nt:w.sk === "Vontade",warn:!ok,w:+w.w || 0,parts:[P(w.sk),S(k)],note:ok ? "" : "Armas psicomu exigem aspecto NT e Psicomunicador."});
    });
    if (!this.state.ms.weapons.some(w => w.sk === "Lutar") && !this.isShip()) A.push({kind:"Atacar",n:"Golpe corpo a corpo",w:0,parts:[P("Lutar"),S("comb")]});
    if (this.pHas("press") && nt) A.push({kind:"Atacar",n:"Pressão",nt:true,mental:true,w:0,parts:[P("Vontade")],note:"Ataque mental; o alvo defende com Vontade."});
    A.push({kind:"Criar vantagem",n:"Manobra extrema",parts:[P("Vigor")].concat(this.pHas("g") ? [{l:"Corpo de piloto de teste",v:2}] : []),note:"Falhou: estresse físico igual à diferença."});
    A.push({kind:"Criar vantagem",n:"Ler o inimigo",parts:[P("Conhecimentos")],note:"Revela ou cria um aspecto da máquina inimiga."});
    A.push({kind:"Criar vantagem",n:"Ordem pelo rádio",parts:[P("Comunicação")],note:"A invocação grátis vai para um aliado."});
    A.push({kind:"Superar",n:"Remendo na cabine",parts:[P("Ofícios")],note:`Contra ${this.pHas("mec") ? "Razoável (+2)" : "Ótimo (+4)"}: apaga uma Avaria suave. Gasta sua ação.`});
    return A;
  }
  scaleDiff(a) { if (a.mental || !(a.kind === "Atacar" || a.kind === "Defender")) return 0; return this.cls().scale - this.state.opp; }
  withScale(a) { const d = this.scaleDiff(a), parts = a.parts.slice(); if (d > 0) parts.push({l:"Escala",v:d}); return {parts, d}; }
  renderCombat() {
    if (!this.state.cockpit) return;
    this.$$("[data-id='opp'] button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.opp === this.state.opp)));
    this.$("#tiles").innerHTML = this.actions().map((a, i) => { const {parts} = this.withScale(a), t = parts.reduce((s, p) => s + p.v, 0);
      return `<button type="button" class="tile${a.nt ? " nt" : ""}${a.warn ? " warn" : ""}" data-kind="${a.kind}" data-tile="${i}"><span class="k">${a.kind}${a.w ? ` · Arma:${a.w}` : ""}</span><span class="tn">${esc(a.n)}</span><span class="tf">${parts.map(p => `${esc(p.l)} ${sgn(p.v)}`).join(" · ")}</span><span class="tt">${sgn(t)}</span></button>`; }).join("");
    const nd = this.dslots().filter(([k]) => this.state.ms.dmg[k].t || this.state.ms.dmg[k].loc).length;
    this.$("#eject-note").textContent = `Ejetar é conceder: +${1 + nd} ponto${nd ? "s" : ""} de destino (1 + ${nd} avaria${nd === 1 ? "" : "s"}) e a campanha fica Sem máquina.`;
  }
  rollAction(i) {
    const a = this.actions()[i]; if (!a) return;
    const {parts, d} = this.withScale(a), notes = [];
    if (a.note) notes.push(a.note);
    if (a.kind === "Atacar" && !a.mental) { const extra = (a.w || 0) + (d > 0 ? 2 * d : 0); notes.push(`Se acertar: +${extra} tensões${a.w ? ` (Arma:${a.w}` : ""}${d > 0 ? `${a.w ? ", " : " ("}escala +${2 * d}` : ""}${a.w || d > 0 ? ")" : ""}.`); }
    if (d < 0 && (a.kind === "Atacar" || a.kind === "Defender")) notes.push(`O oponente é maior: ele soma +${-d} contra você.`);
    this.roll(a.n, parts, notes.join(" "), !!a.warn);
  }
  renderCockpit(animate) {
    const on = !!this.state.cockpit;
    this.$("#cockpit").setAttribute("aria-pressed", String(on));
    this.$("#hatch-lbl").textContent = on ? "Sair da cabine" : "Entrar na cabine";
    this.$("#link-note").innerHTML = on ? "Modo de combate: cada ação já soma <b>perícia + sistema</b>. Clique para rolar no chat." : "Fora da cabine, a ficha é para montar e editar. Feche a escotilha para lutar.";
    this.$("#combat").hidden = !on; this.$("#cols").hidden = on; this.$("#mswitch").hidden = on;
    ["pn-mdmg", "pn-pstress"].forEach(id => { const el = this.$("#" + id);
      if (!this.homes[id]) this.homes[id] = el.parentNode;
      if (on) (id === "pn-mdmg" ? this.$("#cb-left") : this.$("#cb-right")).appendChild(el);
      else this.homes[id].appendChild(el); });
    if (on) this.renderCombat();
    if (animate && on && !this.RM) { const sc = this.$("#scan"); sc.style.setProperty("--h", this.$("#combat").offsetHeight + "px"); sc.classList.remove("go"); void sc.offsetWidth; sc.classList.add("go"); }
  }
  renderFaction() {
    this.app.element.dataset.faction = this.state.faction;
    this.$$("[data-fac]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.fac === this.state.faction)));
  }
  renderShow() {
    this.$("#cols").dataset.show = this.state.show;
    this.$$("[data-show]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.show === this.state.show)));
  }
  setView(v) {
    this.view = v;
    this.$("#v-ficha").hidden = v !== "ficha"; this.$("#v-manual").hidden = v !== "manual";
    this.$$("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
  }
  renderAll() {
    this.renderFaction(); this.renderShow();
    this.renderPyramid(); this.renderStunts("pilot"); this.renderStunts("ms"); this.renderWeapons(); this.renderSys();
    this.bindValues(this.root); this.$("#ms-cls").value = this.state.ms.cls;
    this.renderNT(); this.renderImages(); this.renderCockpit(false); this.renderDerived();
    this.setView(this.view || "ficha");
  }

  /* dados: rola no chat e mostra na bandeja */
  async roll(title, parts, note, warn) {
    const mod = parts.reduce((a, p) => a + p.v, 0);
    const r = await new Roll(`4dF + ${mod}`).evaluate();
    const dice = (r.dice[0]?.results || []).map(x => x.result);
    this.cur = {title, parts, bonus:0, dice, roll:r};
    await this.toChat(r, title, parts, note);
    this.showTray(title, note, warn);
    this.animateDice();
  }
  async toChat(r, title, parts, note, extra) {
    const brk = parts.map(p => `${esc(p.l)} ${sgn(p.v)}`).join(" · ");
    const flavor = `<div class="fg-chat"><div class="fg-chat-t">${esc(title)}</div>${brk ? `<div class="fg-chat-b">${brk}</div>` : ""}<div class="fg-chat-l">${ladder(r.total + (extra || 0))}</div>${note ? `<div class="fg-chat-n">${esc(note)}</div>` : ""}</div>`;
    await r.toMessage({speaker: ChatMessage.getSpeaker({actor: this.actor}), flavor});
  }
  showTray(title, note, warn) {
    this.t$("#tray-card").hidden = false; this.t$(".pill").hidden = true;
    this.t$("#tr-title").textContent = title;
    const tn = this.t$("#tr-note"); tn.hidden = !note; tn.textContent = note || ""; tn.classList.toggle("warn", !!warn);
  }
  animateDice() {
    const c = this.cur, my = ++this.token, ds = Array.from(this.trayEl.querySelectorAll(".fd"));
    const face = v => v > 0 ? "+" : v < 0 ? "−" : "";
    if (this.RM) { ds.forEach((d, i) => { d.dataset.v = c.dice[i]; d.textContent = face(c.dice[i]); }); this.paintTotal(); return; }
    this.t$("#tr-total").textContent = "…"; this.t$("#tr-ladder").textContent = ""; this.t$("#tr-brk").textContent = "";
    ds.forEach((d, i) => {
      d.classList.remove("land"); d.classList.add("roll"); let k = i;
      const iv = setInterval(() => { if (my !== this.token) { clearInterval(iv); return; } const v = [-1,0,1][k++ % 3]; d.dataset.v = v; d.textContent = face(v); }, 65);
      setTimeout(() => { clearInterval(iv); if (my !== this.token) return; d.classList.remove("roll"); d.dataset.v = c.dice[i]; d.textContent = face(c.dice[i]); void d.offsetWidth; d.classList.add("land"); if (i === 3) this.paintTotal(); }, 380 + i * 120);
    });
  }
  paintTotal() {
    const c = this.cur, ds = c.dice.reduce((a, b) => a + b, 0), base = c.parts.reduce((a, p) => a + p.v, 0), tot = base + ds + c.bonus;
    this.t$("#tr-total").textContent = sgn(tot); this.t$("#tr-ladder").textContent = ladder(tot);
    this.t$("#tr-brk").textContent = [...c.parts.map(p => `${p.l} ${sgn(p.v)}`), `dados ${sgn(ds)}`, ...(c.bonus ? [`invocações ${sgn(c.bonus)}`] : [])].join(" · ");
  }
  spend() {
    if (this.t$("#tr-free").checked) return true;
    if (this.state.pilot.fp <= 0) { ui.notifications.warn("Sem pontos de destino. Marque \"grátis\" se for uma invocação gratuita."); return false; }
    this.state.pilot.fp--; this.renderFP(); this.save(); return true;
  }
  async invoke() {
    if (!this.cur || !this.spend()) return;
    this.cur.bonus += 2; this.paintTotal();
    const tot = this.cur.parts.reduce((a, p) => a + p.v, 0) + this.cur.dice.reduce((a, b) => a + b, 0) + this.cur.bonus;
    await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="fg-chat"><div class="fg-chat-t">Invocou um aspecto: +2</div><div class="fg-chat-b">${esc(this.cur.title)}</div><div class="fg-chat-l">${sgn(tot)} · ${ladder(tot)}</div></div>`});
  }
  async reroll() {
    if (!this.cur || !this.spend()) return;
    const c = this.cur, mod = c.parts.reduce((a, p) => a + p.v, 0) + c.bonus;
    const r = await new Roll(`4dF + ${mod}`).evaluate();
    c.dice = (r.dice[0]?.results || []).map(x => x.result); c.roll = r;
    await this.toChat(r, `${c.title} (rerrolagem)`, c.parts.concat(c.bonus ? [{l:"invocações", v:c.bonus}] : []), "");
    this.animateDice();
  }

  /* utilidades */
  buildPrompt(w) {
    const st = this.state;
    if (w === "pilot") {
      const p = st.pilot;
      return `Retrato de personagem no estilo de anime de robôs do fim dos anos 1970: cel pintado à mão, cores chapadas, sombras duras e traço fino. Meio corpo, olhar para o lado, expressão contida. Personagem: ${p.name || "piloto sem nome"}. ${p.desc || ""} Conceito: ${p.aspects[0].t || "piloto de mobile suit"}. Traje de piloto de ${st.faction === "zeon" ? "Zeon" : "Federação Terrestre"}. Fundo liso cinza-azulado, sem texto, sem logotipo, proporção 3:4.`.replace(/\s+/g, " ").trim();
    }
    const m = st.ms;
    return `Ilustração de ${this.isShip() ? "nave de guerra espacial" : st.ms.cls === "ma" ? "mobile armor (máquina de guerra gigante sem forma humana)" : "robô gigante"} no estilo de manual de montagem de kit japonês: lineart limpo, cores chapadas com sombra de cel, linhas de painel da blindagem visíveis. Vista frontal em 3/4, corpo inteiro. Máquina: ${m.name || "mobile suit"} (${this.cls().n.toLowerCase()}). ${m.aspects[0] || ""}. ${m.aspects[1] ? "Detalhe visível do defeito: " + m.aspects[1] + "." : ""} Cores: ${st.faction === "zeon" ? "verde-oliva com detalhes em vinho" : "branco, azul e vermelho com detalhes amarelos"}. Fundo branco, sem texto, sem logotipo, proporção 4:3.`.replace(/\s+/g, " ").trim();
  }
  pickImage(w) {
    const FP = foundry.applications.apps.FilePicker.implementation;
    const current = w === "pilot" ? this.actorImg() : this.state.ms.img;
    new FP({type:"image", current, callback: async path => {
      if (w === "pilot") { this.app._lastSave = Date.now(); await this.actor.update({img: path}); }
      else { this.state.ms.img = path; this.save(); }
      this.renderImages();
    }}).render(true);
  }
  arm(btn, label, armed, run) {
    if (btn.dataset.armed) { clearTimeout(btn._t); delete btn.dataset.armed; btn.textContent = label; run(); return; }
    btn.dataset.armed = "1"; btn.textContent = armed; btn._t = setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; }, 3500);
  }

  /* eventos */
  attach() {
    const R = this.root, st = () => this.state;
    R.addEventListener("input", e => {
      const el = e.target, p = el.dataset && el.dataset.bind; if (!p) return;
      let v = el.value; if (el.hasAttribute("data-num")) v = Math.max(0, Math.min(2, parseInt(v, 10) || 0));
      this.setPath(p, v); this.save();
      if (p === "pilot.name" || p === "ms.name") this.renderLink();
      if (p.startsWith("ms.weapons") || p.startsWith("ms.dmg")) this.renderCombat();
    });
    R.addEventListener("focusin", e => { const row = e.target.closest && e.target.closest(".dcon"); if (row && row.dataset.slot !== this.activeDmg) { this.activeDmg = row.dataset.slot; this.renderDamage(); } });
    R.addEventListener("change", e => {
      const el = e.target;
      if (el.dataset.tier) { st().pilot.skills[el.dataset.tier][+el.dataset.idx] = el.value; this.renderPyramid(); this.renderDerived(); this.save(); }
      else if (el.dataset.bind && el.dataset.bind.startsWith("ms.weapons")) { if (el.hasAttribute("data-num")) el.value = this.getPath(el.dataset.bind); this.renderCombat(); }
      else if (el.dataset.id === "ms-cls") { st().ms.cls = el.value; let lost = 0; Object.values(st().ms.dmg).forEach(d => { if (d.loc && !this.zoneOk(d.loc)) { d.loc = ""; lost++; } }); if (lost) ui.notifications.info(`${lost} local${lost > 1 ? "is" : ""} de avaria não existe${lost > 1 ? "m" : ""} neste corpo e foi${lost > 1 ? "ram" : ""} limpo${lost > 1 ? "s" : ""}.`); this.renderImages(); Object.keys(st().ms.sys).forEach(k => st().ms.sys[k] = Math.min(st().ms.sys[k], sysMax(k, el.value))); this.renderSys(); this.renderDerived(); this.save(); }
    });
    R.addEventListener("click", e => {
      const row = e.target.closest(".dcon");
      if (row && !e.target.closest("button") && row.dataset.slot !== this.activeDmg) { this.activeDmg = row.dataset.slot; this.renderDamage(); }
      const t = e.target.closest("button"); if (!t || !R.contains(t)) return;
      const d = t.dataset, s = st();
      const edit = this.app.isEditable;
      if (d.view) return this.setView(d.view);
      if (d.goto) { const sec = this.$(`[data-sec="${d.goto}"]`); if (sec) sec.scrollIntoView({behavior: this.RM ? "auto" : "smooth", block: "start"}); return; }
      if (d.show) { s.show = d.show; this.renderShow(); return; }
      if (t.dataset.id === "cockpit") { s.cockpit = !s.cockpit; this.renderCockpit(true); if (edit) this.save(); return; }
      if (d.opp != null) { s.opp = +d.opp; this.renderCombat(); if (edit) this.save(); return; }
      if (d.tile != null) return this.rollAction(+d.tile);
      if (d.roll != null) { if (d.roll) this.roll(d.roll, [this.P(d.roll)]); return; }
      if (d.prompt) { game.clipboard.copyPlainText(this.buildPrompt(d.prompt)); ui.notifications.info(d.prompt === "pilot" ? "Prompt do retrato copiado." : "Prompt da máquina copiado."); return; }
      if (d.act === "roll4") return this.roll("4dF", []);
      if (!edit) return;
      if (d.build) this.openBuilder(d.build);
      else if (t.dataset.id === "trade") { s.pilot.trade = !s.pilot.trade; this.renderDerived(); this.save(); }
      else if (d.fac) { s.faction = d.fac; this.renderFaction(); this.save(); }
      else if (d.fp) { s.pilot.fp = Math.max(0, s.pilot.fp + (+d.fp)); this.renderFP(); this.save(); }
      else if (d.nt != null) { const i = +d.nt, on = !s.pilot.aspects[i].nt; s.pilot.aspects.forEach(a => a.nt = false); s.pilot.aspects[i].nt = on; this.renderNT(on ? i : null); this.save(); }
      else if (d.box) { if (t.disabled) return; const v = !this.getPath(d.box); this.setPath(d.box, v ? 1 : 0); t.setAttribute("aria-pressed", String(v)); this.save(); }
      else if (d.sys) { const k = d.sys, nv = s.ms.sys[k] + (+d.d); if (nv < 0 || nv > sysMax(k, s.ms.cls)) return; if (+d.d > 0 && this.sysUsed() >= PTS) return; s.ms.sys[k] = nv; this.renderSys(); this.renderDerived(); this.save(); }
      else if (d.zone) { if (this.activeDmg === "sh") { ui.notifications.info("O escudo não tem local. Escolha outra linha de avaria."); return; } const slot = s.ms.dmg[this.activeDmg]; slot.loc = slot.loc === d.zone ? "" : d.zone; this.renderDamage(); this.renderSys(); this.renderCombat(); this.save(); }
      else if (d.clearloc) { s.ms.dmg[d.clearloc].loc = ""; this.activeDmg = d.clearloc; this.renderDamage(); this.renderSys(); this.renderCombat(); this.save(); }
      else if (d.addStunt) { const w = d.addStunt, L = w === "pilot" ? P_ST : M_ST, id = this.$("#lib-" + w).value; if (s[w].stunts.some(x => x.id === id)) { ui.notifications.info("Essa façanha já está na ficha."); return; } s[w].stunts.push(lib(L, id)); this.renderStunts(w); this.renderDerived(); this.save(); }
      else if (d.blankStunt) { const w = d.blankStunt; s[w].stunts.push({n:"", d:""}); this.renderStunts(w); this.renderDerived(); this.save(); const ins = this.$$(`[data-id='st-${w}'] .stunt input`); if (ins.length) ins[ins.length - 1].focus(); }
      else if (d.delStunt) { s[d.delStunt].stunts.splice(+d.i, 1); this.renderStunts(d.delStunt); this.renderDerived(); this.save(); }
      else if (d.delW != null) { s.ms.weapons.splice(+d.delW, 1); this.renderWeapons(); this.renderCombat(); this.save(); }
      else if (d.pick) this.pickImage(d.pick);
      else if (d.rmimg) { s.ms.img = ""; this.renderImages(); this.save(); }
      else if (d.act === "add-w") { s.ms.weapons.push({n:"", sk:"Atirar", w:2, r:"1", note:""}); this.renderWeapons(); this.save(); const ins = this.$$("[data-id='wpn'] .nm"); if (ins.length) ins[ins.length - 1].focus(); }
      else if (d.act === "example") { this.state = example(); this.renderAll(); this.save(); ui.notifications.info("Exemplo carregado: Lalah Sune e MAN-08 Elmeth."); }
      else if (d.act === "new") this.arm(t, "Nova ficha", "Confirmar: apagar tudo", () => { const f = s.faction; this.state = blank(); this.state.faction = f; this.state.pilot.name = this.actor.name; this.renderAll(); this.save(); });
      else if (d.act === "eject") this.arm(t, "Ejetar", "Confirmar ejeção", () => { const nd = this.dslots().filter(([k]) => s.ms.dmg[k].t || s.ms.dmg[k].loc).length; s.pilot.fp += 1 + nd; s.cockpit = false; this.renderFP(); this.renderCockpit(false); this.save();
        ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="fg-chat"><div class="fg-chat-t">Ejetou</div><div class="fg-chat-b">+${1 + nd} pontos de destino. A campanha ganha o aspecto Sem máquina.</div></div>`}); });
    });
    this.trayEl.addEventListener("click", e => {
      const t = e.target.closest("button"); if (!t) return;
      const a = t.dataset.act;
      if (a === "roll4") this.roll("4dF", []);
      else if (a === "close-tray") { this.token++; this.t$("#tray-card").hidden = true; this.t$(".pill").hidden = false; }
      else if (a === "invoke") this.invoke();
      else if (a === "reroll") this.reroll();
    });
  }
}

/* ---------------- a ficha no Foundry ---------------- */
class FateGundamSheet extends foundry.applications.sheets.ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["fate-gundam-sheet"],
    tag: "div",
    position: {width: 1120, height: 860},
    window: {resizable: true, icon: "fa-solid fa-robot"}
  };

  async _renderHTML(context, options) { return null; }

  _replaceHTML(result, content, options) {
    if (!this.ui || !content.querySelector(".fg")) {
      content.innerHTML = template();
      let tray = this.element.querySelector(":scope > .fg-tray");
      if (!tray) { tray = document.createElement("div"); tray.className = "fg-tray"; this.element.appendChild(tray); }
      tray.innerHTML = TRAY;
      let builder = this.element.querySelector(":scope > .fg-builder");
      if (!builder) { builder = document.createElement("div"); builder.className = "fg-builder"; builder.hidden = true; this.element.appendChild(builder); }
      builder.innerHTML = BUILDER;
      this.ui = new SheetUI(this, content, tray, builder);
      this.ui.init();
      return;
    }
    // Atualizações que a própria ficha acabou de salvar não precisam redesenhar (preserva o foco).
    if (Date.now() - (this._lastSave || 0) < 2000) { this.ui.renderImages(); return; }
    this.ui.load(); this.ui.renderAll();
  }

  async close(options) {
    if (this.ui) await this.ui.flush().catch(() => {});
    return super.close(options);
  }
}

Hooks.once("init", () => {
  foundry.documents.collections.Actors.registerSheet(MOD, FateGundamSheet, {label: "Ficha Fate Gundam", makeDefault: false});
});
