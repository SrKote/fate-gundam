import assert from 'node:assert/strict';
import '../scripts/equipment.js';
const G=globalThis.FGEquipment;
const legacy=()=>({v:2,pilot:{aspects:[{nt:false}],stunts:[],name:'Piloto preservado',fp:3},ms:{name:'Minha máquina',cls:'massa',stunts:[],weapons:[{n:'Arma antiga',sk:'Atirar',w:2,r:'2',note:'Texto preservado'}],sys:{mob:1,mira:1,comb:1,sens:1,estr:1},stress:[1,0],dmg:{l:{t:'Dano preservado',loc:'Cabeça'},sh:{t:'Escudo destruído',loc:''}}},opp:2});
let s=G.migrate(legacy());
assert.equal(s.ms.weapons[0].note,'Texto preservado');
const migrated=JSON.stringify(s);G.migrate(s);assert.equal(JSON.stringify(s),migrated,'migration must be idempotent');
for(const key of ['zaku','gelgoog']){
 s=G.migrate(legacy());const pilot=JSON.stringify(s.pilot),systems=JSON.stringify(s.ms.sys),damage=JSON.stringify(s.ms.dmg);
 G.applyKit(s,key);assert.equal(G.load(s,'ms'),6);assert.equal(JSON.stringify(s.pilot),pilot);assert.equal(JSON.stringify(s.ms.sys),systems);assert.equal(JSON.stringify(s.ms.dmg),damage);assert.equal(s.ms.name,'Minha máquina');
 G.applyKit(s,key);assert.equal(s.ms.stunts.filter(x=>x.id==='escudo').length,1);
}
s=G.migrate(legacy());s.ms.stunts=[{id:'one'},{id:'two'}];G.applyKit(s,'zaku');assert.equal(s.ms.stunts.length,2,'kit cannot create a third stunt');
const beam=G.add(s,'ms',G.CATALOG.ms.find(x=>x.id==='beam-rifle'));assert.match(G.blocked(s,'ms',beam),/conversão/);s.ms.beamConversion=true;assert.equal(G.blocked(s,'ms',beam),'');
const anti=G.add(s,'pilot',G.CATALOG.pilot.find(x=>x.id==='antims'));assert.equal(G.threat(s,'pilot',anti),2);assert.equal(G.scale(s,'pilot'),0);
assert.equal(G.resolve(4,3,2,1).stress,2);assert.equal(G.resolve(3,3,2,0).stress,2,'weapon damage on tie');assert.equal(G.resolve(2,3,2,0).stress,0,'miss cannot be rescued by weapon damage');assert.equal(G.resolve(3,3,1,1).text,'Impulso; sem estresse');
assert.equal(G.resolve(4,3,2,0,-2).stress,0,'larger target adds defense');assert.equal(G.resolve(4,3,2,0,2).stress,7,'larger attacker adds damage');
const vest=G.CATALOG.pilot.find(x=>x.id==='vest');G.add(s,'pilot',vest);G.add(s,'pilot',vest);assert.equal(G.armor(s,'pilot','ballistic',0),1);assert.equal(G.armor(s,'pilot','beam',0),0);assert.equal(G.armor(s,'pilot','ballistic',2),0);
const grenade=G.add(s,'pilot',G.CATALOG.pilot.find(x=>x.id==='grenade'));grenade.uses=0;assert.equal(G.blocked(s,'pilot',grenade),'Sem usos');
const before=G.load(s,'pilot');grenade.location='stored';assert.equal(G.load(s,'pilot'),before-grenade.load);
const willTool=G.add(s,'pilot',{n:'Ferramenta especial',kind:'tool',sk:'Vontade'});assert.equal(G.blocked(s,'pilot',willTool),'','personal tools do not require a psychommu');
const bits=G.add(s,'ms',{n:'Bits',kind:'weapon',sk:'Vontade'});assert.match(G.blocked(s,'ms',bits),/Newtype/);
s.ms.cls='nave';assert.throws(()=>G.applyKit(s,'zaku'),/mobile suit/);
console.log('Equipment tests passed: migration, kits, load, compatibility, damage, scale, armor, consumables.');
