import React, { useState, useEffect, useRef } from 'react';
import { BattlePokemon, Move, StatusCondition, VolatileStatus } from '../types';
import { fetchRandomPokemon, getMoveData, calculateDamage, getPokemonList, fetchSpecificPokemon, fetchPokemonByType } from '../services/pokeService';
import { Loader2, CircleDot, Music, VolumeX, CheckCircle2, ChevronRight, ChevronLeft, Flame, Zap, Search, Sword, Backpack, Users, LogOut, Play } from 'lucide-react';

interface BattleProps {
  onBack: () => void;
  isEliteFour?: boolean;
  onComplete?: () => void;
}

type BattlePhase = 
  | 'SELECTION'
  | 'STORY_INTRO'
  | 'LOADING'
  | 'PRE_BATTLE_WAIT'
  | 'TRAINER_INTRO' 
  | 'TRASH_TALK'
  | 'SEND_OUT_ENEMY' 
  | 'SEND_OUT_PLAYER' 
  | 'COMBAT_MENU' 
  | 'FIGHT_MENU'
  | 'SWITCH_MENU'
  | 'COMBAT_ANIM' 
  | 'SWITCH_ENEMY' 
  | 'SWITCH_PLAYER'
  | 'FORCE_SWITCH_PLAYER'
  | 'VICTORY' 
  | 'DEFEAT'
  | 'NEXT_BATTLE_TRANSITION';

const GYM_LEADERS = [
  { name: "Brock", type: "rock", sprite: "https://play.pokemonshowdown.com/sprites/trainers/brock.png", bg: "bg-gym-rock", badge: "Boulder Badge", taunt: "My rock hard will crush you, little boy!" },
  { name: "Misty", type: "water", sprite: "https://play.pokemonshowdown.com/sprites/trainers/misty.png", bg: "bg-gym-water", badge: "Cascade Badge", taunt: "Are you ready to cry? You little baby!" },
  { name: "Lt. Surge", type: "electric", sprite: "https://play.pokemonshowdown.com/sprites/trainers/ltsurge.png", bg: "bg-gym-electric", badge: "Thunder Badge", taunt: "Get out of my face, maggot!" },
  { name: "Erika", type: "grass", sprite: "https://play.pokemonshowdown.com/sprites/trainers/erika.png", bg: "bg-gym-grass", badge: "Rainbow Badge", taunt: "You're not welcome here, loser." },
  { name: "Koga", type: "poison", sprite: "https://play.pokemonshowdown.com/sprites/trainers/koga.png", bg: "bg-gym-poison", badge: "Soul Badge", taunt: "Prepare to suffer, you weakling!" },
  { name: "Sabrina", type: "psychic", sprite: "https://play.pokemonshowdown.com/sprites/trainers/sabrina.png", bg: "bg-gym-psychic", badge: "Marsh Badge", taunt: "I foresaw your defeat, idiot." },
  { name: "Blaine", type: "fire", sprite: "https://play.pokemonshowdown.com/sprites/trainers/blaine.png", bg: "bg-gym-fire", badge: "Volcano Badge", taunt: "You're gonna get burned, punk!" },
  { name: "Giovanni", type: "ground", sprite: "https://play.pokemonshowdown.com/sprites/trainers/giovanni.png", bg: "bg-gym-ground", badge: "Earth Badge", taunt: "This is the end for you, trash!" },
];

const ELITE_FOUR = [
  { name: "Lorelei", type: "ice", sprite: "https://play.pokemonshowdown.com/sprites/trainers/lorelei.png", bg: "bg-gym-water", badge: "Elite 4 Member", taunt: "Freezing your pathetic team!" },
  { name: "Bruno", type: "fighting", sprite: "https://play.pokemonshowdown.com/sprites/trainers/bruno.png", bg: "bg-gym-rock", badge: "Elite 4 Member", taunt: "Hoo hah! I'll smash you!" },
  { name: "Agatha", type: "ghost", sprite: "https://play.pokemonshowdown.com/sprites/trainers/agatha.png", bg: "bg-gym-psychic", badge: "Elite 4 Member", taunt: "Show some respect to your elders, brat!" },
  { name: "Lance", type: "dragon", sprite: "https://play.pokemonshowdown.com/sprites/trainers/lance.png", bg: "bg-gym-fire", badge: "Elite 4 Member", taunt: "Dragons are superior, you are nothing!" },
  { name: "Champion Blue", type: "random", sprite: "https://play.pokemonshowdown.com/sprites/trainers/blue.png", bg: "bg-gym-electric", badge: "Champion Title", taunt: "Smell ya later, loser!" },
];

const PLAYER_SPRITE = "https://play.pokemonshowdown.com/sprites/trainers/red.png";
const REAL_BATTLE_MUSIC = "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3"; 

export const Battle: React.FC<BattleProps> = ({ onBack, isEliteFour, onComplete }) => {
  const [playerTeam, setPlayerTeam] = useState<BattlePokemon[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<BattlePokemon[]>([]);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionPage, setSelectionPage] = useState(1);
  const [selectionSearch, setSelectionSearch] = useState("");
  const [viewList, setViewList] = useState<any[]>([]);

  // Story Progress
  const [activeTrainers, setActiveTrainers] = useState(isEliteFour ? ELITE_FOUR : GYM_LEADERS);
  const [currentTrainerIdx, setCurrentTrainerIdx] = useState(0);
  
  // Active Indices
  const [pIdx, setPIdx] = useState(0);
  const [eIdx, setEIdx] = useState(0);

  // State
  const [phase, setPhase] = useState<BattlePhase>('SELECTION');
  const [battleLog, setBattleLog] = useState<string>("Choose 6 Pokemon for your team!");
  const [animating, setAnimating] = useState(false); 
  const [moveTypeAnim, setMoveTypeAnim] = useState<string | null>(null);
  const [targetAnim, setTargetAnim] = useState<'player' | 'enemy' | null>(null);
  const [damageAnim, setDamageAnim] = useState<'player' | 'enemy' | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const phaseRef = useRef<BattlePhase>('SELECTION'); 

  // Update Ref whenever phase changes
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const list = getPokemonList(selectionPage, 48, selectionSearch);
    setViewList(list);
  }, [selectionPage, selectionSearch]);

  useEffect(() => {
    audioRef.current = new Audio(REAL_BATTLE_MUSIC);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
        if (!isMuted) {
            audioRef.current.pause();
        } else if (phase !== 'SELECTION' && phase !== 'STORY_INTRO' && phase !== 'VICTORY' && phase !== 'PRE_BATTLE_WAIT') {
            audioRef.current.play().catch(console.error);
        }
    }
    setIsMuted(!isMuted);
  };

  const handleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(prev => prev.filter(p => p !== id));
    } else {
        if (selectedIds.length < 6) setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectionSearch(e.target.value);
      setSelectionPage(1);
  };

  const startStory = () => {
      setPhase('STORY_INTRO');
  };

  const initBattle = async () => {
      setPhase('LOADING');
      try {
        if (playerTeam.length === 0) {
            const pTeam = await fetchSpecificPokemon(selectedIds);
            setPlayerTeam(pTeam);
        }
        const trainer = activeTrainers[currentTrainerIdx];
        let eTeam;
        if (trainer.type === 'random') {
             eTeam = await fetchRandomPokemon(6);
        } else {
             eTeam = await fetchPokemonByType(trainer.type, 6);
        }
        setEnemyTeam(eTeam);
        setEIdx(0);
        setPhase('PRE_BATTLE_WAIT');
      } catch (e) {
          console.error(e);
          setBattleLog("Error loading battle.");
      }
  };

  const startBattleSequence = () => {
      if (audioRef.current && !isMuted) {
          audioRef.current.play().catch(console.error);
      }
      setPhase('TRAINER_INTRO');
      setBattleLog(`${activeTrainers[currentTrainerIdx].name} wants to battle!`);
  };

  const nextBattle = async () => {
      setPhase('LOADING');
      setPlayerTeam(prev => prev.map(p => ({
          ...p,
          currentHp: p.maxHp, 
          status: null,
          volatiles: {}
      })));
      
      const nextIdx = currentTrainerIdx + 1;
      setCurrentTrainerIdx(nextIdx);
      
      const trainer = activeTrainers[nextIdx];
      let eTeam;
      if (trainer.type === 'random') {
           eTeam = await fetchRandomPokemon(6);
      } else {
           eTeam = await fetchPokemonByType(trainer.type, 6);
      }

      setEnemyTeam(eTeam);
      setEIdx(0);
      setPIdx(0);

      setPhase('PRE_BATTLE_WAIT');
  };

  useEffect(() => {
      if (phase === 'STORY_INTRO') {
          const t = setTimeout(() => initBattle(), 4000);
          return () => clearTimeout(t);
      }
  }, [phase]);

  useEffect(() => {
    if (phase === 'TRAINER_INTRO') {
      const timer = setTimeout(() => {
        setPhase('TRASH_TALK');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
      if (phase === 'TRASH_TALK') {
          const trainer = activeTrainers[currentTrainerIdx];
          setBattleLog(`${trainer.name}: "${trainer.taunt || "You're going down, wimp!"}"`);
          const timer = setTimeout(() => {
              setPhase('SEND_OUT_ENEMY');
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [phase, activeTrainers, currentTrainerIdx]);

  useEffect(() => {
    if (phase === 'SEND_OUT_ENEMY') {
      setBattleLog(`${activeTrainers[currentTrainerIdx].name} sent out ${enemyTeam[eIdx]?.name}!`);
      const timer = setTimeout(() => {
         if (phaseRef.current === 'SEND_OUT_ENEMY') {
            setPhase('SEND_OUT_PLAYER');
         }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, eIdx, enemyTeam, currentTrainerIdx, activeTrainers]);

  useEffect(() => {
    if (phase === 'SEND_OUT_PLAYER') {
      setBattleLog(`Go! ${playerTeam[pIdx]?.name}!`);
      const timer = setTimeout(() => {
         if (phaseRef.current === 'SEND_OUT_PLAYER') {
             // CHECK IF PLAYER HAS CHARGING MOVE PENDING
             if (playerTeam[pIdx].volatiles.charging) {
                 handleAttack(playerTeam[pIdx].volatiles.charging!);
             } else {
                 setPhase('COMBAT_MENU');
                 setBattleLog(`What will ${playerTeam[pIdx]?.name} do?`);
             }
         }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, pIdx, playerTeam]);

  // SCALING HELPER
  const getScaleStyle = (height: number) => {
      let scale = 1;
      if (height < 5) scale = 0.8;
      else if (height > 30) scale = 1.4; 
      else if (height > 15) scale = 1.2;
      return { transform: `scale(${scale})` };
  };

  // --- STATE HELPERS ---

  const updateHp = (isPlayer: boolean, index: number, newHp: number) => {
    if (isPlayer) {
      setPlayerTeam(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], currentHp: newHp };
        return copy;
      });
    } else {
      setEnemyTeam(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], currentHp: newHp };
        return copy;
      });
    }
  };

  const updateStatus = (isPlayer: boolean, index: number, status: StatusCondition) => {
     if (isPlayer) {
         setPlayerTeam(prev => { 
             const c=[...prev]; 
             c[index].status = status; 
             if(status === 'sleep') c[index].volatiles.sleepTurns = Math.floor(Math.random() * 3) + 2; 
             return c; 
         });
     } else {
         setEnemyTeam(prev => { 
             const c=[...prev]; 
             c[index].status = status; 
             if(status === 'sleep') c[index].volatiles.sleepTurns = Math.floor(Math.random() * 3) + 2;
             return c; 
         });
     }
  };

  const updateVolatile = (isPlayer: boolean, index: number, update: Partial<VolatileStatus>) => {
      if (isPlayer) {
          setPlayerTeam(prev => { const c=[...prev]; c[index].volatiles = { ...c[index].volatiles, ...update }; return c; });
      } else {
          setEnemyTeam(prev => { const c=[...prev]; c[index].volatiles = { ...c[index].volatiles, ...update }; return c; });
      }
  };

  const updatePP = (isPlayer: boolean, index: number, moveName: string) => {
      if (isPlayer) {
          setPlayerTeam(prev => {
              const c = [...prev];
              const mIdx = c[index].moves.findIndex(m => m.name === moveName);
              if (mIdx !== -1) {
                  c[index].moves[mIdx].currentPp = Math.max(0, c[index].moves[mIdx].currentPp - 1);
              }
              return c;
          });
      } else {
           setEnemyTeam(prev => {
              const c = [...prev];
              const mIdx = c[index].moves.findIndex(m => m.name === moveName);
              if (mIdx !== -1) {
                  c[index].moves[mIdx].currentPp = Math.max(0, c[index].moves[mIdx].currentPp - 1);
              }
              return c;
          });
      }
  }

  const triggerAttackFX = (type: string, target: 'player' | 'enemy') => {
      setMoveTypeAnim(type);
      setTargetAnim(target);
      setTimeout(() => {
          setMoveTypeAnim(null);
          setTargetAnim(null);
      }, 800);
  };

  // --- TURN LOGIC ---

  const checkCanMove = async (isPlayer: boolean, idx: number): Promise<boolean> => {
      const mon = isPlayer ? playerTeam[idx] : enemyTeam[idx];
      
      // Sleep
      if (mon.status === 'sleep') {
          if ((mon.volatiles.sleepTurns || 0) > 0) {
              setBattleLog(`${mon.name} is fast asleep.`);
              updateVolatile(isPlayer, idx, { sleepTurns: (mon.volatiles.sleepTurns || 1) - 1 });
              await new Promise(r => setTimeout(r, 1500));
              return false;
          } else {
              setBattleLog(`${mon.name} woke up!`);
              updateStatus(isPlayer, idx, null);
              await new Promise(r => setTimeout(r, 1000));
          }
      }

      // Freeze
      if (mon.status === 'freeze') {
           if (Math.random() < 0.2) {
               setBattleLog(`${mon.name} thawed out!`);
               updateStatus(isPlayer, idx, null);
               await new Promise(r => setTimeout(r, 1000));
           } else {
               setBattleLog(`${mon.name} is frozen solid!`);
               await new Promise(r => setTimeout(r, 1500));
               return false;
           }
      }

      // Confusion
      if (mon.volatiles.confusion) {
          setBattleLog(`${mon.name} is confused!`);
          await new Promise(r => setTimeout(r, 1000));
          if (Math.random() < 0.5) {
              setBattleLog("It hurt itself in its confusion!");
              // Self damage
              const dmg = Math.floor(mon.maxHp / 8);
              updateHp(isPlayer, idx, Math.max(0, mon.currentHp - dmg));
              updateVolatile(isPlayer, idx, { confusion: mon.volatiles.confusion - 1 });
              await new Promise(r => setTimeout(r, 1500));
              
              if (mon.currentHp - dmg <= 0) return false; // Fainted from confusion
              return false;
          }
          updateVolatile(isPlayer, idx, { confusion: mon.volatiles.confusion - 1 });
      }

      // Paralysis
      if (mon.status === 'paralysis') {
          if (Math.random() < 0.25) {
              setBattleLog(`${mon.name} is paralyzed! It can't move!`);
              await new Promise(r => setTimeout(r, 1500));
              return false;
          }
      }

      return true;
  };

  const processStatusDamage = async (isPlayer: boolean, idx: number) => {
      const mon = isPlayer ? playerTeam[idx] : enemyTeam[idx];
      if (mon.status === 'burn') {
          const dmg = Math.floor(mon.maxHp / 16) || 1;
          const newHp = Math.max(0, mon.currentHp - dmg);
          updateHp(isPlayer, idx, newHp);
          setBattleLog(`${mon.name} is hurt by its burn!`);
          await new Promise(r => setTimeout(r, 1000));
          return newHp === 0; 
      }
      if (mon.status === 'poison') {
          const dmg = Math.floor(mon.maxHp / 8) || 1;
          const newHp = Math.max(0, mon.currentHp - dmg);
          updateHp(isPlayer, idx, newHp);
          setBattleLog(`${mon.name} is hurt by poison!`);
          await new Promise(r => setTimeout(r, 1000));
          return newHp === 0; 
      }
      return false;
  };

  const handleSwitch = (newIdx: number) => {
      if (phase === 'SWITCH_MENU') {
          setPIdx(newIdx);
          // Clear volatiles on switch
          setPlayerTeam(prev => { const c=[...prev]; c[newIdx].volatiles = {}; return c; });
          setPhase('SEND_OUT_PLAYER'); 
      } else if (phase === 'FORCE_SWITCH_PLAYER') {
          setPIdx(newIdx);
          setPlayerTeam(prev => { const c=[...prev]; c[newIdx].volatiles = {}; return c; });
          setPhase('SEND_OUT_PLAYER');
      }
  };

  const executeEnemyTurn = async (currentPlayerIdx: number) => {
      const enemyMon = enemyTeam[eIdx];
      
      // Charging Check
      let enemyMoveName = enemyMon.volatiles.charging;
      
      // If not charging, pick random
      if (!enemyMoveName) {
           // Can move Check
          const canMove = await checkCanMove(false, eIdx);
          if (!canMove) {
              await endTurn(false, currentPlayerIdx);
              return;
          }
          
          // Filter moves with PP
          const validMoves = enemyMon.moves.filter(m => m.currentPp > 0);
          if (validMoves.length === 0) {
              setBattleLog(`${enemyMon.name} has no moves left!`);
              enemyMoveName = "struggle"; // Simplification
          } else {
              enemyMoveName = validMoves[Math.floor(Math.random() * validMoves.length)].name;
          }
      } else {
          setBattleLog(`${enemyMon.name} unleashes energy!`);
          updateVolatile(false, eIdx, { charging: undefined, invulnerable: false });
          await new Promise(r => setTimeout(r, 1000));
      }

      await performMove(false, eIdx, currentPlayerIdx, enemyMoveName!);
  };

  const performMove = async (isPlayerAttacker: boolean, attackerIdx: number, defenderIdx: number, moveName: string) => {
      const attacker = isPlayerAttacker ? playerTeam[attackerIdx] : enemyTeam[attackerIdx];
      const defender = isPlayerAttacker ? enemyTeam[defenderIdx] : playerTeam[defenderIdx];
      const move = getMoveData(moveName);

      // Decrement PP
      if (moveName !== 'struggle') updatePP(isPlayerAttacker, attackerIdx, moveName);

      setBattleLog(`${attacker.name} used ${move.name}!`);
      await new Promise(r => setTimeout(r, 500));

      // 2-Turn Logic (Dig/Fly) - If just starting
      if (move.flags?.charge && !attacker.volatiles.charging) {
          setBattleLog(`${attacker.name} is charging up!`);
          updateVolatile(isPlayerAttacker, attackerIdx, { charging: moveName, invulnerable: true });
          await new Promise(r => setTimeout(r, 1000));
          // End Turn immediately
          if (isPlayerAttacker) {
               executeEnemyTurn(attackerIdx);
          } else {
               endTurn(false, defenderIdx);
          }
          return;
      }

      // Accuracy Check
      if (move.accuracy !== 100 && (Math.random() * 100 > move.accuracy)) {
          setBattleLog("But it missed!");
          await new Promise(r => setTimeout(r, 1000));
          if (isPlayerAttacker) executeEnemyTurn(attackerIdx);
          else endTurn(false, defenderIdx);
          return;
      }

      // Attack Animation
      setAnimating(true);
      const attackTypeClass = ['normal', 'fighting', 'flying', 'bug', 'ghost'].includes(move.type) ? (isPlayerAttacker ? 'animate-tackle-enemy' : 'animate-tackle-player') : 'animate-pulse';
      const spriteId = isPlayerAttacker ? 'player-sprite' : 'enemy-sprite';
      const sprite = document.getElementById(spriteId);
      if (sprite) {
          sprite.classList.add(attackTypeClass);
          setTimeout(() => sprite.classList.remove(attackTypeClass), 400);
      }
      triggerAttackFX(move.type, isPlayerAttacker ? 'enemy' : 'player');
      setAnimating(false);
      await new Promise(r => setTimeout(r, 800));

      // Calculate Damage
      const { damage, effective } = calculateDamage(attacker, defender, move);
      
      // Apply Damage (Invulnerability Check is inside calculateDamage)
      let defenderNewHp = Math.max(0, defender.currentHp - damage);
      if (damage === 0 && defender.volatiles.invulnerable) {
          setBattleLog("It missed!");
          defenderNewHp = defender.currentHp;
      } else {
          updateHp(!isPlayerAttacker, defenderIdx, defenderNewHp);
          setDamageAnim(isPlayerAttacker ? 'enemy' : 'player');
          setTimeout(() => setDamageAnim(null), 500);

          if (effective > 1) setBattleLog("It's super effective!");
          else if (effective === 0) setBattleLog("It had no effect...");
          else if (effective < 1) setBattleLog("It's not very effective...");
          else if (damage === 0) setBattleLog("It had no effect!");
          else setBattleLog(`It dealt ${damage} damage!`);
      }
      
      await new Promise(r => setTimeout(r, 1000));

      // Drain Effect
      if (damage > 0 && move.flags?.drain) {
          const heal = Math.floor(damage / 2);
          const newHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
          updateHp(isPlayerAttacker, attackerIdx, newHp);
          setBattleLog(`${attacker.name} sucked health from ${defender.name}!`);
          await new Promise(r => setTimeout(r, 1000));
      }

      // Apply Status Effect
      if (defenderNewHp > 0 && move.effect && defender.status === null) {
          if (Math.random() < move.effect.chance) {
               if (move.effect.type === 'confusion') {
                   if (!defender.volatiles.confusion) {
                        updateVolatile(!isPlayerAttacker, defenderIdx, { confusion: Math.floor(Math.random() * 4) + 1 });
                        setBattleLog(`${defender.name} became confused!`);
                   }
               } else {
                   updateStatus(!isPlayerAttacker, defenderIdx, move.effect.type as StatusCondition);
                   setBattleLog(`${defender.name} was ${move.effect.type === 'sleep' ? 'put to sleep' : move.effect.type}!`);
               }
               await new Promise(r => setTimeout(r, 1000));
          }
      }

      if (defenderNewHp === 0) {
          if (isPlayerAttacker) handleEnemyFaint();
          else handlePlayerFaint(defenderIdx);
          return;
      }

      if (isPlayerAttacker) executeEnemyTurn(attackerIdx);
      else endTurn(false, defenderIdx);
  };

  const endTurn = async (isPlayer: boolean, playerIdx: number) => {
      // Process Burn/Poison for both active mons
      let playerAlive = true;
      let enemyAlive = true;

      // Enemy Status Dmg
      if (await processStatusDamage(false, eIdx)) {
           handleEnemyFaint();
           enemyAlive = false;
           return;
      }

      // Player Status Dmg
      if (await processStatusDamage(true, playerIdx)) {
           handlePlayerFaint(playerIdx);
           playerAlive = false;
           return;
      }

      if (playerAlive && enemyAlive) {
          setPhase('COMBAT_MENU');
          setBattleLog(`What will ${playerTeam[playerIdx].name} do?`);
      }
  };

  const handleEnemyFaint = async () => {
    setBattleLog(`${enemyTeam[eIdx].name} fainted!`);
    const enemyFaintElem = document.getElementById('enemy-sprite');
    if (enemyFaintElem) enemyFaintElem.classList.add('animate-faint');
    await new Promise(r => setTimeout(r, 1500));
    
    const nextIdx = enemyTeam.findIndex((p, i) => i > eIdx && p.currentHp > 0);
    
    if (nextIdx !== -1) {
       setEIdx(nextIdx);
       setPhase('SEND_OUT_ENEMY');
    } else {
      if (currentTrainerIdx < activeTrainers.length - 1) {
          setPhase('NEXT_BATTLE_TRANSITION');
          setBattleLog(`You defeated ${activeTrainers[currentTrainerIdx].name}! Your team is fully healed!`);
      } else {
          setPhase('VICTORY');
          if (onComplete) onComplete();
          setBattleLog(isEliteFour ? `You defeated the Elite 4! You are a true Master!` : `You defeated Giovanni! The Elite Four awaits...`);
      }
    }
  };

  const handlePlayerFaint = async (idx: number) => {
     setBattleLog(`${playerTeam[idx].name} fainted!`);
     const playerFaintElem = document.getElementById('player-sprite');
     if (playerFaintElem) playerFaintElem.classList.add('animate-faint');
     await new Promise(r => setTimeout(r, 1500));

     const hasAlive = playerTeam.some(p => p.currentHp > 0);
     if (!hasAlive) {
       setPhase('DEFEAT');
       setBattleLog("You whited out...");
     } else {
       setPhase('FORCE_SWITCH_PLAYER');
       setBattleLog("Choose your next Pokemon!");
     }
  };

  const handleAttack = async (moveName: string) => {
      // If we are already charging, we skip checks and go straight to execution
      if (playerTeam[pIdx].volatiles.charging) {
           updateVolatile(true, pIdx, { charging: undefined, invulnerable: false });
           await performMove(true, pIdx, eIdx, playerTeam[pIdx].volatiles.charging!);
           return;
      }

      setPhase('COMBAT_ANIM');
      const canMove = await checkCanMove(true, pIdx);
      if (!canMove) {
          executeEnemyTurn(pIdx);
          return;
      }
      
      await performMove(true, pIdx, eIdx, moveName);
  };

  const getHpColor = (current: number, max: number) => {
    const pct = (current / max) * 100;
    if (pct > 50) return 'bg-[#5cde5e]';
    if (pct > 20) return 'bg-[#fce33f]';
    return 'bg-[#ff4f40]';
  };

  const renderTeamStatus = (team: BattlePokemon[], isPlayer: boolean) => {
      const balls = Array(6).fill(null).map((_, i) => {
          if (i < team.length) {
              return team[i].currentHp > 0 ? 'active' : 'fainted';
          }
          return 'empty';
      });

      return (
          <div className={`flex gap-1 ${isPlayer ? 'justify-end' : 'justify-start'} mb-1`}>
              {balls.map((status, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full border border-black/50 ${
                      status === 'active' ? (isPlayer ? 'bg-red-500 shadow-inner' : 'bg-red-500 shadow-inner') :
                      status === 'fainted' ? 'bg-slate-400 opacity-50' :
                      'bg-transparent border-slate-300'
                  }`}></div>
              ))}
          </div>
      );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, id: number, type: 'front' | 'back') => {
      const target = e.target as HTMLImageElement;
      const fallback = type === 'front' 
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
      if (target.src !== fallback) {
          target.src = fallback;
      }
  };

  const activePlayerMon = playerTeam[pIdx];
  const activeEnemyMon = enemyTeam[eIdx];

  // Return logic phases...
  // (Paste simplified Phase Logic for brevity)
  
  if (phase === 'SELECTION') {
      return (
          <div className="h-screen w-full bg-slate-900 flex flex-col items-center p-4 overflow-hidden">
              <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-4 flex flex-col h-full border-4 border-slate-600">
                  <div className="flex justify-between items-center mb-4">
                      <h1 className="text-sm md:text-xl font-bold uppercase truncate">
                          {isEliteFour ? "Elite 4 Select" : "Story Select"} ({selectedIds.length}/6)
                      </h1>
                      <div className="flex items-center gap-2">
                           <div className="relative">
                               <input 
                                  type="text" 
                                  placeholder="ID#..." 
                                  className="border-2 border-slate-400 rounded px-2 py-1 w-24 text-xs font-mono"
                                  value={selectionSearch}
                                  onChange={handleSearch}
                               />
                               <Search className="w-3 h-3 absolute right-2 top-2 text-slate-400"/>
                           </div>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 p-2 bg-slate-100 rounded border-inner">
                      {viewList.map((p) => (
                          <button 
                            key={p.id}
                            onClick={() => handleSelection(p.id)}
                            className={`flex flex-col items-center justify-center p-1 rounded border-2 transition-all ${selectedIds.includes(p.id) ? 'bg-green-100 border-green-500 scale-95' : 'bg-white border-transparent hover:border-blue-300'}`}
                          >
                              <img src={p.sprite} alt="" className="w-10 h-10 pixel-art" loading="lazy" />
                              <span className="text-[9px] font-mono text-slate-600">{p.name}</span>
                              {selectedIds.includes(p.id) && <CheckCircle2 className="w-4 h-4 text-green-500 absolute top-0 right-0" />}
                          </button>
                      ))}
                  </div>

                  <div className="mt-2 flex justify-between items-center bg-slate-200 p-2 rounded">
                      <button 
                         onClick={() => setSelectionPage(p => Math.max(1, p - 1))}
                         disabled={selectionPage === 1}
                         className="flex items-center gap-1 bg-white border border-slate-400 px-3 py-1 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold"
                      >
                         <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <span className="font-mono text-xs">Page {selectionPage}</span>
                      <button 
                         onClick={() => setSelectionPage(p => p + 1)}
                         className="flex items-center gap-1 bg-white border border-slate-400 px-3 py-1 rounded hover:bg-slate-50 text-xs font-bold"
                      >
                         Next <ChevronRight className="w-4 h-4" />
                      </button>
                  </div>

                  <div className="mt-4 flex justify-center">
                      <button 
                        disabled={selectedIds.length !== 6}
                        onClick={startStory}
                        className="bg-red-600 disabled:bg-slate-400 text-white font-bold py-3 px-12 rounded uppercase tracking-widest shadow-lg active:translate-y-1 transition-all"
                      >
                          Start Adventure
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- 3D BATTLE RENDER ---
  // Reusing the same main structure but injecting 3D wrappers

  if (phase === 'STORY_INTRO' || phase === 'LOADING') {
      return <div className="flex h-screen w-full items-center justify-center text-white bg-slate-900"><Loader2 className="animate-spin h-10 w-10" /></div>;
  }

  if (phase === 'PRE_BATTLE_WAIT') {
      return (
          <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4">
              <button 
                 onClick={startBattleSequence}
                 className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-12 rounded-lg text-xl uppercase shadow-2xl border-4 border-red-800 animate-pulse flex items-center gap-4"
              >
                  <Play className="w-8 h-8 fill-current" />
                  Start Battle VS {activeTrainers[currentTrainerIdx].name}
              </button>
          </div>
      );
  }

  return (
    <div className="relative h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-2 sm:p-4">
      <button onClick={toggleMute} className="absolute top-4 right-4 z-50 text-white bg-slate-800 p-2 rounded-full border border-slate-600 hover:bg-slate-700">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Music className="w-5 h-5 animate-pulse" />}
      </button>

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden border-[12px] border-[#2f3237]">
        {/* 3D SCENE WRAPPER */}
        <div className={`relative h-[250px] sm:h-[320px] md:h-[380px] overflow-hidden scene-3d ${activeTrainers[currentTrainerIdx].bg}`}>
            
            {/* FLOOR PLANE (ROTATED) */}
            <div className="absolute inset-[-50%] w-[200%] h-[200%] arena-floor bg-inherit z-0 pointer-events-none">
                 <div className="w-full h-full bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:40px_40px] opacity-30"></div>
            </div>

            {/* CONTENT (Vertical Billboarding) */}
            <div className="absolute inset-0 z-10">
                {(phase === 'TRAINER_INTRO' || phase === 'TRASH_TALK') && (
                    <>
                        <img 
                            src={activeTrainers[currentTrainerIdx].sprite} 
                            className="absolute top-10 right-10 w-48 h-48 md:w-64 md:h-64 object-contain pixel-art animate-slide-in-right z-10 sprite-stand"
                            alt="Rival"
                        />
                        <img 
                            src={PLAYER_SPRITE} 
                            className="absolute bottom-4 left-10 w-48 h-48 md:w-64 md:h-64 object-contain pixel-art animate-slide-in-left z-10 sprite-stand"
                            alt="Red"
                        />
                        {phase === 'TRASH_TALK' && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-white border-4 border-black p-4 rounded-xl shadow-xl w-3/4 text-center">
                                <p className="font-bold font-mono text-sm md:text-lg uppercase">
                                    "{activeTrainers[currentTrainerIdx].taunt || "I will crush you!"}"
                                </p>
                            </div>
                        )}
                    </>
                )}

                {(phase !== 'TRAINER_INTRO' && phase !== 'TRASH_TALK') && (
                    <>
                        {/* Enemy Sprite & FX */}
                        <div className={`absolute top-16 right-16 z-10 sprite-stand ${phase === 'SEND_OUT_ENEMY' ? 'animate-slide-in-right' : ''}`}>
                            <div className="absolute -bottom-4 -left-4 w-32 h-10 bg-black/40 rounded-[100%] blur-md scale-150 transform rotateX(60deg)"></div>
                            
                            {targetAnim === 'enemy' && moveTypeAnim && (
                                <div className={`
                                    ${moveTypeAnim === 'fire' ? 'fx-fire' : ''}
                                    ${moveTypeAnim === 'water' ? 'fx-water' : ''}
                                    ${moveTypeAnim === 'electric' ? 'fx-electric' : ''}
                                    ${moveTypeAnim === 'grass' ? 'fx-grass' : ''}
                                    ${moveTypeAnim === 'poison' ? 'fx-poison' : ''}
                                    ${!['fire','water','electric','grass','poison'].includes(moveTypeAnim) ? 'fx-normal' : ''}
                                `}></div>
                            )}

                            <img 
                                key={`enemy-${activeEnemyMon.id}`} 
                                src={activeEnemyMon.sprites.front_default} 
                                id="enemy-sprite"
                                style={getScaleStyle(activeEnemyMon.height)}
                                onError={(e) => handleImageError(e, activeEnemyMon.id, 'front')}
                                className={`relative w-32 h-32 md:w-48 md:h-48 pixel-art object-contain transition-all duration-300 origin-bottom 
                                    ${phase === 'VICTORY' || phase === 'NEXT_BATTLE_TRANSITION' ? 'opacity-0' : activeEnemyMon.volatiles.invulnerable ? 'opacity-50 blur-sm' : 'opacity-100'}
                                    ${damageAnim === 'enemy' ? 'animate-shake' : ''}
                                `}
                            />
                        </div>

                        {/* Player Sprite & FX */}
                        <div className={`absolute bottom-8 left-16 z-10 sprite-stand ${phase === 'SEND_OUT_PLAYER' ? 'animate-slide-in-left' : ''}`}>
                             <div className="absolute -bottom-4 -left-4 w-40 h-12 bg-black/40 rounded-[100%] blur-md scale-150 transform rotateX(60deg)"></div>

                             {targetAnim === 'player' && moveTypeAnim && (
                                 <div className={`
                                    ${moveTypeAnim === 'fire' ? 'fx-fire' : ''}
                                    ${moveTypeAnim === 'water' ? 'fx-water' : ''}
                                    ${moveTypeAnim === 'electric' ? 'fx-electric' : ''}
                                    ${moveTypeAnim === 'grass' ? 'fx-grass' : ''}
                                    ${moveTypeAnim === 'poison' ? 'fx-poison' : ''}
                                    ${!['fire','water','electric','grass','poison'].includes(moveTypeAnim) ? 'fx-normal' : ''}
                                 `}></div>
                             )}

                            <img 
                                key={`player-${activePlayerMon.id}`} 
                                src={activePlayerMon.sprites.back_default} 
                                id="player-sprite"
                                style={getScaleStyle(activePlayerMon.height)}
                                onError={(e) => handleImageError(e, activePlayerMon.id, 'back')}
                                className={`relative w-40 h-40 md:w-64 md:h-64 pixel-art object-contain transition-all duration-300 origin-bottom
                                    ${phase === 'DEFEAT' ? 'opacity-0' : activePlayerMon.volatiles.invulnerable ? 'opacity-50 blur-sm' : 'opacity-100'} 
                                    ${animating ? 'translate-x-6' : ''}
                                    ${damageAnim === 'player' ? 'animate-shake' : ''}
                                `}
                            />
                        </div>

                        {/* Enemy HUD */}
                        {phase !== 'VICTORY' && phase !== 'NEXT_BATTLE_TRANSITION' && (
                            <div className="absolute top-6 left-4 z-20 w-[240px] animate-slide-in-left">
                                <div className="bg-[#f8f8d8] border-[3px] border-[#506860] rounded-tl-lg rounded-br-lg p-1 shadow-lg relative">
                                    {renderTeamStatus(enemyTeam, false)}
                                    <div className="flex justify-between items-baseline px-2">
                                        <span className="font-bold text-xs md:text-sm uppercase tracking-tighter text-[#404040]">
                                            {activeEnemyMon.name}
                                        </span>
                                        <span className="font-bold text-xs md:text-sm text-[#404040]">Lv{activeEnemyMon.level}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-2">
                                        <div className="text-[10px] font-bold text-[#e08030] bg-[#404040] px-1 rounded-sm">HP</div>
                                        <div className="flex-1 h-3 bg-[#404040] rounded-full p-[2px]">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${getHpColor(activeEnemyMon.currentHp, activeEnemyMon.maxHp)}`}
                                                style={{ width: `${(activeEnemyMon.currentHp / activeEnemyMon.maxHp) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 left-0 flex gap-1">
                                         {activeEnemyMon.status === 'burn' && <div className="bg-[#f08030] text-white text-[8px] font-bold px-1 rounded uppercase">BRN</div>}
                                         {activeEnemyMon.status === 'paralysis' && <div className="bg-[#f8d030] text-[#806010] text-[8px] font-bold px-1 rounded uppercase">PAR</div>}
                                         {activeEnemyMon.status === 'sleep' && <div className="bg-[#8c888c] text-white text-[8px] font-bold px-1 rounded uppercase">SLP</div>}
                                         {activeEnemyMon.status === 'poison' && <div className="bg-[#a040a0] text-white text-[8px] font-bold px-1 rounded uppercase">PSN</div>}
                                         {activeEnemyMon.status === 'freeze' && <div className="bg-[#98d8d8] text-white text-[8px] font-bold px-1 rounded uppercase">FRZ</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Player HUD */}
                        {phase !== 'DEFEAT' && phase !== 'SEND_OUT_ENEMY' && (
                            <div className="absolute bottom-8 right-4 z-20 w-[260px] animate-slide-in-right">
                                 <div className="bg-[#f8f8d8] border-[3px] border-[#506860] rounded-tl-lg rounded-br-lg p-2 shadow-lg relative">
                                    {renderTeamStatus(playerTeam, true)}
                                    <div className="flex justify-between items-baseline px-2">
                                        <span className="font-bold text-xs md:text-sm uppercase tracking-tighter text-[#404040]">
                                            {activePlayerMon.name}
                                        </span>
                                        <span className="font-bold text-xs md:text-sm text-[#404040]">Lv{activePlayerMon.level}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-2">
                                        <div className="text-[10px] font-bold text-[#e08030] bg-[#404040] px-1 rounded-sm">HP</div>
                                        <div className="flex-1 h-3 bg-[#404040] rounded-full p-[2px]">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${getHpColor(activePlayerMon.currentHp, activePlayerMon.maxHp)}`}
                                                style={{ width: `${(activePlayerMon.currentHp / activePlayerMon.maxHp) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-right px-2 text-[10px] font-bold text-[#404040] mt-1 font-mono tracking-widest shadow-white drop-shadow-sm">
                                        {activePlayerMon.currentHp}/ {activePlayerMon.maxHp}
                                    </div>
                                    <div className="absolute -top-4 left-0 flex gap-1">
                                         {activePlayerMon.status === 'burn' && <div className="bg-[#f08030] text-white text-[8px] font-bold px-1 rounded uppercase">BRN</div>}
                                         {activePlayerMon.status === 'paralysis' && <div className="bg-[#f8d030] text-[#806010] text-[8px] font-bold px-1 rounded uppercase">PAR</div>}
                                         {activePlayerMon.status === 'sleep' && <div className="bg-[#8c888c] text-white text-[8px] font-bold px-1 rounded uppercase">SLP</div>}
                                         {activePlayerMon.status === 'poison' && <div className="bg-[#a040a0] text-white text-[8px] font-bold px-1 rounded uppercase">PSN</div>}
                                         {activePlayerMon.status === 'freeze' && <div className="bg-[#98d8d8] text-white text-[8px] font-bold px-1 rounded uppercase">FRZ</div>}
                                    </div>
                                    <div className="w-full h-1 bg-[#40a0c8] mt-1 border-t border-[#f8f8d8]"></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        <div className="h-40 bg-[#2f3237] flex text-white font-mono relative">
           <div className="flex-1 border-[6px] border-[#a0a0a8] rounded m-2 bg-white relative">
               <div className="absolute inset-[2px] border-[2px] border-[#505058] p-4 bg-white/10">
                    <p className="text-[#383838] text-sm md:text-base font-bold leading-relaxed whitespace-pre-line text-shadow-none">
                        {battleLog}
                    </p>
               </div>
               
               {phase === 'FIGHT_MENU' && (
                 <div className="absolute inset-0 bg-white z-20 grid grid-cols-2 gap-1 p-2">
                      {activePlayerMon.moves.map((moveInstance) => {
                          const m = getMoveData(moveInstance.name);
                          return (
                            <button
                                key={moveInstance.name}
                                onClick={() => handleAttack(moveInstance.name)}
                                disabled={moveInstance.currentPp === 0}
                                className={`border border-slate-300 hover:bg-[#f8f8d8] hover:border-[#f08030] text-[#383838] font-bold text-xs uppercase rounded flex flex-col items-center justify-center group ${moveInstance.currentPp === 0 ? 'opacity-50 cursor-not-allowed bg-slate-200' : ''}`}
                            >
                                <span>{moveInstance.name}</span>
                                <div className="flex justify-between w-full px-2 mt-1">
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-600">{m.type}</span>
                                    <span className={`text-[9px] ${moveInstance.currentPp === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                        PP {moveInstance.currentPp}/{moveInstance.maxPp}
                                    </span>
                                </div>
                            </button>
                          );
                      })}
                      <button 
                         onClick={() => setPhase('COMBAT_MENU')}
                         className="absolute bottom-1 right-1 text-[#383838] text-[10px] font-bold hover:underline"
                      >
                         CANCEL
                      </button>
                 </div>
               )}
           </div>

           {phase === 'COMBAT_MENU' && (
               <div className="w-1/3 max-w-[200px] border-[6px] border-[#2f3237] bg-white m-2 ml-0 rounded relative">
                   <div className="absolute inset-0 border-[2px] border-[#6868d8] bg-white grid grid-cols-2">
                        <button 
                            onClick={() => setPhase('FIGHT_MENU')}
                            className="hover:bg-[#f8f8d8] flex flex-col items-center justify-center text-[#383838] font-bold text-xs border-r border-b border-slate-200"
                        >
                            <Sword className="w-4 h-4 mb-1" />
                            FIGHT
                        </button>
                        <button 
                            disabled 
                            className="hover:bg-[#f8f8d8] flex flex-col items-center justify-center text-[#a0a0a0] font-bold text-xs border-b border-slate-200"
                        >
                            <Backpack className="w-4 h-4 mb-1" />
                            BAG
                        </button>
                        <button 
                            onClick={() => setPhase('SWITCH_MENU')}
                            className="hover:bg-[#f8f8d8] flex flex-col items-center justify-center text-[#383838] font-bold text-xs border-r border-slate-200"
                        >
                            <Users className="w-4 h-4 mb-1" />
                            PKMN
                        </button>
                        <button 
                            onClick={onBack}
                            className="hover:bg-[#f8f8d8] flex flex-col items-center justify-center text-[#383838] font-bold text-xs"
                        >
                            <LogOut className="w-4 h-4 mb-1" />
                            RUN
                        </button>
                   </div>
               </div>
           )}

           {(phase === 'SWITCH_MENU' || phase === 'FORCE_SWITCH_PLAYER') && (
               <div className="absolute inset-0 bg-white z-30 flex flex-col p-2">
                   <h3 className="text-[#383838] text-xs font-bold mb-2 uppercase">Switch Pokemon</h3>
                   <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
                       {playerTeam.map((p, i) => (
                           <button
                               key={i}
                               disabled={p.currentHp <= 0 || i === pIdx}
                               onClick={() => handleSwitch(i)}
                               className={`p-1 rounded border flex items-center gap-2 ${p.currentHp <= 0 ? 'bg-red-50 opacity-50' : i === pIdx ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-slate-50'}`}
                           >
                               <img src={p.sprites.front_default} className="w-6 h-6 pixel-art" />
                               <div className="text-left w-full">
                                   <div className="text-[10px] font-bold text-[#383838]">{p.name}</div>
                                   <div className="w-full h-1 bg-slate-200 rounded overflow-hidden">
                                       <div className={`h-full ${getHpColor(p.currentHp, p.maxHp)}`} style={{width: `${(p.currentHp/p.maxHp)*100}%`}}></div>
                                   </div>
                               </div>
                           </button>
                       ))}
                   </div>
                   {phase === 'SWITCH_MENU' && (
                       <button onClick={() => setPhase('COMBAT_MENU')} className="mt-2 bg-slate-200 text-slate-600 text-xs font-bold py-1 rounded">Cancel</button>
                   )}
               </div>
           )}

           {phase === 'NEXT_BATTLE_TRANSITION' && (
               <div className="w-1/3 flex items-center p-2">
                    <button 
                        onClick={nextBattle}
                        className="w-full h-full bg-[#f08030] hover:bg-[#e07020] text-white border-b-4 border-[#c05010] font-bold text-xs rounded uppercase animate-pulse flex flex-col items-center justify-center"
                    >
                        <span>Challenge</span>
                        <span className="text-[9px]">{activeTrainers[currentTrainerIdx+1]?.name}</span>
                    </button>
               </div>
           )}

           {(phase === 'VICTORY' || phase === 'DEFEAT') && (
               <div className="w-1/3 flex items-center p-2">
                    <button 
                        onClick={onBack}
                        className="w-full h-full bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-800 font-bold text-xs rounded uppercase animate-pulse"
                    >
                        Main Menu
                    </button>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};