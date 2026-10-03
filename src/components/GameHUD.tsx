/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  WeaponType, 
  GrenadeType, 
  KillFeedEntry, 
  PlayerLoadout 
} from '../types/game';
import { TargetEnemyInfo } from '../game/engine';
import { WEAPON_DEFINITIONS } from '../game/weapons';
import { 
  Flame, 
  ShieldAlert, 
  RotateCcw, 
  Bomb, 
  Wifi, 
  LogOut,
  MousePointer,
  Crosshair,
  Sliders,
  Pause
} from 'lucide-react';

interface Props {
  loadout: PlayerLoadout;
  health: number;
  maxHealth: number;
  nitro: number;
  maxNitro: number;
  activeWeaponIndex: 0 | 1;
  activeWeapon: WeaponType;
  secondaryWeapon: WeaponType;
  magAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  grenadeCount: number;
  grenadeType: GrenadeType;
  killFeed: KillFeedEntry[];
  showHitmarker: boolean;
  timeRemaining: number;
  scores: { red: number; blue: number };
  mode: 'ffa' | 'tdm';
  ping: number;
  isDead: boolean;
  deathInfo: { killer: string; weapon: string } | null;
  isPointerLocked: boolean;
  isADS: boolean;
  isSniperADS: boolean;
  targetEnemy: TargetEnemyInfo | null;
  waveNotice: string | null;
  onRequestPointerLock: () => void;
  onSwitchWeapon: () => void;
  onReload: () => void;
  onThrowGrenade: () => void;
  onLeaveRoom: () => void;
  onPause?: () => void;
}

export const GameHUD: React.FC<Props> = ({
  loadout,
  health,
  maxHealth,
  nitro,
  maxNitro,
  activeWeapon,
  secondaryWeapon,
  magAmmo,
  reserveAmmo,
  isReloading,
  grenadeCount,
  grenadeType,
  killFeed,
  showHitmarker,
  timeRemaining,
  scores,
  mode,
  ping,
  isDead,
  deathInfo,
  isPointerLocked,
  isADS,
  isSniperADS,
  targetEnemy,
  waveNotice,
  onRequestPointerLock,
  onSwitchWeapon,
  onReload,
  onThrowGrenade,
  onLeaveRoom,
  onPause,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const nitroPercent = Math.max(0, Math.min(100, (nitro / maxNitro) * 100));
  const activeDef = WEAPON_DEFINITIONS[activeWeapon];
  const secondaryDef = WEAPON_DEFINITIONS[secondaryWeapon];

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 md:p-6 font-['Rajdhani']">
      {/* Damage Vignette */}
      {health < maxHealth * 0.35 && (
        <div className="absolute inset-0 border-8 border-rose-600/35 pointer-events-none animate-pulse" />
      )}

      {/* Sniper Scope Overlay (when aiming down sights with Barrett .50 Cal) */}
      {isSniperADS && (
        <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
          {/* Black Vignette Mask with Circular Scope Window */}
          <div 
            className="w-full h-full relative flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at center, transparent 38%, rgba(0, 0, 0, 0.96) 48%, black 100%)',
            }}
          >
            {/* Scope Outer Ring */}
            <div className="w-[500px] h-[500px] rounded-full border-2 border-emerald-500/40 relative flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              {/* Center Crosshair Lines */}
              <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-emerald-400/80 -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-emerald-400/80 -translate-x-1/2" />

              {/* Mil-dot Range Ticks */}
              <div className="absolute top-[35%] left-1/2 w-4 h-[1px] bg-emerald-400 -translate-x-1/2" />
              <div className="absolute top-[42%] left-1/2 w-6 h-[1px] bg-emerald-400 -translate-x-1/2" />
              <div className="absolute top-[58%] left-1/2 w-6 h-[1px] bg-emerald-400 -translate-x-1/2" />
              <div className="absolute top-[65%] left-1/2 w-4 h-[1px] bg-emerald-400 -translate-x-1/2" />

              {/* Center Precision Red Aim Point */}
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />

              {/* Scope Tactical HUD Labels */}
              <div className="absolute top-8 text-[11px] font-mono text-emerald-400 tracking-widest uppercase">
                OPTIC 8X · 50 CAL AP
              </div>
              <div className="absolute bottom-8 text-[11px] font-mono text-emerald-400 tracking-widest">
                ELEVATION: 0.0 · WIND: 0.2R
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar: Player Stats (Left), Match Info (Center), Weapons & Settings (Right) */}
      <div className="flex items-start justify-between w-full relative z-20 gap-2">
        {/* Top-Left: Mini Militia Health & Nitro Bars */}
        <div className="flex items-center gap-2 sm:gap-3 bg-neutral-950/85 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-neutral-800 pointer-events-auto shadow-xl shrink-0">
          {/* Soldier Avatar Icon (Desktop / Tablet) */}
          <div className="hidden sm:flex w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-neutral-900 border-2 border-amber-500/80 flex-col items-center justify-center p-1 relative overflow-hidden shrink-0">
            <span className="text-[10px] font-bold uppercase text-amber-400 font-['Chakra_Petch'] leading-tight text-center">
              {loadout.headgear.replace('_', ' ')}
            </span>
            <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: loadout.trailColor }} />
          </div>

          {/* Vitals Bars */}
          <div className="space-y-1 sm:space-y-1.5 min-w-[110px] sm:min-w-[160px] md:min-w-[190px]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold leading-none">
              <span className="text-white font-['Chakra_Petch'] uppercase tracking-wider truncate max-w-[85px] sm:max-w-none">
                {loadout.callsign}
              </span>
              <span className={health < 30 ? 'text-rose-400 animate-pulse font-mono' : 'text-emerald-400 font-mono'}>
                {Math.round(health)} HP
              </span>
            </div>

            {/* Health Bar (Red/Green) */}
            <div className="w-full h-2.5 sm:h-3.5 bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800 p-0.5">
              <div
                className={`h-full rounded-xs transition-all duration-150 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            {/* Nitro Boost Bar (Cyan) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
              <div className="w-full h-2 sm:h-2.5 bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800 p-0.5">
                <div
                  className="h-full bg-cyan-400 rounded-xs shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-75"
                  style={{ width: `${nitroPercent}%` }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 font-mono">
                {Math.round(nitroPercent)}%
              </span>
            </div>
          </div>
        </div>

        {/* Top-Center: Match Score & Time */}
        <div className="flex flex-col items-center bg-neutral-950/85 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl border border-neutral-800 pointer-events-auto shadow-xl shrink-0">
          <div className="text-xs sm:text-sm font-mono font-bold text-neutral-300">
            {timeStr}
          </div>
          <div className="hidden md:flex text-xs font-bold font-['Chakra_Petch'] text-rose-400 uppercase tracking-wider items-center gap-1.5 my-0.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>SOLO FIGHTER · 1v1 COMBAT</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-neutral-400 font-mono mt-0.5">
            <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
            <span>{ping}ms</span>
          </div>
        </div>

        {/* Top-Right: Weapons HUD & Action Controls */}
        <div className="flex items-start gap-1.5 sm:gap-3 pointer-events-auto shrink-0">
          {/* Weapon Status Panel */}
          <div className="bg-neutral-950/85 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-neutral-800 shadow-xl flex items-center gap-2 sm:gap-4">
            {/* Active Gun Info */}
            <div className="text-right">
              <div className="text-[10px] sm:text-xs font-bold text-amber-400 font-['Chakra_Petch'] uppercase tracking-wider truncate max-w-[80px] sm:max-w-none">
                {activeDef.name}
              </div>
              <div className="text-lg sm:text-2xl font-black font-['Chakra_Petch'] tracking-tight text-white leading-tight">
                {magAmmo} <span className="text-[10px] sm:text-xs font-semibold text-neutral-400">/ {reserveAmmo}</span>
              </div>
              {isReloading && (
                <div className="text-[9px] sm:text-[10px] text-amber-400 font-bold uppercase tracking-wider animate-pulse flex items-center justify-end gap-1">
                  <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  <span>Reloading...</span>
                </div>
              )}
            </div>

            {/* Quick Swap & Grenade Slots (Desktop / Tablet) */}
            <div className="hidden sm:flex flex-col gap-1.5 border-l border-neutral-800 pl-3">
              <button
                onClick={onSwitchWeapon}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-[11px] font-bold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
                title="Swap Weapon (Q)"
              >
                <span>[Q]</span>
                <span className="text-[10px] text-amber-400 font-['Chakra_Petch']">{secondaryDef.name}</span>
              </button>

              <button
                onClick={onThrowGrenade}
                disabled={grenadeCount <= 0}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-700 rounded text-[11px] font-bold text-neutral-300 hover:text-white transition-colors flex items-center justify-between gap-2"
                title="Throw Grenade (G)"
              >
                <div className="flex items-center gap-1">
                  <Bomb className="w-3 h-3 text-emerald-400" />
                  <span className="capitalize">{grenadeType}</span>
                </div>
                <span className="text-amber-400 font-bold">{grenadeCount}</span>
              </button>
            </div>
          </div>

          {/* Pause / Menu Button */}
          {onPause && (
            <button
              onClick={onPause}
              className="p-2 sm:p-3 bg-neutral-950/85 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/60 rounded-xl text-neutral-400 hover:text-amber-400 transition-colors shadow-xl"
              title="Pause Game & Menu (ESC)"
            >
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Leave Room Button */}
          <button
            onClick={onLeaveRoom}
            className="p-2 sm:p-3 bg-neutral-950/85 hover:bg-rose-950 border border-neutral-800 hover:border-rose-700 rounded-xl text-neutral-400 hover:text-rose-400 transition-colors shadow-xl"
            title="Leave Match"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 1v1 Hostile Combat: Breather Countdown Banner (Enemies arrive one after the other) */}
      {waveNotice && (
        <div className="fixed top-16 sm:top-20 md:top-24 left-1/2 -translate-x-1/2 z-30 max-w-[92vw] bg-amber-950/95 border border-amber-500/80 px-4 sm:px-6 py-2 rounded-xl text-center shadow-2xl backdrop-blur-md pointer-events-none animate-pulse">
          <div className="text-[11px] sm:text-xs font-black font-['Chakra_Petch'] uppercase text-amber-300 tracking-wider flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">{waveNotice}</span>
          </div>
        </div>
      )}

      {/* 1v1 Hostile Target Status Badge */}
      {targetEnemy && !waveNotice && (
        <div className="fixed top-16 sm:top-20 md:top-24 left-1/2 -translate-x-1/2 z-30 max-w-[92vw] flex items-center gap-2 sm:gap-3 bg-neutral-950/95 border border-rose-500/70 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
          <div className="text-left min-w-[90px] sm:min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider font-['Chakra_Petch'] leading-none">
              <span>{targetEnemy.name}</span>
              <span className="text-neutral-400 font-mono text-[9px] sm:text-[10px]">[{targetEnemy.weapon.toUpperCase()}]</span>
            </div>
            <div className="w-28 sm:w-36 h-1.5 sm:h-2 bg-neutral-900 rounded-full mt-1.5 overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-rose-500 transition-all duration-150 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (targetEnemy.health / targetEnemy.maxHealth) * 100))}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-bold text-rose-400 ml-1 shrink-0">
            {Math.round(targetEnemy.health)} HP
          </span>
        </div>
      )}

      {/* Top-Right Kill Feed */}
      <div className="self-end max-w-xs space-y-1.5 pointer-events-none mt-2 relative z-20">
        {killFeed.slice(-4).map((k) => (
          <div
            key={k.id}
            className="bg-black/75 backdrop-blur-xs px-3 py-1 rounded border border-white/5 text-xs flex items-center gap-2 animate-in fade-in duration-150"
          >
            <span className={`font-bold font-['Chakra_Petch'] ${k.killerTeam === 'red' ? 'text-rose-400' : k.killerTeam === 'blue' ? 'text-blue-400' : 'text-amber-400'}`}>
              {k.killerName}
            </span>
            <span className="text-neutral-500 text-[10px]">[{k.weapon.toUpperCase()}]</span>
            <span className={`font-bold font-['Chakra_Petch'] ${k.victimTeam === 'red' ? 'text-rose-400' : k.victimTeam === 'blue' ? 'text-blue-400' : 'text-neutral-300'}`}>
              {k.victimName}
            </span>
          </div>
        ))}
      </div>

      {/* Center Screen: First-Person Reticle (Hipfire Crosshair vs Iron Sight Precision Dot) */}
      {!isSniperADS && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-15">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Center Precision Aim Dot (Red in Hipfire, Green in ADS) */}
            <div className={`rounded-full transition-all duration-100 ${
              isADS 
                ? 'w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_8px_#10b981]' 
                : 'w-1.5 h-1.5 bg-rose-500 shadow-[0_0_4px_#ef4444]'
            }`} />
            
            {/* 4 Hipfire Crosshair Brackets (Fade out during ADS for clean iron sight view) */}
            {!isADS && (
              <>
                <div className="absolute top-0 w-[2px] h-2.5 bg-white/75" />
                <div className="absolute bottom-0 w-[2px] h-2.5 bg-white/75" />
                <div className="absolute left-0 h-[2px] w-2.5 bg-white/75" />
                <div className="absolute right-0 h-[2px] w-2.5 bg-white/75" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Center Screen: Dynamic Hitmarker Pulse */}
      {showHitmarker && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30 animate-out fade-out duration-100">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-t-2 border-r-2 border-rose-400 rotate-45 shadow-[0_0_8px_#ef4444]" />
            <div className="absolute inset-0 border-b-2 border-l-2 border-rose-400 rotate-45 shadow-[0_0_8px_#ef4444]" />
          </div>
        </div>
      )}

      {/* Non-intrusive Pointer Lock Prompt (Desktop only) */}
      {!isPointerLocked && !isDead && (
        <div 
          onClick={onRequestPointerLock}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30 bg-neutral-950/90 border border-amber-500/70 px-5 py-2.5 rounded-full text-center shadow-2xl pointer-events-auto cursor-pointer hidden md:flex items-center gap-3 animate-bounce"
        >
          <MousePointer className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold font-['Chakra_Petch'] uppercase text-white tracking-wide">
            Click screen to lock aim & look around
          </span>
          <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
            [ESC to release]
          </span>
        </div>
      )}

      {/* Eliminated Death Screen */}
      {isDead && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md z-50 pointer-events-auto p-4 animate-in fade-in">
          <div className="bg-neutral-950 border border-rose-500/50 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500 flex items-center justify-center mx-auto text-rose-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-['Chakra_Petch'] uppercase tracking-wider text-rose-500">
                Trooper Down!
              </h2>
              {deathInfo && (
                <p className="text-xs text-neutral-300 mt-1">
                  Eliminated by <span className="text-amber-400 font-bold">{deathInfo.killer}</span> with{' '}
                  <span className="text-white font-mono uppercase">{deathInfo.weapon}</span>
                </p>
              )}
            </div>
            <div className="text-xs font-mono text-neutral-400 animate-pulse">
              Re-deploying into combat sector in 3 seconds...
            </div>
          </div>
        </div>
      )}

      {/* Bottom Center: Tactical FPS Controls Guide */}
      <div className="self-center hidden md:flex items-center gap-4 bg-neutral-950/80 backdrop-blur-xs px-5 py-2 rounded-full border border-neutral-800 text-[11px] text-neutral-400 pointer-events-auto shadow-xl relative z-20">
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">WASD</kbd> Move / Strafe</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">SPACE</kbd> Jetpack Boost</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">L-CLICK</kbd> Shoot / Fire</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-amber-400 font-mono text-[10px]">T</kbd> or <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-amber-400 font-mono text-[10px]">R-CLICK</kbd> Aim (Iron Sights)</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">R</kbd> Reload</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">Q</kbd> Swap</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">G</kbd> Grenade</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">F</kbd> Melee</span>
        <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono text-[10px]">TAB</kbd> Scores</span>
      </div>
    </div>
  );
};
