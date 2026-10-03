/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerLoadout } from '../types/game';
import { createSoldier3D, SoldierMeshRef } from '../game/soldierModel';
import { sound } from '../game/audio';
import { 
  Play, 
  Users, 
  Crosshair, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Shield 
} from 'lucide-react';

interface Props {
  loadout: PlayerLoadout;
  onQuickPlay: () => void;
  onOpenRoomBrowser: () => void;
  onOpenLoadout: () => void;
  onOpenTextures: () => void;
}

export const MainMenu: React.FC<Props> = ({
  loadout,
  onQuickPlay,
  onOpenRoomBrowser,
  onOpenLoadout,
  onOpenTextures,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);

  // 3D Soldier spinning preview
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.8, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(ambientLight, dirLight);

    // Mini Militia Soldier
    const soldierMesh: SoldierMeshRef = createSoldier3D(loadout, 'ffa', false);
    soldierMesh.group.position.set(0, -0.6, 0);
    scene.add(soldierMesh.group);

    // Subtle jetpack flame idle idle pulsation
    soldierMesh.setJetpackActive(true);

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      soldierMesh.group.rotation.y += 0.8 * dt;
      // Idle float bobbing
      soldierMesh.group.position.y = -0.6 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      soldierMesh.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [loadout]);

  const toggleSound = () => {
    if (isMuted) {
      sound.setVolume(0.7);
      setIsMuted(false);
    } else {
      sound.setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 overflow-hidden bg-radial from-neutral-900 via-neutral-950 to-black select-none">
      {/* Background Military Grid Accent */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              First-Person Shooter (FPS)
            </span>
            <span className="text-xs text-neutral-400 font-mono">v1.2.0</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-['Chakra_Petch'] uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 drop-shadow-lg">
            Mini Militia 3D: FPS
          </h1>
          <p className="text-xs text-neutral-400 font-semibold tracking-wide">
            FIRST-PERSON COMBAT · ROCKET JETPACK FLIGHT · CUSTOM LOADOUTS
          </p>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          className="p-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      {/* Center Display: 3D Character Model + Main Action Buttons */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        {/* Left: Action Navigation Menu */}
        <div className="lg:col-span-6 space-y-3.5 max-w-md">
          {/* Quick Play CTA */}
          <button
            onClick={onQuickPlay}
            className="w-full group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black p-4 rounded-xl font-black font-['Chakra_Petch'] text-lg uppercase tracking-wider flex items-center justify-between shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/20 rounded-lg text-black">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Quick Play</div>
                <div className="text-[11px] font-medium text-neutral-900 opacity-80">Instant match with bots & humans</div>
              </div>
            </div>
            <span className="text-xs font-bold bg-black/25 px-2.5 py-1 rounded-md">DEPLOY NOW</span>
          </button>

          {/* War Rooms Browser */}
          <button
            onClick={onOpenRoomBrowser}
            className="w-full bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-700/80 hover:border-blue-500/80 text-white p-3.5 rounded-xl font-bold font-['Chakra_Petch'] uppercase tracking-wider flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-950/80 border border-blue-500/40 rounded-lg text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm">Multiplayer War Rooms</div>
                <div className="text-[11px] text-neutral-400 font-normal">Browse lobbies & host custom match</div>
              </div>
            </div>
            <span className="text-xs text-blue-400 font-mono">ROOMS &gt;</span>
          </button>

          {/* Custom Loadouts */}
          <button
            onClick={onOpenLoadout}
            className="w-full bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-700/80 hover:border-amber-500/80 text-white p-3.5 rounded-xl font-bold font-['Chakra_Petch'] uppercase tracking-wider flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-950/80 border border-amber-500/40 rounded-lg text-amber-400">
                <Crosshair className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm">Armory & Custom Loadouts</div>
                <div className="text-[11px] text-neutral-400 font-normal">Guns, jetpack perks, helmets, camo</div>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-mono">ARMORY &gt;</span>
          </button>

          {/* Textures & Graphics Customizer */}
          <button
            onClick={onOpenTextures}
            className="w-full bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-700/80 hover:border-emerald-500/80 text-white p-3.5 rounded-xl font-bold font-['Chakra_Petch'] uppercase tracking-wider flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm">Textures & Graphics Engine</div>
                <div className="text-[11px] text-neutral-400 font-normal">Upload user graphics or customize texture slots</div>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-mono">TEXTURES &gt;</span>
          </button>
        </div>

        {/* Right: Live 3D Spinning Soldier Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-sm h-80 bg-neutral-950/70 border border-neutral-800/90 rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md overflow-hidden">
            {/* Spinning Three.js Canvas Mount */}
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Soldier Loadout Tags Badge */}
            <div className="absolute bottom-3 inset-x-3 bg-black/75 backdrop-blur-md py-2 px-3 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: loadout.trailColor }} />
                <span className="font-bold text-neutral-200 font-['Chakra_Petch'] uppercase">
                  {loadout.callsign}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 uppercase font-mono">
                <span>{loadout.primaryWeapon}</span>
                <span aria-hidden="true">·</span>
                <span>{loadout.camo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500 border-t border-neutral-900 pt-4">
        <div className="flex items-center gap-4">
          <span>Three.js Real-time Engine</span>
          <span aria-hidden="true">·</span>
          <span>WebSockets Synchronized Multiplayer</span>
          <span aria-hidden="true">·</span>
          <span>AI Militia Bot Warfare</span>
        </div>
        <div>
          <span>Controls: <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-300">WASD</kbd> Move/Strafe · <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-300">SPACE</kbd> Jetpack · <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-300">MOUSE</kbd> Look/Shoot · <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-300">RMB</kbd> ADS</span>
        </div>
      </div>
    </div>
  );
};
