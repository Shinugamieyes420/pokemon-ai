import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'menu' | 'battle' | 'lab' | 'help';
type Role = 'ranged' | 'melee' | 'tank' | 'generator';
type StatBlock = { hp:number; attack:number; defense:number; specialAttack:number; specialDefense:number; speed:number };
type PokemonDef = { id:number; name:string; types:string[]; stats:StatBlock; sprite:string; role:Role; cost:number; cooldown:number; maxHp:number; damage:number; range:number; attackEvery:number; moveSpeed:number; attackType:string; power:number };
type Unit = PokemonDef & { uid:number; lane:number; col:number; x:number; y:number; hp:number; attackClock:number; auraClock:number; flash:number };
type Enemy = PokemonDef & { uid:number; lane:number; x:number; y:number; hp:number; scaledHp:number; attackClock:number; wave:number; flash:number; elite:boolean };
type Orb = { uid:number; x:number; y:number; value:number; ttl:number; vy:number };
type Shot = { uid:number; x:number; y:number; lane:number; vx:number; damage:number; type:string; targetId:number; ttl:number };
type FxText = { uid:number; x:number; y:number; text:string; ttl:number; kind:'good'|'bad'|'neutral' };
type GameState = {
  aura:number; wave:number; hearts:number; score:number; selected:number; units:Unit[]; enemies:Enemy[]; orbs:Orb[]; shots:Shot[]; texts:FxText[];
  uid:number; time:number; uiClock:number; orbClock:number; spawnClock:number; waveSpawned:number; waveTarget:number; intermission:number; gameOver:''|'VICTORY'|'DEFEAT'; cooldowns:Record<number,number>; guards:boolean[];
};

const API = 'https://pokeapi.co/api/v2/pokemon/';
const ART = (id:number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const DEFENDER_IDS = [1,25,7,4,74,63,133,152,258,390,387,143];
const ENEMY_IDS = [19,41,27,56,66,81,92,109,111,125,215,246,143,94];
const ALL_IDS = [...new Set([...DEFENDER_IDS, ...ENEMY_IDS])];

const fallback:Record<number,{name:string;types:string[];stats:StatBlock}> = {
  1:{name:'Bulbasaur',types:['grass','poison'],stats:{hp:45,attack:49,defense:49,specialAttack:65,specialDefense:65,speed:45}},
  4:{name:'Charmander',types:['fire'],stats:{hp:39,attack:52,defense:43,specialAttack:60,specialDefense:50,speed:65}},
  7:{name:'Squirtle',types:['water'],stats:{hp:44,attack:48,defense:65,specialAttack:50,specialDefense:64,speed:43}},
  19:{name:'Rattata',types:['normal'],stats:{hp:30,attack:56,defense:35,specialAttack:25,specialDefense:35,speed:72}},
  25:{name:'Pikachu',types:['electric'],stats:{hp:35,attack:55,defense:40,specialAttack:50,specialDefense:50,speed:90}},
  27:{name:'Sandshrew',types:['ground'],stats:{hp:50,attack:75,defense:85,specialAttack:20,specialDefense:30,speed:40}},
  41:{name:'Zubat',types:['poison','flying'],stats:{hp:40,attack:45,defense:35,specialAttack:30,specialDefense:40,speed:55}},
  56:{name:'Mankey',types:['fighting'],stats:{hp:40,attack:80,defense:35,specialAttack:35,specialDefense:45,speed:70}},
  63:{name:'Abra',types:['psychic'],stats:{hp:25,attack:20,defense:15,specialAttack:105,specialDefense:55,speed:90}},
  66:{name:'Machop',types:['fighting'],stats:{hp:70,attack:80,defense:50,specialAttack:35,specialDefense:35,speed:35}},
  74:{name:'Geodude',types:['rock','ground'],stats:{hp:40,attack:80,defense:100,specialAttack:30,specialDefense:30,speed:20}},
  81:{name:'Magnemite',types:['electric','steel'],stats:{hp:25,attack:35,defense:70,specialAttack:95,specialDefense:55,speed:45}},
  92:{name:'Gastly',types:['ghost','poison'],stats:{hp:30,attack:35,defense:30,specialAttack:100,specialDefense:35,speed:80}},
  94:{name:'Gengar',types:['ghost','poison'],stats:{hp:60,attack:65,defense:60,specialAttack:130,specialDefense:75,speed:110}},
  109:{name:'Koffing',types:['poison'],stats:{hp:40,attack:65,defense:95,specialAttack:60,specialDefense:45,speed:35}},
  111:{name:'Rhyhorn',types:['ground','rock'],stats:{hp:80,attack:85,defense:95,specialAttack:30,specialDefense:30,speed:25}},
  125:{name:'Electabuzz',types:['electric'],stats:{hp:65,attack:83,defense:57,specialAttack:95,specialDefense:85,speed:105}},
  133:{name:'Eevee',types:['normal'],stats:{hp:55,attack:55,defense:50,specialAttack:45,specialDefense:65,speed:55}},
  143:{name:'Snorlax',types:['normal'],stats:{hp:160,attack:110,defense:65,specialAttack:65,specialDefense:110,speed:30}},
  152:{name:'Chikorita',types:['grass'],stats:{hp:45,attack:49,defense:65,specialAttack:49,specialDefense:65,speed:45}},
  215:{name:'Sneasel',types:['dark','ice'],stats:{hp:55,attack:95,defense:55,specialAttack:35,specialDefense:75,speed:115}},
  246:{name:'Larvitar',types:['rock','ground'],stats:{hp:50,attack:64,defense:50,specialAttack:45,specialDefense:50,speed:41}},
  258:{name:'Mudkip',types:['water'],stats:{hp:50,attack:70,defense:50,specialAttack:50,specialDefense:50,speed:40}},
  387:{name:'Turtwig',types:['grass'],stats:{hp:55,attack:68,defense:64,specialAttack:45,specialDefense:55,speed:31}},
  390:{name:'Chimchar',types:['fire'],stats:{hp:44,attack:58,defense:44,specialAttack:58,specialDefense:44,speed:61}},
};

const chart:Record<string,Record<string,number>> = {
  normal:{rock:.5,ghost:0,steel:.5}, fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2}, water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},
  electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5}, grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
  ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5}, fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},
  poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2}, ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
  flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5}, psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
  bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5}, rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},
  ghost:{normal:0,psychic:2,ghost:2,dark:.5}, dragon:{dragon:2,steel:.5,fairy:0}, dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},
  steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2}, fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5},
};

const typeColor:Record<string,string> = {normal:'#a8a77a',fire:'#ee8130',water:'#6390f0',electric:'#f7d02c',grass:'#7ac74c',ice:'#96d9d6',fighting:'#c22e28',poison:'#a33ea1',ground:'#e2bf65',flying:'#a98ff3',psychic:'#f95587',bug:'#a6b91a',rock:'#b6a136',ghost:'#735797',dragon:'#6f35fc',dark:'#705746',steel:'#b7b7ce',fairy:'#d685ad'};
const clamp = (n:number,a:number,b:number) => Math.max(a,Math.min(b,n));
const cap = (s:string) => s.charAt(0).toUpperCase()+s.slice(1);
const eff = (attackType:string, defenderTypes:string[]) => defenderTypes.reduce((m,t)=>m*(chart[attackType]?.[t] ?? 1),1);

function modelPokemon(id:number, raw?:any):PokemonDef {
  const fb = fallback[id] || {name:`Pokemon ${id}`,types:['normal'],stats:{hp:50,attack:50,defense:50,specialAttack:50,specialDefense:50,speed:50}};
  const get = (name:string,key:keyof StatBlock) => raw?.stats?.find((x:any)=>x.stat.name===name)?.base_stat ?? fb.stats[key];
  const stats:StatBlock = {hp:get('hp','hp'),attack:get('attack','attack'),defense:get('defense','defense'),specialAttack:get('special-attack','specialAttack'),specialDefense:get('special-defense','specialDefense'),speed:get('speed','speed')};
  const types = (raw?.types?.slice().sort((a:any,b:any)=>a.slot-b.slot).map((x:any)=>x.type.name) || fb.types) as string[];
  const bst = Object.values(stats).reduce((a,b)=>a+b,0), bulk = stats.hp+stats.defense+stats.specialDefense;
  let role:Role = stats.specialAttack >= stats.attack*1.18 ? 'ranged' : (stats.defense>=85 || stats.hp>=100 ? 'tank' : 'melee');
  if ([1,152,387].includes(id)) role='generator';
  const offense = role==='ranged' ? stats.specialAttack : stats.attack;
  const power = Math.round(bst*.18 + Math.max(stats.attack,stats.specialAttack)*.35 + bulk*.08 + stats.speed*.12);
  const cost = role==='generator' ? 75 : Math.round(clamp(55+power*.7,75,225)/25)*25;
  return {
    id, name:cap(raw?.name || fb.name), types, stats, sprite:raw?.sprites?.other?.['official-artwork']?.front_default || ART(id), role, cost,
    cooldown:clamp(3.8+power/32,4.5,10.5), maxHp:Math.round(100+stats.hp*4+(stats.defense+stats.specialDefense)*1.15),
    damage:Math.round(8+offense*.23+power*.055), range:role==='ranged'?460:role==='generator'?430:role==='tank'?145:180,
    attackEvery:clamp(1.6-stats.speed/190,.62,1.5), moveSpeed:14+stats.speed*.10, attackType:types[0] || 'normal', power
  };
}

async function fetchPokemon(ids:number[]) {
  const out:Record<number,PokemonDef> = {};
  await Promise.all(ids.map(async id => {
    try { const r=await fetch(API+id); if(!r.ok) throw new Error(); out[id]=modelPokemon(id,await r.json()); }
    catch { out[id]=modelPokemon(id); }
  }));
  return out;
}

export default function App(){
  const [screen,setScreen]=useState<Screen>('menu');
  const [catalog,setCatalog]=useState<Record<number,PokemonDef>>(()=>Object.fromEntries(ALL_IDS.map(id=>[id,modelPokemon(id)])));
  const [loading,setLoading]=useState(true);
  const [deck,setDeck]=useState<number[]>([1,25,7,4,74,63]);
  const [battleKey,setBattleKey]=useState(0);
  useEffect(()=>{let alive=true;fetchPokemon(ALL_IDS).then(x=>{if(alive){setCatalog(x);setLoading(false)}});return()=>{alive=false}},[]);
  const start=()=>{setBattleKey(k=>k+1);setScreen('battle')};
  if(screen==='battle') return <Battle key={battleKey} catalog={catalog} deck={deck} onExit={()=>setScreen('menu')} onRestart={start}/>;
  if(screen==='lab') return <Lab catalog={catalog} deck={deck} setDeck={setDeck} onBack={()=>setScreen('menu')}/>;
  if(screen==='help') return <Help onBack={()=>setScreen('menu')}/>;
  return <main className="menuShell"><div className="menuBackdrop"/><section className="heroCard"><div className="eyebrow">FAN GAME • LANE DEFENSE</div><h1>POKÉMON<br/><span>LANE CLASH</span></h1><p className="tagline">Build a six-Pokémon squad and defend five lanes using real base stats and type matchups.</p><div className="menuButtons"><button className="primary" onClick={start}>▶ START BATTLE</button><button onClick={()=>setScreen('lab')}>⚙ TEAM LAB</button><button onClick={()=>setScreen('help')}>? HOW TO PLAY</button></div><div className="statusLine"><span className={loading?'dot amber':'dot green'}/>{loading?'Refreshing PokéAPI data…':'PokéAPI data ready'} · v0.1.1 stable layout</div></section><section className="menuSquad">{deck.map(id=><div className="menuMon" key={id}><img src={catalog[id]?.sprite||ART(id)}/><b>{catalog[id]?.name}</b></div>)}</section><footer>Unofficial fan prototype · Data: PokéAPI</footer></main>;
}

function Lab({catalog,deck,setDeck,onBack}:{catalog:Record<number,PokemonDef>,deck:number[],setDeck:(d:number[])=>void,onBack:()=>void}){
  const toggle=(id:number)=>{if(deck.includes(id)){if(deck.length>1)setDeck(deck.filter(x=>x!==id))}else if(deck.length<6)setDeck([...deck,id])};
  return <main className="panelShell"><header className="topNav"><button onClick={onBack}>← BACK</button><div><b>TEAM LAB</b><small>{deck.length}/6 selected</small></div><span>PokéAPI stats → lane-defense values</span></header><div className="labGrid">{DEFENDER_IDS.map(id=>{const p=catalog[id],chosen=deck.includes(id);return <button key={id} className={`pokeCard ${chosen?'chosen':''}`} onClick={()=>toggle(id)}><div className="cardTop"><span>#{String(id).padStart(3,'0')}</span><span className={`role ${p.role}`}>{p.role}</span></div><img src={p.sprite}/><h3>{p.name}</h3><div className="types">{p.types.map(t=><i key={t} style={{background:typeColor[t]||'#777'}}>{t}</i>)}</div><div className="miniStats"><span>HP <b>{p.maxHp}</b></span><span>DMG <b>{p.damage}</b></span><span>AURA <b>{p.cost}</b></span><span>CD <b>{p.cooldown.toFixed(1)}s</b></span></div></button>})}</div></main>;
}

function Help({onBack}:{onBack:()=>void}){
  return <main className="panelShell"><header className="topNav"><button onClick={onBack}>← BACK</button><div><b>HOW TO PLAY</b><small>v0.1.1</small></div></header><section className="helpGrid"><article><h2>Build</h2><p>Select a card, then tap a free tile. Cards cost Aura and recharge after placement.</p></article><article><h2>Counter</h2><p>Attacks use the modern Pokémon type chart, including immunities and dual-type multipliers.</p></article><article><h2>Aura</h2><p>Tap cyan Aura orbs. Generator Pokémon create extra Aura over time.</p></article><article><h2>Five lanes</h2><p>Each lane has one Poké-Guard that clears the lane on its first breakthrough.</p></article><article><h2>Waves</h2><p>Survive five waves. The last enemy of wave five is an elite Gengar.</p></article><article><h2>Stability</h2><p>The battle now uses a fixed-step loop, hard object caps and no screen-shake to prevent runaway lag.</p></article></section></main>;
}

function Battle({catalog,deck,onExit,onRestart}:{catalog:Record<number,PokemonDef>,deck:number[],onExit:()=>void,onRestart:()=>void}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef<GameState|null>(null);
  const pausedRef=useRef(false);
  const [paused,setPaused]=useState(false);
  const [ui,setUi]=useState({aura:225,wave:1,hearts:3,score:0,selected:-1,gameOver:'',cooldowns:{} as Record<number,number>,guards:[true,true,true,true,true],waveSpawned:0,waveTarget:8});
  const dims=useMemo(()=>({W:1600,H:540,laneH:108,gridX:175,cellW:165,cols:7}),[]);

  const sync=useCallback((s:GameState)=>setUi({aura:Math.round(s.aura),wave:s.wave,hearts:s.hearts,score:s.score,selected:s.selected,gameOver:s.gameOver,cooldowns:{...s.cooldowns},guards:[...s.guards],waveSpawned:s.waveSpawned,waveTarget:s.waveTarget}),[]);
  const reset=useCallback(()=>{
    const s:GameState={aura:225,wave:1,hearts:3,score:0,selected:-1,units:[],enemies:[],orbs:[],shots:[],texts:[],uid:1,time:0,uiClock:0,orbClock:2.2,spawnClock:1.7,waveSpawned:0,waveTarget:8,intermission:0,gameOver:'',cooldowns:Object.fromEntries(deck.map(id=>[id,0])),guards:[true,true,true,true,true]};
    state.current=s;pausedRef.current=false;setPaused(false);sync(s);
  },[deck,sync]);
  useEffect(()=>reset(),[reset]);
  useEffect(()=>{pausedRef.current=paused},[paused]);

  const addFx=(s:GameState,x:number,y:number,text:string,kind:FxText['kind'])=>{if(s.texts.length>=28)return;s.texts.push({uid:s.uid++,x,y,text,ttl:.7,kind})};
  const hitEnemy=(s:GameState,e:Enemy,damage:number,mult:number)=>{
    if(e.hp<=0)return;e.hp-=damage;e.flash=.09;
    if(mult>=2)addFx(s,e.x,e.y-48,'SUPER!','good'); else if(mult===0)addFx(s,e.x,e.y-48,'IMMUNE','bad');
    if(e.hp<=0){e.hp=0;s.score+=Math.round(90+e.power*e.wave*(e.elite?2:1));}
  };
  const spawnEnemy=(s:GameState)=>{
    if(s.enemies.length>=26)return;
    const usable=Math.min(4+s.wave*2,ENEMY_IDS.length-2);let id=ENEMY_IDS[Math.floor(Math.random()*usable)],elite=false;
    if(s.wave===5&&s.waveSpawned===s.waveTarget-1){id=94;elite=true}else if(s.wave>=4&&Math.random()<.10){id=143;elite=true}
    const p=catalog[id]||modelPokemon(id),lane=Math.floor(Math.random()*5),scale=1+(s.wave-1)*.15+(elite?.35:0);
    s.enemies.push({...p,uid:s.uid++,lane,x:1545,y:lane*dims.laneH+dims.laneH/2,hp:p.maxHp*scale,scaledHp:p.maxHp*scale,attackClock:0,wave:s.wave,flash:0,elite});
  };

  const update=useCallback((dt:number)=>{
    const s=state.current;if(!s||s.gameOver)return;
    s.time+=dt;s.uiClock+=dt;
    for(const id of deck)s.cooldowns[id]=Math.max(0,(s.cooldowns[id]||0)-dt);

    s.orbClock-=dt;
    if(s.orbClock<=0&&s.orbs.length<8){s.orbClock=4.7+Math.random()*2.2;s.orbs.push({uid:s.uid++,x:300+Math.random()*1020,y:60+Math.random()*400,value:Math.random()<.14?50:25,ttl:8,vy:7})}

    for(const u of s.units){
      if(u.hp<=0)continue;u.attackClock=Math.max(0,u.attackClock-dt);u.flash=Math.max(0,u.flash-dt);
      if(u.role==='generator'){u.auraClock-=dt;if(u.auraClock<=0&&s.orbs.length<10){u.auraClock=11;s.orbs.push({uid:s.uid++,x:u.x+18,y:u.y-26,value:25,ttl:8,vy:-3})}}
      if(u.attackClock>0)continue;
      let target:Enemy|undefined;let best=Infinity;
      for(const e of s.enemies){if(e.hp<=0||e.lane!==u.lane||e.x<u.x-25)continue;const d=e.x-u.x;if(d<=u.range&&d<best){best=d;target=e}}
      if(!target)continue;
      u.attackClock=u.attackEvery;
      const mult=eff(u.attackType,target.types),mit=100/(100+(target.stats.defense+target.stats.specialDefense)*.22),dmg=u.damage*mit*mult*1.6;
      if(u.range>220){if(s.shots.length<70)s.shots.push({uid:s.uid++,x:u.x+34,y:u.y,lane:u.lane,vx:520,damage:dmg,type:u.attackType,targetId:target.uid,ttl:2})}
      else hitEnemy(s,target,dmg,mult);
    }

    for(const sh of s.shots){
      if(sh.ttl<=0)continue;sh.x+=sh.vx*dt;sh.ttl-=dt;
      const target=s.enemies.find(e=>e.uid===sh.targetId&&e.hp>0);
      if(target&&target.lane===sh.lane&&Math.abs(sh.x-target.x)<42){hitEnemy(s,target,sh.damage,eff(sh.type,target.types));sh.ttl=0}
    }

    const guardTriggered=new Set<number>();
    for(const e of s.enemies){
      if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);
      let blocker:Unit|undefined;let nearest=-Infinity;
      for(const u of s.units){if(u.hp<=0||u.lane!==e.lane||u.x>=e.x)continue;if(e.x-u.x<118&&u.x>nearest){nearest=u.x;blocker=u}}
      if(blocker){
        e.attackClock-=dt;
        if(e.attackClock<=0){e.attackClock=clamp(1.4-e.stats.speed/260,.68,1.35);const mult=eff(e.attackType,blocker.types),mit=100/(100+(blocker.stats.defense+blocker.stats.specialDefense)*.22),dmg=e.damage*mit*mult*1.35;blocker.hp-=dmg;blocker.flash=.1;if(mult>=2)addFx(s,blocker.x,blocker.y-44,'WEAK!','bad')}
      }else{
        e.x-=e.moveSpeed*dt*(1+s.wave*.025);
        if(e.x<92){
          if(s.guards[e.lane]){s.guards[e.lane]=false;guardTriggered.add(e.lane);addFx(s,130,e.y,'GUARD!','good')}
          else{e.hp=0;s.hearts=Math.max(0,s.hearts-1);if(s.hearts===0)s.gameOver='DEFEAT'}
        }
      }
    }
    if(guardTriggered.size){for(const e of s.enemies)if(guardTriggered.has(e.lane))e.hp=0}

    for(const o of s.orbs){o.ttl-=dt;o.y+=o.vy*dt}
    for(const t of s.texts){t.ttl-=dt;t.y-=18*dt}
    s.units=s.units.filter(u=>u.hp>0);
    s.enemies=s.enemies.filter(e=>e.hp>0);
    s.orbs=s.orbs.filter(o=>o.ttl>0).slice(-10);
    s.shots=s.shots.filter(sh=>sh.ttl>0).slice(-70);
    s.texts=s.texts.filter(t=>t.ttl>0).slice(-28);

    if(s.waveSpawned<s.waveTarget){s.spawnClock-=dt;if(s.spawnClock<=0&&s.enemies.length<22){spawnEnemy(s);s.waveSpawned++;s.spawnClock=clamp(2.7-s.wave*.2,1.35,2.6)*(.82+Math.random()*.45)}}
    else if(s.enemies.length===0){s.intermission+=dt;if(s.intermission>2.3){if(s.wave>=5){s.gameOver='VICTORY';s.score+=2500}else{s.wave++;s.waveSpawned=0;s.waveTarget=6+s.wave*2;s.intermission=0;s.spawnClock=1.7;s.aura+=75;addFx(s,800,70,`WAVE ${s.wave}`,'good')}}}

    if(s.uiClock>=.25||s.gameOver){s.uiClock=0;sync(s)}
  },[catalog,deck,dims,sync]);

  const images=useRef<Record<number,HTMLImageElement>>({});
  const imageFor=(p:PokemonDef)=>{let im=images.current[p.id];if(!im){im=new Image();im.decoding='async';im.src=p.sprite;images.current[p.id]=im}return im};
  const draw=useCallback((ctx:CanvasRenderingContext2D,cv:HTMLCanvasElement)=>{
    const s=state.current;if(!s)return;const sx=cv.width/dims.W,sy=cv.height/dims.H;ctx.setTransform(sx,0,0,sy,0,0);ctx.clearRect(0,0,dims.W,dims.H);ctx.imageSmoothingEnabled=true;
    const bg=ctx.createLinearGradient(0,0,dims.W,0);bg.addColorStop(0,'#153e2c');bg.addColorStop(.62,'#174d36');bg.addColorStop(1,'#102d35');ctx.fillStyle=bg;ctx.fillRect(0,0,dims.W,dims.H);
    for(let lane=0;lane<5;lane++){const y=lane*dims.laneH;ctx.fillStyle=lane%2?'rgba(4,25,23,.24)':'rgba(82,145,79,.13)';ctx.fillRect(0,y,dims.W,dims.laneH-2);ctx.strokeStyle='rgba(255,255,255,.075)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(dims.W,y);ctx.stroke();for(let col=0;col<dims.cols;col++){const x=dims.gridX+col*dims.cellW;ctx.strokeStyle=s.selected>=0?'rgba(139,255,179,.21)':'rgba(255,255,255,.045)';ctx.strokeRect(x+2,y+5,dims.cellW-7,dims.laneH-10)}}
    ctx.fillStyle='#081e22';ctx.fillRect(0,0,92,dims.H);ctx.fillStyle='#95b3b5';ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.fillText('BASE',46,21);
    for(let lane=0;lane<5;lane++){const y=lane*dims.laneH+dims.laneH/2;if(s.guards[lane]){ctx.fillStyle='#ef4c55';ctx.beginPath();ctx.arc(116,y,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='800 10px system-ui';ctx.fillText('G',116,y+3)}else{ctx.strokeStyle='rgba(255,255,255,.12)';ctx.strokeRect(101,y-14,29,28)}}

    const drawMon=(p:Unit|Enemy,enemy:boolean)=>{const size=enemy?((p as Enemy).elite?92:72):76;const img=imageFor(p);ctx.save();ctx.translate(p.x,p.y);if(p.flash>0){ctx.globalAlpha=.45;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,size*.52,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}if(img.complete&&img.naturalWidth)ctx.drawImage(img,-size/2,-size/2,size,size);else{ctx.fillStyle=typeColor[p.attackType]||'#aaa';ctx.beginPath();ctx.arc(0,0,size*.35,0,Math.PI*2);ctx.fill()}const max=enemy?(p as Enemy).scaledHp:p.maxHp;ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(-32,size*.44,64,5);ctx.fillStyle=enemy?'#ff666c':'#65f696';ctx.fillRect(-32,size*.44,64*clamp(p.hp/max,0,1),5);if(enemy&&(p as Enemy).elite){ctx.fillStyle='#ffd65a';ctx.font='900 10px system-ui';ctx.fillText('ELITE',0,-size*.48)}ctx.restore()};
    for(const u of s.units)drawMon(u,false);for(const e of s.enemies)drawMon(e,true);
    for(const sh of s.shots){ctx.fillStyle=typeColor[sh.type]||'#fff';ctx.beginPath();ctx.arc(sh.x,sh.y,7,0,Math.PI*2);ctx.fill();ctx.shadowColor=ctx.fillStyle as string;ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0}
    for(const o of s.orbs){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='rgba(86,238,255,.18)';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#76f7ff';ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#06333b';ctx.font='900 8px system-ui';ctx.fillText(`+${o.value}`,0,3);ctx.restore()}
    for(const t of s.texts){ctx.globalAlpha=clamp(t.ttl/.35,0,1);ctx.fillStyle=t.kind==='good'?'#7bffa6':t.kind==='bad'?'#ff8a8e':'#fff';ctx.font='900 18px system-ui';ctx.textAlign='center';ctx.fillText(t.text,t.x,t.y);ctx.globalAlpha=1}
  },[dims]);

  useEffect(()=>{
    const cv=canvasRef.current;if(!cv)return;const ctx=cv.getContext('2d');if(!ctx)return;let raf=0,last=performance.now(),acc=0;const STEP=1/60;
    const resize=()=>{const r=cv.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(2,Math.round(r.width*dpr)),h=Math.max(2,Math.round(r.height*dpr));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}};
    const ro=new ResizeObserver(resize);ro.observe(cv);resize();
    const frame=(now:number)=>{resize();let dt=Math.min((now-last)/1000,.05);last=now;if(!pausedRef.current&&!document.hidden){acc+=dt;let steps=0;while(acc>=STEP&&steps<3){update(STEP);acc-=STEP;steps++}if(steps===3)acc=0}else acc=0;draw(ctx,cv);raf=requestAnimationFrame(frame)};
    raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);ro.disconnect()};
  },[draw,update]);

  const selectPokemon=(index:number)=>{const s=state.current;if(!s||s.gameOver)return;s.selected=s.selected===index?-1:index;sync(s)};
  const onArenaPointer=(ev:React.PointerEvent<HTMLCanvasElement>)=>{
    const s=state.current,cv=canvasRef.current;if(!s||!cv||s.gameOver||pausedRef.current)return;const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*dims.W,y=(ev.clientY-r.top)/r.height*dims.H;
    for(let i=s.orbs.length-1;i>=0;i--){const o=s.orbs[i];if((x-o.x)**2+(y-o.y)**2<34**2){s.aura+=o.value;s.orbs.splice(i,1);sync(s);return}}
    if(s.selected<0)return;const id=deck[s.selected],p=catalog[id];if(!p||s.aura<p.cost||(s.cooldowns[id]||0)>0)return;const lane=Math.floor(y/dims.laneH),col=Math.floor((x-dims.gridX)/dims.cellW);if(lane<0||lane>4||col<0||col>=dims.cols)return;
    if(s.units.some(u=>u.lane===lane&&u.col===col))return;const ux=dims.gridX+col*dims.cellW+dims.cellW/2,uy=lane*dims.laneH+dims.laneH/2;s.units.push({...p,uid:s.uid++,lane,col,x:ux,y:uy,hp:p.maxHp,attackClock:.25,auraClock:7,flash:0});s.aura-=p.cost;s.cooldowns[id]=p.cooldown;s.selected=-1;sync(s);
  };

  const waveProgress=clamp(ui.waveSpawned/Math.max(1,ui.waveTarget),0,1);
  return <main className="battleShell">
    <header className="battleHud">
      <div className="auraHud"><b>✦ {ui.aura}</b><small>AURA</small></div>
      <div className="waveHud"><div className="waveLine"><b>WAVE {ui.wave}/5</b><span>{ui.waveSpawned}/{ui.waveTarget}</span></div><div className="waveTrack"><i style={{width:`${waveProgress*100}%`}}/></div></div>
      <div className="heartHud" aria-label={`${ui.hearts} hearts`}>{[0,1,2].map(i=><span key={i} className={i<ui.hearts?'alive':''}>♥</span>)}</div>
      <div className="scoreHud"><small>SCORE</small><b>{ui.score}</b></div>
      <button className="pauseBtn" onClick={()=>setPaused(true)}>Ⅱ</button>
    </header>
    <section className="arenaWrap"><canvas ref={canvasRef} onPointerDown={onArenaPointer}/></section>
    <section className="deckBar">
      <div className="deckCards">{deck.map((id,index)=>{const p=catalog[id],cd=ui.cooldowns[id]||0,disabled=ui.aura<p.cost||cd>0;return <button key={id} className={`deckCard ${ui.selected===index?'selected':''} ${disabled?'disabled':''}`} onClick={()=>selectPokemon(index)}><img src={p.sprite}/><div className="deckInfo"><b>{p.name}</b><span>{p.role}</span><strong>✦{p.cost}</strong></div>{cd>0&&<em>{cd.toFixed(1)}</em>}<i className="typeStrip" style={{background:typeColor[p.attackType]||'#777'}}/></button>})}</div>
      <aside className="guardLegend"><b>POKÉ-GUARDS</b><span>{ui.guards.map((on,i)=><i className={on?'on':''} key={i}>{i+1}</i>)}</span></aside>
    </section>
    {(paused||ui.gameOver)&&<div className="pauseOverlay"><section>{ui.gameOver?<><div className={`result ${ui.gameOver==='VICTORY'?'win':'lose'}`}>{ui.gameOver}</div><p>Score {ui.score}</p><button className="primary" onClick={onRestart}>PLAY AGAIN</button><button onClick={onExit}>MAIN MENU</button></>:<><h2>PAUSED</h2><p>Game simulation is stopped.</p><button className="primary" onClick={()=>setPaused(false)}>RESUME</button><button onClick={onRestart}>RESTART</button><button onClick={onExit}>MAIN MENU</button></>}</section></div>}
  </main>;
}
