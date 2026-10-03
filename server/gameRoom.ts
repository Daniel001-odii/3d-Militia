/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocket } from 'ws';
import { 
  PlayerState, 
  RoomState, 
  WeaponType, 
  PlayerLoadout, 
  KillFeedEntry,
  ChatMessage
} from '../src/types/game';
import { WEAPON_DEFINITIONS } from '../src/game/weapons';

const BOT_NAMES = [
  'Sgt. Rock',
  'Cpl. Blitz',
  'Viper',
  'Ghost',
  'Striker',
  'Havoc',
  'Razor',
  'Bullet Tooth',
  'Ironhide',
  'Phantom',
];

interface BotRosterEntry {
  name: string;
  weapon: WeaponType;
  headgear: PlayerLoadout['headgear'];
  camo: PlayerLoadout['camo'];
}

const BOT_ROSTER: BotRosterEntry[] = [
  { name: 'Hostile Viper', weapon: 'ak47', headgear: 'helmet_camo', camo: 'hazard' },
  { name: 'Hostile Havoc', weapon: 'shotgun', headgear: 'gas_mask', camo: 'hazard' },
  { name: 'Hostile Razor', weapon: 'm4', headgear: 'beret_green', camo: 'hazard' },
  { name: 'Hostile Phantom', weapon: 'sniper', headgear: 'aviators', camo: 'hazard' },
  { name: 'Hostile Striker', weapon: 'uzi', headgear: 'cyber_visor', camo: 'hazard' },
];

const BOT_CHATTERS = [
  'Target locked! Eat lead!',
  'Cover me, reloading!',
  'Nice shot, soldier!',
  'Rocket incoming, watch out!',
  'Taking heavy fire!',
  'Need backup at the bunker!',
  'Who threw that grenade?!',
];

export class GameRoom {
  public id: string;
  public name: string;
  public mapId: 'outpost' | 'bunker' | 'cyber';
  public mode: 'ffa' | 'tdm';
  public maxPlayers: number;
  public botCount: number;
  public timeRemaining: number = 300; // 5 min
  public status: 'waiting' | 'in_progress' | 'ended' = 'in_progress';
  public scores: { red: number; blue: number } = { red: 0, blue: 0 };

  public players: Map<string, PlayerState> = new Map();
  public clients: Map<string, WebSocket> = new Map();

  private tickInterval: NodeJS.Timeout | null = null;
  private botChatTimer = 0;
  private currentBotIndex = 0;
  private botBreatherTimer = 0;
  private botFireCooldown = 4.0;

  constructor(
    id: string,
    name: string,
    mapId: 'outpost' | 'bunker' | 'cyber' = 'outpost',
    mode: 'ffa' | 'tdm' = 'ffa',
    maxPlayers: number = 8,
    botCount: number = 1
  ) {
    this.id = id;
    this.name = name;
    this.mapId = mapId;
    this.mode = mode;
    this.maxPlayers = maxPlayers;
    this.botCount = 1; // Exactly 1 active enemy at a time (sequential 1v1 combat)

    // Spawn initial single hostile enemy
    this.spawnInitialBots();

    // Start server authoritative game loop (30 ticks per sec)
    this.startLoop();
  }

  private spawnInitialBots() {
    const botId = 'hostile_bot_active';
    const initialEnemy = BOT_ROSTER[0];
    const botName = initialEnemy.name;
    const botTeam = 'red';
    const chosenW = initialEnemy.weapon;

    const botLoadout: PlayerLoadout = {
      primaryWeapon: chosenW,
      secondaryWeapon: 'pistol',
      grenade: 'frag',
      perk: 'quick_refuel',
      headgear: initialEnemy.headgear,
      camo: initialEnemy.camo,
      callsign: botName,
      trailColor: '#ef4444',
    };

    const spawnX = 14 + (Math.random() - 0.5) * 6;
    const spawnZ = 14 + (Math.random() - 0.5) * 6;
    const spawnY = 1.2;

    const botPlayer: PlayerState = {
      id: botId,
      name: botName,
      isBot: true,
      team: botTeam,
      x: spawnX,
      y: spawnY,
      z: spawnZ,
      vx: 0,
      vy: 0,
      vz: 0,
      rotationY: Math.random() * Math.PI * 2,
      aimPitch: 0,
      isFlying: false,
      isFiring: false,
      isReloading: false,
      health: 70, // Tuned health: 2-3 clean hits to defeat
      maxHealth: 70,
      nitro: 100,
      maxNitro: 100,
      currentWeaponIndex: 0,
      weapons: [
        { type: chosenW, currentMag: WEAPON_DEFINITIONS[chosenW].magazineSize, reserve: 120 },
        { type: 'pistol', currentMag: 7, reserve: 35 },
      ],
      grenadeCount: 2,
      kills: 0,
      deaths: 0,
      score: 0,
      ping: 20 + Math.floor(Math.random() * 20),
      loadout: botLoadout,
      isDead: false,
    };

    this.players.set(botId, botPlayer);
  }

  public addClient(ws: WebSocket, playerId: string, name: string, loadout: PlayerLoadout) {
    this.clients.set(playerId, ws);

    // Player is the Solo Fighter (Blue Team) - all other AI soldiers are Hostile Enemies (Red Team)
    const team: 'red' | 'blue' | 'ffa' = 'blue';

    const playerState: PlayerState = {
      id: playerId,
      name: name || loadout.callsign || 'SOLDIER',
      isBot: false,
      team,
      x: (Math.random() - 0.5) * 16,
      y: 2,
      z: (Math.random() - 0.5) * 16,
      vx: 0,
      vy: 0,
      vz: 0,
      rotationY: 0,
      aimPitch: 0,
      isFlying: false,
      isFiring: false,
      isReloading: false,
      health: loadout.perk === 'heavy_armor' ? 125 : 100,
      maxHealth: loadout.perk === 'heavy_armor' ? 125 : 100,
      nitro: loadout.perk === 'high_capacity' ? 150 : 100,
      maxNitro: loadout.perk === 'high_capacity' ? 150 : 100,
      currentWeaponIndex: 0,
      weapons: [
        {
          type: loadout.primaryWeapon,
          currentMag: WEAPON_DEFINITIONS[loadout.primaryWeapon].magazineSize,
          reserve: WEAPON_DEFINITIONS[loadout.primaryWeapon].reserveAmmo,
        },
        {
          type: loadout.secondaryWeapon,
          currentMag: WEAPON_DEFINITIONS[loadout.secondaryWeapon].magazineSize,
          reserve: WEAPON_DEFINITIONS[loadout.secondaryWeapon].reserveAmmo,
        },
      ],
      grenadeCount: loadout.perk === 'scavenger' ? 5 : 3,
      kills: 0,
      deaths: 0,
      score: 0,
      ping: 25,
      loadout,
      isDead: false,
    };

    this.players.set(playerId, playerState);

    // Send initial full room state to the newly connected player
    this.send(ws, {
      type: 'room_joined',
      roomId: this.id,
      playerId,
      roomState: this.getRoomState(),
    });

    // Notify other players
    this.broadcast({
      type: 'player_joined',
      player: playerState,
    }, playerId);

    // Announce in chat
    this.broadcast({
      type: 'chat_message',
      chat: {
        id: `chat_${Date.now()}`,
        senderName: 'SYSTEM',
        team: 'ffa',
        text: `${playerState.name} deployed into the arena!`,
        timestamp: Date.now(),
      },
    });
  }

  public removeClient(playerId: string) {
    const p = this.players.get(playerId);
    this.clients.delete(playerId);
    this.players.delete(playerId);

    if (p) {
      this.broadcast({
        type: 'player_left',
        playerId,
      });
      this.broadcast({
        type: 'chat_message',
        chat: {
          id: `chat_${Date.now()}`,
          senderName: 'SYSTEM',
          team: 'ffa',
          text: `${p.name} evacuated.`,
          timestamp: Date.now(),
        },
      });
    }
  }

  public handleClientMessage(playerId: string, data: Record<string, unknown>) {
    const player = this.players.get(playerId);
    if (!player) return;

    const action = data.action as string;

    if (action === 'input_update') {
      // Delta update from client
      player.x = (data.x as number) ?? player.x;
      player.y = (data.y as number) ?? player.y;
      player.z = (data.z as number) ?? player.z;
      player.vx = (data.vx as number) ?? player.vx;
      player.vy = (data.vy as number) ?? player.vy;
      player.vz = (data.vz as number) ?? player.vz;
      player.rotationY = (data.rotationY as number) ?? player.rotationY;
      player.aimPitch = (data.aimPitch as number) ?? player.aimPitch;
      player.isFlying = (data.isFlying as boolean) ?? player.isFlying;
      player.isFiring = (data.isFiring as boolean) ?? player.isFiring;
      player.health = (data.health as number) ?? player.health;
      player.nitro = (data.nitro as number) ?? player.nitro;
      player.currentWeaponIndex = (data.weaponIndex as 0 | 1) ?? player.currentWeaponIndex;
    } else if (action === 'weapon_fire') {
      // Forward fire event to all other clients for visuals/sfx
      this.broadcast({
        type: 'weapon_fire',
        shooterId: playerId,
        weaponType: data.weaponType,
        origin: data.origin,
        direction: data.direction,
      }, playerId);
    } else if (action === 'throw_grenade') {
      this.broadcast({
        type: 'grenade_spawned',
        grenade: data.grenade,
      }, playerId);
    } else if (action === 'chat_message') {
      const text = String(data.text || '').trim().slice(0, 140);
      if (text) {
        const chat: ChatMessage = {
          id: `chat_${Date.now()}_${Math.random()}`,
          senderName: player.name,
          team: player.team,
          text,
          timestamp: Date.now(),
        };
        this.broadcast({
          type: 'chat_message',
          chat,
        });
      }
    } else if (action === 'damage_player') {
      const victimId = (data.victimId as string) || '';
      const damage = Number(data.damage) || 25;
      
      let victim = this.players.get(victimId);
      if (!victim) {
        // Resolve by name
        for (const p of this.players.values()) {
          if (p.name.toLowerCase() === victimId.toLowerCase()) {
            victim = p;
            break;
          }
        }
      }
      if (!victim) {
        // Fallback to active hostile bot
        victim = this.players.get('hostile_bot_active') || Array.from(this.players.values()).find(p => p.isBot) || undefined;
      }

      if (victim && !victim.isDead) {
        victim.health = Math.max(0, victim.health - damage);
        if (victim.health <= 0) {
          victim.isDead = true;
          victim.health = 0;
          victim.deaths++;
          player.kills++;
          player.score += 100;

          const weapon = (data.weapon as WeaponType) || 'ak47';
          const killEntry: KillFeedEntry = {
            id: `kill_${Date.now()}_${Math.random()}`,
            killerName: player.name,
            killerTeam: player.team,
            victimName: victim.name,
            victimTeam: victim.team,
            weapon,
            timestamp: Date.now(),
          };

          this.broadcast({
            type: 'kill_confirmed',
            kill: killEntry,
            scores: this.scores,
          });

          // Breather period: 4.0s before next enemy in roster spawns
          this.botBreatherTimer = 4.0;
        }
      }
    } else if (action === 'player_kill') {
      const victimId = (data.victimId as string) || '';
      const weapon = (data.weapon as WeaponType) || 'ak47';

      let victim = this.players.get(victimId);
      if (!victim) {
        // Resolve by name
        for (const p of this.players.values()) {
          if (p.name.toLowerCase() === victimId.toLowerCase()) {
            victim = p;
            break;
          }
        }
      }
      if (!victim) {
        // Fallback to active hostile bot
        victim = this.players.get('hostile_bot_active') || Array.from(this.players.values()).find(p => p.isBot) || undefined;
      }

      if (victim && !victim.isDead) {
        victim.isDead = true;
        victim.health = 0;
        victim.deaths++;
        player.kills++;
        player.score += 100;

        if (this.mode === 'tdm') {
          if (player.team === 'red') this.scores.red++;
          else if (player.team === 'blue') this.scores.blue++;
        }

        const killEntry: KillFeedEntry = {
          id: `kill_${Date.now()}_${Math.random()}`,
          killerName: player.name,
          killerTeam: player.team,
          victimName: victim.name,
          victimTeam: victim.team,
          weapon,
          timestamp: Date.now(),
        };

        this.broadcast({
          type: 'kill_confirmed',
          kill: killEntry,
          scores: this.scores,
        });

        // Breather period: 4.0s before next enemy in roster spawns
        this.botBreatherTimer = 4.0;
      }
    }
  }

  private startLoop() {
    const dt = 1 / 30; // 30 FPS server tick
    this.tickInterval = setInterval(() => {
      this.tick(dt);
    }, 1000 / 30);
  }

  private tick(dt: number) {
    if (this.status !== 'in_progress') return;

    // Match Timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.status = 'ended';
      this.broadcast({
        type: 'game_over',
        scores: this.scores,
        winner: this.mode === 'tdm' 
          ? (this.scores.red > this.scores.blue ? 'Red Team' : this.scores.blue > this.scores.red ? 'Blue Team' : 'Draw')
          : 'Match Complete',
      });
      return;
    }

    // Update AI Bots
    this.updateBots(dt);

    // Bot random banter in chat
    this.botChatTimer += dt;
    if (this.botChatTimer > 25 && this.clients.size > 0) {
      this.botChatTimer = 0;
      const bots = Array.from(this.players.values()).filter(p => p.isBot && !p.isDead);
      if (bots.length > 0 && Math.random() < 0.6) {
        const randomBot = bots[Math.floor(Math.random() * bots.length)];
        const chatter = BOT_CHATTERS[Math.floor(Math.random() * BOT_CHATTERS.length)];
        this.broadcast({
          type: 'chat_message',
          chat: {
            id: `chat_${Date.now()}`,
            senderName: randomBot.name,
            team: randomBot.team,
            text: chatter,
            timestamp: Date.now(),
          },
        });
      }
    }

    // Broadcast state snapshot to all clients
    const playersObj: Record<string, PlayerState> = {};
    for (const [id, state] of this.players.entries()) {
      playersObj[id] = state;
    }

    this.broadcast({
      type: 'state_tick',
      players: playersObj,
      timeRemaining: Math.round(this.timeRemaining),
      scores: this.scores,
    });
  }

  private updateBots(dt: number) {
    // 1. Breather countdown between enemies (enemies come one after the other)
    if (this.botBreatherTimer > 0) {
      this.botBreatherTimer -= dt;
      if (this.botBreatherTimer <= 0) {
        // Next hostile enemy enters arena!
        this.currentBotIndex = (this.currentBotIndex + 1) % BOT_ROSTER.length;
        const nextRoster = BOT_ROSTER[this.currentBotIndex];
        const bot = this.players.get('hostile_bot_active');
        if (bot) {
          bot.name = nextRoster.name;
          bot.loadout.primaryWeapon = nextRoster.weapon;
          bot.loadout.headgear = nextRoster.headgear;
          bot.loadout.camo = nextRoster.camo;
          bot.loadout.callsign = nextRoster.name;
          bot.weapons[0] = {
            type: nextRoster.weapon,
            currentMag: WEAPON_DEFINITIONS[nextRoster.weapon].magazineSize,
            reserve: 120,
          };
          bot.health = 70;
          bot.maxHealth = 70;
          bot.isDead = false;
          bot.x = 12 + (Math.random() - 0.5) * 6;
          bot.z = 12 + (Math.random() - 0.5) * 6;
          bot.y = 1.2;
          bot.vx = 0;
          bot.vy = 0;
          bot.vz = 0;
          this.botFireCooldown = 4.0; // 4s grace period before first shot
        }
      }
      return;
    }

    const activeTargets = Array.from(this.players.values()).filter(p => !p.isDead && !p.isBot);

    for (const bot of this.players.values()) {
      if (!bot.isBot || bot.isDead) continue;

      // Find closest human enemy
      let closestDist = Infinity;
      let target: PlayerState | null = null;

      for (const other of activeTargets) {
        if (other.id === bot.id) continue;
        if (this.mode === 'tdm' && other.team === bot.team) continue;

        const dist = Math.hypot(other.x - bot.x, other.y - bot.y, other.z - bot.z);
        if (dist < closestDist) {
          closestDist = dist;
          target = other;
        }
      }

      if (target) {
        const dx = target.x - bot.x;
        const dy = target.y - bot.y;
        const dz = target.z - bot.z;
        const horizDist = Math.hypot(dx, dz) || 1;

        // Facing & Aim in full 3D
        bot.rotationY = Math.atan2(dx, dz);
        bot.aimPitch = Math.atan2(dy, horizDist);

        // Movement: reduced aggression (1.6 m/s), maintain comfortable 14-22m distance
        const moveSpeed = 1.6;
        if (horizDist > 16) {
          bot.vx = (dx / horizDist) * moveSpeed;
          bot.vz = (dz / horizDist) * moveSpeed;
        } else if (horizDist < 10) {
          // Gently back away if player gets too close
          bot.vx = -(dx / horizDist) * 1.2;
          bot.vz = -(dz / horizDist) * 1.2;
        } else {
          bot.vx *= 0.85;
          bot.vz *= 0.85;
        }

        // Jetpack flight: gentle hop only if falling below arena or target is high above
        const needsLift = dy > 3.0 || bot.y < 0.8;
        if (needsLift && bot.nitro > 25) {
          bot.isFlying = true;
          bot.vy = Math.min(10, bot.vy + 14 * dt);
          bot.nitro = Math.max(0, bot.nitro - 18 * dt);
        } else {
          bot.isFlying = false;
          bot.vy -= 22 * dt;
          if (bot.nitro < bot.maxNitro) {
            bot.nitro = Math.min(bot.maxNitro, bot.nitro + 25 * dt);
          }
        }

        // Fire burst: relaxed cadence (once every 4.5s - 5.5s) with deliberate aim error
        this.botFireCooldown -= dt;
        if (closestDist < 35 && this.botFireCooldown <= 0) {
          this.botFireCooldown = 4.5 + Math.random() * 1.2;
          bot.isFiring = true;
          const aimLen = Math.hypot(dx, dy, dz) || 1;
          const spreadX = (Math.random() - 0.5) * 0.16;
          const spreadY = (Math.random() - 0.5) * 0.16;
          const spreadZ = (Math.random() - 0.5) * 0.16;
          this.broadcast({
            type: 'weapon_fire',
            shooterId: bot.id,
            weaponType: bot.loadout.primaryWeapon,
            origin: { x: bot.x, y: bot.y + 0.3, z: bot.z },
            direction: { 
              x: dx / aimLen + spreadX, 
              y: dy / aimLen + spreadY, 
              z: dz / aimLen + spreadZ 
            },
          });
        } else {
          bot.isFiring = false;
        }
      } else {
        bot.isFiring = false;
        bot.isFlying = false;
        bot.vy -= 20 * dt;
        bot.vx *= 0.9;
        bot.vz *= 0.9;
      }

      // Physics update
      bot.x += bot.vx * dt;
      bot.y += bot.vy * dt;
      bot.z += bot.vz * dt;

      // Arena bounds clamp
      bot.x = Math.max(-34, Math.min(34, bot.x));
      bot.z = Math.max(-34, Math.min(34, bot.z));
      if (bot.y < 0.5) {
        bot.y = 0.5;
        bot.vy = 0;
      }
      if (bot.y > 24) {
        bot.y = 24;
        bot.vy = 0;
      }
    }
  }

  public getRoomState(): RoomState {
    const playersObj: Record<string, PlayerState> = {};
    for (const [id, state] of this.players.entries()) {
      playersObj[id] = state;
    }
    return {
      roomId: this.id,
      name: this.name,
      mapId: this.mapId,
      mode: this.mode,
      maxPlayers: this.maxPlayers,
      timeRemaining: Math.round(this.timeRemaining),
      status: this.status,
      scores: this.scores,
      players: playersObj,
      pickups: [],
    };
  }

  public broadcast(msg: Record<string, unknown>, excludePlayerId?: string) {
    const payload = JSON.stringify(msg);
    for (const [id, ws] of this.clients.entries()) {
      if (id !== excludePlayerId && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  public send(ws: WebSocket, msg: Record<string, unknown>) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  public close() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    for (const ws of this.clients.values()) {
      ws.close();
    }
    this.clients.clear();
    this.players.clear();
  }
}
