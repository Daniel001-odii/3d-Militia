/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CamoPattern, HeadgearType } from '../types/game';

// Custom Texture Slots that the user can customize or provide
export type TextureSlot = 
  | 'soldier_camo'
  | 'soldier_face'
  | 'headgear_beret'
  | 'headgear_mask'
  | 'weapon_skin'
  | 'map_wall'
  | 'map_floor'
  | 'map_crate'
  | 'jetpack_flame'
  | 'toxic_gas'
  | 'custom_crosshair'
  | 'clan_emblem';

export interface TextureSpec {
  slot: TextureSlot;
  name: string;
  recommendedResolution: string;
  description: string;
  currentType: 'procedural' | 'custom';
}

export const TEXTURE_SLOT_SPECS: Record<TextureSlot, TextureSpec> = {
  soldier_camo: {
    slot: 'soldier_camo',
    name: 'Uniform Camouflage',
    recommendedResolution: '512x512 PNG',
    description: 'Repeating military camouflage pattern applied to soldier body armor and trousers.',
    currentType: 'procedural',
  },
  soldier_face: {
    slot: 'soldier_face',
    name: 'Soldier Expression Face',
    recommendedResolution: '256x256 PNG',
    description: 'Frontal doodle face texture with classic Mini Militia grimace/smirk and battle eyes.',
    currentType: 'procedural',
  },
  headgear_beret: {
    slot: 'headgear_beret',
    name: 'Beret / Helmet Crest',
    recommendedResolution: '256x256 PNG',
    description: 'Special forces emblem or fabric texture for military berets and helmets.',
    currentType: 'procedural',
  },
  headgear_mask: {
    slot: 'headgear_mask',
    name: 'Gas Mask / Visor Texture',
    recommendedResolution: '256x256 PNG',
    description: 'Reflective respirator lens and filtration valves texture.',
    currentType: 'procedural',
  },
  weapon_skin: {
    slot: 'weapon_skin',
    name: 'Weapon Finish / Camo',
    recommendedResolution: '512x512 PNG',
    description: 'Metallic finish, carbon fiber, or gold/camo wrap for guns and launchers.',
    currentType: 'procedural',
  },
  map_wall: {
    slot: 'map_wall',
    name: 'Bunker Wall Concrete',
    recommendedResolution: '512x512 PNG (Tileable)',
    description: 'Reinforced bunker walls with metal seams, rivets, and weathering.',
    currentType: 'procedural',
  },
  map_floor: {
    slot: 'map_floor',
    name: 'Catacomb / Outpost Floor',
    recommendedResolution: '512x512 PNG (Tileable)',
    description: 'Industrial grating or earthen rock surface for platforms.',
    currentType: 'procedural',
  },
  map_crate: {
    slot: 'map_crate',
    name: 'Military Munitions Crate',
    recommendedResolution: '256x256 PNG',
    description: 'Wood or steel supply crate with hazard markings and stencil labels.',
    currentType: 'procedural',
  },
  jetpack_flame: {
    slot: 'jetpack_flame',
    name: 'Jetpack Rocket Exhaust',
    recommendedResolution: '128x128 PNG (Alpha)',
    description: 'High heat rocket plume gradient sprite for booster particles.',
    currentType: 'procedural',
  },
  toxic_gas: {
    slot: 'toxic_gas',
    name: 'Poison Gas Cloud Sprite',
    recommendedResolution: '128x128 PNG (Alpha)',
    description: 'Toxic neon green smoke cloud particle sprite for gas grenades.',
    currentType: 'procedural',
  },
  custom_crosshair: {
    slot: 'custom_crosshair',
    name: 'Combat Reticle / Crosshair',
    recommendedResolution: '128x128 PNG (Alpha)',
    description: 'HUD crosshair reticle overlay with center aim point.',
    currentType: 'procedural',
  },
  clan_emblem: {
    slot: 'clan_emblem',
    name: 'Clan Badge / Shoulder Decal',
    recommendedResolution: '256x256 PNG (Alpha)',
    description: 'Shoulder patch or weapon sticker displaying your squad insignia.',
    currentType: 'procedural',
  },
};

// Texture Cache
const textureCache = new Map<string, THREE.Texture>();
const customOverrides = new Map<TextureSlot, string>();

/**
 * Register a user-provided custom texture (via base64 data URL, blob, or remote URL)
 */
export function setCustomTexture(slot: TextureSlot, dataUrl: string): THREE.Texture {
  customOverrides.set(slot, dataUrl);
  TEXTURE_SLOT_SPECS[slot].currentType = 'custom';
  
  const loader = new THREE.TextureLoader();
  const texture = loader.load(dataUrl);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(slot, texture);
  return texture;
}

/**
 * Remove a custom texture override and revert to procedural
 */
export function removeCustomTexture(slot: TextureSlot) {
  customOverrides.delete(slot);
  TEXTURE_SLOT_SPECS[slot].currentType = 'procedural';
  textureCache.delete(slot);
}

export function getCustomTextureUrl(slot: TextureSlot): string | undefined {
  return customOverrides.get(slot);
}

/**
 * Helper to build canvas texture with mipmaps
 */
function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generate Procedural Military Camo Pattern
 */
export function createCamoTexture(pattern: CamoPattern): THREE.CanvasTexture {
  const cacheKey = `camo_${pattern}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey) as THREE.CanvasTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  let baseColor = '#3f4a34';
  let colors = ['#283122', '#596547', '#1b2016', '#72674e'];

  switch (pattern) {
    case 'desert':
      baseColor = '#d4b382';
      colors = ['#b8935c', '#dfc79b', '#87693d', '#a28352'];
      break;
    case 'urban':
      baseColor = '#64748b';
      colors = ['#334155', '#94a3b8', '#1e293b', '#cbd5e1'];
      break;
    case 'arctic':
      baseColor = '#f1f5f9';
      colors = ['#cbd5e1', '#94a3b8', '#e2e8f0', '#64748b'];
      break;
    case 'midnight':
      baseColor = '#0f172a';
      colors = ['#1e293b', '#090d16', '#26334d', '#05080f'];
      break;
    case 'hazard':
      baseColor = '#eab308';
      colors = ['#ca8a04', '#18181b', '#27272a', '#facc15'];
      break;
  }

  // Base fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Organic camo patches
  for (let c = 0; c < colors.length; c++) {
    ctx.fillStyle = colors[c];
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const radius = 25 + Math.random() * 60;
      
      // Blobby circle
      ctx.moveTo(cx + radius, cy);
      const points = 7 + Math.floor(Math.random() * 5);
      for (let p = 1; p <= points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const r = radius * (0.6 + Math.random() * 0.8);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  // Subtle fabric noise / weave
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = canvasToTexture(canvas);
  texture.repeat.set(2, 2);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate Iconic Mini Militia Doodle Soldier Face Texture
 */
export function createSoldierFaceTexture(expression: 'smirk' | 'grimace' | 'intense' = 'smirk'): THREE.CanvasTexture {
  const cacheKey = `soldier_face_${expression}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey) as THREE.CanvasTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Skin tone
  ctx.fillStyle = '#f6d3ad';
  ctx.fillRect(0, 0, 256, 256);

  // Mini Militia signature thick cartoon outlines and doodle features
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Eyebrows (thick military brows)
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  // Left brow (angled downward in focus)
  ctx.moveTo(50, 75);
  ctx.lineTo(105, 95);
  ctx.lineTo(100, 110);
  ctx.lineTo(50, 85);
  ctx.closePath();
  ctx.fill();

  // Right brow
  ctx.beginPath();
  ctx.moveTo(206, 75);
  ctx.lineTo(151, 95);
  ctx.lineTo(156, 110);
  ctx.lineTo(206, 85);
  ctx.closePath();
  ctx.fill();

  // Eyes (Classic Mini Militia bold white cartoon eyes with black pupils)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 6;

  // Left Eye
  ctx.beginPath();
  ctx.ellipse(82, 118, 22, 16, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right Eye
  ctx.beginPath();
  ctx.ellipse(174, 118, 22, 16, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils (Looking forward with determination)
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(88, 118, 9, 0, Math.PI * 2);
  ctx.arc(168, 118, 9, 0, Math.PI * 2);
  ctx.fill();

  // Eye glints
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(85, 115, 3, 0, Math.PI * 2);
  ctx.arc(165, 115, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose (cute small cartoon shadow)
  ctx.fillStyle = '#dfaa80';
  ctx.beginPath();
  ctx.ellipse(128, 142, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth (The famous Mini Militia cigar or grimacing grin with teeth)
  if (expression === 'smirk' || expression === 'grimace') {
    // Clenched combat teeth
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.roundRect(85, 172, 86, 32, [8, 8, 12, 12]);
    ctx.fill();
    ctx.stroke();

    // Tooth dividers
    ctx.beginPath();
    ctx.moveTo(85, 188);
    ctx.lineTo(171, 188); // horizontal line between top & bottom teeth
    ctx.moveTo(105, 172);
    ctx.lineTo(105, 204);
    ctx.moveTo(128, 172);
    ctx.lineTo(128, 204);
    ctx.moveTo(151, 172);
    ctx.lineTo(151, 204);
    ctx.stroke();

    // Iconic cigar in corner of mouth!
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(160, 190, 38, 12, 4);
    ctx.fill();
    ctx.stroke();

    // Cigar ash / red ember tip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(193, 192, 5, 8);
  }

  // Battle scar across left cheek
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(55, 140);
  ctx.lineTo(75, 170);
  ctx.stroke();

  const texture = canvasToTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate Industrial Metal Bunker Wall Texture
 */
export function createBunkerWallTexture(): THREE.CanvasTexture {
  const cacheKey = 'bunker_wall';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey) as THREE.CanvasTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base steel / concrete
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  // Panels
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 504);
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Rivets on corners
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  const rivetCoords = [
    [24, 24], [24, 232], [232, 24], [232, 232],
    [280, 24], [280, 232], [488, 24], [488, 232],
    [24, 280], [24, 488], [232, 280], [232, 488],
    [280, 280], [280, 488], [488, 280], [488, 488],
  ];
  for (const [rx, ry] of rivetCoords) {
    ctx.beginPath();
    ctx.arc(rx, ry, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Hazard diagonal stripe accent at the bottom
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 470, 512, 42);
  ctx.clip();
  for (let x = -50; x < 600; x += 36) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(x, 512);
    ctx.lineTo(x + 24, 512);
    ctx.lineTo(x + 50, 470);
    ctx.lineTo(x + 26, 470);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(x + 24, 512);
    ctx.lineTo(x + 36, 512);
    ctx.lineTo(x + 62, 470);
    ctx.lineTo(x + 50, 470);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const texture = canvasToTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate Ammo / Weapon Supply Crate Texture
 */
export function createCrateTexture(label: 'AMMO' | 'HEALTH' | 'NITRO' = 'AMMO'): THREE.CanvasTexture {
  const cacheKey = `crate_${label}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey) as THREE.CanvasTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Army olive / drab wood
  ctx.fillStyle = label === 'HEALTH' ? '#1e3a24' : label === 'NITRO' ? '#172554' : '#3f4a34';
  ctx.fillRect(0, 0, 256, 256);

  // Border frame
  ctx.fillStyle = label === 'HEALTH' ? '#14291a' : label === 'NITRO' ? '#0f172a' : '#2b3323';
  ctx.fillRect(0, 0, 256, 24);
  ctx.fillRect(0, 232, 256, 24);
  ctx.fillRect(0, 0, 24, 256);
  ctx.fillRect(232, 0, 24, 256);

  // Stencil cross brace
  ctx.lineWidth = 14;
  ctx.strokeStyle = label === 'HEALTH' ? '#14291a' : label === 'NITRO' ? '#0f172a' : '#2b3323';
  ctx.beginPath();
  ctx.moveTo(24, 24);
  ctx.lineTo(232, 232);
  ctx.moveTo(232, 24);
  ctx.lineTo(24, 232);
  ctx.stroke();

  // Stencil Label
  ctx.fillStyle = label === 'HEALTH' ? '#4ade80' : label === 'NITRO' ? '#38bdf8' : '#fbbf24';
  ctx.font = 'bold 36px "Rajdhani", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 128);

  const texture = canvasToTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate Circular Particle Sprite Texture (Smoke / Flame / Spark)
 */
export function createParticleSpriteTexture(type: 'flame' | 'smoke' | 'spark' | 'gas'): THREE.CanvasTexture {
  const cacheKey = `particle_${type}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey) as THREE.CanvasTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

  if (type === 'flame') {
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 140, 0, 0.9)');
    gradient.addColorStop(0.7, 'rgba(220, 38, 38, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (type === 'smoke') {
    gradient.addColorStop(0, 'rgba(180, 180, 180, 0.8)');
    gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.4)');
    gradient.addColorStop(1, 'rgba(50, 50, 50, 0)');
  } else if (type === 'gas') {
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.9)');
    gradient.addColorStop(0.4, 'rgba(34, 197, 94, 0.6)');
    gradient.addColorStop(0.8, 'rgba(22, 101, 52, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(253, 224, 71, 0.9)');
    gradient.addColorStop(0.6, 'rgba(249, 115, 22, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = canvasToTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
