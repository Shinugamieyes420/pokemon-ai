export interface Pokemon {
  id: number;
  name: string;
  height: number; // Decimeters
  sprites: {
    front_default: string;
    back_default: string;
    official_artwork: string;
  };
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  types: string[];
}

export type StatusCondition = 'burn' | 'paralysis' | 'sleep' | 'poison' | 'freeze' | null;

export interface MoveInstance {
  name: string;
  maxPp: number;
  currentPp: number;
}

export interface VolatileStatus {
  confusion?: number; // Turns remaining
  charging?: string; // Move name if charging (Dig/Fly)
  invulnerable?: boolean; // If in air/ground
  sleepTurns?: number; // If asleep
}

export interface BattlePokemon extends Pokemon {
  currentHp: number;
  maxHp: number;
  level: number;
  status: StatusCondition;
  volatiles: VolatileStatus;
  moves: MoveInstance[]; 
}

export enum GameMode {
  MENU = 'MENU',
  BATTLE = 'BATTLE'
}

export interface Move {
  name: string;
  power: number;
  type: string;
  accuracy: number;
  pp: number;
  category?: 'physical' | 'special' | 'status';
  flags?: {
    drain?: boolean; // Heals user
    charge?: boolean; // 2-turn move (Dig/Fly)
    highCrit?: boolean;
    recoil?: boolean;
  };
  effect?: {
    type: StatusCondition | 'confusion';
    chance: number; // 0.0 to 1.0
  }
}

// AI Service Types
export interface GeneratedImage {
  url: string;
  prompt: string;
}