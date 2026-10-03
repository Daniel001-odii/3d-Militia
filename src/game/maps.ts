/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createBunkerWallTexture, createCrateTexture } from './textures';
import { WeaponType } from '../types/game';

export interface MapCollider {
  box: THREE.Box3;
  type: 'solid' | 'hazard' | 'one_way';
}

export interface MapDefinition {
  id: 'outpost' | 'bunker' | 'cyber';
  name: string;
  description: string;
  group: THREE.Group;
  colliders: MapCollider[];
  spawnPoints: THREE.Vector3[];
  pickupSpawns: {
    id: string;
    position: THREE.Vector3;
    type: 'health' | 'nitro' | 'ammo' | 'weapon';
    weaponType?: WeaponType;
  }[];
  killY: number;
  dispose: () => void;
}

/**
 * Helper to add box platform with collider
 */
function addBox(
  group: THREE.Group,
  colliders: MapCollider[],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  type: 'solid' | 'hazard' = 'solid'
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const box = new THREE.Box3();
  box.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, d));
  colliders.push({ box, type });
  return mesh;
}

/**
 * Helper to add decorative supply crate
 */
function addSupplyCrate(
  group: THREE.Group,
  colliders: MapCollider[],
  x: number,
  y: number,
  z: number,
  label: 'AMMO' | 'HEALTH' | 'NITRO'
) {
  const tex = createCrateTexture(label);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const box = new THREE.Box3();
  box.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(1.6, 1.6, 1.6));
  colliders.push({ box, type: 'solid' });
}

/**
 * Map 1: Outpost Arena (Full 3D FPS Arena with Floating Islands & Strongholds)
 */
export function buildOutpostMap(): MapDefinition {
  const group = new THREE.Group();
  const colliders: MapCollider[] = [];

  const wallTex = createBunkerWallTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x3f4a34, // Military olive turf
    roughness: 0.8,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x44403c,
    roughness: 0.85,
  });
  const bunkerMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.5,
    metalness: 0.5,
  });
  const catwalkMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.6,
    metalness: 0.7,
  });

  // 1. Main Ground Base (75 x 75)
  addBox(group, colliders, 0, -1, 0, 76, 2, 76, terrainMat);

  // 2. Perimeter Boundary Walls
  addBox(group, colliders, 0, 8, -38, 76, 18, 2, rockMat);
  addBox(group, colliders, 0, 8, 38, 76, 18, 2, rockMat);
  addBox(group, colliders, -38, 8, 0, 2, 18, 76, rockMat);
  addBox(group, colliders, 38, 8, 0, 2, 18, 76, rockMat);

  // 3. Central Command Stronghold (Two-tier bunker)
  // Base structure
  addBox(group, colliders, 0, 2.5, 0, 18, 5, 18, bunkerMat);
  // Interior hollow cutout simulated by bunker outer pillars
  addBox(group, colliders, -7.5, 7.5, -7.5, 3, 5, 3, bunkerMat);
  addBox(group, colliders, 7.5, 7.5, -7.5, 3, 5, 3, bunkerMat);
  addBox(group, colliders, -7.5, 7.5, 7.5, 3, 5, 3, bunkerMat);
  addBox(group, colliders, 7.5, 7.5, 7.5, 3, 5, 3, bunkerMat);
  // Central Bunker Rooftop
  addBox(group, colliders, 0, 10.5, 0, 20, 1, 20, catwalkMat);

  // 4. Four Corner Sniper Towers (Height: 8m & 14m)
  // North-West Tower
  addBox(group, colliders, -24, 4, -24, 8, 8, 8, bunkerMat);
  addBox(group, colliders, -24, 9, -24, 10, 1, 10, catwalkMat);

  // North-East Tower
  addBox(group, colliders, 24, 4, -24, 8, 8, 8, bunkerMat);
  addBox(group, colliders, 24, 9, -24, 10, 1, 10, catwalkMat);

  // South-West Tower
  addBox(group, colliders, -24, 4, 24, 8, 8, 8, bunkerMat);
  addBox(group, colliders, -24, 9, 24, 10, 1, 10, catwalkMat);

  // South-East Tower
  addBox(group, colliders, 24, 4, 24, 8, 8, 8, bunkerMat);
  addBox(group, colliders, 24, 9, 24, 10, 1, 10, catwalkMat);

  // 5. Aerial Sky Bridges connecting Towers to Central Bunker
  addBox(group, colliders, 0, 10.5, -19, 4, 0.6, 18, catwalkMat);
  addBox(group, colliders, 0, 10.5, 19, 4, 0.6, 18, catwalkMat);
  addBox(group, colliders, -19, 9, 0, 18, 0.6, 4, catwalkMat);
  addBox(group, colliders, 19, 9, 0, 18, 0.6, 4, catwalkMat);

  // 6. Floating Rock Islands (Reachable via Jetpack boost!)
  addBox(group, colliders, -12, 16, -12, 8, 2, 8, rockMat);
  addBox(group, colliders, 12, 16, 12, 8, 2, 8, rockMat);
  addBox(group, colliders, 0, 21, 0, 10, 2, 10, rockMat); // Highest apex perch

  // 7. Tactical Sandbag & Crate Cover
  addSupplyCrate(group, colliders, -5, 0.8, -5, 'AMMO');
  addSupplyCrate(group, colliders, 5, 0.8, 5, 'NITRO');
  addSupplyCrate(group, colliders, 0, 11.5, 0, 'HEALTH');
  addSupplyCrate(group, colliders, -24, 10, -24, 'AMMO');
  addSupplyCrate(group, colliders, 24, 10, 24, 'AMMO');
  addSupplyCrate(group, colliders, 14, 0.8, -14, 'AMMO');
  addSupplyCrate(group, colliders, -14, 0.8, 14, 'HEALTH');

  // Ground cover barricades
  addBox(group, colliders, -12, 1, -6, 6, 2, 1.2, bunkerMat);
  addBox(group, colliders, 12, 1, 6, 6, 2, 1.2, bunkerMat);
  addBox(group, colliders, -6, 1, 12, 1.2, 2, 6, bunkerMat);
  addBox(group, colliders, 6, 1, -12, 1.2, 2, 6, bunkerMat);

  const spawnPoints = [
    new THREE.Vector3(-14, 1.2, -14),
    new THREE.Vector3(14, 1.2, 14),
    new THREE.Vector3(-14, 1.2, 14),
    new THREE.Vector3(14, 1.2, -14),
    new THREE.Vector3(0, 1.2, -22),
    new THREE.Vector3(0, 1.2, 22),
    new THREE.Vector3(-20, 1.2, 0),
    new THREE.Vector3(20, 1.2, 0),
    new THREE.Vector3(0, 12, 0),
    new THREE.Vector3(-24, 10.5, -24),
    new THREE.Vector3(24, 10.5, 24),
  ];

  const pickupSpawns: MapDefinition['pickupSpawns'] = [
    { id: 'p_rpg', position: new THREE.Vector3(0, 22.5, 0), type: 'weapon', weaponType: 'rpg' },
    { id: 'p_sniper_1', position: new THREE.Vector3(-24, 10.5, -24), type: 'weapon', weaponType: 'sniper' },
    { id: 'p_sniper_2', position: new THREE.Vector3(24, 10.5, 24), type: 'weapon', weaponType: 'sniper' },
    { id: 'p_shotgun', position: new THREE.Vector3(0, 1.5, 0), type: 'weapon', weaponType: 'shotgun' },
    { id: 'p_hp_center', position: new THREE.Vector3(0, 11.8, 0), type: 'health' },
    { id: 'p_nitro_1', position: new THREE.Vector3(-12, 17.5, -12), type: 'nitro' },
    { id: 'p_nitro_2', position: new THREE.Vector3(12, 17.5, 12), type: 'nitro' },
    { id: 'p_ammo_1', position: new THREE.Vector3(-16, 1.5, 0), type: 'ammo' },
    { id: 'p_ammo_2', position: new THREE.Vector3(16, 1.5, 0), type: 'ammo' },
  ];

  return {
    id: 'outpost',
    name: 'Outpost Arena (FPS)',
    description: 'Expansive 3D military arena with towers, high-altitude bridges, and aerial sniper perches.',
    group,
    colliders,
    spawnPoints,
    pickupSpawns,
    killY: -10,
    dispose: () => {
      group.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    },
  };
}

/**
 * Map 2: Bunker 17 (FPS 3D Subterranean Complex with Acid Pit)
 */
export function buildBunkerMap(): MapDefinition {
  const group = new THREE.Group();
  const colliders: MapCollider[] = [];

  const wallTex = createBunkerWallTexture();
  const steelMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.4,
    metalness: 0.6,
  });
  const acidMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.85,
  });
  const catwalkMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.3,
  });

  // Main Floor wings
  addBox(group, colliders, -22, -1, 0, 26, 2, 60, steelMat);
  addBox(group, colliders, 22, -1, 0, 26, 2, 60, steelMat);

  // Toxic Sludge Canal running down the center
  addBox(group, colliders, 0, -3, 0, 18, 1, 60, acidMat, 'hazard');

  // Catwalk Bridges over acid canal
  addBox(group, colliders, 0, 0.5, 0, 18, 0.8, 6, catwalkMat);
  addBox(group, colliders, 0, 0.5, -20, 18, 0.8, 6, catwalkMat);
  addBox(group, colliders, 0, 0.5, 20, 18, 0.8, 6, catwalkMat);

  // Second Floor Mezzanines
  addBox(group, colliders, -22, 6, 0, 16, 1, 50, steelMat);
  addBox(group, colliders, 22, 6, 0, 16, 1, 50, steelMat);
  addBox(group, colliders, 0, 6, 0, 28, 0.8, 8, catwalkMat); // High cross-bridge

  // Third Floor Air Duct & Snipers Catwalk
  addBox(group, colliders, 0, 12, 0, 20, 1, 20, steelMat);
  addBox(group, colliders, 0, 12, -22, 8, 1, 16, catwalkMat);
  addBox(group, colliders, 0, 12, 22, 8, 1, 16, catwalkMat);

  // Outer Perimeter Walls & Ceiling
  addBox(group, colliders, 0, 8, -31, 70, 20, 2, steelMat);
  addBox(group, colliders, 0, 8, 31, 70, 20, 2, steelMat);
  addBox(group, colliders, -36, 8, 0, 2, 20, 64, steelMat);
  addBox(group, colliders, 36, 8, 0, 2, 20, 64, steelMat);
  addBox(group, colliders, 0, 18, 0, 72, 2, 64, steelMat); // Ceiling

  // Cover Crates
  addSupplyCrate(group, colliders, -16, 0.8, -10, 'AMMO');
  addSupplyCrate(group, colliders, 16, 0.8, 10, 'NITRO');
  addSupplyCrate(group, colliders, 0, 1.4, 0, 'HEALTH');
  addSupplyCrate(group, colliders, -20, 7.3, 0, 'AMMO');
  addSupplyCrate(group, colliders, 20, 7.3, 0, 'AMMO');

  const spawnPoints = [
    new THREE.Vector3(-24, 1.5, -20),
    new THREE.Vector3(24, 1.5, 20),
    new THREE.Vector3(-24, 1.5, 20),
    new THREE.Vector3(24, 1.5, -20),
    new THREE.Vector3(-20, 7.5, 0),
    new THREE.Vector3(20, 7.5, 0),
    new THREE.Vector3(0, 13.5, 0),
  ];

  const pickupSpawns: MapDefinition['pickupSpawns'] = [
    { id: 'b_hp_bridge', position: new THREE.Vector3(0, 1.5, 0), type: 'health' },
    { id: 'b_flame', position: new THREE.Vector3(0, 7.2, 0), type: 'weapon', weaponType: 'flamethrower' },
    { id: 'b_rpg', position: new THREE.Vector3(0, 13.5, 0), type: 'weapon', weaponType: 'rpg' },
    { id: 'b_nitro_1', position: new THREE.Vector3(-22, 1.5, 0), type: 'nitro' },
    { id: 'b_nitro_2', position: new THREE.Vector3(22, 1.5, 0), type: 'nitro' },
    { id: 'b_ammo_1', position: new THREE.Vector3(-22, 7.5, -15), type: 'ammo' },
    { id: 'b_ammo_2', position: new THREE.Vector3(22, 7.5, 15), type: 'ammo' },
  ];

  return {
    id: 'bunker',
    name: 'Bunker 17 (FPS)',
    description: 'Enclosed industrial bunker facility with high-intensity close quarters combat and toxic acid canal.',
    group,
    colliders,
    spawnPoints,
    pickupSpawns,
    killY: -8,
    dispose: () => {
      group.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    },
  };
}

/**
 * Map 3: Cyber Complex (FPS 3D Neon Sci-Fi Arena)
 */
export function buildCyberMap(): MapDefinition {
  const group = new THREE.Group();
  const colliders: MapCollider[] = [];

  const neonCyanMat = new THREE.MeshStandardMaterial({
    color: 0x082f49,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const neonPinkMat = new THREE.MeshStandardMaterial({
    color: 0x4c0519,
    emissive: 0xe11d48,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Main Floating Grid Floor
  addBox(group, colliders, 0, -1, 0, 70, 2, 70, darkMetalMat);

  // Glowing Outer Energy Boundary
  addBox(group, colliders, 0, 6, -35, 70, 14, 2, neonCyanMat);
  addBox(group, colliders, 0, 6, 35, 70, 14, 2, neonCyanMat);
  addBox(group, colliders, -35, 6, 0, 2, 14, 70, neonPinkMat);
  addBox(group, colliders, 35, 6, 0, 2, 14, 70, neonPinkMat);

  // Central Launch Pad Tower
  addBox(group, colliders, 0, 3, 0, 16, 6, 16, darkMetalMat);
  addBox(group, colliders, 0, 6.5, 0, 18, 1, 18, neonCyanMat);

  // Four Elevated Combat Quadrants
  addBox(group, colliders, -20, 4, -20, 12, 1, 12, neonPinkMat);
  addBox(group, colliders, 20, 4, -20, 12, 1, 12, neonCyanMat);
  addBox(group, colliders, -20, 4, 20, 12, 1, 12, neonCyanMat);
  addBox(group, colliders, 20, 4, 20, 12, 1, 12, neonPinkMat);

  // High Air Tramway Platforms (Jump / Fly)
  addBox(group, colliders, 0, 11, -20, 12, 1, 6, darkMetalMat);
  addBox(group, colliders, 0, 11, 20, 12, 1, 6, darkMetalMat);
  addBox(group, colliders, -20, 11, 0, 6, 1, 12, darkMetalMat);
  addBox(group, colliders, 20, 11, 0, 6, 1, 12, darkMetalMat);

  // Apex Center Floating Platform (Apex Sniper Spot)
  addBox(group, colliders, 0, 17, 0, 10, 1.2, 10, neonPinkMat);

  // Energy Barriers for ground cover
  addBox(group, colliders, -10, 1, -10, 4, 2, 1, neonCyanMat);
  addBox(group, colliders, 10, 1, 10, 4, 2, 1, neonCyanMat);
  addBox(group, colliders, -10, 1, 10, 1, 2, 4, neonPinkMat);
  addBox(group, colliders, 10, 1, -10, 1, 2, 4, neonPinkMat);

  const spawnPoints = [
    new THREE.Vector3(-20, 5.5, -20),
    new THREE.Vector3(20, 5.5, 20),
    new THREE.Vector3(-20, 5.5, 20),
    new THREE.Vector3(20, 5.5, -20),
    new THREE.Vector3(0, 8, 0),
    new THREE.Vector3(0, 1.5, -15),
    new THREE.Vector3(0, 1.5, 15),
  ];

  const pickupSpawns: MapDefinition['pickupSpawns'] = [
    { id: 'c_sniper', position: new THREE.Vector3(0, 18.5, 0), type: 'weapon', weaponType: 'sniper' },
    { id: 'c_rpg', position: new THREE.Vector3(0, 8.2, 0), type: 'weapon', weaponType: 'rpg' },
    { id: 'c_hp_1', position: new THREE.Vector3(-20, 5.5, 0), type: 'health' },
    { id: 'c_hp_2', position: new THREE.Vector3(20, 5.5, 0), type: 'health' },
    { id: 'c_nitro_1', position: new THREE.Vector3(0, 12.5, -20), type: 'nitro' },
    { id: 'c_nitro_2', position: new THREE.Vector3(0, 12.5, 20), type: 'nitro' },
  ];

  return {
    id: 'cyber',
    name: 'Cyber Complex (FPS)',
    description: 'High altitude neon battlefield with antigrav launchpads and multi-tiered jump platforms.',
    group,
    colliders,
    spawnPoints,
    pickupSpawns,
    killY: -12,
    dispose: () => {
      group.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    },
  };
}

export function loadMap(mapId: 'outpost' | 'bunker' | 'cyber'): MapDefinition {
  if (mapId === 'bunker') return buildBunkerMap();
  if (mapId === 'cyber') return buildCyberMap();
  return buildOutpostMap();
}
