/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { 
  PlayerLoadout, 
  PlayerState, 
  WeaponType, 
  GrenadeType, 
  Projectile, 
  ActiveGrenade,
  KillFeedEntry
} from '../types/game';
import { WEAPON_DEFINITIONS } from './weapons';
import { createSoldier3D, createWeaponMesh, SoldierMeshRef } from './soldierModel';
import { loadMap, MapDefinition } from './maps';
import { ParticleSystem } from './particles';
import { sound } from './audio';

export interface TargetEnemyInfo {
  name: string;
  weapon: WeaponType;
  health: number;
  maxHealth: number;
}

export interface GameEngineCallbacks {
  onHealthChange: (current: number, max: number) => void;
  onNitroChange: (current: number, max: number) => void;
  onWeaponChange: (
    weaponIndex: 0 | 1, 
    weaponType: WeaponType, 
    magAmmo: number, 
    reserveAmmo: number, 
    isReloading: boolean
  ) => void;
  onGrenadeChange: (count: number, type: GrenadeType) => void;
  onHitmarker: () => void;
  onKillFeed: (entry: KillFeedEntry) => void;
  onPlayerDied: (killer: string, weapon: string) => void;
  onPlayerRespawn: () => void;
  onPointerLockChange: (isLocked: boolean) => void;
  onADSChange: (isADS: boolean, isSniper: boolean) => void;
  onSendLocalAction?: (action: Record<string, unknown>) => void;
  onWaveStatusChange?: (target: TargetEnemyInfo | null, waveNotice: string | null) => void;
  onTogglePause?: () => void;
}

interface WeaponViewModelConfig {
  hipPos: THREE.Vector3;
  hipRot: THREE.Vector3;
  adsPos: THREE.Vector3;
  adsRot: THREE.Vector3;
  adsFOV: number;
}

const WEAPON_VIEWMODEL_CONFIGS: Record<WeaponType, WeaponViewModelConfig> = {
  ak47: {
    hipPos: new THREE.Vector3(0.20, -0.19, -0.38),
    hipRot: new THREE.Vector3(0.02, -0.04, 0),
    adsPos: new THREE.Vector3(0.0, -0.175, -0.28),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 52,
  },
  m4: {
    hipPos: new THREE.Vector3(0.20, -0.19, -0.38),
    hipRot: new THREE.Vector3(0.02, -0.04, 0),
    adsPos: new THREE.Vector3(0.0, -0.18, -0.28),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 52,
  },
  pistol: {
    hipPos: new THREE.Vector3(0.18, -0.16, -0.34),
    hipRot: new THREE.Vector3(0.02, -0.03, 0),
    adsPos: new THREE.Vector3(0.0, -0.17, -0.25),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 58,
  },
  shotgun: {
    hipPos: new THREE.Vector3(0.21, -0.18, -0.38),
    hipRot: new THREE.Vector3(0.02, -0.04, 0),
    adsPos: new THREE.Vector3(0.0, -0.14, -0.28),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 56,
  },
  uzi: {
    hipPos: new THREE.Vector3(0.18, -0.17, -0.34),
    hipRot: new THREE.Vector3(0.02, -0.03, 0),
    adsPos: new THREE.Vector3(0.0, -0.155, -0.25),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 56,
  },
  sniper: {
    hipPos: new THREE.Vector3(0.20, -0.20, -0.40),
    hipRot: new THREE.Vector3(0.02, -0.04, 0),
    adsPos: new THREE.Vector3(0.0, -0.26, -0.30),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 22,
  },
  rpg: {
    hipPos: new THREE.Vector3(0.22, -0.18, -0.42),
    hipRot: new THREE.Vector3(0.02, -0.04, 0),
    adsPos: new THREE.Vector3(-0.08, -0.14, -0.35),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 50,
  },
  flamethrower: {
    hipPos: new THREE.Vector3(0.20, -0.19, -0.40),
    hipRot: new THREE.Vector3(0.02, -0.04, 0),
    adsPos: new THREE.Vector3(0.0, -0.15, -0.32),
    adsRot: new THREE.Vector3(0, 0, 0),
    adsFOV: 54,
  },
};

interface HostileBotDef {
  id: string;
  name: string;
  weapon: WeaponType;
  headgear: PlayerLoadout['headgear'];
  camo: PlayerLoadout['camo'];
  fireInterval: number;
  maxHealth: number;
}

export const ACTIVE_HOSTILE_ID = 'hostile_bot_active';

const DEFAULT_HOSTILE_BOTS: HostileBotDef[] = [
  {
    id: ACTIVE_HOSTILE_ID,
    name: 'Hostile Viper',
    weapon: 'ak47',
    headgear: 'helmet_camo',
    camo: 'hazard',
    fireInterval: 4.8,
    maxHealth: 70,
  },
  {
    id: ACTIVE_HOSTILE_ID,
    name: 'Hostile Havoc',
    weapon: 'shotgun',
    headgear: 'gas_mask',
    camo: 'hazard',
    fireInterval: 5.2,
    maxHealth: 75,
  },
  {
    id: ACTIVE_HOSTILE_ID,
    name: 'Hostile Razor',
    weapon: 'm4',
    headgear: 'beret_green',
    camo: 'hazard',
    fireInterval: 4.5,
    maxHealth: 70,
  },
  {
    id: ACTIVE_HOSTILE_ID,
    name: 'Hostile Phantom',
    weapon: 'sniper',
    headgear: 'aviators',
    camo: 'hazard',
    fireInterval: 5.5,
    maxHealth: 65,
  },
  {
    id: ACTIVE_HOSTILE_ID,
    name: 'Hostile Striker',
    weapon: 'uzi',
    headgear: 'cyber_visor',
    camo: 'hazard',
    fireInterval: 4.2,
    maxHealth: 70,
  },
];

interface BotAIState {
  fireTimer: number;
  strafeTimer: number;
  strafeDir: number;
}

export class MiniMilitiaEngine {
  public container: HTMLElement;
  public callbacks: GameEngineCallbacks;
  public localPlayerId: string;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public particles: ParticleSystem;
  public mapDef: MapDefinition;

  // Local Player FPS State
  public localState: PlayerState;
  public isPointerLocked = false;
  public mouseSensitivity = 0.0022;
  public yaw = 0;
  public pitch = 0;

  // First-Person Viewmodel (Arms & Gun)
  public viewmodelGroup: THREE.Group;
  private currentViewmodelWeapon: THREE.Group | null = null;
  private viewmodelSway = new THREE.Vector2(0, 0);
  private viewmodelRecoilOffset = new THREE.Vector3(0, 0, 0);
  private viewmodelRecoilRot = new THREE.Vector3(0, 0, 0);
  private walkBobTimer = 0;
  public isADS = false;

  // Remote Players & Hostile Enemy Bots (Sequential 1v1 Spawning)
  public remoteMeshes: Map<string, SoldierMeshRef> = new Map();
  public remoteStates: Map<string, PlayerState> = new Map();
  private botAIStates: Map<string, BotAIState> = new Map();
  public currentHostileIndex = 0;
  public activeEnemyId: string | null = null;
  public waveCountdown = 0;
  public isAwaitingNextEnemy = false;

  // Pickups
  public pickupMeshes: Map<string, THREE.Group> = new Map();

  // Projectiles & Grenades
  public projectiles: Projectile[] = [];
  public projectileMeshes: Map<string, THREE.Mesh> = new Map();
  public activeGrenades: ActiveGrenade[] = [];
  public grenadeMeshes: Map<string, THREE.Mesh> = new Map();

  // Controls & Inputs
  private keys: Record<string, boolean> = {};
  private isMouseDown = false;
  private isRightMouseDown = false;
  private isBoosting = false;
  private lastFireTime = 0;
  private reloadTimer = 0;
  private meleeTimer = 0;

  // Clock
  private clock: THREE.Clock;
  private animFrameId: number | null = null;
  private isRunning = false;
  public isPaused = false;

  // Virtual / Mobile Controls State
  private virtualForward = 0;
  private virtualStrafe = 0;
  private virtualWantsFly = false;

  public setVirtualMove(forward: number, strafe: number, wantsFly: boolean) {
    this.virtualForward = forward;
    this.virtualStrafe = strafe;
    this.virtualWantsFly = wantsFly;
  }

  public applyVirtualLook(dx: number, dy: number) {
    if (this.isPaused) return;
    const sens = this.isADS ? this.mouseSensitivity * 0.5 : this.mouseSensitivity;
    this.yaw -= dx * sens * 1.5;
    this.pitch -= dy * sens * 1.5;
    const maxPitch = Math.PI * 0.46;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public setVirtualFiring(firing: boolean) {
    this.isMouseDown = firing;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.keys = {};
    this.isMouseDown = false;
    this.isRightMouseDown = false;
    this.virtualForward = 0;
    this.virtualStrafe = 0;
    this.virtualWantsFly = false;
    sound.setJetpackThruster(false);
    if (paused) {
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock?.();
        } catch {
          // Ignore
        }
      }
    }
  }

  constructor(
    container: HTMLElement,
    loadout: PlayerLoadout,
    mapId: 'outpost' | 'bunker' | 'cyber',
    callbacks: GameEngineCallbacks,
    localPlayerId: string = 'local_player'
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.localPlayerId = localPlayerId;
    this.clock = new THREE.Clock();

    // Scene & FPS Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(mapId === 'cyber' ? 0x050814 : 0x0a101d);
    this.scene.fog = new THREE.FogExp2(mapId === 'cyber' ? 0x050814 : 0x0a101d, 0.015);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.02, 300);
    this.camera.rotation.order = 'YXZ';

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.3);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.9);
    dirLight.position.set(25, 45, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    this.scene.add(dirLight);

    // Map Construction
    this.mapDef = loadMap(mapId);
    this.scene.add(this.mapDef.group);

    // Particle System
    this.particles = new ParticleSystem(this.scene);

    // Pickups
    this.initPickups();

    // Local Player State (Solo Fighter - Blue Team)
    const maxHp = loadout.perk === 'heavy_armor' ? 125 : 100;
    const maxNitro = loadout.perk === 'high_capacity' ? 150 : 100;
    const spawnPt = this.mapDef.spawnPoints[0] || new THREE.Vector3(0, 1.2, 0);

    this.localState = {
      id: this.localPlayerId,
      name: loadout.callsign || 'SOLDIER',
      isBot: false,
      team: 'blue', // Solo fighter on Blue team
      x: spawnPt.x,
      y: spawnPt.y + 0.9,
      z: spawnPt.z,
      vx: 0,
      vy: 0,
      vz: 0,
      rotationY: 0,
      aimPitch: 0,
      isFlying: false,
      isFiring: false,
      isReloading: false,
      health: maxHp,
      maxHealth: maxHp,
      nitro: maxNitro,
      maxNitro: maxNitro,
      currentWeaponIndex: 0,
      weapons: [
        {
          type: loadout.primaryWeapon,
          currentMag: WEAPON_DEFINITIONS[loadout.primaryWeapon].magazineSize,
          reserve: loadout.perk === 'scavenger' ? WEAPON_DEFINITIONS[loadout.primaryWeapon].reserveAmmo * 1.5 : WEAPON_DEFINITIONS[loadout.primaryWeapon].reserveAmmo,
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
      ping: 15,
      loadout,
      isDead: false,
    };

    // Position camera at local player eye level
    this.camera.position.set(this.localState.x, this.localState.y + 0.65, this.localState.z);
    this.scene.add(this.camera);

    // First-Person Viewmodel Setup (Arms & Weapon)
    this.viewmodelGroup = new THREE.Group();
    const initCfg = WEAPON_VIEWMODEL_CONFIGS[loadout.primaryWeapon];
    this.viewmodelGroup.position.copy(initCfg.hipPos);
    this.camera.add(this.viewmodelGroup);

    // Build FPS Arms & Initial Gun
    this.buildViewmodel(loadout.primaryWeapon);

    // Initial Hostile Enemy Bots (All on Red Team - no friendly soldiers!)
    this.initHostileBots();

    // Initial HUD trigger
    this.callbacks.onHealthChange(this.localState.health, this.localState.maxHealth);
    this.callbacks.onNitroChange(this.localState.nitro, this.localState.maxNitro);
    const activeW = this.localState.weapons[this.localState.currentWeaponIndex];
    this.callbacks.onWeaponChange(
      this.localState.currentWeaponIndex,
      activeW.type,
      activeW.currentMag,
      activeW.reserve,
      false
    );
    this.callbacks.onGrenadeChange(this.localState.grenadeCount, this.localState.loadout.grenade);

    // Inputs & Pointer Lock
    this.setupInputs();

    window.addEventListener('resize', this.onResize);

    this.isRunning = true;
    this.animate();
  }

  private initHostileBots() {
    this.currentHostileIndex = 0;
    this.spawnSingleHostileBot(DEFAULT_HOSTILE_BOTS[0]);
  }

  private spawnSingleHostileBot(botDef: HostileBotDef) {
    this.activeEnemyId = botDef.id;
    this.isAwaitingNextEnemy = false;
    this.waveCountdown = 0;

    // Pick a spawn point far from the player
    const playerPos = this.camera ? this.camera.position : new THREE.Vector3(0, 2, 0);
    let bestSpawn = this.mapDef.spawnPoints[1] || new THREE.Vector3(14, 1.2, 14);
    let maxDist = -1;
    for (const pt of this.mapDef.spawnPoints) {
      const d = pt.distanceTo(playerPos);
      if (d > maxDist) {
        maxDist = d;
        bestSpawn = pt;
      }
    }

    const botLoadout: PlayerLoadout = {
      primaryWeapon: botDef.weapon,
      secondaryWeapon: 'pistol',
      grenade: 'frag',
      perk: 'quick_refuel',
      headgear: botDef.headgear,
      camo: botDef.camo,
      callsign: botDef.name,
      trailColor: '#ef4444',
    };

    let enemy = this.remoteStates.get(botDef.id);
    let mesh = this.remoteMeshes.get(botDef.id);

    const botHp = botDef.maxHealth || 70;

    if (!enemy) {
      enemy = {
        id: botDef.id,
        name: botDef.name,
        isBot: true,
        team: 'red',
        x: bestSpawn.x,
        y: bestSpawn.y + 0.9,
        z: bestSpawn.z,
        vx: 0,
        vy: 0,
        vz: 0,
        rotationY: Math.random() * Math.PI * 2,
        aimPitch: 0,
        isFlying: false,
        isFiring: false,
        isReloading: false,
        health: botHp,
        maxHealth: botHp,
        nitro: 100,
        maxNitro: 100,
        currentWeaponIndex: 0,
        weapons: [
          { type: botDef.weapon, currentMag: WEAPON_DEFINITIONS[botDef.weapon].magazineSize, reserve: 120 },
          { type: 'pistol', currentMag: 7, reserve: 35 },
        ],
        grenadeCount: 2,
        kills: 0,
        deaths: 0,
        score: 0,
        ping: 25,
        loadout: botLoadout,
        isDead: false,
      };
      this.remoteStates.set(botDef.id, enemy);

      mesh = createSoldier3D(botLoadout, 'red', false);
      mesh.group.position.set(enemy.x, enemy.y, enemy.z);
      mesh.setWeapon(botDef.weapon);
      this.scene.add(mesh.group);
      this.remoteMeshes.set(botDef.id, mesh);
    } else {
      enemy.name = botDef.name;
      enemy.loadout.callsign = botDef.name;
      enemy.loadout.primaryWeapon = botDef.weapon;
      enemy.weapons[0] = {
        type: botDef.weapon,
        currentMag: WEAPON_DEFINITIONS[botDef.weapon].magazineSize,
        reserve: 120,
      };
      enemy.x = bestSpawn.x;
      enemy.y = bestSpawn.y + 0.9;
      enemy.z = bestSpawn.z;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.vz = 0;
      enemy.health = botHp;
      enemy.maxHealth = botHp;
      enemy.isDead = false;
      if (mesh) {
        mesh.group.position.set(enemy.x, enemy.y, enemy.z);
        mesh.setHealthPercent(1.0);
        mesh.setWeapon(botDef.weapon);
        mesh.group.visible = true;
      }
    }

    // Relaxed initial fire timer (4.5s allows player to spot, aim, and engage first!)
    this.botAIStates.set(botDef.id, {
      fireTimer: 4.5 + Math.random(),
      strafeTimer: 3.0,
      strafeDir: Math.random() > 0.5 ? 1 : -1,
    });

    this.particles.emitExplosion(new THREE.Vector3(enemy.x, enemy.y + 0.5, enemy.z), 1.8);
    this.callbacks.onWaveStatusChange?.({
      name: botDef.name,
      weapon: botDef.weapon,
      health: botHp,
      maxHealth: botHp,
    }, null);
  }

  private buildViewmodel(weaponType: WeaponType) {
    if (this.currentViewmodelWeapon) {
      this.viewmodelGroup.remove(this.currentViewmodelWeapon);
    }

    const group = new THREE.Group();

    // 1. 3D Weapon Mesh (cleanly centered at grip, pointing along -Z)
    const gunMesh = createWeaponMesh(weaponType, false);
    gunMesh.position.set(0, 0, 0);
    group.add(gunMesh);

    // 2. First-Person Soldier Arms / Gloves
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark tactical glove
      roughness: 0.8,
    });
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x3f4a34, // Camo sleeve
      roughness: 0.9,
    });

    // Right Arm (Grips trigger and handle)
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.45, 8), sleeveMat);
    rightArm.position.set(0.18, -0.18, 0.14);
    rightArm.rotation.set(0.35, -0.1, -0.2);
    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), gloveMat);
    rightGlove.position.set(0.12, -0.06, 0.04);
    group.add(rightArm, rightGlove);

    // Left Arm (Supports barrel/handguard)
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.5, 8), sleeveMat);
    leftArm.position.set(-0.18, -0.18, 0.08);
    leftArm.rotation.set(0.5, 0.25, 0.35);
    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), gloveMat);
    leftGlove.position.set(-0.06, -0.04, -0.25);
    group.add(leftArm, leftGlove);

    this.currentViewmodelWeapon = group;
    this.viewmodelGroup.add(group);
  }

  private initPickups() {
    for (const p of this.mapDef.pickupSpawns) {
      const pGroup = new THREE.Group();
      pGroup.position.copy(p.position);

      let pMat: THREE.Material;
      if (p.type === 'health') {
        pMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.6 });
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.3), pMat);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), pMat);
        pGroup.add(crossH, crossV);
      } else if (p.type === 'nitro') {
        pMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.7 });
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12), pMat);
        pGroup.add(can);
      } else {
        pMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.5 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), pMat);
        pGroup.add(box);
      }

      this.scene.add(pGroup);
      this.pickupMeshes.set(p.id, pGroup);
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    // Pointer Lock & Mouse Controls
    this.container.addEventListener('click', this.requestPointerLock);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('contextmenu', e => e.preventDefault());
  }

  private onBlur = () => {
    this.keys = {};
    this.isMouseDown = false;
    this.isRightMouseDown = false;
  };

  public requestPointerLock = () => {
    if (this.isPaused) return;
    if (!this.isPointerLocked) {
      try {
        this.container.requestPointerLock();
      } catch {
        // Fallback for iframe constraints
      }
    }
  };

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.container;
    this.callbacks.onPointerLockChange(this.isPointerLocked);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.isPaused) return;
    const sens = this.isADS ? this.mouseSensitivity * 0.5 : this.mouseSensitivity;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;

    // Strict Pitch Clamp (-83° to +83°) prevents camera from flipping upside down
    const maxPitch = Math.PI * 0.46;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Viewmodel lag sway
    this.viewmodelSway.x -= e.movementX * 0.0003;
    this.viewmodelSway.y += e.movementY * 0.0003;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      // Escape is handled by App.tsx window listener
      return;
    }

    if (this.isPaused) return;

    this.keys[e.code] = true;
    if (e.key) this.keys[e.key.toLowerCase()] = true;

    // Switch weapons: 1, 2, Q
    if (e.code === 'Digit1') this.switchWeapon(0);
    if (e.code === 'Digit2') this.switchWeapon(1);
    if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
      this.switchWeapon(this.localState.currentWeaponIndex === 0 ? 1 : 0);
    }

    // Toggle Iron Sights / ADS with Key T (requested by user)
    if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') {
      this.toggleADS();
    }

    // Reload: R
    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') this.startReload();

    // Grenade: G
    if (e.code === 'KeyG' || e.key === 'g' || e.key === 'G') this.throwGrenade();

    // Melee Bash: F
    if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') this.meleeBash();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.key) this.keys[e.key.toLowerCase()] = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    this.requestPointerLock();

    if (e.button === 0) {
      // Left Click: Shoot / Fire
      this.isMouseDown = true;
    } else if (e.button === 2) {
      // Right Click: Aim Down Sights (ADS / Iron Sights)
      this.isRightMouseDown = true;
      this.setADS(true);
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
      this.setADS(false);
    }
  };

  public toggleADS() {
    this.setADS(!this.isADS);
  }

  public setADS(active: boolean) {
    this.isADS = active;
    const curW = this.localState.weapons[this.localState.currentWeaponIndex].type;
    const isSniper = curW === 'sniper';
    this.callbacks.onADSChange(this.isADS, isSniper);
  }

  public switchWeapon(index: 0 | 1) {
    if (this.localState.currentWeaponIndex === index) return;
    this.localState.currentWeaponIndex = index;
    const w = this.localState.weapons[index];

    this.buildViewmodel(w.type);
    this.reloadTimer = 0;
    this.localState.isReloading = false;
    this.setADS(false);

    this.callbacks.onWeaponChange(index, w.type, w.currentMag, w.reserve, false);
    sound.playPickup();
  }

  public startReload() {
    const activeW = this.localState.weapons[this.localState.currentWeaponIndex];
    const def = WEAPON_DEFINITIONS[activeW.type];
    if (activeW.currentMag >= def.magazineSize || activeW.reserve <= 0 || this.localState.isReloading) {
      return;
    }
    this.localState.isReloading = true;
    this.reloadTimer = def.reloadTime;
    this.setADS(false);
    sound.playReload();

    this.callbacks.onWeaponChange(
      this.localState.currentWeaponIndex,
      activeW.type,
      activeW.currentMag,
      activeW.reserve,
      true
    );
  }

  public completeReload() {
    const activeW = this.localState.weapons[this.localState.currentWeaponIndex];
    const def = WEAPON_DEFINITIONS[activeW.type];
    const needed = def.magazineSize - activeW.currentMag;
    const toLoad = Math.min(needed, activeW.reserve);
    activeW.currentMag += toLoad;
    activeW.reserve -= toLoad;
    this.localState.isReloading = false;
    this.reloadTimer = 0;

    this.callbacks.onWeaponChange(
      this.localState.currentWeaponIndex,
      activeW.type,
      activeW.currentMag,
      activeW.reserve,
      false
    );
  }

  public throwGrenade() {
    if (this.localState.isDead || this.localState.grenadeCount <= 0) return;
    this.localState.grenadeCount--;
    this.callbacks.onGrenadeChange(this.localState.grenadeCount, this.localState.loadout.grenade);

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.position.clone().add(dir.clone().multiplyScalar(0.6));
    const speed = 20;
    const vel = new THREE.Vector3(dir.x * speed, dir.y * speed + 3.5, dir.z * speed);

    const grenadeId = `grenade_${Date.now()}_${Math.random()}`;
    const newGrenade: ActiveGrenade = {
      id: grenadeId,
      shooterId: this.localState.id,
      type: this.localState.loadout.grenade,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: vel.x,
      vy: vel.y,
      vz: vel.z,
      fuseTimer: this.localState.loadout.grenade === 'mine' ? 999 : 2.4,
    };
    this.activeGrenades.push(newGrenade);

    // 3D Mesh
    const gMat = new THREE.MeshStandardMaterial({
      color: this.localState.loadout.grenade === 'gas' ? 0x22c55e : 0x166534,
      roughness: 0.3,
      metalness: 0.8,
    });
    const gMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), gMat);
    gMesh.position.copy(origin);
    this.scene.add(gMesh);
    this.grenadeMeshes.set(grenadeId, gMesh);

    sound.playGrenadeBounce();
    this.viewmodelRecoilOffset.z += 0.2;

    this.callbacks.onSendLocalAction?.({
      type: 'throw_grenade',
      grenade: newGrenade,
    });
  }

  public meleeBash() {
    if (this.localState.isDead || this.meleeTimer > 0) return;
    this.meleeTimer = 0.45;
    sound.playHitmarker();

    this.viewmodelRecoilOffset.z -= 0.35;
    this.viewmodelRecoilRot.z += 0.4;

    const myPos = this.camera.position;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    for (const [id, enemy] of this.remoteStates.entries()) {
      if (enemy.isDead || enemy.team === this.localState.team) continue;
      const enemyPos = new THREE.Vector3(enemy.x, enemy.y, enemy.z);
      if (myPos.distanceTo(enemyPos) < 3.2) {
        const toEnemy = enemyPos.clone().sub(myPos).normalize();
        if (forward.dot(toEnemy) > 0.6) {
          this.damageEnemy(id, 65, 'melee');
          this.callbacks.onHitmarker();
          break;
        }
      }
    }
  }

  private fireWeapon() {
    const activeW = this.localState.weapons[this.localState.currentWeaponIndex];
    const def = WEAPON_DEFINITIONS[activeW.type];
    const now = performance.now();

    if (activeW.currentMag <= 0) {
      this.startReload();
      return;
    }

    if (now - this.lastFireTime < 1000 / def.fireRate) {
      return;
    }

    this.lastFireTime = now;
    activeW.currentMag--;
    this.callbacks.onWeaponChange(
      this.localState.currentWeaponIndex,
      activeW.type,
      activeW.currentMag,
      activeW.reserve,
      this.localState.isReloading
    );

    sound.playShoot(def.id);

    // Viewmodel Recoil Kickback
    const recoilAmount = def.recoil;
    this.viewmodelRecoilOffset.z += recoilAmount * 0.25;
    this.viewmodelRecoilRot.x += recoilAmount * 0.35;
    this.pitch = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, this.pitch + recoilAmount * 0.025));

    // Direction straight down the sights
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const flashPos = this.camera.position.clone().add(camDir.clone().multiplyScalar(0.65));

    this.particles.emitMuzzleFlash(flashPos, camDir);

    // Bullet Spawning
    const pellets = def.pellets || 1;
    for (let p = 0; p < pellets; p++) {
      const spreadDir = camDir.clone();
      const spread = this.isADS ? def.spread * 0.25 : def.spread;
      if (spread > 0) {
        spreadDir.x += (Math.random() - 0.5) * spread;
        spreadDir.y += (Math.random() - 0.5) * spread;
        spreadDir.z += (Math.random() - 0.5) * spread;
        spreadDir.normalize();
      }

      const pId = `proj_${Date.now()}_${Math.random()}`;
      const projectile: Projectile = {
        id: pId,
        shooterId: this.localState.id,
        type: def.id,
        x: flashPos.x,
        y: flashPos.y,
        z: flashPos.z,
        vx: spreadDir.x * def.bulletSpeed,
        vy: spreadDir.y * def.bulletSpeed,
        vz: spreadDir.z * def.bulletSpeed,
        damage: def.damage,
        distanceTraveled: 0,
        maxDistance: def.range,
        isExplosive: def.isExplosive,
        blastRadius: def.blastRadius,
        color: def.id === 'rpg' ? '#ef4444' : def.id === 'flamethrower' ? '#f97316' : '#fde047',
        spawnTime: now,
      };

      this.projectiles.push(projectile);

      const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(projectile.color) });
      const pGeom = def.isExplosive
        ? new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8)
        : new THREE.SphereGeometry(def.id === 'sniper' ? 0.09 : 0.06, 6, 6);
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.position.copy(flashPos);
      if (def.isExplosive) {
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spreadDir);
      }
      this.scene.add(mesh);
      this.projectileMeshes.set(pId, mesh);
    }

    this.callbacks.onSendLocalAction?.({
      type: 'weapon_fire',
      weaponType: def.id,
      origin: flashPos,
      direction: camDir,
    });
  }

  // Spawn visual projectile when a remote/bot player fires
  public spawnRemoteWeaponFire(
    shooterId: string,
    weaponType: WeaponType,
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number }
  ) {
    if (shooterId === this.localState.id || shooterId === this.localPlayerId) return;

    const def = WEAPON_DEFINITIONS[weaponType] || WEAPON_DEFINITIONS.ak47;
    const originVec = new THREE.Vector3(origin.x, origin.y, origin.z);
    const dirVec = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();

    this.particles.emitMuzzleFlash(originVec, dirVec);
    sound.playShoot(weaponType);

    const pId = `rem_proj_${Date.now()}_${Math.random()}`;
    const projectile: Projectile = {
      id: pId,
      shooterId,
      type: weaponType,
      x: originVec.x,
      y: originVec.y,
      z: originVec.z,
      // Slower bullet speed (24 units/s) so player can see and dodge it comfortably
      vx: dirVec.x * 24,
      vy: dirVec.y * 24,
      vz: dirVec.z * 24,
      // Fair low damage (5 - 9 HP) so player doesn't die quickly
      damage: Math.min(9, Math.max(5, Math.round(def.damage * 0.22))),
      distanceTraveled: 0,
      maxDistance: def.range,
      isExplosive: def.isExplosive,
      blastRadius: def.blastRadius,
      color: '#f97316',
      spawnTime: performance.now(),
    };

    this.projectiles.push(projectile);

    const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(projectile.color) });
    const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), pMat);
    pMesh.position.copy(originVec);
    this.scene.add(pMesh);
    this.projectileMeshes.set(pId, pMesh);
  }

  private updateLocalPlayer(dt: number) {
    if (this.localState.isDead) return;

    const isAfterburner = this.localState.loadout.perk === 'afterburner';
    const isQuickRefuel = this.localState.loadout.perk === 'quick_refuel';

    // Reload timer
    if (this.localState.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.completeReload();
      }
    }

    // Melee cooldown
    if (this.meleeTimer > 0) {
      this.meleeTimer -= dt;
    }

    // Camera Orientation (YXZ order prevents roll distortion)
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;

    // Movement Key Checks (supports code, key lowercase, and arrow keys)
    const isW = this.keys['KeyW'] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'];
    const isS = this.keys['KeyS'] || this.keys['s'] || this.keys['S'] || this.keys['ArrowDown'];
    const isA = this.keys['KeyA'] || this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'];
    const isD = this.keys['KeyD'] || this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'];
    const isSpace = this.keys['Space'] || this.keys[' '] || this.virtualWantsFly;

    // Movement Vectors based on Camera Yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveSpeed = this.isADS ? 6.5 : 12.0;
    const inputDir = new THREE.Vector3(0, 0, 0);

    if (isW) inputDir.add(forward);
    if (isS) inputDir.sub(forward);
    if (isD) inputDir.add(right);
    if (isA) inputDir.sub(right);

    // Virtual Mobile Joystick input
    if (Math.abs(this.virtualForward) > 0.05) {
      inputDir.add(forward.clone().multiplyScalar(this.virtualForward));
    }
    if (Math.abs(this.virtualStrafe) > 0.05) {
      inputDir.add(right.clone().multiplyScalar(this.virtualStrafe));
    }

    if (inputDir.lengthSq() > 0) {
      if (inputDir.length() > 1) inputDir.normalize();
      this.walkBobTimer += dt * 10;
    }

    const targetVx = inputDir.x * moveSpeed;
    const targetVz = inputDir.z * moveSpeed;

    this.localState.vx = THREE.MathUtils.lerp(this.localState.vx, targetVx, 12 * dt);
    this.localState.vz = THREE.MathUtils.lerp(this.localState.vz, targetVz, 12 * dt);

    // Jetpack Booster: Space / Flight
    const hasNitro = this.localState.nitro > 0;

    if (isSpace && hasNitro) {
      this.isBoosting = true;
      this.localState.isFlying = true;
      const boostForce = isAfterburner ? 24 : 19;
      this.localState.vy = THREE.MathUtils.lerp(this.localState.vy, boostForce, 10 * dt);

      const drainRate = isAfterburner ? 32 : 24;
      this.localState.nitro = Math.max(0, this.localState.nitro - drainRate * dt);
      this.callbacks.onNitroChange(this.localState.nitro, this.localState.maxNitro);

      sound.setJetpackThruster(true);

      // Rocket flame particle trails below camera
      const leftBoosterPos = this.camera.position.clone().add(right.clone().multiplyScalar(-0.4)).add(new THREE.Vector3(0, -1.0, 0));
      const rightBoosterPos = this.camera.position.clone().add(right.clone().multiplyScalar(0.4)).add(new THREE.Vector3(0, -1.0, 0));
      this.particles.emitJetpackBooster(leftBoosterPos, new THREE.Vector3(0, -1, 0), this.localState.loadout.trailColor);
      this.particles.emitJetpackBooster(rightBoosterPos, new THREE.Vector3(0, -1, 0), this.localState.loadout.trailColor);
    } else {
      this.isBoosting = false;
      this.localState.isFlying = false;
      sound.setJetpackThruster(false);
      // Gravity
      this.localState.vy -= 28 * dt;
    }

    this.localState.vy = Math.max(-28, Math.min(26, this.localState.vy));

    // Decoupled 3D Collision Resolution (Prevents ground and walls from blocking movement)
    const playerRadius = 0.45;
    const playerHalfHeight = 0.9;

    // 1. Resolve Y Axis (Vertical ground snap & ceilings)
    let newY = this.localState.y + this.localState.vy * dt;
    let isGrounded = false;
    const feetY = newY - playerHalfHeight;
    const headY = newY + playerHalfHeight;

    for (const col of this.mapDef.colliders) {
      if (col.type !== 'solid') continue;
      // Check horizontal footprint overlap
      if (
        this.localState.x + playerRadius > col.box.min.x &&
        this.localState.x - playerRadius < col.box.max.x &&
        this.localState.z + playerRadius > col.box.min.z &&
        this.localState.z - playerRadius < col.box.max.z
      ) {
        // Landing on floor / platform top
        if (this.localState.vy <= 0 && feetY <= col.box.max.y && (this.localState.y - playerHalfHeight) >= col.box.max.y - 0.45) {
          newY = col.box.max.y + playerHalfHeight;
          this.localState.vy = 0;
          isGrounded = true;
        }
        // Hitting ceiling
        else if (this.localState.vy > 0 && headY >= col.box.min.y && (this.localState.y + playerHalfHeight) <= col.box.min.y + 0.45) {
          newY = col.box.min.y - playerHalfHeight;
          this.localState.vy = 0;
        }
      }
    }
    this.localState.y = newY;

    // 2. Resolve X Axis (Horizontal sliding along walls)
    let newX = this.localState.x + this.localState.vx * dt;
    for (const col of this.mapDef.colliders) {
      if (col.type !== 'solid') continue;
      const playerBottom = this.localState.y - playerHalfHeight + 0.35; // above step height so floor never blocks X
      const playerTop = this.localState.y + playerHalfHeight - 0.1;
      if (playerBottom < col.box.max.y && playerTop > col.box.min.y) {
        if (this.localState.z + playerRadius > col.box.min.z && this.localState.z - playerRadius < col.box.max.z) {
          if (newX + playerRadius > col.box.min.x && newX - playerRadius < col.box.max.x) {
            if (this.localState.vx > 0) newX = col.box.min.x - playerRadius;
            else if (this.localState.vx < 0) newX = col.box.max.x + playerRadius;
            this.localState.vx = 0;
          }
        }
      }
    }
    this.localState.x = newX;

    // 3. Resolve Z Axis (Horizontal sliding along walls)
    let newZ = this.localState.z + this.localState.vz * dt;
    for (const col of this.mapDef.colliders) {
      if (col.type !== 'solid') continue;
      const playerBottom = this.localState.y - playerHalfHeight + 0.35;
      const playerTop = this.localState.y + playerHalfHeight - 0.1;
      if (playerBottom < col.box.max.y && playerTop > col.box.min.y) {
        if (this.localState.x + playerRadius > col.box.min.x && this.localState.x - playerRadius < col.box.max.x) {
          if (newZ + playerRadius > col.box.min.z && newZ - playerRadius < col.box.max.z) {
            if (this.localState.vz > 0) newZ = col.box.min.z - playerRadius;
            else if (this.localState.vz < 0) newZ = col.box.max.z + playerRadius;
            this.localState.vz = 0;
          }
        }
      }
    }
    this.localState.z = newZ;

    // Hazard colliders check
    for (const col of this.mapDef.colliders) {
      if (col.type === 'hazard') {
        const box = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(this.localState.x, this.localState.y, this.localState.z),
          new THREE.Vector3(playerRadius * 2, playerHalfHeight * 2, playerRadius * 2)
        );
        if (box.intersectsBox(col.box)) {
          this.takeDamage(45 * dt, 'hazard');
        }
      }
    }

    // Nitro recharge
    if (!this.isBoosting && this.localState.nitro < this.localState.maxNitro) {
      const regenRate = (isGrounded ? 38 : 18) * (isQuickRefuel ? 1.6 : 1.0);
      this.localState.nitro = Math.min(this.localState.maxNitro, this.localState.nitro + regenRate * dt);
      this.callbacks.onNitroChange(this.localState.nitro, this.localState.maxNitro);
    }

    // Void death check
    if (this.localState.y < this.mapDef.killY) {
      this.eliminatePlayer('The Void', 'fall');
    }

    // Set FPS Camera position to eyes
    this.camera.position.set(this.localState.x, this.localState.y + 0.65, this.localState.z);

    // Pickups collision check
    this.checkPickupCollisions();

    // Weapon firing (continuous when held down)
    if (this.isMouseDown) {
      this.fireWeapon();
    }

    // Update First-Person Viewmodel animation & sway
    this.updateViewmodel(dt, inputDir.lengthSq() > 0);
  }

  private updateViewmodel(dt: number, isMoving: boolean) {
    const curW = this.localState.weapons[this.localState.currentWeaponIndex].type;
    const config = WEAPON_VIEWMODEL_CONFIGS[curW];

    // If sniper and ADS, hide viewmodel so scope optic fills view cleanly
    if (curW === 'sniper' && this.isADS) {
      this.viewmodelGroup.visible = false;
    } else {
      this.viewmodelGroup.visible = true;
    }

    // Target base position (ADS vs Hipfire)
    const targetPos = this.isADS ? config.adsPos : config.hipPos;
    const targetRot = this.isADS ? config.adsRot : config.hipRot;

    // Natural walk bobbing
    let bobX = 0;
    let bobY = 0;
    if (isMoving && !this.isADS) {
      bobX = Math.cos(this.walkBobTimer * 0.5) * 0.015;
      bobY = Math.sin(this.walkBobTimer) * 0.012;
    }

    // Sway & Recoil recovery
    this.viewmodelSway.lerp(new THREE.Vector2(0, 0), 10 * dt);
    this.viewmodelRecoilOffset.lerp(new THREE.Vector3(0, 0, 0), 12 * dt);
    this.viewmodelRecoilRot.lerp(new THREE.Vector3(0, 0, 0), 12 * dt);

    // Smooth position lerp
    this.viewmodelGroup.position.x = THREE.MathUtils.lerp(
      this.viewmodelGroup.position.x,
      targetPos.x + bobX + this.viewmodelSway.x + this.viewmodelRecoilOffset.x,
      16 * dt
    );
    this.viewmodelGroup.position.y = THREE.MathUtils.lerp(
      this.viewmodelGroup.position.y,
      targetPos.y + bobY + this.viewmodelSway.y + this.viewmodelRecoilOffset.y,
      16 * dt
    );
    this.viewmodelGroup.position.z = THREE.MathUtils.lerp(
      this.viewmodelGroup.position.z,
      targetPos.z + this.viewmodelRecoilOffset.z,
      16 * dt
    );

    // Viewmodel rotation
    this.viewmodelGroup.rotation.x = this.viewmodelRecoilRot.x + targetRot.x;
    this.viewmodelGroup.rotation.y = this.viewmodelSway.x * 2.0 + targetRot.y;
    this.viewmodelGroup.rotation.z = this.viewmodelSway.x * -1.2 + this.viewmodelRecoilRot.z + targetRot.z;

    // Smooth FOV zoom during ADS
    const targetFOV = this.isADS ? config.adsFOV : 75;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 16 * dt);
    this.camera.updateProjectionMatrix();
  }

  // Active Hostile Enemy AI (1v1 Sequential Combat & Reduced Aggression)
  private updateHostileBots(dt: number) {
    // Breather period between enemies (deploying one after the other)
    if (this.isAwaitingNextEnemy) {
      this.waveCountdown -= dt;
      if (this.waveCountdown <= 0) {
        this.isAwaitingNextEnemy = false;
        this.currentHostileIndex = (this.currentHostileIndex + 1) % DEFAULT_HOSTILE_BOTS.length;
        const nextBot = DEFAULT_HOSTILE_BOTS[this.currentHostileIndex];
        this.spawnSingleHostileBot(nextBot);
      } else {
        const nextIndex = (this.currentHostileIndex + 1) % DEFAULT_HOSTILE_BOTS.length;
        const nextBot = DEFAULT_HOSTILE_BOTS[nextIndex];
        const secsLeft = Math.ceil(this.waveCountdown);
        this.callbacks.onWaveStatusChange?.(
          null,
          `NEXT HOSTILE (${nextBot.name.toUpperCase()}) INCOMING IN ${secsLeft}s...`
        );
      }
      return;
    }

    if (!this.activeEnemyId) return;
    const enemy = this.remoteStates.get(this.activeEnemyId);
    const mesh = this.remoteMeshes.get(this.activeEnemyId);
    const ai = this.botAIStates.get(this.activeEnemyId);
    if (!enemy || !mesh || !ai || enemy.isDead) return;

    const playerPos = this.camera.position;
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - (enemy.y + 0.4);
    const dz = playerPos.z - enemy.z;
    const horizDist = Math.hypot(dx, dz) || 0.001;
    const totalDist = Math.hypot(dx, dy, dz) || 0.001;

    // 1. Smooth human-like aiming (gentle 1.8 lerp, no instant snap)
    const targetYaw = Math.atan2(dx, dz);
    const targetPitch = Math.atan2(dy, horizDist);
    enemy.rotationY = THREE.MathUtils.lerp(enemy.rotationY, targetYaw, 1.8 * dt);
    enemy.aimPitch = THREE.MathUtils.lerp(enemy.aimPitch, targetPitch, 1.8 * dt);
    mesh.updateAim(enemy.aimPitch, enemy.rotationY);

    // Provide active enemy target info to HUD
    this.callbacks.onWaveStatusChange?.({
      name: enemy.name,
      weapon: enemy.weapons[0]?.type || 'ak47',
      health: enemy.health,
      maxHealth: enemy.maxHealth,
    }, null);

    // 2. Reduced Movement Aggression (1.5 m/s comfortable pacing)
    ai.strafeTimer -= dt;
    if (ai.strafeTimer <= 0) {
      ai.strafeTimer = 3.0 + Math.random() * 2.0;
      ai.strafeDir *= -1;
    }

    const forwardNorm = new THREE.Vector3(dx / horizDist, 0, dz / horizDist);
    const rightNorm = new THREE.Vector3(forwardNorm.z, 0, -forwardNorm.x);

    let targetVx = rightNorm.x * ai.strafeDir * 0.9;
    let targetVz = rightNorm.z * ai.strafeDir * 0.9;

    if (horizDist > 18) {
      // Gentle advance
      targetVx += forwardNorm.x * 1.5;
      targetVz += forwardNorm.z * 1.5;
    } else if (horizDist < 10) {
      // Gentle retreat if player gets close
      targetVx -= forwardNorm.x * 1.2;
      targetVz -= forwardNorm.z * 1.2;
    }

    enemy.vx = THREE.MathUtils.lerp(enemy.vx, targetVx, 4 * dt);
    enemy.vz = THREE.MathUtils.lerp(enemy.vz, targetVz, 4 * dt);

    // 3. Gentle Jetpack flight only when falling low or target is way above
    const needsLift = dy > 3.0 || enemy.y < 0.8;
    if (needsLift && enemy.nitro > 25) {
      enemy.isFlying = true;
      enemy.vy = Math.min(9, enemy.vy + 14 * dt);
      enemy.nitro = Math.max(0, enemy.nitro - 18 * dt);
      mesh.setJetpackActive(true);
      if (Math.random() < 0.25) {
        this.particles.emitJetpackBooster(
          new THREE.Vector3(enemy.x, enemy.y - 0.7, enemy.z),
          new THREE.Vector3(0, -1, 0),
          '#ef4444'
        );
      }
    } else {
      enemy.isFlying = false;
      enemy.vy -= 22 * dt;
      mesh.setJetpackActive(false);
      if (enemy.nitro < enemy.maxNitro) {
        enemy.nitro = Math.min(enemy.maxNitro, enemy.nitro + 25 * dt);
      }
    }

    // Step physics
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.z += enemy.vz * dt;

    if (enemy.y < 0.9) {
      enemy.y = 0.9;
      enemy.vy = 0;
    }

    mesh.group.position.set(enemy.x, enemy.y, enemy.z);

    // 4. Reduced Combat Firing Aggression (fires relaxed burst once every 4.8s - 6.0s)
    if (totalDist < 40 && !this.localState.isDead) {
      ai.fireTimer -= dt;
      if (ai.fireTimer <= 0) {
        const botDef = DEFAULT_HOSTILE_BOTS[this.currentHostileIndex] || DEFAULT_HOSTILE_BOTS[0];
        ai.fireTimer = 4.8 + Math.random() * 1.2;

        const weaponType = enemy.weapons[0]?.type || botDef.weapon;
        this.fireBotWeapon(enemy, weaponType, new THREE.Vector3(dx, dy, dz).normalize(), totalDist);
      }
    }
  }

  private fireBotWeapon(enemy: PlayerState, weaponType: WeaponType, dir: THREE.Vector3, dist: number) {
    const pDef = WEAPON_DEFINITIONS[weaponType] || WEAPON_DEFINITIONS.ak47;
    const botMuzzle = new THREE.Vector3(
      enemy.x + Math.sin(enemy.rotationY) * 0.6,
      enemy.y + 0.35,
      enemy.z + Math.cos(enemy.rotationY) * 0.6
    );

    // Dynamic aim with deliberate natural error based on range
    const aimDir = dir.clone();
    const error = Math.min(0.22, 0.12 + dist * 0.003);
    aimDir.x += (Math.random() - 0.5) * error;
    aimDir.y += (Math.random() - 0.5) * error;
    aimDir.z += (Math.random() - 0.5) * error;
    aimDir.normalize();

    this.particles.emitMuzzleFlash(botMuzzle, aimDir);
    sound.playShoot(weaponType);

    const pellets = weaponType === 'shotgun' ? 3 : 1;
    for (let p = 0; p < pellets; p++) {
      const spreadDir = aimDir.clone();
      if (weaponType === 'shotgun') {
        spreadDir.x += (Math.random() - 0.5) * 0.14;
        spreadDir.y += (Math.random() - 0.5) * 0.14;
        spreadDir.z += (Math.random() - 0.5) * 0.14;
        spreadDir.normalize();
      }

      const pId = `bot_proj_${Date.now()}_${Math.random()}`;
      const proj: Projectile = {
        id: pId,
        shooterId: enemy.id,
        type: weaponType,
        x: botMuzzle.x,
        y: botMuzzle.y,
        z: botMuzzle.z,
        // Slower bullet speed (24 units/s) so player can easily see and dodge it!
        vx: spreadDir.x * 24,
        vy: spreadDir.y * 24,
        vz: spreadDir.z * 24,
        // Fair low damage (5 - 9 HP) so player doesn't die quickly!
        damage: Math.min(9, Math.max(5, Math.round(pDef.damage * 0.22))),
        distanceTraveled: 0,
        maxDistance: pDef.range,
        isExplosive: pDef.isExplosive,
        blastRadius: pDef.blastRadius ? pDef.blastRadius * 0.5 : undefined,
        color: '#f97316',
        spawnTime: performance.now(),
      };

      this.projectiles.push(proj);

      const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(proj.color) });
      const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), pMat);
      pMesh.position.copy(botMuzzle);
      this.scene.add(pMesh);
      this.projectileMeshes.set(pId, pMesh);
    }
  }

  private checkPickupCollisions() {
    const playerPos = this.camera.position;
    for (const p of this.mapDef.pickupSpawns) {
      const mesh = this.pickupMeshes.get(p.id);
      if (!mesh || !mesh.visible) continue;

      if (playerPos.distanceTo(p.position) < 1.8) {
        mesh.visible = false;
        sound.playPickup();

        if (p.type === 'health') {
          this.localState.health = Math.min(this.localState.maxHealth, this.localState.health + 50);
          this.callbacks.onHealthChange(this.localState.health, this.localState.maxHealth);
        } else if (p.type === 'nitro') {
          this.localState.nitro = this.localState.maxNitro;
          this.callbacks.onNitroChange(this.localState.nitro, this.localState.maxNitro);
        } else if (p.type === 'weapon' && p.weaponType) {
          this.localState.weapons[this.localState.currentWeaponIndex] = {
            type: p.weaponType,
            currentMag: WEAPON_DEFINITIONS[p.weaponType].magazineSize,
            reserve: WEAPON_DEFINITIONS[p.weaponType].reserveAmmo,
          };
          this.buildViewmodel(p.weaponType);
          this.callbacks.onWeaponChange(
            this.localState.currentWeaponIndex,
            p.weaponType,
            WEAPON_DEFINITIONS[p.weaponType].magazineSize,
            WEAPON_DEFINITIONS[p.weaponType].reserveAmmo,
            false
          );
        } else {
          for (const w of this.localState.weapons) {
            w.reserve += WEAPON_DEFINITIONS[w.type].magazineSize * 2;
          }
          const cur = this.localState.weapons[this.localState.currentWeaponIndex];
          this.callbacks.onWeaponChange(
            this.localState.currentWeaponIndex,
            cur.type,
            cur.currentMag,
            cur.reserve,
            false
          );
        }

        setTimeout(() => {
          mesh.visible = true;
        }, 14000);
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const mesh = this.projectileMeshes.get(p.id);

      const dx = p.vx * dt;
      const dy = p.vy * dt;
      const dz = p.vz * dt;
      const stepDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      p.x += dx;
      p.y += dy;
      p.z += dz;
      p.distanceTraveled += stepDist;

      if (mesh) {
        mesh.position.set(p.x, p.y, p.z);
      }

      if (p.type === 'rpg' && Math.random() < 0.6) {
        this.particles.emitJetpackBooster(new THREE.Vector3(p.x, p.y, p.z), new THREE.Vector3(-p.vx, -p.vy, -p.vz).normalize(), '#f97316');
      }

      if (p.distanceTraveled >= p.maxDistance) {
        this.removeProjectile(i, p);
        continue;
      }

      const pPoint = new THREE.Vector3(p.x, p.y, p.z);
      let hitObstacle = false;

      // Check collision with map walls/platforms
      for (const col of this.mapDef.colliders) {
        if (col.type === 'solid' && col.box.containsPoint(pPoint)) {
          hitObstacle = true;
          break;
        }
      }

      if (hitObstacle) {
        if (p.isExplosive) {
          this.detonateExplosive(pPoint, p.blastRadius || 5, p.damage, p.shooterId, p.type);
        } else {
          this.particles.emitBulletImpact(pPoint, new THREE.Vector3(-p.vx, -p.vy, -p.vz).normalize());
        }
        this.removeProjectile(i, p);
        continue;
      }

      // Check collision with Hostile Enemies (from local player projectile)
      if (p.shooterId === this.localState.id || p.shooterId === this.localPlayerId) {
        for (const [rId, enemy] of this.remoteStates.entries()) {
          if (enemy.isDead) continue;
          
          const mesh = this.remoteMeshes.get(rId);
          const targetPos = mesh ? mesh.group.position : new THREE.Vector3(enemy.x, enemy.y, enemy.z);
          const horizDist = Math.hypot(pPoint.x - targetPos.x, pPoint.z - targetPos.z);
          const vertDist = Math.abs(pPoint.y - (targetPos.y + 0.3));

          if (horizDist < 1.25 && vertDist < 1.7) {
            if (p.isExplosive) {
              this.detonateExplosive(pPoint, p.blastRadius || 5, p.damage, p.shooterId, p.type);
            } else {
              this.damageEnemy(rId, p.damage, p.type);
              this.callbacks.onHitmarker();
              sound.playHitmarker();
            }
            this.removeProjectile(i, p);
            hitObstacle = true;
            break;
          }
        }
      }

      // Check collision with Local Player (from enemy projectile)
      if (!hitObstacle && p.shooterId !== this.localState.id && p.shooterId !== this.localPlayerId) {
        const playerCenter = new THREE.Vector3(this.localState.x, this.localState.y, this.localState.z);
        if (pPoint.distanceTo(playerCenter) < 1.35) {
          if (p.isExplosive) {
            this.detonateExplosive(pPoint, p.blastRadius || 4.5, p.damage, p.shooterId, p.type);
          } else {
            this.takeDamage(p.damage, p.type);
            sound.playHitmarker();
          }
          this.removeProjectile(i, p);
        }
      }
    }
  }

  private removeProjectile(index: number, p: Projectile) {
    const mesh = this.projectileMeshes.get(p.id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.projectileMeshes.delete(p.id);
    }
    this.projectiles.splice(index, 1);
  }

  private updateGrenades(dt: number) {
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      const mesh = this.grenadeMeshes.get(g.id);

      g.vy -= 22 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;

      // Platform bounce in 3D
      const gPoint = new THREE.Vector3(g.x, g.y, g.z);
      for (const col of this.mapDef.colliders) {
        if (col.type === 'solid' && col.box.containsPoint(gPoint)) {
          g.vy = -g.vy * 0.55;
          g.vx *= 0.7;
          g.vz *= 0.7;
          g.y += 0.2;
          sound.playGrenadeBounce();
          break;
        }
      }

      if (mesh) {
        mesh.position.set(g.x, g.y, g.z);
        mesh.rotation.x += 6 * dt;
        mesh.rotation.y += 4 * dt;
      }

      g.fuseTimer -= dt;
      if (g.fuseTimer <= 0 && !g.detonated) {
        g.detonated = true;
        this.detonateGrenade(g);
        this.activeGrenades.splice(i, 1);
        if (mesh) {
          this.scene.remove(mesh);
          this.grenadeMeshes.delete(g.id);
        }
      }
    }
  }

  private detonateGrenade(g: ActiveGrenade) {
    const pos = new THREE.Vector3(g.x, g.y, g.z);
    if (g.type === 'gas') {
      sound.playGasHiss();
      this.particles.emitGasCloud(pos);
      let gasTicks = 8;
      const interval = setInterval(() => {
        gasTicks--;
        if (gasTicks <= 0) clearInterval(interval);
        const localPos = this.camera.position;
        if (localPos.distanceTo(pos) < 7.0) {
          this.takeDamage(12, 'gas');
        }
      }, 500);
    } else {
      this.detonateExplosive(pos, 7.0, 95, g.shooterId, 'frag');
    }
  }

  public detonateExplosive(
    pos: THREE.Vector3,
    radius: number,
    maxDamage: number,
    attackerId: string,
    weapon: WeaponType | GrenadeType
  ) {
    sound.playExplosion();
    this.particles.emitExplosion(pos, radius);

    // Screen Shake
    this.viewmodelRecoilOffset.z += 0.35;
    this.pitch = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, this.pitch + 0.04));

    // Damage local player
    const distToLocal = this.camera.position.distanceTo(pos);
    if (distToLocal <= radius) {
      const falloff = 1 - distToLocal / radius;
      const dmg = Math.round(maxDamage * falloff);
      this.takeDamage(dmg, weapon);
    }

    // Damage hostile enemies
    for (const [rId, enemy] of this.remoteStates.entries()) {
      if (enemy.isDead) continue;
      const enemyPos = new THREE.Vector3(enemy.x, enemy.y, enemy.z);
      const dist = enemyPos.distanceTo(pos);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        const dmg = Math.round(maxDamage * falloff);
        this.damageEnemy(rId, dmg, weapon);
        if (attackerId === this.localState.id || attackerId === this.localPlayerId) {
          this.callbacks.onHitmarker();
        }
      }
    }
  }

  public takeDamage(amount: number, weapon: WeaponType | GrenadeType | string) {
    if (this.localState.isDead) return;
    this.localState.health = Math.max(0, this.localState.health - amount);
    this.callbacks.onHealthChange(this.localState.health, this.localState.maxHealth);

    if (this.localState.health <= 0) {
      this.eliminatePlayer('Hostile Trooper', weapon);
    }
  }

  // Damage an enemy bot and handle their death / respawn cleanly
  public damageEnemy(enemyId: string, damage: number, weapon: WeaponType | GrenadeType | string) {
    const enemy = this.remoteStates.get(enemyId);
    const mesh = this.remoteMeshes.get(enemyId);
    if (!enemy || enemy.isDead) return;

    enemy.health = Math.max(0, enemy.health - damage);
    if (mesh) {
      mesh.setHealthPercent(Math.max(0, enemy.health / enemy.maxHealth));
      mesh.triggerHurtFlash();
    }

    this.callbacks.onSendLocalAction?.({
      type: 'damage_player',
      victimId: enemyId,
      damage,
      weapon,
    });

    if (enemy.health <= 0) {
      enemy.isDead = true;
      enemy.health = 0;
      enemy.deaths++;
      this.localState.kills++;
      this.localState.score += 100;

      sound.playExplosion();
      this.particles.emitExplosion(new THREE.Vector3(enemy.x, enemy.y + 0.5, enemy.z), 3.0);
      if (mesh) {
        mesh.group.visible = false;
        mesh.setHealthPercent(0);
      }

      const killEntry: KillFeedEntry = {
        id: `kill_${Date.now()}_${Math.random()}`,
        killerName: this.localState.name,
        killerTeam: this.localState.team,
        victimName: enemy.name,
        victimTeam: enemy.team,
        weapon: weapon as WeaponType,
        timestamp: Date.now(),
      };
      this.callbacks.onKillFeed(killEntry);

      this.callbacks.onSendLocalAction?.({
        type: 'player_kill',
        victimId: enemyId,
        weapon,
      });

      // Breather period before next enemy arrives (enemies come one after the other)
      this.isAwaitingNextEnemy = true;
      this.waveCountdown = 4.0;
      const nextIndex = (this.currentHostileIndex + 1) % DEFAULT_HOSTILE_BOTS.length;
      const nextBot = DEFAULT_HOSTILE_BOTS[nextIndex];
      this.callbacks.onWaveStatusChange?.(
        null,
        `TARGET ELIMINATED! NEXT HOSTILE (${nextBot.name.toUpperCase()}) IN 4s...`
      );
    }
  }

  public respawnHostileEnemy(enemyId: string) {
    const enemy = this.remoteStates.get(enemyId);
    const mesh = this.remoteMeshes.get(enemyId);
    if (!enemy || !mesh) return;

    // Pick spawn point far from player
    const playerPos = this.camera.position;
    let bestPt = this.mapDef.spawnPoints[0];
    let maxDist = -1;
    for (const pt of this.mapDef.spawnPoints) {
      const d = pt.distanceTo(playerPos);
      if (d > maxDist) {
        maxDist = d;
        bestPt = pt;
      }
    }

    enemy.x = bestPt.x;
    enemy.y = bestPt.y + 0.9;
    enemy.z = bestPt.z;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.vz = 0;
    enemy.health = enemy.maxHealth;
    enemy.nitro = enemy.maxNitro;
    enemy.isDead = false;

    mesh.group.position.set(enemy.x, enemy.y, enemy.z);
    mesh.setHealthPercent(1.0);
    mesh.group.visible = true;

    this.particles.emitExplosion(new THREE.Vector3(enemy.x, enemy.y + 0.5, enemy.z), 1.5);
  }

  private eliminatePlayer(killer: string, weapon: string) {
    this.localState.isDead = true;
    this.localState.deaths++;
    sound.playExplosion();
    this.setADS(false);
    this.callbacks.onPlayerDied(killer, weapon);

    setTimeout(() => {
      this.respawnLocalPlayer();
    }, 3500);
  }

  public respawnLocalPlayer() {
    const spawnPt = this.mapDef.spawnPoints[Math.floor(Math.random() * this.mapDef.spawnPoints.length)];
    this.localState.x = spawnPt.x;
    this.localState.y = spawnPt.y + 0.9;
    this.localState.z = spawnPt.z;
    this.localState.vx = 0;
    this.localState.vy = 0;
    this.localState.vz = 0;
    this.localState.health = this.localState.maxHealth;
    this.localState.nitro = this.localState.maxNitro;
    this.localState.isDead = false;

    for (const w of this.localState.weapons) {
      w.currentMag = WEAPON_DEFINITIONS[w.type].magazineSize;
    }
    this.localState.grenadeCount = this.localState.loadout.perk === 'scavenger' ? 5 : 3;

    this.callbacks.onHealthChange(this.localState.health, this.localState.maxHealth);
    this.callbacks.onNitroChange(this.localState.nitro, this.localState.maxNitro);
    const curW = this.localState.weapons[this.localState.currentWeaponIndex];
    this.callbacks.onWeaponChange(
      this.localState.currentWeaponIndex,
      curW.type,
      curW.currentMag,
      curW.reserve,
      false
    );
    this.callbacks.onGrenadeChange(this.localState.grenadeCount, this.localState.loadout.grenade);
    this.callbacks.onPlayerRespawn();
  }

  // Update Remote Players from multiplayer packet (NEVER spawn self mesh!)
  public syncRemotePlayers(players: Record<string, PlayerState>) {
    for (const [id, state] of Object.entries(players)) {
      // 1. NEVER create a soldier body for the local player!
      if (
        id === this.localState.id || 
        id === this.localPlayerId || 
        (!state.isBot && state.name === this.localState.name)
      ) {
        // Remove any erroneously spawned mesh for self
        if (this.remoteMeshes.has(id)) {
          const m = this.remoteMeshes.get(id)!;
          this.scene.remove(m.group);
          m.dispose();
          this.remoteMeshes.delete(id);
          this.remoteStates.delete(id);
        }
        continue;
      }

      // 2. Only allow Hostile Enemies (Red Team) - no friendly soldiers!
      if (state.team === this.localState.team && !state.isBot) {
        continue;
      }

      if (!this.remoteStates.has(id)) {
        const mesh = createSoldier3D(state.loadout, 'red', false);
        mesh.group.position.set(state.x, state.y, state.z);
        const wType = state.weapons[state.currentWeaponIndex]?.type || state.loadout.primaryWeapon;
        mesh.setWeapon(wType);
        this.scene.add(mesh.group);
        this.remoteMeshes.set(id, mesh);
        this.remoteStates.set(id, state);
      } else {
        const current = this.remoteStates.get(id)!;
        const mesh = this.remoteMeshes.get(id)!;

        // Smooth position interpolation
        mesh.group.position.x = THREE.MathUtils.lerp(mesh.group.position.x, state.x, 0.4);
        mesh.group.position.y = THREE.MathUtils.lerp(mesh.group.position.y, state.y, 0.4);
        mesh.group.position.z = THREE.MathUtils.lerp(mesh.group.position.z, state.z, 0.4);

        mesh.updateAim(state.aimPitch, state.rotationY);
        mesh.setJetpackActive(state.isFlying);

        // Clean death and respawn synchronization
        if (state.isDead !== current.isDead) {
          current.isDead = state.isDead;
          mesh.group.visible = !state.isDead;
          current.health = state.health;
          current.maxHealth = state.maxHealth;
          if (!state.isDead) {
            mesh.setHealthPercent(Math.max(0.1, state.health / state.maxHealth));
            mesh.group.position.set(state.x, state.y, state.z);
          }
        } else if (!state.isDead) {
          current.health = state.health;
          mesh.setHealthPercent(Math.max(0, current.health / current.maxHealth));
        }

        mesh.group.visible = !state.isDead;
        current.name = state.name;
        if (state.loadout) current.loadout = state.loadout;

        const remoteWeapon = state.weapons[state.currentWeaponIndex]?.type;
        if (remoteWeapon && remoteWeapon !== current.weapons[current.currentWeaponIndex]?.type) {
          mesh.setWeapon(remoteWeapon);
        }

        current.x = state.x;
        current.y = state.y;
        current.z = state.z;
        current.vx = state.vx;
        current.vy = state.vy;
        current.vz = state.vz;
        current.rotationY = state.rotationY;
        current.aimPitch = state.aimPitch;
        current.isFlying = state.isFlying;
      }
    }

    const activeBot = Object.values(players).find(p => p.isBot);
    if (activeBot) {
      if (activeBot.isDead) {
        this.callbacks.onWaveStatusChange?.(null, 'TARGET DOWN! NEXT FOE ARRIVING...');
      } else {
        this.callbacks.onWaveStatusChange?.({
          name: activeBot.name,
          weapon: activeBot.weapons[activeBot.currentWeaponIndex]?.type || 'ak47',
          health: activeBot.health,
          maxHealth: activeBot.maxHealth,
        }, null);
      }
    }

    for (const [id, mesh] of this.remoteMeshes.entries()) {
      if (!players[id] && id !== ACTIVE_HOSTILE_ID) {
        this.scene.remove(mesh.group);
        mesh.dispose();
        this.remoteMeshes.delete(id);
        this.remoteStates.delete(id);
      }
    }
  }

  private animate = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const dt = Math.min(this.clock.getDelta(), 0.1);

    // FPS Movement & Physics
    this.updateLocalPlayer(dt);

    // Hostile Enemy Bots AI
    this.updateHostileBots(dt);

    // Projectiles & Grenades
    this.updateProjectiles(dt);
    this.updateGrenades(dt);

    // Particles
    this.particles.update(dt);

    // Pickups rotation
    for (const mesh of this.pickupMeshes.values()) {
      mesh.rotation.y += 1.8 * dt;
    }

    // Render Scene from FPS Camera
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);

    sound.setJetpackThruster(false);

    for (const mesh of this.remoteMeshes.values()) {
      mesh.dispose();
    }
    this.mapDef.dispose();
    this.particles.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
