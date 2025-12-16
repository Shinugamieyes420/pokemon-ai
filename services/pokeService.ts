import { Pokemon, BattlePokemon, Move, StatusCondition, MoveInstance } from '../types';

const API_URL = 'https://pokeapi.co/api/v2';
const TOTAL_POKEMON = 386; // Limit to Gen 1-3

// Expanded Move Database with PP and Complex Effects
const MOVES_DB: Record<string, Move> = {
  // Normal
  'tackle': { name: 'Tackle', power: 35, type: 'normal', accuracy: 95, pp: 35 },
  'scratch': { name: 'Scratch', power: 40, type: 'normal', accuracy: 100, pp: 35 },
  'pound': { name: 'Pound', power: 40, type: 'normal', accuracy: 100, pp: 35 },
  'quick-attack': { name: 'Quick Attack', power: 40, type: 'normal', accuracy: 100, pp: 30 },
  'slam': { name: 'Slam', power: 80, type: 'normal', accuracy: 75, pp: 20 },
  'double-edge': { name: 'Double-Edge', power: 120, type: 'normal', accuracy: 100, pp: 15, flags: { recoil: true } },
  'hyper-beam': { name: 'Hyper Beam', power: 150, type: 'normal', accuracy: 90, pp: 5 },
  'body-slam': { name: 'Body Slam', power: 85, type: 'normal', accuracy: 100, pp: 15, effect: { type: 'paralysis', chance: 0.3 } },
  'tri-attack': { name: 'Tri Attack', power: 80, type: 'normal', accuracy: 100, pp: 10, effect: { type: 'paralysis', chance: 0.2 } },
  'strength': { name: 'Strength', power: 80, type: 'normal', accuracy: 100, pp: 15 },
  'slash': { name: 'Slash', power: 70, type: 'normal', accuracy: 100, pp: 20, flags: { highCrit: true } },
  'headbutt': { name: 'Headbutt', power: 70, type: 'normal', accuracy: 100, pp: 15 },
  'mega-kick': { name: 'Mega Kick', power: 120, type: 'normal', accuracy: 75, pp: 5 },
  'mega-punch': { name: 'Mega Punch', power: 80, type: 'normal', accuracy: 85, pp: 20 },
  'cut': { name: 'Cut', power: 50, type: 'normal', accuracy: 95, pp: 30 },
  'take-down': { name: 'Take Down', power: 90, type: 'normal', accuracy: 85, pp: 20, flags: { recoil: true } },
  'tail-whip': { name: 'Tail Whip', power: 0, type: 'normal', accuracy: 100, pp: 30 }, 
  'growl': { name: 'Growl', power: 0, type: 'normal', accuracy: 100, pp: 40 },
  'sing': { name: 'Sing', power: 0, type: 'normal', accuracy: 55, pp: 15, effect: { type: 'sleep', chance: 1.0 } },

  // Fire
  'ember': { name: 'Ember', power: 40, type: 'fire', accuracy: 100, pp: 25, effect: { type: 'burn', chance: 0.1 } },
  'flamethrower': { name: 'Flamethrower', power: 90, type: 'fire', accuracy: 100, pp: 15, effect: { type: 'burn', chance: 0.1 } },
  'fire-blast': { name: 'Fire Blast', power: 120, type: 'fire', accuracy: 85, pp: 5, effect: { type: 'burn', chance: 0.1 } },
  'fire-punch': { name: 'Fire Punch', power: 75, type: 'fire', accuracy: 100, pp: 15, effect: { type: 'burn', chance: 0.1 } },
  'fire-spin': { name: 'Fire Spin', power: 35, type: 'fire', accuracy: 85, pp: 15 },
  'heat-wave': { name: 'Heat Wave', power: 100, type: 'fire', accuracy: 90, pp: 10, effect: { type: 'burn', chance: 0.1 } },
  'blaze-kick': { name: 'Blaze Kick', power: 85, type: 'fire', accuracy: 90, pp: 10, effect: { type: 'burn', chance: 0.1 }, flags: { highCrit: true } },
  'eruption': { name: 'Eruption', power: 150, type: 'fire', accuracy: 100, pp: 5 },

  // Water
  'water-gun': { name: 'Water Gun', power: 40, type: 'water', accuracy: 100, pp: 25 },
  'hydro-pump': { name: 'Hydro Pump', power: 120, type: 'water', accuracy: 80, pp: 5 },
  'surf': { name: 'Surf', power: 95, type: 'water', accuracy: 100, pp: 15 },
  'bubble-beam': { name: 'Bubble Beam', power: 65, type: 'water', accuracy: 100, pp: 20 },
  'bubble': { name: 'Bubble', power: 20, type: 'water', accuracy: 100, pp: 30 },
  'waterfall': { name: 'Waterfall', power: 80, type: 'water', accuracy: 100, pp: 15 },
  'muddy-water': { name: 'Muddy Water', power: 95, type: 'water', accuracy: 85, pp: 10 },
  'crabhammer': { name: 'Crabhammer', power: 90, type: 'water', accuracy: 85, pp: 10, flags: { highCrit: true } },

  // Grass
  'vine-whip': { name: 'Vine Whip', power: 35, type: 'grass', accuracy: 100, pp: 25 },
  'solar-beam': { name: 'Solar Beam', power: 120, type: 'grass', accuracy: 100, pp: 10, flags: { charge: true } },
  'razor-leaf': { name: 'Razor Leaf', power: 55, type: 'grass', accuracy: 95, pp: 25, flags: { highCrit: true } },
  'absorb': { name: 'Absorb', power: 20, type: 'grass', accuracy: 100, pp: 25, flags: { drain: true } },
  'mega-drain': { name: 'Mega Drain', power: 40, type: 'grass', accuracy: 100, pp: 15, flags: { drain: true } },
  'giga-drain': { name: 'Giga Drain', power: 75, type: 'grass', accuracy: 100, pp: 10, flags: { drain: true } },
  'leaf-blade': { name: 'Leaf Blade', power: 90, type: 'grass', accuracy: 100, pp: 15, flags: { highCrit: true } },
  'petal-dance': { name: 'Petal Dance', power: 70, type: 'grass', accuracy: 100, pp: 20 },
  'magical-leaf': { name: 'Magical Leaf', power: 60, type: 'grass', accuracy: 100, pp: 20 },

  // Electric
  'thunder-shock': { name: 'Thunder Shock', power: 40, type: 'electric', accuracy: 100, pp: 30, effect: { type: 'paralysis', chance: 0.1 } },
  'thunderbolt': { name: 'Thunderbolt', power: 95, type: 'electric', accuracy: 100, pp: 15, effect: { type: 'paralysis', chance: 0.1 } },
  'thunder': { name: 'Thunder', power: 120, type: 'electric', accuracy: 70, pp: 10, effect: { type: 'paralysis', chance: 0.3 } },
  'spark': { name: 'Spark', power: 65, type: 'electric', accuracy: 100, pp: 20, effect: { type: 'paralysis', chance: 0.3 } },
  'thunder-punch': { name: 'Thunder Punch', power: 75, type: 'electric', accuracy: 100, pp: 15, effect: { type: 'paralysis', chance: 0.1 } },
  'shock-wave': { name: 'Shock Wave', power: 60, type: 'electric', accuracy: 100, pp: 20 },
  'volt-tackle': { name: 'Volt Tackle', power: 120, type: 'electric', accuracy: 100, pp: 15, flags: { recoil: true }, effect: { type: 'paralysis', chance: 0.1 } },

  // Ice
  'ice-beam': { name: 'Ice Beam', power: 95, type: 'ice', accuracy: 100, pp: 10, effect: { type: 'freeze', chance: 0.1 } }, 
  'blizzard': { name: 'Blizzard', power: 120, type: 'ice', accuracy: 70, pp: 5, effect: { type: 'freeze', chance: 0.1 } },
  'aurora-beam': { name: 'Aurora Beam', power: 65, type: 'ice', accuracy: 100, pp: 20 },
  'ice-punch': { name: 'Ice Punch', power: 75, type: 'ice', accuracy: 100, pp: 15, effect: { type: 'freeze', chance: 0.1 } },
  'powder-snow': { name: 'Powder Snow', power: 40, type: 'ice', accuracy: 100, pp: 25, effect: { type: 'freeze', chance: 0.1 } },
  'icy-wind': { name: 'Icy Wind', power: 55, type: 'ice', accuracy: 95, pp: 15 },

  // Fighting
  'karate-chop': { name: 'Karate Chop', power: 50, type: 'fighting', accuracy: 100, pp: 25, flags: { highCrit: true } },
  'mach-punch': { name: 'Mach Punch', power: 40, type: 'fighting', accuracy: 100, pp: 30 },
  'double-kick': { name: 'Double Kick', power: 30, type: 'fighting', accuracy: 100, pp: 30 }, // Hits twice logic not impl for brevity
  'jump-kick': { name: 'Jump Kick', power: 85, type: 'fighting', accuracy: 95, pp: 25 },
  'submission': { name: 'Submission', power: 80, type: 'fighting', accuracy: 80, pp: 25, flags: { recoil: true } },
  'cross-chop': { name: 'Cross Chop', power: 100, type: 'fighting', accuracy: 80, pp: 5, flags: { highCrit: true } },
  'brick-break': { name: 'Brick Break', power: 75, type: 'fighting', accuracy: 100, pp: 15 },
  'seismic-toss': { name: 'Seismic Toss', power: 100, type: 'fighting', accuracy: 100, pp: 20 }, // Fixed dmg usually
  'sky-uppercut': { name: 'Sky Uppercut', power: 85, type: 'fighting', accuracy: 90, pp: 15 },

  // Poison
  'acid': { name: 'Acid', power: 40, type: 'poison', accuracy: 100, pp: 30, effect: { type: 'poison', chance: 0.1 } },
  'sludge': { name: 'Sludge', power: 65, type: 'poison', accuracy: 100, pp: 20, effect: { type: 'poison', chance: 0.3 } },
  'sludge-bomb': { name: 'Sludge Bomb', power: 90, type: 'poison', accuracy: 100, pp: 10, effect: { type: 'poison', chance: 0.3 } },
  'poison-sting': { name: 'Poison Sting', power: 15, type: 'poison', accuracy: 100, pp: 35, effect: { type: 'poison', chance: 0.3 } },
  'smog': { name: 'Smog', power: 20, type: 'poison', accuracy: 70, pp: 20, effect: { type: 'poison', chance: 0.4 } },
  'poison-fang': { name: 'Poison Fang', power: 50, type: 'poison', accuracy: 100, pp: 15, effect: { type: 'poison', chance: 0.5 } },

  // Ground
  'earthquake': { name: 'Earthquake', power: 100, type: 'ground', accuracy: 100, pp: 10 },
  'dig': { name: 'Dig', power: 80, type: 'ground', accuracy: 100, pp: 10, flags: { charge: true } },
  'mud-slap': { name: 'Mud-Slap', power: 20, type: 'ground', accuracy: 100, pp: 10 },
  'mud-shot': { name: 'Mud Shot', power: 55, type: 'ground', accuracy: 95, pp: 15 },
  'bonemerang': { name: 'Bonemerang', power: 50, type: 'ground', accuracy: 90, pp: 10 },

  // Flying
  'peck': { name: 'Peck', power: 35, type: 'flying', accuracy: 100, pp: 35 },
  'wing-attack': { name: 'Wing Attack', power: 60, type: 'flying', accuracy: 100, pp: 35 },
  'fly': { name: 'Fly', power: 90, type: 'flying', accuracy: 95, pp: 15, flags: { charge: true } },
  'drill-peck': { name: 'Drill Peck', power: 80, type: 'flying', accuracy: 100, pp: 20 },
  'aerial-ace': { name: 'Aerial Ace', power: 60, type: 'flying', accuracy: 100, pp: 20 },
  'air-cutter': { name: 'Air Cutter', power: 55, type: 'flying', accuracy: 95, pp: 25 },
  'gust': { name: 'Gust', power: 40, type: 'flying', accuracy: 100, pp: 35 },

  // Psychic
  'confusion': { name: 'Confusion', power: 50, type: 'psychic', accuracy: 100, pp: 25, effect: { type: 'confusion', chance: 0.1 } },
  'psychic': { name: 'Psychic', power: 90, type: 'psychic', accuracy: 100, pp: 10 },
  'psybeam': { name: 'Psybeam', power: 65, type: 'psychic', accuracy: 100, pp: 20, effect: { type: 'confusion', chance: 0.1 } },
  'extrasensory': { name: 'Extrasensory', power: 80, type: 'psychic', accuracy: 100, pp: 30 },
  'psywave': { name: 'Psywave', power: 1, type: 'psychic', accuracy: 80, pp: 15 }, 
  'future-sight': { name: 'Future Sight', power: 80, type: 'psychic', accuracy: 100, pp: 15 },

  // Bug
  'leech-life': { name: 'Leech Life', power: 20, type: 'bug', accuracy: 100, pp: 15, flags: { drain: true } },
  'pin-missile': { name: 'Pin Missile', power: 14, type: 'bug', accuracy: 85, pp: 20 },
  'twineedle': { name: 'Twineedle', power: 25, type: 'bug', accuracy: 100, pp: 20, effect: { type: 'poison', chance: 0.2 } },
  'signal-beam': { name: 'Signal Beam', power: 75, type: 'bug', accuracy: 100, pp: 15, effect: { type: 'confusion', chance: 0.1 } },
  'silver-wind': { name: 'Silver Wind', power: 60, type: 'bug', accuracy: 100, pp: 5 },
  'megahorn': { name: 'Megahorn', power: 120, type: 'bug', accuracy: 85, pp: 10 },

  // Rock
  'rock-throw': { name: 'Rock Throw', power: 50, type: 'rock', accuracy: 90, pp: 15 },
  'rock-slide': { name: 'Rock Slide', power: 75, type: 'rock', accuracy: 90, pp: 10 },
  'ancient-power': { name: 'Ancient Power', power: 60, type: 'rock', accuracy: 100, pp: 5 },
  'rock-tomb': { name: 'Rock Tomb', power: 50, type: 'rock', accuracy: 80, pp: 10 },
  'rollout': { name: 'Rollout', power: 30, type: 'rock', accuracy: 90, pp: 20 },
  'rock-blast': { name: 'Rock Blast', power: 25, type: 'rock', accuracy: 90, pp: 10 },

  // Ghost
  'lick': { name: 'Lick', power: 20, type: 'ghost', accuracy: 100, pp: 30, effect: { type: 'paralysis', chance: 0.3 } },
  'shadow-ball': { name: 'Shadow Ball', power: 80, type: 'ghost', accuracy: 100, pp: 15 },
  'shadow-punch': { name: 'Shadow Punch', power: 60, type: 'ghost', accuracy: 100, pp: 20 },
  'night-shade': { name: 'Night Shade', power: 50, type: 'ghost', accuracy: 100, pp: 15 }, 
  'astonish': { name: 'Astonish', power: 30, type: 'ghost', accuracy: 100, pp: 15 },

  // Dragon
  'dragon-rage': { name: 'Dragon Rage', power: 40, type: 'dragon', accuracy: 100, pp: 10 }, 
  'dragon-claw': { name: 'Dragon Claw', power: 80, type: 'dragon', accuracy: 100, pp: 15 },
  'dragon-breath': { name: 'Dragon Breath', power: 60, type: 'dragon', accuracy: 100, pp: 20, effect: { type: 'paralysis', chance: 0.3 } },
  'outrage': { name: 'Outrage', power: 90, type: 'dragon', accuracy: 100, pp: 10 },
  'twister': { name: 'Twister', power: 40, type: 'dragon', accuracy: 100, pp: 20 },

  // Steel
  'metal-claw': { name: 'Metal Claw', power: 50, type: 'steel', accuracy: 95, pp: 35 },
  'steel-wing': { name: 'Steel Wing', power: 70, type: 'steel', accuracy: 90, pp: 25 },
  'iron-tail': { name: 'Iron Tail', power: 100, type: 'steel', accuracy: 75, pp: 15 },
  'meteor-mash': { name: 'Meteor Mash', power: 100, type: 'steel', accuracy: 85, pp: 10 },
  'doom-desire': { name: 'Doom Desire', power: 120, type: 'steel', accuracy: 100, pp: 5 },

  // Dark
  'bite': { name: 'Bite', power: 60, type: 'dark', accuracy: 100, pp: 25 },
  'crunch': { name: 'Crunch', power: 80, type: 'dark', accuracy: 100, pp: 15 },
  'faint-attack': { name: 'Faint Attack', power: 60, type: 'dark', accuracy: 100, pp: 20 },
  'thief': { name: 'Thief', power: 40, type: 'dark', accuracy: 100, pp: 10 },
  'pursuit': { name: 'Pursuit', power: 40, type: 'dark', accuracy: 100, pp: 20 },
  'knock-off': { name: 'Knock Off', power: 20, type: 'dark', accuracy: 100, pp: 20 },
};

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2.0, ice: 2.0, bug: 2.0, rock: 0.5, dragon: 0.5, steel: 2.0 },
  water: { fire: 2.0, water: 0.5, grass: 0.5, ground: 2.0, rock: 2.0, dragon: 0.5 },
  electric: { water: 2.0, electric: 0.5, grass: 0.5, ground: 0.0, flying: 2.0, dragon: 0.5 },
  grass: { fire: 0.5, water: 2.0, grass: 0.5, poison: 0.5, ground: 2.0, flying: 0.5, bug: 0.5, rock: 2.0, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2.0, ice: 0.5, ground: 2.0, flying: 2.0, dragon: 2.0, steel: 0.5 },
  fighting: { normal: 2.0, ice: 2.0, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2.0, ghost: 0.0, dark: 2.0, steel: 2.0, fairy: 0.5 },
  poison: { grass: 2.0, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0.0, fairy: 2.0 },
  ground: { fire: 2.0, electric: 2.0, grass: 0.5, poison: 2.0, flying: 0.0, bug: 0.5, rock: 2.0, steel: 2.0 },
  flying: { electric: 0.5, grass: 2.0, fighting: 2.0, bug: 2.0, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2.0, poison: 2.0, psychic: 0.5, dark: 0.0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2.0, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2.0, ghost: 0.5, dark: 2.0, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2.0, ice: 2.0, fighting: 0.5, ground: 0.5, flying: 2.0, bug: 2.0, steel: 0.5 },
  ghost: { normal: 0.0, psychic: 2.0, ghost: 2.0, dark: 0.5 },
  dragon: { dragon: 2.0, steel: 0.5, fairy: 0.0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2.0, rock: 2.0, steel: 0.5, fairy: 2.0 },
  dark: { fighting: 0.5, psychic: 2.0, ghost: 2.0, dark: 0.5, fairy: 0.5 },
};

const getEffectiveness = (moveType: string, defenderTypes: string[]): number => {
    let multiplier = 1.0;
    const attackerMap = TYPE_CHART[moveType];
    if (!attackerMap) return 1.0;
    defenderTypes.forEach(defType => {
        if (attackerMap[defType] !== undefined) multiplier *= attackerMap[defType];
    });
    return multiplier;
};

// Helper to determine the best available sprite
const getSpriteUrl = (id: number, type: 'front' | 'back' | 'icon') => {
    if (type === 'icon') {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }
    if (type === 'front') {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
    }
    if (type === 'back') {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${id}.gif`;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};

// Helper to format raw API data into BattlePokemon
const formatPokemonData = (data: any, level = 100): BattlePokemon => {
  // SET DEFAULT LEVEL TO 100 
  // Level 100 Stats Formula approximation
  const hp = Math.floor((data.stats[0].base_stat * 2 * level) / 100 + level + 10);
  const attack = Math.floor((data.stats[1].base_stat * 2 * level) / 100 + 5);
  const defense = Math.floor((data.stats[2].base_stat * 2 * level) / 100 + 5);
  const speed = Math.floor((data.stats[5].base_stat * 2 * level) / 100 + 5);
  
  const pokemonTypes = data.types.map((t: any) => t.type.name);

  // ACCURATE GEN 3 MOVE SELECTION
  const gen3Versions = ['firered-leafgreen', 'emerald', 'ruby-sapphire'];
  
  // 1. Get moves learned by level up in Gen 3
  // Since level is 100, this naturally gets the strongest moves
  const possibleMoves = data.moves.filter((m: any) => {
      if (!MOVES_DB[m.move.name]) return false;
      return m.version_group_details.some((vg: any) => 
          gen3Versions.includes(vg.version_group.name) && 
          vg.move_learn_method.name === 'level-up' &&
          vg.level_learned_at <= level
      );
  }).map((m: any) => {
      const detail = m.version_group_details.find((vg: any) => gen3Versions.includes(vg.version_group.name));
      return {
          name: m.move.name,
          level: detail ? detail.level_learned_at : 0
      };
  });

  // Sort by level learned (descending) to get the most recent (usually strongest) moves
  possibleMoves.sort((a: any, b: any) => b.level - a.level);

  const uniqueMoves = new Set<string>();
  const selectedMoves: string[] = [];
  
  for (const pm of possibleMoves) {
      if (!uniqueMoves.has(pm.name)) {
          uniqueMoves.add(pm.name);
          selectedMoves.push(pm.name);
          if (selectedMoves.length === 4) break;
      }
  }

  // 2. FILLER: If less than 4 moves, add other moves (TMs, Egg Moves, etc.)
  if (selectedMoves.length < 4) {
      const otherMoves = data.moves
        .map((m: any) => m.move.name)
        .filter((name: string) => MOVES_DB[name] && !uniqueMoves.has(name));
      
      otherMoves.sort((a: string, b: string) => (MOVES_DB[b].power || 0) - (MOVES_DB[a].power || 0));

      for (const move of otherMoves) {
          selectedMoves.push(move);
          uniqueMoves.add(move);
          if (selectedMoves.length === 4) break;
      }
  }

  // 3. FINAL FALLBACK: If still < 4, fill with basic moves
  const fallbackMoves = ['tackle', 'scratch', 'pound', 'growl'];
  for (const move of fallbackMoves) {
      if (selectedMoves.length === 4) break;
      if (!uniqueMoves.has(move) && MOVES_DB[move]) {
          selectedMoves.push(move);
          uniqueMoves.add(move);
      }
  }

  const finalMoves: MoveInstance[] = selectedMoves.map(name => ({
    name,
    maxPp: MOVES_DB[name].pp || 35,
    currentPp: MOVES_DB[name].pp || 35
  }));

  return {
    id: data.id,
    name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
    height: data.height, // Add Height for Scaling
    sprites: {
      front_default: getSpriteUrl(data.id, 'front'),
      back_default: getSpriteUrl(data.id, 'back'),
      official_artwork: data.sprites.other?.['official-artwork']?.front_default
    },
    stats: { hp, attack, defense, speed },
    currentHp: hp,
    maxHp: hp,
    level: level,
    types: pokemonTypes,
    moves: finalMoves,
    status: null,
    volatiles: {}
  };
};

export const fetchPokemonByType = async (type: string, count: number): Promise<BattlePokemon[]> => {
    const response = await fetch(`${API_URL}/type/${type}`);
    const data = await response.json();
    
    // Filter list to only include Pokemon within the generation limit (ID <= 386)
    const validPokemonList = data.pokemon.filter((p: any) => {
        const urlParts = p.pokemon.url.split('/');
        const id = parseInt(urlParts[urlParts.length - 2]);
        return id <= TOTAL_POKEMON;
    }).map((p: any) => p.pokemon);

    const promises = [];
    const usedIndices = new Set<number>();
    
    // Safety check if not enough pokemon of that type in Gen 1-3
    const actualCount = Math.min(count, validPokemonList.length);

    for(let i=0; i<actualCount; i++) {
        let randIdx = Math.floor(Math.random() * validPokemonList.length);
        let retries = 0;
        while(usedIndices.has(randIdx) && retries < 10) {
            randIdx = Math.floor(Math.random() * validPokemonList.length);
            retries++;
        }
        usedIndices.add(randIdx);
        
        const rand = validPokemonList[randIdx];
        const id = parseInt(rand.url.split('/').filter(Boolean).pop());
        promises.push(fetch(`${API_URL}/pokemon/${id}`).then(res => res.json()));
    }
    const results = await Promise.all(promises);
    return results.map(d => formatPokemonData(d, 100));
};

export const fetchRandomPokemon = async (count: number = 6): Promise<BattlePokemon[]> => {
  const promises = [];
  const usedIds = new Set<number>();
  for (let i = 0; i < count; i++) {
    let randomId = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
    while(usedIds.has(randomId)) randomId = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
    usedIds.add(randomId);
    promises.push(fetch(`${API_URL}/pokemon/${randomId}`).then(res => res.json()));
  }
  const results = await Promise.all(promises);
  return results.map(data => formatPokemonData(data, 100));
};

export const fetchSpecificPokemon = async (ids: number[]): Promise<BattlePokemon[]> => {
  const promises = ids.map(id => fetch(`${API_URL}/pokemon/${id}`).then(res => res.json()));
  const results = await Promise.all(promises);
  return results.map(data => formatPokemonData(data, 100));
};

export const getPokemonList = (page: number, limit: number, search: string = '') => {
  const start = 1;
  const end = TOTAL_POKEMON;
  const list = [];
  
  if (search && !isNaN(parseInt(search))) {
      const id = parseInt(search);
      if (id >= 1 && id <= TOTAL_POKEMON) {
          return [{ id, sprite: getSpriteUrl(id, 'icon'), name: `Pokemon #${id}` }];
      }
      return [];
  }

  const offset = (page - 1) * limit;
  for (let i = 0; i < limit; i++) {
      const id = start + offset + i;
      if (id > end) break;
      list.push({
          id,
          sprite: getSpriteUrl(id, 'icon'),
          name: `#${id}` 
      });
  }
  
  return list;
};

export const getMoveData = (moveName: string): Move => {
  return MOVES_DB[moveName] || { name: moveName, power: 50, type: 'normal', accuracy: 100, pp: 35 };
};

export const calculateDamage = (attacker: BattlePokemon, defender: BattlePokemon, move: Move): { damage: number, effective: number } => {
    if (move.power === 0) return { damage: 0, effective: 1 };
    
    // Invulnerability check (Dig/Fly)
    if (defender.volatiles.invulnerable && !move.flags?.charge) {
        return { damage: 0, effective: 0 };
    }

    const random = (Math.floor(Math.random() * 38) + 217) / 255;
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    const typeEffectiveness = getEffectiveness(move.type, defender.types);
    
    let attackStat = attacker.stats.attack;
    if (attacker.status === 'burn') attackStat = Math.floor(attackStat / 2);

    let damage = (((((2 * attacker.level) / 5) + 2) * move.power * (attackStat / defender.stats.defense)) / 50) + 2;
    damage = damage * stab * typeEffectiveness * random;

    // High crit ratio
    if (move.flags?.highCrit && Math.random() < 0.125) {
        damage *= 1.5;
    }

    return { 
        damage: Math.floor(damage), 
        effective: typeEffectiveness 
    };
};