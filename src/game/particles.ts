/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createParticleSpriteTexture } from './textures';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  maxLife: number;
  life: number;
  type: 'flame' | 'smoke' | 'spark' | 'gas' | 'blood';
  growth: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private flameTex: THREE.Texture;
  private smokeTex: THREE.Texture;
  private gasTex: THREE.Texture;
  private sparkTex: THREE.Texture;
  private group: THREE.Group;

  // Instanced or batched point clouds/sprites
  private pointGeometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private pointMaterial: THREE.PointsMaterial;
  private points: THREE.Points;
  private maxParticles = 800;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.flameTex = createParticleSpriteTexture('flame');
    this.smokeTex = createParticleSpriteTexture('smoke');
    this.gasTex = createParticleSpriteTexture('gas');
    this.sparkTex = createParticleSpriteTexture('spark');

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.pointGeometry = new THREE.BufferGeometry();
    this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.pointGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.pointMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.sparkTex,
    });

    this.points = new THREE.Points(this.pointGeometry, this.pointMaterial);
    this.group.add(this.points);
  }

  public emitJetpackBooster(pos: THREE.Vector3, dir: THREE.Vector3, colorHex = '#f97316') {
    if (this.particles.length >= this.maxParticles - 4) return;
    const col = new THREE.Color(colorHex);

    // Flame core
    this.particles.push({
      position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.2, (Math.random() - 0.5) * 0.1)),
      velocity: dir.clone().multiplyScalar(4 + Math.random() * 3).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, -4, (Math.random() - 0.5) * 1.5)),
      color: col,
      size: 0.6 + Math.random() * 0.4,
      maxLife: 0.2,
      life: 0.2,
      type: 'flame',
      growth: -1.5,
    });

    // Smoke puff behind
    if (Math.random() < 0.4) {
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, -0.4, (Math.random() - 0.5) * 0.2)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, -1.5, (Math.random() - 0.5) * 0.8),
        color: new THREE.Color(0x64748b),
        size: 0.8 + Math.random() * 0.5,
        maxLife: 0.6,
        life: 0.6,
        type: 'smoke',
        growth: 2.0,
      });
    }
  }

  public emitMuzzleFlash(pos: THREE.Vector3, forward: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        position: pos.clone().add(forward.clone().multiplyScalar(0.2)),
        velocity: forward.clone().multiplyScalar(5 + Math.random() * 6).add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0)),
        color: new THREE.Color(0xfde047),
        size: 0.5 + Math.random() * 0.3,
        maxLife: 0.08,
        life: 0.08,
        type: 'spark',
        growth: -3,
      });
    }
  }

  public emitExplosion(pos: THREE.Vector3, radius = 5) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        (Math.random() * 0.8 + 0.2) * speed,
        (Math.random() - 0.5) * speed * 0.5
      );

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: i % 2 === 0 ? new THREE.Color(0xf97316) : new THREE.Color(0xef4444),
        size: 1.2 + Math.random() * 1.5,
        maxLife: 0.5 + Math.random() * 0.4,
        life: 0.5 + Math.random() * 0.4,
        type: 'flame',
        growth: 3.5,
      });
    }

    // Heavy gray billowy smoke
    for (let i = 0; i < 20; i++) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 7, (Math.random() - 0.5) * 4);
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, 0)),
        velocity: vel,
        color: new THREE.Color(0x334155),
        size: 1.8 + Math.random() * 2.0,
        maxLife: 1.2 + Math.random() * 0.6,
        life: 1.2 + Math.random() * 0.6,
        type: 'smoke',
        growth: 4.0,
      });
    }
  }

  public emitGasCloud(pos: THREE.Vector3) {
    for (let i = 0; i < 16; i++) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * 2.5, Math.random() * 1.5, (Math.random() - 0.5) * 2);
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 2)),
        velocity: vel,
        color: new THREE.Color(0x22c55e),
        size: 2.5 + Math.random() * 2.0,
        maxLife: 3.0 + Math.random() * 1.5,
        life: 3.0 + Math.random() * 1.5,
        type: 'gas',
        growth: 1.5,
      });
    }
  }

  public emitBulletImpact(pos: THREE.Vector3, normal: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const spread = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * 1.5,
        normal.y + (Math.random() - 0.5) * 1.5,
        normal.z + (Math.random() - 0.5) * 1.5
      ).normalize().multiplyScalar(4 + Math.random() * 5);

      this.particles.push({
        position: pos.clone(),
        velocity: spread,
        color: new THREE.Color(0xfbbf24),
        size: 0.35 + Math.random() * 0.2,
        maxLife: 0.25,
        life: 0.25,
        type: 'spark',
        growth: -0.5,
      });
    }
  }

  public update(dt: number) {
    let pCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.position.addScaledVector(p.velocity, dt);
      if (p.type === 'flame' || p.type === 'spark') {
        p.velocity.y -= 9.8 * dt * 0.5; // gravity
      } else if (p.type === 'smoke' || p.type === 'gas') {
        p.velocity.y += 1.5 * dt; // gentle rise
        p.velocity.multiplyScalar(0.96); // drag
      }

      p.size = Math.max(0.05, p.size + p.growth * dt);

      // Write to buffer
      if (pCount < this.maxParticles) {
        const idx = pCount * 3;
        this.positions[idx] = p.position.x;
        this.positions[idx + 1] = p.position.y;
        this.positions[idx + 2] = p.position.z;

        const lifeRatio = p.life / p.maxLife;
        this.colors[idx] = p.color.r * lifeRatio;
        this.colors[idx + 1] = p.color.g * lifeRatio;
        this.colors[idx + 2] = p.color.b * lifeRatio;

        this.sizes[pCount] = p.size;
        pCount++;
      }
    }

    // Zero out unused slots
    for (let i = pCount; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
    }

    this.pointGeometry.attributes.position.needsUpdate = true;
    this.pointGeometry.attributes.color.needsUpdate = true;
    this.pointGeometry.attributes.size.needsUpdate = true;
  }

  public dispose() {
    this.pointGeometry.dispose();
    this.pointMaterial.dispose();
  }
}
