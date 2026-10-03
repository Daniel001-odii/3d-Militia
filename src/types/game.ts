/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeaponType = 
  | 'pistol' 
  | 'ak47' 
  | 'm4' 
  | 'shotgun' 
  | 'sniper' 
  | 'rpg' 
  | 'flamethrower'
  | 'uzi';

export type GrenadeType = 'frag' | 'gas' | 'mine' | 'emp';

export type JetpackPerk = 'afterburner' | 'high_capacity' | 'quick_refuel' | 'heavy_armor' | 'scavenger';

export type HeadgearType = 'beret_green' | 'helmet_camo' | 'gas_mask' | 'aviators' | 'cyber_visor' | 'ninja_hood';

export type CamoPattern = 'woodland' | 'desert' | 'urban' | 'arctic' | 'midnight' | 'hazard';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  category: 'primary' | 'secondary';
  damage: number;
  fireRate: number; // rounds per second
  magazineSize: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  spread: number;
  bulletSpeed: number;
  range: number;
  pellets?: number;
  isExplosive?: boolean;
  blastRadius?: number;
  description: string;
  modelColor: string;
  recoil: number;
  twoHanded: boolean;
}

export interface PlayerLoadout {
  primaryWeapon: WeaponType;
  secondaryWeapon: WeaponType;
  grenade: GrenadeType;
  perk: JetpackPerk;
  headgear: HeadgearType;
  camo: CamoPattern;
  callsign: string;
  trailColor: string;
  customTextures?: {
    skin?: string;
    headgear?: string;
    weapon?: string;
    crosshair?: string;
  };
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  team: 'red' | 'blue' | 'ffa';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotationY: number; // facing angle
  aimPitch: number;  // vertical aim
  isFlying: boolean;
  isFiring: boolean;
  isReloading: boolean;
  health: number;
  maxHealth: number;
  nitro: number;
  maxNitro: number;
  currentWeaponIndex: 0 | 1;
  weapons: {
    type: WeaponType;
    currentMag: number;
    reserve: number;
  }[];
  grenadeCount: number;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
  loadout: PlayerLoadout;
  respawnTime?: number; // timestamp if dead
  isDead: boolean;
}

export interface Projectile {
  id: string;
  shooterId: string;
  type: WeaponType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
  isExplosive?: boolean;
  blastRadius?: number;
  color: string;
  spawnTime: number;
}

export interface ActiveGrenade {
  id: string;
  shooterId: string;
  type: GrenadeType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuseTimer: number; // in seconds
  detonated?: boolean;
}

export interface PickupItem {
  id: string;
  type: 'health' | 'nitro' | 'ammo' | 'weapon' | 'shield';
  weaponType?: WeaponType;
  x: number;
  y: number;
  z: number;
  respawnTimer: number;
  available: boolean;
}

export interface GameRoomSummary {
  id: string;
  name: string;
  mapId: 'outpost' | 'bunker' | 'cyber';
  mode: 'ffa' | 'tdm';
  playerCount: number;
  maxPlayers: number;
  botCount: number;
  status: 'waiting' | 'in_progress' | 'ended';
  isPrivate: boolean;
}

export interface RoomState {
  roomId: string;
  name: string;
  mapId: 'outpost' | 'bunker' | 'cyber';
  mode: 'ffa' | 'tdm';
  maxPlayers: number;
  timeRemaining: number; // in seconds
  status: 'waiting' | 'in_progress' | 'ended';
  scores: {
    red: number;
    blue: number;
  };
  players: Record<string, PlayerState>;
  pickups: PickupItem[];
}

export interface KillFeedEntry {
  id: string;
  killerName: string;
  killerTeam: 'red' | 'blue' | 'ffa';
  victimName: string;
  victimTeam: 'red' | 'blue' | 'ffa';
  weapon: WeaponType | GrenadeType | 'melee';
  isHeadshot?: boolean;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  team: 'red' | 'blue' | 'ffa';
  text: string;
  timestamp: number;
}
