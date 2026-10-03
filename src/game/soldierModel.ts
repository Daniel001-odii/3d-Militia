/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlayerLoadout, WeaponType } from '../types/game';
import { WEAPON_DEFINITIONS } from './weapons';
import { createCamoTexture, createSoldierFaceTexture } from './textures';

export interface SoldierMeshRef {
  group: THREE.Group;
  headGroup: THREE.Group;
  torsoMesh: THREE.Mesh;
  weaponGroup: THREE.Group;
  leftBooster: THREE.Mesh;
  rightBooster: THREE.Mesh;
  leftFlame: THREE.Mesh;
  rightFlame: THREE.Mesh;
  healthBarForeground: THREE.Mesh;
  nameSprite: THREE.Sprite;
  materialsToTint: THREE.MeshStandardMaterial[];
  updateAim: (pitch: number, yaw: number) => void;
  setJetpackActive: (active: boolean) => void;
  setWeapon: (weaponType: WeaponType) => void;
  setHealthPercent: (percent: number) => void;
  triggerHurtFlash: () => void;
  dispose: () => void;
}

/**
 * Creates a canvas sprite with the soldier's callsign and clan tag
 */
function createNameTagSprite(name: string, team: 'red' | 'blue' | 'ffa'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.roundRect(10, 8, 236, 48, 8);
  ctx.fill();

  ctx.strokeStyle = team === 'red' ? '#ef4444' : team === 'blue' ? '#3b82f6' : '#eab308';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 0.6, 1);
  return sprite;
}

/**
 * Procedural 3D Weapon Mesh Generator
 */
export function createWeaponMesh(weaponType: WeaponType, isThirdPerson = false): THREE.Group {
  const group = new THREE.Group();
  const def = WEAPON_DEFINITIONS[weaponType];
  const matGunMetal = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.modelColor),
    roughness: 0.35,
    metalness: 0.8,
  });
  const matBlack = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
    metalness: 0.5,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x78350f, // wood stock
    roughness: 0.8,
    metalness: 0.1,
  });
  const matTritium = new THREE.MeshBasicMaterial({
    color: 0x22c55e, // Glowing green tritium sight dot
  });
  const matBrass = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.3,
    metalness: 0.9,
  });

  switch (weaponType) {
    case 'pistol': {
      // Desert Eagle .50 AE
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.65), matGunMetal);
      slide.position.set(0, 0.08, -0.15);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.22), matBlack);
      grip.position.set(0, -0.15, 0.08);
      grip.rotation.x = 0.25;

      // Iron Sights (Rear square notch & front blade with tritium dot)
      const rearLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), matBlack);
      rearLeft.position.set(-0.055, 0.20, 0.14);
      const rearRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), matBlack);
      rearRight.position.set(0.055, 0.20, 0.14);
      const frontBlade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.04), matBlack);
      frontBlade.position.set(0, 0.20, -0.45);
      const frontTritium = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), matTritium);
      frontTritium.position.set(0, 0.205, -0.44);

      group.add(slide, grip, rearLeft, rearRight, frontBlade, frontTritium);
      break;
    }
    case 'uzi': {
      // Micro Uzi
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.6), matBlack);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22), matGunMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.4);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.16), matGunMetal);
      mag.position.set(0, -0.26, 0.02);

      // Iron Sights
      const rearAperture = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 6, 12), matBlack);
      rearAperture.position.set(0, 0.17, 0.18);
      const frontPost = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.025), matBlack);
      frontPost.position.set(0, 0.16, -0.42);
      const frontDot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), matTritium);
      frontDot.position.set(0, 0.17, -0.41);

      group.add(body, barrel, mag, rearAperture, frontPost, frontDot);
      break;
    }
    case 'ak47': {
      // AK-47 Assault Rifle
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.85), matGunMetal);
      receiver.position.set(0, 0.02, -0.1);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75), matGunMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.05, -0.85);
      const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.5), matGunMetal);
      gasTube.rotation.x = Math.PI / 2;
      gasTube.position.set(0, 0.11, -0.65);
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.38), matAccent);
      handguard.position.set(0, 0.06, -0.6);
      const curvedMag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.22), matAccent);
      curvedMag.position.set(0, -0.28, -0.15);
      curvedMag.rotation.x = -0.35;
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, isThirdPerson ? 0.55 : 0.25), matAccent);
      stock.position.set(0, -0.04, isThirdPerson ? 0.6 : 0.35);

      // Authentic AK-47 Iron Sights
      const rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), matBlack);
      rearSightBase.position.set(0, 0.15, -0.32);
      const rearLeft = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.03), matBlack);
      rearLeft.position.set(-0.032, 0.175, -0.32);
      const rearRight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.03), matBlack);
      rearRight.position.set(0.032, 0.175, -0.32);

      // Front Hooded Sight Post
      const frontHood = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), matBlack);
      frontHood.position.set(0, 0.175, -1.05);
      const frontPost = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), matBlack);
      frontPost.position.set(0, 0.165, -1.05);
      const frontDot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), matTritium);
      frontDot.position.set(0, 0.18, -1.04);

      group.add(
        receiver, barrel, gasTube, handguard, curvedMag, stock, 
        rearSightBase, rearLeft, rearRight, frontHood, frontPost, frontDot
      );
      break;
    }
    case 'm4': {
      // M4 Tactical Carbine
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.8), matGunMetal);
      receiver.position.set(0, 0.02, -0.1);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7), matBlack);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.05, -0.8);
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.42), matBlack);
      handguard.position.set(0, 0.05, -0.55);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.2), matBlack);
      mag.position.set(0, -0.26, -0.15);
      mag.rotation.x = -0.15;
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, isThirdPerson ? 0.5 : 0.22), matBlack);
      stock.position.set(0, -0.04, isThirdPerson ? 0.55 : 0.32);

      // Carry Handle / Rear Sight Aperture
      const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.28), matBlack);
      carryHandle.position.set(0, 0.18, -0.1);
      const rearAperture = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12), matBlack);
      rearAperture.position.set(0, 0.19, -0.2);

      // Front Triangular A-Frame Sight
      const frontFrame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), matBlack);
      frontFrame.position.set(0, 0.17, -0.92);
      const frontPost = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 6), matBlack);
      frontPost.position.set(0, 0.185, -0.92);
      const frontDot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), matTritium);
      frontDot.position.set(0, 0.19, -0.91);

      group.add(receiver, barrel, handguard, mag, stock, carryHandle, rearAperture, frontFrame, frontPost, frontDot);
      break;
    }
    case 'shotgun': {
      // SPAS-12 Shotgun
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.9), matGunMetal);
      body.position.set(0, 0.02, -0.1);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), matBlack);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.06, -0.8);
      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.75), matGunMetal);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, -0.04, -0.75);
      const pumpHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12), matBlack);
      pumpHandle.rotation.x = Math.PI / 2;
      pumpHandle.position.set(0, -0.04, -0.55);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.36, 0.2), matBlack);
      grip.position.set(0, -0.2, 0.15);

      // Top Rib & Brass Bead Sight
      const topRib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.8), matBlack);
      topRib.position.set(0, 0.125, -0.75);
      const frontBead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), matBrass);
      frontBead.position.set(0, 0.145, -1.05);

      group.add(body, barrel, magTube, pumpHandle, grip, topRib, frontBead);
      break;
    }
    case 'sniper': {
      // Barrett .50 Cal Sniper Rifle
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 1.1), matGunMetal);
      body.position.set(0, 0.02, -0.1);
      const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.2), matBlack);
      longBarrel.rotation.x = Math.PI / 2;
      longBarrel.position.set(0, 0.07, -1.2);
      const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.2), matBlack);
      muzzleBrake.position.set(0, 0.07, -1.82);

      // High Magnification Scope Cylinder
      const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.65, 12), matBlack);
      scopeBody.rotation.x = Math.PI / 2;
      scopeBody.position.set(0, 0.28, -0.2);
      const scopeRingFront = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 16), matBlack);
      scopeRingFront.position.set(0, 0.28, -0.45);
      const scopeRingRear = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 16), matBlack);
      scopeRingRear.position.set(0, 0.28, 0.05);
      const scopeLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 12),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      );
      scopeLens.position.set(0, 0.28, 0.13);

      const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), matBlack);
      bipod.position.set(0, -0.16, -0.85);

      group.add(body, longBarrel, muzzleBrake, scopeBody, scopeRingFront, scopeRingRear, scopeLens, bipod);
      break;
    }
    case 'rpg': {
      // RPG-7 Rocket Launcher
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 12), matBlack);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0, -0.1);
      const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 12), matAccent);
      heatShield.rotation.x = Math.PI / 2;
      heatShield.position.set(0, 0, 0.1);
      const matWarhead = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.4 });
      const warheadCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 12), matWarhead);
      warheadCone.rotation.x = -Math.PI / 2;
      warheadCone.position.set(0, 0, -0.9);

      // Folding ladder iron sight
      const ironSight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.04), matBlack);
      ironSight.position.set(0.12, 0.12, -0.3);

      group.add(tube, heatShield, warheadCone, ironSight);
      break;
    }
    case 'flamethrower': {
      // Pyro Cannon
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7), matGunMetal);
      tank.rotation.x = Math.PI / 2;
      tank.position.set(0, 0, -0.1);
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.32, 8), matBlack);
      nozzle.rotation.x = -Math.PI / 2;
      nozzle.position.set(0, 0, -0.55);
      const pilotFlame = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      pilotFlame.position.set(0, 0.08, -0.7);
      group.add(tank, nozzle, pilotFlame);
      break;
    }
  }

  if (isThirdPerson) {
    // Oriented forward along +Z where remote soldier faces
    group.position.set(0.35, -0.2, 0.45);
    group.rotation.y = Math.PI;
    group.scale.set(0.85, 0.85, 0.85);
  } else {
    // First-person viewmodel centered at grip
    group.position.set(0, 0, 0);
    group.scale.set(0.72, 0.72, 0.72);
  }

  return group;
}

/**
 * Procedural 3D Headgear
 */
function createHeadgearMesh(type: PlayerLoadout['headgear'], camoTexture: THREE.Texture): THREE.Group {
  const group = new THREE.Group();

  switch (type) {
    case 'beret_green': {
      // Iconic Mini Militia Green Beret
      const beretMat = new THREE.MeshStandardMaterial({
        color: 0x166534, // Army Green
        roughness: 0.8,
      });
      const beretMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 16, 12),
        beretMat
      );
      beretMesh.scale.set(1.15, 0.5, 1.2);
      beretMesh.position.set(0.15, 0.48, -0.05);
      beretMesh.rotation.z = -0.25; // Tilted proudly to the side

      // Silver skull/eagle badge on the front
      const badge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
      );
      badge.rotation.x = Math.PI / 2;
      badge.position.set(-0.25, 0.42, 0.65);
      group.add(beretMesh, badge);
      break;
    }
    case 'helmet_camo': {
      // Kevlar Camo Helmet
      const helmetMat = new THREE.MeshStandardMaterial({
        map: camoTexture,
        roughness: 0.6,
      });
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), helmetMat);
      helmet.scale.set(1.1, 0.75, 1.15);
      helmet.position.set(0, 0.35, 0);

      const brim = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.06, 8, 16), helmetMat);
      brim.rotation.x = Math.PI / 2;
      brim.position.set(0, 0.15, 0);
      group.add(helmet, brim);
      break;
    }
    case 'gas_mask': {
      // Toxic Gas Mask with Filters
      const maskMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x15803d,
        emissiveIntensity: 0.4,
      });

      // Twin circular glowing green glass lenses
      const leftLens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), visorMat);
      leftLens.rotation.x = Math.PI / 2;
      leftLens.position.set(-0.28, 0.05, 0.65);

      const rightLens = leftLens.clone();
      rightLens.position.x = 0.28;

      // Respirator filter canister in center/chin
      const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.28, 12), maskMat);
      canister.rotation.x = 0.4;
      canister.position.set(0, -0.35, 0.62);

      group.add(leftLens, rightLens, canister);
      break;
    }
    case 'aviators': {
      // Cool Aviators & Red Bandana
      const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const bandana = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.1, 8, 20), bandanaMat);
      bandana.position.set(0, 0.28, 0);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 });
      const leftGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.04, 12), glassMat);
      leftGlass.rotation.x = Math.PI / 2;
      leftGlass.position.set(-0.25, 0.05, 0.65);
      const rightGlass = leftGlass.clone();
      rightGlass.position.x = 0.25;

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), frameMat);
      bridge.position.set(0, 0.08, 0.67);

      group.add(bandana, leftGlass, rightGlass, bridge);
      break;
    }
    case 'cyber_visor': {
      // Neon Cyber Strike Visor
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.8,
        roughness: 0.1,
      });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.4), visorMat);
      visor.position.set(0, 0.08, 0.52);
      group.add(visor);
      break;
    }
    case 'ninja_hood': {
      // Special Ops Ninja Balaclava
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), hoodMat);
      hood.position.set(0, 0.1, 0);
      group.add(hood);
      break;
    }
  }

  return group;
}

/**
 * Builds the complete 3D Mini Militia soldier model
 */
export function createSoldier3D(
  loadout: PlayerLoadout,
  team: 'red' | 'blue' | 'ffa',
  isSelf: boolean = false
): SoldierMeshRef {
  const group = new THREE.Group();
  const materialsToTint: THREE.MeshStandardMaterial[] = [];

  // Team accent color
  const teamColor = team === 'red' ? 0xef4444 : team === 'blue' ? 0x3b82f6 : 0x22c55e;
  const teamMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    roughness: 0.4,
    metalness: 0.2,
  });
  materialsToTint.push(teamMat);

  // Body camo texture
  const camoTex = createCamoTexture(loadout.camo);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: camoTex,
    roughness: 0.7,
  });
  materialsToTint.push(bodyMat);

  // 1. Torso (Chunky soldier body)
  const torsoGeom = new THREE.CylinderGeometry(0.55, 0.48, 1.1, 14);
  const torsoMesh = new THREE.Mesh(torsoGeom, bodyMat);
  torsoMesh.position.set(0, 0, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // Tactical combat vest / shoulder armor
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.8,
  });
  const shoulderLeft = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), teamMat);
  shoulderLeft.position.set(-0.65, 0.35, 0);
  const shoulderRight = shoulderLeft.clone();
  shoulderRight.position.x = 0.65;
  group.add(shoulderLeft, shoulderRight);

  // Tactical belt with ammo pouches
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 8, 16), vestMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.set(0, -0.42, 0);
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.15), vestMat);
  pouch.position.set(-0.35, -0.42, 0.42);
  const pouch2 = pouch.clone();
  pouch2.position.x = 0.35;
  group.add(belt, pouch, pouch2);

  // 2. Head & Face (Mini Militia signature doodle head)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.95, 0);

  const faceTex = createSoldierFaceTexture('smirk');
  // Materials: face on front, skin on rest
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6d3ad, roughness: 0.5 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 });
  materialsToTint.push(skinMat);
  materialsToTint.push(faceMat);

  // Head sphere
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.65, 20, 16), skinMat);
  headGroup.add(headMesh);

  // Face decal plane curved slightly over the front of the head
  const faceDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    faceMat
  );
  faceDecal.position.set(0, 0, 0.62);
  headGroup.add(faceDecal);

  // Add Headgear
  const headgearMesh = createHeadgearMesh(loadout.headgear, camoTex);
  headGroup.add(headgearMesh);
  group.add(headGroup);

  // 3. Hands & Weapon Mount
  const weaponGroup = new THREE.Group();
  let currentWeaponMesh = createWeaponMesh(loadout.primaryWeapon, true);
  weaponGroup.add(currentWeaponMesh);

  // Floating cartoon soldier hands
  const handMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 }); // combat gloves
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), handMat);
  rightHand.position.set(0.35, -0.2, 0.45);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), handMat);
  leftHand.position.set(0.15, -0.2, 0.7);
  weaponGroup.add(rightHand, leftHand);

  group.add(weaponGroup);

  // 4. Jetpack Boots / Thrusters (Mini Militia floating boots!)
  const boosterMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3,
  });

  const boosterGeom = new THREE.CylinderGeometry(0.16, 0.22, 0.5, 12);
  const leftBooster = new THREE.Mesh(boosterGeom, boosterMat);
  leftBooster.position.set(-0.35, -0.75, 0);

  const rightBooster = leftBooster.clone();
  rightBooster.position.x = 0.35;

  // Flame cones
  const flameMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(loadout.trailColor || '#f97316'),
    transparent: true,
    opacity: 0,
  });

  const flameGeom = new THREE.ConeGeometry(0.2, 0.8, 8);
  flameGeom.rotateX(Math.PI);
  const leftFlame = new THREE.Mesh(flameGeom, flameMat);
  leftFlame.position.set(0, -0.55, 0);
  leftBooster.add(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeom, flameMat.clone());
  rightFlame.position.set(0, -0.55, 0);
  rightBooster.add(rightFlame);

  group.add(leftBooster, rightBooster);

  // 5. Overhead Floating Health Bar & Nameplate (visible for all except 1st person self)
  const hudGroup = new THREE.Group();
  hudGroup.position.set(0, 2.0, 0);

  // Health bar background
  const hpBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false })
  );
  const hpFg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.56, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false })
  );
  hpFg.position.set(0, 0, 0.01);
  hudGroup.add(hpBg, hpFg);

  // Name sprite
  const nameSprite = createNameTagSprite(loadout.callsign || 'SOLDIER', team);
  nameSprite.position.set(0, 0.45, 0);
  hudGroup.add(nameSprite);

  group.add(hudGroup);

  // Keep HUD billboarded towards camera
  hudGroup.renderOrder = 999;

  // Hurt flash state
  let hurtTimer = 0;
  const originalColors = materialsToTint.map(m => m.color.clone());

  return {
    group,
    headGroup,
    torsoMesh,
    weaponGroup,
    leftBooster,
    rightBooster,
    leftFlame,
    rightFlame,
    healthBarForeground: hpFg,
    nameSprite,
    materialsToTint,
    updateAim(pitch: number, yaw: number) {
      group.rotation.y = yaw;
      // Head and weapons pitch up/down
      headGroup.rotation.x = pitch * 0.4;
      weaponGroup.rotation.x = pitch;
    },
    setJetpackActive(active: boolean) {
      const targetOpacity = active ? 0.9 : 0;
      (leftFlame.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
      (rightFlame.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
      const scale = active ? 1 + Math.random() * 0.35 : 0.01;
      leftFlame.scale.set(scale, scale, scale);
      rightFlame.scale.set(scale, scale, scale);
    },
    setWeapon(weaponType: WeaponType) {
      weaponGroup.remove(currentWeaponMesh);
      currentWeaponMesh = createWeaponMesh(weaponType, true);
      weaponGroup.add(currentWeaponMesh);
    },
    setHealthPercent(percent: number) {
      const clamped = Math.max(0, Math.min(1, percent));
      hpFg.scale.x = clamped;
      hpFg.position.x = -(1 - clamped) * 0.78;
      // Color change: green -> yellow -> red
      const mat = hpFg.material as THREE.MeshBasicMaterial;
      if (clamped > 0.5) {
        mat.color.setHex(0x22c55e); // Green
      } else if (clamped > 0.25) {
        mat.color.setHex(0xeab308); // Yellow
      } else {
        mat.color.setHex(0xef4444); // Red
      }
    },
    triggerHurtFlash() {
      hurtTimer = 0.15;
      for (const mat of materialsToTint) {
        mat.color.setHex(0xffffff); // Flash white/red
      }
      setTimeout(() => {
        materialsToTint.forEach((mat, i) => {
          mat.color.copy(originalColors[i]);
        });
      }, 120);
    },
    dispose() {
      // Memory cleanup
      group.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    },
  };
}
